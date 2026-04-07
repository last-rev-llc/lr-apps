"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, PageHeader } from "@repo/ui";

interface MemeTemplate {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  textColor: string;
}

const TEMPLATES: MemeTemplate[] = [
  { id: "dark",     name: "Dark Mode",    emoji: "🌑", bg: "#0d0d0d",   textColor: "#ffffff" },
  { id: "matrix",   name: "Matrix",       emoji: "🟢", bg: "#001a00",   textColor: "#00ff41" },
  { id: "vaporwave",name: "Vaporwave",    emoji: "🌸", bg: "#1a0533",   textColor: "#ff71ce" },
  { id: "fire",     name: "Fire",         emoji: "🔥", bg: "#1a0a00",   textColor: "#ff6b35" },
  { id: "ice",      name: "Ice Cold",     emoji: "❄️", bg: "#001a2e",   textColor: "#7dd8ff" },
  { id: "classic",  name: "Classic",      emoji: "😂", bg: "#ffffff",   textColor: "#000000" },
];

export function MemeGeneratorApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [topText, setTopText] = useState("WHEN YOU FINALLY");
  const [bottomText, setBottomText] = useState("SHIP THE FEATURE");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("dark");
  const [fontSize, setFontSize] = useState(48);
  const [generated, setGenerated] = useState(false);

  const template = TEMPLATES.find((t) => t.id === selectedTemplate) ?? TEMPLATES[0];

  const drawMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 600;
    const H = 450;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = template.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid/pattern overlay
    ctx.strokeStyle = template.textColor + "12";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Center emoji
    ctx.font = "120px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = template.textColor;
    ctx.fillText(template.emoji, W / 2, H / 2);
    ctx.globalAlpha = 1;

    // Text function
    function drawText(text: string, y: number, stroke = true) {
      if (!text.trim()) return;
      ctx!.font = `900 ${fontSize}px Impact, Arial Black, sans-serif`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "top";
      const maxW = W - 40;
      // Word wrap
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx!.measureText(test).width > maxW && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);

      const lineH = fontSize * 1.2;
      const totalH = lines.length * lineH;
      let startY = y === 0 ? 20 : H - totalH - 20;

      lines.forEach((line) => {
        if (stroke) {
          ctx!.strokeStyle = "#000000";
          ctx!.lineWidth = fontSize / 8;
          ctx!.lineJoin = "round";
          ctx!.strokeText(line, W / 2, startY);
        }
        ctx!.fillStyle = template.textColor;
        ctx!.fillText(line, W / 2, startY);
        startY += lineH;
      });
    }

    drawText(topText.toUpperCase(), 0);
    drawText(bottomText.toUpperCase(), 1);

    setGenerated(true);
  }, [topText, bottomText, template, fontSize]);

  // Auto-draw on changes
  useEffect(() => {
    drawMeme();
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
      navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]).catch(console.error);
    });
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
          {/* Text inputs */}
          <Card className="p-4">
            <CardContent className="p-0 space-y-3">
              <h3 className="text-sm font-semibold text-white">Text</h3>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Top text</label>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="Top text…"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Bottom text</label>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="Bottom text…"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Font size: {fontSize}px</label>
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
              <h3 className="text-sm font-semibold text-white mb-3">Style</h3>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                      selectedTemplate === t.id
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                        : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                    }`}
                    style={{
                      background: selectedTemplate === t.id ? undefined : t.bg + "40",
                    }}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={downloadMeme}
              className="flex-1 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-semibold hover:bg-amber-500/30 transition-colors"
            >
              ⬇ Download
            </button>
            <button
              onClick={copyMeme}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              📋 Copy
            </button>
          </div>
        </div>

        {/* Canvas preview */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">Preview</h3>
          <div className="rounded-xl overflow-hidden border border-white/10">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          {generated && (
            <div className="text-xs text-white/25 text-center">Live preview — updates as you type</div>
          )}
        </div>
      </div>
    </div>
  );
}
