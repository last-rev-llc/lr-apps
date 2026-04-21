import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SCRIPT_SRC = resolve(SCRIPT_DIR, "..", "check-claude-md-lib-sync.ts");

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

function setupFixture(libFiles: string[], claudeMd: string): string {
  const root = mkdtempSync(join(tmpdir(), "claude-lib-sync-"));
  const libDir = join(root, "apps/web/lib");
  const scriptsDir = join(root, "scripts");
  mkdirSync(libDir, { recursive: true });
  mkdirSync(scriptsDir, { recursive: true });

  for (const f of libFiles) {
    writeFileSync(join(libDir, f), "// stub\n");
  }
  writeFileSync(join(root, "CLAUDE.md"), claudeMd);
  copyFileSync(SCRIPT_SRC, join(scriptsDir, "check-claude-md-lib-sync.ts"));

  return root;
}

function runScript(root: string): RunResult {
  try {
    const stdout = execFileSync(
      "node",
      ["--experimental-strip-types", "scripts/check-claude-md-lib-sync.ts"],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { status: 0, stdout, stderr: "" };
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: Buffer | string; stderr?: Buffer | string };
    return {
      status: err.status ?? 1,
      stdout: err.stdout?.toString() ?? "",
      stderr: err.stderr?.toString() ?? "",
    };
  }
}

const MARKER_BLOCK = (lines: string[]) =>
  `<!-- lib-listing:start -->\n${lines.map((l) => `- \`${l}\``).join("\n")}\n<!-- lib-listing:end -->\n`;

let cleanupDirs: string[] = [];

beforeEach(() => {
  cleanupDirs = [];
});

afterEach(() => {
  for (const d of cleanupDirs) {
    rmSync(d, { recursive: true, force: true });
  }
});

describe("check-claude-md-lib-sync", () => {
  it("exits 0 when CLAUDE.md listing matches the filesystem", () => {
    const root = setupFixture(
      ["alpha.ts", "beta.ts"],
      `# CLAUDE.md\n\n${MARKER_BLOCK(["alpha.ts", "beta.ts"])}`,
    );
    cleanupDirs.push(root);
    const r = runScript(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/in sync/i);
  });

  it("exits 1 and names files present in fs but missing from docs", () => {
    const root = setupFixture(
      ["alpha.ts", "beta.ts", "gamma.ts"],
      `# CLAUDE.md\n\n${MARKER_BLOCK(["alpha.ts", "beta.ts"])}`,
    );
    cleanupDirs.push(root);
    const r = runScript(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/gamma\.ts/);
    expect(r.stderr).toMatch(/missing from CLAUDE\.md/i);
  });

  it("exits 1 and names files in docs but missing from fs", () => {
    const root = setupFixture(
      ["alpha.ts"],
      `# CLAUDE.md\n\n${MARKER_BLOCK(["alpha.ts", "ghost.ts"])}`,
    );
    cleanupDirs.push(root);
    const r = runScript(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/ghost\.ts/);
    expect(r.stderr).toMatch(/missing from apps\/web\/lib/i);
  });

  it("exits 1 with a clear error when the markers are missing", () => {
    const root = setupFixture(
      ["alpha.ts"],
      `# CLAUDE.md\n\nNo markers here.\n`,
    );
    cleanupDirs.push(root);
    const r = runScript(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/lib-listing markers/i);
  });
});
