import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "daily"
  | "recap"
  | "profile"
  | "archive";
type Size = "md" | "sm";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-primary text-white shadow-[0_10px_24px_-12px_rgba(74,86,153,0.55)] hover:bg-brand-strong active:translate-y-px",
  secondary:
    "bg-slate-900 text-white shadow-[0_10px_24px_-12px_rgba(15,23,42,0.38)] hover:bg-slate-800 active:translate-y-px",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  destructive:
    "bg-archive-primary text-white shadow-[0_10px_24px_-12px_rgba(110,26,40,0.55)] hover:bg-archive-strong active:translate-y-px",
  daily:
    "bg-daily-text text-white shadow-[0_12px_28px_-14px_rgba(107,67,26,0.42)] hover:bg-daily-accent active:translate-y-px",
  recap:
    "bg-linear-to-r from-recap-primary to-recap-strong text-white shadow-[0_12px_28px_-12px_rgba(126,91,174,0.5)] hover:from-[#6E4A9C] hover:to-[#2E1F58] active:translate-y-px",
  profile:
    "bg-linear-to-r from-[#D860B5] to-[#9F3B83] text-white shadow-[0_12px_28px_-12px_rgba(216,96,181,0.55)] hover:from-[#E277C3] hover:to-[#84306C] active:translate-y-px",
  archive:
    "bg-linear-to-r from-archive-primary to-archive-text text-white shadow-[0_12px_28px_-12px_rgba(110,26,40,0.5)] hover:from-[#5A1421] hover:to-archive-strong active:translate-y-px",
};

const sizeClasses: Record<Size, string> = {
  md: "min-h-12 px-5 py-3 text-sm",
  sm: "min-h-10 px-3.5 py-2 text-[13px]",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
