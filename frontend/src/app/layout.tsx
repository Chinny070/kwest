import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Kwest — Decentralized Task & Reward Platform",
  description: "Complete quests, earn USDC. The onchain reward platform on Base.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Kwest",
    description: "Complete quests, earn USDC rewards onchain.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-slate-950 text-slate-100 antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#f1f5f9",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: "12px",
                fontFamily: "var(--font-body, DM Sans, sans-serif)",
              },
              success: {
                iconTheme: { primary: "#f59e0b", secondary: "#0a0f1e" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#0a0f1e" },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
