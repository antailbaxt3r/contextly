import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 animate-fade-in">
      {icon && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sage-tint text-sage-deep">
          {icon}
        </div>
      )}
      <h3 className="font-serif font-medium text-[1.6rem] text-ink leading-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
