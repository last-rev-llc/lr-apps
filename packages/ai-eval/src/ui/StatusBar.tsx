"use client";

import * as React from "react";

export type AutoSaveState = "idle" | "saving" | "saved" | "error";

export interface StatusBarProps {
  total: number;
  completed: number;
  errored: number;
  active: number;
  autoSaveState?: AutoSaveState;
}

const autoSaveLabel: Record<AutoSaveState, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

export function StatusBar({
  total,
  completed,
  errored,
  active,
  autoSaveState = "idle",
}: StatusBarProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-4 py-2 text-sm text-card-foreground"
    >
      <Chip label="Total" value={total} tone="muted" />
      <Chip label="Active" value={active} tone="info" />
      <Chip label="Completed" value={completed} tone="success" />
      <Chip label="Errored" value={errored} tone="destructive" />
      {autoSaveState !== "idle" ? (
        <span
          className={
            autoSaveState === "error"
              ? "ml-auto text-xs text-destructive"
              : "ml-auto text-xs text-muted-foreground"
          }
        >
          {autoSaveLabel[autoSaveState]}
        </span>
      ) : null}
    </div>
  );
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "info" | "success" | "destructive";
}) {
  const toneClass = {
    muted: "bg-muted text-muted-foreground",
    info: "bg-secondary text-secondary-foreground",
    success: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </span>
  );
}
