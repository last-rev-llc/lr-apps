import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabaseClient } from "@repo/test-utils";

let mockSupabase: MockSupabaseClient;

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/lib/otel", () => ({
  withSpan: <T,>(_name: string, _attrs: unknown, fn: () => Promise<T>) => fn(),
}));

import { getContacts, getContactById } from "../queries";

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
});

describe("getContacts", () => {
  it("returns parsed contacts ordered by name", async () => {
    const rows = [
      {
        id: "c1",
        name: "Alice",
        email: "alice@example.com",
        tags: ["vip"],
        insights: { confidence: "high" },
      },
    ];
    mockSupabase._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: rows, error: null }).then(resolve),
    );

    const result = await getContacts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alice");
    expect(result[0].tags).toEqual(["vip"]);
    expect(result[0].insights).toEqual({ confidence: "high" });
    expect(mockSupabase.from).toHaveBeenCalledWith("contacts");
    expect(mockSupabase._builder.select).toHaveBeenCalledWith("*");
    expect(mockSupabase._builder.order).toHaveBeenCalledWith("name", {
      ascending: true,
    });
  });

  it("parses JSON-string tags and insights", async () => {
    const rows = [
      {
        id: "c1",
        name: "Bob",
        tags: '["client","urgent"]',
        insights: '{"summary":"a stub"}',
      },
    ];
    mockSupabase._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: rows, error: null }).then(resolve),
    );

    const result = await getContacts();
    expect(result[0].tags).toEqual(["client", "urgent"]);
    expect(result[0].insights).toEqual({ summary: "a stub" });
  });

  it("falls back to defaults when JSON fields fail to parse", async () => {
    const rows = [{ id: "c1", name: "Bad", tags: "not-json", insights: "{nope" }];
    mockSupabase._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: rows, error: null }).then(resolve),
    );

    const result = await getContacts();
    expect(result[0].tags).toEqual([]);
    expect(result[0].insights).toBeNull();
  });

  it("returns empty array on supabase error and logs", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSupabase._builder.then.mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: { message: "DB down" } }).then(resolve),
    );

    const result = await getContacts();
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      "contacts fetch error:",
      expect.objectContaining({ message: "DB down" }),
    );
    consoleSpy.mockRestore();
  });
});

describe("getContactById", () => {
  it("returns the parsed contact when found", async () => {
    mockSupabase._builder.maybeSingle.mockResolvedValue({
      data: {
        id: "c1",
        name: "Alice",
        tags: '["vip"]',
        insights: { summary: "ok" },
      },
      error: null,
    });

    const contact = await getContactById("c1");

    expect(contact).not.toBeNull();
    expect(contact!.id).toBe("c1");
    expect(contact!.tags).toEqual(["vip"]);
    expect(contact!.insights).toEqual({ summary: "ok" });
    expect(mockSupabase.from).toHaveBeenCalledWith("contacts");
    expect(mockSupabase._builder.eq).toHaveBeenCalledWith("id", "c1");
    expect(mockSupabase._builder.maybeSingle).toHaveBeenCalled();
  });

  it("returns null when no row is found", async () => {
    mockSupabase._builder.maybeSingle.mockResolvedValue({ data: null, error: null });
    const contact = await getContactById("missing");
    expect(contact).toBeNull();
  });

  it("returns null and logs on db error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSupabase._builder.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const contact = await getContactById("c1");
    expect(contact).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      "contact fetch error:",
      expect.objectContaining({ message: "boom" }),
    );
    consoleSpy.mockRestore();
  });
});
