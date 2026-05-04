// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

interface TargetRow {
  id: string;
  user_id: string;
  name: string;
  api_host: string;
  chatflow_id: string;
  base_trace_url: string | null;
  default_tag: string | null;
  prompt_template: string | null;
  streaming: boolean;
  api_token_encrypted: string | null;
  api_token_key_id: string | null;
  createdAt: string;
  updatedAt: string;
}

const SAFE_COLUMNS = new Set([
  "id",
  "user_id",
  "name",
  "api_host",
  "chatflow_id",
  "base_trace_url",
  "default_tag",
  "prompt_template",
  "streaming",
  "createdAt",
  "updatedAt",
]);

class FakeSupabase {
  rows: TargetRow[] = [];
  // simulated pgsodium behaviour: deterministic-ish encrypted shape per (uid, plaintext, key_id)
  async rpc(name: string, args: Record<string, unknown>) {
    if (name === "ai_eval_encrypt_target_token") {
      const data = `enc(${args.p_user_id}|${args.p_plaintext}|${args.p_key_id})`;
      return { data, error: null };
    }
    if (name === "ai_eval_decrypt_target_token") {
      const ct = String(args.p_ciphertext);
      const m = ct.match(/^enc\(([^|]+)\|(.*)\|([^|]+)\)$/);
      if (!m) return { data: null, error: { message: "decrypt failed" } };
      if (m[1] !== String(args.p_user_id) || m[3] !== String(args.p_key_id)) {
        return { data: null, error: { message: "auth fail" } };
      }
      return { data: m[2], error: null };
    }
    return { data: null, error: { message: `unhandled rpc ${name}` } };
  }

  from(table: string) {
    if (table !== "chatflow_targets") {
      throw new Error(`unexpected table ${table}`);
    }
    return new TableQuery(this);
  }
}

class TableQuery {
  private op: "select" | "insert" | "update" | "delete" = "select";
  private filters: Array<{ k: string; v: unknown }> = [];
  private orderField: string | null = null;
  private orderAsc = true;
  private payload: Record<string, unknown> | null = null;
  private projectionColumns: string[] | null = null;
  private limit1Mode: "single" | "maybeSingle" | null = null;

  constructor(private supa: FakeSupabase) {}

