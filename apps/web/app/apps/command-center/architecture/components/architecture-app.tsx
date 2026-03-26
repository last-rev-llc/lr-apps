"use client";

import { useState } from "react";
import { Card, CardContent, PageHeader } from "@repo/ui";

interface ArchSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  details: string[];
  links?: Array<{ label: string; url: string }>;
  tags?: string[];
}

const ARCH_SECTIONS: ArchSection[] = [
  {
    id: "monorepo",
    title: "Monorepo Structure",
    icon: "🗂️",
    description: "Turborepo-powered monorepo with shared packages and multiple apps.",
    details: [
      "apps/web — Next.js 15 App Router, primary application",
      "packages/ui — Shared component library (React + Tailwind)",
      "packages/db — Supabase client + server wrappers, type definitions",
      "packages/auth — Authentication helpers, requireAccess middleware",
      "Turborepo remote caching via Vercel for fast CI builds",
    ],
    tags: ["turborepo", "next.js", "typescript"],
  },
  {
    id: "frontend",
    title: "Frontend Stack",
    icon: "⚛️",
    description: "Next.js 15 App Router with React Server Components and glassmorphism UI.",
    details: [
      "Next.js 15 with App Router (RSC by default)",
      "Tailwind CSS v4 for styling",
      "Glassmorphism design system — backdrop blur, translucent surfaces",
      "@repo/ui shared components: Card, Badge, Search, PageHeader, EmptyState",
      "force-dynamic exports for pages requiring live Supabase data",
    ],
    tags: ["next.js", "react", "tailwind", "typescript"],
  },
  {
    id: "database",
    title: "Database & Backend",
    icon: "🗄️",
    description: "Supabase (Postgres) for all persistent data with row-level security.",
    details: [
      "@repo/db/server — createClient() for server-side Supabase queries",
      "@repo/db/client — createClient() for client-side mutations",
      "Row Level Security (RLS) enabled on all tables",
      "Key tables: leads, ideas, recipes, crons, agents, app_permissions, users",
      "JSON fields stored as JSONB for flexible schemas",
    ],
    tags: ["supabase", "postgres", "rls"],
  },
  {
    id: "auth",
    title: "Authentication",
    icon: "🔐",
    description: "Supabase Auth with per-app access control via app_permissions table.",
    details: [
      "requireAccess('app-slug') middleware in every app layout",
      "app_permissions table: user_id, app_slug, permission (view/edit/admin)",
      "Server-side auth checks via @repo/auth/server",
      "Session management handled by Supabase Auth helpers",
    ],
    tags: ["supabase-auth", "rbac"],
  },
  {
    id: "deployment",
    title: "Deployment & CI",
    icon: "🚀",
    description: "Vercel deployment with automatic preview deployments per branch.",
    details: [
      "Vercel for all deployments (web app + API routes)",
      "vercel link --repo for monorepo project linking",
      "Preview deployments on every PR via Vercel GitHub integration",
      "Environment variables managed in Vercel dashboard, pulled via vercel pull",
      "Turborepo remote cache accelerates CI builds",
    ],
    links: [
      { label: "Vercel Dashboard", url: "https://vercel.com/last-rev" },
    ],
    tags: ["vercel", "ci/cd", "github"],
  },
  {
    id: "command-center",
    title: "Command Center",
    icon: "⚡",
    description: "Internal mission control app with modular sub-pages for all operations.",
    details: [
      "Located at apps/web/app/apps/command-center/",
      "Each module is a route segment with page.tsx + components/ + lib/",
      "Server components fetch data, pass to client 'App' components",
      "Sidebar navigation with 20+ modules",
      "Modules: Leads, Ideas, Recipes, Crons, Users, Agents, Gallery, and more",
    ],
    tags: ["internal-tooling", "next.js"],
  },
  {
    id: "contentful",
    title: "Contentful CMS",
    icon: "📦",
    description: "Contentful as headless CMS for client site content, monitored via cron.",
    details: [
      "Multiple Contentful spaces per client",
      "Cron jobs refresh contentful_health table nightly",
      "Tracks: total entries, drafts, stale content, publish velocity",
      "SDK: @contentful/rich-text-react-renderer for rendering",
    ],
    tags: ["contentful", "cms", "headless"],
  },
  {
    id: "decisions",
    title: "Architecture Decisions",
    icon: "📋",
    description: "Key technical decisions and the reasoning behind them.",
    details: [
      "RSC-first: fetch data on server, minimize client JS",
      "Shared packages > copy-paste: ui, db, auth packages reduce duplication",
      "Supabase over custom Postgres: managed infra, auth, storage in one",
      "Tailwind CSS: utility-first keeps styles co-located and consistent",
      "Monorepo: enables atomic changes across apps and packages",
    ],
    tags: ["decisions", "adr"],
  },
];

interface ArchitectureAppProps {}

export function ArchitectureApp({}: ArchitectureAppProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="🏗️ Architecture"
        subtitle="System architecture, stack decisions, and infrastructure overview"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {ARCH_SECTIONS.map((section) => {
          const isOpen = expanded[section.id] ?? false;
          return (
            <Card key={section.id} className="p-4">
              <CardContent className="p-0">
                <button
                  onClick={() => toggle(section.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none shrink-0">{section.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white">{section.title}</span>
                        <span className="text-xs text-white/30">{isOpen ? "▲" : "▼"}</span>
                      </div>
                      <p className="text-xs text-white/50 mt-1 leading-relaxed">
                        {section.description}
                      </p>
                      {(section.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {section.tags!.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-white/8">
                    <ul className="space-y-1.5">
                      {section.details.map((detail, i) => (
                        <li key={i} className="flex gap-2 text-xs text-white/50">
                          <span className="text-white/20 shrink-0 mt-0.5">›</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                    {(section.links ?? []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {section.links!.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            {link.label} ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
