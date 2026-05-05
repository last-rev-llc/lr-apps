"use client";

import * as React from "react";

export interface ProgressOverlayProps {
  open: boolean;
  total: number;
  completed: number;
  errored: number;
  onCancel?: () => void;
}

export function ProgressOverlay({
  open,
  total,
  completed,
  errored,
  onCancel,
}: ProgressOverlayProps) {
  if (!open) return null;
  const done = completed + errored;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-overlay-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg">
        <h2
          id="progress-overlay-title"
          className="text-lg font-semibold leading-none tracking-tight"
        >
          Run in progress
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {done} of {total} completed
          {errored > 0 ? ` · ${errored} errored` : ""}
        </p>
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        {onCancel ? (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              Cancel run
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
