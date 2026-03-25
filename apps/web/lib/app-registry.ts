export interface AppConfig {
  slug: string;
  name: string;
  subdomain: string;
  routeGroup: string;
  auth: boolean;
  permission: "view" | "edit" | "admin";
  template: "full" | "minimal";
}

const apps: AppConfig[] = [
  // Auth hub
  { slug: "auth", name: "Auth", subdomain: "auth", routeGroup: "(auth)", auth: false, permission: "view", template: "full" },

  // Consolidated
  { slug: "command-center", name: "Command Center", subdomain: "command-center", routeGroup: "apps/command-center", auth: true, permission: "view", template: "full" },
  { slug: "generations", name: "Generations", subdomain: "generations", routeGroup: "apps/generations", auth: true, permission: "view", template: "minimal" },

  // Standalone — full (auth required)
  { slug: "accounts", name: "Accounts", subdomain: "accounts", routeGroup: "apps/accounts", auth: true, permission: "view", template: "full" },
  { slug: "sentiment", name: "Sentiment", subdomain: "sentiment", routeGroup: "apps/sentiment", auth: true, permission: "view", template: "full" },
  { slug: "meeting-summaries", name: "Meeting Summaries", subdomain: "meetings", routeGroup: "apps/meeting-summaries", auth: true, permission: "view", template: "full" },
  { slug: "uptime", name: "Uptime", subdomain: "uptime", routeGroup: "apps/uptime", auth: true, permission: "view", template: "full" },
  { slug: "standup", name: "Standup", subdomain: "standup", routeGroup: "apps/standup", auth: true, permission: "view", template: "full" },
  { slug: "sprint-planning", name: "Sprint Planning", subdomain: "sprint", routeGroup: "apps/sprint-planning", auth: true, permission: "view", template: "full" },
  { slug: "sales", name: "Sales", subdomain: "sales", routeGroup: "apps/sales", auth: true, permission: "view", template: "full" },
  { slug: "daily-updates", name: "Daily Updates", subdomain: "updates", routeGroup: "apps/daily-updates", auth: true, permission: "view", template: "full" },
  { slug: "summaries", name: "Summaries", subdomain: "summaries", routeGroup: "apps/summaries", auth: true, permission: "view", template: "full" },
  { slug: "lighthouse", name: "Lighthouse", subdomain: "lighthouse", routeGroup: "apps/lighthouse", auth: true, permission: "view", template: "full" },
  { slug: "slang-translator", name: "Slang Translator", subdomain: "slang", routeGroup: "apps/slang-translator", auth: true, permission: "view", template: "minimal" },
  { slug: "ai-calculator", name: "AI Calculator", subdomain: "calculator", routeGroup: "apps/ai-calculator", auth: true, permission: "view", template: "minimal" },

  // Standalone — minimal (public, no auth)
  { slug: "dad-joke-of-the-day", name: "Dad Joke of the Day", subdomain: "dad-jokes", routeGroup: "apps/dad-joke-of-the-day", auth: false, permission: "view", template: "minimal" },
  { slug: "superstars", name: "Superstars", subdomain: "superstars", routeGroup: "apps/superstars", auth: false, permission: "view", template: "minimal" },
  { slug: "travel-collection", name: "Travel Collection", subdomain: "travel", routeGroup: "apps/travel-collection", auth: false, permission: "view", template: "minimal" },
  { slug: "cringe-rizzler", name: "Cringe Rizzler", subdomain: "cringe", routeGroup: "apps/cringe-rizzler", auth: false, permission: "view", template: "minimal" },
  { slug: "proper-wine-pour", name: "Proper Wine Pour", subdomain: "wine", routeGroup: "apps/proper-wine-pour", auth: false, permission: "view", template: "minimal" },
  { slug: "roblox-dances", name: "Roblox Dances", subdomain: "roblox", routeGroup: "apps/roblox-dances", auth: false, permission: "view", template: "minimal" },
  { slug: "alpha-wins", name: "Alpha Wins", subdomain: "alpha-wins", routeGroup: "apps/alpha-wins", auth: false, permission: "view", template: "minimal" },
  { slug: "soccer-training", name: "Soccer Training", subdomain: "soccer", routeGroup: "apps/soccer-training", auth: false, permission: "view", template: "minimal" },
  { slug: "hspt-practice", name: "HSPT Practice", subdomain: "hspt-practice", routeGroup: "apps/hspt-practice", auth: false, permission: "view", template: "minimal" },
  { slug: "hspt-tutor", name: "HSPT Tutor", subdomain: "hspt-tutor", routeGroup: "apps/hspt-tutor", auth: false, permission: "view", template: "minimal" },
  { slug: "area-52", name: "Area 52", subdomain: "area-52", routeGroup: "apps/area-52", auth: false, permission: "view", template: "minimal" },
  { slug: "brommie-quake", name: "Brommie Quake", subdomain: "brommie", routeGroup: "apps/brommie-quake", auth: false, permission: "view", template: "minimal" },
  { slug: "age-of-apes", name: "Age of Apes", subdomain: "apes", routeGroup: "apps/age-of-apes", auth: false, permission: "view", template: "minimal" },
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
