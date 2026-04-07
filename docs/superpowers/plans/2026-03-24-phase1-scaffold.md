# Phase 1: Monorepo Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the Turborepo + pnpm monorepo skeleton with a single Next.js 16 app, shared config and theme packages, subdomain routing via proxy.ts, and verify deployment to Vercel.

**Architecture:** Single Next.js 16 app (`apps/web/`) in a Turborepo monorepo with shared packages (`packages/config`, `packages/theme`). `proxy.ts` handles hostname-based routing to map subdomains to route groups. A central app registry drives both routing and future "My Apps" pages.

**Tech Stack:** Next.js 16, TypeScript, Turborepo, pnpm, Tailwind CSS 4 (CSS-based config), Vitest

**Spec:** `docs/superpowers/specs/2026-03-24-nextjs-monorepo-migration-design.md`

---

## Important Notes

### Tailwind CSS v4

Tailwind v4 uses CSS-based configuration, NOT `tailwind.config.ts`. Theme tokens are defined with `@theme {}` blocks in CSS. The `packages/theme` package exports CSS files, not JS presets. There is no `tailwind.config.ts` anywhere in this project.

### Next.js 16 proxy.ts

In Next.js 16, `middleware.ts` was renamed to `proxy.ts`. The file still exports a function named `middleware` and a `config` object — only the filename changed.

### Coexistence with existing vanilla apps

The existing Vercel project (with 120+ rewrite rules in root `vercel.json`) must NOT be modified. The new Next.js app gets its own **separate Vercel project** on `*.lastrev.com`. Old apps continue working on `*.apps.lastrev.com` and `*.adam-harris.alphaclaw.app` until migrated. The two Vercel projects coexist on different domains during migration.

### Local development with subdomains

For local dev, `proxy.ts` supports a `?app=<slug>` query param override when `NODE_ENV === 'development'`, so developers don't need `/etc/hosts` or dnsmasq. For example, `localhost:3000?app=sentiment` routes to the sentiment app. `*.lastrev.localhost` is also supported if `/etc/hosts` is configured.

---

## File Map

**Root (create/modify):**
- `package.json` — pnpm workspace root, turbo scripts
- `pnpm-workspace.yaml` — workspace definitions
- `turbo.json` — task pipeline (build, dev, lint, typecheck, test)
- `.npmrc` — pnpm config
- `.env.local.example` — env var template
- `.gitignore` — updated for monorepo

**packages/config (create):**
- `package.json` — package metadata + eslint/prettier devDeps
- `tsconfig/base.json` — strict TS base
- `tsconfig/nextjs.json` — Next.js-specific overrides
- `eslint.config.mjs` — shared flat ESLint config
- `prettier.config.mjs` — shared Prettier config

**packages/theme (create):**
- `package.json` — package metadata
- `src/theme.css` — Tailwind v4 `@theme {}` block with glassmorphism tokens
- `src/globals.css` — base styles, dark mode, glass utilities
- `tsconfig.json` — extends base config

**apps/web (create):**
- `package.json` — Next.js app dependencies (includes geist, vitest)
- `next.config.ts` — Next.js 16 config
- `tsconfig.json` — extends nextjs config
- `vitest.config.ts` — vitest configuration with path aliases
- `proxy.ts` — Next.js 16 proxy (subdomain → route group)
- `app/layout.tsx` — root layout with theme, fonts
- `app/page.tsx` — default landing page
- `app/globals.css` — imports theme
- `app/not-found.tsx` — 404 for unknown routes
- `lib/app-registry.ts` — central app slug/subdomain/config map
- `lib/proxy-utils.ts` — subdomain resolution + route mapping
- `lib/__tests__/app-registry.test.ts` — registry tests
- `lib/__tests__/proxy-utils.test.ts` — proxy routing tests

---

## Task 1: Initialize pnpm workspace root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`
- Modify: `.gitignore`

- [ ] **Step 1: Back up existing package.json**

```bash
cp package.json package.json.bak
```

- [ ] **Step 2: Create root package.json**

