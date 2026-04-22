"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { KWEST_ABI, ERC20_ABI } from "@/lib/abi";
import { KWEST_ADDRESS, USDC_ADDRESS, MAX_UINT256 } from "@/lib/contracts";
import { Task, Submission } from "@/types";
import { useCallback } from "react";

// ── Read: single task ──────────────────────────────────────────────────────
export function useTask(taskId: bigint | undefined) {
  return useReadContract({
    address:  KWEST_ADDRESS,
    abi:      KWEST_ABI,
    functionName: "getTask",
    args:     taskId ? [taskId] : undefined,
    query:    { enabled: !!taskId },
  });
}

// ── Read: task list IDs ────────────────────────────────────────────────────
export function useTaskIds(offset = 0n, limit = 50n) {
  return useReadContract({
    address:  KWEST_ADDRESS,
    abi:      KWEST_ABI,
    functionName: "getAllTaskIds",
    args:     [offset, limit],
  });
}

// ── Read: creator tasks ────────────────────────────────────────────────────
export function useCreatorTasks(creator: `0x${string}` | undefined) {
  return useReadContract({
    address:  KWEST_ADDRESS,
    abi:      KWEST_ABI,
    functionName: "getCreatorTasks",
    args:     creator ? [creator] : undefined,
    query:    { enabled: !!creator },
  });
}

// ── Read: worker submissions ───────────────────────────────────────────────
export function useWorkerSubmissions(worker: `0x${string}` | undefined) {
  return useReadContract({
    address:  KWEST_ADDRESS,
    abi:      KWEST_ABI,
    functionName: "getWorkerSubmissions",
    args:     worker ? [worker] : undefined,
    query:    { enabled: !!worker },
  });
}

// ── Read: task submissions ─────────────────────────────────────────────────
export function useTaskSubmissions(taskId: bigint | undefined) {
  return useReadContract({
    address:  KWEST_ADDRESS,
    abi:      KWEST_ABI,
    functionName: "getTaskSubmissions",
    args:     taskId ? [taskId] : undefined,
    query:    { enabled: !!taskId },
  });
}

// ── Read: single submission ────────────────────────────────────────────────
export function useSubmission(submissionId: bigint | undefined) {
  return useReadContract({
    address:  KWEST_ADDRESS,
    abi:      KWEST_ABI,
    functionName: "getSubmission",
    args:     submissionId ? [submissionId] : undefined,
    query:    { enabled: !!submissionId && submissionId > 0n },
  });
}

// ── Read: worker submission for task ──────────────────────────────────────
export function useWorkerSubmissionForTask(taskId: bigint | undefined, worker: `0x${string}` | undefined) {
  return useReadContract({
    address:  KWEST_ADDRESS,
    abi:      KWEST_ABI,
    functionName: "getWorkerSubmissionForTask",
    args:     taskId && worker ? [taskId, worker] : undefined,
    query:    { enabled: !!taskId && !!worker },
  });
}

// ── Read: USDC balance ─────────────────────────────────────────────────────
export function useUSDCBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address:  USDC_ADDRESS,
    abi:      ERC20_ABI,
    functionName: "balanceOf",
    args:     address ? [address] : undefined,
    query:    { enabled: !!address },
  });
}

// ── Read: USDC allowance ───────────────────────────────────────────────────
export function useUSDCAllowance(owner: `0x${string}` | undefined) {
  return useReadContract({
    address:  USDC_ADDRESS,
    abi:      ERC20_ABI,
    functionName: "allowance",
    args:     owner ? [owner, KWEST_ADDRESS] : undefined,
    query:    { enabled: !!owner },
  });
}

// ── Read: quote task ───────────────────────────────────────────────────────
export function useQuoteTask(
  rewardPerSlot: bigint,
  totalSlots: bigint,
  deductFeeFromPool: boolean
) {
  return useReadContract({
    address:  KWEST_ADDRESS,
    abi:      KWEST_ABI,
    functionName: "quoteTask",
    args:     [rewardPerSlot, totalSlots, deductFeeFromPool],
    query:    { enabled: rewardPerSlot > 0n && totalSlots > 0n },
  });
}

// ── Write hook factory ─────────────────────────────────────────────────────
export function useKwestWrite() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createTask = useCallback(async (args: {
    title: string;
    description: string;
    proofRequirements: string;
    proofType: number;
    rewardPerSlot: bigint;
    totalSlots: bigint;
    deadline: bigint;
    deductFeeFromPool: boolean;
  }) => {
    return writeContractAsync({
      address: KWEST_ADDRESS,
      abi: KWEST_ABI,
      functionName: "createTask",
      args: [
        args.title,
        args.description,
        args.proofRequirements,
        args.proofType,
        args.rewardPerSlot,
        args.totalSlots,
        args.deadline,
        args.deductFeeFromPool,
      ],
    });
  }, [writeContractAsync]);

  const submitProof = useCallback(async (taskId: bigint, proofData: string) => {
    return writeContractAsync({
      address: KWEST_ADDRESS,
      abi: KWEST_ABI,
      functionName: "submitProof",
      args: [taskId, proofData],
    });
  }, [writeContractAsync]);

  const approveSubmission = useCallback(async (submissionId: bigint) => {
    return writeContractAsync({
      address: KWEST_ADDRESS,
      abi: KWEST_ABI,
      functionName: "approveSubmission",
      args: [submissionId],
    });
  }, [writeContractAsync]);

  const rejectSubmission = useCallback(async (submissionId: bigint) => {
    return writeContractAsync({
      address: KWEST_ADDRESS,
      abi: KWEST_ABI,
      functionName: "rejectSubmission",
      args: [submissionId],
    });
  }, [writeContractAsync]);

  const claimReward = useCallback(async (submissionId: bigint) => {
    return writeContractAsync({
      address: KWEST_ADDRESS,
      abi: KWEST_ABI,
      functionName: "claimReward",
      args: [submissionId],
    });
  }, [writeContractAsync]);

  const cancelTask = useCallback(async (taskId: bigint) => {
    return writeContractAsync({
      address: KWEST_ADDRESS,
      abi: KWEST_ABI,
      functionName: "cancelTask",
      args: [taskId],
    });
  }, [writeContractAsync]);

  return {
    createTask,
    submitProof,
    approveSubmission,
    rejectSubmission,
    claimReward,
    cancelTask,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

// ── Write: USDC approve ────────────────────────────────────────────────────
export function useApproveUSDC() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = useCallback(async () => {
    return writeContractAsync({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [KWEST_ADDRESS, MAX_UINT256],
    });
  }, [writeContractAsync]);

  return { approve, isPending, isConfirming, isSuccess };
}
