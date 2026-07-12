"use client";

import { ReactNode, Suspense } from "react";
import { RequireAuth } from "@/lib/kwest/auth";
import Navbar from "@/components/layout/Navbar";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      Loading...
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Suspense fallback={<LoadingFallback />}>
            {children}
          </Suspense>
        </main>
      </div>
    </RequireAuth>
  );
}
