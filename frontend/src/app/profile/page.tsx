"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, PageHeader, StatCard, Badge, Button, Skeleton } from "@/components/ui";
import {
  useCreatorTasks, useWorkerSubmissions, useUSDCBalance,
  useTask, useSubmission
} from "@/hooks/useKwest";
import { Task, Submission } from "@/types";
import { formatUSDC, shortAddress, formatTimestamp, fillPercent } from "@/lib/utils";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import {
  User, Coins, Swords, CheckSquare, Copy, CheckCheck,
  ExternalLink, Shield, Wallet
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

function MiniTaskRow({ taskId }: { taskId: bigint }) {
  const { data: task } = useTask(taskId);
  if (!task) return <div className="shimmer h-10 rounded-lg" />;
  const t = task as Task;
  const statusMap: Record<number, "active" | "completed" | "cancelled"> = { 0: "active", 1: "completed", 2: "cancelled" };
  return (
    <Link href={`/tasks/${t.id}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/40 transition-colors group">
      <span className="text-sm text-slate-300 group-hover:text-brand-300 truncate flex-1 mr-3">{t.title}</span>
      <div className="flex items-center gap-2">
        <Badge status={statusMap[t.status] ?? "active"} />
        <span className="text-xs text-brand-400 font-mono">${formatUSDC(t.rewardPerSlot)}</span>
      </div>
    </Link>
  );
}

function MiniSubRow({ submissionId }: { submissionId: bigint }) {
  const { data: sub } = useSubmission(submissionId);
  const { data: task } = useTask(sub ? (sub as Submission).taskId : undefined);
  if (!sub || !task) return <div className="shimmer h-10 rounded-lg" />;
  const s = sub as Submission;
  const t = task as Task;
  const statusMap: Record<number, "pending" | "approved" | "rejected"> = { 0: "pending", 1: "approved", 2: "rejected" };
  return (
    <Link href={`/tasks/${t.id}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/40 transition-colors group">
      <span className="text-sm text-slate-300 group-hover:text-brand-300 truncate flex-1 mr-3">{t.title}</span>
      <div className="flex items-center gap-2">
        <Badge status={statusMap[s.status] ?? "pending"} />
        {s.status === 1 && !s.claimed && <span className="text-xs text-green-400">→ Claim</span>}
        {s.claimed && <span className="text-xs text-slate-500">Paid</span>}
      </div>
    </Link>
  );
}

export default function ProfilePage() {
  const { address } = useAccount();
  const { user, logout } = usePrivy();
  const [copied, setCopied] = useState(false);

  const { data: creatorTaskIds, isLoading: loadingTasks } = useCreatorTasks(address);
  const { data: workerSubIds, isLoading: loadingSubs }  = useWorkerSubmissions(address);
  const { data: usdcBalance } = useUSDCBalance(address);

  const taskIds = (creatorTaskIds as bigint[] | undefined) ?? [];
  const subIds  = (workerSubIds  as bigint[] | undefined) ?? [];

  const recentTaskIds = [...taskIds].reverse().slice(0, 5);
  const recentSubIds  = [...subIds].reverse().slice(0, 5);

  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <AppShell>
      <PageHeader title="My Profile" subtitle="Your Kwest account overview" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: identity */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar + address */}
          <Card glow>
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))", border: "2px solid rgba(251,191,36,0.25)" }}>
                <User size={28} className="text-brand-400" />
              </div>

              {address ? (
                <>
                  <p className="font-mono text-sm text-slate-300 mb-1">{shortAddress(address, 6)}</p>
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-400 transition-colors"
                  >
                    {copied ? <CheckCheck size={12} className="text-green-400" /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy address"}
                  </button>
                </>
              ) : (
                <p className="text-slate-500 text-sm">Not connected</p>
              )}

              {user?.email?.address && (
                <p className="text-xs text-slate-500 mt-2">{user.email.address}</p>
              )}

              {/* Basescan link */}
              {address && (
                <a
                  href={`https://sepolia.basescan.org/address/${address}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-3"
                >
                  View on Basescan <ExternalLink size={11} />
                </a>
              )}
            </div>
          </Card>

          {/* Balance */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Coins size={13} className="text-brand-400" />
              Balances
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">USDC</span>
                <span className="font-semibold text-slate-200">
                  {usdcBalance !== undefined ? `$${formatUSDC(usdcBalance as bigint)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Network</span>
                <span className="text-sm text-slate-300">Base Sepolia</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Get testnet USDC from Circle's faucet or deploy MockUSDC.
            </p>
          </Card>

          {/* Quick links */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield size={13} className="text-brand-400" />
              Quick Links
            </h3>
            <div className="space-y-1">
              <Link href="/tasks/new" className="nav-link text-sm">
                <Swords size={14} /> Create a Quest
              </Link>
              <Link href="/validate" className="nav-link text-sm">
                <CheckSquare size={14} /> Review Submissions
              </Link>
              <Link href="/claim" className="nav-link text-sm">
                <Coins size={14} /> Claim Rewards
              </Link>
            </div>
          </Card>
        </div>

        {/* Right: activity */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Quests Created"
              value={taskIds.length}
              icon={<Swords size={17} />}
              sub="as creator"
              color="blue"
            />
            <StatCard
              label="Work Submitted"
              value={subIds.length}
              icon={<CheckSquare size={17} />}
              sub="as worker"
              color="green"
            />
          </div>

          {/* Recent quests created */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                <Swords size={15} className="text-brand-400" />
                Quests Created
              </h2>
              <Link href="/validate" className="text-xs text-brand-400 hover:text-brand-300">
                Validate →
              </Link>
            </div>
            {loadingTasks ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : recentTaskIds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mb-3">No quests created yet.</p>
                <Link href="/tasks/new">
                  <Button size="sm">Create Your First Quest</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTaskIds.map(id => <MiniTaskRow key={id.toString()} taskId={id} />)}
                {taskIds.length > 5 && (
                  <p className="text-xs text-slate-500 text-center pt-2">
                    + {taskIds.length - 5} more quests
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Recent submissions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                <CheckSquare size={15} className="text-green-400" />
                My Submissions
              </h2>
              <Link href="/claim" className="text-xs text-brand-400 hover:text-brand-300">
                Claim rewards →
              </Link>
            </div>
            {loadingSubs ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : recentSubIds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mb-3">No submissions yet.</p>
                <Link href="/tasks">
                  <Button size="sm" variant="ghost">Browse Quests</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentSubIds.map(id => <MiniSubRow key={id.toString()} submissionId={id} />)}
                {subIds.length > 5 && (
                  <p className="text-xs text-slate-500 text-center pt-2">
                    + {subIds.length - 5} more submissions
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
