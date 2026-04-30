import { describe, it, expect } from "vitest";
import { I18N_PILOT_SLUGS, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../i18n";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function flatten(obj: Json, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flatten(v as Json, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

async function loadCatalog(slug: string, locale: string) {
  const mod = await import(`../messages/${slug}/${locale}.json`);
  return (mod.default ?? mod) as Json;
}

describe("i18n message parity", () => {
  for (const slug of I18N_PILOT_SLUGS) {
    const nonDefault = SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE);
    for (const locale of nonDefault) {
      it(`${slug}: ${DEFAULT_LOCALE}.json and ${locale}.json have identical key sets`, async () => {
        const baseline = flatten(await loadCatalog(slug, DEFAULT_LOCALE));
        const candidate = flatten(await loadCatalog(slug, locale));

        const missingInCandidate = baseline.filter((k) => !candidate.includes(k));
        const extraInCandidate = candidate.filter((k) => !baseline.includes(k));

        if (missingInCandidate.length || extraInCandidate.length) {
          const diff = [
            missingInCandidate.length
              ? `Missing in ${slug}/${locale}.json:\n  - ${missingInCandidate.join("\n  - ")}`
              : "",
            extraInCandidate.length
              ? `Extra in ${slug}/${locale}.json (not in ${DEFAULT_LOCALE}.json):\n  + ${extraInCandidate.join("\n  + ")}`
              : "",
          ]
            .filter(Boolean)
            .join("\n\n");
          throw new Error(`Key parity mismatch for ${slug}\n${diff}`);
        }

        expect(candidate).toEqual(baseline);
      });
    }
  }
});
