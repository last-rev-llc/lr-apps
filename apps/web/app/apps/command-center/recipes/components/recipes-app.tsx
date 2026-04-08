"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  PageHeader,
  PillList,
  Search,
  ViewToggle,
} from "@repo/ui";
import type { Recipe, ViewMode } from "../lib/types";

// ── Constants ────────────────────────────────────────────────────────────────

const RECIPE_TYPES = ["All", "App", "Automation", "Skill", "Rule"] as const;

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  App: { bg: "color-mix(in srgb, var(--color-pill-8) 15%, transparent)", text: "var(--color-pill-8)" },
  Automation: { bg: "color-mix(in srgb, var(--color-green) 15%, transparent)", text: "var(--color-green)" },
  Skill: { bg: "color-mix(in srgb, var(--color-accent) 15%, transparent)", text: "var(--color-accent-400)" },
  Rule: { bg: "color-mix(in srgb, var(--color-pill-4) 15%, transparent)", text: "var(--color-red)" },
};

// ── Component ────────────────────────────────────────────────────────────────

interface RecipesAppProps {
  initialRecipes: Recipe[];
}

export function RecipesApp({ initialRecipes }: RecipesAppProps) {
  const [recipes] = useState<Recipe[]>(initialRecipes);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = activeType === "All"
      ? recipes
      : recipes.filter((r) => r.type === activeType);
    if (q) {
      list = list.filter(
        (r) =>
          (r.name ?? "").toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [recipes, search, activeType]);

  const copyPrompt = useCallback(async (recipe: Recipe) => {
    if (!recipe.prompt) return;
    try {
      await navigator.clipboard.writeText(recipe.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="📚 Recipes"
        subtitle={`${filtered.length} recipe${filtered.length !== 1 ? "s" : ""} · Automation, app, skill, and rule templates`}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search recipes, tags…"
          className="flex-1"
        />
        <ViewToggle
          view={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
        />
      </div>

      {/* Type filters */}
      <PillList
        items={RECIPE_TYPES.map((t) => ({
          label: t === "All" ? "All" : `${t}s`,
        }))}
        selected={activeType === "All" ? "All" : `${activeType}s`}
        onSelect={(label) => {
          const raw = label === "All" ? "All" : label.replace(/s$/, "");
          setActiveType(raw);
        }}
        size="sm"
      />

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No recipes match that filter"
          description="Try a different type or search query"
        />
      ) : viewMode === "list" ? (
        <ListView recipes={filtered} onOpen={setSelectedRecipe} />
      ) : (
        <GridView recipes={filtered} onOpen={setSelectedRecipe} />
      )}

      {/* Detail dialog */}
      <Dialog
        open={!!selectedRecipe}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRecipe(null);
            setCopied(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-popover border-white/15 text-white">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <span>{selectedRecipe.icon ?? "📄"}</span>
                  <span>{selectedRecipe.name}</span>
                </DialogTitle>
              </DialogHeader>
              <RecipeDetail
                recipe={selectedRecipe}
                copied={copied}
                onCopy={() => copyPrompt(selectedRecipe)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Recipe Detail (modal body) ────────────────────────────────────────────────

function RecipeDetail({
  recipe,
  copied,
  onCopy,
}: {
  recipe: Recipe;
  copied: boolean;
  onCopy: () => void;
}) {
  const typeStyle = TYPE_COLORS[recipe.type ?? ""] ?? {
    bg: "color-mix(in srgb, var(--color-slate) 15%, transparent)",
    text: "var(--color-slate)",
  };

  return (
    <div className="space-y-4 mt-2">
      {/* Type + integrations + tags */}
      <div className="flex flex-wrap gap-2">
        <Badge
          className="text-[11px] px-2 py-0.5 border-0"
          style={{ background: typeStyle.bg, color: typeStyle.text }}
        >
          {recipe.type}
        </Badge>
        {(recipe.integrations ?? []).map((x) => (
          <Badge
            key={x}
            className="text-[11px] px-2 py-0.5 border-0 bg-white/8 text-white/60"
          >
            {x}
          </Badge>
        ))}
        {(recipe.tags ?? []).map((x) => (
          <span
            key={x}
            className="inline-block rounded-full px-2 py-0.5 text-[10px] bg-white/5 text-white/40 border border-white/10"
          >
            {x}
          </span>
        ))}
      </div>

      {/* Description */}
      {recipe.description && (
        <p className="text-sm text-white/60 leading-relaxed">
          {recipe.description}
        </p>
      )}

      {/* Skills */}
      {(recipe.skills ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-2">
            Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(recipe.skills ?? []).map((s) => (
              <span
                key={s}
                className="inline-block rounded-full px-2 py-0.5 text-[10px] border border-white/15 bg-white/8 text-white/60"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prompt */}
      {recipe.prompt && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">
              Prompt
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onCopy}
              className="h-7 text-xs border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            >
              {copied ? "✅ Copied!" : "📋 Copy"}
            </Button>
          </div>
          <pre className="rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-white/50 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-mono">
            {recipe.prompt}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Grid View ─────────────────────────────────────────────────────────────────

function GridView({
  recipes,
  onOpen,
}: {
  recipes: Recipe[];
  onOpen: (r: Recipe) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((r) => (
        <RecipeCard key={r.id} recipe={r} onOpen={onOpen} />
      ))}
    </div>
  );
}

function RecipeCard({
  recipe,
  onOpen,
}: {
  recipe: Recipe;
  onOpen: (r: Recipe) => void;
}) {
  const typeStyle = TYPE_COLORS[recipe.type ?? ""] ?? {
    bg: "color-mix(in srgb, var(--color-slate) 15%, transparent)",
    text: "var(--color-slate)",
  };

  return (
    <Card
      className="flex flex-col gap-3 p-4 cursor-pointer hover:border-white/25 transition-colors"
      onClick={() => onOpen(recipe)}
    >
      <CardContent className="p-0 flex flex-col gap-2">
        {/* Icon + title + type */}
        <div className="flex items-start gap-2">
          <span className="text-xl shrink-0">{recipe.icon ?? "📄"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-snug">
              {recipe.name}
            </p>
            <Badge
              className="mt-1 text-[10px] px-1.5 py-0.5 border-0"
              style={{ background: typeStyle.bg, color: typeStyle.text }}
            >
              {recipe.type}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
          {recipe.description}
        </p>

        {/* Integrations + tags */}
        <div className="flex flex-wrap gap-1">
          {(recipe.integrations ?? []).slice(0, 3).map((x) => (
            <span
              key={x}
              className="inline-block rounded px-1.5 py-0.5 text-[10px] bg-white/8 text-white/50"
            >
              {x}
            </span>
          ))}
          {(recipe.tags ?? []).slice(0, 3).map((x) => (
            <span
              key={x}
              className="inline-block rounded-full px-1.5 py-0.5 text-[10px] bg-white/5 text-white/30 border border-white/8"
            >
              {x}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── List View ─────────────────────────────────────────────────────────────────

function ListView({
  recipes,
  onOpen,
}: {
  recipes: Recipe[];
  onOpen: (r: Recipe) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {recipes.map((r) => {
        const typeStyle = TYPE_COLORS[r.type ?? ""] ?? {
          bg: "color-mix(in srgb, var(--color-slate) 15%, transparent)",
          text: "var(--color-slate)",
        };
        return (
          <div
            key={r.id}
            onClick={() => onOpen(r)}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer hover:border-white/20 transition-colors"
          >
            <span className="text-lg shrink-0">{r.icon ?? "📄"}</span>
            <span className="font-semibold text-sm text-white flex-shrink-0">
              {r.name}
            </span>
            <Badge
              className="shrink-0 text-[10px] px-1.5 py-0.5 border-0"
              style={{ background: typeStyle.bg, color: typeStyle.text }}
            >
              {r.type}
            </Badge>
            <span className="text-xs text-white/40 flex-1 truncate">
              {r.description}
            </span>
            <div className="flex gap-1 shrink-0">
              {(r.tags ?? []).slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="inline-block rounded-full px-1.5 py-0.5 text-[10px] bg-white/5 text-white/30 border border-white/8"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
