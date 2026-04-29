import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn().mockResolvedValue({
    user: { id: "admin", email: "admin@example.com" },
    permission: "admin",
  }),
}));

// Subscription state used by getFeatureFlagValue's tier resolution
let subscriptionRow: { tier: string; status: string } | null = null;

// In-memory feature_flags store
type Row = {
  id: string;
  key: string;
  user_id: string | null;
  tier: string | null;
  enabled: boolean;
};
let store: Row[] = [];
let nextId = 1;

function makeBuilder(filters: Array<(r: Row) => boolean> = []) {
  const apply = () => store.filter((r) => filters.every((f) => f(r)));
  return {
    select(_cols?: string) {
      void _cols;
      return makeBuilder(filters);
    },
    eq(col: keyof Row, val: unknown) {
      return makeBuilder([...filters, (r) => r[col] === val]);
    },
    is(col: keyof Row, val: unknown) {
      return makeBuilder([...filters, (r) => r[col] === val]);
    },
    async maybeSingle<T>() {
      const found = apply()[0];
      return { data: (found as T) ?? null, error: null };
    },
    async single<T>() {
      const found = apply()[0];
      return { data: (found as T) ?? null, error: null };
    },
    order() {
      return makeBuilder(filters);
    },
    then(onfulfilled?: (v: { data: Row[]; error: null }) => unknown) {
      const result = { data: apply(), error: null };
      return Promise.resolve(result).then(onfulfilled);
    },
  } as Record<string, unknown>;
}

const mockDb = {
  from(table: string) {
    if (table === "subscriptions") {
      return {
        select() {
          return {
            eq() {
              return {
                async single() {
                  return { data: subscriptionRow, error: null };
                },
              };
            },
          };
        },
      };
    }
    if (table !== "feature_flags") {
      throw new Error(`unexpected table ${table}`);
    }
    return {
      select(cols?: string) {
        return (makeBuilder() as { select: (c?: string) => unknown }).select(cols);
      },
      async insert(row: Omit<Row, "id">) {
        const newRow: Row = {
          id: `row-${nextId++}`,
          key: row.key,
          user_id: row.user_id ?? null,
          tier: row.tier ?? null,
          enabled: row.enabled,
        };
        store.push(newRow);
        return { error: null };
      },
      update(patch: Partial<Row>) {
        return {
          eq(col: keyof Row, val: unknown) {
            store = store.map((r) =>
              r[col] === val ? { ...r, ...patch } : r,
            );
            return Promise.resolve({ error: null });
          },
        };
      },
      delete() {
        return {
          eq(col: keyof Row, val: unknown) {
            store = store.filter((r) => r[col] !== val);
            return Promise.resolve({ error: null });
          },
        };
      },
      async upsert(
        row: Omit<Row, "id">,
        opts?: { onConflict: string },
      ) {
        void opts;
        const existing = store.find(
          (r) =>
            r.key === row.key &&
            r.user_id === (row.user_id ?? null) &&
            r.tier === (row.tier ?? null),
        );
        if (existing) {
          existing.enabled = row.enabled;
        } else {
          store.push({
            id: `row-${nextId++}`,
            key: row.key,
            user_id: row.user_id ?? null,
            tier: row.tier ?? null,
            enabled: row.enabled,
          });
        }
        return { error: null };
      },
    };
  },
  auth: {
    admin: {
      async listUsers() {
        return {
          data: { users: [{ id: "user-found", email: "found@example.com" }] },
        };
      },
      async getUserById(id: string) {
        return { data: { user: { id, email: "found@example.com" } } };
      },
    },
  },
};

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => mockDb,
}));

import {
  setGlobalFlag,
  setTierDefault,
  addUserOverride,
  removeOverride,
} from "../lib/actions";
import { getFeatureFlagValue } from "@repo/billing";

beforeEach(() => {
  store = [];
  nextId = 1;
  subscriptionRow = null;
  vi.clearAllMocks();
});

describe("cc-flags server actions integration", () => {
  it("setGlobalFlag inserts a global row, then getFeatureFlagValue reflects it", async () => {
    const result = await setGlobalFlag("test_flag", true);
    expect(result).toEqual({ ok: true });
    expect(store).toHaveLength(1);
    expect(store[0]).toMatchObject({
      key: "test_flag",
      user_id: null,
      tier: null,
      enabled: true,
    });

    const value = await getFeatureFlagValue("anyone", "test_flag");
    expect(value).toBe(true);
  });

  it("setGlobalFlag toggles an existing row in place", async () => {
    await setGlobalFlag("test_flag", true);
    await setGlobalFlag("test_flag", false);
    expect(store).toHaveLength(1);
    expect(store[0].enabled).toBe(false);
    const value = await getFeatureFlagValue("anyone", "test_flag");
    expect(value).toBe(false);
  });

  it("setTierDefault writes a tier row that beats global default", async () => {
    await setGlobalFlag("test_flag", false);
    await setTierDefault("test_flag", "pro", true);

    subscriptionRow = { tier: "pro", status: "active" };
    expect(await getFeatureFlagValue("user-1", "test_flag")).toBe(true);
  });

  it("addUserOverride beats both tier and global", async () => {
    await setGlobalFlag("test_flag", false);
    await setTierDefault("test_flag", "pro", false);
    await addUserOverride("test_flag", "found@example.com", true);

    subscriptionRow = { tier: "pro", status: "active" };
    expect(await getFeatureFlagValue("user-found", "test_flag")).toBe(true);
  });

  it("addUserOverride returns error when email is unknown", async () => {
    const result = await addUserOverride(
      "test_flag",
      "ghost@example.com",
      true,
    );
    expect(result).toEqual({ ok: false, error: "user not found" });
  });

  it("removeOverride accepts a valid uuid and deletes the row", async () => {
    const validUuid = "11111111-1111-4111-8111-111111111111";
    store.push({
      id: validUuid,
      key: "test_flag",
      user_id: "user-found",
      tier: null,
      enabled: true,
    });
    const result = await removeOverride(validUuid);
    expect(result).toEqual({ ok: true });
    expect(store).toHaveLength(0);
  });

  it("removeOverride rejects non-uuid ids via zod", async () => {
    const result = await removeOverride("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "invalid id" });
  });
});
