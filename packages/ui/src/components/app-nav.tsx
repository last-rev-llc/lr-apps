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
        // <md: horizontal scroll-snap strip so items don't wrap awkwardly.
        // md+: regular flex row.
        "glass flex items-center gap-1 border-b border-white/10 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-thin md:overflow-x-visible",
        className,
      )}
    >
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={cn(
            "flex shrink-0 snap-start items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap",
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
