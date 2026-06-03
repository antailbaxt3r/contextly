"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 rounded-lg select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40";

const variants: Record<Variant, string> = {
  primary:
    "bg-sage text-elevated hover:bg-sage-deep active:scale-[0.985] shadow-soft",
  secondary:
    "bg-elevated text-ink border border-border hover:border-border-strong hover:bg-surface",
  ghost: "text-ink-muted hover:text-ink hover:bg-sage-tint/60",
  danger:
    "bg-elevated text-danger border border-danger/30 hover:bg-danger/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", loading, children, disabled, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
            <span
              className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot"
              style={{ animationDelay: "300ms" }}
            />
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);
