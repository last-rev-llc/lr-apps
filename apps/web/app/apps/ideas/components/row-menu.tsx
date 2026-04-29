"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { archiveIdea } from "../actions";
import type { Idea } from "../lib/types";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { IdeaFormModal } from "./idea-form-modal";

interface RowMenuProps {
  idea: Idea;
  onChanged?: () => void;
}

export function RowMenu({ idea, onChanged }: RowMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleArchive = async () => {
    setPending(true);
    const result = await archiveIdea(idea.id);
    setPending(false);
    setOpen(false);
    if (result.ok) {
      onChanged?.();
      router.refresh();
    }
  };

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          aria-label="Idea options"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((p) => !p);
          }}
          className="rounded px-1.5 py-1 text-xs text-white/40 transition-colors hover:text-white/80"
        >
          ⋮
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 rounded-xl border border-white/15 bg-popover p-1 shadow-xl min-w-[120px]">
            <button
              type="button"
              onClick={() => {
                setEditOpen(true);
                setOpen(false);
              }}
              className="block w-full rounded px-3 py-1.5 text-left text-xs text-white/70 hover:bg-white/10"
            >
              ✎ Edit
            </button>
            <button
              type="button"
              onClick={handleArchive}
              disabled={pending}
              className="block w-full rounded px-3 py-1.5 text-left text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
            >
              📥 Archive
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(true);
                setOpen(false);
              }}
              className="block w-full rounded px-3 py-1.5 text-left text-xs text-destructive hover:bg-surface-hover"
            >
              🗑 Delete
            </button>
          </div>
        )}
      </div>
      <IdeaFormModal
        mode="edit"
        idea={idea}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={onChanged}
      />
      <ConfirmDeleteDialog
        ideaId={idea.id}
        ideaTitle={idea.title}
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onDeleted={onChanged}
      />
    </>
  );
}
