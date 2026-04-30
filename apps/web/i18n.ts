import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const SUPPORTED_LOCALES = ["en", "es"] as const;
export const DEFAULT_LOCALE = "en";

// Apps that have message catalogs. Each catalog lives at
// `apps/web/messages/<slug>/<locale>.json` and is namespaced under the slug
// in the merged messages object so consumers call
// `useTranslations("<slug>.<group>")`.
export const I18N_PILOT_SLUGS = [
  "dad-joke-of-the-day",
  "slang-translator",
  "proper-wine-pour",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type PilotSlug = (typeof I18N_PILOT_SLUGS)[number];

export function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

async function loadCatalog(slug: PilotSlug, locale: SupportedLocale) {
  try {
    const mod = await import(`./messages/${slug}/${locale}.json`);
    return (mod.default ?? mod) as Record<string, unknown>;
  } catch {
    if (locale === DEFAULT_LOCALE) return {};
    const fallback = await import(`./messages/${slug}/${DEFAULT_LOCALE}.json`);
    return (fallback.default ?? fallback) as Record<string, unknown>;
  }
}

export async function loadAllMessages(locale: SupportedLocale) {
  const entries = await Promise.all(
    I18N_PILOT_SLUGS.map(async (slug) => [slug, await loadCatalog(slug, locale)] as const),
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: SupportedLocale = isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: await loadAllMessages(locale),
  };
});
