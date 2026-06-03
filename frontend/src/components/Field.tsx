import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, className, id, ...rest },
  ref,
) {
  const inputId = id || rest.name || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="mb-4">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-ink mb-1.5"
      >
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        className={cn(
          "h-11 w-full rounded-lg border bg-elevated px-3.5 text-sm text-ink",
          "placeholder:text-ink-faint",
          "border-border hover:border-border-strong",
          "focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30",
          "transition-colors",
          error && "border-danger/60 focus:border-danger focus:ring-danger/25",
          className,
        )}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
