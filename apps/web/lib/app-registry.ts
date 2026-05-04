// AppConfig.subdomain is the leftmost DNS label only (e.g. "client-health").
// The full host is built by lib/app-host.ts so the registry stays env-agnostic
// (works across *.apps.lastrev.com, legacy *.lastrev.com, and local mirrors).

/** Shown on /unauthorized when instant access isn’t available (e.g. checkout, pricing). */
export interface AppAccessRequest {
  label: string;
  href: string;
  description?: string;
}

/** Directory grouping aligned with lastrev.com/apps (Operations, AI Tools, …). */
export type AppShowcaseGroup =
  | "operations"
  | "ai-tools"
  | "fun-consumer"
  | "culture";

export const APP_SHOWCASE_GROUP_ORDER: AppShowcaseGroup[] = [
  "operations",
  "ai-tools",
  "fun-consumer",
  "culture",
];

export const APP_SHOWCASE_GROUP_LABEL: Record<AppShowcaseGroup, string> = {
  operations: "Operations",
  "ai-tools": "AI Tools",
  "fun-consumer": "Fun & Consumer",
  culture: "Culture",
};

export interface AppConfig {
  slug: string;
  name: string;
  /** One-line listing copy for hub cards and directories. */
  tagline: string;
  subdomain: string;
  routeGroup: string;
  auth: boolean;
  permission: "view" | "edit" | "admin";
  template: "full" | "minimal";
  /**
   * Paths that skip `requireAppLayoutAccess` and remain publicly accessible.
   * Patterns are relative to the app root (e.g. `"/"`, `"/pricing"`,
   * `"/api/webhooks/**"`). Supports exact matches and trailing `**` globs.
   */
  publicRoutes?: string[];
  /** Primary way to get access when self-enroll is off (Stripe, waitlist, etc.). */
  accessRequest?: AppAccessRequest;
  /**
   * After self-enroll, redirect to `/${routeGroup}/${postEnrollPath}` instead of
   * the app root (hybrid: public landing at root, gated tool on a subpath).
   */
  postEnrollPath?: string;
  /** Billing tier required to access this app. */
  tier: "free" | "pro" | "enterprise";
  /** Per-feature billing tier overrides. */
  features: Record<string, "free" | "pro" | "enterprise">;
  /** Groups apps on the platform directory pages (matches marketing site categories). */
  showcaseGroup: AppShowcaseGroup;
}

