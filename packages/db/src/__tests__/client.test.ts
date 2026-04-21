import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateBrowserClient = vi.fn(() => ({
  from: vi.fn(),
  auth: {},
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => mockCreateBrowserClient(...args),
}));

describe("createClient (browser)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  });

  it("calls createBrowserClient with the configured URL and anon key", async () => {
    const { createClient } = await import("../client");
    createClient();
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
    );
  });

  it("returns a client object with a from method", async () => {
    const { createClient } = await import("../client");
    const client = createClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });

  it("returns the same singleton on repeated calls", async () => {
    const { createClient } = await import("../client");
    const first = createClient();
    const second = createClient();
    expect(first).toBe(second);
    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
  });
});

describe("createClient error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("passes through the URL and key from environment", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    const { createClient } = await import("../client");
    createClient();
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    );
  });
});
