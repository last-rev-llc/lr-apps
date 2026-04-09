"use client";

import { useState } from "react";
import { Button, Textarea } from "@repo/ui";
import type { SlangTerm, GenerationConfig } from "../lib/types";
import { TRANSLATOR_MAPS } from "../lib/generations";

interface Props {
  terms: SlangTerm[];
  gen: GenerationConfig;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function translateToGen(
  text: string,
  slug: string,
  terms: SlangTerm[]
): string {
  const map = TRANSLATOR_MAPS[slug] ?? {};
  let result = escapeHtml(text);
  let anyReplaced = false;

  // Sort by key length descending to replace longer phrases first
  const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
  for (const [eng, gen] of sorted) {
    const re = new RegExp(`\\b${eng}\\b`, "gi");
    if (re.test(result)) {
      anyReplaced = true;
      result = result.replace(
        re,
        `<strong class="text-accent">${escapeHtml(gen)}</strong>`
      );
    }
  }

  if (!anyReplaced) {
    // Pull a few random terms to suggest
    const suggestions = terms
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((t) => t.term)
      .join(", ");
    return `<span class="text-muted-foreground">Couldn't find common words to translate. Try terms like: ${suggestions}</span>`;
  }
  return result;
}

function translateFromGen(text: string, terms: SlangTerm[]): string {
  const slangMap: Record<string, string> = {};
  for (const t of terms) {
    slangMap[t.term.toLowerCase()] = t.definition;
    for (const alias of t.aliases ?? []) {
      if (alias) slangMap[alias.toLowerCase()] = t.definition;
    }
  }

  const sorted = Object.entries(slangMap).sort(
    (a, b) => b[0].length - a[0].length
  );
  let result = escapeHtml(text);
  let found = false;

  for (const [slang, def] of sorted) {
    const escaped = slang.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    if (re.test(result)) {
      found = true;
      const shortDef = def.split(".")[0].trim();
      result = result.replace(
        re,
        `<strong class="text-accent" title="${escapeHtml(def)}">[${escapeHtml(shortDef)}]</strong>`
      );
    }
  }

  if (!found) {
    const suggestions = terms
      .slice(0, 5)
      .map((t) => t.term)
      .join(", ");
    return `<span class="text-muted-foreground">Couldn't find any ${terms[0]?.generation ?? "gen"} slang in there. Try: ${suggestions}</span>`;
  }
  return result;
}

export function SlangTranslator({ terms, gen }: Props) {
  const [direction, setDirection] = useState<"to-gen" | "from-gen">("to-gen");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleTranslate = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setResult(
        `<span class="text-muted-foreground">Type something first!</span>`
      );
      return;
    }
    if (direction === "to-gen") {
      setResult(translateToGen(trimmed, gen.slug, terms));
    } else {
      setResult(translateFromGen(trimmed, terms));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Direction toggle */}
      <div className="flex rounded-xl overflow-hidden border border-surface-border">
        <button
          onClick={() => {
            setDirection("to-gen");
            setResult(null);
          }}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-all ${
            direction === "to-gen"
              ? "text-black"
              : "bg-surface-card text-muted-foreground hover:text-foreground"
          }`}
          style={direction === "to-gen" ? { background: gen.color } : undefined}
        >
          English → {gen.name} {gen.emoji}
        </button>
        <button
          onClick={() => {
            setDirection("from-gen");
            setResult(null);
          }}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-all ${
            direction === "from-gen"
              ? "text-black"
              : "bg-surface-card text-muted-foreground hover:text-foreground"
          }`}
          style={
            direction === "from-gen" ? { background: gen.color } : undefined
          }
        >
          {gen.name} → English 📚
        </button>
      </div>

      {/* Input */}
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          direction === "to-gen"
            ? "Type normal English here..."
            : `Type ${gen.name} slang here...`
        }
        className="min-h-[120px] resize-vertical bg-surface-card font-sans"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTranslate();
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">⌘+Enter to translate</p>
        <Button
          onClick={handleTranslate}
          className="text-black font-semibold"
          style={{ background: gen.color }}
        >
          Translate {gen.emoji}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="p-4 rounded-xl border border-surface-border bg-surface-raised text-sm leading-relaxed min-h-[80px]">
          <div dangerouslySetInnerHTML={{ __html: result }} />
        </div>
      )}

      {/* Tips */}
      <div className="p-3 rounded-lg bg-surface-raised border border-surface-border">
        <p className="text-xs text-muted-foreground font-semibold mb-1">
          Tips for {gen.name} translator:
        </p>
        <p className="text-xs text-muted-foreground">
          {direction === "to-gen"
            ? `Try common words like "good", "cool", "friend", "yes", "leave", "weird"`
            : `Paste ${gen.name} text to decode it into plain English`}
        </p>
      </div>
    </div>
  );
}
