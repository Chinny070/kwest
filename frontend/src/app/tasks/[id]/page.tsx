"use client";

import { AppShell } from "@/components/layout/AppShell";
import {
  Card, Badge, Progress, Button, Skeleton, EmptyState
} from "@/components/ui";
import {
  useTask, useTaskSubmissions, useSubmission, useWorkerSubmissionForTask,
  useKwestWrite
} from "@/hooks/useKwest";
import { Task, Submission } from "@/types";
import {
  formatUSDC, formatTimestamp, formatDeadline, fillPercent,
  proofTypeLabel, shortAddress, submissionStatusLabel, formatRelative, decodeContractError
} from "@/lib/utils";
import {
  ArrowLeft, Coins, Users, Clock, FileText, CheckCircle,
  XCircle, ChevronRight, ExternalLink, Swords
} from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useState } from "react";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";

function SubmissionRow({
  submissionId, isCreator, taskId
}: {
  submissionId: bigint;
  isCreator: boolean;
  taskId: bigint;
}) {
  const { data: sub } = useSubmission(submissionId);
  const { approveSubmission, rejectSubmission, isPending, isConfirming } = useKwestWrite();
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);

  if (!sub) return <Skeleton className="h-16" />;
  const s = sub as Submission;

  const statusMap: Record<number, "pending" | "approved" | "rejected"> = {
    0: "pending", 1: "approved", 2: "rejected"
  };

  const handleApprove = async () => {
    setActing("approve");
    try {
      await approveSubmission(s.id);
      toast.success("Submission approved!");
    } catch (e) {
      toast.error(decodeContractError(e));
    } finally { setActing(null); }
  };

  const handleReject = async () => {
    setActing("reject");
    try {
      await rejectSubmission(s.id);
      toast.success("Submission rejected.");
    } catch (e) {
      toast.error(decodeContractError(e));
    } finally { setActing(null); }
  };

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-slate-400">{shortAddress(s.worker)}</span>
            <Badge status={statusMap[s.status] ?? "pending"} />
            {s.claimed && <span className="text-xs text-green-400">· Claimed</span>}
          </div>
          <p className="text-xs text-slate-500">{formatRelative(s.submittedAt)}</p>
        </div>
        {isCreator && s.status === 0 && (
          <div className="flex gap-2">
            <Button
              size="sm" variant="ghost"
              loading={acting === "approve" && (isPending || isConfirming)}
              onClick={handleApprove}
              className="!text-green-400 !border-green-500/25 !bg-green-500/10 hover:!bg-green-500/20"
            >
              <CheckCircle size={13} /> Approve
            </Button>
            <Button
              size="sm" variant="danger"
              loading={acting === "reject" && (isPending || isConfirming)}
              onClick={handleReject}
            >
              <XCircle size={13} /> Reject
            </Button>
          </div>
        )}
      </div>
      <div className="rounded-lg p-3 text-sm text-slate-300 break-all"
        style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(100,116,139,0.15)" }}>
        {s.proofType === 2 ? (
          <a href={`https://ipfs.io/ipfs/${s.proofData}`} target="_blank" rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300 flex items-center gap-1">
            <span className="font-mono text-xs">{s.proofData}</span>
            <ExternalLink size={11} />
          </a>
        ) : s.proofType === 1 ? (
          <a href={s.proofData} target="_blank" rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300 flex items-center gap-1">
            {s.proofData} <ExternalLink size={11} />
          </a>
        ) : (
          <span className="text-slate-300">{s.proofData}</span>
        )}
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = BigInt(params.id as string);
  const { address } = useAccount();

  const { data: task, isLoading } = useTask(taskId);
  const { data: subIds } = useTaskSubmissions(taskId);
  const { data: workerSubId } = useWorkerSubmissionForTask(taskId, address);
  const { cancelTask, isPending, isConfirming } = useKwestWrite();

  const t = task as Task | undefined;
  const allSubIds = (subIds as bigint[] | undefined) ?? [];

  const isCreator = t?.creator.toLowerCase() === address?.toLowerCase();
  const hasSubmitted = workerSubId && (workerSubId as bigint) > BigInt(0);

  const handleCancel = async () => {
    try {
      await cancelTask(taskId);
      toast.success("Quest cancelled, funds refunded.");
      router.push("/dashboard");
    } catch (e) {
      toast.error(decodeContractError(e));
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </AppShell>
    );
  }

  if (!t || t.creator === "0x0000000000000000000000000000000000000000") {
    return (
      <AppShell>
        <EmptyState
          icon={<Swords size={24} />}
          title="Quest not found"
          description="This quest doesn't exist or has been removed."
          action={<Link href="/tasks"><Button variant="ghost">Back to quests</Button></Link>}
        />
      </AppShell>
    );
  }

  const statusMap: Record<number, "active" | "completed" | "cancelled"> = {
    0: "active", 1: "completed", 2: "cancelled"
  };
  const percent = fillPercent(t);
  const slotsLeft = t.totalSlots - t.filledSlots;
  const isFull = slotsLeft === BigInt(0);
  const proofTypeMap: Record<number, string> = { 0: "Text", 1: "Link", 2: "IPFS / Screenshot" };

  return (
    <AppShell>
      {/* Back */}
      <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to quests
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <Card>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge status={statusMap[t.status] ?? "active"} />
                  {hasSubmitted && (
                    <span className="inline-flex items-center gap-1 text-xs text-brand-400 font-medium">
                      <CheckCircle size={12} /> You submitted
                    </span>
                  )}
                </div>
                <h1 className="font-display text-2xl text-white mb-1">{t.title}</h1>
                <p className="text-sm text-slate-500">
                  by <span className="font-mono">{shortAddress(t.creator)}</span>
                  {isCreator && <span className="text-brand-400 ml-1">(You)</span>}
                  {" · "}{formatTimestamp(t.createdAt)}
                </p>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed mb-5">{t.description}</p>

            {/* Proof requirements */}
            <div className="rounded-xl p-4"
              style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}>
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1.5">
                {proofTypeMap[t.proofType]} Proof Required
              </p>
              <p className="text-sm text-slate-300">{t.proofRequirements}</p>
            </div>
          </Card>

          {/* Submissions */}
          <Card>
            <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <FileText size={15} className="text-slate-400" />
              Submissions ({allSubIds.length})
            </h2>
            {allSubIds.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No submissions yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {[...allSubIds].reverse().map(id => (
                  <SubmissionRow key={id.toString()} submissionId={id} isCreator={isCreator} taskId={taskId} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Reward card */}
          <Card glow>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <Coins size={22} className="text-brand-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-0.5">${formatUSDC(t.rewardPerSlot)}</p>
              <p className="text-sm text-slate-400">USDC per slot</p>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span className="flex items-center gap-1"><Users size={11} /> {t.filledSlots.toString()} / {t.totalSlots.toString()} slots</span>
                <span>{percent}% full</span>
              </div>
              <Progress value={percent} />
              {!isFull && t.status === 0 && (
                <p className="text-xs text-green-400 mt-1.5">{slotsLeft.toString()} slot{slotsLeft !== BigInt(1) ? "s" : ""} remaining</p>
              )}
              {isFull && <p className="text-xs text-slate-500 mt-1.5">All slots filled</p>}
            </div>

            {/* Deadline */}
            <div className="flex items-center justify-between text-sm mb-5">
              <span className="text-slate-400 flex items-center gap-1.5"><Clock size={13} /> Deadline</span>
              <span className="text-slate-200">{formatDeadline(t.deadline)}</span>
            </div>

            {/* CTA */}
            {!isCreator && t.status === 0 && !isFull && !hasSubmitted && (
              <Link href={`/submit/${t.id}`}>
                <Button size="lg" className="w-full">
                  Submit Proof <ChevronRight size={16} />
                </Button>
              </Link>
            )}
            {!isCreator && hasSubmitted && (
              <div className="text-center p-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <p className="text-sm text-green-400 font-medium">✓ You've submitted proof</p>
                <Link href="/claim" className="text-xs text-slate-400 hover:text-brand-400 mt-1 block">
                  Check claim status →
                </Link>
              </div>
            )}
            {!isCreator && isFull && !hasSubmitted && (
              <div className="text-center p-3 rounded-xl"
                style={{ background: "rgba(100,116,139,0.07)", border: "1px solid rgba(100,116,139,0.15)" }}>
                <p className="text-sm text-slate-400">All slots are filled</p>
              </div>
            )}
            {isCreator && t.status === 0 && (
              <div className="space-y-2">
                <Link href="/validate">
                  <Button variant="ghost" size="md" className="w-full">
                    <CheckCircle size={15} /> Review Submissions
                  </Button>
                </Link>
                <Button
                  variant="danger" size="sm" className="w-full"
                  loading={isPending || isConfirming}
                  onClick={handleCancel}
                >
                  Cancel & Refund
                </Button>
              </div>
            )}
          </Card>

          {/* Info */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Proof type</dt>
                <dd className="text-slate-200">{proofTypeMap[t.proofType]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Total pool</dt>
                <dd className="text-slate-200">${formatUSDC(t.totalDeposited)} USDC</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Rejections</dt>
                <dd className="text-slate-200">{t.rejectionCount.toString()} / {(t.totalSlots * BigInt(3)).toString()} max</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Quest ID</dt>
                <dd className="font-mono text-slate-400">#{t.id.toString()}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
