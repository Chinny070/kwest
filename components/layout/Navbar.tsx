"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/kwest/auth";
import { shortenAddress } from "@/lib/utils/format";
import Button from "../ui/Button";
import { Compass, Plus, Shield, FileText, Gift } from "lucide-react";

export default function Navbar() {
  const { address, isAuthenticated, login, logout, isLoading } = useAuth();

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/browse" className="flex items-center gap-2">
              <Image src="/kwest-logo.svg" alt="Kwest" width={120} height={32} className="h-8 w-auto" priority />
            </Link>
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1">
                <Link href="/browse" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <Compass className="w-4 h-4" /> Browse
                </Link>
                <Link href="/create" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <Plus className="w-4 h-4" /> Create
                </Link>
                <Link href="/submissions" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <FileText className="w-4 h-4" /> My Submissions
                </Link>
                <Link href="/validate" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <Shield className="w-4 h-4" /> Validate
                </Link>
                <Link href="/claim" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <Gift className="w-4 h-4" /> Claim
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && address ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg">
                  {shortenAddress(address)}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>Disconnect</Button>
              </div>
            ) : (
              <Button onClick={login} disabled={isLoading}>
                {isLoading ? "Loading..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
