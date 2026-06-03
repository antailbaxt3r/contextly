import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-12 inline-flex items-baseline leading-none text-ink hover:text-sage-deep transition-colors"
        aria-label="Contextly home"
      >
        <span className="font-serif font-medium text-[2.25rem] tracking-tight">
          contextly
        </span>
        <span className="font-serif font-medium text-[2.25rem] text-sage ml-[1px]">
          .
        </span>
      </Link>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="rounded-2xl border border-border bg-elevated/80 backdrop-blur-sm shadow-soft p-8">
          <h1 className="font-serif text-[1.8rem] font-medium text-ink mb-1.5 leading-tight">
            {title}
          </h1>
          <p className="text-sm text-ink-muted mb-7">{subtitle}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>
      </div>
    </main>
  );
}
