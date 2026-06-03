"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatBytes, formatRelativeTime } from "@/lib/format";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/Button";
import { ConversationItem } from "@/components/ConversationItem";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingDots } from "@/components/LoadingDots";

const POLL_STATUSES = new Set(["pending", "parsing", "embedding"]);

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const docId = params.id;

  const { data: doc, isLoading } = useQuery({
    queryKey: ["document", docId],
    queryFn: () => api.getDocument(docId),
    refetchInterval: (q) =>
      q.state.data && POLL_STATUSES.has(q.state.data.status) ? 3000 : false,
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations", docId],
    queryFn: () => api.listConversations(docId),
    enabled: Boolean(docId),
  });

  const newChat = useMutation({
    mutationFn: () =>
      api.createConversation({
        document_id: docId,
        title: doc ? `Chat about ${doc.original_filename}` : "New chat",
      }),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ["conversations", docId] });
      router.push(`/documents/${docId}/chat/${conv.id}`);
    },
  });

  if (isLoading || !doc) {
    return (
      <main className="flex-1 overflow-y-auto scrollbar-subtle">
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <LoadingDots />
        </div>
      </main>
    );
  }

  const isReady = doc.status === "ready";

  return (
    <main className="flex-1 overflow-y-auto scrollbar-subtle">
      <div className="mx-auto w-full max-w-3xl px-6 py-10 animate-fade-in">
        <BackLink href="/dashboard" label="Back to library" />

      <div className="mt-6 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1
              className="font-serif font-medium text-[2.25rem] text-ink leading-tight break-words"
              title={doc.original_filename}
            >
              {doc.original_filename}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {formatBytes(doc.byte_size)}
              {doc.page_count ? ` · ${doc.page_count} pages` : ""}
              {doc.chunk_count ? ` · ${doc.chunk_count} chunks` : ""}
              {` · added ${formatRelativeTime(doc.created_at)}`}
            </p>
          </div>
          <StatusBadge status={doc.status} />
        </div>

        {doc.status === "failed" && doc.error_message && (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
            <p className="text-sm text-danger font-medium mb-1">
              Indexing failed
            </p>
            <p className="text-xs text-ink-muted font-mono">
              {doc.error_message}
            </p>
          </div>
        )}

        {!isReady && doc.status !== "failed" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-warm/30 bg-warm-tint/50 px-4 py-3">
            <LoadingDots />
            <p className="text-sm text-clay">
              Still indexing. You can start a chat once this is ready.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-medium text-xl text-ink">Conversations</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => newChat.mutate()}
          loading={newChat.isPending}
          disabled={!isReady}
        >
          New chat
        </Button>
      </div>

      {conversations && conversations.length > 0 ? (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <ConversationItem key={c.id} conversation={c} documentId={docId} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No chats yet"
          description={
            isReady
              ? "Start a new chat to ask questions about this document."
              : "You'll be able to start a chat once indexing finishes."
          }
          icon={
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
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          }
        />
      )}
      </div>
    </main>
  );
}
