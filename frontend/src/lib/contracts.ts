import { baseSepolia } from "wagmi/chains";

export const SUPPORTED_CHAIN = baseSepolia;

export const KWEST_ADDRESS = (process.env.NEXT_PUBLIC_KWEST_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const USDC_ADDRESS  = (process.env.NEXT_PUBLIC_USDC_ADDRESS  ?? "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as `0x${string}`;

// USDC has 6 decimals
export const USDC_DECIMALS = 6;
export const USDC_SCALAR   = 10 ** USDC_DECIMALS; // 1_000_000

// Max uint256 for approval
export const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

export const TASK_STATUS = {
  0: "Active",
  1: "Completed",
  2: "Cancelled",
} as const;

export const SUBMISSION_STATUS = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
} as const;

export const PROOF_TYPE = {
  0: "Text",
  1: "Link",
  2: "IPFS",
} as const;

export type TaskStatusKey = keyof typeof TASK_STATUS;
export type SubmissionStatusKey = keyof typeof SUBMISSION_STATUS;
export type ProofTypeKey = keyof typeof PROOF_TYPE;
