"use client";

import { useState, useMemo } from "react";
import { Badge, Button, Card, CardContent, Input } from "@repo/ui";
import type { Drill, FilterTab } from "../data/drills";
import { FILTER_TABS, CATEGORY_LABELS } from "../data/drills";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "bg-green/15 text-green border border-green/30",
  Intermediate: "bg-yellow/15 text-yellow border border-yellow/30",
  Advanced: "bg-red/15 text-red border border-red/30",
};

const CATEGORY_STYLES: Record<string, string> = {
  warmup: "bg-orange/15 text-orange",
  speed: "bg-blue/15 text-blue",
  agility: "bg-blue/15 text-blue",
  dribbling: "bg-pill-0/15 text-pill-0",
  "ball-mastery": "bg-pill-0/15 text-pill-0",
  "1v1": "bg-pill-6/15 text-pill-6",
  finishing: "bg-red/15 text-red",
  shooting: "bg-red/15 text-red",
  winger: "bg-green/15 text-green",
  striker: "bg-yellow/15 text-yellow",
  movement: "bg-yellow/15 text-yellow",
  juggling: "bg-pill-7/15 text-pill-7",
  strength: "bg-pill-6/15 text-pill-6",
  core: "bg-pill-6/15 text-pill-6",
  plyometrics: "bg-pill-6/15 text-pill-6",
  flexibility: "bg-pill-9/15 text-pill-9",
  recovery: "bg-pill-9/15 text-pill-9",
};

function VideoEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/60 group cursor-pointer"
      aria-label={`Play ${title}`}
    >
      <img
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
      />
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-green/90 flex items-center justify-center group-hover:bg-green/80 transition-colors shadow-lg">
          <svg
            className="w-6 h-6 text-black ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function DrillCard({ drill, onClick }: { drill: Drill; onClick: () => void }) {
  return (
    <Card
      className="bg-white/5 border-white/10 hover:border-green/40 transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-t-lg overflow-hidden bg-black/60">
          <img
            src={`https://img.youtube.com/vi/${drill.videoId}/hqdefault.jpg`}
            alt={drill.name}
            className="w-full h-full object-cover opacity-75 group-hover:opacity-95 transition-opacity"
          />
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
            {drill.duration} min
          </div>
          {/* Play icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-green/90 flex items-center justify-center shadow-lg">
              <svg
                className="w-5 h-5 text-black ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-green transition-colors">
            {drill.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {drill.description}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_STYLES[drill.difficulty] ?? ""}`}
            >
              {drill.difficulty}
            </span>
            {drill.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[cat] ?? "bg-white/10 text-muted-foreground"}`}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DrillModal({
  drill,
  onClose,
}: {
  drill: Drill;
  onClose: () => void;
}) {
  return (
    // role="dialog" + Escape/click-outside handlers are the established
    // modal pattern; jsx-a11y flags interactions on a dialog element
    // because dialog is technically non-interactive. The combination is
    // intentional — a focusable wrapper that closes on Escape or
    // backdrop click.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-white/10 rounded-2xl shadow-2xl"
      >
        {/* Video */}
        <div className="rounded-t-2xl overflow-hidden">
          <VideoEmbed videoId={drill.videoId} title={drill.name} />
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{drill.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {drill.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${DIFFICULTY_STYLES[drill.difficulty] ?? ""}`}
            >
              {drill.difficulty}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-muted-foreground">
              {drill.duration} min
            </span>
            {drill.categories.map((cat) => (
              <span
                key={cat}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_STYLES[cat] ?? "bg-white/10 text-muted-foreground"}`}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
            ))}
          </div>

          {/* Coaching Points */}
          <div>
            <h3 className="text-sm font-semibold text-green mb-2 flex items-center gap-1.5">
              <span>⚡</span> Coaching Points
            </h3>
            <ul className="space-y-1.5">
              {drill.coachingPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-green shrink-0 mt-0.5">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Equipment */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Equipment Needed
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {drill.equipment.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/8 text-muted-foreground border border-white/10"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* YouTube link */}
          <div className="pt-1">
            <a
              href={`https://www.youtube.com/watch?v=${drill.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-green hover:text-green/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z" />
              </svg>
              Watch on YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface DrillLibraryProps {
  drills: Drill[];
}

export function DrillLibrary({ drills }: DrillLibraryProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDifficulty, setActiveDifficulty] = useState<string>("All");
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);

  const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return drills.filter((drill) => {
      // Category filter
      if (activeFilter !== "all") {
        const matchesFilter =
          activeFilter === "speed"
            ? drill.categories.some((c) => c === "speed" || c === "agility")
            : activeFilter === "dribbling"
              ? drill.categories.some(
                  (c) =>
                    c === "dribbling" ||
                    c === "ball-mastery" ||
                    c === "1v1" ||
                    c === "juggling"
                )
              : activeFilter === "finishing"
                ? drill.categories.some(
                    (c) =>
                      c === "finishing" ||
                      c === "shooting" ||
                      c === "winger" ||
                      c === "striker" ||
                      c === "movement"
                  )
                : activeFilter === "strength"
                  ? drill.categories.some(
                      (c) => c === "strength" || c === "core" || c === "plyometrics"
                    )
                  : activeFilter === "recovery"
                    ? drill.categories.some(
                        (c) => c === "flexibility" || c === "recovery"
                      )
                    : drill.categories.includes(activeFilter);
        if (!matchesFilter) return false;
      }

      // Difficulty filter
      if (activeDifficulty !== "All" && drill.difficulty !== activeDifficulty) {
        return false;
      }

      // Search
      if (q) {
        return (
          drill.name.toLowerCase().includes(q) ||
          drill.description.toLowerCase().includes(q) ||
          drill.categories.some((c) => c.toLowerCase().includes(q)) ||
          drill.equipment.some((e) => e.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [drills, activeFilter, activeDifficulty, searchQuery]);

  return (
    <>
      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Search */}
        <Input
          type="text"
          placeholder="Search drills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-green/50"
        />

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-green text-black"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDifficulty(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeDifficulty === d
                  ? d === "Beginner"
                    ? "bg-green/30 text-green border border-green/50"
                    : d === "Intermediate"
                      ? "bg-yellow/30 text-yellow border border-yellow/50"
                      : d === "Advanced"
                        ? "bg-red/30 text-red border border-red/50"
                        : "bg-white/20 text-foreground border border-white/30"
                  : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        {filtered.length} drill{filtered.length !== 1 ? "s" : ""}
        {activeFilter !== "all" || activeDifficulty !== "All" || searchQuery
          ? " matching filters"
          : " total"}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              onClick={() => setSelectedDrill(drill)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-4xl mb-3">⚽</div>
          <p className="text-sm">No drills match your filters.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("all");
              setActiveDifficulty("All");
            }}
            className="mt-3 text-sm text-green hover:text-green/80"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Drill modal */}
      {selectedDrill && (
        <DrillModal
          drill={selectedDrill}
          onClose={() => setSelectedDrill(null)}
        />
      )}
    </>
  );
}
