"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  address: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  address: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  function handleAccountsChanged(accounts: unknown) {
    if (!Array.isArray(accounts)) return;
    if (accounts.length === 0) {
      setAddress(null);
    } else {
      setAddress(accounts[0]);
    }
  }

  async function checkConnection() {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          await switchToBaseSepolia();
        }
      }
    } catch {}
    setIsLoading(false);
  }

  async function switchToBaseSepolia() {
    if (!window.ethereum) return;
    const chainIdHex = "0x14a34";
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: chainIdHex,
            chainName: "Base Sepolia",
            rpcUrls: ["https://sepolia.base.org"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: ["https://sepolia.basescan.org"],
          }],
        });
      }
    }
  }

  const login = useCallback(async () => {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    try {
      setIsLoading(true);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        await switchToBaseSepolia();
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAddress(null);
  }, []);

  return (
    <AuthContext.Provider value={{ address, isAuthenticated: !!address, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading...</div>;
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
