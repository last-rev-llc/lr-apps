"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type ViewToggleView = "grid" | "list";

export interface ViewToggleProps {
  view: ViewToggleView;
  onChange: (view: ViewToggleView) => void;
  className?: string;
}

const VIEWS: Array<{ id: ViewToggleView; label: string; icon: React.ReactNode }> = [
  {
    id: "grid",
    label: "Grid",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    id: "list",
    label: "List",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="5" y1="3" x2="15" y2="3" />
        <line x1="5" y1="8" x2="15" y2="8" />
        <line x1="5" y1="13" x2="15" y2="13" />
        <circle cx="2" cy="3" r="1" fill="currentColor" stroke="none" />
        <circle cx="2" cy="8" r="1" fill="currentColor" stroke="none" />
        <circle cx="2" cy="13" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function ViewToggle({ view, onChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex gap-0.5 rounded-lg border border-white/15 bg-white/8 p-0.5",
        className,
      )}
      role="group"
      aria-label="View toggle"
    >
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          aria-label={`${v.label} view`}
          aria-pressed={view === v.id}
          className={cn(
            "flex h-7 w-8 items-center justify-center rounded-md border-none transition-all duration-150",
            view === v.id
              ? "bg-amber-500 text-black"
              : "bg-transparent text-white/50 hover:bg-white/12 hover:text-white",
          )}
        >
          {v.icon}
        </button>
      ))}
    </div>
  );
}
