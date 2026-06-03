import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/cn";
import { CitationStrip } from "./CitationStrip";

function renderContent(text: string) {
  return text.split(/\n{2,}/).map((para, i) => (
    <p key={i} className="whitespace-pre-wrap">
      {para}
    </p>
  ));
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-fade-in">
        <div
          className={cn(
            "max-w-[78%] rounded-2xl rounded-tr-md px-4 py-3",
            "bg-warm-tint text-ink border border-warm/30 shadow-soft",
          )}
        >
          <div className="prose-chat text-[0.95rem]">
            {renderContent(message.content)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in">
      <div
        aria-hidden
        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage text-elevated text-[11px] font-semibold tracking-tight"
      >
        ct
      </div>
      <div className="flex-1 min-w-0">
        <div className="prose-chat">{renderContent(message.content)}</div>
        <CitationStrip citations={message.citations} />
      </div>
    </div>
  );
}
