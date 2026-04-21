#!/usr/bin/env node
// Verifies the apps/web/lib/ filesystem listing in CLAUDE.md matches reality.
// Run via: node --experimental-strip-types scripts/check-claude-md-lib-sync.ts
// See CLAUDE.md "Maintenance" section for the rule this enforces.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const LIB_DIR = join(REPO_ROOT, "apps/web/lib");
const CLAUDE_MD = join(REPO_ROOT, "CLAUDE.md");

const MARKER_START = "<!-- lib-listing:start -->";
const MARKER_END = "<!-- lib-listing:end -->";

function readFsLib(): string[] {
  const entries = readdirSync(LIB_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();
}

function readDocsLib(): string[] {
  const md = readFileSync(CLAUDE_MD, "utf8");
  const startIdx = md.indexOf(MARKER_START);
  const endIdx = md.indexOf(MARKER_END);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error(
      `ERROR: CLAUDE.md is missing the lib-listing markers.\n` +
        `Expected to find ${MARKER_START} ... ${MARKER_END} delimiting the listing.`,
    );
    process.exit(1);
  }
  const block = md.slice(startIdx + MARKER_START.length, endIdx);
  const lineRe = /^- `([^`]+)`/gm;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(block)) !== null) {
    names.push(m[1]);
  }
  return names.sort();
}

function diff(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return a.filter((x) => !set.has(x));
}

const fsList = readFsLib();
const docsList = readDocsLib();

const onlyInFs = diff(fsList, docsList);
const onlyInDocs = diff(docsList, fsList);

if (onlyInFs.length === 0 && onlyInDocs.length === 0) {
  console.log("CLAUDE.md lib listing is in sync with apps/web/lib/.");
  process.exit(0);
}

console.error("CLAUDE.md lib listing is out of sync with apps/web/lib/.\n");
if (onlyInFs.length > 0) {
  console.error("Files present in apps/web/lib/ but missing from CLAUDE.md:");
  for (const f of onlyInFs) console.error(`  - ${f}`);
  console.error("");
}
if (onlyInDocs.length > 0) {
  console.error("Files listed in CLAUDE.md but missing from apps/web/lib/:");
  for (const f of onlyInDocs) console.error(`  - ${f}`);
  console.error("");
}
console.error(
  `Update the listing between ${MARKER_START} and ${MARKER_END} in CLAUDE.md.`,
);
process.exit(1);