Note: `create-app` script is a placeholder until the CLI is built in a later phase.

```json
{
  "name": "lr-apps",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2"
  },
  "packageManager": "pnpm@9.15.4"
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create .npmrc**

```ini
auto-install-peers=true
strict-peer-dependencies=false
```

- [ ] **Step 5: Update .gitignore**

Replace the existing `.gitignore` contents with:

```gitignore
# Dependencies
node_modules/

# Build
.next/
.turbo/
dist/

# Environment
.env
.env.local
.env*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store

# Backup
package.json.bak
```

- [ ] **Step 6: Install pnpm and turbo**

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
```

Expected: `node_modules/` created with `turbo` installed.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml .npmrc .gitignore pnpm-lock.yaml
git commit -m "feat: initialize pnpm workspace root with turbo"
```

---

## Task 2: Create turbo.json

**Files:**
- Create: `turbo.json`

- [ ] **Step 1: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 2: Verify turbo runs**

```bash
pnpm turbo run build --dry
```

Expected: Output showing no packages matched (no workspaces yet).

- [ ] **Step 3: Commit**

```bash
git add turbo.json
git commit -m "feat: add turbo.json task pipeline config"
```

---

## Task 3: Create packages/config

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig/base.json`
- Create: `packages/config/tsconfig/nextjs.json`
- Create: `packages/config/eslint.config.mjs`
- Create: `packages/config/prettier.config.mjs`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./tsconfig/base": "./tsconfig/base.json",
    "./tsconfig/nextjs": "./tsconfig/nextjs.json",
    "./eslint": "./eslint.config.mjs",
    "./prettier": "./prettier.config.mjs"
  },
  "devDependencies": {
    "@eslint/js": "^9",
    "typescript-eslint": "^8",
    "prettier": "^3"
  }
}
```

- [ ] **Step 2: Create tsconfig/base.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "es2022",
    "lib": ["es2022"],
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create tsconfig/nextjs.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "es2022"],
    "module": "esnext",
    "noEmit": true,
    "plugins": [{ "name": "next" }]
  }
}
```

- [ ] **Step 4: Create eslint.config.mjs**

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: [".next/", "node_modules/", "dist/"],
  },
);
```

- [ ] **Step 5: Create prettier.config.mjs**

```js
/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
};

export default config;
```

- [ ] **Step 6: Install and commit**

```bash
pnpm install
git add packages/config/
git commit -m "feat: add @repo/config with shared tsconfig, eslint, prettier"
```

---

## Task 4: Create packages/theme (Tailwind v4 CSS-based)

**Files:**
- Create: `packages/theme/package.json`
- Create: `packages/theme/tsconfig.json`
- Create: `packages/theme/src/theme.css`
- Create: `packages/theme/src/globals.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/theme",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./theme.css": "./src/theme.css",
    "./globals.css": "./src/globals.css"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "@repo/config/tsconfig/base",
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create src/theme.css**

This defines all glassmorphism design tokens using Tailwind v4's `@theme` directive. Ported from the existing `shared/theme.css`.

