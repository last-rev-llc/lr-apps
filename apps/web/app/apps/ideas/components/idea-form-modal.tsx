"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui";
import { createIdea, updateIdea } from "../actions";
import type { Idea, IdeaEffort } from "../lib/types";
import { CATEGORIES } from "./ideas-app";

type Mode = "create" | "edit";

interface IdeaFormModalProps {
  mode: Mode;
  idea?: Idea;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface FormState {
  title: string;
  description: string;
  category: string;
  tags: string;
  sourceUrl: string;
  feasibility: string;
  impact: string;
  effort: IdeaEffort | "";
}

function initialFromIdea(idea?: Idea): FormState {
  return {
    title: idea?.title ?? "",
    description: idea?.description ?? "",
    category: (idea?.category as string) ?? "",
    tags: (idea?.tags ?? []).join(", "),
    sourceUrl: idea?.sourceUrl ?? "",
    feasibility: idea?.feasibility != null ? String(idea.feasibility) : "",
    impact: idea?.impact != null ? String(idea.impact) : "",
    effort: (idea?.effort as IdeaEffort | null) ?? "",
  };
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function IdeaFormModal({
  mode,
  idea,
  open,
  onClose,
  onSaved,
}: IdeaFormModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialFromIdea(idea));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialFromIdea(idea));
      setError(null);
    }
  }, [open, idea]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "create") {
        const result = await createIdea({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          category: form.category.trim() || undefined,
          tags: parseTags(form.tags),
          sourceUrl: form.sourceUrl.trim() || undefined,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
      } else if (idea) {
        const feasibilityNum =
          form.feasibility === "" ? null : Number(form.feasibility);
        const impactNum = form.impact === "" ? null : Number(form.impact);
        const result = await updateIdea(idea.id, {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          category: form.category.trim() || undefined,
          tags: parseTags(form.tags),
          sourceUrl: form.sourceUrl.trim() || undefined,
          feasibility: feasibilityNum,
          impact: impactNum,
          effort: form.effort === "" ? null : form.effort,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      onSaved?.();
      router.refresh();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New Idea" : "Edit Idea"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <datalist id="idea-categories">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-white/70">Title</span>
            <input
              type="text"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-white/70">Description</span>
            <textarea
              maxLength={5000}
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-white/70">Category</span>
            <input
              type="text"
              list="idea-categories"
              maxLength={80}
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className="rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-white/70">Tags (comma-separated)</span>
            <input
              type="text"
              value={form.tags}
              onChange={(e) =>
                setForm((f) => ({ ...f, tags: e.target.value }))
              }
              className="rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-white/70">Source URL (optional)</span>
            <input
              type="url"
              maxLength={2048}
              value={form.sourceUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, sourceUrl: e.target.value }))
              }
              className="rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
            />
          </label>

          {mode === "edit" && (
            <div className="flex flex-wrap gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs min-w-[100px]">
                <span className="text-white/70">Feasibility (0-10)</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.feasibility}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, feasibility: e.target.value }))
                  }
                  className="rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs min-w-[100px]">
                <span className="text-white/70">Impact (0-10)</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.impact}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, impact: e.target.value }))
                  }
                  className="rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs min-w-[100px]">
                <span className="text-white/70">Effort</span>
                <select
                  value={form.effort}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      effort: e.target.value as IdeaEffort | "",
                    }))
                  }
                  className="rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
                >
                  <option value="">—</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400" role="alert">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving…"
                : mode === "create"
                  ? "Create"
                  : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
