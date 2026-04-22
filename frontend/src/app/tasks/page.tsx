"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Button, Skeleton, EmptyState, Input } from "@/components/ui";
import { useTaskIds, useTask, useWorkerSubmissionForTask } from "@/hooks/useKwest";
import { TaskCard } from "@/components/web3/TaskCard";
import { Task } from "@/types";
import { Plus, Search, Swords, Filter } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useAccount } from "wagmi";

function TaskCardWrapper({ taskId, address }: { taskId: bigint; address?: `0x${string}` }) {
  const { data: task } = useTask(taskId);
  const { data: workerSubId } = useWorkerSubmissionForTask(
    task ? taskId : undefined,
    address
  );
  if (!task) return <Skeleton className="h-64" />;
  return <TaskCard task={task as Task} workerSubmissionId={workerSubId as bigint | undefined} />;
}

export default function TasksPage() {
  const { data, isLoading } = useTaskIds(0n, 100n);
  const { address } = useAccount();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");

  const allIds = useMemo(() => {
    if (!data) return [];
    const [ids] = data as [bigint[], bigint];
    return [...ids].reverse(); // newest first
  }, [data]);

  return (
    <AppShell>
      <PageHeader
        title="Browse Quests"
        subtitle="Find tasks to complete and earn USDC rewards"
        action={
          <Link href="/tasks/new">
            <Button><Plus size={16} /> Create Quest</Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input-field pl-9"
            placeholder="Search quests…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "completed"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === s
                  ? "bg-brand-500/20 border border-brand-500/30 text-brand-300"
                  : "glass text-slate-400 hover:text-slate-200"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Task grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : allIds.length === 0 ? (
        <EmptyState
          icon={<Swords size={24} />}
          title="No quests yet"
          description="Be the first to create a quest and kick off the ecosystem."
          action={
            <Link href="/tasks/new">
              <Button>Create the First Quest</Button>
            </Link>
          }
        />
      ) : (
        <TaskGridWithFilter ids={allIds} address={address} search={search} statusFilter={statusFilter} />
      )}
    </AppShell>
  );
}

function TaskGridWithFilter({
  ids, address, search, statusFilter
}: {
  ids: bigint[];
  address?: `0x${string}`;
  search: string;
  statusFilter: "all" | "active" | "completed";
}) {
  // We render all cards but each fetches its own data
  // Filter happens via TaskFilterItem which reads task data
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
      {ids.map(id => (
        <TaskFilterItem
          key={id.toString()}
          taskId={id}
          address={address}
          search={search}
          statusFilter={statusFilter}
        />
      ))}
    </div>
  );
}

function TaskFilterItem({
  taskId, address, search, statusFilter
}: {
  taskId: bigint;
  address?: `0x${string}`;
  search: string;
  statusFilter: string;
}) {
  const { data: task } = useTask(taskId);
  const { data: workerSubId } = useWorkerSubmissionForTask(task ? taskId : undefined, address);

  if (!task) return <Skeleton className="h-64 animate-fade-in" />;

  const t = task as Task;

  // Filter by search
  if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
      !t.description.toLowerCase().includes(search.toLowerCase())) {
    return null;
  }

  // Filter by status
  if (statusFilter === "active" && t.status !== 0) return null;
  if (statusFilter === "completed" && t.status !== 1) return null;

  return (
    <div className="animate-slide-up">
      <TaskCard task={t} workerSubmissionId={workerSubId as bigint | undefined} />
    </div>
  );
}
