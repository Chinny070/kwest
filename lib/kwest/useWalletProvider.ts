"use client";

import { useWallets } from "@privy-io/react-auth";
import { useCallback } from "react";

export function useWalletProvider() {
  const { wallets } = useWallets();
  const activeWallet = wallets.find((w) => w.walletClientType !== "privy") || wallets[0];

  const getProvider = useCallback(async () => {
    if (!activeWallet) throw new Error("No wallet connected. Please connect a wallet first.");
    await activeWallet.switchChain(84532);
    return (await activeWallet.getEthereumProvider()) as unknown as import("ethers").Eip1193Provider;
  }, [activeWallet]);

  return { getProvider, hasWallet: !!activeWallet };
}
