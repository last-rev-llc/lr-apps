"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@repo/ui";
import { generateMemeCaption } from "../actions";
import type { CaptionMap } from "../lib/ai-caption";

export interface AiCaptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  onCaptions: (captions: CaptionMap) => void;
}

const STYLES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "any", label: "Any" },
  { value: "wholesome", label: "Wholesome" },
  { value: "snarky", label: "Snarky" },
  { value: "absurd", label: "Absurd" },
];

function formatRetryAfter(resetAt: number): string {
  const seconds = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
  if (seconds <= 60) return `Try again in ${seconds}s.`;
  const minutes = Math.ceil(seconds / 60);
  return `Try again in ${minutes} min.`;
}

export function AiCaptionModal({
  open,
  onOpenChange,
  templateId,
  onCaptions,
}: AiCaptionModalProps) {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("any");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTopic("");
    setStyle("any");
    setError(null);
    setPending(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const trimmedTopic = topic.trim();
    if (trimmedTopic.length === 0) {
      setError("Topic is required");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await generateMemeCaption({
        topic: trimmedTopic,
        templateId,
        style: style === "any" ? undefined : style,
      });
      if (!result.ok) {
        setError(result.error || "Failed to generate caption");
        setPending(false);
        return;
      }
      onCaptions(result.captions);
      reset();
      onOpenChange(false);
    } catch (err) {
      const e = err as { name?: string; resetAt?: number; message?: string };
      if (e?.name === "RateLimitedError" && typeof e.resetAt === "number") {
        setError(`Rate limit reached. ${formatRetryAfter(e.resetAt)}`);
      } else if (e?.name === "FeatureAccessError") {
        setError("Upgrade required to use AI captions.");
      } else {
        setError(e?.message || "Failed to generate caption");
      }
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate caption with AI</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ai-caption-topic">
              Topic <span className="text-muted-foreground">*</span>
            </Label>
            <Input
              id="ai-caption-topic"
              autoFocus
              required
              maxLength={200}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What's the meme about?"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ai-caption-style">Style</Label>
            <select
              id="ai-caption-style"
              data-testid="ai-caption-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-foreground"
              disabled={pending}
            >
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p
              role="alert"
              data-testid="ai-caption-error"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Generating…" : "Generate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
