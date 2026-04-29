import { describe, it, expect, beforeEach } from "vitest";
import {
  parseArgs,
  insertRegistryEntry,
  renderPage,
  renderLayout,
  renderPageTest,
  createApp,
  type CreateAppArgs,
  type CreateAppFs,
} from "../create-app";

const FAKE_REGISTRY = `export interface AppConfig {
  slug: string;
  name: string;
  subdomain: string;
  routeGroup: string;
  auth: boolean;
  permission: "view" | "edit" | "admin";
  template: "full" | "minimal";
  tier: "free" | "pro" | "enterprise";
  features: Record<string, "free" | "pro" | "enterprise">;
}

const apps: AppConfig[] = [
  { slug: "auth", name: "Auth", subdomain: "auth", routeGroup: "(auth)", auth: false, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "accounts", name: "Accounts", subdomain: "accounts", routeGroup: "apps/accounts", auth: true, permission: "view", template: "full", tier: "free", features: {} },
];

const subdomainIndex = new Map(apps.map((app) => [app.subdomain, app]));
const slugIndex = new Map(apps.map((app) => [app.slug, app]));
`;

function makeFakeFs(initialRegistry = FAKE_REGISTRY): { fs: CreateAppFs; files: Map<string, string>; dirs: Set<string> } {
  const files = new Map<string, string>();
  const dirs = new Set<string>();
  files.set("/repo/apps/web/lib/app-registry.ts", initialRegistry);

  const fs: CreateAppFs = {
    readFile: (file) => {
      const content = files.get(file);
      if (content === undefined) throw new Error(`no such file: ${file}`);
      return content;
    },
    writeFile: (file, content) => {
      files.set(file, content);
    },
    mkdir: (dir) => {
      dirs.add(dir);
    },
    exists: (file) => files.has(file) || dirs.has(file),
  };
  return { fs, files, dirs };
}

describe("parseArgs", () => {
  it("requires a slug", () => {
    expect(() => parseArgs([])).toThrow(/Missing required <slug>/);
  });

  it("rejects non-kebab-case slug", () => {
    expect(() => parseArgs(["MyApp"])).toThrow(/Invalid slug/);
    expect(() => parseArgs(["my_app"])).toThrow(/Invalid slug/);
    expect(() => parseArgs(["-leading"])).toThrow(/Invalid slug/);
    expect(() => parseArgs(["trailing-"])).toThrow(/Invalid slug/);
    expect(() => parseArgs(["double--dash"])).toThrow(/Invalid slug/);
  });

  it("accepts valid kebab-case slugs", () => {
    expect(parseArgs(["widget"]).slug).toBe("widget");
    expect(parseArgs(["my-widget"]).slug).toBe("my-widget");
    expect(parseArgs(["widget-v2"]).slug).toBe("widget-v2");
  });

  it("defaults name to title-cased slug", () => {
    expect(parseArgs(["my-widget"]).name).toBe("My Widget");
  });

  it("accepts --name override", () => {
    expect(parseArgs(["widget", "--name=Custom Name"]).name).toBe("Custom Name");
  });

  it("defaults subdomain to slug", () => {
    expect(parseArgs(["widget"]).subdomain).toBe("widget");
  });

  it("accepts --subdomain override", () => {
    expect(parseArgs(["widget", "--subdomain=wid"]).subdomain).toBe("wid");
  });

  it("rejects invalid tier", () => {
    expect(() => parseArgs(["w", "--tier=gold"])).toThrow(/Invalid --tier/);
  });

  it("rejects invalid template", () => {
    expect(() => parseArgs(["w", "--template=maxi"])).toThrow(/Invalid --template/);
  });

  it("rejects invalid permission", () => {
    expect(() => parseArgs(["w", "--permission=root"])).toThrow(/Invalid --permission/);
  });

  it("defaults auth=true, accepts --auth=false", () => {
    expect(parseArgs(["w"]).auth).toBe(true);
    expect(parseArgs(["w", "--auth=false"]).auth).toBe(false);
  });
});

