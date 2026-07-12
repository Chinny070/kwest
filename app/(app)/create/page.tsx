"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/kwest/auth";
import { useWalletProvider } from "@/lib/kwest/useWalletProvider";
import { getKwestCoreWrite, ensureUsdcApproval, parseUsdc, PLATFORM_FEE_BPS } from "@/lib/kwest/contracts";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import { toast } from "sonner";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateTaskPage() {
  const { address } = useAuth();
  const { getProvider } = useWalletProvider();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [proofType, setProofType] = useState("0");
  const [rewardPool, setRewardPool] = useState("");
  const [totalSlots, setTotalSlots] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("7");
  const [loading, setLoading] = useState(false);

  const calculations = useMemo(() => {
    const pool = parseFloat(rewardPool) || 0;
    const slots = parseInt(totalSlots) || 0;
    const perUser = slots > 0 ? pool / slots : 0;
    const fee = pool * (PLATFORM_FEE_BPS / 10000);
    const total = pool + fee;
    const minRewardMet = perUser >= 1 || pool === 0;
    return { pool, slots, perUser, fee, total, minRewardMet };
  }, [rewardPool, totalSlots]);

  async function handleCreate() {
    if (!address) return toast.error("Connect wallet first");
    if (!title || !description || !rewardPool || !totalSlots) return toast.error("Fill in all required fields");
    if (!calculations.minRewardMet) return toast.error("Minimum reward is 1 USDC per participant");

    setLoading(true);
    try {
      const poolAmount = parseUsdc(rewardPool);
      const totalAmount = poolAmount + (poolAmount * BigInt(PLATFORM_FEE_BPS) / BigInt(10000));
      const slots = parseInt(totalSlots);
      const deadline = Math.floor(Date.now() / 1000) + parseInt(deadlineDays) * 86400;

      const walletProvider = await getProvider();

      toast.info("Approving USDC spend...");
      await ensureUsdcApproval(walletProvider, totalAmount);

      toast.info("Creating quest...");
      const contract = await getKwestCoreWrite(walletProvider);
      const tx = await contract.createTask(title, description, parseInt(proofType), requirements, poolAmount, slots, deadline);
      await tx.wait();
      toast.success("Quest created!");
      router.push("/browse");
    } catch (e: unknown) {
      toast.error((e as Error).message?.slice(0, 100) || "Transaction failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/browse" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Quests
      </Link>
      <h1 className="text-2xl font-bold text-white">Create a Quest</h1>
      <p className="text-slate-400">Post a task with USDC rewards. Funds are locked until you approve participants.</p>

      <Card className="p-5 sm:p-6 space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Write a thread about Base" />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what needs to be done..." />
        <Textarea label="Requirements (optional)" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Specific requirements participants must meet..." />
        <Select label="Proof Type" value={proofType} onChange={(e) => setProofType(e.target.value)} options={[
          { value: "0", label: "Text" },
          { value: "1", label: "Link / URL" },
          { value: "2", label: "IPFS Hash (screenshot)" },
        ]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Reward Pool (USDC)" type="number" step="1" min="1" value={rewardPool} onChange={(e) => setRewardPool(e.target.value)} placeholder="100" />
          <Input label="Total Slots" type="number" min="1" value={totalSlots} onChange={(e) => setTotalSlots(e.target.value)} placeholder="10" />
        </div>
        <Input label="Deadline (days from now)" type="number" min="1" value={deadlineDays} onChange={(e) => setDeadlineDays(e.target.value)} />

        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Reward per participant</span>
            <span className={`font-medium ${calculations.minRewardMet ? "text-white" : "text-red-400"}`}>{calculations.perUser.toFixed(2)} USDC</span>
          </div>
          {!calculations.minRewardMet && calculations.pool > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5" /> Minimum 1 USDC per participant required
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Platform fee (2%)</span>
            <span className="text-slate-300">{calculations.fee.toFixed(2)} USDC</span>
          </div>
          <div className="border-t border-slate-700/50 pt-2 flex justify-between">
            <span className="text-sm font-medium text-slate-300">Total</span>
            <span className="text-lg font-bold text-blue-400">{calculations.total.toFixed(2)} USDC</span>
          </div>
          <p className="text-xs text-slate-500">Reward pool + fee will be transferred from your wallet</p>
        </div>

        <Button onClick={handleCreate} disabled={loading || !address || !calculations.minRewardMet} className="w-full">
          {loading ? "Creating..." : `Create Quest — ${calculations.total.toFixed(2)} USDC`}
        </Button>
      </Card>
    </div>
  );
}
