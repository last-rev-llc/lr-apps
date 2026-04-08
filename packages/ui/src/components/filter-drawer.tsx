"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function FilterDrawer({
  open,
  onClose,
  title = "Filters",
  children,
  className,
}: FilterDrawerProps) {
  // Close on Escape key
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[999] bg-black/50 transition-opacity duration-250",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[1000] flex w-80 max-w-[90vw] flex-col",
          "border-l border-white/10 bg-navy-950 shadow-glass",
          "overflow-y-auto transition-transform duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]",
          open ? "translate-x-0" : "translate-x-full",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3 pt-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <svg
              className="h-4 w-4 text-amber-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="21" x2="14" y1="4" y2="4" />
              <line x1="10" x2="3" y1="4" y2="4" />
              <line x1="21" x2="12" y1="12" y2="12" />
              <line x1="8" x2="3" y1="12" y2="12" />
              <line x1="21" x2="16" y1="20" y2="20" />
              <line x1="12" x2="3" y1="20" y2="20" />
              <line x1="14" x2="14" y1="2" y2="6" />
              <line x1="8" x2="8" y1="10" y2="14" />
              <line x1="16" x2="16" y1="18" y2="22" />
            </svg>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center rounded-md p-1 text-white/50 transition-all duration-150 hover:bg-white/8 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          {children}
        </div>
      </div>
    </>
  );
}
