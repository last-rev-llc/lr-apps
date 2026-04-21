"use client";

import { useState, useMemo } from "react";
import { Badge, Card, CardContent, EmptyState, PageHeader, Search } from "@repo/ui";
import type { ContentfulHealth, ContentfulEntry } from "../lib/types";

function relDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  published: { bg: "color-mix(in srgb, var(--color-neon-green) 12%, transparent)",  text: "var(--color-neon-green)" },
  draft:     { bg: "color-mix(in srgb, var(--color-blue) 12%, transparent)", text: "var(--color-neon-blue)" },
  changed:   { bg: "color-mix(in srgb, var(--color-accent) 12%, transparent)",  text: "var(--color-accent-300)" },
  archived:  { bg: "color-mix(in srgb, var(--color-slate) 12%, transparent)", text: "var(--color-slate)" },
};

interface ContentfulAppProps {
  initialHealth: ContentfulHealth[];
}

export function ContentfulApp({ initialHealth }: ContentfulAppProps) {
  const [search, setSearch] = useState("");
  const [selectedSpace, setSelectedSpace] = useState<string>("all");
  const [expandedSpace, setExpandedSpace] = useState<Record<string, boolean>>({});

  function toggleSpace(id: string) {
    setExpandedSpace((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const spaces = initialHealth;
  const totalEntries = spaces.reduce((s, h) => s + (h.totalEntries ?? 0), 0);
  const totalStale = spaces.reduce((s, h) => s + (h.staleEntries ?? 0), 0);
  const totalDraft = spaces.reduce((s, h) => s + (h.draftEntries ?? 0), 0);

  const filteredSpaces = useMemo(() => {
    if (selectedSpace !== "all") return spaces.filter((s) => s.id === selectedSpace);
    if (search.trim()) {
      const q = search.toLowerCase();
      return spaces.filter((s) => s.space.toLowerCase().includes(q));
    }
    return spaces;
  }, [spaces, selectedSpace, search]);

  if (spaces.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="📦 Contentful" subtitle="CMS health monitoring" />
        <EmptyState icon="📦" title="No Contentful data" description="Run the Contentful health cron to populate data" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="📦 Contentful"
        subtitle={`${spaces.length} spaces · ${totalEntries.toLocaleString()} entries · ${totalStale} stale`}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Spaces",    value: spaces.length, color: "var(--color-slate-light)" },
          { label: "Total",     value: totalEntries,  color: "var(--color-neon-blue)" },
          { label: "Drafts",    value: totalDraft,    color: "var(--color-accent-400)" },
          { label: "Stale",     value: totalStale,    color: totalStale > 0 ? "var(--color-red)" : "var(--color-neon-green)" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <CardContent className="p-0 text-center">
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Search value={search} onChange={setSearch} placeholder="Search spaces…" className="flex-1 min-w-[200px]" />
        <select
          value={selectedSpace}
          onChange={(e) => setSelectedSpace(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-white text-xs outline-none"
        >
          <option value="all">All Spaces</option>
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>{s.space}</option>
          ))}
        </select>
      </div>

      {/* Space cards */}
      {filteredSpaces.length === 0 ? (
        <EmptyState icon="📦" title="No spaces found" description="Adjust your search" />
      ) : (
        <div className="space-y-4">
          {filteredSpaces.map((h) => {
            const isOpen = expandedSpace[h.id] ?? false;
            const staleDrafts = h.staleDrafts ?? [];
            const recentPublishes = h.recentPublishes ?? [];
            return (
              <Card key={h.id} className="p-4">
                <CardContent className="p-0">
                  {/* Space header */}
                  <button
                    onClick={() => toggleSpace(h.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📦</span>
                        <div>
                          <span className="font-semibold text-white">{h.space}</span>
                          <div className="text-xs text-white/40 mt-0.5">
                            Last checked: {relDate(h.lastChecked)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-xs">
                          <span className="text-white/50">{h.totalEntries} total</span>
                          <span className="text-green-400">{h.publishedEntries} pub</span>
                          <span className="text-yellow-400">{h.draftEntries} draft</span>
                          {h.staleEntries > 0 && <span className="text-red-400">{h.staleEntries} stale</span>}
                        </div>
                        <span className="text-white/30 text-xs">{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-white/8 space-y-4">
                      {/* Mini progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-white/40">
                          <span>Content health</span>
                          <span>{Math.round((h.publishedEntries / Math.max(h.totalEntries, 1)) * 100)}% published</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                          <div className="h-full bg-green-500/60" style={{ width: `${(h.publishedEntries / Math.max(h.totalEntries, 1)) * 100}%` }} />
                          <div className="h-full bg-yellow-500/60" style={{ width: `${(h.draftEntries / Math.max(h.totalEntries, 1)) * 100}%` }} />
                          <div className="h-full bg-red-500/60" style={{ width: `${(h.staleEntries / Math.max(h.totalEntries, 1)) * 100}%` }} />
                        </div>
                      </div>

                      {/* Stale drafts */}
                      {staleDrafts.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-yellow-400 mb-2">
                            ⚠ Stale Drafts ({staleDrafts.length})
                          </h4>
                          <div className="space-y-1">
                            {staleDrafts.slice(0, 5).map((entry) => (
                              <EntryRow key={entry.id} entry={entry} />
                            ))}
                            {staleDrafts.length > 5 && (
                              <div className="text-xs text-white/30 text-center py-1">
                                +{staleDrafts.length - 5} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recent publishes */}
                      {recentPublishes.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-green-400 mb-2">
                            ✓ Recent Publishes ({recentPublishes.length})
                          </h4>
                          <div className="space-y-1">
                            {recentPublishes.slice(0, 5).map((entry) => (
                              <EntryRow key={entry.id} entry={entry} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: ContentfulEntry }) {
  const style = STATUS_STYLE[entry.status] ?? STATUS_STYLE.draft;
  return (
    <div className="flex items-center gap-2 py-1 text-xs">
      <Badge
        className="text-[9px] px-1 py-0.5 border-0 shrink-0"
        style={{ background: style.bg, color: style.text }}
      >
        {entry.status}
      </Badge>
      <span className="flex-1 text-white/60 truncate">{entry.title ?? entry.id}</span>
      <span className="text-white/30 shrink-0">{entry.contentType}</span>
      {entry.daysSinceUpdate != null && entry.daysSinceUpdate > 0 && (
        <span className="text-white/25 shrink-0">{entry.daysSinceUpdate}d</span>
      )}
      {entry.url && (
        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 shrink-0">↗</a>
      )}
    </div>
  );
}
