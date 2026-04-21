import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn((_url, _key, opts: { cookies: { getAll: () => unknown; setAll: (c: unknown[]) => void } }) => {
    // Exercise the cookie bridge so the test can assert the request adapter is wired up.
    opts.cookies.getAll();
    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };
  }),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn((init?: unknown) => ({
      __type: "NextResponse",
      init,
      cookies: { set: vi.fn() },
      headers: new Headers(),
    })),
  },
}));

import { createMiddlewareClient } from "../middleware";
import { createServerClient } from "@supabase/ssr";

const mockCreateServerClient = vi.mocked(createServerClient);

function makeRequest(cookies: Array<{ name: string; value: string }> = []) {
  return {
    cookies: {
      getAll: vi.fn(() => cookies),
      set: vi.fn(),
    },
  } as never;
}

describe("createMiddlewareClient env-var startup assertions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("passes NEXT_PUBLIC_SUPABASE_URL and ANON_KEY through when both are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-001");

    await createMiddlewareClient(makeRequest());

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      "anon-key-001",
      expect.any(Object),
    );
  });

  it("forwards an empty URL value to createServerClient (non-null assertion preserves env shape)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-002");

    // The `!` assertions in middleware.ts mean an unset env is surfaced to
    // Supabase SDK rather than silently succeeding. This test documents that
    // behavior: the middleware does not swallow missing config.
    await createMiddlewareClient(makeRequest());

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      "",
      "anon-key-002",
      expect.any(Object),
    );
  });

  it("does not crash when the request has no cookies", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-003");

    const req = makeRequest([]);
    await expect(createMiddlewareClient(req)).resolves.toBeDefined();
    expect(req.cookies.getAll).toHaveBeenCalled();
  });
});
