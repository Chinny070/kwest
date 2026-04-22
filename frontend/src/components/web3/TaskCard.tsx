"use client";

import Link from "next/link";
import { Task } from "@/types";
import { Badge, Progress } from "@/components/ui";
import {
  formatUSDC, formatDeadline, fillPercent, slotsRemaining,
  proofTypeLabel, taskStatusLabel, shortAddress, formatRelative
} from "@/lib/utils";
import { Users, Clock, FileText, ChevronRight, Coins } from "lucide-react";

interface TaskCardProps {
  task: Task;
  showCreatorActions?: boolean;
  workerSubmissionId?: bigint;
}

export function TaskCard({ task, workerSubmissionId }: TaskCardProps) {
  const statusMap: Record<number, "active" | "completed" | "cancelled"> = {
    0: "active", 1: "completed", 2: "cancelled"
  };
  const status   = statusMap[task.status] ?? "active";
  const percent  = fillPercent(task);
  const slots    = slotsRemaining(task);
  const isFull   = slots === BigInt(0);

  const hasSubmitted = workerSubmissionId && workerSubmissionId > BigInt(0);

  return (
    <Link href={`/tasks/${task.id}`} className="block group">
      <div className="glass glass-hover rounded-2xl p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-100 group-hover:text-brand-300 transition-colors truncate text-base">
              {task.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              by {shortAddress(task.creator)} · {formatRelative(task.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge status={status} />
            {hasSubmitted && (
              <span className="text-xs text-brand-400 font-medium">✓ Submitted</span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1">
          {task.description}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center text-center p-2 rounded-xl"
            style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)" }}>
            <Coins size={13} className="text-brand-400 mb-0.5" />
            <span className="text-xs font-bold text-brand-300">${formatUSDC(task.rewardPerSlot)}</span>
            <span className="text-[10px] text-slate-500">/ slot</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 rounded-xl"
            style={{ background: "rgba(100,116,139,0.07)", border: "1px solid rgba(100,116,139,0.15)" }}>
            <Users size={13} className="text-slate-400 mb-0.5" />
            <span className="text-xs font-bold text-slate-200">
              {isFull ? "Full" : `${slots.toString()} left`}
            </span>
            <span className="text-[10px] text-slate-500">{task.totalSlots.toString()} total</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 rounded-xl"
            style={{ background: "rgba(100,116,139,0.07)", border: "1px solid rgba(100,116,139,0.15)" }}>
            <FileText size={13} className="text-slate-400 mb-0.5" />
            <span className="text-xs font-bold text-slate-200">{proofTypeLabel(task.proofType).split(" ")[0]}</span>
            <span className="text-[10px] text-slate-500">proof</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
            <span>{task.filledSlots.toString()} / {task.totalSlots.toString()} slots filled</span>
            <span>{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>

        {/* Deadline & CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={11} />
            <span>{formatDeadline(task.deadline)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-brand-400 group-hover:text-brand-300 transition-colors">
            <span>View quest</span>
            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
