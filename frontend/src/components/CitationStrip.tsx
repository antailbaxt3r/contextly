"use client";

import { useState } from "react";
import type { Citation } from "@/lib/types";
import { cn } from "@/lib/cn";

export function CitationStrip({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!citations.length) return null;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c) => {
          const active = open === c.rank;
          return (
            <button
              key={c.chunk_id}
              onClick={() => setOpen(active ? null : c.rank)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40",
                active
                  ? "bg-sage-deep text-elevated border-sage-deep"
                  : "bg-sage-tint/70 text-sage-deep border-sage-soft hover:bg-sage-tint",
              )}
              aria-expanded={active}
            >
              <span className="font-medium">[{c.rank}]</span>
              {c.page_start && (
                <span className="text-[10px] opacity-80">
                  p.{c.page_start}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {open !== null && (
        <div className="mt-2 rounded-lg border border-sage-soft bg-sage-tint/40 px-4 py-3 animate-fade-in">
          {(() => {
            const c = citations.find((x) => x.rank === open);
            if (!c) return null;
            return (
              <>
                <p className="text-xs text-sage-deep font-medium mb-1.5">
                  Source [{c.rank}]
                  {c.page_start ? ` · page ${c.page_start}` : ""}
                </p>
                <p className="text-sm text-ink leading-relaxed">
                  {c.content_preview}
                </p>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
