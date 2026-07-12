"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { AuthProvider } from "@/lib/kwest/auth";
import { Toaster } from "sonner";
import { baseSepolia } from "viem/chains";

export default function PrivyWrapper({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6",
          logo: "/kwest-logo.svg",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
      }}
    >
      <AuthProvider>
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </AuthProvider>
    </PrivyProvider>
  );
}
