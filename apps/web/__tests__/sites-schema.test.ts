import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { STATUS_PULSE_SITE_COLUMN_LIST } from "@/app/apps/client-health/lib/status-pulse-schema";

/**
 * Schema-drift canary for the externally-owned `sites` table
 * (last-rev-llc/status-pulse). We pin the columns we read at every call
 * site; this test asserts each pinned column actually exists upstream so a
 * rename/drop is caught loudly instead of silently breaking the join.
 *
 * Skips when Supabase env vars are absent so local `pnpm test` doesn't
 * fail without credentials — runs in CI where the env is present.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasCreds = Boolean(SUPABASE_URL && SUPABASE_KEY);

// PostgREST returns 42703 when an unknown column is referenced.
const UNDEFINED_COLUMN = "42703";

describe("sites schema drift canary (status-pulse)", () => {
  it.skipIf(!hasCreds)(
    "every pinned status-pulse column still exists on `sites`",
    async () => {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

      // Iterate one column at a time so the failing column is named in
      // the assertion message — easier to triage than a bulk error.
      for (const col of STATUS_PULSE_SITE_COLUMN_LIST) {
        const { error } = await supabase.from("sites").select(col).limit(1);
        const code = (error as { code?: string } | null)?.code;
        expect(
          code === UNDEFINED_COLUMN ? `sites.${col} missing — status-pulse schema drift` : null,
          `sites.${col} missing — status-pulse schema drift (last-rev-llc/status-pulse)`,
        ).toBeNull();
      }
    },
  );

  it("column list is non-empty (guards against accidentally clearing the canary)", () => {
    expect(STATUS_PULSE_SITE_COLUMN_LIST.length).toBeGreaterThan(0);
  });
});