const apps: AppConfig[] = [
  // Auth hub
  {
    slug: "auth",
    name: "Auth",
    tagline: "Sign in and manage workspace access.",
    subdomain: "auth",
    routeGroup: "(auth)",
    auth: false,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },

  // Consolidated
  {
    slug: "command-center",
    name: "Command Center",
    tagline: "Ops hub spanning leads, recipes, scripts, galleries, concerts, and more.",
    subdomain: "command-center",
    routeGroup: "apps/command-center",
    auth: true,
    permission: "view",
    template: "full",
    tier: "enterprise",
    features: {},
    showcaseGroup: "ai-tools",
  },
  {
    slug: "generations",
    name: "Generations",
    tagline: "Create and iterate on AI-assisted generations and assets.",
    subdomain: "generations",
    routeGroup: "apps/generations",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "pro",
    features: {},
    showcaseGroup: "ai-tools",
  },

  // Standalone — full (auth required)
  {
    slug: "accounts",
    name: "Accounts",
    tagline: "Client accounts, hierarchies, and ownership in one ledger.",
    subdomain: "accounts",
    routeGroup: "apps/accounts",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "sentiment",
    name: "Sentiment",
    tagline: "Track sentiment signals, spikes, and rolling narratives.",
    subdomain: "sentiment",
    routeGroup: "apps/sentiment",
    auth: true,
    permission: "view",
    template: "full",
    tier: "pro",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "meeting-summaries",
    name: "Meeting Summaries",
    tagline: "Turn meetings into searchable notes and takeaway summaries.",
    subdomain: "meetings",
    routeGroup: "apps/meeting-summaries",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "uptime",
    name: "Uptime",
    tagline: "Check endpoint health, incidents, and status history.",
    subdomain: "uptime",
    routeGroup: "apps/uptime",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "standup",
    name: "Standup",
    tagline: "Run async standups with blockers, wins, and team pulse.",
    subdomain: "standup",
    routeGroup: "apps/standup",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "sprint-planning",
    name: "Sprint Planning",
    tagline: "Plan backlog, sprint goals, and capacity checkpoints.",
    subdomain: "sprint",
    routeGroup: "apps/sprint-planning",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "sales",
    name: "Sales",
    tagline: "Monitor pipeline stages, motions, and deal momentum.",
    subdomain: "sales",
    routeGroup: "apps/sales",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "daily-updates",
    name: "Daily Updates",
    tagline: "Pulse of what shipped today across teams.",
    subdomain: "updates",
    routeGroup: "apps/daily-updates",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "summaries",
    name: "Summaries",
    tagline: "Condense docs, threads, or decks into reusable summaries.",
    subdomain: "summaries",
    routeGroup: "apps/summaries",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "lighthouse",
    name: "Lighthouse",
    tagline: "Lighthouse audits and trending performance scores across sites.",
    subdomain: "lighthouse",
    routeGroup: "apps/lighthouse",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "slang-translator",
    name: "Slang Translator",
    tagline: "Decode slang, memes, and internet speak.",
    subdomain: "slang",
    routeGroup: "apps/slang-translator",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "ai-calculator",
    name: "AI Calculator",
    tagline: "Describe a spreadsheet in plain English and iterate with AI.",
    subdomain: "calculator",
    routeGroup: "apps/ai-calculator",
    auth: true,
    permission: "view",
    template: "minimal",
    publicRoutes: ["/"],
    postEnrollPath: "calculator",
    tier: "free",
    features: {},
    showcaseGroup: "ai-tools",
  },

  // Standalone — minimal (auth required)
  {
    slug: "dad-joke-of-the-day",
    name: "Dad Joke of the Day",
    tagline: "A fresh dad joke whenever you open the app.",
    subdomain: "dad-jokes",
    routeGroup: "apps/dad-joke-of-the-day",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "superstars",
    name: "Superstars",
    tagline: "Portfolio-style showcases for athletes and notable people.",
    subdomain: "superstars",
    routeGroup: "apps/superstars",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "travel-collection",
    name: "Travel Collection",
    tagline: "Bookmark stays, itineraries, and travel inspiration.",
    subdomain: "travel",
    routeGroup: "apps/travel-collection",
    auth: false,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "cringe-rizzler",
    name: "Cringe Rizzler",
    tagline: "Rate and roast modern texting—with AI flair.",
    subdomain: "cringe",
    routeGroup: "apps/cringe-rizzler",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "proper-wine-pour",
    name: "Proper Wine Pour",
    tagline: "Dial in the textbook wine pour angles and motion.",
    subdomain: "wine",
    routeGroup: "apps/proper-wine-pour",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "roblox-dances",
    name: "Roblox Dances",
    tagline: "Browse Roblox emotes, tags, and quick previews.",
    subdomain: "roblox",
    routeGroup: "apps/roblox-dances",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "alpha-wins",
    name: "Alpha Wins",
    tagline: "Swipe through personal wins worth celebrating aloud.",
    subdomain: "alpha-wins",
    routeGroup: "apps/alpha-wins",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "soccer-training",
    name: "Soccer Training",
    tagline: "Drills, intensity tags, and session planning for soccer.",
    subdomain: "soccer",
    routeGroup: "apps/soccer-training",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "hspt-practice",
    name: "HSPT Practice",
    tagline: "Timed HSPT-style practice with pacing and rationales.",
    subdomain: "hspt-practice",
    routeGroup: "apps/hspt-practice",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "culture",
  },
  {
    slug: "hspt-tutor",
    name: "HSPT Tutor",
    tagline: "Adaptive HSPT tutoring with worked explanations.",
    subdomain: "hspt-tutor",
    routeGroup: "apps/hspt-tutor",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "culture",
  },
  {
    slug: "area-52",
    name: "Area 52",
    tagline: "Park experiments and off-menu prototypes the team explores.",
    subdomain: "area-52",
    routeGroup: "apps/area-52",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "brommie-quake",
    name: "Brommie Quake",
    tagline: "Hype-machine tribute to the Earthquakes stadium-wave moment.",
    subdomain: "brommie",
    routeGroup: "apps/brommie-quake",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "age-of-apes",
    name: "Age of Apes",
    tagline: "Army-of-apes progression and resource calculators.",
    subdomain: "apes",
    routeGroup: "apps/age-of-apes",
    auth: true,
    permission: "view",
    template: "minimal",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "ideas",
    name: "Ideas",
    tagline: "Capture, score, and triage product ideas without losing context.",
    subdomain: "ideas",
    routeGroup: "apps/ideas",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "operations",
  },
  {
    slug: "meme-generator",
    name: "Meme Generator",
    tagline: "Make memes from templates and remixable captions.",
    subdomain: "meme-generator",
    routeGroup: "apps/meme-generator",
    auth: true,
    permission: "view",
    template: "full",
    tier: "free",
    features: {},
    showcaseGroup: "fun-consumer",
  },
  {
    slug: "crm",
    name: "CRM",
    tagline: "Enterprise-ready CRM lanes with granular admin permissions.",
    subdomain: "crm",
    routeGroup: "apps/crm",
    auth: true,
    permission: "admin",
    template: "full",
    tier: "enterprise",
    features: {},
    showcaseGroup: "operations",
  },
];

