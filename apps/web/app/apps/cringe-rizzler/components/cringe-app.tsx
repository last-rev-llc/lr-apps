"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Button,
  Card,
  CardContent,
} from "@repo/ui";
import { SLANG_GLOSSARY, SLANG_MAP, SCENARIOS, CATEGORIES } from "../data/slang";
import { generatePhrase, generateMemeCaption } from "../lib/actions";
import { getRandomTerms } from "../lib/utils";
import type { GeneratedPhrase, SavedItem, FilterType } from "../lib/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function vibeColor(score: number) {
  if (score >= 8) return "#22c55e";
  if (score >= 5) return "#eab308";
  return "#ef4444";
}

function VibeBar({ score }: { score: number }) {
  const pct = Math.min(100, (score / 10) * 100);
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-[11px] text-white/40">Vibe</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: vibeColor(score) }}
        />
      </div>
      <span className="text-[12px] font-bold" style={{ color: vibeColor(score) }}>
        {score}/10
      </span>
    </div>
  );
}

function CategoryBadge({ cat }: { cat: string }) {
  const colors: Record<string, string> = {
    personality: "#ec4899",
    expression: "#a855f7",
    quality: "#f59e0b",
    achievement: "#22c55e",
    internet: "#3b82f6",
    fashion: "#f43f5e",
    relationship: "#fb7185",
    food: "#fb923c",
    looksmax: "#c084fc",
    action: "#34d399",
    behavior: "#60a5fa",
    judgment: "#fbbf24",
  };
  const color = colors[cat] ?? "#94a3b8";
  return (
    <span
      className="inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
      style={{ background: color + "20", color }}
    >
      {cat}
    </span>
  );
}

function copyToClipboard(text: string, onDone?: () => void) {
  navigator.clipboard.writeText(text).then(() => onDone?.());
}

// ─── Phrase Tab ───────────────────────────────────────────────────────────────

