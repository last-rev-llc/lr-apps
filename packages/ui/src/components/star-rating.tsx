"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  showLabel = false,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const interactive = typeof onChange === "function";

  const iconSize = size === "sm" ? 12 : 14;
  const fontSize = size === "sm" ? "text-xs" : "text-sm";
  const displayValue = hovered ?? value;
  const rounded = Math.round(displayValue);

  if (!value && !interactive) return null;

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => {
        const starNum = i + 1;
        const filled = starNum <= (hovered !== null ? hovered : Math.round(value));
        return (
          <span
            key={i}
            className={cn(
              "text-amber-500 transition-transform duration-100",
              interactive && "cursor-pointer hover:scale-110",
            )}
            onMouseEnter={interactive ? () => setHovered(starNum) : undefined}
            onMouseLeave={interactive ? () => setHovered(null) : undefined}
            onClick={interactive ? () => onChange?.(starNum) : undefined}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? `Rate ${starNum} out of ${max}` : undefined}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        );
      })}
      {showLabel && (
        <span className={cn("ml-1 text-white/60", fontSize)}>
          {value}/{max}
        </span>
      )}
    </span>
  );
}
