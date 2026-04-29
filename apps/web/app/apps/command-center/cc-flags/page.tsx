import { requireAccess } from "@repo/auth/server";
import { getAllFlagRows, summarizeFlags } from "./lib/queries";
import { FlagsApp } from "./components/flags-app";

export const dynamic = "force-dynamic";

const KNOWN_FLAG_KEYS = ["tier_enforcement_enabled"];

export default async function FlagsPage() {
  await requireAccess("command-center", "admin");
  const rows = await getAllFlagRows();
  const flags = summarizeFlags(rows);
  for (const key of KNOWN_FLAG_KEYS) {
    if (!flags.find((f) => f.key === key)) {
      flags.push({
        key,
        global: null,
        tiers: { free: null, pro: null, enterprise: null },
        users: [],
      });
    }
  }
  flags.sort((a, b) => a.key.localeCompare(b.key));
  return <FlagsApp initialFlags={flags} knownKeys={KNOWN_FLAG_KEYS} />;
}
