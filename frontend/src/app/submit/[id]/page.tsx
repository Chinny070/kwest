"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, Button, PageHeader, Badge, Skeleton } from "@/components/ui";
import {
  useTask, useKwestWrite, useWorkerSubmissionForTask
} from "@/hooks/useKwest";
import { Task } from "@/types";
import {
  formatUSDC, proofTypeLabel, formatDeadline,
  fillPercent, decodeContractError, shortAddress
} from "@/lib/utils";
import { useAccount } from "wagmi";
import { useState } from "react";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Coins, Upload, Link as LinkIcon, FileText, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";

const PROOF_ICONS: Record<number, React.ReactNode> = {
  0: <FileText size={18} />,
  1: <LinkIcon size={18} />,
  2: <Upload size={18} />,
};

const PROOF_PLACEHOLDER: Record<number, string> = {
  0: "Write your proof here (minimum 10 characters)...",
  1: "https://example.com/your-proof-link",
  2: "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (IPFS CID)",
};

const PROOF_HINT: Record<number, string> = {
  0: "Provide a clear text description of what you did.",
  1: "Paste a full URL starting with http:// or https://",
  2: "Upload your screenshot/file to IPFS (e.g. via Pinata or web3.storage) and paste the CID here.",
};

export default function SubmitProofPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = BigInt(params.id as string);
  const { address } = useAccount();

  const { data: task, isLoading } = useTask(taskId);
  const { data: workerSubId } = useWorkerSubmissionForTask(taskId, address);
  const { submitProof, isPending, isConfirming } = useKwestWrite();

  const [proof, setProof] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const t = task as Task | undefined;
  const hasSubmitted = workerSubId && (workerSubId as bigint) > BigInt(0);

  function validateProof(): string {
    const trimmed = proof.trim();
    if (!trimmed) return "Proof cannot be empty.";

    if (t?.proofType === 0) {
      if (trimmed.length < 10) return "Text proof must be at least 10 characters.";
    } else if (t?.proofType === 1) {
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return "Link must start with http:// or https://";
      }
    } else if (t?.proofType === 2) {
      if (!trimmed.startsWith("Qm") && !trimmed.startsWith("bafy")) {
        return "IPFS proof must be a valid CID starting with 'Qm' or 'bafy'.";
      }
      if (trimmed.startsWith("Qm") && trimmed.length < 46) {
        return "CIDv0 hash must be at least 46 characters (starts with 'Qm').";
      }
    }
    return "";
  }

  async function handleSubmit() {
    const validationError = validateProof();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    try {
      await submitProof(taskId, proof.trim());
      setSubmitted(true);
      toast.success("Proof submitted! Awaiting creator review.");
    } catch (e) {
      toast.error(decodeContractError(e));
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-56" />
          <Skeleton className="h-64" />
        </div>
      </AppShell>
    );
  }

  if (!t || t.creator === "0x0000000000000000000000000000000000000000") {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto text-center py-20">
          <p className="text-slate-400">Quest not found.</p>
          <Link href="/tasks"><Button variant="ghost" className="mt-4">Back to quests</Button></Link>
        </div>
      </AppShell>
    );
  }

  const isCreator = t.creator.toLowerCase() === address?.toLowerCase();
  const isFull    = t.filledSlots >= t.totalSlots;
  const isActive  = t.status === 0;
  const canSubmit = !isCreator && isActive && !isFull && !hasSubmitted;

  const statusMap: Record<number, "active" | "completed" | "cancelled"> = {
    0: "active", 1: "completed", 2: "cancelled"
  };

  if (submitted || hasSubmitted) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto">
          <Card className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <h2 className="font-display text-2xl text-white mb-2">Proof Submitted!</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Your proof is now awaiting review by the quest creator. You'll be able to claim your reward once approved.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/claim">
                <Button><Coins size={15} /> Go to Claims</Button>
              </Link>
              <Link href="/tasks">
                <Button variant="ghost">Browse More Quests</Button>
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-xl mx-auto">
        <Link href={`/tasks/${taskId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to quest
        </Link>

        <PageHeader title="Submit Proof" subtitle={`For: ${t.title}`} />

        {/* Quest context */}
        <Card className="mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-slate-200">{t.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">by {shortAddress(t.creator)}</p>
            </div>
            <Badge status={statusMap[t.status] ?? "active"} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2.5 rounded-xl"
              style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)" }}>
              <p className="text-sm font-bold text-brand-300">${formatUSDC(t.rewardPerSlot)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">your reward</p>
            </div>
            <div className="text-center p-2.5 rounded-xl"
              style={{ background: "rgba(100,116,139,0.07)", border: "1px solid rgba(100,116,139,0.15)" }}>
              <p className="text-sm font-bold text-slate-200">{(t.totalSlots - t.filledSlots).toString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">slots left</p>
            </div>
            <div className="text-center p-2.5 rounded-xl"
              style={{ background: "rgba(100,116,139,0.07)", border: "1px solid rgba(100,116,139,0.15)" }}>
              <p className="text-sm font-bold text-slate-200">{formatDeadline(t.deadline)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">deadline</p>
            </div>
          </div>

          {/* What's required */}
          <div className="rounded-xl p-3"
            style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}>
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
              Proof Required ({proofTypeLabel(t.proofType)})
            </p>
            <p className="text-sm text-slate-300">{t.proofRequirements}</p>
          </div>
        </Card>

        {/* Block reasons */}
        {isCreator && (
          <Card className="mb-5">
            <div className="flex items-center gap-2 text-amber-400">
              <Shield size={16} />
              <p className="text-sm font-medium">You created this quest and cannot submit proof.</p>
            </div>
          </Card>
        )}
        {!isActive && !isCreator && (
          <Card className="mb-5">
            <p className="text-sm text-slate-400">This quest is no longer active.</p>
          </Card>
        )}
        {isFull && !isCreator && isActive && (
          <Card className="mb-5">
            <p className="text-sm text-slate-400">All slots are filled for this quest.</p>
          </Card>
        )}

        {/* Proof form */}
        {canSubmit && (
          <Card>
            <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              {PROOF_ICONS[t.proofType]}
              Your {proofTypeLabel(t.proofType)} Proof
            </h2>

            {t.proofType === 0 ? (
              <div className="space-y-1.5 mb-5">
                <label className="block text-sm font-medium text-slate-300">Proof (Text)</label>
                <textarea
                  className="input-field resize-none"
                  rows={6}
                  placeholder={PROOF_PLACEHOLDER[0]}
                  value={proof}
                  onChange={e => { setProof(e.target.value); setError(""); }}
                />
                <p className="text-xs text-slate-500">{PROOF_HINT[0]}</p>
              </div>
            ) : (
              <div className="space-y-1.5 mb-5">
                <label className="block text-sm font-medium text-slate-300">
                  {t.proofType === 1 ? "Proof URL" : "IPFS CID"}
                </label>
                <input
                  className="input-field"
                  placeholder={PROOF_PLACEHOLDER[t.proofType]}
                  value={proof}
                  onChange={e => { setProof(e.target.value); setError(""); }}
                />
                <p className="text-xs text-slate-500">{PROOF_HINT[t.proofType]}</p>
                {t.proofType === 2 && (
                  <p className="text-xs text-slate-600 mt-1">
                    💡 Upload to Pinata (pinata.cloud) or web3.storage for free IPFS hosting.
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400 mb-4 flex items-center gap-1.5">
                <Shield size={13} /> {error}
              </p>
            )}

            <Button
              size="lg"
              className="w-full"
              loading={isPending || isConfirming}
              onClick={handleSubmit}
            >
              <Upload size={17} />
              Submit Proof Onchain
            </Button>

            <p className="text-center text-xs text-slate-500 mt-3">
              Proof is stored onchain. You cannot resubmit after this action.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