```css
@theme {
  /* Amber accent system */
  --color-accent-50: #fffbeb;
  --color-accent-100: #fef3c7;
  --color-accent-200: #fde68a;
  --color-accent-300: #fcd34d;
  --color-accent-400: #fbbf24;
  --color-accent-500: #f59e0b;
  --color-accent-600: #d97706;
  --color-accent-700: #b45309;
  --color-accent-800: #92400e;
  --color-accent-900: #78350f;
  --color-accent: #f59e0b;

  /* Navy background system */
  --color-navy-50: #e8eaf0;
  --color-navy-100: #c5c9d8;
  --color-navy-200: #9ea4be;
  --color-navy-300: #777fa4;
  --color-navy-400: #596391;
  --color-navy-500: #3b477e;
  --color-navy-600: #353f76;
  --color-navy-700: #2d356b;
  --color-navy-800: #252b61;
  --color-navy-900: #171b4e;
  --color-navy-950: #0a0e1a;
  --color-navy: #0f1629;

  /* Glass surface colors */
  --color-surface: oklch(100% 0 0 / 0.05);
  --color-surface-hover: oklch(100% 0 0 / 0.08);
  --color-surface-active: oklch(100% 0 0 / 0.12);
  --color-surface-border: oklch(100% 0 0 / 0.10);

  /* shadcn-compatible semantic colors (HSL values) */
  --color-background: oklch(13.7% 0.027 261);
  --color-foreground: oklch(98.4% 0.003 247);
  --color-card: oklch(17.2% 0.027 261);
  --color-card-foreground: oklch(98.4% 0.003 247);
  --color-popover: oklch(17.2% 0.027 261);
  --color-popover-foreground: oklch(98.4% 0.003 247);
  --color-primary: oklch(75.1% 0.159 62);
  --color-primary-foreground: oklch(13.7% 0.027 261);
  --color-secondary: oklch(24.3% 0.027 261);
  --color-secondary-foreground: oklch(98.4% 0.003 247);
  --color-muted: oklch(24.3% 0.027 261);
  --color-muted-foreground: oklch(70.7% 0.015 261);
  --color-destructive: oklch(57.7% 0.216 27);
  --color-destructive-foreground: oklch(98.4% 0.003 247);
  --color-border: oklch(24.3% 0.027 261);
  --color-input: oklch(24.3% 0.027 261);
  --color-ring: oklch(75.1% 0.159 62);

  /* Gradients */
  --gradient-navy: linear-gradient(135deg, #0a0e1a 0%, #1a1b3a 100%);

  /* Shadows */
  --shadow-glass: 0 8px 32px oklch(0% 0 0 / 0.3);
  --shadow-glass-sm: 0 4px 16px oklch(0% 0 0 / 0.2);
  --shadow-glow: 0 0 20px oklch(75.1% 0.159 62 / 0.3);

  /* Border radius */
  --radius-glass: 12px;
  --radius: 0.75rem;

  /* Fonts */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --font-heading: Georgia, "Times New Roman", serif;

  /* Backdrop blur */
  --blur-glass: 12px;
}
```

- [ ] **Step 4: Create src/globals.css**

```css
@import "tailwindcss";
@import "./theme.css";

@layer base {
  * {
    @apply border-border;
  }

  body {
    background: var(--gradient-navy);
    @apply text-foreground min-h-screen antialiased;
  }
}

@utility glass {
  background-color: var(--color-surface);
  backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-glass);
  box-shadow: var(--shadow-glass);
}

@utility glass-sm {
  background-color: var(--color-surface);
  backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-glass);
  box-shadow: var(--shadow-glass-sm);
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/theme/
git commit -m "feat: add @repo/theme with Tailwind v4 glassmorphism tokens"
```

---

## Task 5: Create apps/web — Next.js 16 skeleton

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/not-found.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^16",
    "react": "^19",
    "react-dom": "^19",
    "geist": "^1",
    "@repo/theme": "workspace:*"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "typescript": "^5",
    "vitest": "^3"
  }
}
```

- [ ] **Step 2: Create next.config.ts**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "@repo/config/tsconfig/nextjs",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 5: Create postcss.config.mjs**

Tailwind v4 uses `@tailwindcss/postcss` instead of the old `tailwindcss` PostCSS plugin.

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 6: Create app/globals.css**

```css
@import "@repo/theme/globals.css";
```

- [ ] **Step 7: Create app/layout.tsx**

```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Last Rev Apps",
  description: "Internal tools and applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
    >
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create app/page.tsx**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="glass p-8 text-center">
        <h1 className="font-heading text-3xl text-accent mb-2">
          Last Rev Apps
        </h1>
        <p className="text-muted-foreground">Monorepo scaffold — Phase 1</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 9: Create app/not-found.tsx**

