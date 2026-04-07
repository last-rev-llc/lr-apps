import { describe, it, expect } from "vitest";
import { createMockSupabase } from "../mock-supabase";

describe("createMockSupabase", () => {
  it("returns a mock client with from()", () => {
    const client = createMockSupabase();
    expect(client.from).toBeDefined();
    expect(client.from("app_permissions")).toBeDefined();
  });

  it("supports chainable query methods", () => {
    const client = createMockSupabase();
    const query = client.from("app_permissions");

    // All chain methods should return the builder
    const chained = query.select("*").eq("user_id", "123").order("created_at");
    expect(chained).toBe(query);
  });

  it("resolves default data from terminal methods", async () => {
    const client = createMockSupabase();
    const result = await client
      .from("app_permissions")
      .select("*")
      .eq("id", "1")
      .single();

    expect(result).toEqual({ data: [], error: null });
  });

  it("accepts custom default data", async () => {
    const mockData = { data: { id: "1", name: "test" }, error: null as null };
    const client = createMockSupabase(mockData);

    const result = await client.from("test").select().single();
    expect(result).toEqual(mockData);
  });

  it("allows overriding builder return values", async () => {
    const client = createMockSupabase();
    const customResult = { data: { id: "custom" }, error: null };
    client._builder.single.mockResolvedValue(customResult);

    const result = await client.from("test").select().single();
    expect(result).toEqual(customResult);
  });

  it("supports awaiting the builder directly", async () => {
    const defaultData = { data: [{ id: "1" }], error: null as null };
    const client = createMockSupabase(defaultData);

    const result = await client.from("test").select("*");
    expect(result).toEqual(defaultData);
  });

  it("provides auth helpers", async () => {
    const client = createMockSupabase();

    const userResult = await client.auth.getUser();
    expect(userResult).toEqual({ data: { user: null }, error: null });

    const sessionResult = await client.auth.getSession();
    expect(sessionResult).toEqual({ data: { session: null }, error: null });
  });

  it("provides rpc mock", async () => {
    const client = createMockSupabase();
    const result = await client.rpc("my_function", { arg: "value" });
    expect(result).toEqual({ data: null, error: null });
  });
});
