"use client";

import * as React from "react";
import type { ChatflowTargetOutput } from "../schema";

export interface TargetPickerProps {
  targets: ChatflowTargetOutput[];
  value: string | null;
  onChange: (id: string) => void;
  onCreateNew: () => void;
  disabled?: boolean;
}

export function TargetPicker({
  targets,
  value,
  onChange,
  onCreateNew,
  disabled,
}: TargetPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="target-picker">
        Chatflow target
      </label>
      <select
        id="target-picker"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
      >
        <option value="" disabled>
          Select a target…
        </option>
        {targets.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onCreateNew}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
      >
        + New target
      </button>
    </div>
  );
}
