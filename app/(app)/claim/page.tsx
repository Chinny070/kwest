"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/kwest/auth";
import { useWalletProvider } from "@/lib/kwest/useWalletProvider";
import {
  fetchAllTasks, fetchUserSubmission, getKwestCoreWrite, formatUsdc,
} from "@/lib/kwest/contracts";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { toast } from "sonner";
import { Gift, Coins, Loader2 } from "lucide-react";
import Link from "next/link";

interface ClaimableItem {
  submissionId: string;
  taskId: number;
  taskTitle: string;
  rewardPerUser: bigint;
  claimed: boolean;
  status: number;
}

export default function ClaimRewardsPage() {
  const { address } = useAuth();
  const { getProvider } = useWalletProvider();
  const [claims, setClaims] = useState<ClaimableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimLoading, setClaimLoading] = useState<string | null>(null);

  useEffect(() => {
    if (address) loadClaims();
  }, [address]);

  async function loadClaims() {
    setLoading(true);
    try {
      const tasks = await fetchAllTasks();
      const results: ClaimableItem[] = [];
      for (const task of tasks) {
        const sub = await fetchUserSubmission(task.id, address!);
        if (sub && sub.status === 1) {
          results.push({
            submissionId: sub.id,
            taskId: task.id,
            taskTitle: task.title,
            rewardPerUser: task.rewardPerUser,
            claimed: sub.claimed,
            status: sub.status,
          });
        }
      }
      setClaims(results);
    } catch {
      toast.error("Failed to load claims");
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(submissionId: string) {
    setClaimLoading(submissionId);
    try {
      const walletProvider = await getProvider();
      const contract = await getKwestCoreWrite(walletProvider);
      toast.info("Claiming reward...");
      const tx = await contract.claimReward(submissionId);
      await tx.wait();
      toast.success("Reward claimed!");
      loadClaims();
    } catch (e: unknown) {
      toast.error((e as Error).message?.slice(0, 100) || "Claim failed");
    } finally {
      setClaimLoading(null);
    }
  }

  const unclaimed = claims.filter((c) => !c.claimed);
  const totalClaimable = unclaimed.reduce((sum, c) => sum + c.rewardPerUser, BigInt(0));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Gift className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Claim Rewards</h1>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Scanning your approved submissions...
        </div>
      )}

      {!loading && unclaimed.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Coins className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-sm text-slate-400">Total Claimable</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatUsdc(totalClaimable)} USDC
              </p>
            </div>
          </div>
        </Card>
      )}

      {!loading && claims.length === 0 && (
        <Card className="p-8 text-center">
          <Gift className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No approved submissions yet.</p>
          <p className="text-sm text-slate-500">Complete quests and get approved by creators to earn rewards.</p>
          <Link href="/browse" className="mt-4 inline-block">
            <Button size="sm">Browse Quests</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-3">
        {claims.map((claim) => (
          <Card key={claim.submissionId} className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Link href={`/quest/${claim.taskId}`} className="font-medium text-white hover:text-blue-400">
                  {claim.taskTitle}
                </Link>
                <p className="text-sm text-emerald-400 mt-0.5">{formatUsdc(claim.rewardPerUser)} USDC</p>
              </div>
              {claim.claimed ? (
                <span className="text-xs font-mono px-2.5 py-1 rounded-full border bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Claimed
                </span>
              ) : (
                <Button size="sm" onClick={() => handleClaim(claim.submissionId)} disabled={claimLoading === claim.submissionId}>
                  {claimLoading === claim.submissionId ? "Claiming..." : "Claim USDC"}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
