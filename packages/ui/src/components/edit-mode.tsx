"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface EditModeProps {
  value: string;
  onSave: (value: string) => void;
  label?: string;
  type?: "text" | "textarea";
  className?: string;
}

export function EditMode({
  value,
  onSave,
  label,
  type = "text",
  className,
}: EditModeProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync value prop when not editing
  React.useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Auto-focus when entering edit mode
  React.useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editing]);

  function handleSave() {
    onSave(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") handleCancel();
    if (e.key === "Enter" && type === "text") handleSave();
  }

  const inputClass = cn(
    "w-full rounded-lg border border-white/15 bg-white/8 px-3 py-2",
    "text-sm text-white placeholder:text-white/40",
    "focus:border-amber-500/60 focus:bg-white/10 focus:outline-none",
    "transition-all duration-150",
  );

  return (
    <div className={cn("group relative", className)}>
      {label && (
        <div className="mb-1.5 text-xs uppercase tracking-wide text-white/50">
          {label}
        </div>
      )}

      {editing ? (
        <div className="flex flex-col gap-2">
          {type === "textarea" ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className={cn(inputClass, "resize-y")}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClass}
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black transition-opacity duration-150 hover:opacity-90"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/60 transition-all duration-150 hover:bg-white/8 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <span className="flex-1 text-sm text-white/80">{value || <span className="text-white/30">—</span>}</span>
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit"
            className="flex-shrink-0 rounded p-1 text-white/30 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-white/8 hover:text-white"
          >
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
