"use client";

import { useState, useEffect } from "react";
import { fetchAllTasks, formatUsdc, PROOF_TYPES, TASK_STATUSES, type TaskData } from "@/lib/kwest/contracts";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Clock, Users, Coins } from "lucide-react";
import { shortenAddress } from "@/lib/utils/format";

function statusBadge(status: number) {
  const styles: Record<number, string> = {
    0: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    2: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return styles[status] || styles[2];
}

export default function BrowseTasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllTasks()
      .then((t) => setTasks(t.reverse()))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Browse Quests</h1>
        <Link href="/create">
          <Button size="sm">+ Create Quest</Button>
        </Link>
      </div>

      {loading && <p className="text-slate-400">Loading quests from Base Sepolia...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}
      {!loading && tasks.length === 0 && !error && (
        <Card className="p-8 text-center">
          <p className="text-slate-400">No quests yet. Be the first to create one!</p>
        </Card>
      )}

      <div className="grid gap-4">
        {tasks.map((task) => {
          const deadlinePassed = Date.now() / 1000 > Number(task.deadline);
          const slotsLeft = Number(task.totalSlots) - Number(task.filledSlots);

          return (
            <Card key={task.id} hover className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white text-lg">{task.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">by {shortenAddress(task.creator)} &middot; Quest #{task.id}</p>
                </div>
                <span className={`inline-flex items-center font-mono text-xs px-2 py-0.5 rounded-full border ${statusBadge(task.status)}`}>
                  {TASK_STATUSES[task.status]}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{task.description}</p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Coins className="w-4 h-4" /> {formatUsdc(task.rewardPerUser)} USDC
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-4 h-4" /> {slotsLeft}/{Number(task.totalSlots)} slots
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-4 h-4" />
                  {deadlinePassed ? <span className="text-red-400">Expired</span> : new Date(Number(task.deadline) * 1000).toLocaleDateString()}
                </div>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{PROOF_TYPES[task.proofType]}</span>
              </div>
              <div className="mt-4">
                <Link href={`/quest/${task.id}`}>
                  <Button size="sm" variant={task.status === 0 && !deadlinePassed && slotsLeft > 0 ? "primary" : "secondary"}>
                    View Quest
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
