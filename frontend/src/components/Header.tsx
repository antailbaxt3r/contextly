"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { clearTokens } from "@/lib/auth";
import { cn } from "@/lib/cn";

export function Header() {
  const router = useRouter();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: api.me,
    staleTime: 5 * 60_000,
  });

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="group inline-flex items-baseline leading-none"
          aria-label="Contextly home"
        >
          <span className="font-serif font-medium text-[1.65rem] text-ink tracking-tight transition-colors group-hover:text-sage-deep">
            contextly
          </span>
          <span className="font-serif font-medium text-[1.65rem] text-sage ml-[1px]">.</span>
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:inline text-sm text-ink-muted">
              {user.display_name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "h-9 px-3 rounded-md text-sm text-ink-muted",
              "hover:bg-sage-tint/60 hover:text-ink transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40",
            )}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
