import { cn } from "@/lib/cn";

export function LoadingDots({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      role="status"
      aria-label="Loading"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ink-faint animate-pulse-dot" />
      <span
        className="h-1.5 w-1.5 rounded-full bg-ink-faint animate-pulse-dot"
        style={{ animationDelay: "180ms" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-ink-faint animate-pulse-dot"
        style={{ animationDelay: "360ms" }}
      />
    </span>
  );
}
