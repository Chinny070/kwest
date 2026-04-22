"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Swords, Coins, Shield, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";

const FEATURES = [
  { icon: Swords,  title: "Create Quests",    desc: "Post tasks with USDC rewards locked onchain" },
  { icon: Coins,   title: "Earn Rewards",     desc: "Complete tasks and claim USDC instantly" },
  { icon: Shield,  title: "Trustless System", desc: "Anti-griefing protection for fair play" },
  { icon: Zap,     title: "Instant Claims",   desc: "Pull rewards on-demand after approval" },
];

export default function AuthPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) router.replace("/dashboard");
  }, [ready, authenticated, router]);

  return (
    <div className="min-h-screen bg-slate-950 bg-grid flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <Swords size={20} className="text-slate-950" />
          </div>
          <span className="font-display text-2xl text-white">Kwest</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="font-display text-5xl text-white leading-tight mb-4">
            Complete quests.<br />
            <span className="text-gradient">Earn USDC.</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-md">
            The decentralized task-and-reward platform on Base. Every quest, proof, and payout is
            trustlessly onchain.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.15)" }}>
                <Icon size={16} className="text-brand-400" />
              </div>
              <p className="text-sm font-semibold text-slate-200 mb-0.5">{title}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <Swords size={18} className="text-slate-950" />
            </div>
            <span className="font-display text-xl text-white">Kwest</span>
          </div>

          <div className="glass rounded-3xl p-8">
            <div className="mb-8">
              <h2 className="font-display text-3xl text-white mb-2">Welcome back</h2>
              <p className="text-slate-400 text-sm">
                Sign in to start completing quests and earning USDC rewards on Base.
              </p>
            </div>

            <Button
              onClick={login}
              size="lg"
              className="w-full mb-4 text-base"
              disabled={!ready}
            >
              Sign In / Create Account
              <ChevronRight size={18} />
            </Button>

            <p className="text-center text-xs text-slate-500">
              Continue with email, Google, or a crypto wallet.<br />
              New users get a wallet created automatically.
            </p>

            {/* Trust indicators */}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: "rgba(251,191,36,0.08)" }}>
              <div className="flex items-center justify-center gap-5 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Shield size={11} className="text-slate-500" />
                  Non-custodial
                </span>
                <span className="flex items-center gap-1">
                  <Zap size={11} className="text-slate-500" />
                  Base Sepolia
                </span>
                <span className="flex items-center gap-1">
                  <Coins size={11} className="text-slate-500" />
                  USDC rewards
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
