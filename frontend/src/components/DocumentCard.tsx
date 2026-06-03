import Link from "next/link";
import { formatBytes, formatRelativeTime, shortFilename } from "@/lib/format";
import type { DocumentRecord } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function DocumentCard({ doc }: { doc: DocumentRecord }) {
  return (
    <Link
      href={`/documents/${doc.id}`}
      className="group relative flex flex-col rounded-2xl bg-elevated/60 hover:bg-elevated p-5 border border-transparent hover:border-border-strong hover:shadow-lift hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
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
  );
}
