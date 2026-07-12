"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/kwest/auth";
import { useWalletProvider } from "@/lib/kwest/useWalletProvider";
import {
  fetchAllTasks, fetchTaskSubmissions, getKwestCoreWrite, formatUsdc,
  SUBMISSION_STATUSES, PROOF_TYPES, type TaskData, type SubmissionData,
} from "@/lib/kwest/contracts";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProofDisplay from "@/components/ui/ProofDisplay";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { shortenAddress } from "@/lib/utils/format";

interface TaskWithSubmissions {
  task: TaskData;
  submissions: SubmissionData[];
}

export default function ValidatePage() {
  const { address } = useAuth();
  const { getProvider } = useWalletProvider();
  const [data, setData] = useState<TaskWithSubmissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (address) loadData();
  }, [address]);

  async function loadData() {
    setLoading(true);
    try {
      const allTasks = await fetchAllTasks();
      const myTasks = allTasks.filter(
        (t) => t.creator.toLowerCase() === address!.toLowerCase()
      );
      const results: TaskWithSubmissions[] = [];
      for (const task of myTasks) {
        const subs = await fetchTaskSubmissions(task.id);
        if (subs.length > 0) {
          results.push({ task, submissions: subs });
        }
      }
      setData(results);
    } catch {
      toast.error("Failed to load your quests");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(submissionId: string) {
    setActionLoading(submissionId);
    try {
      const walletProvider = await getProvider();
      const contract = await getKwestCoreWrite(walletProvider);
      const tx = await contract.approveSubmission(submissionId);
      await tx.wait();
      toast.success("Submission approved!");
      loadData();
    } catch (e: unknown) {
      toast.error((e as Error).message?.slice(0, 100) || "Failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(submissionId: string) {
    setActionLoading(submissionId);
    try {
      const walletProvider = await getProvider();
      const contract = await getKwestCoreWrite(walletProvider);
      const tx = await contract.rejectSubmission(submissionId);
      await tx.wait();
      toast.success("Submission rejected");
      loadData();
    } catch (e: unknown) {
      toast.error((e as Error).message?.slice(0, 100) || "Failed");
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = data.reduce(
    (sum, d) => sum + d.submissions.filter((s) => s.status === 0).length, 0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Validation Dashboard</h1>
          <p className="text-sm text-slate-400">
            Review and approve submissions to your quests.
            {pendingCount > 0 && <span className="text-amber-400 ml-2">{pendingCount} pending</span>}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading your quests...
        </div>
      )}

      {!loading && data.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-400 mb-2">No submissions to review.</p>
          <p className="text-sm text-slate-500">Create a quest and wait for participants to submit proof.</p>
          <Link href="/create" className="mt-4 inline-block">
            <Button size="sm">Create Quest</Button>
          </Link>
        </Card>
      )}

      {data.map(({ task, submissions }) => (
        <Card key={task.id} className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <Link href={`/quest/${task.id}`} className="font-semibold text-white hover:text-blue-400">
                {task.title}
              </Link>
              <p className="text-xs text-slate-500 mt-0.5">
                Quest #{task.id} · {formatUsdc(task.rewardPerUser)} USDC/participant · {PROOF_TYPES[task.proofType]} proof
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5" />
              {submissions.length} submission{submissions.length !== 1 && "s"}
            </div>
          </div>

          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-slate-500">
                    {shortenAddress(sub.submitter)} · {new Date(Number(sub.submittedAt) * 1000).toLocaleDateString()}
                  </p>
                  <span className={`inline-flex items-center font-mono text-xs px-2 py-0.5 rounded-full border ${
                    sub.status === 1
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : sub.status === 2
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}>
                    {SUBMISSION_STATUSES[sub.status]}
                  </span>
                </div>
                <div className="mb-3">
                  <ProofDisplay data={sub.proofData} />
                </div>
                {sub.status === 0 && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(sub.id)} disabled={actionLoading === sub.id}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      {actionLoading === sub.id ? "..." : "Approve"}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(sub.id)} disabled={actionLoading === sub.id}>
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      {actionLoading === sub.id ? "..." : "Reject"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