const subdomainIndex = new Map(apps.map((app) => [app.subdomain, app]));
const slugIndex = new Map(apps.map((app) => [app.slug, app]));

// The registry is currently an in-process Map, so caching adds no
// latency win. We still cache for hot-path consistency and to prep for
// a future DB-backed registry — keys include CACHE_VERSION so each
// deploy invalidates them automatically.
import { cacheGet, cacheSet, cacheKeys } from "@repo/db/cache";
import { setSelfEnrollTierResolver } from "@repo/auth/self-enroll";

// Lets `@repo/auth` auto-allow self-enroll for any free-tier app without
// duplicating the slug list. Side-effect import from proxy.ts and any page
// that touches this registry, so middleware and request handlers see it.
setSelfEnrollTierResolver((slug) => slugIndex.get(slug)?.tier);

export function getAppBySubdomain(subdomain: string): AppConfig | undefined {
  const hit = subdomainIndex.get(subdomain);
  if (hit) {
    void cacheSet(cacheKeys.appBySubdomain(subdomain), hit);
  }
  return hit;
}

export function getAppBySlug(slug: string): AppConfig | undefined {
  const hit = slugIndex.get(slug);
  if (hit) {
    void cacheSet(cacheKeys.appBySlug(slug), hit);
  }
  return hit;
}

/** Async variant that reads the cache first, falls back to the Map. */
export async function getAppBySubdomainCached(
  subdomain: string,
): Promise<AppConfig | undefined> {
  const cached = await cacheGet<AppConfig>(cacheKeys.appBySubdomain(subdomain));
  if (cached) return cached;
  return getAppBySubdomain(subdomain);
}

export async function getAppBySlugCached(
  slug: string,
): Promise<AppConfig | undefined> {
  const cached = await cacheGet<AppConfig>(cacheKeys.appBySlug(slug));
  if (cached) return cached;
  return getAppBySlug(slug);
}

export function getAllApps(): AppConfig[] {
  return [...apps];
}

/** Category sections for directory pages (same order as lastrev.com/apps). */
export function getShowcaseSections(appList: AppConfig[]): {
  group: AppShowcaseGroup;
  label: string;
  apps: AppConfig[];
}[] {
  const byGroup = new Map<AppShowcaseGroup, AppConfig[]>();
  for (const g of APP_SHOWCASE_GROUP_ORDER) {
    byGroup.set(g, []);
  }
  for (const app of appList) {
    byGroup.get(app.showcaseGroup)?.push(app);
  }
  return APP_SHOWCASE_GROUP_ORDER.map((group) => ({
    group,
    label: APP_SHOWCASE_GROUP_LABEL[group],
    apps: (byGroup.get(group) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((s) => s.apps.length > 0);
}

/**
 * Returns true when `pathname` matches one of the app's `publicRoutes` patterns.
 * Supports exact matches and trailing `**` globs (e.g. `/api/webhooks/**`).
 */
export function isPublicRoute(appSlug: string, pathname: string): boolean {
  const cfg = slugIndex.get(appSlug);
  if (!cfg?.publicRoutes) return false;
  return cfg.publicRoutes.some((pattern) => {
    if (pattern.endsWith("/**")) {
      const prefix = pattern.slice(0, -3);
      return pathname === prefix || pathname.startsWith(prefix + "/");
    }
    return pathname === pattern;
  });
}