describe("insertRegistryEntry", () => {
  const baseArgs: CreateAppArgs = {
    slug: "widget",
    name: "Widget",
    subdomain: "widget",
    tier: "free",
    template: "minimal",
    permission: "view",
    auth: true,
  };

  it("inserts new entry before the closing `];`", () => {
    const next = insertRegistryEntry(FAKE_REGISTRY, baseArgs);
    expect(next).toContain(`slug: "widget"`);
    expect(next.indexOf(`slug: "widget"`)).toBeLessThan(next.indexOf("subdomainIndex"));
    expect(next.indexOf(`slug: "widget"`)).toBeGreaterThan(next.indexOf(`slug: "accounts"`));
  });

  it("rejects duplicate slug", () => {
    expect(() => insertRegistryEntry(FAKE_REGISTRY, { ...baseArgs, slug: "accounts" })).toThrow(
      /already exists/,
    );
  });

  it("rejects duplicate subdomain", () => {
    expect(() => insertRegistryEntry(FAKE_REGISTRY, { ...baseArgs, subdomain: "accounts" })).toThrow(
      /already taken/,
    );
  });

  it("throws when registry structure is unrecognized", () => {
    expect(() => insertRegistryEntry("// empty", baseArgs)).toThrow(/file structure/);
  });

  it("preserves auth and tier values in the generated literal", () => {
    const next = insertRegistryEntry(FAKE_REGISTRY, {
      ...baseArgs,
      slug: "pro-widget",
      subdomain: "pro-widget",
      tier: "pro",
      auth: false,
    });
    expect(next).toMatch(/slug: "pro-widget".*auth: false.*tier: "pro"/);
  });
});

describe("renderPage", () => {
  it("produces a valid React page component", () => {
    const out = renderPage({
      slug: "my-widget",
      name: "My Widget",
      subdomain: "my-widget",
      tier: "free",
      template: "minimal",
      permission: "view",
      auth: true,
    });
    expect(out).toContain("export default function MyWidgetPage()");
    expect(out).toContain("My Widget");
  });
});

describe("renderLayout", () => {
  it("gates with requireAppLayoutAccess when auth=true", () => {
    const out = renderLayout({
      slug: "widget",
      name: "Widget",
      subdomain: "widget",
      tier: "free",
      template: "minimal",
      permission: "view",
      auth: true,
    });
    expect(out).toContain(`await requireAppLayoutAccess("widget")`);
    expect(out).toContain("export default async function WidgetLayout");
  });

  it("omits auth gate when auth=false", () => {
    const out = renderLayout({
      slug: "widget",
      name: "Widget",
      subdomain: "widget",
      tier: "free",
      template: "minimal",
      permission: "view",
      auth: false,
    });
    expect(out).not.toContain("requireAppLayoutAccess");
    expect(out).toContain("export default function WidgetLayout");
  });
});

describe("renderPageTest", () => {
  it("emits a smoke test importing from ../page", () => {
    const out = renderPageTest({
      slug: "widget",
      name: "Widget",
      subdomain: "widget",
      tier: "free",
      template: "minimal",
      permission: "view",
      auth: true,
    });
    expect(out).toContain('import WidgetPage from "../page"');
    expect(out).toContain('@repo/test-utils');
    expect(out).toContain('renderWithProviders');
  });
});

describe("createApp (integration, fake fs)", () => {
  let io: ReturnType<typeof makeFakeFs>;

  beforeEach(() => {
    io = makeFakeFs();
  });

  it("writes registry, page, layout, and test files", () => {
    const result = createApp(
      "/repo",
      {
        slug: "widget",
        name: "Widget",
        subdomain: "widget",
        tier: "free",
        template: "minimal",
        permission: "view",
        auth: true,
      },
      io.fs,
    );

    expect(result.slug).toBe("widget");
    expect(io.files.has("/repo/apps/web/app/apps/widget/page.tsx")).toBe(true);
    expect(io.files.has("/repo/apps/web/app/apps/widget/layout.tsx")).toBe(true);
    expect(io.files.has("/repo/apps/web/app/apps/widget/__tests__/page.test.tsx")).toBe(true);
    expect(io.files.get("/repo/apps/web/lib/app-registry.ts")).toContain(`slug: "widget"`);
  });

  it("refuses to overwrite an existing app directory", () => {
    io.dirs.add("/repo/apps/web/app/apps/widget");
    expect(() =>
      createApp(
        "/repo",
        {
          slug: "widget",
          name: "Widget",
          subdomain: "widget",
          tier: "free",
          template: "minimal",
          permission: "view",
          auth: true,
        },
        io.fs,
      ),
    ).toThrow(/directory already exists/);
  });

  it("rejects duplicate slug", () => {
    expect(() =>
      createApp(
        "/repo",
        {
          slug: "accounts",
          name: "Accounts",
          subdomain: "accounts-2",
          tier: "free",
          template: "minimal",
          permission: "view",
          auth: true,
        },
        io.fs,
      ),
    ).toThrow(/already exists/);
  });
});
