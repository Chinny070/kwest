"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/kwest/auth";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster theme="dark" position="bottom-right" />
    </AuthProvider>
  );
}
