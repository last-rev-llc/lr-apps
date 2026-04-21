"use client";

import { useState, useMemo } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, Search } from "@repo/ui";
import type { MediaItem, MediaType, TypeFilter, ViewMode } from "../lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_FILTERS: TypeFilter[] = [
  "All",
  "Image",
  "Video",
  "GIF",
  "Audio",
  "PDF",
  "Presentation",
];

const TYPE_ICONS: Record<MediaType, string> = {
  Image: "🖼️",
  Video: "🎬",
  GIF: "🎨",
  Audio: "🎵",
  PDF: "📄",
  Presentation: "📊",
};

const TYPE_STYLES: Record<MediaType, { bg: string; text: string }> = {
  Image: { bg: "color-mix(in srgb, var(--color-blue) 15%, transparent)", text: "var(--color-blue)" },
  Video: { bg: "color-mix(in srgb, var(--color-pill-8) 15%, transparent)", text: "var(--color-pill-8)" },
  GIF: { bg: "color-mix(in srgb, var(--color-accent) 15%, transparent)", text: "var(--color-accent)" },
  Audio: { bg: "color-mix(in srgb, var(--color-neon-green) 15%, transparent)", text: "var(--color-pill-2)" },
  PDF: { bg: "color-mix(in srgb, var(--color-pill-4) 15%, transparent)", text: "var(--color-pill-4)" },
  Presentation: { bg: "color-mix(in srgb, var(--color-accent) 15%, transparent)", text: "var(--color-accent-300)" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Type Badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: MediaType }) {
  const style = TYPE_STYLES[type] ?? { bg: "color-mix(in srgb, var(--color-slate) 20%, transparent)", text: "var(--color-slate-light)" };
  return (
    <Badge variant="outline" className="text-[10px] uppercase tracking-wide" style={{ background: style.bg, color: style.text }}>
      {type}
    </Badge>
  );
}

// ── Media Card (grid) ─────────────────────────────────────────────────────────

function MediaGridCard({ item }: { item: MediaItem }) {
  const icon = TYPE_ICONS[item.type] ?? "📁";
  const tags = item.tags ?? [];

  return (
    <a
      href={item.file}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Card className="overflow-hidden hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer">
        {/* Thumbnail */}
        <div className="w-full aspect-video bg-white/5 flex items-center justify-center overflow-hidden">
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnail}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">{icon}</span>
          )}
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-white truncate flex-1">
              {item.name}
            </span>
            <TypeBadge type={item.type} />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 border-0"
                  style={{
                    background: "color-mix(in srgb, var(--color-slate) 20%, transparent)",
                    color: "var(--color-slate-light)",
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {item.created && (
            <div className="text-[10px] text-white/30">{formatDate(item.created)}</div>
          )}
        </div>
      </Card>
    </a>
  );
}

// ── Media List Row ────────────────────────────────────────────────────────────

function MediaListRow({ item }: { item: MediaItem }) {
  const tags = item.tags ?? [];

  return (
    <a
      href={item.file}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 bg-white/3 border border-white/8 rounded-lg hover:border-amber-500/40 hover:bg-white/5 transition-all cursor-pointer"
    >
      <TypeBadge type={item.type} />
      <span className="flex-1 text-sm font-semibold text-white truncate">
        {item.name}
      </span>
      <div className="hidden sm:flex gap-1 flex-wrap">
        {tags.slice(0, 3).map((tag) => (
          <Badge
            key={tag}
            className="text-[10px] px-1.5 py-0.5 border-0"
            style={{
              background: "color-mix(in srgb, var(--color-slate) 20%, transparent)",
              color: "var(--color-slate-light)",
            }}
          >
            {tag}
          </Badge>
        ))}
      </div>
      {item.created && (
        <span className="text-[11px] text-white/30 shrink-0">
          {formatDate(item.created)}
        </span>
      )}
    </a>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface GalleryAppProps {
  initialItems: MediaItem[];
}

export function GalleryApp({ initialItems }: GalleryAppProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // All tags from data
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    initialItems.forEach((item) => (item.tags ?? []).forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [initialItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return initialItems.filter((item) => {
      if (typeFilter !== "All" && item.type !== typeFilter) return false;
      if (q) {
        const nameMatch = item.name.toLowerCase().includes(q);
        const tagMatch = (item.tags ?? []).some((t) => t.toLowerCase().includes(q));
        if (!nameMatch && !tagMatch) return false;
      }
      return true;
    });
  }, [initialItems, search, typeFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Media Gallery"
        subtitle={`${initialItems.length} items · ${allTags.length} tags`}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search by name or tag…"
          className="flex-1 min-w-[200px]"
        />
        {/* View toggle */}
        <div className="flex gap-1 border border-white/15 rounded-lg p-0.5">
          {(["grid", "list"] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "outline" : "ghost"}
              size="sm"
              onClick={() => setViewMode(mode)}
              className={viewMode === mode ? "bg-amber-500/20 text-amber-400" : ""}
            >
              {mode === "grid" ? "⊞ Grid" : "☰ List"}
            </Button>
          ))}
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((f) => (
          <Button
            key={f}
            variant={typeFilter === f ? "outline" : "ghost"}
            size="sm"
            onClick={() => setTypeFilter(f)}
            className={typeFilter === f ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : ""}
          >
            {f !== "All" && <span className="mr-1">{TYPE_ICONS[f as MediaType]}</span>}
            {f}
          </Button>
        ))}
      </div>

      {/* Count */}
      <div className="text-xs text-white/30">
        {filtered.length} of {initialItems.length} items
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No media found"
          description="Try adjusting the search or type filter"
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <MediaGridCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <MediaListRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
