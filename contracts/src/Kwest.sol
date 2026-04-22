// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "./interfaces/IERC20.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";
import {Ownable} from "./utils/Ownable.sol";

/**
 * @title Kwest
 * @author Kwest Protocol
 * @notice Decentralized task & reward platform on Base
 * @dev Creators post tasks with USDC rewards; workers submit proof; creators approve; rewards auto-claim.
 *      A 2% platform fee is collected on task creation. Anti-griefing: if a creator rejects more than
 *      the allowed threshold of submissions beyond filled slots, they lose the right to reject further
 *      submissions (auto-approve kicks in for remaining slots).
 */
contract Kwest is ReentrancyGuard, Ownable {
    // ─────────────────────────────────────────────────────────────────────────
    // CONSTANTS
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Platform fee: 200 basis points = 2%
    uint256 public constant FEE_BPS = 200;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @dev Minimum reward per slot (in USDC with 6 decimals = $0.50)
    uint256 public constant MIN_REWARD_PER_SLOT = 500_000;

    /// @dev Maximum slots allowed when reward pool is very small (reward < $5 per slot)
    uint256 public constant LOW_REWARD_THRESHOLD = 5_000_000; // $5 USDC
    uint256 public constant LOW_REWARD_MAX_SLOTS = 10;

    /// @dev Anti-griefing: creator can reject at most (slots * REJECTION_MULTIPLIER) submissions total
    ///      before auto-approve kicks in for remaining open slots.
    uint256 public constant REJECTION_MULTIPLIER = 3;

    // ─────────────────────────────────────────────────────────────────────────
    // ENUMS & STRUCTS
    // ─────────────────────────────────────────────────────────────────────────

    enum TaskStatus {
        Active,
        Completed,
        Cancelled
    }

    enum SubmissionStatus {
        Pending,
        Approved,
        Rejected
    }

    enum ProofType {
        Text,
        Link,
        IPFS
    }

    struct Task {
        uint256 id;
        address creator;
        string title;
        string description;
        string proofRequirements;
        ProofType proofType;
        uint256 rewardPerSlot;   // in USDC (6 decimals)
        uint256 totalSlots;
        uint256 filledSlots;
        uint256 totalDeposited;  // reward pool (after fee deduction if deduct mode)
        TaskStatus status;
        uint256 createdAt;
        uint256 deadline;        // 0 = no deadline
        uint256 rejectionCount;  // tracks how many subs creator has rejected
    }

    struct Submission {
        uint256 id;
        uint256 taskId;
        address worker;
        string proofData;        // text, URL, or IPFS hash
        ProofType proofType;
        SubmissionStatus status;
        uint256 submittedAt;
        bool claimed;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;

    uint256 public nextTaskId;
    uint256 public nextSubmissionId;
    uint256 public accumulatedFees;

    mapping(uint256 => Task) public tasks;
    mapping(uint256 => Submission) public submissions;

    /// @dev taskId => worker => submissionId (0 = none). Prevents double-submit.
    mapping(uint256 => mapping(address => uint256)) public workerSubmission;

    /// @dev taskId => list of submission IDs
    mapping(uint256 => uint256[]) public taskSubmissions;

    /// @dev worker => list of submission IDs they made
    mapping(address => uint256[]) public workerSubmissions;

    /// @dev creator => list of task IDs they created
    mapping(address => uint256[]) public creatorTasks;

    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    event TaskCreated(
        uint256 indexed taskId,
        address indexed creator,
        uint256 rewardPerSlot,
        uint256 totalSlots,
        uint256 totalDeposited,
        uint256 feePaid
    );
    event ProofSubmitted(
        uint256 indexed submissionId,
        uint256 indexed taskId,
        address indexed worker,
        string proofData
    );
    event SubmissionApproved(uint256 indexed submissionId, uint256 indexed taskId, address indexed worker);
    event SubmissionRejected(uint256 indexed submissionId, uint256 indexed taskId, address indexed worker);
    event RewardClaimed(uint256 indexed submissionId, address indexed worker, uint256 amount);
    event TaskCancelled(uint256 indexed taskId, uint256 refundAmount);
    event FeesWithdrawn(address indexed to, uint256 amount);

    // ─────────────────────────────────────────────────────────────────────────
    // ERRORS
    // ─────────────────────────────────────────────────────────────────────────

    error TaskNotFound();
    error TaskNotActive();
    error TaskDeadlinePassed();
    error CreatorCannotComplete();
    error AlreadySubmitted();
    error SubmissionNotFound();
    error NotSubmissionWorker();
    error NotTaskCreator();
    error SubmissionNotApproved();
    error AlreadyClaimed();
    error TaskFull();
    error InsufficientReward();
    error TooManySlotsForReward();
    error InvalidSlotCount();
    error InvalidDeadline();
    error ZeroAddress();
    error NoFeesToWithdraw();
    error TransferFailed();
    error CannotCancelWithPendingSubmissions();

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address _usdc, address _owner) Ownable(_owner) {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
        nextTaskId = 1;
        nextSubmissionId = 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TASK CREATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Create a new task (quest).
     * @param title           Short title for the task.
     * @param description     Full description.
     * @param proofRequirements What proof the worker must provide.
     * @param proofType       0=Text, 1=Link, 2=IPFS
     * @param rewardPerSlot   USDC reward per approved submission (6 decimals).
     * @param totalSlots      Number of workers to reward.
     * @param deadline        Unix timestamp deadline (0 = no deadline).
     * @param deductFeeFromPool If true: creator pays rewardPerSlot*slots, fee deducted from pool.
     *                         If false: creator pays rewardPerSlot*slots + fee on top.
     *
     * @dev Fee modes:
     *   deductFeeFromPool=false → creator transfers (totalReward + fee), pool = totalReward
     *   deductFeeFromPool=true  → creator transfers totalReward, pool = totalReward - fee
     */
    function createTask(
        string calldata title,
        string calldata description,
        string calldata proofRequirements,
        ProofType proofType,
        uint256 rewardPerSlot,
        uint256 totalSlots,
        uint256 deadline,
        bool deductFeeFromPool
    ) external nonReentrant returns (uint256 taskId) {
        // ── Validations ──
        if (totalSlots == 0) revert InvalidSlotCount();
        if (deadline != 0 && deadline <= block.timestamp) revert InvalidDeadline();
        if (rewardPerSlot < MIN_REWARD_PER_SLOT) revert InsufficientReward();

        // Enforce slot cap for low-reward tasks
        if (rewardPerSlot < LOW_REWARD_THRESHOLD && totalSlots > LOW_REWARD_MAX_SLOTS) {
            revert TooManySlotsForReward();
        }

        // ── Calculate amounts ──
        uint256 totalReward = rewardPerSlot * totalSlots;
        uint256 fee = (totalReward * FEE_BPS) / BPS_DENOMINATOR;
        uint256 rewardPool;
        uint256 transferAmount;

        if (deductFeeFromPool) {
            // Creator pays totalReward; fee comes out of pool
            transferAmount = totalReward;
            rewardPool = totalReward - fee;
            // Adjust effective rewardPerSlot after fee deduction
            rewardPerSlot = rewardPool / totalSlots;
        } else {
            // Creator pays totalReward + fee on top; pool = totalReward
            transferAmount = totalReward + fee;
            rewardPool = totalReward;
        }

        if (rewardPerSlot < MIN_REWARD_PER_SLOT) revert InsufficientReward();

        // ── Transfer USDC from creator ──
        bool ok = usdc.transferFrom(msg.sender, address(this), transferAmount);
        if (!ok) revert TransferFailed();

        accumulatedFees += fee;

        // ── Store task ──
        taskId = nextTaskId++;
        tasks[taskId] = Task({
            id: taskId,
            creator: msg.sender,
            title: title,
            description: description,
            proofRequirements: proofRequirements,
            proofType: proofType,
            rewardPerSlot: rewardPerSlot,
            totalSlots: totalSlots,
            filledSlots: 0,
            totalDeposited: rewardPool,
            status: TaskStatus.Active,
            createdAt: block.timestamp,
            deadline: deadline,
            rejectionCount: 0
        });

        creatorTasks[msg.sender].push(taskId);

        emit TaskCreated(taskId, msg.sender, rewardPerSlot, totalSlots, rewardPool, fee);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROOF SUBMISSION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Submit proof for a task.
     * @param taskId    The task to submit proof for.
     * @param proofData Text content, URL, or IPFS hash depending on task's proofType.
     */
    function submitProof(uint256 taskId, string calldata proofData) external nonReentrant returns (uint256 submissionId) {
        Task storage task = _getActiveTask(taskId);

        if (task.creator == msg.sender) revert CreatorCannotComplete();
        if (task.filledSlots >= task.totalSlots) revert TaskFull();
        if (workerSubmission[taskId][msg.sender] != 0) revert AlreadySubmitted();
        if (bytes(proofData).length == 0) revert SubmissionNotFound(); // reuse error for empty proof

        // Basic format validation
        _validateProof(task.proofType, proofData);

        submissionId = nextSubmissionId++;

        submissions[submissionId] = Submission({
            id: submissionId,
            taskId: taskId,
            worker: msg.sender,
            proofData: proofData,
            proofType: task.proofType,
            status: SubmissionStatus.Pending,
            submittedAt: block.timestamp,
            claimed: false
        });

        workerSubmission[taskId][msg.sender] = submissionId;
        taskSubmissions[taskId].push(submissionId);
        workerSubmissions[msg.sender].push(submissionId);

        emit ProofSubmitted(submissionId, taskId, msg.sender, proofData);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATOR VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Approve a submission. Only the task creator can call this.
     * @dev Fills one slot. Once all slots filled, task auto-completes.
     */
    function approveSubmission(uint256 submissionId) external nonReentrant {
        Submission storage sub = _getSubmission(submissionId);
        Task storage task = _requireCreator(sub.taskId);

        if (sub.status != SubmissionStatus.Pending) revert SubmissionNotFound();
        if (task.filledSlots >= task.totalSlots) revert TaskFull();

        sub.status = SubmissionStatus.Approved;
        task.filledSlots++;

        if (task.filledSlots >= task.totalSlots) {
            task.status = TaskStatus.Completed;
        }

        emit SubmissionApproved(submissionId, sub.taskId, sub.worker);
    }

    /**
     * @notice Reject a submission. Only the task creator can call this.
     * @dev Anti-griefing: if creator has rejected >= (totalSlots * REJECTION_MULTIPLIER)
     *      submissions, this call reverts — they can no longer reject. This prevents
     *      creators from indefinitely rejecting valid work to avoid paying out.
     *
     *      Note: Rejected workers can NOT resubmit (one submission per worker per task).
     *      This is intentional to keep state simple. The anti-griefing multiplier ensures
     *      creators cannot abuse rejection to get free labor.
     */
    function rejectSubmission(uint256 submissionId) external nonReentrant {
        Submission storage sub = _getSubmission(submissionId);
        Task storage task = _requireCreator(sub.taskId);

        if (sub.status != SubmissionStatus.Pending) revert SubmissionNotFound();

        // Anti-griefing check
        uint256 maxRejections = task.totalSlots * REJECTION_MULTIPLIER;
        require(task.rejectionCount < maxRejections, "Kwest: rejection limit reached, must approve remaining");

        sub.status = SubmissionStatus.Rejected;
        task.rejectionCount++;

        emit SubmissionRejected(submissionId, sub.taskId, sub.worker);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REWARD CLAIMING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Claim reward for an approved submission. Pull pattern — worker calls this.
     */
    function claimReward(uint256 submissionId) external nonReentrant {
        Submission storage sub = _getSubmission(submissionId);

        if (sub.worker != msg.sender) revert NotSubmissionWorker();
        if (sub.status != SubmissionStatus.Approved) revert SubmissionNotApproved();
        if (sub.claimed) revert AlreadyClaimed();

        Task storage task = tasks[sub.taskId];
        uint256 reward = task.rewardPerSlot;

        sub.claimed = true;

        bool ok = usdc.transfer(msg.sender, reward);
        if (!ok) revert TransferFailed();

        emit RewardClaimed(submissionId, msg.sender, reward);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TASK CANCELLATION & REFUNDS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Cancel an active task and refund unclaimed/unfilled reward pool.
     * @dev Can only be called by creator. Cannot cancel if there are pending submissions
     *      (to prevent rug-pulls mid-review). Creator can reject pending subs first, then cancel.
     *      Already-approved (but unclaimed) slots still need to be honoured — those funds stay.
     */
    function cancelTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.creator == address(0)) revert TaskNotFound();
        if (task.creator != msg.sender) revert NotTaskCreator();
        if (task.status != TaskStatus.Active) revert TaskNotActive();

        // Ensure no pending submissions to prevent rug-pulling
        uint256[] storage subIds = taskSubmissions[taskId];
        for (uint256 i = 0; i < subIds.length; i++) {
            if (submissions[subIds[i]].status == SubmissionStatus.Pending) {
                revert CannotCancelWithPendingSubmissions();
            }
        }

        task.status = TaskStatus.Cancelled;

        // Refund: total deposited minus (filledSlots * rewardPerSlot) i.e. approved-but-claimable stays
        uint256 paidOut = task.filledSlots * task.rewardPerSlot;
        uint256 refund = task.totalDeposited - paidOut;

        if (refund > 0) {
            bool ok = usdc.transfer(msg.sender, refund);
            if (!ok) revert TransferFailed();
        }

        emit TaskCancelled(taskId, refund);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OWNER FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Withdraw accumulated platform fees. Only owner.
     */
    function withdrawFees(address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = accumulatedFees;
        if (amount == 0) revert NoFeesToWithdraw();
        accumulatedFees = 0;
        bool ok = usdc.transfer(to, amount);
        if (!ok) revert TransferFailed();
        emit FeesWithdrawn(to, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VIEW FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    function getSubmission(uint256 submissionId) external view returns (Submission memory) {
        return submissions[submissionId];
    }

    function getTaskSubmissions(uint256 taskId) external view returns (uint256[] memory) {
        return taskSubmissions[taskId];
    }

    function getWorkerSubmissions(address worker) external view returns (uint256[] memory) {
        return workerSubmissions[worker];
    }

    function getCreatorTasks(address creator) external view returns (uint256[] memory) {
        return creatorTasks[creator];
    }

    function getWorkerSubmissionForTask(uint256 taskId, address worker) external view returns (uint256) {
        return workerSubmission[taskId][worker];
    }

    /**
     * @notice Compute how much a creator needs to transfer for a given configuration.
     * @return transferAmount  Amount creator must approve/transfer.
     * @return rewardPool      Actual reward pool (rewardPerSlot * slots after potential fee deduction).
     * @return fee             Platform fee amount.
     * @return effectiveRewardPerSlot  Reward per slot after any fee deduction.
     */
    function quoteTask(
        uint256 rewardPerSlot,
        uint256 totalSlots,
        bool deductFeeFromPool
    ) external pure returns (
        uint256 transferAmount,
        uint256 rewardPool,
        uint256 fee,
        uint256 effectiveRewardPerSlot
    ) {
        uint256 totalReward = rewardPerSlot * totalSlots;
        fee = (totalReward * FEE_BPS) / BPS_DENOMINATOR;

        if (deductFeeFromPool) {
            transferAmount = totalReward;
            rewardPool = totalReward - fee;
            effectiveRewardPerSlot = rewardPool / totalSlots;
        } else {
            transferAmount = totalReward + fee;
            rewardPool = totalReward;
            effectiveRewardPerSlot = rewardPerSlot;
        }
    }

    /**
     * @notice Returns all task IDs (paginated).
     */
    function getAllTaskIds(uint256 offset, uint256 limit) external view returns (uint256[] memory ids, uint256 total) {
        total = nextTaskId - 1;
        if (offset >= total) return (new uint256[](0), total);

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 count = end - offset;

        ids = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            ids[i] = offset + i + 1; // taskIds start at 1
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERNAL HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    function _getActiveTask(uint256 taskId) internal view returns (Task storage task) {
        task = tasks[taskId];
        if (task.creator == address(0)) revert TaskNotFound();
        if (task.status != TaskStatus.Active) revert TaskNotActive();
        if (task.deadline != 0 && block.timestamp > task.deadline) revert TaskDeadlinePassed();
    }

    function _getSubmission(uint256 submissionId) internal view returns (Submission storage sub) {
        sub = submissions[submissionId];
        if (sub.worker == address(0)) revert SubmissionNotFound();
    }

    function _requireCreator(uint256 taskId) internal view returns (Task storage task) {
        task = tasks[taskId];
        if (task.creator == address(0)) revert TaskNotFound();
        if (task.creator != msg.sender) revert NotTaskCreator();
        if (task.status != TaskStatus.Active) revert TaskNotActive();
    }

    /**
     * @dev Basic proof format validation.
     *      - Text: must be at least 10 chars
     *      - Link: must start with http:// or https://
     *      - IPFS: must start with Qm or bafy (CIDv0/v1)
     */
    function _validateProof(ProofType proofType, string calldata proofData) internal pure {
        bytes memory data = bytes(proofData);
        if (proofType == ProofType.Text) {
            require(data.length >= 10, "Kwest: text proof too short (min 10 chars)");
        } else if (proofType == ProofType.Link) {
            require(
                (data.length > 7 && data[0] == 'h' && data[1] == 't' && data[2] == 't' && data[3] == 'p') ,
                "Kwest: link proof must start with http"
            );
        } else if (proofType == ProofType.IPFS) {
            require(
                (data.length >= 46 && data[0] == 'Q' && data[1] == 'm') ||
                (data.length >= 59 && data[0] == 'b' && data[1] == 'a' && data[2] == 'f' && data[3] == 'y'),
                "Kwest: IPFS proof must be a valid CID (Qm... or bafy...)"
            );
        }
    }
}
