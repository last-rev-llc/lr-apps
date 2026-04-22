#!/usr/bin/env node
// Scaffolds a new micro-app:
//   1. Appends an AppConfig entry to apps/web/lib/app-registry.ts
//   2. Creates apps/web/app/apps/<slug>/{page.tsx,layout.tsx}
//   3. Creates a smoke test in apps/web/app/apps/<slug>/__tests__/page.test.tsx
//
// Usage:
//   pnpm create-app <slug> [options]
//     --name=<display name>    default: title-case of slug
//     --subdomain=<sub>        default: slug
//     --tier=free|pro|enterprise  default: free
//     --template=minimal|full  default: minimal
//     --permission=view|edit|admin  default: view
//     --auth=true|false        default: true
//
// Example:
//   pnpm create-app widget --name="Widget Studio" --tier=pro
import * as fs from "node:fs";
import * as path from "node:path";

const KEBAB_CASE_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export interface CreateAppArgs {
  slug: string;
  name: string;
  subdomain: string;
  tier: "free" | "pro" | "enterprise";
  template: "minimal" | "full";
  permission: "view" | "edit" | "admin";
  auth: boolean;
}

export interface CreateAppPaths {
  registry: string;
  appDir: string;
  page: string;
  layout: string;
  test: string;
}

export interface CreateAppFs {
  readFile: (file: string) => string;
  writeFile: (file: string, content: string) => void;
  mkdir: (dir: string) => void;
  exists: (file: string) => boolean;
}

const defaultFs: CreateAppFs = {
  readFile: (file) => fs.readFileSync(file, "utf8"),
  writeFile: (file, content) => fs.writeFileSync(file, content),
  mkdir: (dir) => fs.mkdirSync(dir, { recursive: true }),
  exists: (file) => fs.existsSync(file),
};

export function parseArgs(argv: string[]): CreateAppArgs {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq === -1) {
        flags[arg.slice(2)] = "true";
      } else {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      }
    } else {
      positional.push(arg);
    }
  }

  const slug = positional[0];
  if (!slug) {
    throw new Error("Missing required <slug> argument. Usage: pnpm create-app <slug>");
  }
  if (!KEBAB_CASE_RE.test(slug)) {
    throw new Error(
      `Invalid slug "${slug}". Must be kebab-case (lowercase letters, digits, single hyphens).`,
    );
  }

  const tier = (flags.tier ?? "free") as CreateAppArgs["tier"];
  if (!["free", "pro", "enterprise"].includes(tier)) {
    throw new Error(`Invalid --tier "${tier}". Expected free|pro|enterprise.`);
  }

  const template = (flags.template ?? "minimal") as CreateAppArgs["template"];
  if (!["minimal", "full"].includes(template)) {
    throw new Error(`Invalid --template "${template}". Expected minimal|full.`);
  }

  const permission = (flags.permission ?? "view") as CreateAppArgs["permission"];
  if (!["view", "edit", "admin"].includes(permission)) {
    throw new Error(`Invalid --permission "${permission}". Expected view|edit|admin.`);
  }

  const auth = (flags.auth ?? "true") !== "false";

  const subdomain = flags.subdomain ?? slug;
  if (!KEBAB_CASE_RE.test(subdomain)) {
    throw new Error(
      `Invalid subdomain "${subdomain}". Must be kebab-case (lowercase letters, digits, single hyphens).`,
    );
  }

  const name =
    flags.name ??
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return { slug, name, subdomain, tier, template, permission, auth };
}

export function defaultPaths(repoRoot: string, slug: string): CreateAppPaths {
  const appDir = path.join(repoRoot, "apps/web/app/apps", slug);
  return {
    registry: path.join(repoRoot, "apps/web/lib/app-registry.ts"),
    appDir,
    page: path.join(appDir, "page.tsx"),
    layout: path.join(appDir, "layout.tsx"),
    test: path.join(appDir, "__tests__/page.test.tsx"),
  };
}

/**
 * Inserts a new AppConfig literal into the `apps` array in
 * `app-registry.ts`, just before the closing `];` that precedes the
 * subdomain/slug index maps. Throws if the slug or subdomain is already
 * present.
 */
