"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@repo/ui";
import UpgradePrompt from "@/components/UpgradePrompt";
import type { Tier } from "@repo/billing";
import { TemplateGallery } from "./template-gallery";
import { AiCaptionModal } from "./ai-caption-modal";
import { ActionBar } from "./action-bar";
import { QuotaIndicator } from "./quota-indicator";
import { saveMeme } from "../actions";
import { renderMeme } from "../lib/render-meme";
import { loadTemplateImage } from "../lib/image-cache";
import { publicMemeTemplateUrl } from "../lib/template-thumbnail";
import { quotaUpgradeCopyForTier } from "../lib/upgrade-copy";
import type { MemeTemplate } from "../lib/types";

export interface MemeEditorProps {
  templates: MemeTemplate[];
  initialTemplateId?: string;
  canUseAiCaption?: boolean;
  tier?: Tier;
  quota?: number;
  initialMemeCount?: number;
}

const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 200;
const FONT_SIZE_DEFAULT = 48;

function defaultZoneText(template: MemeTemplate): Record<string, string> {
  const out: Record<string, string> = {};
  for (const zone of template.textZones) {
    out[zone.id] = zone.defaultText ?? "";
  }
  return out;
}

function clampFontSize(value: number): number {
  if (Number.isNaN(value)) return FONT_SIZE_DEFAULT;
  return Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, value));
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to capture canvas"));
        return;
      }
      navigator.clipboard
        .write([new ClipboardItem({ "image/png": blob })])
        .then(() => resolve())
        .catch(reject);
    }, "image/png");
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to encode canvas"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export function MemeEditor({
  templates,
  initialTemplateId,
  canUseAiCaption = false,
  tier = "free",
  quota,
  initialMemeCount = 0,
}: MemeEditorProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialTemplateId ?? templates[0]?.id,
  );

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId),
    [templates, selectedId],
  );

  const [zoneText, setZoneText] = useState<Record<string, string>>(() =>
    selected ? defaultZoneText(selected) : {},
  );
  const [title, setTitle] = useState("");
  const [fontSize, setFontSize] = useState<number>(FONT_SIZE_DEFAULT);
  const [aiOpen, setAiOpen] = useState(false);
  const [upgradeAiOpen, setUpgradeAiOpen] = useState(false);
  const [memeCount, setMemeCount] = useState(initialMemeCount);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectiveQuota = quota ?? Number.POSITIVE_INFINITY;

  function onSelect(templateId: string) {
    const next = templates.find((t) => t.id === templateId);
    if (!next) return;
    setSelectedId(templateId);
    setZoneText(defaultZoneText(next));
  }

  function onZoneChange(zoneId: string, value: string) {
    setZoneText((prev) => ({ ...prev, [zoneId]: value }));
  }

  const drawMeme = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !selected) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = selected.imageWidth;
    canvas.height = selected.imageHeight;

    let image: HTMLImageElement | undefined;
    if (selected.imagePath) {
      try {
        image = await loadTemplateImage(
          publicMemeTemplateUrl(selected.imagePath),
        );
      } catch {
        image = undefined;
      }
    }

    renderMeme(ctx, { template: selected, zoneText, fontSize, image });
  }, [selected, zoneText, fontSize]);

  useEffect(() => {
    void drawMeme();
  }, [drawMeme]);

  const titleIsValid = title.trim().length > 0;

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas || !selected || !titleIsValid) return;
    setSaving(true);
    setSaveError(null);
    try {
      const blob = await canvasToBlob(canvas);
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("templateId", selected.id);
      fd.set("textZones", JSON.stringify(zoneText));
      fd.set("fontSize", String(fontSize));
      fd.set("file", blob, "meme.png");
      const result = await saveMeme(fd);
      if (!result.ok) {
        setSaveError(result.error || "Failed to save meme");
        return;
      }
      setMemeCount((c) => c + 1);
    } catch (err) {
      const e = err as { name?: string; message?: string };
      if (e?.name === "QuotaExceededError") {
        setQuotaError(true);
        return;
      }
      setSaveError(e?.message || "Failed to save meme");
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadCanvas(canvas, `${title.trim() || "meme"}.png`);
  }

  function handleCopy() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void copyCanvasToClipboard(canvas).catch((err) => {
      setSaveError(err?.message || "Failed to copy");
    });
  }

  const quotaCopy = quotaUpgradeCopyForTier(tier);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Templates</h2>
        <TemplateGallery
          templates={templates}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>
      {selected && (
        <Card className="self-start">
          <CardContent className="space-y-4 p-4">
            <h2 className="text-base font-semibold text-foreground">
              {selected.name}
            </h2>

            <div className="space-y-1">
              <Label htmlFor="meme-title">
                Title <span className="text-muted-foreground">*</span>
              </Label>
              <Input
                id="meme-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your meme a name"
                required
                aria-required="true"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="ai-caption-button"
                aria-label="Generate caption with AI"
                onClick={() => {
                  if (canUseAiCaption) {
                    setAiOpen(true);
                  } else {
                    setUpgradeAiOpen(true);
                  }
                }}
              >
                {canUseAiCaption ? null : (
                  <span aria-hidden className="mr-1">
                    🔒
                  </span>
                )}
                Generate caption with AI
              </Button>
            </div>

            {selected.textZones.map((zone) => {
              const inputId = `zone-${zone.id}`;
              return (
                <div key={zone.id} className="space-y-1">
                  <Label htmlFor={inputId}>{zone.label}</Label>
                  <Input
                    id={inputId}
                    value={zoneText[zone.id] ?? ""}
                    onChange={(e) => onZoneChange(zone.id, e.target.value)}
                    placeholder={zone.defaultText ?? zone.label}
                  />
                </div>
              );
            })}

            <div className="space-y-1">
              <Label htmlFor="meme-font-size">
                Font size: {fontSize}px
              </Label>
              <input
                id="meme-font-size"
                data-testid="font-size-slider"
                type="range"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                value={fontSize}
                onChange={(e) =>
                  setFontSize(clampFontSize(Number(e.target.value)))
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Preview</h3>
              <div className="rounded-md border border-surface-border overflow-hidden">
                <canvas
                  ref={canvasRef}
                  data-testid="meme-canvas"
                  className="w-full h-auto block"
                />
              </div>
            </div>

            {saveError && (
              <p
                role="alert"
                data-testid="save-error"
                className="text-sm text-destructive"
              >
                {saveError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              {quota !== undefined ? (
                <QuotaIndicator
                  count={memeCount}
                  limit={quota}
                  tier={tier}
                />
              ) : (
                <span />
              )}
              <ActionBar
                onSave={handleSave}
                onDownload={handleDownload}
                onCopy={handleCopy}
                saveDisabled={!titleIsValid || memeCount >= effectiveQuota}
                saving={saving}
              />
            </div>

          </CardContent>
        </Card>
      )}

      {selected && canUseAiCaption && (
        <AiCaptionModal
          open={aiOpen}
          onOpenChange={setAiOpen}
          templateId={selected.id}
          onCaptions={(captions) =>
            setZoneText((prev) => ({ ...prev, ...captions }))
          }
        />
      )}

      <Dialog open={upgradeAiOpen} onOpenChange={setUpgradeAiOpen}>
        <DialogContent>
          <UpgradePrompt requiredTier="pro" />
        </DialogContent>
      </Dialog>

      <Dialog
        open={quotaError}
        onOpenChange={(next) => setQuotaError(next)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="quota-error-title">
              {quotaCopy.title}
            </DialogTitle>
          </DialogHeader>
          <p
            data-testid="quota-error-description"
            className="text-sm text-muted-foreground"
          >
            {quotaCopy.description}
          </p>
          {quotaCopy.ctaHref && quotaCopy.ctaLabel && (
            <div className="flex justify-end">
              <Link
                href={quotaCopy.ctaHref}
                className="inline-block px-4 py-2 bg-accent text-accent-foreground rounded-md text-sm font-semibold"
              >
                {quotaCopy.ctaLabel}
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
