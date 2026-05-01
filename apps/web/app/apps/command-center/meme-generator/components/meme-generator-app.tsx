"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button, Card, CardContent, PageHeader } from "@repo/ui";
import { renderMeme } from "../lib/render-meme";
import { loadTemplateImage } from "../lib/image-cache";
import type { MemeTemplate, TextZone } from "../lib/types";

const W = 600;
const H = 450;

function legacyZones(): TextZone[] {
  return [
    {
      id: "top",
      label: "Top text",
      x: 20,
      y: 20,
      width: 560,
      height: 90,
      align: "center",
      vAlign: "top",
      uppercase: true,
      defaultText: "WHEN YOU FINALLY",
    },
    {
      id: "bottom",
      label: "Bottom text",
      x: 20,
      y: 20,
      width: 560,
      height: H - 40,
      align: "center",
      vAlign: "bottom",
      uppercase: true,
      defaultText: "SHIP THE FEATURE",
    },
  ];
}

const TEMPLATES: MemeTemplate[] = [
  {
    id: "dark",
    name: "Dark Mode",
    imageWidth: W,
    imageHeight: H,
    backgroundColor: "#0d0d0d",
    defaultTextColor: "#ffffff",
    legacyEmoji: "🌑",
    textZones: legacyZones(),
  },
  {
    id: "matrix",
    name: "Matrix",
    imageWidth: W,
    imageHeight: H,
    backgroundColor: "#001a00",
    defaultTextColor: "#00ff41",
    legacyEmoji: "🟢",
    textZones: legacyZones(),
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    imageWidth: W,
    imageHeight: H,
    backgroundColor: "#1a0533",
    defaultTextColor: "#ff71ce",
    legacyEmoji: "🌸",
    textZones: legacyZones(),
  },
  {
    id: "fire",
    name: "Fire",
    imageWidth: W,
    imageHeight: H,
    backgroundColor: "#1a0a00",
    defaultTextColor: "#ff6b35",
    legacyEmoji: "🔥",
    textZones: legacyZones(),
  },
  {
    id: "ice",
    name: "Ice Cold",
    imageWidth: W,
    imageHeight: H,
    backgroundColor: "#001a2e",
    defaultTextColor: "#7dd8ff",
    legacyEmoji: "❄️",
    textZones: legacyZones(),
  },
  {
    id: "classic",
    name: "Classic",
    imageWidth: W,
    imageHeight: H,
    backgroundColor: "#ffffff",
    defaultTextColor: "#000000",
    legacyEmoji: "😂",
    textZones: legacyZones(),
  },
];

function defaultZoneText(zones: TextZone[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const z of zones) {
    out[z.id] = z.defaultText ?? "";
  }
  return out;
}

export function MemeGeneratorApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("dark");
  const [fontSize, setFontSize] = useState(48);
  const [generated, setGenerated] = useState(false);

  const template =
    TEMPLATES.find((t) => t.id === selectedTemplate) ?? TEMPLATES[0];

  const [zoneText, setZoneText] = useState<Record<string, string>>(() =>
    defaultZoneText(template.textZones),
  );

  // When the template changes, reseed any zones that don't yet have a value
  // for the new template. Preserve existing user edits where the zone id
  // overlaps so changing template doesn't wipe their text.
  useEffect(() => {
    setZoneText((prev) => {
      const seeded = defaultZoneText(template.textZones);
      const merged: Record<string, string> = {};
      for (const z of template.textZones) {
        merged[z.id] = prev[z.id] ?? seeded[z.id] ?? "";
      }
      return merged;
    });
  }, [template]);

  const drawMeme = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = template.imageWidth;
    canvas.height = template.imageHeight;

    let image: HTMLImageElement | undefined;
    if (template.imagePath) {
      try {
        image = await loadTemplateImage(template.imagePath);
      } catch {
        image = undefined;
      }
    }

    renderMeme(ctx, { template, zoneText, fontSize, image });
    setGenerated(true);
  }, [template, zoneText, fontSize]);

  useEffect(() => {
    void drawMeme();
  }, [drawMeme]);

  function downloadMeme() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "meme.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function copyMeme() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      navigator.clipboard
        .write([new ClipboardItem({ "image/png": blob })])
        .catch(console.error);
    });
  }

  function setZoneValue(id: string, value: string) {
    setZoneText((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="😂 Meme Generator"
        subtitle="Create instant memes — no server needed"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Controls */}
        <div className="space-y-4">
          <Card className="p-4">
            <CardContent className="p-0 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Text</h3>
              {template.textZones.map((zone) => {
                const inputId = `meme-zone-${zone.id}`;
                return (
                  <div key={zone.id}>
                    <label
                      htmlFor={inputId}
                      className="text-xs text-muted-foreground mb-1 block"
                    >
                      {zone.label}
                    </label>
                    <input
                      id={inputId}
                      type="text"
                      value={zoneText[zone.id] ?? ""}
                      onChange={(e) => setZoneValue(zone.id, e.target.value)}
                      placeholder={`${zone.label}…`}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-foreground text-sm outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                );
              })}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Font size: {fontSize}px
                </label>
                <input
                  type="range"
                  min={20}
                  max={80}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Template selector */}
          <Card className="p-4">
            <CardContent className="p-0">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Style
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map((t) => (
                  <Button
                    key={t.id}
                    variant={selectedTemplate === t.id ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`flex flex-col items-center gap-1 h-auto p-2 ${
                      selectedTemplate === t.id
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                        : "bg-surface hover:bg-surface-hover"
                    }`}
                  >
                    <span className="text-lg">{t.legacyEmoji ?? "🖼️"}</span>
                    <span>{t.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadMeme}
              className="flex-1 bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
            >
              ⬇ Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyMeme}
              className="flex-1"
            >
              📋 Copy
            </Button>
          </div>
        </div>

        {/* Canvas preview */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Preview</h3>
          <div className="rounded-xl overflow-hidden border border-surface-border">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          {generated && (
            <div className="text-xs text-muted-foreground text-center">
              Live preview — updates as you type
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
