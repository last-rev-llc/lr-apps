"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface PillItem {
  label: string;
  icon?: string;
}

export interface PillListProps {
  items: (string | PillItem)[];
  selected?: string | string[];
  onSelect?: (label: string) => void;
  size?: "sm" | "md";
  className?: string;
}

function normalizeItem(item: string | PillItem): PillItem {
  return typeof item === "string" ? { label: item } : item;
}

export function PillList({
  items,
  selected,
  onSelect,
  size = "md",
  className,
}: PillListProps) {
  const interactive = typeof onSelect === "function";

  const isSelected = (label: string): boolean => {
    if (!selected) return false;
    if (Array.isArray(selected)) return selected.includes(label);
    return selected === label;
  };

  if (!items.length) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        className,
      )}
    >
      {items.map((raw, i) => {
        const item = normalizeItem(raw);
        const active = isSelected(item.label);
        return (
          <span
            key={i}
            onClick={interactive ? () => onSelect?.(item.label) : undefined}
            role={interactive ? "button" : undefined}
            aria-pressed={interactive ? active : undefined}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border transition-all duration-150",
              size === "sm"
                ? "px-2 py-0.5 text-xs"
                : "px-3 py-1 text-sm",
              active
                ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                : "border-white/15 bg-white/8 text-white/70",
              interactive && "cursor-pointer hover:border-white/30 hover:text-white",
            )}
          >
            {item.icon && <span>{item.icon}</span>}
            {item.label}
          </span>
        );
      })}
    </div>
  );
}