```tsx
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="glass p-8 text-center">
        <h1 className="font-heading text-3xl text-accent mb-2">404</h1>
        <p className="text-muted-foreground">App not found</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 10: Install all dependencies from root**

```bash
cd /path/to/lr-apps && pnpm install
```

- [ ] **Step 11: Verify dev server starts**

```bash
pnpm turbo run dev --filter=@repo/web
```

Expected: Next.js dev server on `http://localhost:3000`, page shows "Last Rev Apps" with glassmorphism.

- [ ] **Step 12: Verify build succeeds**

```bash
pnpm turbo run build --filter=@repo/web
```

Expected: Build completes.

- [ ] **Step 13: Commit**

```bash
git add apps/web/
git commit -m "feat: add Next.js 16 app skeleton with Tailwind v4 theme"
```

---

## Task 6: Create app registry

**Files:**
- Create: `apps/web/lib/app-registry.ts`
- Create: `apps/web/lib/__tests__/app-registry.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/lib/__tests__/app-registry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  getAppBySubdomain,
  getAppBySlug,
  getAllApps,
  type AppConfig,
} from "../app-registry";

describe("app-registry", () => {
  it("looks up an app by subdomain", () => {
    const app = getAppBySubdomain("sentiment");
    expect(app).toBeDefined();
    expect(app?.slug).toBe("sentiment");
    expect(app?.subdomain).toBe("sentiment");
  });

  it("looks up an app by slug", () => {
    const app = getAppBySlug("command-center");
    expect(app).toBeDefined();
    expect(app?.subdomain).toBe("command-center");
  });

  it("returns undefined for unknown subdomain", () => {
    const app = getAppBySubdomain("nonexistent");
    expect(app).toBeUndefined();
  });

  it("returns the auth hub for 'auth' subdomain", () => {
    const app = getAppBySubdomain("auth");
    expect(app).toBeDefined();
    expect(app?.slug).toBe("auth");
    expect(app?.auth).toBe(false);
  });

  it("lists all apps", () => {
    const apps = getAllApps();
    expect(apps.length).toBeGreaterThan(0);
    expect(apps.every((a: AppConfig) => a.slug && a.subdomain)).toBe(true);
  });

  it("distinguishes auth-required from public apps", () => {
    const apps = getAllApps();
    const publicApps = apps.filter((a: AppConfig) => !a.auth);
    const authApps = apps.filter((a: AppConfig) => a.auth);
    expect(publicApps.length).toBeGreaterThan(0);
    expect(authApps.length).toBeGreaterThan(0);
  });

  it("handles subdomain that differs from slug", () => {
    const app = getAppBySubdomain("meetings");
    expect(app).toBeDefined();
    expect(app?.slug).toBe("meeting-summaries");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && pnpm vitest run lib/__tests__/app-registry.test.ts
```

Expected: FAIL — module `../app-registry` not found.

- [ ] **Step 3: Write the app registry**

Create `apps/web/lib/app-registry.ts`:

