"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/lib/kwest/auth";
import {
  fetchTask, fetchTaskSubmissions, fetchUserSubmission,
  getKwestCoreWrite, formatUsdc, PROOF_TYPES, TASK_STATUSES,
  SUBMISSION_STATUSES, type TaskData, type SubmissionData,
} from "@/lib/kwest/contracts";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { toast } from "sonner";
import { ArrowLeft, Clock, Users, Coins, User, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { shortenAddress } from "@/lib/utils/format";

export default function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address } = useAuth();
  const [task, setTask] = useState<TaskData | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [mySubmission, setMySubmission] = useState<SubmissionData | null>(null);
  const [proofData, setProofData] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const taskId = parseInt(id);
  const isCreator = task && address && task.creator.toLowerCase() === address.toLowerCase();

  useEffect(() => { loadData(); }, [id, address]);

  async function loadData() {
    setLoading(true);
    try {
      const t = await fetchTask(taskId);
      setTask(t);
      if (address) {
        const mySub = await fetchUserSubmission(taskId, address);
        setMySubmission(mySub);
      }
      if (t.creator.toLowerCase() === address?.toLowerCase()) {
        const subs = await fetchTaskSubmissions(taskId);
        setSubmissions(subs);
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message?.slice(0, 100) || "Failed to load quest");
    } finally { setLoading(false); }
  }

  async function handleSubmitProof() {
    if (!address) return toast.error("Connect wallet first");
    if (!proofData.trim()) return toast.error("Enter your proof");
    setSubmitting(true);
    try {
      const contract = await getKwestCoreWrite();
      const tx = await contract.submitProof(taskId, proofData);
      toast.info("Submitting proof...");
      await tx.wait();
      toast.success("Proof submitted!");
      setProofData("");
      loadData();
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message?.slice(0, 100) || "Submission failed");
    } finally { setSubmitting(false); }
  }

  async function handleApprove(submissionId: string) {
    setActionLoading(submissionId);
    try {
      const contract = await getKwestCoreWrite();
      const tx = await contract.approveSubmission(submissionId);
      await tx.wait();
      toast.success("Submission approved!");
      loadData();
    } catch (e: unknown) { toast.error((e as Error).message?.slice(0, 100) || "Failed"); }
    finally { setActionLoading(null); }
  }

  async function handleReject(submissionId: string) {
    setActionLoading(submissionId);
    try {
      const contract = await getKwestCoreWrite();
      const tx = await contract.rejectSubmission(submissionId);
      await tx.wait();
      toast.success("Submission rejected");
      loadData();
    } catch (e: unknown) { toast.error((e as Error).message?.slice(0, 100) || "Failed"); }
    finally { setActionLoading(null); }
  }

  if (loading) return <div className="text-center py-20 text-slate-400">Loading quest...</div>;
  if (!task) return <div className="text-center py-20 text-red-400">Quest not found</div>;

  const deadlinePassed = Date.now() / 1000 > Number(task.deadline);
  const slotsLeft = Number(task.totalSlots) - Number(task.filledSlots);
  const canSubmit = task.status === 0 && !deadlinePassed && slotsLeft > 0 && !isCreator && !mySubmission;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/browse" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Quests
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{task.title}</h1>
          <p className="text-sm text-slate-500">Quest #{task.id} by {shortenAddress(task.creator)}</p>
        </div>
        <span className={`inline-flex items-center font-mono text-xs px-3 py-1 rounded-full border ${
          task.status === 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            : task.status === 1 ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
            : "bg-red-500/20 text-red-400 border-red-500/30"
        }`}>{TASK_STATUSES[task.status]}</span>
      </div>

      <Card className="p-6">
        <p className="text-slate-300 mb-6 leading-relaxed">{task.description}</p>
        {task.requirements && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Requirements</h3>
            <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg">{task.requirements}</p>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Coins className="w-3.5 h-3.5" /> Reward Pool</div>
            <p className="font-semibold text-white">{formatUsdc(task.rewardPool)} USDC</p>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><User className="w-3.5 h-3.5" /> Per Participant</div>
            <p className="font-semibold text-blue-400">{formatUsdc(task.rewardPerUser)} USDC</p>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Users className="w-3.5 h-3.5" /> Slots</div>
            <p className="font-semibold text-white">{slotsLeft} / {Number(task.totalSlots)} remaining</p>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Clock className="w-3.5 h-3.5" /> Deadline</div>
            <p className={`font-semibold ${deadlinePassed ? "text-red-400" : "text-white"}`}>
              {deadlinePassed ? "Expired" : new Date(Number(task.deadline) * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
          <span>Proof: <span className="text-slate-300">{PROOF_TYPES[task.proofType]}</span></span>
          <span>Approved: <span className="text-slate-300">{Number(task.approvedCount)}</span></span>
          <span>Submitted: <span className="text-slate-300">{Number(task.filledSlots)}</span></span>
        </div>
      </Card>

      {mySubmission && (
        <Card className="p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Your Submission</h3>
          <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
            <p className="text-sm text-slate-300 break-all">{mySubmission.proofData}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center font-mono text-xs px-2 py-0.5 rounded-full border ${
              mySubmission.status === 1 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : mySubmission.status === 2 ? "bg-red-500/20 text-red-400 border-red-500/30"
                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            }`}>{SUBMISSION_STATUSES[mySubmission.status]}</span>
            {mySubmission.status === 1 && !mySubmission.claimed && <Link href="/claim"><Button size="sm">Claim Reward</Button></Link>}
            {mySubmission.claimed && <span className="text-xs text-blue-400">Reward claimed</span>}
          </div>
        </Card>
      )}

      {canSubmit && (
        <Card className="p-6">
          <h3 className="font-semibold text-white mb-3">Submit Your Proof</h3>
          <p className="text-sm text-slate-400 mb-4">Submit {PROOF_TYPES[task.proofType].toLowerCase()} proof to complete this quest.</p>
          {task.proofType === 0 ? (
            <Textarea value={proofData} onChange={(e) => setProofData(e.target.value)} placeholder="Enter your proof text..." />
          ) : (
            <Input value={proofData} onChange={(e) => setProofData(e.target.value)} placeholder={task.proofType === 2 ? "QmYour...IPFSHash" : "https://..."} />
          )}
          <Button onClick={handleSubmitProof} disabled={submitting} className="mt-4 w-full">
            {submitting ? "Submitting..." : "Submit Proof"}
          </Button>
        </Card>
      )}

      {isCreator && submissions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-white mb-4">Submissions ({submissions.length})</h3>
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-slate-500">{shortenAddress(sub.submitter)} &middot; {new Date(Number(sub.submittedAt) * 1000).toLocaleDateString()}</p>
                  <span className={`inline-flex items-center font-mono text-xs px-2 py-0.5 rounded-full border ${
                    sub.status === 1 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : sub.status === 2 ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}>{SUBMISSION_STATUSES[sub.status]}</span>
                </div>
                <p className="text-sm text-slate-300 break-all mb-3">{sub.proofData}</p>
                {sub.status === 0 && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(sub.id)} disabled={actionLoading === sub.id}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(sub.id)} disabled={actionLoading === sub.id}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
