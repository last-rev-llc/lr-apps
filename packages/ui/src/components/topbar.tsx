import * as React from "react";
import { cn } from "../lib/utils";

interface TopbarProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function Topbar({ title, children, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "glass flex h-14 items-center justify-between gap-4 border-b border-white/10 px-4",
        className,
      )}
    >
      <span className="font-semibold text-white">{title}</span>
      {children && <nav className="flex items-center gap-2">{children}</nav>}
    </header>
  );
}
