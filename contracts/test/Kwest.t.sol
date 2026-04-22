// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Kwest} from "../src/Kwest.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract KwestTest is Test {
    Kwest public kwest;
    MockUSDC public usdc;

    address owner   = makeAddr("owner");
    address creator = makeAddr("creator");
    address worker1 = makeAddr("worker1");
    address worker2 = makeAddr("worker2");
    address worker3 = makeAddr("worker3");

    uint256 constant REWARD = 10 * 1e6;  // $10 USDC
    uint256 constant SLOTS  = 3;

    function setUp() public {
        usdc  = new MockUSDC();
        kwest = new Kwest(address(usdc), owner);

        // Fund creator with 1000 USDC
        usdc.mint(creator, 1_000 * 1e6);
        vm.prank(creator);
        usdc.approve(address(kwest), type(uint256).max);
    }

    // ── Task Creation ──────────────────────────────────────────────────────

    function test_CreateTask_TopUp() public {
        // deductFeeFromPool=false → creator pays reward + fee
        uint256 totalReward = REWARD * SLOTS; // 30 USDC
        uint256 fee = (totalReward * 200) / 10_000; // 0.6 USDC

        uint256 beforeBalance = usdc.balanceOf(creator);

        vm.prank(creator);
        uint256 taskId = kwest.createTask(
            "Test Quest", "Do the thing", "Submit screenshot", Kwest.ProofType.IPFS,
            REWARD, SLOTS, 0, false
        );

        assertEq(usdc.balanceOf(creator), beforeBalance - totalReward - fee);
        assertEq(kwest.accumulatedFees(), fee);

        Kwest.Task memory task = kwest.getTask(taskId);
        assertEq(task.rewardPerSlot, REWARD);
        assertEq(task.totalSlots, SLOTS);
        assertEq(task.totalDeposited, totalReward);
        assertEq(uint256(task.status), uint256(Kwest.TaskStatus.Active));
    }

    function test_CreateTask_DeductFee() public {
        // deductFeeFromPool=true → fee comes out of pool
        uint256 totalReward = REWARD * SLOTS;
        uint256 fee = (totalReward * 200) / 10_000;

        uint256 beforeBalance = usdc.balanceOf(creator);

        vm.prank(creator);
        uint256 taskId = kwest.createTask(
            "Test Quest", "Do the thing", "Submit screenshot", Kwest.ProofType.IPFS,
            REWARD, SLOTS, 0, true
        );

        assertEq(usdc.balanceOf(creator), beforeBalance - totalReward);
        assertEq(kwest.accumulatedFees(), fee);

        Kwest.Task memory task = kwest.getTask(taskId);
        // Pool is reduced by fee
        assertEq(task.totalDeposited, totalReward - fee);
    }

    function test_RevertIf_CreatorCompletesTask() public {
        vm.prank(creator);
        uint256 taskId = kwest.createTask(
            "Test Quest", "Do the thing", "Submit link", Kwest.ProofType.Link,
            REWARD, SLOTS, 0, false
        );

        vm.prank(creator);
        vm.expectRevert(Kwest.CreatorCannotComplete.selector);
        kwest.submitProof(taskId, "https://example.com/proof");
    }

    // ── Proof & Approval Flow ──────────────────────────────────────────────

    function test_FullFlow() public {
        vm.prank(creator);
        uint256 taskId = kwest.createTask(
            "Test Quest", "Do the thing", "Write what you did", Kwest.ProofType.Text,
            REWARD, SLOTS, 0, false
        );

        // Worker submits proof
        vm.prank(worker1);
        uint256 subId = kwest.submitProof(taskId, "I completed the task by doing X, Y, and Z thoroughly.");

        // Creator approves
        vm.prank(creator);
        kwest.approveSubmission(subId);

        Kwest.Submission memory sub = kwest.getSubmission(subId);
        assertEq(uint256(sub.status), uint256(Kwest.SubmissionStatus.Approved));

        // Worker claims
        uint256 before = usdc.balanceOf(worker1);
        vm.prank(worker1);
        kwest.claimReward(subId);
        assertEq(usdc.balanceOf(worker1), before + REWARD);
        assertTrue(kwest.getSubmission(subId).claimed);
    }

    function test_RevertIf_DoubleClaim() public {
        vm.prank(creator);
        uint256 taskId = kwest.createTask(
            "Q", "D", "Write at least 10 characters here", Kwest.ProofType.Text,
            REWARD, SLOTS, 0, false
        );
        vm.prank(worker1);
        uint256 subId = kwest.submitProof(taskId, "This is my proof of completion for this task.");
        vm.prank(creator);
        kwest.approveSubmission(subId);
        vm.prank(worker1);
        kwest.claimReward(subId);
        vm.prank(worker1);
        vm.expectRevert(Kwest.AlreadyClaimed.selector);
        kwest.claimReward(subId);
    }

    function test_RevertIf_DoubleSubmit() public {
        vm.prank(creator);
        uint256 taskId = kwest.createTask(
            "Q", "D", "Text proof required here", Kwest.ProofType.Text,
            REWARD, SLOTS, 0, false
        );
        vm.prank(worker1);
        kwest.submitProof(taskId, "I completed this task fully and thoroughly.");
        vm.prank(worker1);
        vm.expectRevert(Kwest.AlreadySubmitted.selector);
        kwest.submitProof(taskId, "Another attempt at submission here.");
    }

    // ── Anti-Griefing ──────────────────────────────────────────────────────

    function test_AntiGriefing_RejectLimitEnforced() public {
        vm.prank(creator);
        uint256 taskId = kwest.createTask(
            "Q", "D", "Link required", Kwest.ProofType.Link,
            REWARD, 1, 0, false // 1 slot
        );

        // maxRejections = 1 * 3 = 3. Submit and reject 3 times (different workers)
        address[4] memory workers = [worker1, worker2, worker3, makeAddr("w4")];
        uint256[3] memory rejectedSubs;

        for (uint256 i = 0; i < 3; i++) {
            usdc.mint(workers[i], 0); // just to init
            vm.prank(workers[i]);
            uint256 subId = kwest.submitProof(taskId, "https://example.com/proof");
            rejectedSubs[i] = subId;
            vm.prank(creator);
            kwest.rejectSubmission(subId);
        }

        // 4th worker submits — creator should NOT be able to reject (limit reached)
        vm.prank(workers[3]);
        uint256 subId4 = kwest.submitProof(taskId, "https://example.com/proof4");

        vm.prank(creator);
        vm.expectRevert("Kwest: rejection limit reached, must approve remaining");
        kwest.rejectSubmission(subId4);
    }

    // ── Task Cancellation ─────────────────────────────────────────────────

    function test_CancelTask_Refund() public {
        vm.prank(creator);
        uint256 taskId = kwest.createTask(
            "Q", "D", "Text proof required here", Kwest.ProofType.Text,
            REWARD, SLOTS, 0, false
        );

        uint256 totalDeposited = REWARD * SLOTS;
        uint256 beforeBalance = usdc.balanceOf(creator);

        vm.prank(creator);
        kwest.cancelTask(taskId);

        // Should refund full pool (no filled slots)
        assertEq(usdc.balanceOf(creator), beforeBalance + totalDeposited);
    }

    function test_CancelTask_PartialRefund() public {
        vm.prank(creator);
        uint256 taskId = kwest.createTask(
            "Q", "D", "Text proof required here", Kwest.ProofType.Text,
            REWARD, SLOTS, 0, false
        );

        // One worker submits and is approved
        vm.prank(worker1);
        uint256 subId = kwest.submitProof(taskId, "I completed this task fully and thoroughly.");
        vm.prank(creator);
        kwest.approveSubmission(subId);

        uint256 beforeBalance = usdc.balanceOf(creator);

        vm.prank(creator);
        kwest.cancelTask(taskId);

        // Refund = totalPool - 1 filled slot
        assertEq(usdc.balanceOf(creator), beforeBalance + (REWARD * (SLOTS - 1)));
    }

    // ── Fee Withdrawal ─────────────────────────────────────────────────────

    function test_WithdrawFees() public {
        vm.prank(creator);
        kwest.createTask("Q", "D", "Text", Kwest.ProofType.Text, REWARD, SLOTS, 0, false);

        uint256 fee = kwest.accumulatedFees();
        assertTrue(fee > 0);

        uint256 beforeBalance = usdc.balanceOf(owner);
        vm.prank(owner);
        kwest.withdrawFees(owner);
        assertEq(usdc.balanceOf(owner), beforeBalance + fee);
        assertEq(kwest.accumulatedFees(), 0);
    }

    function test_RevertIf_NonOwnerWithdrawsFees() public {
        vm.prank(creator);
        kwest.createTask("Q", "D", "Text", Kwest.ProofType.Text, REWARD, SLOTS, 0, false);
        vm.prank(creator);
        vm.expectRevert();
        kwest.withdrawFees(creator);
    }
}
