import { createServiceRoleClient } from "@repo/db/service-role";
import type { Permission } from "@repo/db/types";

const APP_DOMAINS = ["apps.lastrev.com", "apps.lastrev.localhost"];

/**
 * Extract app slug from a returnTo value. Handles:
 * - Path-based: `/apps/foo` or `/apps/foo/bar`
 * - Full URL with path: `http://localhost:3000/apps/foo`
 * - Subdomain URL: `https://command-center.apps.lastrev.com/`
 */
export function appSlugFromReturnTo(returnTo: string | undefined): string | null {
  if (!returnTo) return null;

  let path: string;
  let hostname: string | null = null;
  try {
    if (returnTo.startsWith("/")) {
      path = returnTo.split("?")[0] ?? returnTo;
    } else {
      const url = new URL(returnTo);
      path = url.pathname;
      hostname = url.hostname;
    }
  } catch {
    return null;
  }

  // Try path-based match first: /apps/{slug} or /apps/{slug}/...
  const m = path.match(/^\/apps\/([\w-]+)/);
  if (m?.[1]) return m[1];

  // Try subdomain-based match: {slug}.apps.lastrev.com
  if (hostname) {
    for (const domain of APP_DOMAINS) {
      if (hostname.endsWith(`.${domain}`)) {
        const subdomain = hostname.slice(0, -(domain.length + 1));
        if (subdomain && /^[\w-]+$/.test(subdomain)) {
          return subdomain;
        }
      }
    }
  }

  return null;
}

function parseSelfEnrollSlugs(): Set<string> {
  const raw = process.env.APP_SELF_ENROLL_SLUGS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

const SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Explicit list in APP_SELF_ENROLL_SLUGS, or — in development only — any slug
 * when the env var is unset (so local testing works without copying every slug).
 */
export function isSelfEnrollAllowedForSlug(slug: string): boolean {
  if (!SLUG_PATTERN.test(slug)) return false;
  const allowed = parseSelfEnrollSlugs();
  if (allowed.size > 0) return allowed.has(slug);
  return process.env.NODE_ENV === "development";
}

/**
 * Inserts view permission when policy allows. Returns true if the user may use the app
 * afterward (inserted, duplicate, or already had a row).
 */
export async function selfEnrollUserIfAllowed(
  userId: string,
  slug: string,
): Promise<boolean> {
  if (!isSelfEnrollAllowedForSlug(slug)) return false;

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("app_permissions")
    .select("user_id")
    .eq("user_id", userId)
    .eq("app_slug", slug)
    .maybeSingle();

  if (existing) return true;

  const permission: Permission = "view";
  const row = {
    user_id: userId,
    app_slug: slug,
    permission,
  };
  const { error } = await supabase
    .from("app_permissions")
    .insert(row as never);

  if (error?.code === "23505") return true;

  if (error) {
    console.error("[auth] self-enroll app_permissions failed:", error.message);
    return false;
  }

  return true;
}

export async function maybeSelfEnrollAfterLogin(
  userId: string,
  returnTo: string | undefined,
): Promise<void> {
  const slug = appSlugFromReturnTo(returnTo);
  if (!slug) return;
  await selfEnrollUserIfAllowed(userId, slug);
}
