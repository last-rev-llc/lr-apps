"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@repo/db/client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  PageHeader,
  PillList,
  Search,
  StarRating,
  ViewToggle,
} from "@repo/ui";
import type {
  Idea,
  IdeaCategory,
  QuickFilterKey,
  ShowFilter,
  SortKey,
  ViewMode,
} from "../lib/types";

// ── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: IdeaCategory[] = [
  "Product",
  "Content",
  "Business",
  "Technical",
  "Creative",
  "Skills",
];

const CATEGORY_COLORS: Record<string, string> = {
  Product: "var(--color-pill-8)",
  Content: "var(--color-pill-9)",
  Business: "var(--color-accent)",
  Technical: "var(--color-blue)",
  Creative: "var(--color-pill-6)",
  Skills: "var(--color-orange)",
};

const STATUS_COLORS: Record<string, string> = {
  new: "var(--color-blue)",
  backlog: "var(--color-slate-dim)",
  "in-progress": "var(--color-orange)",
  completed: "var(--color-pill-2)",
  archived: "var(--color-slate-dim)",
};

const EFFORT_COLORS: Record<string, string> = {
  Low: "var(--color-pill-2)",
  Medium: "var(--color-accent)",
  High: "var(--color-pill-4)",
};

const SOURCE_COLORS: Record<string, string> = {
  generated: "var(--color-pill-1)",
  community: "var(--color-pill-8)",
  manual: "var(--color-accent)",
};

const QUICK_FILTERS: Array<{
  key: QuickFilterKey;
  label: string;
}> = [
  { key: "needs-rating", label: "⭐ Needs Rating" },
  { key: "top-rated", label: "🔥 Top Rated" },
  { key: "quick-wins", label: "🚀 Quick Wins" },
  { key: "new-today", label: "💡 New Today" },
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "rating", label: "Rating" },
  { value: "compositeScore", label: "Score" },
  { value: "createdAt", label: "Date" },
  { value: "title", label: "Title" },
];

const SNOOZE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "1 Day", value: "1d" },
  { label: "1 Week", value: "1w" },
  { label: "2 Weeks", value: "2w" },
  { label: "1 Month", value: "1mo" },
];

