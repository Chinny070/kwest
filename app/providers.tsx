"use client";

import { ReactNode, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const PrivyWrapper = dynamic(() => import("./privy-wrapper"), { ssr: false });

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <PrivyWrapper>{children}</PrivyWrapper>;
}
