"use client";

import { useState, useMemo } from "react";
import { Badge, Card, CardContent, EmptyState, PageHeader, Search } from "@repo/ui";
import type { AiScript, ScriptCategory } from "../lib/types";

const CATEGORIES: Array<{ value: ScriptCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "content", label: "Content" },
  { value: "data", label: "Data" },
  { value: "automation", label: "Automation" },
  { value: "analysis", label: "Analysis" },
  { value: "utility", label: "Utility" },
];

const LANG_STYLE: Record<string, { bg: string; text: string }> = {
  typescript: { bg: "color-mix(in srgb, var(--color-blue) 15%, transparent)", text: "var(--color-neon-blue)" },
  javascript: { bg: "color-mix(in srgb, var(--color-accent) 15%, transparent)",  text: "var(--color-accent-300)" },
  python:     { bg: "color-mix(in srgb, var(--color-neon-green) 15%, transparent)",   text: "var(--color-neon-green)" },
  bash:       { bg: "color-mix(in srgb, var(--color-pill-8) 15%, transparent)",  text: "var(--color-neon-violet)" },
  sql:        { bg: "color-mix(in srgb, var(--color-orange) 15%, transparent)",  text: "var(--color-orange)" },
};

function relDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Fallback static scripts shown when no DB data
const STATIC_SCRIPTS: AiScript[] = [
  { id: "s1", name: "Generate Blog Post", description: "AI-powered blog post generator using Claude", category: "content", language: "typescript", tags: ["ai", "content", "claude"] },
  { id: "s2", name: "Supabase Data Sync", description: "Sync data between Supabase tables with transformation", category: "data", language: "typescript", tags: ["supabase", "sync"] },
  { id: "s3", name: "Cron Health Check", description: "Verify all cron jobs ran successfully in the last 24h", category: "automation", language: "typescript", tags: ["crons", "monitoring"] },
  { id: "s4", name: "Lead Scorer", description: "Score inbound leads using AI fit analysis", category: "analysis", language: "typescript", tags: ["leads", "ai", "scoring"] },
  { id: "s5", name: "Contentful Stale Draft Report", description: "Find and report drafts not updated in 30+ days", category: "content", language: "typescript", tags: ["contentful", "reporting"] },
  { id: "s6", name: "Deploy Status Checker", description: "Check Vercel deploy status across all projects", category: "utility", language: "bash", tags: ["vercel", "deploy"] },
];

interface AiScriptsAppProps {
  initialScripts: AiScript[];
}

export function AiScriptsApp({ initialScripts }: AiScriptsAppProps) {
  const scripts = initialScripts.length > 0 ? initialScripts : STATIC_SCRIPTS;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ScriptCategory>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return scripts.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (q && !s.name.toLowerCase().includes(q) && !(s.description ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scripts, search, category]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="🤖 AI Scripts"
        subtitle={`${scripts.length} automation scripts`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Search value={search} onChange={setSearch} placeholder="Search scripts…" className="flex-1 min-w-[200px]" />
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                category === c.value
                  ? "border-purple-500/60 bg-purple-500/15 text-purple-400"
                  : "border-white/15 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🤖" title="No scripts found" description="Adjust your search or category filter" />
      ) : (
        <div className="space-y-3">
          {filtered.map((script) => {
            const langStyle = LANG_STYLE[script.language?.toLowerCase() ?? ""] ?? { bg: "color-mix(in srgb, var(--color-slate) 12%, transparent)", text: "var(--color-slate)" };
            const isExpanded = expanded[script.id] ?? false;
            return (
              <Card key={script.id} className="p-4">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">{script.name}</span>
                        {script.language && (
                          <Badge
                            className="text-[10px] px-1.5 py-0.5 border-0"
                            style={{ background: langStyle.bg, color: langStyle.text }}
                          >
                            {script.language}
                          </Badge>
                        )}
                        <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded capitalize">
                          {script.category}
                        </span>
                      </div>
                      {script.description && (
                        <p className="text-xs text-white/50 mt-1">{script.description}</p>
                      )}
                      {(script.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(script.tags ?? []).map((t) => (
                            <span key={t} className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                      {script.updated_at && (
                        <div className="mt-1 text-[11px] text-white/25">Updated {relDate(script.updated_at)}</div>
                      )}
                    </div>
                  </div>

                  {script.code && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleExpand(script.id)}
                        className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
                      >
                        <span className="text-[10px]">{isExpanded ? "▼" : "▶"}</span>
                        {isExpanded ? "Hide code" : "View code"}
                      </button>
                      {isExpanded && (
                        <pre className="mt-2 text-[11px] text-white/60 bg-white/5 rounded-lg p-3 overflow-x-auto leading-relaxed">
                          {script.code}
                        </pre>
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