const SNOOZE_MS: Record<string, number> = {
  "1d": 86_400_000,
  "1w": 604_800_000,
  "2w": 1_209_600_000,
  "1mo": 2_592_000_000,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function isSnoozed(idea: Idea): boolean {
  if (!idea.snoozedUntil) return false;
  return new Date(idea.snoozedUntil) > new Date();
}

function totalScore(idea: Idea): number {
  return (
    (idea.rating ?? 0) * 2 +
    (idea.compositeScore ?? 0) +
    (idea.impact ?? 0) * 0.5 +
    (idea.feasibility ?? 0) * 0.5
  );
}

function scoreLabel(idea: Idea): string {
  if (idea.compositeScore) return idea.compositeScore.toFixed(1);
  const s = totalScore(idea);
  return s > 0 ? s.toFixed(1) : "–";
}

function isNewToday(idea: Idea): boolean {
  if (!idea.createdAt) return false;
  return new Date().getTime() - new Date(idea.createdAt).getTime() < 86_400_000;
}

// ── Component ────────────────────────────────────────────────────────────────

interface IdeasAppProps {
  initialIdeas: Idea[];
}

export function IdeasApp({ initialIdeas }: IdeasAppProps) {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilterKey | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortAsc, setSortAsc] = useState(false);
  const [showFilter, setShowFilter] = useState<ShowFilter>("active");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [snoozeMenuId, setSnoozeMenuId] = useState<string | null>(null);

  const db = createClient();

  // ── Mutations ────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ideasTable = () => (db as any).from("ideas");

  const rateIdea = useCallback(
    async (id: string, stars: number) => {
      let newRating = stars;
      setIdeas((prev) =>
        prev.map((idea) => {
          if (idea.id !== id) return idea;
          newRating = idea.rating === stars ? 0 : stars;
          return { ...idea, rating: newRating };
        }),
      );
      await ideasTable()
        .upsert({ id, rating: newRating })
        .catch((e: unknown) => console.warn("rating update failed:", e));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db],
  );

  const toggleHide = useCallback(
    async (id: string) => {
      let nextHidden = true;
      setIdeas((prev) =>
        prev.map((idea) => {
          if (idea.id !== id) return idea;
          nextHidden = !idea.hidden;
          return { ...idea, hidden: nextHidden };
        }),
      );
      await ideasTable()
        .upsert({ id, hidden: nextHidden })
        .catch((e: unknown) => console.warn("hide update failed:", e));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db],
  );

  const snoozeIdea = useCallback(
    async (id: string, duration: string) => {
      const until =
        duration === "show"
          ? null
          : new Date(Date.now() + SNOOZE_MS[duration]).toISOString();
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === id ? { ...idea, snoozedUntil: until } : idea,
        ),
      );
      await ideasTable()
        .upsert({ id, snoozedUntil: until })
        .catch((e: unknown) => console.warn("snooze update failed:", e));
      setSnoozeMenuId(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db],
  );

  // ── Filtering + Sorting ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = ideas;
    const q = search.toLowerCase().trim();

    // Show filter
    if (showFilter === "active") {
      list = list.filter(
        (x) =>
          !x.hidden &&
          x.status !== "completed" &&
          !x.completedAt &&
          !isSnoozed(x),
      );
    } else if (showFilter === "completed") {
      list = list.filter((x) => x.status === "completed" || !!x.completedAt);
    } else if (showFilter === "hidden") {
      list = list.filter((x) => !!x.hidden);
    } else if (showFilter === "snoozed") {
      list = list.filter((x) => isSnoozed(x));
    }
    // "all" = no extra filter

    // Quick filters
    if (activeQuickFilter === "needs-rating") {
      list = list.filter((x) => !x.rating || x.rating === 0);
    } else if (activeQuickFilter === "top-rated") {
      list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      return list;
    } else if (activeQuickFilter === "quick-wins") {
      list = list.filter(
        (x) => (x.feasibility ?? 0) >= 7 && x.effort === "Low",
      );
    } else if (activeQuickFilter === "new-today") {
      list = list.filter(isNewToday);
    }

    // Category filter
    if (activeCategory !== "All") {
      list = list.filter((x) => x.category === activeCategory);
    }

    // Search
    if (q) {
      list = list.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          (x.description ?? "").toLowerCase().includes(q) ||
          (x.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Sort
    const dir = sortAsc ? 1 : -1;
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rating":
          cmp = totalScore(b) - totalScore(a);
          break;
        case "compositeScore":
          cmp = (b.compositeScore ?? 0) - (a.compositeScore ?? 0);
          break;
        case "createdAt":
          cmp = (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
      }
      return (cmp || a.title.localeCompare(b.title)) * dir;
    });

    return list;
  }, [ideas, search, activeCategory, activeQuickFilter, sortKey, sortAsc, showFilter]);

  // ── Counts for show filter ────────────────────────────────────────────────
  const activeCount = ideas.filter(
    (x) => !x.hidden && x.status !== "completed" && !x.completedAt && !isSnoozed(x),
  ).length;
  const hiddenCount = ideas.filter((x) => !!x.hidden).length;
  const snoozedCount = ideas.filter((x) => isSnoozed(x)).length;
  const completedCount = ideas.filter(
    (x) => x.status === "completed" || !!x.completedAt,
  ).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="💡 Ideas"
        subtitle={`${filtered.length} idea${filtered.length !== 1 ? "s" : ""} · Track and prioritize by impact, feasibility, and effort`}
      />

      {/* Search + View toggle */}
      <div className="flex items-center gap-3">
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search ideas, tags…"
          className="flex-1"
        />
        <ViewToggle
          view={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
        />
      </div>

      {/* Quick filters */}
      <PillList
        items={QUICK_FILTERS.map((f) => ({ label: f.label }))}
        selected={
          activeQuickFilter
            ? QUICK_FILTERS.find((f) => f.key === activeQuickFilter)?.label
            : undefined
        }
        onSelect={(label) => {
          const f = QUICK_FILTERS.find((qf) => qf.label === label);
          if (!f) return;
          setActiveQuickFilter((prev) =>
            prev === f.key ? null : f.key,
          );
        }}
      />

      {/* Category + sort + show filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category pills */}
        <PillList
          items={["All", ...CATEGORIES]}
          selected={activeCategory}
          onSelect={setActiveCategory}
          size="sm"
        />
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Sort */}
          <div className="flex items-center gap-1 text-xs text-white/50">
            <span>Sort:</span>
            {SORT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={sortKey === opt.value ? "outline" : "ghost"}
                size="sm"
                onClick={() => {
                  if (sortKey === opt.value) {
                    setSortAsc((p) => !p);
                  } else {
                    setSortKey(opt.value);
                    setSortAsc(false);
                  }
                }}
                className={sortKey === opt.value ? "bg-amber-500/20 text-amber-400" : ""}
              >
                {opt.label}
                {sortKey === opt.value && (
                  <span className="ml-0.5">{sortAsc ? "↑" : "↓"}</span>
                )}
              </Button>
            ))}
          </div>
          {/* Show filter */}
          <div className="flex items-center gap-1 text-xs text-white/50">
            <span>Show:</span>
            {(
              [
                { v: "active", label: `Active (${activeCount})` },
                { v: "snoozed", label: `Snoozed (${snoozedCount})` },
                { v: "completed", label: `Done (${completedCount})` },
                { v: "hidden", label: `Hidden (${hiddenCount})` },
                { v: "all", label: "All" },
              ] as Array<{ v: ShowFilter; label: string }>
            ).map(({ v, label }) => (
              <Button
                key={v}
                variant={showFilter === v ? "outline" : "ghost"}
                size="sm"
                onClick={() => setShowFilter(v)}
                className={showFilter === v ? "bg-amber-500/20 text-amber-400" : ""}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No ideas match that filter"
          description="Try adjusting the search or filters"
        />
      ) : viewMode === "list" ? (
        <ListView
          ideas={filtered}
          onRate={rateIdea}
          onToggleHide={toggleHide}
          onSnooze={snoozeIdea}
          snoozeMenuId={snoozeMenuId}
          setSnoozeMenuId={setSnoozeMenuId}
        />
      ) : (
        <GridView
          ideas={filtered}
          onRate={rateIdea}
          onToggleHide={toggleHide}
          onSnooze={snoozeIdea}
          snoozeMenuId={snoozeMenuId}
          setSnoozeMenuId={setSnoozeMenuId}
        />
      )}
    </div>
  );
}

