"use client";

import { useState } from "react";
import { Card, CardContent, EmptyState, PageHeader } from "@repo/ui";
import type { LighthouseSite } from "../lib/types";
import { SitesTable } from "./sites-table";
import { VitalsDetail } from "./vitals-detail";

interface LighthouseAppProps {
  initialSites: LighthouseSite[];
}

export function LighthouseApp({ initialSites }: LighthouseAppProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const selectedSite = initialSites.find((s) => s.id === selectedSiteId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="🏠 Lighthouse"
        subtitle="Performance monitoring across tracked sites"
      />

      <Card className="p-4">
        <CardContent className="p-0">
          {initialSites.length === 0 ? (
            <EmptyState
              icon="📊"
              title="No sites tracked"
              description="Add sites to start monitoring Lighthouse scores"
            />
          ) : (
            <SitesTable
              sites={initialSites}
              selectedSiteId={selectedSiteId}
              onSelectSite={(id) => setSelectedSiteId(id === selectedSiteId ? null : id)}
            />
          )}
        </CardContent>
      </Card>

      {selectedSite?.latestRun && (
        <VitalsDetail run={selectedSite.latestRun} siteName={selectedSite.name} />
      )}
    </div>
  );
}
