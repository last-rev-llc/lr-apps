import { createServiceRoleClient } from "@repo/db/service-role";
import type { Tier } from "@repo/billing";
import type { FlagRow, FlagSummary } from "./types";

const TIERS: Tier[] = ["free", "pro", "enterprise"];

export async function getAllFlagRows(): Promise<FlagRow[]> {
  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("feature_flags")
    .select("id, key, user_id, tier, enabled, created_at")
    .order("key", { ascending: true });
  if (error) {
    console.error("feature_flags fetch error:", error);
    return [];
  }
  const rows = (data ?? []) as unknown as FlagRow[];

  // Hydrate user_email for user-specific overrides via the auth admin API.
  const userIds = Array.from(
    new Set(rows.map((r) => r.user_id).filter((u): u is string => Boolean(u))),
  );
  const emailMap = new Map<string, string>();
  for (const id of userIds) {
    try {
      const { data: u } = await db.auth.admin.getUserById(id);
      const email = u?.user?.email;
      if (email) emailMap.set(id, email);
    } catch {
      /* ignore — best-effort hydration */
    }
  }
  return rows.map((r) => ({
    ...r,
    user_email: r.user_id ? (emailMap.get(r.user_id) ?? null) : null,
  }));
}

export function summarizeFlags(rows: FlagRow[]): FlagSummary[] {
  const byKey = new Map<string, FlagSummary>();
  for (const row of rows) {
    let summary = byKey.get(row.key);
    if (!summary) {
      summary = {
        key: row.key,
        global: null,
        tiers: { free: null, pro: null, enterprise: null },
        users: [],
      };
      byKey.set(row.key, summary);
    }
    if (row.user_id) {
      summary.users.push({
        id: row.id,
        user_id: row.user_id,
        user_email: row.user_email ?? null,
        enabled: row.enabled,
      });
    } else if (row.tier) {
      summary.tiers[row.tier] = { id: row.id, enabled: row.enabled };
    } else {
      summary.global = { id: row.id, enabled: row.enabled };
    }
  }
  return Array.from(byKey.values()).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
}

export { TIERS };
