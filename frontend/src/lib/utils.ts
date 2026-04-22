import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { USDC_DECIMALS } from "./contracts";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a USDC bigint (6 decimals) to human-readable string */
export function formatUSDC(amount: bigint, decimals = 2): string {
  const value = Number(amount) / 10 ** USDC_DECIMALS;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Parse a human-readable USDC amount to bigint (6 decimals) */
export function parseUSDC(amount: string | number): bigint {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return BigInt(0);
  return BigInt(Math.round(value * 10 ** USDC_DECIMALS));
}

/** Format an Ethereum address to short form */
export function shortAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/** Format a Unix timestamp (seconds) to human-readable */
export function formatTimestamp(ts: bigint | number): string {
  const date = new Date(Number(ts) * 1000);
  return format(date, "MMM d, yyyy");
}

/** Format a Unix timestamp as relative time */
export function formatRelative(ts: bigint | number): string {
  const date = new Date(Number(ts) * 1000);
  return formatDistanceToNow(date, { addSuffix: true });
}

/** Check if a deadline has passed */
export function isDeadlinePassed(deadline: bigint): boolean {
  if (deadline === BigInt(0)) return false;
  return Number(deadline) * 1000 < Date.now();
}

/** Format deadline for display */
export function formatDeadline(deadline: bigint): string {
  if (deadline === BigInt(0)) return "No deadline";
  if (isDeadlinePassed(deadline)) return "Expired";
  return formatDistanceToNow(new Date(Number(deadline) * 1000), { addSuffix: true });
}

/** Get slots remaining */
export function slotsRemaining(task: { totalSlots: bigint; filledSlots: bigint }): bigint {
  return task.totalSlots - task.filledSlots;
}

/** Get fill percentage */
export function fillPercent(task: { totalSlots: bigint; filledSlots: bigint }): number {
  if (task.totalSlots === BigInt(0)) return 0;
  return Number((task.filledSlots * BigInt(100)) / task.totalSlots);
}

/** Map proof type number to label */
export function proofTypeLabel(proofType: number): string {
  const map: Record<number, string> = { 0: "Text", 1: "Link", 2: "IPFS / Screenshot" };
  return map[proofType] ?? "Unknown";
}

/** Map task status number to label */
export function taskStatusLabel(status: number): string {
  const map: Record<number, string> = { 0: "Active", 1: "Completed", 2: "Cancelled" };
  return map[status] ?? "Unknown";
}

/** Map submission status to label */
export function submissionStatusLabel(status: number): string {
  const map: Record<number, string> = { 0: "Pending", 1: "Approved", 2: "Rejected" };
  return map[status] ?? "Unknown";
}

/** Truncate a long string for display */
export function truncate(str: string, maxLen = 80): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

/** Sleep helper */
export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/** Decode contract error name from revert data */
export function decodeContractError(err: unknown): string {
  if (typeof err !== "object" || err === null) return "Transaction failed";
  const e = err as Record<string, unknown>;

  // Viem error shape
  if (typeof e.message === "string") {
    const msg = e.message;
    // Extract custom error name
    const match = msg.match(/reverted with the following reason:\s*(.+)/i) ||
                  msg.match(/Error: (.+)/i);
    if (match) return match[1].trim();
    if (msg.includes("User rejected")) return "Transaction rejected by user";
    if (msg.includes("insufficient funds")) return "Insufficient ETH for gas";
    return msg.slice(0, 120);
  }
  return "Transaction failed";
}
