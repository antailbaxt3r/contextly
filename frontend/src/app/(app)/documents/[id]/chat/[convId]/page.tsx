"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { BackLink } from "@/components/BackLink";
import { ChatBubble } from "@/components/ChatBubble";
import { Composer } from "@/components/Composer";
import { IndexingScreen } from "@/components/IndexingScreen";
import { LoadingDots } from "@/components/LoadingDots";
import { shortFilename } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const { id: docId, convId } = useParams<{ id: string; convId: string }>();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: doc, isLoading: docLoading } = useQuery({
    queryKey: ["document", docId],
    queryFn: () => api.getDocument(docId),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status && status !== "ready" && status !== "failed" ? 2500 : false;
    },
  });

  const { data: conv } = useQuery({
    queryKey: ["conversation", convId],
    queryFn: () => api.getConversation(convId),
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () => api.listMessages(convId),
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.sendMessage(convId, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["messages", convId] });
      setPending(null);
    },
    onError: (e: unknown) => {
      setPending(null);
      setError(e instanceof ApiError ? e.message : "Could not send message.");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError(null);
    setInput("");
    setPending(trimmed);
    sendMutation.mutate(trimmed);
  }

  const optimisticUser: ChatMessage | null = pending
    ? {
        id: "pending-user",
        conversation_id: convId,
        role: "user",
        content: pending,
        citations: [],
        created_at: new Date().toISOString(),
      }
    : null;

  const isEmpty = !pending && (messages?.length ?? 0) === 0;
  const isReady = doc?.status === "ready";
  const showIndexing = !docLoading && doc && doc.status !== "ready";

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="border-b border-border/70 bg-bg/60 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-3xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <BackLink
              href={`/documents/${docId}`}
              label={doc ? shortFilename(doc.original_filename, 40) : "Back"}
            />
            <h1 className="font-serif font-medium text-lg text-ink mt-1 truncate">
              {conv?.title || "Conversation"}
            </h1>
          </div>
        </div>
      </div>

      {docLoading && (
        <div className="flex flex-1 items-center justify-center text-ink-muted">
          <LoadingDots />
        </div>
      )}

      {showIndexing && (
        <IndexingScreen
          status={doc.status}
          filename={doc.original_filename}
          errorMessage={doc.error_message}
        />
      )}

      {isReady && (
      <>
      <div className="flex-1 overflow-y-auto scrollbar-subtle">
        <div className="mx-auto w-full max-w-3xl px-6 py-10 space-y-7">
          {isEmpty && (
            <div className="text-center py-20 animate-fade-in">
              <p className="font-serif font-medium text-[2rem] text-ink mb-3 leading-tight">
                Let's begin<span className="text-sage">.</span>
              </p>
              <p className="text-ink-muted max-w-md mx-auto">
                Ask anything about{" "}
                <span className="font-medium text-ink">
                  {doc ? shortFilename(doc.original_filename, 50) : "this document"}
                </span>
                . Every answer cites the exact passage it came from.
              </p>
            </div>
          )}

          {messages?.map((m) => <ChatBubble key={m.id} message={m} />)}

          {optimisticUser && <ChatBubble message={optimisticUser} />}

          {sendMutation.isPending && (
            <div className="flex gap-3 animate-fade-in">
              <div
                aria-hidden
                className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage text-elevated text-[11px] font-semibold tracking-tight"
              >
                ct
              </div>
              <div className="pt-2">
                <LoadingDots />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger animate-fade-in">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border/60 bg-bg/70 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-3xl px-6 py-4">
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            disabled={sendMutation.isPending}
            placeholder={
              sendMutation.isPending
                ? "Thinking..."
                : "Ask anything about this document..."
            }
          />
          <p className="mt-2 text-center text-[11px] text-ink-faint">
            Press Enter to send, Shift + Enter for a new line.
          </p>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
