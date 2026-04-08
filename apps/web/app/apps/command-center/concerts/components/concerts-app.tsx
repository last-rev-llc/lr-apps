"use client";

import { useState, useMemo } from "react";
import { Badge, Card, CardContent, EmptyState, PageHeader, Search } from "@repo/ui";
import type { Concert, ConcertStatus } from "../lib/types";

type StatusFilter = "all" | ConcertStatus;

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "tbd", label: "TBD" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  upcoming:  { bg: "color-mix(in srgb, var(--color-neon-green) 12%, transparent)",  text: "var(--color-neon-green)" },
  past:      { bg: "color-mix(in srgb, var(--color-slate) 12%, transparent)", text: "var(--color-slate)" },
  cancelled: { bg: "color-mix(in srgb, var(--color-pill-4) 12%, transparent)",  text: "var(--color-red)" },
  tbd:       { bg: "color-mix(in srgb, var(--color-accent) 12%, transparent)", text: "var(--color-accent-400)" },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

// Static fallback concerts
const STATIC_CONCERTS: Concert[] = [
  { id: "c1", artist: "Radiohead", venue: "Chase Center", city: "San Francisco, CA", date: "2026-05-15", status: "upcoming", ticket_url: "https://ticketmaster.com" },
  { id: "c2", artist: "Kendrick Lamar", venue: "SoFi Stadium", city: "Los Angeles, CA", date: "2026-04-20", status: "upcoming", ticket_url: "https://ticketmaster.com" },
  { id: "c3", artist: "Bicep", venue: "Bill Graham Civic", city: "San Francisco, CA", date: "2026-03-01", status: "past" },
  { id: "c4", artist: "Daft Punk", venue: "Oracle Arena", city: "Oakland, CA", date: "2026-06-10", status: "tbd" },
];

interface ConcertsAppProps {
  initialConcerts: Concert[];
}

export function ConcertsApp({ initialConcerts }: ConcertsAppProps) {
  const concerts = initialConcerts.length > 0 ? initialConcerts : STATIC_CONCERTS;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return concerts.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (q) {
        const match = [c.artist, c.venue, c.city, c.notes].some(
          (f) => (f ?? "").toLowerCase().includes(q)
        );
        if (!match) return false;
      }
      return true;
    });
  }, [concerts, search, statusFilter]);

  const upcoming = concerts.filter((c) => c.status === "upcoming").length;
  const past = concerts.filter((c) => c.status === "past").length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="🎵 Concerts"
        subtitle={`${concerts.length} total · ${upcoming} upcoming · ${past} past`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Search value={search} onChange={setSearch} placeholder="Search artist, venue, city…" className="flex-1 min-w-[200px]" />
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                statusFilter === f.value
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                  : "border-white/15 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🎵" title="No concerts found" description="Adjust your search or status filter" />
      ) : (
        <div className="space-y-3">
          {filtered.map((concert) => {
            const style = STATUS_STYLE[concert.status] ?? STATUS_STYLE.tbd;
            return (
              <Card key={concert.id} className="p-4">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white text-base">{concert.artist}</span>
                        <Badge
                          className="text-[10px] px-1.5 py-0.5 border-0 capitalize"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {concert.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-white/50">
                        {concert.venue && <span>🏟️ {concert.venue}</span>}
                        {concert.city && <span>📍 {concert.city}</span>}
                        <span>📅 {formatDate(concert.date)}</span>
                      </div>
                      {concert.notes && (
                        <p className="text-xs text-white/40 mt-1">{concert.notes}</p>
                      )}
                    </div>
                    {concert.ticket_url && concert.status === "upcoming" && (
                      <a
                        href={concert.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs text-amber-400 hover:text-amber-300 transition-colors border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded-lg"
                      >
                        Tickets ↗
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
