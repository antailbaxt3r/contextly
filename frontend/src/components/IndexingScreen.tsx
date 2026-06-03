import { LoadingDots } from "./LoadingDots";
import type { DocumentStatus } from "@/lib/types";

const COPY: Partial<Record<DocumentStatus, { title: string; description: string }>> = {
  pending: {
    title: "Just landed",
    description: "Your document is queued. Indexing will begin in a moment.",
  },
  parsing: {
    title: "Reading the document",
    description: "Pulling out the text, page by page. Usually takes a few seconds.",
  },
  embedding: {
    title: "Indexing the content",
    description:
      "Building an embedding for every chunk so we can find what's relevant when you ask.",
  },
};

interface IndexingScreenProps {
  status: DocumentStatus;
  filename?: string;
  errorMessage?: string | null;
}

export function IndexingScreen({ status, filename, errorMessage }: IndexingScreenProps) {
  if (status === "ready") return null;

  if (status === "failed") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center animate-fade-in">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <h2 className="font-serif font-medium text-[1.75rem] text-ink mb-2 leading-tight">
            Indexing failed
          </h2>
          <p className="text-ink-muted mb-3">
            We couldn't process {filename ? <span className="text-ink">{filename}</span> : "this document"}.
          </p>
          {errorMessage && (
            <p className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-ink-muted font-mono break-words">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  const copy = COPY[status] ?? COPY.embedding!;
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage-tint">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-sage-deep" />
          </span>
        </div>
        <h2 className="font-serif font-medium text-[1.75rem] text-ink mb-3 leading-tight">
          {copy.title}<span className="text-sage">.</span>
        </h2>
        <p className="text-ink-muted mb-6">{copy.description}</p>
        {filename && (
          <p className="text-xs text-ink-faint mb-6 truncate">{filename}</p>
        )}
        <div className="flex justify-center">
          <LoadingDots />
        </div>
      </div>
    </div>
  );
}
