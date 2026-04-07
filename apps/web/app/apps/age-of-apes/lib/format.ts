/**
 * Format large numbers with K / M / B abbreviations.
 * Falls back to locale string for smaller numbers.
 */
export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "0";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "") + "B";
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.?0+$/, "") + "K";
  return n.toLocaleString();
}

/**
 * Format exact integer counts (no abbreviation).
 */
export function fmtExact(n: number | null | undefined): string {
  if (n == null) return "0";
  return n.toLocaleString();
}

/**
 * Convert separate d/h/m/s into total seconds.
 */
export function toSeconds(d: number, h: number, m: number, s: number): number {
  return (d || 0) * 86400 + (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

/**
 * Format a total-seconds duration as a human-readable string.
 * e.g. "3d 5h 12m" or "45m 30s" or "0s"
 */
export function fmtTime(totalSec: number): string {
  const sec = Math.round(totalSec);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s) parts.push(`${s}s`);
  return parts.join(" ") || "0s";
}

/**
 * Apply a speed % bonus to a base duration in seconds.
 * Formula: actualSec = totalSec * (100 / (100 + speed))
 */
export function applySpeed(totalSec: number, speedPercent: number): number {
  if (speedPercent <= 0) return totalSec;
  return totalSec * (100 / (100 + speedPercent));
}

/**
 * Capitalise a camelCase key into a human label.
 * e.g. "nanomaterials" → "Nanomaterials", "lightFibers" → "Light Fibers"
 */
export function camelToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
