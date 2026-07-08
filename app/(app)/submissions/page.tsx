"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/kwest/auth";
import {
  fetchAllTasks, fetchUserSubmission, formatUsdc,
  SUBMISSION_STATUSES, type SubmissionData,
} from "@/lib/kwest/contracts";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FileText, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface SubmissionWithTask extends SubmissionData {
  taskTitle: string;
  rewardPerUser: bigint;
}

export default function MySubmissionsPage() {
  const { address } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionWithTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    loadSubmissions();
  }, [address]);

  async function loadSubmissions() {
    setLoading(true);
    try {
      const tasks = await fetchAllTasks();
      const results: SubmissionWithTask[] = [];
      for (const task of tasks) {
        const sub = await fetchUserSubmission(task.id, address!);
        if (sub) {
          results.push({ ...sub, taskTitle: task.title, rewardPerUser: task.rewardPerUser });
        }
      }
      results.sort((a, b) => Number(b.submittedAt) - Number(a.submittedAt));
      setSubmissions(results);
    } catch {}
    setLoading(false);
  }

  const statusIcon = (status: number) => {
    if (status === 1) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (status === 2) return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  const statusStyle = (status: number) => {
    if (status === 1) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (status === 2) return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">My Submissions</h1>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading submissions...
        </div>
      )}

      {!loading && submissions.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-400 mb-4">You haven&apos;t submitted proof to any quests yet.</p>
          <Link href="/browse">
            <Button size="sm">Browse Quests</Button>
          </Link>
        </Card>
      )}

      {!loading && submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <Card key={sub.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Link href={`/quest/${sub.taskId}`} className="font-medium text-white hover:text-blue-400 transition-colors">
                    {sub.taskTitle}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submitted {new Date(Number(sub.submittedAt) * 1000).toLocaleDateString()}
                    {" · "}{formatUsdc(sub.rewardPerUser)} USDC reward
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full border ${statusStyle(sub.status)}`}>
                    {statusIcon(sub.status)}
                    {SUBMISSION_STATUSES[sub.status]}
                  </span>
                  {sub.status === 1 && !sub.claimed && (
                    <Link href="/claim">
                      <Button size="sm">Claim</Button>
                    </Link>
                  )}
                  {sub.claimed && (
                    <span className="text-xs text-blue-400 font-medium">Claimed</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
