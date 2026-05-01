"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Input,
  Label,
} from "@repo/ui";
import UpgradePrompt from "@/components/UpgradePrompt";
import { TemplateGallery } from "./template-gallery";
import { AiCaptionModal } from "./ai-caption-modal";
import { renderMeme } from "../lib/render-meme";
import { loadTemplateImage } from "../lib/image-cache";
import { publicMemeTemplateUrl } from "../lib/template-thumbnail";
import type { MemeTemplate } from "../lib/types";

export interface MemeEditorProps {
  templates: MemeTemplate[];
  initialTemplateId?: string;
  canUseAiCaption?: boolean;
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

export function MemeEditor({
  templates,
  initialTemplateId,
  canUseAiCaption = false,
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
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  function onSelect(templateId: string) {
    const next = templates.find((t) => t.id === templateId);
    if (!next) return;
    setSelectedId(templateId);
    // Resetting zones to the new template's defaults — zone ids may differ
    // between templates so a per-template seed is correct, not a merge.
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
                    setUpgradeOpen(true);
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

            <div className="flex justify-end">
              <Button
                type="button"
                disabled={!titleIsValid}
                aria-disabled={!titleIsValid}
                data-testid="save-meme-button"
              >
                Save
              </Button>
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

      <Dialog
        open={upgradeOpen}
        onOpenChange={(next) => setUpgradeOpen(next)}
      >
        <DialogContent>
          <UpgradePrompt requiredTier="pro" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
