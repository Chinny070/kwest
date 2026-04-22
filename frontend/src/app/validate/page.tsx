"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, Button, PageHeader, Badge, Skeleton, EmptyState } from "@/components/ui";
import {
  useCreatorTasks, useTask, useTaskSubmissions,
  useSubmission, useKwestWrite
} from "@/hooks/useKwest";
import { Task, Submission } from "@/types";
import {
  formatUSDC, shortAddress, formatRelative,
  fillPercent, decodeContractError, truncate
} from "@/lib/utils";
import { useAccount } from "wagmi";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  CheckSquare, CheckCircle, XCircle, ExternalLink,
  Users, Coins, ChevronDown, ChevronUp, AlertCircle, Info
} from "lucide-react";
import Link from "next/link";

// ── Submission item ───────────────────────────────────────────────────────
function SubmissionItem({ submissionId, taskReward }: { submissionId: bigint; taskReward: bigint }) {
  const { data: sub, refetch } = useSubmission(submissionId);
  const { approveSubmission, rejectSubmission, isPending, isConfirming } = useKwestWrite();
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!sub) return <div className="shimmer h-16 rounded-xl" />;
  const s = sub as Submission;

  const statusMap: Record<number, "pending" | "approved" | "rejected"> = {
    0: "pending", 1: "approved", 2: "rejected"
  };

  async function handleApprove() {
    setActing("approve");
    try {
      await approveSubmission(s.id);
      toast.success("Submission approved! Worker can now claim their reward.");
      await refetch();
    } catch (e) {
      toast.error(decodeContractError(e));
    } finally { setActing(null); }
  }

  async function handleReject() {
    setActing("reject");
    try {
      await rejectSubmission(s.id);
      toast.success("Submission rejected.");
      await refetch();
    } catch (e) {
      toast.error(decodeContractError(e));
    } finally { setActing(null); }
  }

  const isLoading = (isPending || isConfirming) && !!acting;

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(100,116,139,0.12)", border: "1px solid rgba(100,116,139,0.2)" }}>
          <span className="text-xs font-mono text-slate-400">#{s.id.toString()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-slate-300">{shortAddress(s.worker)}</span>
            <Badge status={statusMap[s.status] ?? "pending"} />
            {s.claimed && <span className="text-xs text-green-400">· Claimed</span>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{formatRelative(s.submittedAt)}</p>
        </div>

        {/* Preview of proof */}
        <p className="text-xs text-slate-500 hidden sm:block max-w-32 truncate">
          {truncate(s.proofData, 30)}
        </p>

        {s.status === 0 && (
          <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <Button
              size="sm"
              loading={acting === "approve" && isLoading}
              onClick={handleApprove}
              className="!text-green-400 !border-green-500/25 !bg-green-500/10 hover:!bg-green-500/20 !rounded-lg"
              variant="ghost"
            >
              <CheckCircle size={13} />
              <span className="hidden sm:inline">Approve</span>
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={acting === "reject" && isLoading}
              onClick={handleReject}
              className="!rounded-lg"
            >
              <XCircle size={13} />
              <span className="hidden sm:inline">Reject</span>
            </Button>
          </div>
        )}

        <button className="text-slate-500 flex-shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded proof */}
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(100,116,139,0.12)" }}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3 mb-2">
            Submitted Proof
          </p>
          <div className="rounded-xl p-4 break-all"
            style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(100,116,139,0.15)" }}>
            {s.proofType === 2 ? (
              <div>
                <p className="text-xs text-slate-500 mb-1">IPFS CID</p>
                <p className="font-mono text-sm text-brand-300 break-all">{s.proofData}</p>
                <a
                  href={`https://ipfs.io/ipfs/${s.proofData}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-2"
                >
                  View on IPFS <ExternalLink size={11} />
                </a>
              </div>
            ) : s.proofType === 1 ? (
              <div>
                <p className="text-xs text-slate-500 mb-1">Link</p>
                <a
                  href={s.proofData} target="_blank" rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-sm break-all"
                >
                  {s.proofData} <ExternalLink size={12} />
                </a>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-1">Text</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{s.proofData}</p>
              </div>
            )}
          </div>
          {s.status === 0 && (
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                loading={acting === "approve" && isLoading}
                onClick={handleApprove}
                className="!text-green-400 !border-green-500/25 !bg-green-500/10 hover:!bg-green-500/20"
                variant="ghost"
              >
                <CheckCircle size={14} /> Approve — pay ${formatUSDC(taskReward)} USDC
              </Button>
              <Button size="sm" variant="danger" loading={acting === "reject" && isLoading} onClick={handleReject}>
                <XCircle size={14} /> Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Task validation section ───────────────────────────────────────────────
function TaskValidationSection({ taskId }: { taskId: bigint }) {
  const { data: task } = useTask(taskId);
  const { data: subIds } = useTaskSubmissions(taskId);
  const [open, setOpen] = useState(false);

  if (!task) return <Skeleton className="h-20" />;
  const t = task as Task;
  const ids = (subIds as bigint[] | undefined) ?? [];
  const pendingCount = 0; // will be computed in real render

  const statusMap: Record<number, "active" | "completed" | "cancelled"> = {
    0: "active", 1: "completed", 2: "cancelled"
  };
  const percent = fillPercent(t);
  const rejLimit = Number(t.totalSlots) * 3;

  return (
    <Card className="mb-4">
      {/* Task header */}
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-200 truncate">{t.title}</h3>
            <Badge status={statusMap[t.status] ?? "active"} />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users size={11} />
              {t.filledSlots.toString()} / {t.totalSlots.toString()} filled
            </span>
            <span className="flex items-center gap-1">
              <Coins size={11} />
              ${formatUSDC(t.rewardPerSlot)}/slot
            </span>
            <span>{ids.length} submission{ids.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Anti-griefing meter */}
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-500 mb-0.5">Rejections used</p>
          <p className="text-sm font-semibold text-slate-300">
            {t.rejectionCount.toString()}
            <span className="text-slate-600"> / {rejLimit}</span>
          </p>
          {t.rejectionCount >= BigInt(rejLimit) && (
            <p className="text-xs text-amber-400">Limit reached</p>
          )}
        </div>

        <button className="text-slate-500 flex-shrink-0">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded submissions */}
      {open && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(100,116,139,0.12)" }}>
          {/* Anti-griefing notice */}
          {t.rejectionCount > 0n && (
            <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
              style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)" }}>
              <Info size={14} className="text-brand-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                <span className="text-brand-300 font-medium">Anti-griefing active: </span>
                You've used {t.rejectionCount.toString()} of {rejLimit} allowed rejections.
                Once the limit is reached, you can no longer reject submissions for this quest.
              </p>
            </div>
          )}

          {ids.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {[...ids].reverse().map(id => (
                <SubmissionItem key={id.toString()} submissionId={id} taskReward={t.rewardPerSlot} />
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Link href={`/tasks/${t.id}`}>
              <Button size="sm" variant="outline">View Quest Page</Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Main validate page ────────────────────────────────────────────────────
export default function ValidatePage() {
  const { address } = useAccount();
  const { data: creatorTaskIds, isLoading } = useCreatorTasks(address);
  const taskIds = (creatorTaskIds as bigint[] | undefined) ?? [];
  const activeTaskIds = taskIds; // show all, each section handles its own state

  return (
    <AppShell>
      <PageHeader
        title="Validate Submissions"
        subtitle="Review proof from workers and approve or reject their submissions."
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
        style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)" }}>
        <AlertCircle size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-400">
          <p className="text-slate-200 font-medium mb-0.5">Fair review policy</p>
          <p>
            You can reject up to 3× the number of slots per quest. After that, you cannot reject further —
            this protects workers from bad-faith creators who reject valid submissions to avoid paying.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : activeTaskIds.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={24} />}
          title="No quests to validate"
          description="Create a quest first, then come back here to review submissions."
          action={
            <Link href="/tasks/new">
              <Button>Create a Quest</Button>
            </Link>
          }
        />
      ) : (
        <div className="stagger">
          {[...activeTaskIds].reverse().map(id => (
            <TaskValidationSection key={id.toString()} taskId={id} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