```ts
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
  // Auth hub — no auth required (it IS the auth system)
  {
    slug: "auth",
    name: "Auth",
    subdomain: "auth",
    routeGroup: "(auth)",
    auth: false,
    permission: "view",
    template: "full",
  },

  // === Consolidated apps ===
  {
    slug: "command-center",
    name: "Command Center",
    subdomain: "command-center",
    routeGroup: "apps/command-center",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "generations",
    name: "Generations",
    subdomain: "generations",
    routeGroup: "apps/generations",
    auth: true,
    permission: "view",
    template: "minimal",
  },

  // === Standalone — full template (auth required) ===
  {
    slug: "accounts",
    name: "Accounts",
    subdomain: "accounts",
    routeGroup: "apps/accounts",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "sentiment",
    name: "Sentiment",
    subdomain: "sentiment",
    routeGroup: "apps/sentiment",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "meeting-summaries",
    name: "Meeting Summaries",
    subdomain: "meetings",
    routeGroup: "apps/meeting-summaries",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "uptime",
    name: "Uptime",
    subdomain: "uptime",
    routeGroup: "apps/uptime",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "standup",
    name: "Standup",
    subdomain: "standup",
    routeGroup: "apps/standup",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "sprint-planning",
    name: "Sprint Planning",
    subdomain: "sprint",
    routeGroup: "apps/sprint-planning",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "sales",
    name: "Sales",
    subdomain: "sales",
    routeGroup: "apps/sales",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "daily-updates",
    name: "Daily Updates",
    subdomain: "updates",
    routeGroup: "apps/daily-updates",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "summaries",
    name: "Summaries",
    subdomain: "summaries",
    routeGroup: "apps/summaries",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "lighthouse",
    name: "Lighthouse",
    subdomain: "lighthouse",
    routeGroup: "apps/lighthouse",
    auth: true,
    permission: "view",
    template: "full",
  },
  {
    slug: "slang-translator",
    name: "Slang Translator",
    subdomain: "slang",
    routeGroup: "apps/slang-translator",
    auth: true,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "ai-calculator",
    name: "AI Calculator",
    subdomain: "calculator",
    routeGroup: "apps/ai-calculator",
    auth: true,
    permission: "view",
    template: "minimal",
  },

  // === Standalone — minimal template (public, no auth) ===
  {
    slug: "dad-joke-of-the-day",
    name: "Dad Joke of the Day",
    subdomain: "dad-jokes",
    routeGroup: "apps/dad-joke-of-the-day",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "superstars",
    name: "Superstars",
    subdomain: "superstars",
    routeGroup: "apps/superstars",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "travel-collection",
    name: "Travel Collection",
    subdomain: "travel",
    routeGroup: "apps/travel-collection",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "cringe-rizzler",
    name: "Cringe Rizzler",
    subdomain: "cringe",
    routeGroup: "apps/cringe-rizzler",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "proper-wine-pour",
    name: "Proper Wine Pour",
    subdomain: "wine",
    routeGroup: "apps/proper-wine-pour",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "roblox-dances",
    name: "Roblox Dances",
    subdomain: "roblox",
    routeGroup: "apps/roblox-dances",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "alpha-wins",
    name: "Alpha Wins",
    subdomain: "alpha-wins",
    routeGroup: "apps/alpha-wins",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "soccer-training",
    name: "Soccer Training",
    subdomain: "soccer",
    routeGroup: "apps/soccer-training",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "hspt-practice",
    name: "HSPT Practice",
    subdomain: "hspt-practice",
    routeGroup: "apps/hspt-practice",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "hspt-tutor",
    name: "HSPT Tutor",
    subdomain: "hspt-tutor",
    routeGroup: "apps/hspt-tutor",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "area-52",
    name: "Area 52",
    subdomain: "area-52",
    routeGroup: "apps/area-52",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "brommie-quake",
    name: "Brommie Quake",
    subdomain: "brommie",
    routeGroup: "apps/brommie-quake",
    auth: false,
    permission: "view",
    template: "minimal",
  },
  {
    slug: "age-of-apes",
    name: "Age of Apes",
    subdomain: "apes",
    routeGroup: "apps/age-of-apes",
    auth: false,
    permission: "view",
    template: "minimal",
  },
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/web && pnpm vitest run lib/__tests__/app-registry.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/app-registry.ts apps/web/lib/__tests__/app-registry.test.ts
git commit -m "feat: add app registry with subdomain/slug lookups and tests"
```

---

## Task 7: Create proxy.ts — subdomain routing

