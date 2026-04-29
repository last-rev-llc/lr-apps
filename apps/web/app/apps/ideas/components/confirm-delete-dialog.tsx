"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui";
import { deleteIdea } from "../actions";

interface ConfirmDeleteDialogProps {
  ideaId: string;
  ideaTitle: string;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function ConfirmDeleteDialog({
  ideaId,
  ideaTitle,
  open,
  onClose,
  onDeleted,
}: ConfirmDeleteDialogProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setPending(true);
    setError(null);
    const result = await deleteIdea(ideaId);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDeleted?.();
    router.refresh();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete idea?</DialogTitle>
          <DialogDescription>
            This will permanently delete &quot;{ideaTitle}&quot;. This cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="text-xs text-destructive" role="alert">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
