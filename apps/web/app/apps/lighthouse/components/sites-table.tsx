"use client";

import { Badge } from "@repo/ui";
import type { LighthouseSite } from "../lib/types";

function scoreVariant(score: number | null | undefined): "default" | "secondary" | "destructive" {
  if (score == null) return "secondary";
  if (score >= 90) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

interface SitesTableProps {
  sites: LighthouseSite[];
  selectedSiteId: string | null;
  onSelectSite: (id: string) => void;
}

export function SitesTable({ sites, selectedSiteId, onSelectSite }: SitesTableProps) {
  if (sites.length === 0) {
    return (
      <div className="text-center py-12 text-white/40 text-sm">
        No sites tracked yet. Add a site to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs text-white/40">
            <th className="pb-2 pr-4 font-medium">Site</th>
            <th className="pb-2 pr-4 font-medium">URL</th>
            <th className="pb-2 pr-4 font-medium text-center">Perf</th>
            <th className="pb-2 pr-4 font-medium text-center">A11y</th>
            <th className="pb-2 pr-4 font-medium text-center">BP</th>
            <th className="pb-2 pr-4 font-medium text-center">SEO</th>
            <th className="pb-2 font-medium">Last Run</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => {
            const run = site.latestRun;
            const isSelected = site.id === selectedSiteId;
            return (
              <tr
                key={site.id}
                onClick={() => onSelectSite(site.id)}
                className={`cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5 ${
                  isSelected ? "bg-amber-500/8" : ""
                }`}
              >
                <td className="py-2.5 pr-4 font-semibold text-white">{site.name}</td>
                <td className="py-2.5 pr-4 text-white/40 text-xs font-mono truncate max-w-[200px]">{site.url}</td>
                <td className="py-2.5 pr-4 text-center">
                  {run?.performance != null ? (
                    <Badge variant={scoreVariant(run.performance)} className="text-xs">
                      {run.performance}
                    </Badge>
                  ) : <span className="text-white/25">—</span>}
                </td>
                <td className="py-2.5 pr-4 text-center">
                  {run?.accessibility != null ? (
                    <Badge variant={scoreVariant(run.accessibility)} className="text-xs">
                      {run.accessibility}
                    </Badge>
                  ) : <span className="text-white/25">—</span>}
                </td>
                <td className="py-2.5 pr-4 text-center">
                  {run?.bestPractices != null ? (
                    <Badge variant={scoreVariant(run.bestPractices)} className="text-xs">
                      {run.bestPractices}
                    </Badge>
                  ) : <span className="text-white/25">—</span>}
                </td>
                <td className="py-2.5 pr-4 text-center">
                  {run?.seo != null ? (
                    <Badge variant={scoreVariant(run.seo)} className="text-xs">
                      {run.seo}
                    </Badge>
                  ) : <span className="text-white/25">—</span>}
                </td>
                <td className="py-2.5 text-xs text-white/30">
                  {run?.runAt ? new Date(run.runAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