export function insertRegistryEntry(source: string, args: CreateAppArgs): string {
  if (new RegExp(`slug:\\s*["']${args.slug}["']`).test(source)) {
    throw new Error(`App with slug "${args.slug}" already exists in app-registry.ts.`);
  }
  if (new RegExp(`subdomain:\\s*["']${args.subdomain}["']`).test(source)) {
    throw new Error(
      `Subdomain "${args.subdomain}" is already taken in app-registry.ts. Use --subdomain=<unique>.`,
    );
  }

  const arrayClosePattern = /\n\];\n\nconst subdomainIndex/;
  if (!arrayClosePattern.test(source)) {
    throw new Error(
      "Could not locate `];` before `const subdomainIndex` in app-registry.ts — file structure changed?",
    );
  }

  const routeGroup = `apps/${args.slug}`;
  const entry = `  { slug: "${args.slug}", name: "${args.name}", subdomain: "${args.subdomain}", routeGroup: "${routeGroup}", auth: ${args.auth}, permission: "${args.permission}", template: "${args.template}", tier: "${args.tier}", features: {} },\n`;

  return source.replace(arrayClosePattern, `\n${entry}];\n\nconst subdomainIndex`);
}

export function renderPage(args: CreateAppArgs): string {
  return `export default function ${pascalCase(args.slug)}Page() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">${args.name}</h1>
    </div>
  );
}
`;
}

export function renderLayout(args: CreateAppArgs): string {
  if (args.auth) {
    return `import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "${args.name}",
};

export default async function ${pascalCase(args.slug)}Layout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("${args.slug}");
  return <main className="min-h-screen max-w-6xl mx-auto px-4 py-6">{children}</main>;
}
`;
  }
  return `import type { ReactNode } from "react";

export const metadata = {
  title: "${args.name}",
};

export default function ${pascalCase(args.slug)}Layout({ children }: { children: ReactNode }) {
  return <main className="min-h-screen max-w-6xl mx-auto px-4 py-6">{children}</main>;
}
`;
}

export function renderPageTest(args: CreateAppArgs): string {
  return `// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import ${pascalCase(args.slug)}Page from "../page";

describe("${pascalCase(args.slug)}Page", () => {
  it("renders the page heading", () => {
    renderWithProviders(<${pascalCase(args.slug)}Page />);
    expect(screen.getByRole("heading", { name: "${args.name}" })).toBeInTheDocument();
  });
});
`;
}

function pascalCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

export interface CreateAppResult {
  slug: string;
  registryFile: string;
  files: string[];
}

export function createApp(
  repoRoot: string,
  args: CreateAppArgs,
  io: CreateAppFs = defaultFs,
): CreateAppResult {
  const paths = defaultPaths(repoRoot, args.slug);

  if (io.exists(paths.appDir)) {
    throw new Error(`App directory already exists: ${paths.appDir}`);
  }

  const registrySource = io.readFile(paths.registry);
  const nextRegistry = insertRegistryEntry(registrySource, args);

  io.mkdir(paths.appDir);
  io.mkdir(path.dirname(paths.test));
  io.writeFile(paths.registry, nextRegistry);
  io.writeFile(paths.page, renderPage(args));
  io.writeFile(paths.layout, renderLayout(args));
  io.writeFile(paths.test, renderPageTest(args));

  return {
    slug: args.slug,
    registryFile: paths.registry,
    files: [paths.page, paths.layout, paths.test],
  };
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
    const result = createApp(repoRoot, args);
    console.log(`Created app "${result.slug}".`);
    console.log(`  registry: ${path.relative(repoRoot, result.registryFile)}`);
    for (const file of result.files) {
      console.log(`  wrote: ${path.relative(repoRoot, file)}`);
    }
    console.log("\nNext steps:");
    console.log(`  - pnpm --filter @repo/web test ${args.slug}`);
    console.log(`  - visit http://localhost:3000/?app=${args.subdomain}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`create-app failed: ${message}`);
    process.exit(1);
  }
}