**Files:**
- Create: `apps/web/lib/proxy-utils.ts`
- Create: `apps/web/lib/__tests__/proxy-utils.test.ts`
- Create: `apps/web/proxy.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/lib/__tests__/proxy-utils.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveSubdomain, getRouteForSubdomain } from "../proxy-utils";

describe("proxy-utils", () => {
  describe("resolveSubdomain", () => {
    it("extracts subdomain from production host", () => {
      expect(resolveSubdomain("sentiment.lastrev.com")).toBe("sentiment");
    });

    it("extracts subdomain from localhost with port", () => {
      expect(resolveSubdomain("sentiment.lastrev.localhost:3000")).toBe(
        "sentiment",
      );
    });

    it("returns null for bare domain", () => {
      expect(resolveSubdomain("lastrev.com")).toBeNull();
    });

    it("returns null for www", () => {
      expect(resolveSubdomain("www.lastrev.com")).toBeNull();
    });

    it("handles localhost without subdomain", () => {
      expect(resolveSubdomain("localhost:3000")).toBeNull();
    });

    it("handles hyphenated subdomains", () => {
      expect(resolveSubdomain("command-center.lastrev.com")).toBe(
        "command-center",
      );
    });
  });

  describe("getRouteForSubdomain", () => {
    it("maps known subdomain to route group", () => {
      expect(getRouteForSubdomain("sentiment")).toBe("/apps/sentiment");
    });

    it("maps auth subdomain to auth route group", () => {
      expect(getRouteForSubdomain("auth")).toBe("/(auth)");
    });

    it("maps command-center subdomain", () => {
      expect(getRouteForSubdomain("command-center")).toBe(
        "/apps/command-center",
      );
    });

    it("returns null for unknown subdomain", () => {
      expect(getRouteForSubdomain("nonexistent")).toBeNull();
    });

    it("maps aliased subdomain (meetings → meeting-summaries)", () => {
      expect(getRouteForSubdomain("meetings")).toBe(
        "/apps/meeting-summaries",
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && pnpm vitest run lib/__tests__/proxy-utils.test.ts
```

Expected: FAIL — module `../proxy-utils` not found.

- [ ] **Step 3: Write proxy-utils.ts**

Create `apps/web/lib/proxy-utils.ts`:

```ts
import { getAppBySubdomain } from "./app-registry";

const PRODUCTION_DOMAIN = "lastrev.com";
const LOCAL_DOMAIN = "lastrev.localhost";

/**
 * Extracts the subdomain from a hostname.
 * Returns null if no subdomain (bare domain, www, or plain localhost).
 */
export function resolveSubdomain(host: string): string | null {
  const hostname = host.split(":")[0];

  if (hostname.endsWith(`.${PRODUCTION_DOMAIN}`)) {
    const sub = hostname.slice(0, -(PRODUCTION_DOMAIN.length + 1));
    if (!sub || sub === "www") return null;
    return sub;
  }

  if (hostname.endsWith(`.${LOCAL_DOMAIN}`)) {
    const sub = hostname.slice(0, -(LOCAL_DOMAIN.length + 1));
    if (!sub || sub === "www") return null;
    return sub;
  }

  return null;
}

/**
 * Maps a subdomain to its route group path.
 * Returns null if not registered.
 */
export function getRouteForSubdomain(subdomain: string): string | null {
  const app = getAppBySubdomain(subdomain);
  if (!app) return null;
  return `/${app.routeGroup}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/web && pnpm vitest run lib/__tests__/proxy-utils.test.ts
```

Expected: All 11 tests PASS.

- [ ] **Step 5: Write proxy.ts**

Create `apps/web/proxy.ts`. Note: Next.js 16 renamed the file from `middleware.ts` to `proxy.ts`, but the export is still named `middleware`.

```ts
import { NextRequest, NextResponse } from "next/server";
import { resolveSubdomain, getRouteForSubdomain } from "./lib/proxy-utils";

