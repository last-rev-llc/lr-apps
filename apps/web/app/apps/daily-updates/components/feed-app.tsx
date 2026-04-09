"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  Avatar,
  AvatarFallback,
  Button,
  Input,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import type { DailyUpdate, AppProfile, FeedFilters, TimeRange, UpdateLink } from "../lib/types";

// ── Constants ──────────────────────────────────────────────────────────────

const REACTIONS = ["🔥", "❤️", "👏", "💡", "😂"];

const APP_NEON_COLORS: Record<string, string> = {
  "command-center": "#f59e0b",
  "media-gallery": "#a855f7",
  crm: "#3b82f6",
  travel: "#06b6d4",
  "daily-updates": "#10b981",
  kanban: "#ef4444",
  accounts: "#6366f1",
  recipes: "#ec4899",
  crons: "#14b8a6",
  prompts: "#8b5cf6",
  ideas: "#f97316",
};

function neonColor(sourceApp: string): string {
  return APP_NEON_COLORS[sourceApp] ?? "#f59e0b";
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTimeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function parseLinks(links: DailyUpdate["links"]): UpdateLink[] {
  if (!links) return [];
  if (Array.isArray(links)) return links as UpdateLink[];
  try {
    return JSON.parse(links);
  } catch {
    return [];
  }
}

function formatCategoryName(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " ");
}

function getTimeCutoff(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case "day":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - daysFromMonday,
      );
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

// ── Update Card ────────────────────────────────────────────────────────────

function UpdateCard({
  update,
  onReact,
}: {
  update: DailyUpdate;
  onReact: (id: string, emoji: string) => void;
}) {
  const neon = neonColor(update.source_app);
  const links = parseLinks(update.links);
  const reactions = update.reactions ?? {};

  return (
    <Card
      className="mb-4 overflow-hidden glass border-surface-border"
      style={{ borderLeft: `3px solid ${neon}` }}
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-center gap-3 px-4 pt-4 pb-2">
        <Avatar
          className="w-10 h-10 flex-shrink-0"
          style={{ background: `${neon}18`, border: `1px solid ${neon}55` }}
        >
          <AvatarFallback className="text-xl bg-transparent">
            {update.source_icon}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm" style={{ color: neon }}>
            {update.source_name}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {formatTimeAgo(update.created_at)}
          </div>
        </div>
        {update.priority === "high" && (
          <Badge variant="destructive" title="High priority">
            🔥
          </Badge>
        )}
        {update.category && (
          <Badge variant="secondary" className="text-[11px]">
            {formatCategoryName(update.category)}
          </Badge>
        )}
      </CardHeader>

      {/* Body */}
      <CardContent className="px-4 pb-3 pt-0">
        <h3 className="font-semibold text-base text-foreground mb-1">
          {update.title}
        </h3>
        {update.body && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {update.body}
          </p>
        )}

        {/* Links */}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {links.map((link, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                asChild
                className="text-[12px] rounded-full"
                style={{
                  color: neon,
                  borderColor: `${neon}44`,
                  background: `${neon}08`,
                }}
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              </Button>
            ))}
          </div>
        )}
      </CardContent>

      {/* Reactions */}
      <CardFooter className="px-4 pb-4 flex items-center gap-2 flex-wrap border-t border-surface-border pt-3">
        {REACTIONS.map((emoji) => {
          const count = reactions[emoji] ?? 0;
          return (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              onClick={() => onReact(update.id, emoji)}
              className={`text-sm px-2.5 py-1 rounded-full border transition-all hover:scale-110 ${
                count > 0
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-surface-border bg-surface-hover hover:border-amber-500/30"
              }`}
            >
              {emoji} {count > 0 && <span className="text-[11px]">{count}</span>}
            </Button>
          );
        })}
      </CardFooter>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface FeedAppProps {
  initialUpdates: DailyUpdate[];
  profiles: AppProfile[];
  categories: string[];
}

export function FeedApp({
  initialUpdates,
  profiles,
  categories,
}: FeedAppProps) {
  const [updates, setUpdates] = useState<DailyUpdate[]>(initialUpdates);
  const [filters, setFilters] = useState<FeedFilters>({
    source_app: "all",
    category: "all",
    time_range: "all",
    search: "",
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialUpdates.length === 20);

  // Derive unique source apps from initial updates + profiles
  const sourceApps = useMemo(() => {
    if (profiles.length > 0) return profiles;
    const map = new Map<string, { id: string; name: string; icon: string }>();
    for (const u of initialUpdates) {
      if (!map.has(u.source_app)) {
        map.set(u.source_app, {
          id: u.source_app,
          name: u.source_name,
          icon: u.source_icon,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [profiles, initialUpdates]);

  // Client-side filtering
  const filtered = useMemo(() => {
    let out = updates;

    if (filters.source_app !== "all") {
      out = out.filter((u) => u.source_app === filters.source_app);
    }
    if (filters.category !== "all") {
      out = out.filter((u) => u.category === filters.category);
    }
    if (filters.time_range !== "all") {
      const cutoff = getTimeCutoff(filters.time_range);
      if (cutoff) {
        out = out.filter((u) => new Date(u.created_at) >= cutoff);
      }
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      out = out.filter(
        (u) =>
          u.title.toLowerCase().includes(q) ||
          u.body?.toLowerCase().includes(q) ||
          u.source_name.toLowerCase().includes(q),
      );
    }

    return out;
  }, [updates, filters]);

  const handleReact = useCallback((id: string, emoji: string) => {
    setUpdates((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const reactions = { ...(u.reactions ?? {}) };
        reactions[emoji] = (reactions[emoji] ?? 0) + 1;
        return { ...u, reactions };
      }),
    );
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/daily-updates?offset=${updates.length}&limit=20`,
      );
      if (!res.ok) throw new Error("Failed");
      const newUpdates: DailyUpdate[] = await res.json();
      setUpdates((prev) => [...prev, ...newUpdates]);
      setHasMore(newUpdates.length === 20);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, updates.length]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <Input
          type="text"
          placeholder="Search updates…"
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          className="flex-1 min-w-[180px]"
        />

        {/* App filter */}
        {sourceApps.length > 0 && (
          <select
            value={filters.source_app}
            onChange={(e) =>
              setFilters((f) => ({ ...f, source_app: e.target.value }))
            }
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">All Apps</option>
            {sourceApps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </select>
        )}

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value }))
            }
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {formatCategoryName(c)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Time range tabs */}
      <Tabs
        value={filters.time_range}
        onValueChange={(value) =>
          setFilters((f) => ({ ...f, time_range: value as TimeRange }))
        }
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">All Time</TabsTrigger>
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Feed */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No updates yet — the feed is waiting for its first post!"
        />
      ) : (
        <>
          {filtered.map((update) => (
            <UpdateCard key={update.id} update={update} onReact={handleReact} />
          ))}

          {hasMore && (
            <div className="text-center pt-4 pb-8">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
