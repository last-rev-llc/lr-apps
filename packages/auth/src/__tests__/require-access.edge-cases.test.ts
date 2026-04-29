import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

let mockHost = "localhost:3000";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string) => (key === "host" ? mockHost : null),
  }),
}));

vi.mock("../auth0-factory", () => ({
  getAuth0ClientForHost: vi.fn(),
  getHostFromRequestHeaders: vi.fn(() => mockHost),
}));

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(),
}));

import { requireAccess } from "../require-access";
import { getAuth0ClientForHost } from "../auth0-factory";
import { createClient } from "@repo/db/server";

const mockGetAuth0ClientForHost = vi.mocked(getAuth0ClientForHost);
const mockCreateClient = vi.mocked(createClient);

describe("requireAccess edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHost = "localhost:3000";
  });

  describe("unauthenticated", () => {
    it("redirects to /login with the app slug when session is null", async () => {
      const getSession = vi.fn().mockResolvedValue(null);
      mockGetAuth0ClientForHost.mockReturnValue({ getSession } as never);

      await expect(requireAccess("sentiment")).rejects.toThrow(
        /REDIRECT:\/login\?redirect=sentiment/,
      );
    });

    it("redirects to the auth-hub absolute URL on an app subdomain (avoids loop)", async () => {
      mockHost = "generations.apps.lastrev.com";
      const getSession = vi.fn().mockResolvedValue(null);
      mockGetAuth0ClientForHost.mockReturnValue({ getSession } as never);

      await expect(requireAccess("generations")).rejects.toThrow(
        /REDIRECT:https:\/\/auth\.apps\.lastrev\.com\/login\?redirect=generations/,
      );
    });

    it("redirects to the legacy auth hub on the legacy cluster", async () => {
      mockHost = "sentiment.lastrev.com";
      const getSession = vi.fn().mockResolvedValue(null);
      mockGetAuth0ClientForHost.mockReturnValue({ getSession } as never);

      await expect(requireAccess("sentiment")).rejects.toThrow(
        /REDIRECT:https:\/\/auth\.lastrev\.com\/login\?redirect=sentiment/,
      );
    });

    it("does not consult Supabase when the session is missing", async () => {
      const getSession = vi.fn().mockResolvedValue(null);
      mockGetAuth0ClientForHost.mockReturnValue({ getSession } as never);

      await expect(requireAccess("sentiment")).rejects.toThrow();
      expect(mockCreateClient).not.toHaveBeenCalled();
    });
  });

  describe("expired / mid-navigation session failure", () => {
    it("surfaces the Auth0 error instead of silently succeeding when getSession throws (expired refresh)", async () => {
      const getSession = vi
        .fn()
        .mockRejectedValue(new Error("id_token expired"));
      mockGetAuth0ClientForHost.mockReturnValue({ getSession } as never);

      await expect(requireAccess("sentiment")).rejects.toThrow(
        /id_token expired/,
      );
      // Error must NOT have been swallowed into a "granted" result
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it("treats a session with undefined user as expired and redirects", async () => {
      const getSession = vi.fn().mockResolvedValue({ user: undefined });
      mockGetAuth0ClientForHost.mockReturnValue({ getSession } as never);

      await expect(requireAccess("sentiment")).rejects.toThrow(
        /REDIRECT:\/login/,
      );
    });
  });

  describe("db failures downstream of the session", () => {
    it("propagates a Supabase query rejection (no silent permission grant)", async () => {
      const getSession = vi.fn().mockResolvedValue({
        user: { sub: "user-1", email: "u@example.com" },
      });
      mockGetAuth0ClientForHost.mockReturnValue({ getSession } as never);

      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = () => chain;
      chain.single = () => Promise.reject(new Error("PGRST301 — RLS denied"));
      mockCreateClient.mockResolvedValue({
        from: () => chain,
      } as never);

      await expect(requireAccess("sentiment")).rejects.toThrow(/RLS denied/);
    });
  });
});
