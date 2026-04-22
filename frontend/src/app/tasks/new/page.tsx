"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, Button, Input, Textarea, Select, PageHeader } from "@/components/ui";
import { useKwestWrite, useApproveUSDC, useUSDCAllowance, useUSDCBalance, useQuoteTask } from "@/hooks/useKwest";
import { parseUSDC, formatUSDC, decodeContractError } from "@/lib/utils";
import { KWEST_ADDRESS } from "@/lib/contracts";
import { useAccount } from "wagmi";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Coins, Info, ChevronRight, ArrowLeft, AlertTriangle,
  Zap, Shield, HelpCircle
} from "lucide-react";
import Link from "next/link";

const PROOF_TYPE_OPTIONS = [
  { value: 0, label: "Text — Written description" },
  { value: 1, label: "Link — URL to proof" },
  { value: 2, label: "IPFS — Screenshot / file hash" },
];

const FEE_MODE_OPTIONS = [
  { value: "top-up", label: "I pay $100 + 2% fee = $102 total (reward pool: $100)" },
  { value: "deduct", label: "I pay $100 and 2% is deducted = $98 reward pool" },
];

type FeeMode = "top-up" | "deduct";

export default function CreateTaskPage() {
  const router = useRouter();
  const { address } = useAccount();

  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [proofReq, setProofReq] = useState("");
  const [proofType, setProofType] = useState(0);
  const [reward, setReward]     = useState("");
  const [slots, setSlots]       = useState("1");
  const [deadline, setDeadline] = useState("");
  const [feeMode, setFeeMode]   = useState<FeeMode>("top-up");
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const rewardBig = useMemo(() => parseUSDC(reward || "0"), [reward]);
  const slotsBig  = useMemo(() => BigInt(Math.max(1, parseInt(slots) || 1)), [slots]);
  const deductFee = feeMode === "deduct";

  const { data: quote } = useQuoteTask(rewardBig, slotsBig, deductFee);
  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: usdcAllowance } = useUSDCAllowance(address);

  const { createTask, isPending: isCreating, isConfirming: isConfirmingCreate } = useKwestWrite();
  const { approve, isPending: isApproving, isConfirming: isConfirmingApprove } = useApproveUSDC();

  const needsApproval = useMemo(() => {
    if (!quote || !usdcAllowance) return true;
    const [transferAmount] = quote as [bigint, bigint, bigint, bigint];
    return (usdcAllowance as bigint) < transferAmount;
  }, [quote, usdcAllowance]);

  const quoteData = useMemo(() => {
    if (!quote) return null;
    const [transferAmount, rewardPool, fee, effectiveRewardPerSlot] = quote as [bigint, bigint, bigint, bigint];
    return { transferAmount, rewardPool, fee, effectiveRewardPerSlot };
  }, [quote]);

  const balanceOk = useMemo(() => {
    if (!usdcBalance || !quoteData) return true;
    return (usdcBalance as bigint) >= quoteData.transferAmount;
  }, [usdcBalance, quoteData]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (title.length > 80) e.title = "Title too long (max 80 chars)";
    if (!desc.trim()) e.desc = "Description is required";
    if (!proofReq.trim()) e.proofReq = "Proof requirements are required";
    const r = parseFloat(reward);
    if (!reward || isNaN(r) || r < 0.5) e.reward = "Minimum reward is $0.50 per slot";
    const s = parseInt(slots);
    if (!slots || isNaN(s) || s < 1) e.slots = "At least 1 slot required";
    if (s > 500) e.slots = "Maximum 500 slots";
    if (r < 5 && s > 10) e.slots = "For rewards under $5/slot, max 10 slots";
    if (deadline) {
      const d = new Date(deadline).getTime();
      if (d <= Date.now()) e.deadline = "Deadline must be in the future";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleApprove() {
    try {
      await approve();
      toast.success("USDC approved! Now you can create the quest.");
    } catch (e) {
      toast.error(decodeContractError(e));
    }
  }

  async function handleCreate() {
    if (!validate()) return;

    const deadlineTs = deadline
      ? BigInt(Math.floor(new Date(deadline).getTime() / 1000))
      : BigInt(0);

    try {
      const hash = await createTask({
        title:            title.trim(),
        description:      desc.trim(),
        proofRequirements: proofReq.trim(),
        proofType,
        rewardPerSlot:    rewardBig,
        totalSlots:       slotsBig,
        deadline:         deadlineTs,
        deductFeeFromPool: deductFee,
      });
      toast.success("Quest created! Funds locked onchain.");
      router.push("/validate");
    } catch (e) {
      toast.error(decodeContractError(e));
    }
  }

  const isLoading = isCreating || isConfirmingCreate || isApproving || isConfirmingApprove;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to quests
        </Link>

        <PageHeader
          title="Create a Quest"
          subtitle="Post a task, lock USDC rewards, and get it done."
        />

        <div className="space-y-5">
          {/* Quest Details */}
          <Card>
            <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Zap size={15} className="text-brand-400" />
              Quest Details
            </h2>
            <div className="space-y-4">
              <Input
                label="Quest Title"
                placeholder="e.g. Share our post on Twitter"
                value={title}
                onChange={e => setTitle(e.target.value)}
                error={errors.title}
                maxLength={80}
              />
              <Textarea
                label="Description"
                placeholder="Describe exactly what workers need to do..."
                rows={4}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                error={errors.desc}
              />
            </div>
          </Card>

          {/* Proof Requirements */}
          <Card>
            <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Shield size={15} className="text-brand-400" />
              Proof Requirements
            </h2>
            <div className="space-y-4">
              <Select
                label="Proof Type"
                value={proofType}
                onChange={e => setProofType(Number(e.target.value))}
                options={PROOF_TYPE_OPTIONS}
              />
              <Textarea
                label="What proof must workers submit?"
                placeholder={
                  proofType === 0 ? "e.g. Write a 100-word description of what you did..." :
                  proofType === 1 ? "e.g. Paste a link to your public post on platform X..." :
                  "e.g. Upload a screenshot to IPFS and paste the CID (Qm... or bafy...)"
                }
                rows={3}
                value={proofReq}
                onChange={e => setProofReq(e.target.value)}
                error={errors.proofReq}
              />
            </div>
          </Card>

          {/* Reward & Slots */}
          <Card>
            <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Coins size={15} className="text-brand-400" />
              Reward & Slots
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Reward per slot (USDC)"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="10.00"
                  value={reward}
                  onChange={e => setReward(e.target.value)}
                  error={errors.reward}
                  hint="Minimum $0.50"
                />
                <Input
                  label="Number of slots"
                  type="number"
                  min="1"
                  max="500"
                  placeholder="1"
                  value={slots}
                  onChange={e => setSlots(e.target.value)}
                  error={errors.slots}
                  hint={parseFloat(reward) < 5 ? "Max 10 for rewards under $5" : "Max 500"}
                />
              </div>

              {/* Fee mode */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fee Payment Mode
                  <span className="ml-1.5 text-xs text-slate-500">(Platform takes 2%)</span>
                </label>
                <div className="space-y-2">
                  {(["top-up", "deduct"] as FeeMode[]).map(mode => (
                    <label
                      key={mode}
                      className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${
                        feeMode === mode
                          ? "border border-brand-500/40 bg-brand-500/8"
                          : "glass hover:border-slate-600"
                      }`}
                      style={feeMode === mode ? { background: "rgba(245,158,11,0.06)" } : {}}
                    >
                      <input
                        type="radio"
                        className="mt-0.5 accent-amber-500"
                        checked={feeMode === mode}
                        onChange={() => setFeeMode(mode)}
                      />
                      <div>
                        <p className="text-sm text-slate-200 font-medium">
                          {mode === "top-up" ? "Pay reward + fee on top" : "Deduct fee from pool"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {mode === "top-up"
                            ? "You pay the reward pool + 2% fee separately. Workers get the full amount."
                            : "You pay only the reward amount. 2% is deducted, so workers get slightly less."}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Deadline (optional)"
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                error={errors.deadline}
                hint="Leave blank for no deadline"
              />
            </div>
          </Card>

          {/* Quote summary */}
          {quoteData && rewardBig > 0n && slotsBig > 0n && (
            <Card>
              <h2 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Info size={15} className="text-brand-400" />
                Cost Summary
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Reward per slot</span>
                  <span className="text-slate-200">${formatUSDC(quoteData.effectiveRewardPerSlot)} USDC</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total reward pool</span>
                  <span className="text-slate-200">${formatUSDC(quoteData.rewardPool)} USDC</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform fee (2%)</span>
                  <span className="text-slate-200">${formatUSDC(quoteData.fee)} USDC</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold"
                  style={{ borderColor: "rgba(251,191,36,0.15)" }}>
                  <span className="text-slate-200">You transfer total</span>
                  <span className="text-brand-400 text-base">${formatUSDC(quoteData.transferAmount)} USDC</span>
                </div>
              </div>

              {/* Balance warning */}
              {usdcBalance !== undefined && !balanceOk && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">
                    Insufficient USDC balance. You have ${formatUSDC(usdcBalance as bigint)} but need ${formatUSDC(quoteData.transferAmount)}.
                    Get testnet USDC from a faucet.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {needsApproval ? (
              <Button
                size="lg"
                className="w-full"
                loading={isApproving || isConfirmingApprove}
                onClick={handleApprove}
                disabled={!rewardBig || !slotsBig}
              >
                <Shield size={17} />
                Approve USDC Spending
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full"
                loading={isLoading}
                onClick={handleCreate}
                disabled={!balanceOk}
              >
                <Zap size={17} />
                Create Quest & Lock Funds
                <ChevronRight size={17} />
              </Button>
            )}
            <p className="text-center text-xs text-slate-500">
              USDC will be locked in the smart contract until rewards are paid or you cancel the quest.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
