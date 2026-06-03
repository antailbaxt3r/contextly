"use client";

import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
}: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim() && !disabled) onSubmit();
  }

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative rounded-3xl border-[1.5px] bg-elevated/90 backdrop-blur-sm shadow-soft transition-all duration-150",
        "border-border",
        "focus-within:border-sage focus-within:shadow-lift focus-within:ring-4 focus-within:ring-sage/15",
      )}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder || "Ask anything about this document..."}
        rows={1}
        disabled={disabled}
        className={cn(
          "w-full resize-none bg-transparent px-5 py-4 pr-14 text-[0.95rem] text-ink rounded-3xl",
          "placeholder:text-ink-faint scrollbar-subtle",
          "outline-none focus:outline-none focus-visible:outline-none",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          "absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full transition-all",
          canSend
            ? "bg-sage text-elevated hover:bg-sage-deep"
            : "bg-border text-ink-faint cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40",
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
      </button>
    </form>
  );
}
