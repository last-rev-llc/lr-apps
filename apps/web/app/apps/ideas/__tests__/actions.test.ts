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
      delete() {
        const filters: Array<(r: Row) => boolean> = [];
        const chain: Record<string, unknown> & PromiseLike<{ error: null }> = {
          eq(col: string, val: unknown) {
            filters.push((r) => r[col] === val);
            return chain;
          },
          then(resolve: (value: { error: null }) => void) {
            store = store.filter((r) => !filters.every((f) => f(r)));
            resolve({ error: null });
          },
        } as Record<string, unknown> & PromiseLike<{ error: null }>;
        return chain;
      },
    };
  },
};

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(async () => mockDb),
}));

const hasFeatureAccessMock = vi.fn().mockResolvedValue(true);
vi.mock("@repo/billing", async () => {
  const actual = await vi.importActual<typeof import("@repo/billing")>(
    "@repo/billing",
  );
  return {
    ...actual,
    hasFeatureAccess: (...args: Parameters<typeof actual.hasFeatureAccess>) =>
      hasFeatureAccessMock(...args),
  };
});

const planIdeaMock = vi.fn();
vi.mock("../lib/ai-plan", async () => {
  const actual = await vi.importActual<typeof import("../lib/ai-plan")>(
    "../lib/ai-plan",
  );
  return {
    ...actual,
    planIdea: (...args: Parameters<typeof actual.planIdea>) =>
      planIdeaMock(...args),
  };
});

import {
  createIdea,
  updateIdea,
  setIdeaStatus,
  rateIdea,
  toggleHideIdea,
  snoozeIdea,
  archiveIdea,
  deleteIdea,
  planAndScoreIdea,
} from "../actions";
import { createClient } from "@repo/db/server";
import { FeatureAccessError } from "@repo/billing";
import { _resetRateLimitStore } from "@/lib/rate-limit";
import { RateLimitedError } from "../lib/errors";

