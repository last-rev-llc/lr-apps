"use client";

import { useState, useMemo } from "react";
import { Badge, Card, CardContent, EmptyState, PageHeader, Search } from "@repo/ui";
import type { AppPermissionRow, Permission } from "../lib/types";

const PERMISSION_STYLE: Record<Permission, { bg: string; text: string }> = {
  admin: { bg: "rgba(239,68,68,0.15)",  text: "#f87171" },
  edit:  { bg: "rgba(234,179,8,0.15)",  text: "#facc15" },
  view:  { bg: "rgba(34,197,94,0.12)",  text: "#4ade80" },
};

function groupByApp(rows: AppPermissionRow[]): Record<string, AppPermissionRow[]> {
  return rows.reduce<Record<string, AppPermissionRow[]>>((acc, r) => {
    (acc[r.app_slug] ??= []).push(r);
    return acc;
  }, {});
}

interface AppAccessAppProps {
  initialPermissions: AppPermissionRow[];
}

export function AppAccessApp({ initialPermissions }: AppAccessAppProps) {
  const [permissions] = useState<AppPermissionRow[]>(initialPermissions);
  const [search, setSearch] = useState("");
  const [permFilter, setPermFilter] = useState<"all" | Permission>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return permissions.filter((p) => {
      if (permFilter !== "all" && p.permission !== permFilter) return false;
      if (q) {
        const matchApp = p.app_slug.toLowerCase().includes(q);
        const matchUser = (p.user_email ?? "").toLowerCase().includes(q) ||
                         (p.user_name ?? "").toLowerCase().includes(q) ||
                         p.user_id.toLowerCase().includes(q);
        if (!matchApp && !matchUser) return false;
      }
      return true;
    });
  }, [permissions, search, permFilter]);

  const grouped = useMemo(() => groupByApp(filtered), [filtered]);
  const appSlugs = Object.keys(grouped).sort();

  const totalApps = new Set(permissions.map((p) => p.app_slug)).size;
  const totalUsers = new Set(permissions.map((p) => p.user_id)).size;

  return (
    <div className="space-y-4">
      <PageHeader
        title="🔐 App Access"
        subtitle={`${permissions.length} permissions · ${totalApps} apps · ${totalUsers} users`}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(["admin", "edit", "view"] as Permission[]).map((p) => {
          const count = permissions.filter((r) => r.permission === p).length;
          const s = PERMISSION_STYLE[p];
          return (
            <Card key={p} className="p-3">
              <CardContent className="p-0 text-center">
                <div className="text-xl font-bold" style={{ color: s.text }}>{count}</div>
                <div className="text-xs text-white/40 mt-0.5 capitalize">{p}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Search value={search} onChange={setSearch} placeholder="Search app or user…" className="flex-1 min-w-[200px]" />
        <div className="flex gap-1">
          {(["all", "admin", "edit", "view"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setPermFilter(f)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors ${
                permFilter === f
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                  : "border-white/15 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped by app */}
      {appSlugs.length === 0 ? (
        <EmptyState icon="🔐" title="No permissions found" description="No permissions have been configured yet" />
      ) : (
        <div className="space-y-4">
          {appSlugs.map((slug) => {
            const rows = grouped[slug];
            return (
              <Card key={slug} className="p-4">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-white">{slug}</span>
                    <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">
                      {rows.length} user{rows.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rows.map((row) => (
                      <div key={row.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-xl">👤</span>
                        <div className="flex-1 min-w-0">
                          {row.user_name && (
                            <div className="text-sm font-medium text-white">{row.user_name}</div>
                          )}
                          <div className="text-xs text-white/40 font-mono truncate">
                            {row.user_email ?? row.user_id}
                          </div>
                        </div>
                        <Badge
                          className="text-[10px] px-1.5 py-0.5 border-0 capitalize"
                          style={{ background: PERMISSION_STYLE[row.permission].bg, color: PERMISSION_STYLE[row.permission].text }}
                        >
                          {row.permission}
                        </Badge>
                        <span className="text-[11px] text-white/20">
                          {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
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
