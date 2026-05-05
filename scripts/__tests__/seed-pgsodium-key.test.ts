import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PGSODIUM_KEY_NAME,
  parseFlags,
  seed,
  type SqlExecutor,
} from "../seed-pgsodium-key.ts";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeExecutor(responses: string[][]): {
  exec: SqlExecutor;
  calls: string[];
} {
  const calls: string[] = [];
  const queue = [...responses];
  const exec: SqlExecutor = vi.fn(async (sql: string) => {
    calls.push(sql);
    const next = queue.shift();
    if (!next) {
      throw new Error(`Unexpected query in test: ${sql}`);
    }
    return next;
  });
  return { exec, calls };
}

describe("parseFlags", () => {
  it("defaults dryRun to false", () => {
    expect(parseFlags([])).toEqual({ dryRun: false });
  });

  it("recognises --dryRun and --dry-run", () => {
    expect(parseFlags(["--dryRun"])).toEqual({ dryRun: true });
    expect(parseFlags(["--dry-run"])).toEqual({ dryRun: true });
  });
});

describe("seed-pgsodium-key", () => {
  it("returns the existing key id when one is already provisioned", async () => {
    const existingId = "11111111-1111-1111-1111-111111111111";
    const { exec, calls } = makeExecutor([[existingId]]);

    const result = await seed({ dryRun: false }, exec);

    expect(result).toEqual({
      keyId: existingId,
      created: false,
      dryRun: false,
    });
    // Only the lookup query runs — no create call when one already exists.
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("from pgsodium.key");
    expect(calls[0]).toContain(PGSODIUM_KEY_NAME);
  });

  it("creates a new key and returns its id when none exists", async () => {
    const newId = "22222222-2222-2222-2222-222222222222";
    const { exec, calls } = makeExecutor([[], [newId]]);

    const result = await seed({ dryRun: false }, exec);

    expect(result).toEqual({
      keyId: newId,
      created: true,
      dryRun: false,
    });
    expect(calls).toHaveLength(2);
    expect(calls[1]).toContain("pgsodium.create_key");
    expect(calls[1]).toContain(PGSODIUM_KEY_NAME);
  });

  it("does not create a key in dry-run mode when none exists", async () => {
    const { exec, calls } = makeExecutor([[]]);

    const result = await seed({ dryRun: true }, exec);

    expect(result.created).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.keyId).toBe("");
    // Only the lookup runs in dry-run mode.
    expect(calls).toHaveLength(1);
  });

  it("returns the existing id even in dry-run mode (no create needed)", async () => {
    const existingId = "33333333-3333-3333-3333-333333333333";
    const { exec, calls } = makeExecutor([[existingId]]);

    const result = await seed({ dryRun: true }, exec);

    expect(result.keyId).toBe(existingId);
    expect(result.created).toBe(false);
    expect(calls).toHaveLength(1);
  });

  it("throws a clear error when SUPABASE_DB_URL and DATABASE_URL are both missing", async () => {
    delete process.env.SUPABASE_DB_URL;
    delete process.env.DATABASE_URL;

    await expect(seed({ dryRun: false })).rejects.toThrow(
      /SUPABASE_DB_URL/,
    );
  });

  it("throws when create_key returns no rows", async () => {
    const { exec } = makeExecutor([[], []]);

    await expect(seed({ dryRun: false }, exec)).rejects.toThrow(
      /create_key returned no rows/,
    );
  });
});
