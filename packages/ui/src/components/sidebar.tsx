"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function Sidebar({ items, collapsed = false, onToggle, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "glass flex h-full flex-col border-r border-white/10 transition-all duration-300",
        collapsed ? "w-14" : "w-56",
        className,
      )}
    >
      {onToggle && (
        <button
          onClick={onToggle}
          className="flex h-10 w-full items-center justify-end px-3 text-white/50 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-sm">{collapsed ? "→" : "←"}</span>
        </button>
      )}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              item.active
                ? "bg-white/15 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white",
            )}
          >
            {item.icon && (
              <span className="flex-shrink-0 text-base">{item.icon}</span>
            )}
            {!collapsed && <span>{item.label}</span>}
          </a>
        ))}
      </nav>
    </aside>
  );
}
