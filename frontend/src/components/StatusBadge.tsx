import { cn } from "@/lib/cn";
import type { DocumentStatus } from "@/lib/types";
import { LoadingDots } from "./LoadingDots";

const labels: Record<DocumentStatus, string> = {
  pending: "Queued",
  parsing: "Reading",
  embedding: "Indexing",
  ready: "Ready",
  failed: "Failed",
};

const styles: Record<DocumentStatus, string> = {
  pending: "bg-warm-tint text-clay border-warm/30",
  parsing: "bg-warm-tint text-clay border-warm/30",
  embedding: "bg-warm-tint text-clay border-warm/30",
  ready: "bg-sage-tint text-sage-deep border-sage/30",
  failed: "bg-danger/10 text-danger border-danger/30",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const isWorking = status === "pending" || status === "parsing" || status === "embedding";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {isWorking && <LoadingDots className="scale-75" />}
      {labels[status]}
    </span>
  );
}
