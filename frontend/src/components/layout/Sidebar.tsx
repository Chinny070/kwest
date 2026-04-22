"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
  LayoutDashboard, Search, Plus, CheckSquare, Gift, User,
  LogOut, Swords, ChevronRight, Wallet, Shield
} from "lucide-react";
import { cn, shortAddress } from "@/lib/utils";
import { useAccount } from "wagmi";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",      icon: LayoutDashboard },
  { href: "/tasks",      label: "Browse Quests",  icon: Search },
  { href: "/tasks/new",  label: "Create Quest",   icon: Plus },
  { href: "/validate",   label: "Validate",       icon: CheckSquare },
  { href: "/claim",      label: "Claim Rewards",  icon: Gift },
  { href: "/profile",    label: "My Profile",     icon: User },
];

export function Sidebar() {
  const pathname  = usePathname();
  const { logout, user } = usePrivy();
  const { address } = useAccount();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{ background: "rgba(8,12,24,0.95)", borderRight: "1px solid rgba(251,191,36,0.08)" }}>

      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b" style={{ borderColor: "rgba(251,191,36,0.08)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <Swords size={16} className="text-slate-950" />
          </div>
          <span className="font-display text-xl text-white tracking-tight">Kwest</span>
        </Link>
        <p className="text-xs text-slate-500 mt-1 ml-0.5">Base Sepolia Testnet</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn("nav-link", isActive && "active")}>
              <Icon size={18} className="flex-shrink-0" />
              <span>{label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Wallet info */}
      {address && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(251,191,36,0.12)" }}>
              <Wallet size={13} className="text-brand-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-slate-400">Wallet</p>
              <p className="text-xs font-mono text-slate-200 truncate">{shortAddress(address)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 pb-5 pt-1 border-t" style={{ borderColor: "rgba(251,191,36,0.08)" }}>
        <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
            <Shield size={13} className="text-slate-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-slate-400 truncate">
              {user?.email?.address ?? user?.wallet?.address ? shortAddress(user.wallet?.address ?? "") : "Connected"}
            </p>
          </div>
        </div>
        <button onClick={logout}
          className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-950/30">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