beforeEach(() => {
  store = [];
  nextId = 1;
  vi.clearAllMocks();
  hasFeatureAccessMock.mockResolvedValue(true);
  planIdeaMock.mockResolvedValue({
    feasibility: 7,
    impact: 8,
    effort: "Medium",
    plan: "1. step one\n2. step two",
  });
  _resetRateLimitStore();
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

    it("does not update a row owned by another user", async () => {
      store.push({
        id: SAMPLE_UUID,
        user_id: OTHER_USER_ID,
        title: "Other's idea",
        feasibility: 1,
        impact: 1,
        effort: "Low",
        compositeScore: 2,
      });
      const result = await updateIdea(SAMPLE_UUID, { title: "Hijacked" });
      expect(result.ok).toBe(false);
      expect(store[0].title).toBe("Other's idea");
    });

    it("does not recompute compositeScore on a row owned by another user", async () => {
      store.push({
        id: SAMPLE_UUID,
        user_id: OTHER_USER_ID,
        title: "Other's idea",
        feasibility: 1,
        impact: 1,
        effort: "Low",
        compositeScore: 2,
      });
      const result = await updateIdea(SAMPLE_UUID, { feasibility: 9 });
      expect(result.ok).toBe(false);
      expect(store[0].feasibility).toBe(1);
      expect(store[0].compositeScore).toBe(2);
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

    it("clears completedAt when transitioning to a non-archived non-completed status", async () => {
      const id = seed("completed", "2026-01-01T00:00:00.000Z");
      const result = await setIdeaStatus(id, "in-progress");
      expect(result.ok).toBe(true);
      expect(store[0].status).toBe("in-progress");
      expect(store[0].completedAt).toBeNull();
    });

    it("preserves completedAt when archiving via setIdeaStatus (matches archiveIdea)", async () => {
      const id = seed("completed", "2026-01-01T00:00:00.000Z");
      const result = await setIdeaStatus(id, "archived");
      expect(result.ok).toBe(true);
      expect(store[0].status).toBe("archived");
      expect(store[0].completedAt).toBe("2026-01-01T00:00:00.000Z");
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

    it("does not change status on a row owned by another user", async () => {
      store.push({
        id: SECOND_UUID,
        user_id: OTHER_USER_ID,
        title: "Other's idea",
        status: "new",
        completedAt: null,
      });
      const result = await setIdeaStatus(SECOND_UUID, "completed");
      expect(result.ok).toBe(false);
      expect(store[0].status).toBe("new");
      expect(store[0].completedAt).toBeNull();
    });
  });

  describe("rateIdea", () => {
    function seed(rating: number | null = null): string {
      const id = SAMPLE_UUID;
      store.push({
        id,
        user_id: TEST_USER_ID,
        title: "Existing",
        rating,
      });
      return id;
    }

    it("sets rating when given a value 1-5", async () => {
      const id = seed();
      const result = await rateIdea(id, 4);
      expect(result.ok).toBe(true);
      expect(store[0].rating).toBe(4);
    });

    it("clears rating (stores null) when stars is 0", async () => {
      const id = seed(3);
      const result = await rateIdea(id, 0);
      expect(result.ok).toBe(true);
      expect(store[0].rating).toBeNull();
    });

    it("rejects rating > 5", async () => {
      const id = seed();
      const result = await rateIdea(id, 6);
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("rejects negative rating", async () => {
      const id = seed();
      const result = await rateIdea(id, -1);
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("rejects an invalid UUID id", async () => {
      const result = await rateIdea("not-a-uuid", 3);
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("does not update a row owned by another user", async () => {
      store.push({
        id: SAMPLE_UUID,
        user_id: OTHER_USER_ID,
        title: "Other's idea",
        rating: 1,
      });
      const result = await rateIdea(SAMPLE_UUID, 5);
      expect(result.ok).toBe(false);
      expect(store[0].rating).toBe(1);
    });
  });

  describe("toggleHideIdea", () => {
    function seed(hidden: boolean | null = null): string {
      const id = SAMPLE_UUID;
      store.push({
        id,
        user_id: TEST_USER_ID,
        title: "Existing",
        hidden,
      });
      return id;
    }

    it("flips hidden from false to true", async () => {
      const id = seed(false);
      const result = await toggleHideIdea(id);
      expect(result.ok).toBe(true);
      expect(store[0].hidden).toBe(true);
    });

    it("flips hidden from true to false", async () => {
      const id = seed(true);
      const result = await toggleHideIdea(id);
      expect(result.ok).toBe(true);
      expect(store[0].hidden).toBe(false);
    });

    it("treats null hidden as false (sets to true)", async () => {
      const id = seed(null);
      const result = await toggleHideIdea(id);
      expect(result.ok).toBe(true);
      expect(store[0].hidden).toBe(true);
    });

    it("rejects invalid UUID", async () => {
      const result = await toggleHideIdea("not-a-uuid");
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("returns not-found when idea belongs to another user", async () => {
      store.push({
        id: SAMPLE_UUID,
        user_id: OTHER_USER_ID,
        title: "Other's idea",
        hidden: false,
      });
      const result = await toggleHideIdea(SAMPLE_UUID);
      expect(result.ok).toBe(false);
      expect(store[0].hidden).toBe(false);
    });
  });

  describe("snoozeIdea", () => {
    function seed(snoozedUntil: string | null = null): string {
      const id = SAMPLE_UUID;
      store.push({
        id,
        user_id: TEST_USER_ID,
        title: "Existing",
        snoozedUntil,
      });
      return id;
    }

    it("sets snoozedUntil for '1d' duration", async () => {
      const id = seed();
      const before = Date.now();
      const result = await snoozeIdea(id, "1d");
      expect(result.ok).toBe(true);
      const until = new Date(store[0].snoozedUntil as string).getTime();
      expect(until).toBeGreaterThanOrEqual(before + 86_400_000 - 100);
      expect(until).toBeLessThanOrEqual(Date.now() + 86_400_000 + 100);
    });

    it("clears snoozedUntil when duration is null", async () => {
      const id = seed("2099-01-01T00:00:00.000Z");
      const result = await snoozeIdea(id, null);
      expect(result.ok).toBe(true);
      expect(store[0].snoozedUntil).toBeNull();
    });

    it("rejects unknown duration code", async () => {
      const id = seed();
      const result = await snoozeIdea(
        id,
        // @ts-expect-error — invalid enum
        "foo",
      );
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("rejects invalid UUID", async () => {
      const result = await snoozeIdea("not-a-uuid", "1d");
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("does not snooze a row owned by another user", async () => {
      store.push({
        id: SAMPLE_UUID,
        user_id: OTHER_USER_ID,
        title: "Other's idea",
        snoozedUntil: null,
      });
      const result = await snoozeIdea(SAMPLE_UUID, "1w");
      expect(result.ok).toBe(false);
      expect(store[0].snoozedUntil).toBeNull();
    });
  });

  describe("archiveIdea", () => {
    function seed(extra: Partial<Row> = {}): string {
      const id = SAMPLE_UUID;
      store.push({
        id,
        user_id: TEST_USER_ID,
        title: "Existing",
        status: "in-progress",
        completedAt: null,
        ...extra,
      });
      return id;
    }

    it("sets status to 'archived'", async () => {
      const id = seed();
      const result = await archiveIdea(id);
      expect(result.ok).toBe(true);
      expect(store[0].status).toBe("archived");
    });

    it("does not touch completedAt", async () => {
      const id = seed({
        status: "completed",
        completedAt: "2026-01-01T00:00:00.000Z",
      });
      const result = await archiveIdea(id);
      expect(result.ok).toBe(true);
      expect(store[0].status).toBe("archived");
      expect(store[0].completedAt).toBe("2026-01-01T00:00:00.000Z");
    });

    it("rejects invalid UUID", async () => {
      const result = await archiveIdea("not-a-uuid");
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });

    it("does not archive cross-user rows", async () => {
      store.push({
        id: SAMPLE_UUID,
        user_id: OTHER_USER_ID,
        title: "Other",
        status: "new",
      });
      const result = await archiveIdea(SAMPLE_UUID);
      expect(result.ok).toBe(false);
      expect(store[0].status).toBe("new");
    });
  });

  describe("deleteIdea", () => {
    it("deletes the row scoped by id and user_id", async () => {
      store.push({
        id: SAMPLE_UUID,
        user_id: TEST_USER_ID,
        title: "Mine",
      });
      const result = await deleteIdea(SAMPLE_UUID);
      expect(result).toEqual({ ok: true });
      expect(store).toHaveLength(0);
    });

    it("does not delete rows owned by another user", async () => {
      store.push({
        id: SAMPLE_UUID,
        user_id: OTHER_USER_ID,
        title: "Other",
      });
      const result = await deleteIdea(SAMPLE_UUID);
      // mock returns ok because no row matched scope; but the row remains
      expect(result.ok).toBe(true);
      expect(store).toHaveLength(1);
    });

    it("rejects invalid UUID", async () => {
      const result = await deleteIdea("not-a-uuid");
      expect(result).toEqual({ ok: false, error: "invalid input" });
    });
  });

  describe("planAndScoreIdea", () => {
    function seed(extra: Partial<Row> = {}): string {
      const id = SAMPLE_UUID;
      store.push({
        id,
        user_id: TEST_USER_ID,
        title: "Build dashboard",
        description: "An AI dashboard",
        category: "Product",
        feasibility: null,
        impact: null,
        effort: null,
        compositeScore: null,
        plan: null,
        planModel: null,
        planGeneratedAt: null,
        ...extra,
      });
      return id;
    }

    it("rejects invalid UUID", async () => {
      const result = await planAndScoreIdea("not-a-uuid");
      expect(result).toEqual({ ok: false, error: "invalid input" });
      expect(planIdeaMock).not.toHaveBeenCalled();
    });

    it("throws FeatureAccessError when feature gate denies", async () => {
      hasFeatureAccessMock.mockResolvedValueOnce(false);
      const id = seed();
      await expect(planAndScoreIdea(id)).rejects.toBeInstanceOf(
        FeatureAccessError,
      );
      expect(planIdeaMock).not.toHaveBeenCalled();
    });

    it("persists feasibility, impact, effort, compositeScore, plan, planModel, planGeneratedAt", async () => {
      const id = seed();
      const result = await planAndScoreIdea(id);
      expect(result.ok).toBe(true);
      const row = store[0];
      expect(row.feasibility).toBe(7);
      expect(row.impact).toBe(8);
      expect(row.effort).toBe("Medium");
      // (7 + 8) / 2 = 7.5
      expect(row.compositeScore).toBe(7.5);
      expect(row.plan).toBe("1. step one\n2. step two");
      expect(row.planModel).toBe("claude-sonnet-4-6");
      expect(typeof row.planGeneratedAt).toBe("string");
    });

    it("calls planIdea with title/description/category from the row", async () => {
      const id = seed({
        title: "T",
        description: "D",
        category: "C",
      });
      await planAndScoreIdea(id);
      expect(planIdeaMock).toHaveBeenCalledWith({
        title: "T",
        description: "D",
        category: "C",
      });
    });

    it("returns idea-not-found when row belongs to another user", async () => {
      store.push({
        id: SAMPLE_UUID,
        user_id: OTHER_USER_ID,
        title: "Other",
      });
      const result = await planAndScoreIdea(SAMPLE_UUID);
      expect(result).toEqual({ ok: false, error: "idea not found" });
      expect(planIdeaMock).not.toHaveBeenCalled();
    });

    it("rate-limits to 20 calls per hour per user — 21st throws RateLimitedError without invoking the model", async () => {
      const id = seed();
      for (let i = 0; i < 20; i++) {
        const r = await planAndScoreIdea(id);
        expect(r.ok).toBe(true);
      }
      expect(planIdeaMock).toHaveBeenCalledTimes(20);
      planIdeaMock.mockClear();
      await expect(planAndScoreIdea(id)).rejects.toBeInstanceOf(
        RateLimitedError,
      );
      expect(planIdeaMock).not.toHaveBeenCalled();
    });

    it("runs against the local-dev stub fallback when ANTHROPIC_API_KEY is unset (no real Anthropic call)", async () => {
      const id = seed();
      const original = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      const actual = await vi.importActual<typeof import("../lib/ai-plan")>(
        "../lib/ai-plan",
      );
      planIdeaMock.mockImplementationOnce(actual.planIdea);
      try {
        const result = await planAndScoreIdea(id);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.idea.plan).toMatch(/Build dashboard/);
          expect(typeof result.idea.feasibility).toBe("number");
          expect(typeof result.idea.impact).toBe("number");
          expect(["Low", "Medium", "High"]).toContain(result.idea.effort);
          expect(result.idea.planModel).toBe("claude-sonnet-4-6");
        }
      } finally {
        if (original === undefined) delete process.env.ANTHROPIC_API_KEY;
        else process.env.ANTHROPIC_API_KEY = original;
      }
    });

    it("rate-limit key is scoped per user (different users do not collide)", async () => {
      const id = seed();
      for (let i = 0; i < 20; i++) {
        await planAndScoreIdea(id);
      }
      // Switch to a different user and ensure the new user is not blocked.
      const auth = await import("@repo/auth/server");
      vi.mocked(auth.requireAccess).mockResolvedValueOnce({
        user: { id: OTHER_USER_ID, email: "other@example.com" },
        permission: "view",
      } as Awaited<ReturnType<typeof auth.requireAccess>>);
      store.push({
        id: SECOND_UUID,
        user_id: OTHER_USER_ID,
        title: "Other idea",
        description: null,
        category: null,
      });
      const r = await planAndScoreIdea(SECOND_UUID);
      expect(r.ok).toBe(true);
    });
  });
});