function PhraseTab() {
  const [phrase, setPhrase] = useState<GeneratedPhrase | null>(null);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const terms = await getRandomTerms(3);
        const result = await generatePhrase(terms);
        setPhrase(result);
      } catch {
        setError("Failed to generate phrase. Try again!");
      }
    });
  }

  function handleSave() {
    if (!phrase) return;
    const item: SavedItem = {
      id: `phrase-${Date.now()}`,
      type: "phrase",
      content: phrase.text,
      slang_terms: phrase.terms.map((t) => t.term),
      created_at: new Date().toISOString(),
    };
    setSaved((prev) => [item, ...prev]);
  }

  function handleCopy() {
    if (!phrase) return;
    copyToClipboard(phrase.text, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Result card */}
      <Card className="border-pink-500/20 glass-sm">
        <CardContent className="p-6 text-center min-h-[180px] flex flex-col items-center justify-center">
          {isPending ? (
            <div className="space-y-3">
              <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white/40 text-sm">Generating maximum cringe...</p>
            </div>
          ) : phrase ? (
            <div className="space-y-4 w-full">
              <p className="text-xl font-bold leading-relaxed text-white">
                &ldquo;{phrase.text}&rdquo;
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {phrase.terms.map((t) => (
                  <span
                    key={t.term}
                    className="text-xs px-3 py-1.5 rounded-xl font-medium"
                    style={{
                      background: "rgba(236,72,153,0.15)",
                      color: "#f9a8d4",
                      border: "1px solid rgba(236,72,153,0.2)",
                    }}
                  >
                    <span className="font-bold">{t.term}</span>{" "}
                    <span className="opacity-70">— {t.def}</span>
                  </span>
                ))}
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2 justify-center flex-wrap pt-1">
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 hover:border-pink-400/50"
                >
                  ♥ Save
                </Button>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 hover:border-violet-400/50"
                >
                  {copied ? "✓ Copied!" : "⎘ Copy"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-5xl opacity-30">💀</div>
              <p className="text-white/40 text-sm">
                Hit the button to generate your first cringe phrase
              </p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          onClick={handleGenerate}
          disabled={isPending}
          className="px-8 py-3 text-base font-bold rounded-xl text-white border-0"
          style={{
            background: "linear-gradient(135deg, #ec4899, #a855f7)",
            boxShadow: "0 0 20px rgba(236,72,153,0.4)",
          }}
        >
          {isPending ? "Generating..." : "✨ Generate New Phrase"}
        </Button>
      </div>

      {/* Saved collection */}
      {saved.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Saved This Session
          </h3>
          {saved.map((item) => (
            <Card key={item.id} className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 leading-relaxed">
                      &ldquo;{item.content}&rdquo;
                    </p>
                    {item.slang_terms && item.slang_terms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.slang_terms.map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="text-[10px] bg-pink-500/10 text-pink-300"
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(item.content, () => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      })
                    }
                    className="text-white/30 hover:text-white/70 transition-colors shrink-0 text-xs"
                    title="Copy"
                  >
                    ⎘
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Meme Tab ─────────────────────────────────────────────────────────────────

interface MemeState {
  scenario: string;
  topText: string;
  bottomText: string;
  terms: string[];
  templateIdx: number;
}

interface MemeTemplate {
  id: string;
  name: string;
  url: string;
}

function MemeTab() {
  const [meme, setMeme] = useState<MemeState | null>(null);
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadTemplates = useCallback(async () => {
    if (templates.length > 0) return;
    setLoadingTemplates(true);
    try {
      const r = await fetch("https://api.imgflip.com/get_memes");
      const d = await r.json();
      if (d.success) setTemplates(d.data.memes.slice(0, 100));
    } catch {
      // ignore
    }
    setLoadingTemplates(false);
  }, [templates.length]);

  function handlePickScenario(scenario: string) {
    startTransition(async () => {
      await loadTemplates();
      const terms = await getRandomTerms(2);
      const { topText, bottomText } = await generateMemeCaption(scenario, terms);
      const templateIdx = Math.floor(Math.random() * Math.max(1, templates.length));
      setMeme({ scenario, topText, bottomText, terms, templateIdx });
    });
  }

  function cycleMeme(dir: number) {
    if (!meme || templates.length === 0) return;
    setMeme((prev) =>
      prev
        ? {
            ...prev,
            templateIdx: (prev.templateIdx + dir + templates.length) % templates.length,
          }
        : null
    );
  }

  const currentTemplate = meme && templates.length > 0 ? templates[meme.templateIdx] : null;

  function drawCanvas(img: HTMLImageElement) {
    const canvas = canvasRef.current;
    if (!canvas || !meme) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = img.naturalWidth || 600;
    canvas.height = img.naturalHeight || 600;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const fs = 48 * (canvas.width / 600);
    ctx.font = `bold ${fs}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = fs / 12;
    ctx.lineJoin = "round";

    function drawText(text: string, x: number, y: number, fromBottom = false) {
      const words = text.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx!.measureText(test).width > canvas!.width - 20 && line) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      const lineH = fs * 1.1;
      let startY = fromBottom ? y - (lines.length - 1) * lineH : y;
      for (const l of lines) {
        ctx!.strokeText(l, x, startY);
        ctx!.fillText(l, x, startY);
        startY += lineH;
      }
    }

    if (meme.topText) drawText(meme.topText.toUpperCase(), canvas.width / 2, fs + 10);
    if (meme.bottomText)
      drawText(meme.bottomText.toUpperCase(), canvas.width / 2, canvas.height - 15, true);
  }

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    drawCanvas(e.currentTarget);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement("a");
      link.download = `cringe-${(currentTemplate?.name ?? "meme").replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("CORS blocked download. Try right-clicking the canvas to save.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <p className="text-white/50 text-sm text-center">
        Pick a scenario → get a cringe caption → cycle through classic meme templates
      </p>

      {/* Scenario grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s}
            onClick={() => handlePickScenario(s)}
            disabled={isPending}
            className="px-3 py-2.5 rounded-xl text-sm text-left font-medium transition-all border border-violet-500/20 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-400/40 text-violet-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🎭 {s}
          </button>
        ))}
      </div>

      {isPending && (
        <Card className="border-violet-500/20 bg-white/5">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Generating cringe caption...</p>
          </CardContent>
        </Card>
      )}

      {!isPending && meme && (
        <Card className="border-violet-500/20 glass-sm">
          <CardContent className="p-5 space-y-4">
            {/* Caption display */}
            <div className="text-center space-y-1">
              <p className="text-xs text-white/40">Scenario: {meme.scenario}</p>
              <p className="font-bold text-white/90">
                &ldquo;{meme.topText}&rdquo; / &ldquo;{meme.bottomText}&rdquo;
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {meme.terms.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-300">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Template cycler */}
            {templates.length > 0 && (
              <>
                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={() => cycleMeme(-1)}
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:border-violet-400/50 hover:bg-violet-500/10 text-white/60 hover:text-violet-300 transition-all flex items-center justify-center text-xl font-bold"
                    aria-label="Previous template"
                  >
                    ‹
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/80">{currentTemplate?.name}</p>
                    <p className="text-xs text-white/40">
                      {meme.templateIdx + 1} of {templates.length}
                    </p>
                  </div>
                  <button
                    onClick={() => cycleMeme(1)}
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:border-violet-400/50 hover:bg-violet-500/10 text-white/60 hover:text-violet-300 transition-all flex items-center justify-center text-xl font-bold"
                    aria-label="Next template"
                  >
                    ›
                  </button>
                </div>

                {/* Hidden image triggers canvas draw */}
                {currentTemplate && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={currentTemplate.url}
                    src={currentTemplate.url}
                    alt=""
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    className="hidden"
                  />
                )}

                <div className="rounded-xl overflow-hidden bg-black/40 flex justify-center">
                  <canvas ref={canvasRef} className="max-w-full rounded-xl" />
                </div>
              </>
            )}

            {loadingTemplates && (
              <p className="text-xs text-white/40 text-center">Loading templates...</p>
            )}

            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                onClick={handleDownload}
                className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30"
              >
                ⬇ Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Glossary Tab ─────────────────────────────────────────────────────────────

function GlossaryTab() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = SLANG_GLOSSARY.filter((s) => {
    const matchSearch =
      !search ||
      s.term.toLowerCase().includes(search.toLowerCase()) ||
      s.definition.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || s.category === activeCategory;
    return matchSearch && matchCategory;
  }).sort((a, b) => b.vibeScore - a.vibeScore);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search slang or definition..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all"
        />
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-500/50 transition-all"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#0d0d1a]">
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-white/30">
        {filtered.length} term{filtered.length !== 1 ? "s" : ""} — sorted by vibe score
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((item) => (
          <Card key={item.term} className="border-white/8 bg-white/5 hover:bg-white/8 transition-all">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-white text-base">{item.term}</h3>
                <CategoryBadge cat={item.category} />
              </div>
              <p className="text-white/60 text-sm leading-relaxed">{item.definition}</p>
              <VibeBar score={item.vibeScore} />
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-white/30">
          <div className="text-4xl mb-3">🤔</div>
          <p>No slang found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export function CringeApp() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-2">💀</div>
        <h1
          className="font-heading text-3xl font-black"
          style={{
            background: "linear-gradient(135deg, #ec4899, #a855f7, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Cringe Rizzler
        </h1>
        <p className="text-white/50 text-sm">
          Embarrass Gen Alpha with hilariously bad slang usage
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="phrases" className="w-full">
        <TabsList className="w-full max-w-md mx-auto flex bg-white/5 border border-white/10 p-1 rounded-xl">
          <TabsTrigger
            value="phrases"
            className="flex-1 text-sm data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 data-[state=active]:shadow-none rounded-lg transition-all text-white/50"
          >
            💬 Phrases
          </TabsTrigger>
          <TabsTrigger
            value="memes"
            className="flex-1 text-sm data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 data-[state=active]:shadow-none rounded-lg transition-all text-white/50"
          >
            🖼️ Memes
          </TabsTrigger>
          <TabsTrigger
            value="glossary"
            className="flex-1 text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 data-[state=active]:shadow-none rounded-lg transition-all text-white/50"
          >
            📖 Glossary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phrases" className="mt-6">
          <PhraseTab />
        </TabsContent>

        <TabsContent value="memes" className="mt-6">
          <MemeTab />
        </TabsContent>

        <TabsContent value="glossary" className="mt-6">
          <GlossaryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