// ── Shared card actions ───────────────────────────────────────────────────────

interface CardActionsProps {
  idea: Idea;
  onRate: (id: string, stars: number) => void;
  onToggleHide: (id: string) => void;
  onSnooze: (id: string, duration: string) => void;
  snoozeMenuId: string | null;
  setSnoozeMenuId: (id: string | null) => void;
}

function CardActions({
  idea,
  onRate,
  onToggleHide,
  onSnooze,
  snoozeMenuId,
  setSnoozeMenuId,
}: CardActionsProps) {
  const snoozed = isSnoozed(idea);

  return (
    <div className="flex items-center gap-2">
      <StarRating
        value={idea.rating ?? 0}
        onChange={(v) => onRate(idea.id, v)}
        size="sm"
      />
      {/* Snooze */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSnoozeMenuId(snoozeMenuId === idea.id ? null : idea.id);
          }}
          title={
            snoozed
              ? `Snoozed until ${new Date(idea.snoozedUntil!).toLocaleDateString()}`
              : "Snooze"
          }
          className={`rounded px-1.5 py-1 text-xs transition-colors ${
            snoozed
              ? "text-amber-400"
              : "text-white/40 hover:text-white/80"
          }`}
        >
          ⏰
        </button>
        {snoozeMenuId === idea.id && (
          <div className="absolute bottom-full right-0 z-50 mb-1 rounded-xl border border-white/15 bg-popover p-1 shadow-xl min-w-[110px]">
            {snoozed && (
              <button
                onClick={() => onSnooze(idea.id, "show")}
                className="block w-full rounded px-3 py-1.5 text-left text-xs text-white/70 hover:bg-white/10"
              >
                👁 Show Now
              </button>
            )}
            {SNOOZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSnooze(idea.id, opt.value)}
                className="block w-full rounded px-3 py-1.5 text-left text-xs text-white/70 hover:bg-white/10"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Hide/show */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleHide(idea.id);
        }}
        title={idea.hidden ? "Restore" : "Dismiss"}
        className="rounded px-1.5 py-1 text-xs text-white/40 transition-colors hover:text-white/80"
      >
        {idea.hidden ? "👁" : "✕"}
      </button>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function BarTrack({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-1">
      <span className="text-[10px] text-white/40 whitespace-nowrap">
        {label} {value}/10
      </span>
      <div className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value * 10}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Grid view ─────────────────────────────────────────────────────────────────

interface ViewProps {
  ideas: Idea[];
  onRate: (id: string, stars: number) => void;
  onToggleHide: (id: string) => void;
  onSnooze: (id: string, duration: string) => void;
  snoozeMenuId: string | null;
  setSnoozeMenuId: (id: string | null) => void;
}

function GridView(props: ViewProps) {
  const { ideas, onRate, onToggleHide, onSnooze, snoozeMenuId, setSnoozeMenuId } = props;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          onRate={onRate}
          onToggleHide={onToggleHide}
          onSnooze={onSnooze}
          snoozeMenuId={snoozeMenuId}
          setSnoozeMenuId={setSnoozeMenuId}
        />
      ))}
    </div>
  );
}

