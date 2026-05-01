import { describe, it, expect, vi, beforeEach } from "vitest";

type Row = Record<string, unknown> & { id: string };
let store: Row[] = [];
let nextId = 1;

function uuid(): string {
  return `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`;
}

const mockDb = {
  from(table: string) {
    if (table !== "contacts") {
      throw new Error(`unexpected table ${table}`);
    }
    return {
      insert(row: Record<string, unknown>) {
        const newRow: Row = { id: uuid(), ...row };
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
        } as unknown as Record<string, unknown> & PromiseLike<{ error: null }>;
        return chain;
      },
    };
  },
};

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(async () => mockDb),
}));

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

const logErrorMock = vi.fn();
vi.mock("@repo/logger", () => ({
  log: {
    error: (...args: unknown[]) => logErrorMock(...args),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const withSpanMock = vi.fn(
  async (_name: string, _attrs: Record<string, unknown>, fn: () => unknown) =>
    fn(),
);
vi.mock("@/lib/otel", () => ({
  withSpan: (name: string, attrs: Record<string, unknown>, fn: () => unknown) =>
    withSpanMock(name, attrs, fn),
}));

import { createContact, updateContact, deleteContact } from "../lib/actions";

beforeEach(() => {
  store = [];
  nextId = 1;
  vi.clearAllMocks();
});

describe("crm server actions", () => {
  describe("createContact", () => {
    it("inserts a row with the validated input and returns the row", async () => {
      const out = await createContact({
        name: "Adam Harris",
        company: "Last Rev",
        type: "team",
        tags: ["founder"],
      });
      expect(out.name).toBe("Adam Harris");
      expect(store).toHaveLength(1);
      expect(store[0]).toMatchObject({
        name: "Adam Harris",
        company: "Last Rev",
        type: "team",
      });
    });

    it("revalidates the crm path", async () => {
      await createContact({ name: "X" });
      expect(revalidatePathMock).toHaveBeenCalledWith("/apps/crm");
    });

    it("throws when validation fails (empty name)", async () => {
      await expect(createContact({ name: "" })).rejects.toBeDefined();
    });

    it("throws on a db error", async () => {
      const errClient = {
        from: () => ({
          insert: () => ({
            select: () => ({
              async single() {
                return { data: null, error: { message: "boom" } };
              },
            }),
          }),
        }),
      };
      const { createClient } = await import("@repo/db/server");
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        errClient,
      );
      await expect(createContact({ name: "Adam" })).rejects.toThrow("boom");
      expect(logErrorMock).toHaveBeenCalled();
    });
  });

  describe("updateContact", () => {
    it("updates a row by id and returns the merged row", async () => {
      store.push({ id: "abc", name: "Old", type: "team" });
      const out = await updateContact("abc", { name: "New", company: "Last Rev" });
      expect(out.name).toBe("New");
      expect(store[0]).toMatchObject({ name: "New", company: "Last Rev" });
    });

    it("revalidates the crm path", async () => {
      store.push({ id: "abc", name: "Old" });
      await updateContact("abc", { name: "New" });
      expect(revalidatePathMock).toHaveBeenCalledWith("/apps/crm");
    });

    it("rejects an invalid url field", async () => {
      store.push({ id: "abc", name: "Old" });
      await expect(
        updateContact("abc", { website: "not-a-url" }),
      ).rejects.toBeDefined();
    });
  });

  describe("deleteContact", () => {
    it("deletes the row and revalidates", async () => {
      store.push({ id: "abc", name: "X" });
      await deleteContact("abc");
      expect(store).toHaveLength(0);
      expect(revalidatePathMock).toHaveBeenCalledWith("/apps/crm");
    });
  });

  describe("span instrumentation", () => {
    it("wraps createContact in a crm.createContact span", async () => {
      await createContact({ name: "Spanned" });
      expect(withSpanMock).toHaveBeenCalledWith(
        "crm.createContact",
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("wraps updateContact in a crm.updateContact span with contactId", async () => {
      store.push({ id: "abc", name: "X" });
      await updateContact("abc", { name: "Y" });
      expect(withSpanMock).toHaveBeenCalledWith(
        "crm.updateContact",
        expect.objectContaining({ contactId: "abc" }),
        expect.any(Function),
      );
    });

    it("wraps deleteContact in a crm.deleteContact span with contactId", async () => {
      store.push({ id: "abc", name: "X" });
      await deleteContact("abc");
      expect(withSpanMock).toHaveBeenCalledWith(
        "crm.deleteContact",
        expect.objectContaining({ contactId: "abc" }),
        expect.any(Function),
      );
    });
  });
});
