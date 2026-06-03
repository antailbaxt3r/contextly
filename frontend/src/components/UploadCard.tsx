"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type DragEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";

const ALLOWED = [".pdf", ".txt", ".md"];

export function UploadCard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const doc = await api.uploadDocument(file);
      const conv = await api.createConversation({
        document_id: doc.id,
        title: `Chat about ${doc.original_filename}`,
      });
      return { doc, conv };
    },
    onSuccess: ({ doc, conv }) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      router.push(`/documents/${doc.id}/chat/${conv.id}`);
    },
    onError: (e: unknown) => {
      setError(e instanceof ApiError ? e.message : "Upload failed.");
    },
  });

  function pick(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    mutation.mutate(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group relative rounded-2xl border-2 border-dashed transition-all",
          "px-6 py-7 sm:py-8",
          "flex flex-col sm:flex-row items-center gap-5",
          dragging
            ? "border-sage bg-sage-tint/50"
            : "border-border bg-elevated/40 hover:bg-elevated/70 hover:border-border-strong",
          mutation.isPending && "pointer-events-none opacity-80",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED.join(",")}
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
        />

        <div
          className={cn(
            "h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center transition-colors",
            dragging
              ? "bg-sage text-elevated"
              : "bg-sage-tint text-sage-deep group-hover:bg-sage-soft",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="font-medium text-ink text-[1.05rem]">
            {mutation.isPending ? "Uploading..." : "Add a new document"}
          </p>
          <p className="text-sm text-ink-muted mt-0.5">
            {mutation.isPending
              ? "We'll start indexing it once it's uploaded."
              : "Drop a PDF, .txt, or .md file, or browse to choose one."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={mutation.isPending}
          className={cn(
            "h-10 px-5 rounded-full text-sm font-medium transition-all shrink-0",
            "bg-ink text-elevated hover:bg-sage-deep",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          Browse files
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-danger text-center">{error}</p>
      )}
    </div>
  );
}
