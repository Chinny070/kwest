export interface Task {
  id: bigint;
  creator: `0x${string}`;
  title: string;
  description: string;
  proofRequirements: string;
  proofType: number;
  rewardPerSlot: bigint;
  totalSlots: bigint;
  filledSlots: bigint;
  totalDeposited: bigint;
  status: number;
  createdAt: bigint;
  deadline: bigint;
  rejectionCount: bigint;
}

export interface Submission {
  id: bigint;
  taskId: bigint;
  worker: `0x${string}`;
  proofData: string;
  proofType: number;
  status: number;
  submittedAt: bigint;
  claimed: boolean;
}

export interface QuoteResult {
  transferAmount: bigint;
  rewardPool: bigint;
  fee: bigint;
  effectiveRewardPerSlot: bigint;
}

export type ProofTypeEnum = 0 | 1 | 2; // Text, Link, IPFS
export type TaskStatusEnum = 0 | 1 | 2; // Active, Completed, Cancelled
export type SubmissionStatusEnum = 0 | 1 | 2; // Pending, Approved, Rejected
