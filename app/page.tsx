"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/kwest/auth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  ArrowRight, Wallet, CheckCircle, Shield, Gift,
  Users, Zap, Lock, Clock, ChevronDown, ChevronUp,
  Coins, Target, Award,
} from "lucide-react";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
      >
        <span className="font-medium text-white pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, login, isLoading } = useAuth();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/kwest-logo.svg" alt="Kwest" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/browse">
                  <Button>Open App <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </Link>
              ) : (
                <Button onClick={login} disabled={isLoading}>
                  <Wallet className="w-4 h-4 mr-1.5" />
                  {isLoading ? "Loading..." : "Connect Wallet"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="text-center pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-8">
            <Zap className="w-3.5 h-3.5" /> Live on Base Sepolia Testnet
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Complete Quests.<br /><span className="text-blue-400">Earn USDC.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Kwest is a decentralized task and reward platform where creators post bounties
            and participants earn USDC for completing verified tasks.
          </p>
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/browse">
                <Button size="lg">Launch App <ArrowRight className="w-5 h-5 ml-2" /></Button>
              </Link>
            ) : (
              <Button size="lg" onClick={login} disabled={isLoading}>
                <Wallet className="w-5 h-5 mr-2" /> Get Started
              </Button>
            )}
            <a href="#how-it-works">
              <Button variant="secondary" size="lg">Learn More</Button>
            </a>
          </div>
        </section>

        <section className="pb-20">
          <Card className="p-6 md:p-8 max-w-4xl mx-auto bg-gradient-to-br from-slate-800/80 to-slate-900/80">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4 border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-white">Active Quests</span>
                </div>
                <div className="space-y-2">
                  {["Write a DeFi thread", "Test smart contract", "Create tutorial video"].map((t) => (
                    <div key={t} className="flex items-center justify-between bg-slate-900/60 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-300">{t}</span>
                      <span className="text-xs text-blue-400 font-mono">25 USDC</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-4 border-emerald-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-white">My Submissions</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-slate-900/60 rounded-lg px-3 py-2 flex justify-between items-center">
                    <span className="text-xs text-slate-300">DeFi thread</span>
                    <span className="text-xs text-emerald-400 font-mono">Approved</span>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg px-3 py-2 flex justify-between items-center">
                    <span className="text-xs text-slate-300">Smart contract test</span>
                    <span className="text-xs text-amber-400 font-mono">Pending</span>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-white">Rewards</span>
                </div>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-white">150 <span className="text-blue-400">USDC</span></p>
                  <p className="text-xs text-slate-400 mt-1">Total earned</p>
                </div>
              </Card>
            </div>
          </Card>
        </section>

        <section id="how-it-works" className="pb-20 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">How Kwest Works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Four simple steps from quest creation to reward payout.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", icon: Target, title: "Create Quest", desc: "Post a task, set a USDC reward pool, define the number of slots, and specify what proof is needed." },
              { step: "2", icon: CheckCircle, title: "Submit Proof", desc: "Participants complete the quest and submit proof directly on the quest page — text, a link, or an IPFS hash." },
              { step: "3", icon: Shield, title: "Creator Validates", desc: "The quest creator reviews each submission and approves or rejects it. No third parties involved." },
              { step: "4", icon: Gift, title: "Claim Reward", desc: "Approved participants claim their USDC reward instantly from the smart contract. Fully onchain." },
            ].map((item) => (
              <Card key={item.step} className="p-6 text-center hover:border-blue-500/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center mx-auto mb-4">{item.step}</div>
                <item.icon className="w-6 h-6 text-slate-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="pb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Platform Features</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Coins, title: "USDC Payments", desc: "All rewards are paid in USDC — stable, predictable, and widely accepted." },
              { icon: Lock, title: "Funds Locked Onchain", desc: "Reward pools are locked in the smart contract at quest creation. No trust required." },
              { icon: Shield, title: "Creator Validation", desc: "Quest creators validate submissions directly. No bots, no algorithms, no middlemen." },
              { icon: Clock, title: "Deadline Enforcement", desc: "Quests have onchain deadlines. Unclaimed funds are refundable to creators after expiry." },
              { icon: Zap, title: "Instant Claims", desc: "Once approved, participants can claim their USDC immediately from the contract." },
              { icon: Users, title: "Open Participation", desc: "Anyone with a wallet can browse quests, submit proof, and earn rewards." },
            ].map((f) => (
              <Card key={f.title} hover className="p-6">
                <f.icon className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="pb-20">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Award className="w-6 h-6 text-blue-400" /></div>
                <h3 className="text-xl font-bold text-white">For Creators</h3>
              </div>
              <ul className="space-y-3">
                {["Post tasks and get real work done by the community", "Set your own reward pool and number of participants", "Review and approve submissions yourself — full control", "Reclaim unused funds after the quest deadline", "Only pay a small 2% platform fee on the reward pool"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><Gift className="w-6 h-6 text-emerald-400" /></div>
                <h3 className="text-xl font-bold text-white">For Participants</h3>
              </div>
              <ul className="space-y-3">
                {["Browse open quests and earn USDC for completing tasks", "Submit proof directly on the quest page — no extra steps", "Track all your submissions and their status in one place", "Claim approved rewards instantly from the smart contract", "Minimum 1 USDC per quest — no micro-rewards"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section className="pb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">FAQ</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            <FAQItem q="What is Kwest?" a="Kwest is a decentralized task and reward platform built on Base. Creators post quests with USDC bounties, and participants earn rewards by completing and submitting verifiable proof." />
            <FAQItem q="What currency does Kwest use?" a="All rewards, deposits, and fees are denominated in USDC — a stable, dollar-pegged token on Base Sepolia." />
            <FAQItem q="How are submissions validated?" a="The quest creator reviews each submission and can approve or reject it. There are no third-party validators or automated checks — the creator has full control." />
            <FAQItem q="What is the platform fee?" a="Creators pay a 2% platform fee on top of their reward pool when creating a quest. Participants pay nothing." />
            <FAQItem q="What is the minimum reward?" a="Every quest must offer at least 1 USDC per participant. This prevents micro-reward spam." />
            <FAQItem q="Can I get a refund if slots aren't filled?" a="Yes. After the quest deadline, creators can reclaim any unused USDC from the reward pool." />
            <FAQItem q="Is this on mainnet?" a="Kwest is currently live on Base Sepolia testnet. Mainnet deployment is planned after thorough testing." />
          </div>
        </section>

        <section className="pb-20 text-center">
          <Card className="p-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">Connect your wallet to create quests or start earning USDC today.</p>
            {isAuthenticated ? (
              <Link href="/browse">
                <Button size="lg">Launch App <ArrowRight className="w-5 h-5 ml-2" /></Button>
              </Link>
            ) : (
              <Button size="lg" onClick={login} disabled={isLoading}>
                <Wallet className="w-5 h-5 mr-2" /> Connect Wallet
              </Button>
            )}
          </Card>
        </section>

        <footer className="border-t border-slate-800 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Image src="/kwest-logo.svg" alt="Kwest" width={100} height={28} className="h-6 w-auto" />
            <p className="text-sm text-slate-500">Built on Base. Powered by smart contracts. &copy; 2025 Kwest.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
