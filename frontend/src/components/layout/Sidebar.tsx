"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
  LayoutDashboard, Search, Plus, CheckSquare, Gift, User,
  LogOut, Swords, ChevronRight, Wallet, Shield, Copy, Check
} from "lucide-react";
import { cn, shortAddress } from "@/lib/utils";
import { useAccount } from "wagmi";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Browse Quests", icon: Search },
  { href: "/tasks/new", label: "Create Quest", icon: Plus },
  { href: "/validate", label: "Validate", icon: CheckSquare },
  { href: "/claim", label: "Claim Rewards", icon: Gift },
  { href: "/profile", label: "My Profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = usePrivy();
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  const walletAddress = address ?? "";

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col"
      style={{ background: "rgba(8,12,24,0.95)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <img src="/logo.webp" alt="Kwest" className="h-8 w-auto" />
          </div>
          
        </Link>
        <p className="text-xs text-slate-500 mt-1 ml-0.5">Base Sepolia Testnet</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn("nav-link", isActive && "active")}>
              <Icon size={18} className="flex-shrink-0" />
              <span>{label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Wallet info */}
      {walletAddress && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
            style={{ background: "rgba(251,191,36,0.06)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(251,191,36,0.15)" }}>
              <Wallet size={13} className="text-brand-400" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs text-slate-400">Wallet</p>
              <p className="text-xs font-mono text-slate-200 truncate">
                {shortAddress(walletAddress)}
              </p>
            </div>
            <button
              onClick={handleCopy}
              aria-label="Copy wallet address"
              title={copied ? "Copied!" : "Copy wallet address"}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {copied
                ? <Check size={13} className="text-green-400" />
                : <Copy size={13} className="text-slate-400" />
              }
            </button>
          </div>
        </div>
      )}
      {/* Footer */}
      <div className="px-3 pb-5 pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center">
            <Shield size={13} className="text-slate-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-slate-400 truncate">
              {user?.email?.address ?? user?.wallet?.address ?? ""}
            </p>
          </div>
        </div>
        <button onClick={logout}
          className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 mt-1">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}