function IdeaCard({
  idea,
  onRate,
  onToggleHide,
  onSnooze,
  snoozeMenuId,
  setSnoozeMenuId,
}: {
  idea: Idea;
} & Omit<ViewProps, "ideas">) {
  const catColor = CATEGORY_COLORS[idea.category] ?? "var(--color-slate-dim)";
  const effortColor = EFFORT_COLORS[idea.effort ?? ""] ?? "var(--color-slate-dim)";
  const statusColor = STATUS_COLORS[idea.status] ?? "var(--color-slate-dim)";
  const snoozed = isSnoozed(idea);

  return (
    <Card
      className={`flex flex-col gap-3 p-4 backdrop-blur transition-opacity ${
        idea.hidden || snoozed ? "opacity-60" : ""
      }`}
    >
      <CardContent className="p-0 flex flex-col gap-3">
        {/* Title + score */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-sm font-bold text-amber-400 border border-white/10">
            {scoreLabel(idea)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white leading-snug line-clamp-2">
              {idea.title}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            className="text-[10px] px-1.5 py-0.5 border-0"
            style={{
              background: catColor + "22",
              color: catColor,
            }}
          >
            {idea.category}
          </Badge>
          {idea.effort && (
            <Badge
              className="text-[10px] px-1.5 py-0.5 border-0"
              style={{
                background: effortColor + "22",
                color: effortColor,
              }}
            >
              {idea.effort}
            </Badge>
          )}
          <Badge
            className="text-[10px] px-1.5 py-0.5 border-0"
            style={{
              background: statusColor + "22",
              color: statusColor,
            }}
          >
            {idea.status}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
          {idea.description}
        </p>

        {/* Bars */}
        {(idea.impact || idea.feasibility) && (
          <div className="flex gap-3">
            {idea.impact != null && (
              <BarTrack value={idea.impact} color="var(--color-blue)" label="Impact" />
            )}
            {idea.feasibility != null && (
              <BarTrack
                value={idea.feasibility}
                color="var(--color-pill-2)"
                label="Feas."
              />
            )}
          </div>
        )}

        {/* Tags */}
        {(idea.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(idea.tags ?? []).slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded px-1.5 py-0.5 text-[10px] text-white/50 bg-white/8"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: date + actions */}
        <div className="flex items-center justify-between pt-1 border-t border-white/8">
          <span className="text-[10px] text-white/30">
            {idea.createdAt
              ? new Date(idea.createdAt).toLocaleDateString()
              : ""}
            {idea.author && (
              <span className="ml-1">· {idea.author}</span>
            )}
          </span>
          <CardActions
            idea={idea}
            onRate={onRate}
            onToggleHide={onToggleHide}
            onSnooze={onSnooze}
            snoozeMenuId={snoozeMenuId}
            setSnoozeMenuId={setSnoozeMenuId}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────

function ListView(props: ViewProps) {
  const { ideas, onRate, onToggleHide, onSnooze, snoozeMenuId, setSnoozeMenuId } = props;
  return (
    <div className="flex flex-col gap-2">
      {ideas.map((idea) => {
        const catColor = CATEGORY_COLORS[idea.category] ?? "var(--color-slate-dim)";
        const snoozed = isSnoozed(idea);
        return (
          <div
            key={idea.id}
            className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur transition-opacity ${
              idea.hidden || snoozed ? "opacity-60" : ""
            }`}
          >
            {/* Score */}
            <div className="w-8 shrink-0 text-center text-xs font-bold text-amber-400">
              {scoreLabel(idea)}
            </div>
            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {idea.title}
              </p>
              <p className="text-xs text-white/40 truncate">{idea.description}</p>
            </div>
            {/* Category badge */}
            <Badge
              className="shrink-0 text-[10px] px-1.5 py-0.5 border-0"
              style={{ background: catColor + "22", color: catColor }}
            >
              {idea.category}
            </Badge>
            {/* Actions */}
            <CardActions
              idea={idea}
              onRate={onRate}
              onToggleHide={onToggleHide}
              onSnooze={onSnooze}
              snoozeMenuId={snoozeMenuId}
              setSnoozeMenuId={setSnoozeMenuId}
            />
          </div>
        );
      })}
    </div>
  );
}
