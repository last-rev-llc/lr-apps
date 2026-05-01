"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@repo/ui";
import { deleteMeme, updateMemeTitle } from "../../actions";
import type { MemeWithSignedUrl } from "../../actions";

export interface LibraryCardProps {
  meme: MemeWithSignedUrl;
  onDelete: (id: string) => void;
  onRestore: (meme: MemeWithSignedUrl) => void;
  onTitleUpdate: (id: string, title: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function LibraryCard({
  meme,
  onDelete,
  onRestore,
  onTitleUpdate,
}: LibraryCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(meme.title);
  const [savedTitle, setSavedTitle] = useState(meme.title);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) titleInputRef.current?.focus();
  }, [editing]);

  async function commitTitle() {
    const trimmed = title.trim();
    if (trimmed === savedTitle) {
      setEditing(false);
      return;
    }
    if (trimmed.length === 0) {
      setTitle(savedTitle);
      setEditing(false);
      return;
    }
    setPending(true);
    setError(null);
    // Optimistic update
    onTitleUpdate(meme.id, trimmed);
    try {
      const result = await updateMemeTitle(meme.id, trimmed);
      if (!result.ok) {
        setError(result.error || "Failed to update title");
        // Revert
        setTitle(savedTitle);
        onTitleUpdate(meme.id, savedTitle);
        return;
      }
      setSavedTitle(trimmed);
      setTitle(trimmed);
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to update title");
      setTitle(savedTitle);
      onTitleUpdate(meme.id, savedTitle);
    } finally {
      setPending(false);
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    onDelete(meme.id);
    try {
      const result = await deleteMeme(meme.id);
      if (!result.ok) {
        setError(result.error || "Failed to delete meme");
        onRestore(meme);
      }
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to delete meme");
      onRestore(meme);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  function loadIntoEditor() {
    router.push(`/apps/meme-generator?meme=${encodeURIComponent(meme.id)}`);
  }

  return (
    <Card data-testid={`library-card-${meme.id}`}>
      <CardContent className="space-y-3 p-3">
        <div className="aspect-[4/3] overflow-hidden rounded-md border border-surface-border">
          <img
            src={meme.signedUrl}
            alt={savedTitle || "Saved meme"}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="space-y-1">
          {editing ? (
            <Input
              ref={titleInputRef}
              value={title}
              disabled={pending}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => void commitTitle()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void commitTitle();
                } else if (e.key === "Escape") {
                  setTitle(savedTitle);
                  setEditing(false);
                }
              }}
              data-testid={`library-title-input-${meme.id}`}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="block w-full text-left text-sm font-medium text-foreground hover:text-accent"
              data-testid={`library-title-${meme.id}`}
              aria-label={`Edit title: ${savedTitle}`}
            >
              {savedTitle}
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDate(meme.createdAt)}
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="text-xs text-destructive"
            data-testid={`library-error-${meme.id}`}
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadIntoEditor}
            data-testid={`library-load-${meme.id}`}
          >
            Load into editor
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            data-testid={`library-delete-${meme.id}`}
          >
            Delete
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this meme?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              data-testid={`library-delete-cancel-${meme.id}`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              data-testid={`library-delete-confirm-${meme.id}`}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
