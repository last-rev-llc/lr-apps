/**
 * Token Usage Audit Script
 *
 * Scans all TSX/CSS files under apps/web/app/apps/ for hardcoded design values
 * that should use theme tokens from packages/theme/src/theme.css instead.
 *
 * Usage: npx tsx scripts/audit-tokens.ts [--json]
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Types ──

interface Violation {
  file: string;
  line: number;
  type: "color" | "shadow" | "radius" | "font";
  severity: "high" | "medium" | "low";
  value: string;
  context: string;
}

interface AppReport {
  app: string;
  totalViolations: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  violations: Violation[];
}

// ── Configuration ──

const ROOT = join(__dirname, "..");
const APPS_DIR = join(ROOT, "apps/web/app/apps");
const DOCS_DIR = join(ROOT, "docs");
const REPORT_PATH = join(DOCS_DIR, "token-violations-report.md");

// Files to skip (theme definitions, not violations)
const SKIP_PATTERNS = [
  /theme\.css$/,
  /node_modules/,
  /\.next\//,
  /dist\//,
];

// ── Helpers ──

function globFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];

  function walk(d: string) {
    let entries: string[];
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(d, entry);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        if (entry === "node_modules" || entry === ".next" || entry === "dist") continue;
        walk(full);
      } else if (extensions.some((ext) => entry.endsWith(ext))) {
        results.push(full);
      }
    }
  }

  walk(dir);
  return results;
}

function shouldSkip(filePath: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(filePath));
}

function deriveAppName(filePath: string): string {
  const rel = relative(APPS_DIR, filePath);
  const parts = rel.split("/");
  // For command-center sub-apps, include sub-app name
  if (parts[0] === "command-center" && parts.length > 2) {
    return `command-center/${parts[1]}`;
  }
  return parts[0];
}

// ── Scanner ──

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comment-only lines
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

    // ── Hex colors ──
    const hexMatches = line.matchAll(/#[0-9a-fA-F]{3,8}\b/g);
    for (const m of hexMatches) {
      // Skip CSS variable definitions and imports
      if (/--[\w-]+\s*:/.test(line)) continue;
      // Skip SVG fill="none" type patterns and common non-color hex
      if (m[0] === "#fff" || m[0] === "#000") continue;
      violations.push({
        file: filePath,
        line: lineNum,
        type: "color",
        severity: "high",
        value: m[0],
        context: trimmed.slice(0, 120),
      });
    }

    // ── RGB/RGBA ──
    const rgbMatches = line.matchAll(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g);
    for (const m of rgbMatches) {
      if (/--[\w-]+\s*:/.test(line)) continue;
      violations.push({
        file: filePath,
        line: lineNum,
        type: "color",
        severity: "high",
        value: m[0] + "...)",
        context: trimmed.slice(0, 120),
      });
    }

    // ── OKLCH (not in var definitions) ──
    const oklchMatches = line.matchAll(/oklch\([^)]+\)/g);
    for (const m of oklchMatches) {
      if (/--[\w-]+\s*:/.test(line)) continue;
      violations.push({
        file: filePath,
        line: lineNum,
        type: "color",
        severity: "high",
        value: m[0],
        context: trimmed.slice(0, 120),
      });
    }

    // ── Tailwind hardcoded color classes ──
    const twColorMatches = line.matchAll(
      /\b(?:text|bg|border|from|to|via|ring|outline|accent|fill|stroke|shadow|divide|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?\b/g,
    );
    for (const m of twColorMatches) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: "color",
        severity: "medium",
        value: m[0],
        context: trimmed.slice(0, 120),
      });
    }

    // ── Hardcoded shadows ──
    if (/boxShadow\s*:/.test(line)) {
      const shadowMatch = line.match(/boxShadow\s*:\s*["'`]([^"'`]+)["'`]/);
      if (shadowMatch && !/var\(--shadow/.test(shadowMatch[1])) {
        violations.push({
          file: filePath,
          line: lineNum,
          type: "shadow",
          severity: "high",
          value: shadowMatch[1].slice(0, 80),
          context: trimmed.slice(0, 120),
        });
      }
    }
    const twShadowMatches = line.matchAll(/shadow-\[[^\]]+\]/g);
    for (const m of twShadowMatches) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: "shadow",
        severity: "medium",
        value: m[0],
        context: trimmed.slice(0, 120),
      });
    }

    // ── Hardcoded border-radius ──
    if (/borderRadius\s*:/.test(line)) {
      const radiusMatch = line.match(/borderRadius\s*:\s*["'`]?([\d.]+(?:px|rem|em|%))["'`]?/);
      if (radiusMatch && !/var\(--radius/.test(line)) {
        violations.push({
          file: filePath,
          line: lineNum,
          type: "radius",
          severity: "high",
          value: radiusMatch[1],
          context: trimmed.slice(0, 120),
        });
      }
    }
    const twRadiusMatches = line.matchAll(/rounded-\[[^\]]+\]/g);
    for (const m of twRadiusMatches) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: "radius",
        severity: "medium",
        value: m[0],
        context: trimmed.slice(0, 120),
      });
    }

    // ── Hardcoded font-family ──
    if (/fontFamily\s*:/.test(line)) {
      const fontMatch = line.match(/fontFamily\s*:\s*["'`]([^"'`]+)["'`]/);
      if (fontMatch && !/var\(--font/.test(fontMatch[1])) {
        violations.push({
          file: filePath,
          line: lineNum,
          type: "font",
          severity: "high",
          value: fontMatch[1].slice(0, 60),
          context: trimmed.slice(0, 120),
        });
      }
    }
    const twFontMatches = line.matchAll(/font-\[["'][^\]]+\]/g);
    for (const m of twFontMatches) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: "font",
        severity: "medium",
        value: m[0],
        context: trimmed.slice(0, 120),
      });
    }
  }

  return violations;
}

// ── Report Generation ──

function generateMarkdown(reports: AppReport[]): string {
  const totalViolations = reports.reduce((s, r) => s + r.totalViolations, 0);
  const totalByType: Record<string, number> = {};
  const totalBySeverity: Record<string, number> = {};

  for (const r of reports) {
    for (const [k, v] of Object.entries(r.byType)) {
      totalByType[k] = (totalByType[k] || 0) + v;
    }
    for (const [k, v] of Object.entries(r.bySeverity)) {
      totalBySeverity[k] = (totalBySeverity[k] || 0) + v;
    }
  }

  let md = `# Token Usage Violations Report

> Generated: ${new Date().toISOString().split("T")[0]}
> Scanned: \`apps/web/app/apps/\` (${reports.length} apps)
> Total violations: **${totalViolations}**

## Summary

| Severity | Count |
|----------|-------|
| High (inline hex/rgb/oklch) | ${totalBySeverity["high"] || 0} |
| Medium (Tailwind hardcoded colors) | ${totalBySeverity["medium"] || 0} |
| Low | ${totalBySeverity["low"] || 0} |

| Violation Type | Count |
|----------------|-------|
| Color | ${totalByType["color"] || 0} |
| Shadow | ${totalByType["shadow"] || 0} |
| Border Radius | ${totalByType["radius"] || 0} |
| Font Family | ${totalByType["font"] || 0} |

## Per-App Summary

| App | Total | Color | Shadow | Radius | Font | High | Medium | Low |
|-----|-------|-------|--------|--------|------|------|--------|-----|
`;

  for (const r of reports.sort((a, b) => b.totalViolations - a.totalViolations)) {
    md += `| ${r.app} | ${r.totalViolations} | ${r.byType["color"] || 0} | ${r.byType["shadow"] || 0} | ${r.byType["radius"] || 0} | ${r.byType["font"] || 0} | ${r.bySeverity["high"] || 0} | ${r.bySeverity["medium"] || 0} | ${r.bySeverity["low"] || 0} |\n`;
  }

  md += `
## Available Theme Tokens

Use these tokens instead of hardcoded values. Defined in \`packages/theme/src/theme.css\`.

### Colors
- **Accent**: \`--color-accent\`, \`--color-accent-50\` through \`--color-accent-900\`
- **Navy**: \`--color-navy\`, \`--color-navy-50\` through \`--color-navy-950\`
- **Status**: \`--color-green\`, \`--color-yellow\`, \`--color-red\`, \`--color-orange\`, \`--color-blue\`
- **Surface**: \`--color-surface\`, \`--color-surface-hover\`, \`--color-surface-active\`, \`--color-surface-border\`
- **Semantic**: \`--color-background\`, \`--color-foreground\`, \`--color-card\`, \`--color-primary\`, \`--color-secondary\`, \`--color-muted\`, \`--color-destructive\`, \`--color-border\`, \`--color-input\`, \`--color-ring\`
- **Pill palette**: \`--color-pill-0\` through \`--color-pill-9\`
- **Neon icons**: \`--color-neon-amber\`, \`--color-neon-violet\`, \`--color-neon-blue\`, \`--color-neon-green\`, \`--color-neon-pink\`, \`--color-neon-cyan\`

### Gradients
- \`--gradient-navy\`, \`--gradient-navy-3\`, \`--gradient-accent\`

### Shadows
- \`--shadow-glass\`, \`--shadow-glass-sm\`, \`--shadow-glass-hover\`
- \`--shadow-glow\`, \`--shadow-glow-accent\`

### Border Radius
- \`--radius-glass\` (12px), \`--radius\` (0.75rem)

### Fonts
- \`--font-sans\`, \`--font-mono\`, \`--font-heading\`

### Blur
- \`--blur-glass\`, \`--blur-glass-strong\`

## Per-App Violation Details

`;

  for (const r of reports.sort((a, b) => b.totalViolations - a.totalViolations)) {
    if (r.totalViolations === 0) continue;

    md += `### ${r.app} (${r.totalViolations} violations)\n\n`;

    // Group by severity
    const bySeverity = { high: [] as Violation[], medium: [] as Violation[], low: [] as Violation[] };
    for (const v of r.violations) {
      bySeverity[v.severity].push(v);
    }

    for (const sev of ["high", "medium", "low"] as const) {
      const vList = bySeverity[sev];
      if (vList.length === 0) continue;

      md += `**${sev.charAt(0).toUpperCase() + sev.slice(1)} severity** (${vList.length})\n\n`;
      md += `| File | Line | Type | Value |\n`;
      md += `|------|------|------|-------|\n`;

      for (const v of vList) {
        const relFile = relative(ROOT, v.file);
        const escapedValue = v.value.replace(/\|/g, "\\|").slice(0, 60);
        md += `| \`${relFile}\` | ${v.line} | ${v.type} | \`${escapedValue}\` |\n`;
      }
      md += "\n";
    }
  }

  return md;
}

// ── Main ──

function main() {
  const jsonFlag = process.argv.includes("--json");

  const files = globFiles(APPS_DIR, [".tsx", ".ts", ".css", ".jsx"]);
  const validFiles = files.filter((f) => !shouldSkip(f));

  console.error(`Scanning ${validFiles.length} files across apps/web/app/apps/...`);

  // Group violations by app
  const appViolations = new Map<string, Violation[]>();

  for (const file of validFiles) {
    const violations = scanFile(file);
    if (violations.length === 0) continue;

    const appName = deriveAppName(file);
    const existing = appViolations.get(appName) || [];
    existing.push(...violations);
    appViolations.set(appName, existing);
  }

  // Build per-app reports
  const reports: AppReport[] = [];

  // Include all apps, even with 0 violations
  let appDirs: string[];
  try {
    appDirs = readdirSync(APPS_DIR).filter((d) => {
      try {
        return statSync(join(APPS_DIR, d)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    appDirs = [];
  }

  for (const appDir of appDirs) {
    const violations = appViolations.get(appDir) || [];

    // Also gather sub-app violations for command-center
    const subAppViolations: Violation[] = [];
    for (const [key, v] of appViolations) {
      if (key.startsWith(`${appDir}/`)) {
        subAppViolations.push(...v);
      }
    }

    const allViolations = [...violations, ...subAppViolations];

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const v of allViolations) {
      byType[v.type] = (byType[v.type] || 0) + 1;
      bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
    }

    reports.push({
      app: appDir,
      totalViolations: allViolations.length,
      byType,
      bySeverity,
      violations: allViolations,
    });
  }

  if (jsonFlag) {
    console.log(JSON.stringify(reports, null, 2));
  } else {
    // Generate markdown report
    const markdown = generateMarkdown(reports);

    // Ensure docs dir exists
    try {
      readdirSync(DOCS_DIR);
    } catch {
      mkdirSync(DOCS_DIR, { recursive: true });
    }

    writeFileSync(REPORT_PATH, markdown, "utf-8");
    console.error(`\nReport written to: docs/token-violations-report.md`);

    // Print summary to stdout
    console.log("\n=== Token Audit Summary ===\n");
    const total = reports.reduce((s, r) => s + r.totalViolations, 0);
    console.log(`Total violations: ${total}`);
    console.log(`Apps scanned: ${reports.length}`);
    console.log("");

    for (const r of reports.sort((a, b) => b.totalViolations - a.totalViolations)) {
      if (r.totalViolations > 0) {
        const types = Object.entries(r.byType)
          .map(([k, v]) => `${k}:${v}`)
          .join(", ");
        console.log(`  ${r.app.padEnd(28)} ${String(r.totalViolations).padStart(4)} violations  (${types})`);
      }
    }

    const zeroApps = reports.filter((r) => r.totalViolations === 0);
    if (zeroApps.length > 0) {
      console.log(`\n  ${zeroApps.length} app(s) with zero violations: ${zeroApps.map((r) => r.app).join(", ")}`);
    }
  }
}

main();
