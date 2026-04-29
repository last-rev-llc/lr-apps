import { StatCard } from "@repo/ui";
import type { SlugTotal } from "../lib/types";

interface Props {
  totals: SlugTotal[];
}

export function EventTotalsBySlug({ totals }: Props) {
  if (totals.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No events recorded yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {totals.map((t) => (
        <StatCard key={t.slug} value={t.count} label={t.slug} size="sm" />
      ))}
    </div>
  );
}
