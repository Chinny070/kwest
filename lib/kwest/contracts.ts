import { ethers } from "ethers";

const BASE_SEPOLIA_RPC = "https://sepolia.base.org";

const KWEST_CORE_ADDRESS = process.env.NEXT_PUBLIC_KWEST_CORE_ADDRESS || "";
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export const KWEST_CORE_ABI = [
  "function createTask(string title, string description, uint8 proofType, string requirements, uint256 rewardPool, uint256 totalSlots, uint256 deadline) returns (uint256)",
  "function submitProof(uint256 taskId, string proofData) returns (bytes32)",
  "function approveSubmission(bytes32 submissionId)",
  "function rejectSubmission(bytes32 submissionId)",
  "function claimReward(bytes32 submissionId)",
  "function cancelTask(uint256 taskId)",
  "function refundRemaining(uint256 taskId)",
  "function getTask(uint256 taskId) view returns (tuple(address creator, string title, string description, uint8 proofType, string requirements, uint256 rewardPool, uint256 rewardPerUser, uint256 totalSlots, uint256 filledSlots, uint256 approvedCount, uint256 claimedCount, uint256 platformFee, uint8 status, uint256 deadline))",
  "function getSubmission(bytes32 submissionId) view returns (tuple(address submitter, uint256 taskId, string proofData, uint8 status, bool claimed, uint256 submittedAt))",
  "function getTaskSubmissions(uint256 taskId) view returns (bytes32[])",
  "function getTaskSubmissionCount(uint256 taskId) view returns (uint256)",
  "function nextTaskId() view returns (uint256)",
  "function userSubmissions(uint256 taskId, address user) view returns (bytes32)",
  "function PLATFORM_FEE_BPS() view returns (uint256)",
  "function MIN_REWARD_PER_USER() view returns (uint256)",
  "event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 rewardPool, uint256 totalSlots, uint256 platformFee)",
  "event ProofSubmitted(uint256 indexed taskId, bytes32 indexed submissionId, address indexed submitter)",
  "event SubmissionApproved(uint256 indexed taskId, bytes32 indexed submissionId)",
  "event SubmissionRejected(uint256 indexed taskId, bytes32 indexed submissionId)",
  "event RewardClaimed(uint256 indexed taskId, bytes32 indexed submissionId, address indexed submitter, uint256 amount)",
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
}

export function getKwestCoreRead() {
  return new ethers.Contract(KWEST_CORE_ADDRESS, KWEST_CORE_ABI, getProvider());
}

export async function getKwestCoreWrite(walletProvider: ethers.Eip1193Provider) {
  const provider = new ethers.BrowserProvider(walletProvider);
  const signer = await provider.getSigner();
  return new ethers.Contract(KWEST_CORE_ADDRESS, KWEST_CORE_ABI, signer);
}

export function getUsdcRead() {
  return new ethers.Contract(USDC_ADDRESS, ERC20_ABI, getProvider());
}

export async function getUsdcWrite(walletProvider: ethers.Eip1193Provider) {
  const provider = new ethers.BrowserProvider(walletProvider);
  const signer = await provider.getSigner();
  return new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
}

export async function getSignerAddress(walletProvider: ethers.Eip1193Provider): Promise<string> {
  const provider = new ethers.BrowserProvider(walletProvider);
  const signer = await provider.getSigner();
  return signer.getAddress();
}

export interface TaskData {
  id: number;
  creator: string;
  title: string;
  description: string;
  proofType: number;
  requirements: string;
  rewardPool: bigint;
  rewardPerUser: bigint;
  totalSlots: bigint;
  filledSlots: bigint;
  approvedCount: bigint;
  claimedCount: bigint;
  platformFee: bigint;
  status: number;
  deadline: bigint;
}

export interface SubmissionData {
  id: string;
  submitter: string;
  taskId: number;
  proofData: string;
  status: number;
  claimed: boolean;
  submittedAt: bigint;
}

export const PROOF_TYPES = ["Text", "Link", "IPFS"] as const;
export const TASK_STATUSES = ["Active", "Completed", "Cancelled"] as const;
export const SUBMISSION_STATUSES = ["Pending", "Approved", "Rejected"] as const;
export const USDC_DECIMALS = 6;
export const PLATFORM_FEE_BPS = 200;

export function formatUsdc(amount: bigint): string {
  const num = Number(amount) / 1e6;
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
}

export function parseUsdc(amount: string): bigint {
  return ethers.parseUnits(amount, USDC_DECIMALS);
}

export async function fetchAllTasks(): Promise<TaskData[]> {
  const contract = getKwestCoreRead();
  const count = Number(await contract.nextTaskId());
  const tasks: TaskData[] = [];
  for (let i = 0; i < count; i++) {
    const t = await contract.getTask(i);
    tasks.push(mapTask(i, t));
  }
  return tasks;
}

export async function fetchTask(taskId: number): Promise<TaskData> {
  const contract = getKwestCoreRead();
  const t = await contract.getTask(taskId);
  return mapTask(taskId, t);
}

export async function fetchTaskSubmissions(taskId: number): Promise<SubmissionData[]> {
  const contract = getKwestCoreRead();
  const ids: string[] = await contract.getTaskSubmissions(taskId);
  const subs: SubmissionData[] = [];
  for (const id of ids) {
    const s = await contract.getSubmission(id);
    subs.push({
      id,
      submitter: s.submitter,
      taskId: Number(s.taskId),
      proofData: s.proofData,
      status: Number(s.status),
      claimed: s.claimed,
      submittedAt: s.submittedAt,
    });
  }
  return subs;
}

export async function fetchUserSubmission(taskId: number, userAddress: string): Promise<SubmissionData | null> {
  const contract = getKwestCoreRead();
  const subId: string = await contract.userSubmissions(taskId, userAddress);
  if (subId === ethers.ZeroHash) return null;
  const s = await contract.getSubmission(subId);
  return {
    id: subId,
    submitter: s.submitter,
    taskId: Number(s.taskId),
    proofData: s.proofData,
    status: Number(s.status),
    claimed: s.claimed,
    submittedAt: s.submittedAt,
  };
}

export async function ensureUsdcApproval(walletProvider: ethers.Eip1193Provider, amount: bigint): Promise<void> {
  const usdc = await getUsdcWrite(walletProvider);
  const address = await getSignerAddress(walletProvider);
  const allowance = await usdc.allowance(address, KWEST_CORE_ADDRESS);
  if (allowance < amount) {
    const tx = await usdc.approve(KWEST_CORE_ADDRESS, amount);
    await tx.wait();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTask(id: number, t: any): TaskData {
  return {
    id,
    creator: t.creator,
    title: t.title,
    description: t.description,
    proofType: Number(t.proofType),
    requirements: t.requirements,
    rewardPool: t.rewardPool,
    rewardPerUser: t.rewardPerUser,
    totalSlots: t.totalSlots,
    filledSlots: t.filledSlots,
    approvedCount: t.approvedCount,
    claimedCount: t.claimedCount,
    platformFee: t.platformFee,
    status: Number(t.status),
    deadline: t.deadline,
  };
}
