"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setIdeaStatus } from "../actions";
import type { Idea, IdeaStatus } from "../lib/types";
import { STATUS_OPTIONS } from "./ideas-app";

const STATUS_COLORS: Record<string, string> = {
  new: "var(--color-blue)",
  backlog: "var(--color-slate-dim)",
  "in-progress": "var(--color-orange)",
  completed: "var(--color-pill-2)",
  archived: "var(--color-slate-dim)",
};

interface StatusDropdownProps {
  idea: Idea;
  onChanged?: () => void;
}

export function StatusDropdown({ idea, onChanged }: StatusDropdownProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const color = STATUS_COLORS[idea.status] ?? "var(--color-slate-dim)";

  return (
    <div className="relative">
      <select
        aria-label="Status"
        disabled={pending}
        value={idea.status}
        onChange={async (e) => {
          const newStatus = e.target.value as IdeaStatus;
          setPending(true);
          setError(null);
          const result = await setIdeaStatus(idea.id, newStatus);
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          onChanged?.();
          router.refresh();
        }}
        className="rounded text-[10px] px-1.5 py-0.5 border-0 cursor-pointer"
        style={{
          background: color + "22",
          color,
        }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="absolute top-full left-0 mt-1 text-[10px] text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
