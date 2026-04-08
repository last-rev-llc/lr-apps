/** Shown on /unauthorized when instant access isn’t available (e.g. checkout, pricing). */
export interface AppAccessRequest {
  label: string;
  href: string;
  description?: string;
}

export interface AppConfig {
  slug: string;
  name: string;
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
}

const apps: AppConfig[] = [
  // Auth hub
  { slug: "auth", name: "Auth", subdomain: "auth", routeGroup: "(auth)", auth: false, permission: "view", template: "full", tier: "free", features: {} },

  // Consolidated
  { slug: "command-center", name: "Command Center", subdomain: "command-center", routeGroup: "apps/command-center", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "generations", name: "Generations", subdomain: "generations", routeGroup: "apps/generations", auth: true, permission: "view", template: "minimal", tier: "free", features: {} },

  // Standalone — full (auth required)
  { slug: "accounts", name: "Accounts", subdomain: "accounts", routeGroup: "apps/accounts", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "sentiment", name: "Sentiment", subdomain: "sentiment", routeGroup: "apps/sentiment", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "meeting-summaries", name: "Meeting Summaries", subdomain: "meetings", routeGroup: "apps/meeting-summaries", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "uptime", name: "Uptime", subdomain: "uptime", routeGroup: "apps/uptime", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "standup", name: "Standup", subdomain: "standup", routeGroup: "apps/standup", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "sprint-planning", name: "Sprint Planning", subdomain: "sprint", routeGroup: "apps/sprint-planning", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "sales", name: "Sales", subdomain: "sales", routeGroup: "apps/sales", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "daily-updates", name: "Daily Updates", subdomain: "updates", routeGroup: "apps/daily-updates", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "summaries", name: "Summaries", subdomain: "summaries", routeGroup: "apps/summaries", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "lighthouse", name: "Lighthouse", subdomain: "lighthouse", routeGroup: "apps/lighthouse", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "slang-translator", name: "Slang Translator", subdomain: "slang", routeGroup: "apps/slang-translator", auth: true, permission: "view", template: "minimal", tier: "free", features: {} },
  {
    slug: "ai-calculator",
    name: "AI Calculator",
    subdomain: "calculator",
    routeGroup: "apps/ai-calculator",
    auth: true,
    permission: "view",
    template: "minimal",
    publicRoutes: ["/"],
    postEnrollPath: "calculator",
    tier: "free",
    features: {},
  },

  // Standalone — minimal (public, no auth)
  { slug: "dad-joke-of-the-day", name: "Dad Joke of the Day", subdomain: "dad-jokes", routeGroup: "apps/dad-joke-of-the-day", auth: true, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "superstars", name: "Superstars", subdomain: "superstars", routeGroup: "apps/superstars", auth: false, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "travel-collection", name: "Travel Collection", subdomain: "travel", routeGroup: "apps/travel-collection", auth: false, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "cringe-rizzler", name: "Cringe Rizzler", subdomain: "cringe", routeGroup: "apps/cringe-rizzler", auth: true, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "proper-wine-pour", name: "Proper Wine Pour", subdomain: "wine", routeGroup: "apps/proper-wine-pour", auth: false, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "roblox-dances", name: "Roblox Dances", subdomain: "roblox", routeGroup: "apps/roblox-dances", auth: false, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "alpha-wins", name: "Alpha Wins", subdomain: "alpha-wins", routeGroup: "apps/alpha-wins", auth: true, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "soccer-training", name: "Soccer Training", subdomain: "soccer", routeGroup: "apps/soccer-training", auth: false, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "hspt-practice", name: "HSPT Practice", subdomain: "hspt-practice", routeGroup: "apps/hspt-practice", auth: false, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "hspt-tutor", name: "HSPT Tutor", subdomain: "hspt-tutor", routeGroup: "apps/hspt-tutor", auth: false, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "area-52", name: "Area 52", subdomain: "area-52", routeGroup: "apps/area-52", auth: true, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "brommie-quake", name: "Brommie Quake", subdomain: "brommie", routeGroup: "apps/brommie-quake", auth: true, permission: "view", template: "minimal", tier: "free", features: {} },
  { slug: "age-of-apes", name: "Age of Apes", subdomain: "apes", routeGroup: "apps/age-of-apes", auth: true, permission: "view", template: "minimal", tier: "free", features: {} },
];

const subdomainIndex = new Map(apps.map((app) => [app.subdomain, app]));
const slugIndex = new Map(apps.map((app) => [app.slug, app]));

export function getAppBySubdomain(subdomain: string): AppConfig | undefined {
  return subdomainIndex.get(subdomain);
}

export function getAppBySlug(slug: string): AppConfig | undefined {
  return slugIndex.get(slug);
}

export function getAllApps(): AppConfig[] {
  return [...apps];
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
