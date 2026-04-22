"use client";

import { AppShell } from "@/components/layout/AppShell";
import { StatCard, Card, PageHeader, Skeleton, EmptyState, Badge, Progress, Button } from "@/components/ui";
import { useAccount } from "wagmi";
import {
  useCreatorTasks, useWorkerSubmissions, useTask,
  useSubmission, useUSDCBalance
} from "@/hooks/useKwest";
import {
  LayoutDashboard, Coins, CheckSquare, Clock, Plus,
  Swords, ArrowRight, TrendingUp, Users
} from "lucide-react";
import { formatUSDC, formatRelative, fillPercent, taskStatusLabel, submissionStatusLabel, shortAddress } from "@/lib/utils";
import Link from "next/link";
import { Task, Submission } from "@/types";

function RecentTaskRow({ taskId }: { taskId: bigint }) {
  const { data: task } = useTask(taskId);
  if (!task) return <div className="shimmer h-14 rounded-xl" />;
  const percent = fillPercent(task as Task);
  const statusMap: Record<number, "active" | "completed" | "cancelled"> = { 0: "active", 1: "completed", 2: "cancelled" };
  return (
    <Link href={`/tasks/${task.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/40 transition-colors group">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.12)" }}>
        <Swords size={14} className="text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 group-hover:text-brand-300 transition-colors truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="progress-track flex-1 max-w-24">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-[11px] text-slate-500">{task.filledSlots.toString()}/{task.totalSlots.toString()}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge status={statusMap[task.status] ?? "active"} />
        <span className="text-xs text-brand-400 font-mono">${formatUSDC(task.rewardPerSlot)}/slot</span>
      </div>
    </Link>
  );
}

function RecentSubmissionRow({ submissionId }: { submissionId: bigint }) {
  const { data: sub } = useSubmission(submissionId);
  const { data: task } = useTask(sub ? (sub as Submission).taskId : undefined);
  if (!sub || !task) return <div className="shimmer h-14 rounded-xl" />;
  const s = sub as Submission;
  const t = task as Task;
  const statusMap: Record<number, "pending" | "approved" | "rejected"> = { 0: "pending", 1: "approved", 2: "rejected" };
  return (
    <Link href={`/tasks/${t.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/40 transition-colors group">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.15)" }}>
        <CheckSquare size={14} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 group-hover:text-brand-300 transition-colors truncate">{t.title}</p>
        <p className="text-xs text-slate-500">{formatRelative(s.submittedAt)}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge status={statusMap[s.status] ?? "pending"} />
        {s.status === 1 && !s.claimed && (
          <span className="text-xs text-green-400 font-medium">Ready to claim</span>
        )}
        {s.claimed && <span className="text-xs text-slate-500">Claimed</span>}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { address } = useAccount();
  const { data: creatorTaskIds, isLoading: loadingTasks } = useCreatorTasks(address);
  const { data: workerSubIds, isLoading: loadingSubs } = useWorkerSubmissions(address);
  const { data: usdcBalance } = useUSDCBalance(address);

  const taskIds = (creatorTaskIds as bigint[] | undefined) ?? [];
  const subIds  = (workerSubIds  as bigint[] | undefined) ?? [];
  const recentTaskIds = [...taskIds].reverse().slice(0, 5);
  const recentSubIds  = [...subIds].reverse().slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle={address ? `Welcome back, ${shortAddress(address)}` : "Overview of your activity"}
        action={
          <Link href="/tasks/new">
            <Button size="md">
              <Plus size={16} />
              Create Quest
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <StatCard
          label="USDC Balance"
          value={usdcBalance ? `$${formatUSDC(usdcBalance as bigint)}` : "—"}
          icon={<Coins size={18} />}
          sub="on Base Sepolia"
          color="gold"
        />
        <StatCard
          label="Quests Created"
          value={taskIds.length}
          icon={<Swords size={18} />}
          sub="as creator"
          color="blue"
        />
        <StatCard
          label="Submissions"
          value={subIds.length}
          icon={<CheckSquare size={18} />}
          sub="as worker"
          color="green"
        />
        <StatCard
          label="Network"
          value="Base Sepolia"
          icon={<TrendingUp size={18} />}
          sub="Chain ID: 84532"
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Quests */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200 flex items-center gap-2">
              <Swords size={16} className="text-brand-400" />
              My Quests
            </h2>
            <Link href="/validate" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          {loadingTasks ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : recentTaskIds.length === 0 ? (
            <EmptyState
              icon={<Swords size={20} />}
              title="No quests yet"
              description="Create your first quest to start getting work done."
              action={
                <Link href="/tasks/new">
                  <Button size="sm">Create Quest</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-1">
              {recentTaskIds.map(id => <RecentTaskRow key={id.toString()} taskId={id} />)}
            </div>
          )}
        </Card>

        {/* My Submissions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200 flex items-center gap-2">
              <CheckSquare size={16} className="text-green-400" />
              My Submissions
            </h2>
            <Link href="/claim" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Claim rewards <ArrowRight size={12} />
            </Link>
          </div>
          {loadingSubs ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : recentSubIds.length === 0 ? (
            <EmptyState
              icon={<CheckSquare size={20} />}
              title="No submissions"
              description="Browse quests and start earning USDC."
              action={
                <Link href="/tasks">
                  <Button size="sm" variant="ghost">Browse Quests</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-1">
              {recentSubIds.map(id => <RecentSubmissionRow key={id.toString()} submissionId={id} />)}
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/tasks",      icon: Users,        label: "Browse Quests",   sub: "Find tasks to complete" },
          { href: "/tasks/new",  icon: Plus,         label: "Post a Quest",    sub: "Deposit USDC rewards" },
          { href: "/validate",   label: "Validate",  icon: CheckSquare,        sub: "Review submissions" },
          { href: "/claim",      label: "Claim",     icon: Coins,              sub: "Collect your rewards" },
        ].map(({ href, icon: Icon, label, sub }) => (
          <Link key={href} href={href}>
            <div className="glass glass-hover rounded-xl p-4 flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.12)" }}>
                <Icon size={15} className="text-brand-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 group-hover:text-brand-300 transition-colors">{label}</p>
                <p className="text-xs text-slate-500 truncate">{sub}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
