"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
  className?: string;
}

export function Search({
  value,
  onChange,
  placeholder = "Search…",
  debounce = 300,
  className,
}: SearchProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync external value changes (but not while focused)
  React.useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setLocalValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (debounce === 0) {
      onChange(next);
    } else {
      timerRef.current = setTimeout(() => onChange(next), debounce);
    }
  }

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={cn("relative flex items-center", className)}>
      <svg
        className="pointer-events-none absolute left-3 h-4 w-4 text-white/40"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-white/15 bg-white/8 py-2 pl-9 pr-4",
          "text-sm text-white placeholder:text-white/40",
          "backdrop-blur-sm transition-all duration-150",
          "focus:border-amber-500/60 focus:bg-white/10 focus:outline-none",
        )}
      />
    </div>
  );
}
