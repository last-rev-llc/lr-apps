"use client";

import { useState, useMemo } from "react";
import { Input, Badge, Button, Card, CardContent } from "@repo/ui";
import type { SlangTerm, GenerationConfig } from "../lib/types";

function vibeColor(score: number): string {
  if (score >= 9) return "var(--color-green)";
  if (score >= 7) return "var(--color-pill-7)";
  if (score >= 5) return "var(--color-yellow)";
  return "var(--color-red)";
}

function VibeBar({ score }: { score: number }) {
  const pct = Math.min(100, (score / 10) * 100);
  const color = vibeColor(score);
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[11px] text-muted-foreground">Vibe</span>
      <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[12px] font-bold tabular-nums" style={{ color }}>
        {score}/10
      </span>
    </div>
  );
}

interface Props {
  terms: SlangTerm[];
  gen: GenerationConfig;
}

export function SlangDictionary({ terms, gen }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(() => {
    const cats = new Set(terms.map((t) => t.category));
    return ["all", ...Array.from(cats).sort()];
  }, [terms]);

  const filtered = useMemo(() => {
    let r = [...terms];
    if (activeCategory !== "all") {
      r = r.filter(
        (t) => t.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          (t.aliases || []).some((a) => a.toLowerCase().includes(q))
      );
    }
    return r.sort((a, b) => b.vibeScore - a.vibeScore);
  }, [terms, search, activeCategory]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        placeholder="Search slang terms..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className="rounded-full capitalize h-7 px-3 text-xs font-semibold"
            style={activeCategory === cat ? { background: gen.color, color: "black" } : undefined}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} term{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Term cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🔍</p>
          <p>No slang found for that search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((term) => (
            <Card
              key={term.id}
              className="border-surface-border bg-surface-card hover:border-opacity-60 transition-all"
              style={
                { "--gen-color": gen.color } as React.CSSProperties
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg leading-tight">
                    {term.term}
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] shrink-0 capitalize"
                    style={{ borderColor: gen.color, color: gen.color }}
                  >
                    {term.category}
                  </Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-2">
                  {term.definition}
                </p>
                <p className="text-xs text-muted-foreground italic bg-surface-raised px-3 py-2 rounded-lg mb-2">
                  &quot;{term.example}&quot;
                </p>
                <VibeBar score={term.vibeScore} />
                {term.origin && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    📍 {term.origin}
                    {term.era ? ` · ${term.era}` : ""}
                  </p>
                )}
                {term.aliases && term.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {term.aliases.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="text-[10px] px-2 py-0.5 bg-surface-raised rounded-md text-muted-foreground"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {term.equivalents && Object.keys(term.equivalents).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-surface-border">
                    {Object.entries(term.equivalents)
                      .slice(0, 1)
                      .map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            🔄 Also:
                          </span>
                          <span className="text-[11px] font-semibold text-accent">
                            {val}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
