// Source of truth for the columns we read from the externally-owned
// `sites` table (last-rev-llc/status-pulse). Pinning the column list (no
// `select("*")`) means an upstream rename/drop surfaces as an explicit
// PostgREST 42703 error instead of a silent join miss.
//
// The canary at apps/web/__tests__/sites-schema.test.ts validates each
// column against the live table — if you change this list, expect the
// canary to flag it.
export const STATUS_PULSE_SITE_COLUMNS =
  "id, url, name, description, status, uptimePercent, responseTimeMs, lastChecked" as const;

export const STATUS_PULSE_SITE_COLUMN_LIST = [
  "id",
  "url",
  "name",
  "description",
  "status",
  "uptimePercent",
  "responseTimeMs",
  "lastChecked",
] as const;
