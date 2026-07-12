"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/kwest/auth";
import {
  fetchAllTasks, fetchUserSubmission, formatUsdc,
  type TaskData, type SubmissionData,
} from "@/lib/kwest/contracts";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {
  LayoutDashboard, Target, CheckCircle, Clock, XCircle,
  Coins, Gift, Compass, Plus, Loader2, ArrowRight,
} from "lucide-react";

interface DashboardStats {
  questsCreated: number;
  questsCompleted: number;
  pendingSubs: number;
  approvedSubs: number;
  rejectedSubs: number;
  totalEarned: bigint;
  claimableBalance: bigint;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  taskTitle: string;
  taskId: number;
  status: number;
  claimed: boolean;
  submittedAt: bigint;
  rewardPerUser: bigint;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { address, userLabel } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) loadStats();
  }, [address]);

  async function loadStats() {
    setLoading(true);
    try {
      const tasks = await fetchAllTasks();
      const created = tasks.filter((t) => t.creator.toLowerCase() === address!.toLowerCase());

      let pending = 0, approved = 0, rejected = 0;
      let totalEarned = BigInt(0);
      let claimable = BigInt(0);
      const activity: ActivityItem[] = [];

      for (const task of tasks) {
        const sub = await fetchUserSubmission(task.id, address!);
        if (!sub) continue;

        if (sub.status === 0) pending++;
        if (sub.status === 1) {
          approved++;
          totalEarned += task.rewardPerUser;
          if (!sub.claimed) claimable += task.rewardPerUser;
        }
        if (sub.status === 2) rejected++;

        activity.push({
          taskTitle: task.title,
          taskId: task.id,
          status: sub.status,
          claimed: sub.claimed,
          submittedAt: sub.submittedAt,
          rewardPerUser: task.rewardPerUser,
        });
      }

      activity.sort((a, b) => Number(b.submittedAt) - Number(a.submittedAt));

      setStats({
        questsCreated: created.length,
        questsCompleted: approved,
        pendingSubs: pending,
        approvedSubs: approved,
        rejectedSubs: rejected,
        totalEarned,
        claimableBalance: claimable,
        recentActivity: activity.slice(0, 8),
      });
    } catch {}
    setLoading(false);
  }

  const statusBadge = (status: number, claimed: boolean) => {
    if (status === 1 && claimed) return { text: "Claimed", style: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    if (status === 1) return { text: "Approved", style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    if (status === 2) return { text: "Rejected", style: "bg-red-500/20 text-red-400 border-red-500/30" };
    return { text: "Pending", style: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-20 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {userLabel && (
              <p className="text-sm text-slate-500 truncate max-w-[300px]">{userLabel}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/browse"><Button size="sm" variant="secondary"><Compass className="w-4 h-4 mr-1" /> Browse</Button></Link>
          <Link href="/create"><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Create Quest</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Target} label="Quests Created" value={stats?.questsCreated ?? 0} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={CheckCircle} label="Quests Completed" value={stats?.questsCompleted ?? 0} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard icon={Clock} label="Pending" value={stats?.pendingSubs ?? 0} color="bg-amber-500/10 text-amber-400" />
        <StatCard icon={XCircle} label="Rejected" value={stats?.rejectedSubs ?? 0} color="bg-red-500/10 text-red-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <Coins className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-slate-400">Total Rewards Earned</p>
          </div>
          <p className="text-3xl font-bold text-white mt-2">
            {formatUsdc(stats?.totalEarned ?? BigInt(0))} <span className="text-blue-400 text-lg">USDC</span>
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <Gift className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-slate-400">Claimable Balance</p>
          </div>
          <p className="text-3xl font-bold text-white mt-2">
            {formatUsdc(stats?.claimableBalance ?? BigInt(0))} <span className="text-blue-400 text-lg">USDC</span>
          </p>
          {stats && stats.claimableBalance > BigInt(0) && (
            <Link href="/claim" className="mt-3 inline-block">
              <Button size="sm">Claim Now <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
            </Link>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-white mb-4">Recent Activity</h2>
        {stats && stats.recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-3">No activity yet. Start by completing a quest!</p>
            <Link href="/browse"><Button size="sm" variant="secondary">Browse Quests</Button></Link>
          </div>
        ) : (
          <div className="space-y-2">
            {stats?.recentActivity.map((item, i) => {
              const badge = statusBadge(item.status, item.claimed);
              return (
                <Link
                  key={i}
                  href={`/quest/${item.taskId}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 transition-colors gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.taskTitle}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(Number(item.submittedAt) * 1000).toLocaleDateString()} · {formatUsdc(item.rewardPerUser)} USDC
                    </p>
                  </div>
                  <span className={`inline-flex items-center font-mono text-xs px-2 py-0.5 rounded-full border self-start ${badge.style}`}>
                    {badge.text}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
