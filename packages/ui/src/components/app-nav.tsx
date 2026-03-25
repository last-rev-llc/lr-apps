import * as React from "react";
import { cn } from "../lib/utils";

export interface AppNavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface AppNavProps {
  items: AppNavItem[];
  className?: string;
}

export function AppNav({ items, className }: AppNavProps) {
  return (
    <nav
      className={cn(
        "glass flex items-center gap-1 border-b border-white/10 px-4",
        className,
      )}
    >
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors",
            item.active
              ? "border-b-2 border-amber-400 text-white"
              : "text-white/60 hover:text-white",
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
