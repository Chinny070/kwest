"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

// ── Button ─────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "brand" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "brand", size = "md", loading, disabled, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-5 py-2.5 text-sm rounded-xl",
      lg: "px-7 py-3.5 text-base rounded-xl",
    };
    const variants = {
      brand:   "btn-brand",
      ghost:   "btn-ghost",
      danger:  "bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 rounded-xl",
      outline: "border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100 rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ── Card ───────────────────────────────────────────────────────────────────
interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
}
export function Card({ className, children, hover, glow }: CardProps) {
  return (
    <div className={cn(
      "glass rounded-2xl p-5",
      hover && "glass-hover cursor-pointer",
      glow && "stat-glow",
      className
    )}>
      {children}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
interface BadgeProps {
  status: "active" | "completed" | "cancelled" | "pending" | "approved" | "rejected";
  className?: string;
}
export function Badge({ status, className }: BadgeProps) {
  const labels: Record<string, string> = {
    active: "Active", completed: "Completed", cancelled: "Cancelled",
    pending: "Pending", approved: "Approved", rejected: "Rejected",
  };
  return (
    <span className={cn(
      `badge-${status}`,
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
      className
    )}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Progress ───────────────────────────────────────────────────────────────
interface ProgressProps { value: number; className?: string; }
export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn("progress-track", className)}>
      <div className="progress-fill" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">{label}</label>
      )}
      <input className={cn("input-field", error && "!border-red-500/60", className)} {...props} />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export function Textarea({ label, error, hint, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">{label}</label>
      )}
      <textarea
        className={cn("input-field resize-none", error && "!border-red-500/60", className)}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}
export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <select
        className={cn("input-field", error && "!border-red-500/60", className)}
        style={{ background: "rgba(15,23,42,0.8)" }}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: "#0f172a" }}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} />;
}

// ── Stat Card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  color?: "gold" | "green" | "blue" | "purple";
}
export function StatCard({ label, value, icon, sub, color = "gold" }: StatCardProps) {
  const colors = {
    gold:   { bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.15)",  text: "#fbbf24" },
    green:  { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.15)",   text: "#4ade80" },
    blue:   { bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.15)",  text: "#60a5fa" },
    purple: { bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.15)",  text: "#c084fc" },
  };
  const c = colors[color];

  return (
    <div className="glass rounded-2xl p-5 stat-glow relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.12)" }}>
        <span className="text-brand-400">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-5">{description}</p>
      {action}
    </div>
  );
}

// ── Page Header ────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="font-display text-3xl text-white mb-0.5">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
