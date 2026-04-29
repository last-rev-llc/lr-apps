const EFFORT_WEIGHT = { Low: 1, Medium: 2, High: 3 } as const;

export function computeComposite(
  feasibility: number | null,
  impact: number | null,
  effort: string | null,
): number | null {
  if (feasibility == null || impact == null || !effort) return null;
  const w = EFFORT_WEIGHT[effort as keyof typeof EFFORT_WEIGHT];
  return w ? (feasibility + impact) / w : null;
}
