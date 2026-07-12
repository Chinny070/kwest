"use client";

import { createContext, useContext, ReactNode, useMemo, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

interface AuthContextType {
  address: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  getProvider: () => Promise<unknown>;
  userLabel: string | null;
}

const AuthContext = createContext<AuthContextType>({
  address: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  getProvider: async () => null,
  userLabel: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  const activeWallet = wallets.find((w) => w.walletClientType !== "privy") || wallets[0];
  const address = activeWallet?.address ?? null;

  const userLabel = useMemo(() => {
    if (user?.email?.address) return user.email.address;
    if (address) return address;
    return null;
  }, [user, address]);

  const getProvider = async () => {
    if (!activeWallet) throw new Error("No wallet connected");
    await activeWallet.switchChain(84532);
    return await activeWallet.getEthereumProvider();
  };

  return (
    <AuthContext.Provider
      value={{
        address,
        isAuthenticated: ready && authenticated,
        isLoading: !ready,
        login,
        logout,
        getProvider,
        userLabel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-6">
        <img src="/kwest-logo.png" alt="Kwest" className="h-12 w-auto" />
        <p className="text-slate-400">Sign in to access Kwest</p>
        <button
          onClick={login}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
