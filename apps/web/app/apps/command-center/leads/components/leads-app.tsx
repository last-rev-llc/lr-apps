"use client";

import { useState, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  PageHeader,
  Search,
} from "@repo/ui";
import type {
  Lead,
  LeadPerson,
  FitFilter,
  SortKey,
  SortDir,
} from "../lib/types";

// ── Constants ────────────────────────────────────────────────────────────────

const FIT_FILTERS: Array<{ value: FitFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "5+", label: "Fit 5+" },
  { value: "7+", label: "Fit 7+" },
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "score", label: "Fit Score" },
  { value: "name", label: "Name" },
  { value: "date", label: "Date" },
];

const ACCENT_TECH_RE = /contentful|next\.?js|react/i;

// ── Helpers ──────────────────────────────────────────────────────────────────

function fitColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 8)
    return {
      bg: "color-mix(in srgb, var(--color-neon-green) 12%, transparent)",
      text: "var(--color-neon-green)",
      border: "color-mix(in srgb, var(--color-neon-green) 40%, transparent)",
    };
  if (score >= 5)
    return {
      bg: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
      text: "var(--color-accent-300)",
      border: "color-mix(in srgb, var(--color-accent) 40%, transparent)",
    };
  return {
    bg: "color-mix(in srgb, var(--color-pill-4) 12%, transparent)",
    text: "var(--color-red)",
    border: "color-mix(in srgb, var(--color-pill-4) 40%, transparent)",
  };
}

function isAccentTech(t: string): boolean {
  return ACCENT_TECH_RE.test(t);
}

function relDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Component ────────────────────────────────────────────────────────────────

interface LeadsAppProps {
  initialLeads: Lead[];
}

