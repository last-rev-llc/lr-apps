import * as React from "react";
import { cn } from "../lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-10 px-5 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 text-4xl animate-[cc-es-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-white/60">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-white/40">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
