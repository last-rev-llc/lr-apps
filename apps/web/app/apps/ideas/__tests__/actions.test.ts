import { describe, it, expect, vi, beforeEach } from "vitest";

const { TEST_USER_ID, OTHER_USER_ID } = vi.hoisted(() => ({
  TEST_USER_ID: "11111111-1111-4111-8111-111111111111",
  OTHER_USER_ID: "22222222-2222-4222-8222-222222222222",
}));

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn().mockResolvedValue({
    user: { id: TEST_USER_ID, email: "user@example.com" },
    permission: "view",
  }),
}));

type Row = Record<string, unknown> & { id: string; user_id: string };
let store: Row[] = [];
let nextId = 1;

const SAMPLE_UUID = "33333333-3333-4333-8333-333333333333";
const SECOND_UUID = "44444444-4444-4444-8444-444444444444";

function uuid(): string {
  return `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`;
}

function makeBuilder(filters: Array<(r: Row) => boolean> = []) {
  const apply = () => store.filter((r) => filters.every((f) => f(r)));
  const builder: Record<string, unknown> = {
    select(_cols?: string) {
      void _cols;
      return makeBuilder(filters);
    },
    eq(col: string, val: unknown) {
      return makeBuilder([...filters, (r) => r[col] === val]);
    },
    order() {
      return makeBuilder(filters);
    },
    async single() {
      const found = apply()[0];
      if (!found) return { data: null, error: { message: "not found" } };
      return { data: found, error: null };
    },
    async maybeSingle() {
      return { data: apply()[0] ?? null, error: null };
    },
  };
  return builder;
}

const mockDb = {
  from(table: string) {
    if (table !== "ideas") {
      throw new Error(`unexpected table ${table}`);
    }
    return {
      select(cols?: string) {
        return (
          makeBuilder() as { select: (c?: string) => unknown }
        ).select(cols);
      },
      insert(row: Record<string, unknown>) {
        const newRow: Row = {
          id: uuid(),
          user_id: row.user_id as string,
          ...row,
        };
        store.push(newRow);
        return {
          select: () => ({
            async single() {
              return { data: newRow, error: null };
            },
          }),
        };
      },
      update(patch: Record<string, unknown>) {
        const filters: Array<(r: Row) => boolean> = [];
        const chain: Record<string, unknown> = {
          eq(col: string, val: unknown) {
            filters.push((r) => r[col] === val);
            return chain;
          },
          select() {
            return {
              async single() {
                const found = store.find((r) =>
                  filters.every((f) => f(r)),
                );
                if (!found)
                  return { data: null, error: { message: "not found" } };
                Object.assign(found, patch);
                return { data: found, error: null };
              },
            };
          },
        };
        return chain;
      },
    };
  },
};

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(async () => mockDb),
}));

import {
  createIdea,
  updateIdea,
  setIdeaStatus,
} from "../actions";
import { createClient } from "@repo/db/server";

beforeEach(() => {
  store = [];
  nextId = 1;
  vi.clearAllMocks();
});

describe("ideas server actions", () => {
  describe("createIdea", () => {
    it("creates an idea with default status='new' and source='manual'", async () => {
      const result = await createIdea({
        title: "Build dashboard",
        description: "An AI dashboard",
      });
      expect(result.ok).toBe(true);
      expect(store).toHaveLength(1);
      expect(store[0]).toMatchObject({
        user_id: TEST_USER_ID,
        title: "Build dashboard",
        status: "new",
        source: "manual",
        tags: [],
      });
      expect(createClient).toHaveBeenCalled();
    });

    it("uses session user_id, never input user_id", async () => {
      // Even if a malicious caller bundles user_id, the strict zod schema rejects it.
      const result = await createIdea({
        title: "Hijack",
        // @ts-expect-error — extra key must be rejected
        user_id: OTHER_USER_ID,
      });
      expect(result).toEqual({ ok: false, error: "invalid input" });
      expect(store).toHaveLength(0);
    });

    it("rejects empty title", async () => {
      const result = await createIdea({ title: "" });
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("rejects oversized title", async () => {
      const result = await createIdea({ title: "x".repeat(201) });
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("accepts a custom source and applies it", async () => {
      const result = await createIdea({
        title: "Community pick",
        source: "community",
      });
      expect(result.ok).toBe(true);
      expect(store[0]).toMatchObject({ source: "community" });
    });
  });

  describe("updateIdea", () => {
    function seed(extra: Partial<Row> = {}): string {
      const id = SAMPLE_UUID;
      store.push({
        id,
        user_id: TEST_USER_ID,
        title: "Existing",
        feasibility: 5,
        impact: 5,
        effort: "Low",
        compositeScore: 10,
        ...extra,
      });
      return id;
    }

    it("recomputes compositeScore when feasibility changes", async () => {
      const id = seed();
      const result = await updateIdea(id, { feasibility: 10 });
      expect(result.ok).toBe(true);
      // (10 + 5) / 1 = 15
      expect(store[0].compositeScore).toBe(15);
    });

    it("recomputes compositeScore when effort changes", async () => {
      const id = seed();
      const result = await updateIdea(id, { effort: "High" });
      expect(result.ok).toBe(true);
      // (5 + 5) / 3 ≈ 3.33
      const score = store[0].compositeScore as number;
      expect(score).toBeCloseTo(10 / 3, 5);
    });

    it("does NOT touch compositeScore when only title changes", async () => {
      const id = seed();
      const result = await updateIdea(id, { title: "Renamed" });
      expect(result.ok).toBe(true);
      expect(store[0].title).toBe("Renamed");
      expect(store[0].compositeScore).toBe(10);
    });

    it("rejects unknown effort values via zod", async () => {
      const id = seed();
      const result = await updateIdea(id, {
        // @ts-expect-error — invalid enum
        effort: "Trivial",
      });
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("rejects extra keys (e.g. user_id) via strict()", async () => {
      const id = seed();
      const result = await updateIdea(id, {
        // @ts-expect-error — extra key
        user_id: OTHER_USER_ID,
        title: "Hijack",
      });
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("rejects an invalid UUID id", async () => {
      const result = await updateIdea("not-a-uuid", { title: "x" });
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });
  });

  describe("setIdeaStatus", () => {
    function seed(status: string = "new", completedAt: unknown = null): string {
      const id = SECOND_UUID;
      store.push({
        id,
        user_id: TEST_USER_ID,
        title: "Existing",
        status,
        completedAt,
      });
      return id;
    }

    it("sets completedAt when transitioning to 'completed'", async () => {
      const id = seed("in-progress");
      const result = await setIdeaStatus(id, "completed");
      expect(result.ok).toBe(true);
      expect(store[0].status).toBe("completed");
      expect(typeof store[0].completedAt).toBe("string");
    });

    it("clears completedAt when transitioning away from 'completed'", async () => {
      const id = seed("completed", "2026-01-01T00:00:00.000Z");
      const result = await setIdeaStatus(id, "archived");
      expect(result.ok).toBe(true);
      expect(store[0].status).toBe("archived");
      expect(store[0].completedAt).toBeNull();
    });

    it("rejects an invalid status value", async () => {
      const id = seed();
      const result = await setIdeaStatus(id, "wishful");
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("rejects an invalid UUID id", async () => {
      const result = await setIdeaStatus("not-a-uuid", "completed");
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });
  });
});
