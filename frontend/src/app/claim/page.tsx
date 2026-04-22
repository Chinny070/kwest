"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, Button, PageHeader, Badge, Skeleton, EmptyState, StatCard } from "@/components/ui";
import {
  useWorkerSubmissions, useSubmission, useTask, useKwestWrite
} from "@/hooks/useKwest";
import { Task, Submission } from "@/types";
import {
  formatUSDC, formatRelative, decodeContractError, shortAddress
} from "@/lib/utils";
import { useAccount } from "wagmi";
import { useState } from "react";
import toast from "react-hot-toast";
import { Gift, Coins, CheckCircle, Clock, XCircle, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

function ClaimRow({ submissionId }: { submissionId: bigint }) {
  const { data: sub, refetch } = useSubmission(submissionId);
  const { data: task } = useTask(sub ? (sub as Submission).taskId : undefined);
  const { claimReward, isPending, isConfirming } = useKwestWrite();
  const [claiming, setClaiming] = useState(false);

  if (!sub || !task) {
    return <div className="shimmer h-20 rounded-xl" />;
  }

  const s = sub as Submission;
  const t = task as Task;

  const statusMap: Record<number, "pending" | "approved" | "rejected"> = {
    0: "pending", 1: "approved", 2: "rejected"
  };

  const canClaim = s.status === 1 && !s.claimed;

  async function handleClaim() {
    setClaiming(true);
    try {
      await claimReward(s.id);
      toast.success(`Claimed $${formatUSDC(t.rewardPerSlot)} USDC!`);
      await refetch();
    } catch (e) {
      toast.error(decodeContractError(e));
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className={`glass rounded-xl p-4 transition-all ${canClaim ? "border-green-500/20" : ""}`}
      style={canClaim ? { borderColor: "rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.03)" } : {}}>
      <div className="flex items-center gap-4">
        {/* Status icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          s.status === 1 ? (s.claimed ? "bg-slate-800" : "bg-green-500/15") :
          s.status === 2 ? "bg-red-500/10" : "bg-amber-500/10"
        }`}>
          {s.status === 0 && <Clock size={18} className="text-amber-400" />}
          {s.status === 1 && !s.claimed && <CheckCircle size={18} className="text-green-400" />}
          {s.status === 1 && s.claimed && <Coins size={18} className="text-slate-500" />}
          {s.status === 2 && <XCircle size={18} className="text-red-400" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-slate-200 truncate">{t.title}</p>
            <Badge status={statusMap[s.status] ?? "pending"} />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>#{s.id.toString()}</span>
            <span>{formatRelative(s.submittedAt)}</span>
            {s.claimed && <span className="text-green-400">✓ Claimed</span>}
          </div>
        </div>

        {/* Right: reward + action */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-base font-bold ${canClaim ? "text-green-400" : s.claimed ? "text-slate-500" : "text-slate-400"}`}>
            ${formatUSDC(t.rewardPerSlot)}
          </span>

          {canClaim && (
            <Button
              size="sm"
              loading={claiming && (isPending || isConfirming)}
              onClick={handleClaim}
              className="!text-xs"
            >
              <Gift size={13} /> Claim USDC
            </Button>
          )}
          {s.status === 0 && (
            <span className="text-xs text-amber-400">Awaiting review</span>
          )}
          {s.status === 2 && (
            <span className="text-xs text-red-400">Rejected</span>
          )}
          {s.status === 1 && s.claimed && (
            <span className="text-xs text-slate-500">Paid out</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Summary hook ─────────────────────────────────────────────────────────
function useSummaryStats(subIds: bigint[]) {
  // We can't easily compute these without loading each sub,
  // so we return a loading state and let ClaimRow render each
  return {
    total: subIds.length,
    claimableCount: 0, // computed via child renders
  };
}

export default function ClaimPage() {
  const { address } = useAccount();
  const { data: workerSubIds, isLoading } = useWorkerSubmissions(address);
  const subIds = (workerSubIds as bigint[] | undefined) ?? [];

  // Separate by status for display ordering
  // We show all — ClaimRow handles its own display

  return (
    <AppShell>
      <PageHeader
        title="Claim Rewards"
        subtitle="Track your submissions and claim approved USDC rewards."
      />

      {/* Info box */}
      {subIds.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
          style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
          <Gift size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400">
            Rewards are released instantly once the quest creator approves your submission.
            Click <span className="text-slate-200 font-medium">Claim USDC</span> on any approved submission to receive payment.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : subIds.length === 0 ? (
        <EmptyState
          icon={<Gift size={24} />}
          title="No submissions yet"
          description="Complete quests to earn USDC rewards. Your submissions will appear here."
          action={
            <Link href="/tasks">
              <Button>Browse Quests</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Total Submissions"
              value={subIds.length}
              icon={<CheckCircle size={17} />}
              color="blue"
            />
            <StatCard
              label="Claimable"
              value="See below"
              icon={<Gift size={17} />}
              color="green"
              sub="Approved submissions"
            />
            <StatCard
              label="Network"
              value="Base Sepolia"
              icon={<Coins size={17} />}
              color="gold"
              sub="USDC payouts"
            />
          </div>

          {/* Submission list — newest first */}
          <div className="space-y-3 stagger">
            {[...subIds].reverse().map(id => (
              <ClaimRow key={id.toString()} submissionId={id} />
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
