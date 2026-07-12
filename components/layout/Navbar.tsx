"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/kwest/auth";
import { shortenAddress } from "@/lib/utils/format";
import Button from "../ui/Button";
import { Compass, Plus, Shield, FileText, Gift, LayoutDashboard, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/browse", label: "Browse", icon: Compass },
  { href: "/create", label: "Create", icon: Plus },
  { href: "/submissions", label: "Submissions", icon: FileText },
  { href: "/validate", label: "Validate", icon: Shield },
  { href: "/claim", label: "Claim", icon: Gift },
];

export default function Navbar() {
  const { address, isAuthenticated, login, logout, isLoading, userLabel } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = userLabel
    ? userLabel.includes("@")
      ? userLabel
      : shortenAddress(userLabel)
    : address
    ? shortenAddress(address)
    : null;

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
              <Image src="/kwest-logo.svg" alt="Kwest" width={120} height={32} className="h-8 w-auto" priority />
            </Link>
            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-1">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && displayName ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg truncate max-w-[200px]">
                  {displayName}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={login} disabled={isLoading}>
                {isLoading ? "Loading..." : "Sign In"}
              </Button>
            )}
            {isAuthenticated && (
              <button
                className="lg:hidden p-2 text-slate-400 hover:text-white cursor-pointer"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && isAuthenticated && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