export function LeadsApp({ initialLeads }: LeadsAppProps) {
  const [leads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [fitFilter, setFitFilter] = useState<FitFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = leads.filter((c) => {
      const score = c.fitScore ?? 0;
      if (fitFilter === "7+" && score < 7) return false;
      if (fitFilter === "5+" && score < 5) return false;
      if (q) {
        const nameMatch = (c.name ?? "").toLowerCase().includes(q);
        const domainMatch = (c.domain ?? "").toLowerCase().includes(q);
        const peopleMatch = (c.people ?? []).some((p) =>
          p.name.toLowerCase().includes(q),
        );
        if (!nameMatch && !domainMatch && !peopleMatch) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortKey === "score")
        return dir * ((a.fitScore ?? 0) - (b.fitScore ?? 0));
      if (sortKey === "name") return dir * a.name.localeCompare(b.name);
      if (sortKey === "date")
        return (
          dir *
          ((a.researchedAt ?? "").localeCompare(b.researchedAt ?? ""))
        );
      return 0;
    });

    return list;
  }, [leads, search, fitFilter, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="🎯 Lead Research"
        subtitle={`${leads.length} companies · ${leads.reduce((n, c) => n + (c.people?.length ?? 0), 0)} contacts`}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search companies, people, domains…"
          className="flex-1 min-w-[200px]"
        />
        {/* Fit filter */}
        <div className="flex gap-1">
          {FIT_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={fitFilter === f.value ? "outline" : "ghost"}
              size="sm"
              onClick={() => setFitFilter(f.value)}
              className={fitFilter === f.value ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : ""}
            >
              {f.label}
            </Button>
          ))}
        </div>
        {/* Sort */}
        <div className="flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={sortKey === opt.value ? "outline" : "ghost"}
              size="sm"
              onClick={() => handleSort(opt.value)}
              className={sortKey === opt.value ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : ""}
            >
              {opt.label}
              {sortKey === opt.value && (
                <span className="ml-0.5">{sortDir === "desc" ? " ↓" : " ↑"}</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No leads match your search"
          description="Try adjusting the filters or search query"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Lead Card ─────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  expandedSections: Record<string, boolean>;
  onToggleSection: (key: string) => void;
}

function LeadCard({ lead, expandedSections, onToggleSection }: LeadCardProps) {
  const score = lead.fitScore ?? 0;
  const fit = fitColor(score);
  const people = lead.people ?? [];
  const techStack = lead.techStack ?? {};
  const allTech = [
    techStack.cms,
    techStack.framework,
    techStack.hosting,
    ...(techStack.other ?? []),
  ].filter((t): t is string => !!t);

  const fitReasons = lead.fitReasons ?? [];
  const talkingPoints = lead.talkingPoints ?? [];
  const news = lead.news ?? [];
  const socials = lead.socialLinks ?? {};

  const reasonsKey = `reasons-${lead.id}`;
  const tpKey = `tp-${lead.id}`;
  const peopleKey = `people-${lead.id}`;

  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Fit score badge */}
          <div
            className="shrink-0 flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[52px] border"
            style={{
              background: fit.bg,
              borderColor: fit.border,
            }}
          >
            <span
              className="text-2xl font-extrabold leading-none"
              style={{ color: fit.text }}
            >
              {score}
            </span>
            <span
              className="text-[9px] font-semibold tracking-wider mt-0.5 opacity-70"
              style={{ color: fit.text }}
            >
              FIT
            </span>
          </div>

          {/* Company info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-white">{lead.name}</span>
              <a
                href={`https://${lead.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                {lead.domain} ↗
              </a>
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  in
                </a>
              )}
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300"
                >
                  𝕏
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-white/50">
              {lead.industry && <span>🏢 {lead.industry}</span>}
              {lead.size && <span>👥 {lead.size}</span>}
              {lead.location && <span>📍 {lead.location}</span>}
            </div>
            {/* Tech badges */}
            {allTech.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {allTech.map((t) => (
                  <Badge
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 border-0"
                    style={
                      isAccentTech(t)
                        ? { background: "color-mix(in srgb, var(--color-pill-0) 20%, transparent)", color: "var(--color-neon-violet)" }
                        : {
                            background: "color-mix(in srgb, var(--color-slate) 20%, transparent)",
                            color: "color-mix(in srgb, white 50%, transparent)",
                          }
                    }
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {lead.description && (
          <p className="text-xs text-white/50 leading-relaxed">
            {lead.description}
          </p>
        )}

        {/* Fit Reasons */}
        {fitReasons.length > 0 && (
          <ExpandableSection
            label={`Fit Reasons (${fitReasons.length})`}
            expanded={expandedSections[reasonsKey] ?? false}
            onToggle={() => onToggleSection(reasonsKey)}
          >
            <ul className="mt-2 ml-4 space-y-1 list-disc">
              {fitReasons.map((r, i) => (
                <li key={i} className="text-xs text-white/50">
                  {r}
                </li>
              ))}
            </ul>
          </ExpandableSection>
        )}

        {/* Talking Points */}
        {talkingPoints.length > 0 && (
          <ExpandableSection
            label={`Talking Points (${talkingPoints.length})`}
            expanded={expandedSections[tpKey] ?? false}
            onToggle={() => onToggleSection(tpKey)}
          >
            <ul className="mt-2 ml-4 space-y-1 list-disc">
              {talkingPoints.map((t, i) => (
                <li key={i} className="text-xs text-white/50">
                  {t}
                </li>
              ))}
            </ul>
          </ExpandableSection>
        )}

        {/* News */}
        {news.length > 0 && (
          <div className="space-y-1">
            {news.map((n, i) => (
              <a
                key={i}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>📰</span>
                <span className="truncate">{n.title}</span>
                {n.date && (
                  <span className="text-white/30 shrink-0">
                    · {relDate(n.date)}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        {/* People / Contacts */}
        <ExpandableSection
          label={`Contacts (${people.length})`}
          expanded={expandedSections[peopleKey] ?? false}
          onToggle={() => onToggleSection(peopleKey)}
        >
          {people.length === 0 ? (
            <p className="mt-2 text-xs text-white/30">
              No contacts researched yet.
            </p>
          ) : (
            <div className="mt-2 divide-y divide-white/8">
              {people.map((p, i) => (
                <PersonRow key={i} person={p} />
              ))}
            </div>
          )}
        </ExpandableSection>

        {/* Footer */}
        <div className="flex gap-3 text-[10px] text-white/25 pt-1 border-t border-white/8">
          {lead.researchedAt && (
            <span>Researched {relDate(lead.researchedAt)}</span>
          )}
          {lead.source && <span>· Source: {lead.source}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Expandable Section ────────────────────────────────────────────────────────

function ExpandableSection({
  label,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        <span className="text-[10px]">{expanded ? "▼" : "▶"}</span>
        <span>{label}</span>
      </button>
      {expanded && children}
    </div>
  );
}

// ── Person Row ────────────────────────────────────────────────────────────────

function PersonRow({ person }: { person: LeadPerson }) {
  return (
    <div className="flex items-start gap-2 py-2">
      <span className="text-white/30 text-xs mt-0.5">👤</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-white">{person.name}</span>
          <span className="text-xs text-white/40">{person.title}</span>
          {person.decisionMaker && (
            <Badge
              className="text-[10px] px-1.5 py-0.5 border-0"
              style={{ background: "color-mix(in srgb, var(--color-accent) 15%, transparent)", color: "var(--color-accent-300)" }}
            >
              Decision Maker
            </Badge>
          )}
        </div>
        {(person.topics ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {(person.topics ?? []).map((t, i) => (
              <span
                key={i}
                className="inline-block rounded px-1.5 py-0.5 text-[10px] bg-blue-500/10 text-blue-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      {person.linkedinUrl && (
        <a
          href={person.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-brand-linkedin hover:opacity-80 text-xs"
          title="LinkedIn"
        >
          in
        </a>
      )}
    </div>
  );
}
