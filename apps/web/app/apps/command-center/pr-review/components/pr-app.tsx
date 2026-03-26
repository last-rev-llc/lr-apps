"use client";

import { useState, useMemo } from "react";
import { Badge, Card, CardContent, EmptyState, PageHeader, Search } from "@repo/ui";
import type { PR, PrStatus, StatusFilter } from "../lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS: StatusFilter[] = ["All", "open", "merged", "closed"];

const STATUS_STYLES: Record<PrStatus, { bg: string; text: string; border: string; dot: string }> = {
  open: {
    bg: "rgba(34,197,94,0.12)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.35)",
    dot: "#4ade80",
  },
  merged: {
    bg: "rgba(139,92,246,0.12)",
    text: "#a78bfa",
    border: "rgba(139,92,246,0.35)",
    dot: "#a78bfa",
  },
  closed: {
    bg: "rgba(239,68,68,0.12)",
    text: "#f87171",
    border: "rgba(239,68,68,0.35)",
    dot: "#f87171",
  },
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

// A simple label-color hash so each label gets a consistent tint
function labelStyle(label: string): { background: string; color: string } {
  const PALETTES = [
    { background: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    { background: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    { background: "rgba(139,92,246,0.15)", color: "#a78bfa" },
    { background: "rgba(34,197,94,0.15)", color: "#4ade80" },
    { background: "rgba(239,68,68,0.15)", color: "#f87171" },
    { background: "rgba(20,184,166,0.15)", color: "#2dd4bf" },
  ];
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) & 0xffffff;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PrStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.closed;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.dot }}
      />
      {status}
    </span>
  );
}

// ── PR Card ───────────────────────────────────────────────────────────────────

function PRCard({ pr }: { pr: PR }) {
  const labels = pr.labels ?? [];
  const reviewers = pr.reviewers ?? [];

  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-2">
        {/* Title row */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[15px] text-white hover:text-amber-400 transition-colors line-clamp-2"
            >
              {pr.title}
            </a>
          </div>
          <StatusBadge status={pr.status} />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
          <span className="font-medium text-white/60">{pr.repo}</span>
          <span>·</span>
          <span>by {pr.author}</span>
          {pr.created_at && (
            <>
              <span>·</span>
              <span>{formatDate(pr.created_at)}</span>
            </>
          )}
          {reviewers.length > 0 && (
            <>
              <span>·</span>
              <span>reviewers: {reviewers.join(", ")}</span>
            </>
          )}
        </div>

        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {labels.map((label) => (
              <Badge
                key={label}
                className="text-[10px] px-1.5 py-0.5 border-0"
                style={labelStyle(label)}
              >
                {label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface PrAppProps {
  initialPRs: PR[];
}

export function PrApp({ initialPRs }: PrAppProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [repoFilter, setRepoFilter] = useState("All");
  const [authorFilter, setAuthorFilter] = useState("All");

  const repos = useMemo(() => {
    return ["All", ...Array.from(new Set(initialPRs.map((p) => p.repo))).sort()];
  }, [initialPRs]);

  const authors = useMemo(() => {
    return ["All", ...Array.from(new Set(initialPRs.map((p) => p.author))).sort()];
  }, [initialPRs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return initialPRs.filter((pr) => {
      if (statusFilter !== "All" && pr.status !== statusFilter) return false;
      if (repoFilter !== "All" && pr.repo !== repoFilter) return false;
      if (authorFilter !== "All" && pr.author !== authorFilter) return false;
      if (q) {
        const titleMatch = pr.title.toLowerCase().includes(q);
        const repoMatch = pr.repo.toLowerCase().includes(q);
        const authorMatch = pr.author.toLowerCase().includes(q);
        if (!titleMatch && !repoMatch && !authorMatch) return false;
      }
      return true;
    });
  }, [initialPRs, search, statusFilter, repoFilter, authorFilter]);

  // Status summary counts
  const counts = useMemo(() => {
    return {
      open: initialPRs.filter((p) => p.status === "open").length,
      merged: initialPRs.filter((p) => p.status === "merged").length,
      closed: initialPRs.filter((p) => p.status === "closed").length,
    };
  }, [initialPRs]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="PR Review"
        subtitle={`${initialPRs.length} total · ${counts.open} open · ${counts.merged} merged`}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search PRs, repos, authors…"
          className="flex-1 min-w-[200px]"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3">
        {/* Status */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                statusFilter === f
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                  : "border-white/15 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {f === "All" ? "All Status" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Repo */}
        {repos.length > 2 && (
          <select
            value={repoFilter}
            onChange={(e) => setRepoFilter(e.target.value)}
            className="bg-white/5 border border-white/15 text-white/70 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
          >
            {repos.map((r) => (
              <option key={r} value={r} className="bg-zinc-900">
                {r === "All" ? "All Repos" : r}
              </option>
            ))}
          </select>
        )}

        {/* Author */}
        {authors.length > 2 && (
          <select
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="bg-white/5 border border-white/15 text-white/70 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
          >
            {authors.map((a) => (
              <option key={a} value={a} className="bg-zinc-900">
                {a === "All" ? "All Authors" : a}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Count */}
      <div className="text-xs text-white/30">
        {filtered.length} of {initialPRs.length} PRs
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No PRs match your filters"
          description="Try adjusting the status, repo, or search query"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((pr) => (
            <PRCard key={pr.id} pr={pr} />
          ))}
        </div>
      )}
    </div>
  );
}