export function middleware(request: NextRequest) {
  // Dev mode: support ?app=<slug> query param for local testing
  if (process.env.NODE_ENV === "development") {
    const appParam = request.nextUrl.searchParams.get("app");
    if (appParam) {
      const routePath = getRouteForSubdomain(appParam);
      if (routePath) {
        const url = request.nextUrl.clone();
        url.searchParams.delete("app");
        url.pathname = `${routePath}${url.pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  const host = request.headers.get("host") ?? "";
  const subdomain = resolveSubdomain(host);

  // No subdomain — serve default landing page
  if (!subdomain) {
    return NextResponse.next();
  }

  const routePath = getRouteForSubdomain(subdomain);

  // Unknown subdomain — redirect to auth hub
  if (!routePath) {
    return NextResponse.redirect(new URL("https://auth.lastrev.com"));
  }

  // Rewrite to the correct route group
  const url = request.nextUrl.clone();
  url.pathname = `${routePath}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/proxy-utils.ts apps/web/lib/__tests__/proxy-utils.test.ts apps/web/proxy.ts
git commit -m "feat: add proxy.ts with subdomain routing, dev query param, and tests"
```

---

## Task 8: Add .env.local.example

**Files:**
- Create: `.env.local.example`

- [ ] **Step 1: Create .env.local.example**

```bash
# Supabase (required for Phase 2+)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 2: Commit**

```bash
git add .env.local.example
git commit -m "feat: add .env.local.example with Supabase config template"
```

---

## Task 9: Verify full build and test pipeline

- [ ] **Step 1: Clean install**

```bash
rm -rf node_modules apps/web/node_modules packages/*/node_modules
pnpm install
```

Expected: Clean install succeeds.

- [ ] **Step 2: Run typecheck**

```bash
pnpm turbo run typecheck
```

Expected: No TypeScript errors.

- [ ] **Step 3: Run all tests**

```bash
pnpm turbo run test
```

Expected: All tests pass (app-registry: 7, proxy-utils: 11 = 18 total).

- [ ] **Step 4: Run build**

```bash
pnpm turbo run build
```

Expected: Next.js build succeeds.

- [ ] **Step 5: Run dev server and verify manually**

```bash
pnpm turbo run dev --filter=@repo/web
```

Visit `http://localhost:3000` — should see "Last Rev Apps" with dark glassmorphism styling.
Visit `http://localhost:3000?app=sentiment` — should 404 (app route group not created yet, but proxy rewrites).

- [ ] **Step 6: Commit any fixes**

```bash
git add -A && git commit -m "fix: resolve any build/test issues from integration"
```

---

## Task 10: Deploy to Vercel

**Important:** This is a NEW Vercel project, separate from the existing one. The old project keeps serving vanilla apps on `*.apps.lastrev.com` / `*.alphaclaw.app`.

- [ ] **Step 1: Install Vercel CLI if needed**

```bash
npm i -g vercel
```

- [ ] **Step 2: Create and link new Vercel project**

```bash
cd apps/web && vercel link
```

When prompted:
- Create a new project (do NOT link to the existing lr-apps project)
- Name it something like `lr-apps-next`
- Set root directory to `apps/web`

- [ ] **Step 3: Deploy preview**

```bash
vercel deploy
```

Expected: Preview deployment succeeds. Visit preview URL to confirm landing page renders.

- [ ] **Step 4: Configure wildcard domain (manual step)**

In Vercel dashboard for the new `lr-apps-next` project:
1. Go to Project Settings → Domains
2. Add `*.lastrev.com`
3. Configure DNS: add wildcard CNAME `*.lastrev.com` → `cname.vercel-dns.com`

- [ ] **Step 5: Deploy to production**

```bash
vercel --prod
```

- [ ] **Step 6: Verify production**

- `https://lastrev.com` — should show landing page
- `https://sentiment.lastrev.com` — should 404 (app not built yet, but routing works)
- `https://random-thing.lastrev.com` — should redirect to `https://auth.lastrev.com`
- Old apps on `*.apps.lastrev.com` — should still work (separate Vercel project)

- [ ] **Step 7: Final commit**

```bash
git add -A && git commit -m "chore: phase 1 scaffold complete — deployed to Vercel"
```

---

## Phase 1 Completion Criteria

- [ ] Turborepo monorepo with pnpm workspaces
- [ ] `packages/config` with shared tsconfig, eslint, prettier
- [ ] `packages/theme` with Tailwind v4 glassmorphism tokens (`@theme` + `@utility`)
- [ ] `apps/web` Next.js 16 app builds and runs with Turbopack
- [ ] App registry with all ~32 apps mapped
- [ ] proxy.ts routes subdomains to route groups (+ `?app=` dev override)
- [ ] All tests pass (18 total)
- [ ] Deployed to NEW Vercel project with wildcard `*.lastrev.com`
- [ ] Old apps still work on `*.apps.lastrev.com` (separate project, untouched)
