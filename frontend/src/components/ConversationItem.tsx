"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import type { Conversation } from "@/lib/types";

interface ConversationItemProps {
  conversation: Conversation;
  documentId: string;
}

export function ConversationItem({ conversation, documentId }: ConversationItemProps) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteConversation(conversation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", documentId] });
    },
  });

  return (
    <li className="group relative">
      <Link
        href={`/documents/${documentId}/chat/${conversation.id}`}
        className={cn(
          "flex items-center justify-between gap-4 rounded-xl border border-border bg-elevated/70 px-5 py-4",
          "hover:border-border-strong hover:bg-elevated transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40",
          confirming && "opacity-30 pointer-events-none",
        )}
        aria-hidden={confirming}
        tabIndex={confirming ? -1 : 0}
      >
        <div className="min-w-0">
          <p className="font-medium text-ink truncate">{conversation.title}</p>
          <p className="text-xs text-ink-faint mt-0.5">
            Updated {formatRelativeTime(conversation.updated_at)}
          </p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink-faint group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0"
          aria-hidden
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>

      {!confirming && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirming(true);
          }}
          aria-label="Delete conversation"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 right-12 z-10 h-8 w-8 flex items-center justify-center rounded-lg",
            "text-ink-faint bg-elevated/80 backdrop-blur-sm border border-border/60",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            "hover:text-danger hover:border-danger/40 hover:bg-elevated transition-all",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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
        <div className="absolute inset-0 z-20 rounded-xl bg-elevated/95 backdrop-blur-sm border border-danger/30 shadow-lift flex items-center justify-between gap-3 px-5 animate-fade-in">
          <p className="text-sm text-ink min-w-0 truncate">
            Delete this conversation?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleteMutation.isPending}
              className="h-8 px-3 rounded-lg border border-border bg-elevated text-sm text-ink hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="h-8 px-3 rounded-lg bg-danger text-elevated text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
