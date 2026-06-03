"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatBytes, formatRelativeTime, shortFilename } from "@/lib/format";
import type { DocumentRecord } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function DocumentCard({ doc }: { doc: DocumentRecord }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteDocument(doc.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return (
    <div className="group relative">
      <Link
        href={`/documents/${doc.id}`}
        className={cn(
          "flex flex-col rounded-2xl bg-elevated/60 hover:bg-elevated p-5",
          "border border-transparent hover:border-border-strong hover:shadow-lift hover:-translate-y-0.5",
          "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40",
          confirming && "opacity-30 pointer-events-none",
        )}
        aria-hidden={confirming}
        tabIndex={confirming ? -1 : 0}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warm-tint text-clay">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <StatusBadge status={doc.status} />
        </div>

        <p
          className="font-medium text-ink leading-snug mb-1.5 line-clamp-2"
          title={doc.original_filename}
        >
          {shortFilename(doc.original_filename, 60)}
        </p>

        <p className="text-xs text-ink-faint">
          {formatBytes(doc.byte_size)}
          {doc.page_count ? ` · ${doc.page_count} pages` : ""}
          {` · ${formatRelativeTime(doc.created_at)}`}
        </p>
      </Link>

      {!confirming && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirming(true);
          }}
          aria-label="Delete document"
          className={cn(
            "absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-lg",
            "text-ink-faint bg-elevated/80 backdrop-blur-sm border border-border/60",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            "hover:text-danger hover:border-danger/40 hover:bg-elevated transition-all",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </svg>
        </button>
      )}

      {confirming && (
        <div className="absolute inset-0 z-20 rounded-2xl bg-elevated/95 backdrop-blur-sm border border-danger/30 shadow-lift flex flex-col items-center justify-center px-5 text-center animate-fade-in">
          <p className="font-medium text-ink mb-1.5">Delete this document?</p>
          <p className="text-xs text-ink-muted mb-4 max-w-[85%]">
            All conversations and indexed chunks will be removed permanently.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleteMutation.isPending}
              className="h-9 px-3.5 rounded-lg border border-border bg-elevated text-sm text-ink hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="h-9 px-3.5 rounded-lg bg-danger text-elevated text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
