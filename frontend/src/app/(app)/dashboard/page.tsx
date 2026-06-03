"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DocumentCard } from "@/components/DocumentCard";
import { UploadCard } from "@/components/UploadCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingDots } from "@/components/LoadingDots";

const POLL_STATUSES = new Set(["pending", "parsing", "embedding"]);

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["documents"],
    queryFn: api.listDocuments,
    refetchInterval: (q) => {
      const docs = q.state.data;
      if (!docs) return false;
      return docs.some((d) => POLL_STATUSES.has(d.status)) ? 3000 : false;
    },
  });

  const hasDocs = (data?.length ?? 0) > 0;

  return (
    <main className="flex-1 overflow-y-auto scrollbar-subtle">
      <div className="mx-auto w-full max-w-5xl px-6 py-14">
        <section className="mb-14 animate-fade-in">
          <p className="text-xs font-medium text-ink-muted tracking-[0.15em] uppercase mb-3">
            Library
          </p>
          <h1 className="font-serif font-medium text-[2.75rem] sm:text-[3.25rem] text-ink leading-[1.02]">
            Your documents,
            <br />
            <span className="text-sage-deep">grounded</span>.
          </h1>
          <p className="mt-5 text-ink-muted max-w-md">
            Upload a document and ask anything about it. Every answer cites the
            exact passage it came from.
          </p>
        </section>

        <section className="mb-14 animate-fade-in" style={{ animationDelay: "60ms" }}>
          <UploadCard />
        </section>

        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="animate-fade-in" style={{ animationDelay: "120ms" }}>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-serif font-medium text-xl text-ink">
              {hasDocs ? "Your documents" : "Documents"}
            </h2>
            {hasDocs && (
              <p className="text-xs text-ink-faint">
                {data!.length} indexed
              </p>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-ink-muted animate-fade-in">
              <LoadingDots />
              <p className="mt-4 text-sm tracking-wide">
                Loading your library...
              </p>
            </div>
          )}

          {!isLoading && hasDocs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data!.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}

          {!isLoading && !hasDocs && (
            <EmptyState
              title="Nothing here yet"
              description="Once you upload something, it'll show up here. Indexing takes about a minute on CPU."
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              }
            />
          )}

          {isError && (
            <p className="mt-8 text-sm text-danger">
              Could not load your documents. Refresh the page to try again.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
