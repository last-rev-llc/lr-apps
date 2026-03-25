import * as React from "react";
import { cn } from "../lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-5",
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-white/50">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
