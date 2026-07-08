// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IERC20.sol";

contract KwestCore {
    IERC20 public usdc;
    address public feeRecipient;

    uint256 public constant PLATFORM_FEE_BPS = 200; // 2%
    uint256 public constant MIN_REWARD_PER_USER = 1e6; // 1 USDC (6 decimals)

    enum TaskStatus { Active, Completed, Cancelled }
    enum SubmissionStatus { Pending, Approved, Rejected }

    struct Task {
        address creator;
        string title;
        string description;
        uint8 proofType; // 0=Text, 1=Link, 2=IPFS
        string requirements;
        uint256 rewardPool;
        uint256 rewardPerUser;
        uint256 totalSlots;
        uint256 filledSlots;
        uint256 approvedCount;
        uint256 claimedCount;
        uint256 platformFee;
        TaskStatus status;
        uint256 deadline;
    }

    struct Submission {
        address submitter;
        uint256 taskId;
        string proofData;
        SubmissionStatus status;
        bool claimed;
        uint256 submittedAt;
    }

    uint256 public nextTaskId;
    mapping(uint256 => Task) public tasks;
    mapping(bytes32 => Submission) public submissions;
    mapping(uint256 => bytes32[]) public taskSubmissions;
    mapping(uint256 => mapping(address => bytes32)) public userSubmissions;

    event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 rewardPool, uint256 totalSlots, uint256 platformFee);
    event ProofSubmitted(uint256 indexed taskId, bytes32 indexed submissionId, address indexed submitter);
    event SubmissionApproved(uint256 indexed taskId, bytes32 indexed submissionId);
    event SubmissionRejected(uint256 indexed taskId, bytes32 indexed submissionId);
    event RewardClaimed(uint256 indexed taskId, bytes32 indexed submissionId, address indexed submitter, uint256 amount);

    constructor(address _usdc, address _feeRecipient) {
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
    }

    function createTask(
        string calldata title,
        string calldata description,
        uint8 proofType,
        string calldata requirements,
        uint256 rewardPool,
        uint256 totalSlots,
        uint256 deadline
    ) external returns (uint256) {
        require(totalSlots > 0, "Need at least 1 slot");
        require(deadline > block.timestamp, "Deadline must be in the future");
        uint256 rewardPerUser = rewardPool / totalSlots;
        require(rewardPerUser >= MIN_REWARD_PER_USER, "Min 1 USDC per participant");

        uint256 platformFee = (rewardPool * PLATFORM_FEE_BPS) / 10000;
        uint256 totalRequired = rewardPool + platformFee;

        require(usdc.transferFrom(msg.sender, address(this), totalRequired), "USDC transfer failed");
        if (platformFee > 0) {
            require(usdc.transfer(feeRecipient, platformFee), "Fee transfer failed");
        }

        uint256 taskId = nextTaskId++;
        tasks[taskId] = Task({
            creator: msg.sender,
            title: title,
            description: description,
            proofType: proofType,
            requirements: requirements,
            rewardPool: rewardPool,
            rewardPerUser: rewardPerUser,
            totalSlots: totalSlots,
            filledSlots: 0,
            approvedCount: 0,
            claimedCount: 0,
            platformFee: platformFee,
            status: TaskStatus.Active,
            deadline: deadline
        });

        emit TaskCreated(taskId, msg.sender, rewardPool, totalSlots, platformFee);
        return taskId;
    }

    function submitProof(uint256 taskId, string calldata proofData) external returns (bytes32) {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Active, "Task not active");
        require(block.timestamp <= task.deadline, "Deadline passed");
        require(task.filledSlots < task.totalSlots, "No slots left");
        require(msg.sender != task.creator, "Creator cannot submit");
        require(userSubmissions[taskId][msg.sender] == bytes32(0), "Already submitted");

        bytes32 submissionId = keccak256(abi.encodePacked(taskId, msg.sender, block.timestamp));
        submissions[submissionId] = Submission({
            submitter: msg.sender,
            taskId: taskId,
            proofData: proofData,
            status: SubmissionStatus.Pending,
            claimed: false,
            submittedAt: block.timestamp
        });

        taskSubmissions[taskId].push(submissionId);
        userSubmissions[taskId][msg.sender] = submissionId;
        task.filledSlots++;

        emit ProofSubmitted(taskId, submissionId, msg.sender);
        return submissionId;
    }

    function approveSubmission(bytes32 submissionId) external {
        Submission storage sub = submissions[submissionId];
        Task storage task = tasks[sub.taskId];
        require(msg.sender == task.creator, "Only creator can approve");
        require(sub.status == SubmissionStatus.Pending, "Not pending");

        sub.status = SubmissionStatus.Approved;
        task.approvedCount++;

        emit SubmissionApproved(sub.taskId, submissionId);
    }

    function rejectSubmission(bytes32 submissionId) external {
        Submission storage sub = submissions[submissionId];
        Task storage task = tasks[sub.taskId];
        require(msg.sender == task.creator, "Only creator can reject");
        require(sub.status == SubmissionStatus.Pending, "Not pending");

        sub.status = SubmissionStatus.Rejected;

        emit SubmissionRejected(sub.taskId, submissionId);
    }

    function claimReward(bytes32 submissionId) external {
        Submission storage sub = submissions[submissionId];
        require(msg.sender == sub.submitter, "Not submitter");
        require(sub.status == SubmissionStatus.Approved, "Not approved");
        require(!sub.claimed, "Already claimed");

        Task storage task = tasks[sub.taskId];
        sub.claimed = true;
        task.claimedCount++;

        require(usdc.transfer(msg.sender, task.rewardPerUser), "USDC transfer failed");

        emit RewardClaimed(sub.taskId, submissionId, msg.sender, task.rewardPerUser);
    }

    function cancelTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(msg.sender == task.creator, "Only creator");
        require(task.status == TaskStatus.Active, "Not active");

        task.status = TaskStatus.Cancelled;
        uint256 refund = task.rewardPool - (task.claimedCount * task.rewardPerUser);
        if (refund > 0) {
            require(usdc.transfer(msg.sender, refund), "Refund failed");
        }
    }

    function refundRemaining(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(msg.sender == task.creator, "Only creator");
        require(block.timestamp > task.deadline, "Deadline not passed");

        uint256 refund = task.rewardPool - (task.approvedCount * task.rewardPerUser);
        if (refund > 0) {
            task.rewardPool = task.approvedCount * task.rewardPerUser;
            require(usdc.transfer(msg.sender, refund), "Refund failed");
        }
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    function getSubmission(bytes32 submissionId) external view returns (Submission memory) {
        return submissions[submissionId];
    }

    function getTaskSubmissions(uint256 taskId) external view returns (bytes32[] memory) {
        return taskSubmissions[taskId];
    }

    function getTaskSubmissionCount(uint256 taskId) external view returns (uint256) {
        return taskSubmissions[taskId].length;
    }
}