  select(cols: string) {
    if (cols.trim() === "*") {
      this.projectionColumns = null;
    } else {
      this.projectionColumns = cols
        .split(",")
        .map((c) => c.trim().replace(/^"|"$/g, ""));
    }
    return this;
  }
  insert(payload: Record<string, unknown>) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: Record<string, unknown>) {
    this.op = "update";
    this.payload = payload;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(k: string, v: unknown) {
    this.filters.push({ k, v });
    return this;
  }
  order(field: string, opts?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }
  single() {
    this.limit1Mode = "single";
    return this.execute();
  }
  maybeSingle() {
    this.limit1Mode = "maybeSingle";
    return this.execute();
  }
  then<T>(
    onFulfilled?: (
      v: { data: unknown; error: unknown },
    ) => T | PromiseLike<T>,
    onRejected?: (reason: unknown) => T | PromiseLike<T>,
  ): Promise<T> {
    return this.execute().then(onFulfilled, onRejected);
  }

  private project(row: TargetRow): Record<string, unknown> {
    if (!this.projectionColumns) return { ...row };
    const out: Record<string, unknown> = {};
    for (const col of this.projectionColumns) {
      out[col] = (row as unknown as Record<string, unknown>)[col];
    }
    return out;
  }

  private matches(row: TargetRow): boolean {
    return this.filters.every(
      (f) => (row as unknown as Record<string, unknown>)[f.k] === f.v,
    );
  }

  private async execute(): Promise<{ data: unknown; error: unknown }> {
    if (this.op === "insert") {
      const payload = this.payload!;
      const now = new Date().toISOString();
      const row: TargetRow = {
        id: crypto.randomUUID(),
        user_id: String(payload.user_id),
        name: String(payload.name),
        api_host: String(payload.api_host),
        chatflow_id: String(payload.chatflow_id),
        base_trace_url:
          (payload.base_trace_url as string | null | undefined) ?? null,
        default_tag: (payload.default_tag as string | null | undefined) ?? null,
        prompt_template:
          (payload.prompt_template as string | null | undefined) ?? null,
        streaming: Boolean(payload.streaming),
        api_token_encrypted:
          (payload.api_token_encrypted as string | null | undefined) ?? null,
        api_token_key_id:
          (payload.api_token_key_id as string | null | undefined) ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.supa.rows.push(row);
      const projected = this.project(row);
      if (this.limit1Mode) return { data: projected, error: null };
      return { data: [projected], error: null };
    }

    if (this.op === "update") {
      const matched = this.supa.rows.filter((r) => this.matches(r));
      const payload = this.payload!;
      for (const r of matched) {
        for (const k of Object.keys(payload)) {
          (r as unknown as Record<string, unknown>)[k] = payload[k];
        }
        r.updatedAt = new Date().toISOString();
      }
      if (matched.length === 0 && this.limit1Mode === "single") {
        return { data: null, error: { message: "no rows" } };
      }
      const projected = matched.map((r) => this.project(r));
      if (this.limit1Mode === "single")
        return { data: projected[0], error: null };
      if (this.limit1Mode === "maybeSingle")
        return { data: projected[0] ?? null, error: null };
      return { data: projected, error: null };
    }

    if (this.op === "delete") {
      const before = this.supa.rows.length;
      this.supa.rows = this.supa.rows.filter((r) => !this.matches(r));
      const removed = before - this.supa.rows.length;
      return { data: { count: removed }, error: null };
    }

    // select
    let rows = this.supa.rows.filter((r) => this.matches(r));
    if (this.orderField) {
      const f = this.orderField as keyof TargetRow;
      const asc = this.orderAsc;
      rows = [...rows].sort((a, b) => {
        const av = a[f] as unknown as string;
        const bv = b[f] as unknown as string;
        if (av === bv) return 0;
        return (av < bv ? -1 : 1) * (asc ? 1 : -1);
      });
    }
    const projected = rows.map((r) => this.project(r));
    if (this.limit1Mode === "single") {
      if (projected.length === 0) {
        return { data: null, error: { message: "no rows" } };
      }
      return { data: projected[0], error: null };
    }
    if (this.limit1Mode === "maybeSingle") {
      return { data: projected[0] ?? null, error: null };
    }
    return { data: projected, error: null };
  }
}

let fake: FakeSupabase;

beforeEach(async () => {
  process.env.PGSODIUM_KEY_ID = "test-key-id";
  fake = new FakeSupabase();
  const mod = await import("../target-store");
  mod.__setClientFactoryForTesting(() => fake as unknown as never);
});

describe("target-store", () => {
  it("createTarget encrypts api_token and projects safe columns", async () => {
    const { createTarget } = await import("../target-store");
    const out = await createTarget("user-A", {
      name: "Local",
      api_host: "https://flowise.example.com",
      chatflow_id: "cf-1",
      api_token: "secret-1",
      base_trace_url: "https://lf.example.com",
      default_tag: "eval",
      streaming: false,
    });
    expect(Object.keys(out).sort()).toEqual(
      [
        "api_host",
        "base_trace_url",
        "chatflow_id",
        "createdAt",
        "default_tag",
        "id",
        "name",
        "prompt_template",
        "streaming",
        "updatedAt",
        "user_id",
      ].sort(),
    );
    expect(out).not.toHaveProperty("api_token");
    expect(out).not.toHaveProperty("api_token_encrypted");
    expect(out).not.toHaveProperty("api_token_key_id");
    const stored = fake.rows[0];
    expect(stored.api_token_encrypted).toBe(
      "enc(user-A|secret-1|test-key-id)",
    );
    expect(stored.api_token_key_id).toBe("test-key-id");
  });

  it("decryptTokenForOutboundCall round-trips the original plaintext", async () => {
    const { createTarget, decryptTokenForOutboundCall } = await import(
      "../target-store"
    );
    const t = await createTarget("user-A", {
      name: "Round-trip",
      api_host: "https://flowise.example.com",
      chatflow_id: "cf-1",
      api_token: "rt-secret",
    });
    const decrypted = await decryptTokenForOutboundCall("user-A", t.id);
    expect(decrypted).toBe("rt-secret");
  });

  it("listTargets / getTarget never include api_token_encrypted in output", async () => {
    const { createTarget, listTargets, getTarget } = await import(
      "../target-store"
    );
    await createTarget("user-A", {
      name: "Hidden",
      api_host: "https://flowise.example.com",
      chatflow_id: "cf-1",
      api_token: "shh",
    });
    const list = await listTargets("user-A");
    expect(list).toHaveLength(1);
    expect(list[0]).not.toHaveProperty("api_token_encrypted");
    expect(list[0]).not.toHaveProperty("api_token_key_id");

    const single = await getTarget("user-A", list[0].id);
    expect(single).not.toBeNull();
    expect(single).not.toHaveProperty("api_token_encrypted");
    expect(single).not.toHaveProperty("api_token_key_id");
  });

  it("cross-user fetch returns null / empty list", async () => {
    const { createTarget, getTarget, listTargets, decryptTokenForOutboundCall } =
      await import("../target-store");
    const t = await createTarget("user-A", {
      name: "OwnedByA",
      api_host: "https://flowise.example.com",
      chatflow_id: "cf-1",
      api_token: "private",
    });
    expect(await getTarget("user-B", t.id)).toBeNull();
    expect(await listTargets("user-B")).toEqual([]);
    await expect(
      decryptTokenForOutboundCall("user-B", t.id),
    ).rejects.toThrow();
  });

  it("updateTarget without api_token leaves the encrypted column byte-equal", async () => {
    const { createTarget, updateTarget } = await import("../target-store");
    const t = await createTarget("user-A", {
      name: "Before",
      api_host: "https://flowise.example.com",
      chatflow_id: "cf-1",
      api_token: "do-not-rotate",
    });
    const beforeBytes = fake.rows[0].api_token_encrypted;
    const beforeKey = fake.rows[0].api_token_key_id;

    await updateTarget("user-A", t.id, {
      name: "After",
      api_host: "https://flowise.example.com",
      chatflow_id: "cf-1",
    });

    expect(fake.rows[0].name).toBe("After");
    expect(fake.rows[0].api_token_encrypted).toBe(beforeBytes);
    expect(fake.rows[0].api_token_key_id).toBe(beforeKey);
  });

  it("updateTarget with api_token rotates encrypted column and decrypts to new value", async () => {
    const { createTarget, updateTarget, decryptTokenForOutboundCall } =
      await import("../target-store");
    const t = await createTarget("user-A", {
      name: "Old",
      api_host: "https://flowise.example.com",
      chatflow_id: "cf-1",
      api_token: "v1",
    });
    const before = fake.rows[0].api_token_encrypted;

    await updateTarget("user-A", t.id, { api_token: "v2" });
    const after = fake.rows[0].api_token_encrypted;
    expect(after).not.toBe(before);
    expect(await decryptTokenForOutboundCall("user-A", t.id)).toBe("v2");
  });

  it("deleteTarget removes only rows owned by the user", async () => {
    const { createTarget, deleteTarget, getTarget } = await import(
      "../target-store"
    );
    const ownA = await createTarget("user-A", {
      name: "A",
      api_host: "https://flowise.example.com",
      chatflow_id: "cf-1",
      api_token: "a",
    });
    await createTarget("user-B", {
      name: "B",
      api_host: "https://flowise.example.com",
      chatflow_id: "cf-2",
      api_token: "b",
    });

    await deleteTarget("user-B", ownA.id); // wrong user — should be a no-op
    expect(await getTarget("user-A", ownA.id)).not.toBeNull();

    await deleteTarget("user-A", ownA.id);
    expect(await getTarget("user-A", ownA.id)).toBeNull();
    expect(fake.rows).toHaveLength(1);
  });
});
