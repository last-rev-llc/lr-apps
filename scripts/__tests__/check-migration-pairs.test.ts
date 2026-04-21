import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SCRIPT_SRC = resolve(SCRIPT_DIR, "..", "check-migration-pairs.ts");

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

function setupFixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "migration-pairs-"));
  const migrationsDir = join(root, "supabase/migrations");
  const scriptsDir = join(root, "scripts");
  mkdirSync(migrationsDir, { recursive: true });
  mkdirSync(scriptsDir, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(migrationsDir, name), body);
  }
  copyFileSync(SCRIPT_SRC, join(scriptsDir, "check-migration-pairs.ts"));
  return root;
}

function runScript(root: string): RunResult {
  try {
    const stdout = execFileSync(
      "node",
      ["--experimental-strip-types", "scripts/check-migration-pairs.ts"],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { status: 0, stdout, stderr: "" };
  } catch (e: unknown) {
    const err = e as {
      status?: number;
      stdout?: Buffer | string;
      stderr?: Buffer | string;
    };
    return {
      status: err.status ?? 1,
      stdout: err.stdout?.toString() ?? "",
      stderr: err.stderr?.toString() ?? "",
    };
  }
}

let cleanupDirs: string[] = [];
beforeEach(() => {
  cleanupDirs = [];
});
afterEach(() => {
  for (const d of cleanupDirs) {
    rmSync(d, { recursive: true, force: true });
  }
});

describe("check-migration-pairs", () => {
  it("exits 0 when every up file has a matching .down.sql", () => {
    const root = setupFixture({
      "001_a.sql": "create table a();",
      "001_a.down.sql": "drop table if exists a;",
      "002_b.sql": "create table b();",
      "002_b.down.sql": "drop table if exists b;",
    });
    cleanupDirs.push(root);
    const r = runScript(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/all paired/i);
  });

  it("exits 1 and lists ups missing a paired down", () => {
    const root = setupFixture({
      "001_a.sql": "create table a();",
      "001_a.down.sql": "drop table if exists a;",
      "002_b.sql": "create table b();",
    });
    cleanupDirs.push(root);
    const r = runScript(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/002_b\.sql/);
    expect(r.stderr).toMatch(/002_b\.down\.sql/);
  });

  it("exits 1 and lists orphan down files", () => {
    const root = setupFixture({
      "001_a.sql": "create table a();",
      "001_a.down.sql": "drop table if exists a;",
      "stray.down.sql": "drop table if exists nope;",
    });
    cleanupDirs.push(root);
    const r = runScript(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/stray\.down\.sql/i);
    expect(r.stderr).toMatch(/orphan/i);
  });

  it("treats date-prefixed names the same as numeric ones", () => {
    const root = setupFixture({
      "20260101_x.sql": "create table x();",
      "20260101_x.down.sql": "drop table if exists x;",
    });
    cleanupDirs.push(root);
    const r = runScript(root);
    expect(r.status).toBe(0);
  });
});
