import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string) => (key === "host" ? "localhost:3000" : null),
  }),
}));

vi.mock("../auth0-factory", () => ({
  getAuth0ClientForHost: vi.fn(),
  getHostFromRequestHeaders: vi.fn(() => "localhost:3000"),
}));

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(),
}));

import { requireAccess } from "../require-access";
import { getAuth0ClientForHost } from "../auth0-factory";
import { createClient } from "@repo/db/server";

const mockGetAuth0ClientForHost = vi.mocked(getAuth0ClientForHost);
const mockCreateClient = vi.mocked(createClient);

function makeDbClient(permissionData: { permission: string } | null) {
  const mockSingle = vi.fn().mockResolvedValue({ data: permissionData, error: null });
  const queryChain: Record<string, unknown> = {};
  queryChain.select = () => queryChain;
  queryChain.eq = () => queryChain;
  queryChain.single = mockSingle;
  return { from: vi.fn(() => queryChain) };
}

describe("requireAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user and permission for valid session with sufficient access", async () => {
    const mockGetSession = vi.fn().mockResolvedValue({
      user: { sub: "user-1", email: "user@example.com" },
    });
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);
    mockCreateClient.mockResolvedValue(makeDbClient({ permission: "edit" }) as never);

    const result = await requireAccess("my-app", "view");
    expect(result).toEqual({
      user: { id: "user-1", email: "user@example.com" },
      permission: "edit",
    });
  });

  it("returns admin permission when user has admin and view is required", async () => {
    const mockGetSession = vi.fn().mockResolvedValue({
      user: { sub: "user-2", email: "admin@example.com" },
    });
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);
    mockCreateClient.mockResolvedValue(makeDbClient({ permission: "admin" }) as never);

    const result = await requireAccess("my-app", "view");
    expect(result.permission).toBe("admin");
  });

  it("redirects to /login when session is null", async () => {
    const mockGetSession = vi.fn().mockResolvedValue(null);
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);

    await expect(requireAccess("my-app")).rejects.toThrow(/REDIRECT/);
    expect(mockGetSession).toHaveBeenCalled();
  });

  it("redirects to /login when session has no user property", async () => {
    const mockGetSession = vi.fn().mockResolvedValue({});
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);

    await expect(requireAccess("my-app")).rejects.toThrow(/REDIRECT/);
  });

  it("redirects to /login when session user is undefined", async () => {
    const mockGetSession = vi.fn().mockResolvedValue({ user: undefined });
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);

    await expect(requireAccess("my-app")).rejects.toThrow(/REDIRECT/);
  });

  it("redirects to /unauthorized when no permission row exists", async () => {
    const mockGetSession = vi.fn().mockResolvedValue({
      user: { sub: "user-1", email: "user@example.com" },
    });
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);
    mockCreateClient.mockResolvedValue(makeDbClient(null) as never);

    await expect(requireAccess("my-app")).rejects.toThrow(/REDIRECT/);
  });

  it("redirects to /unauthorized when user has view but admin is required", async () => {
    const mockGetSession = vi.fn().mockResolvedValue({
      user: { sub: "user-1", email: "user@example.com" },
    });
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);
    mockCreateClient.mockResolvedValue(makeDbClient({ permission: "view" }) as never);

    await expect(requireAccess("my-app", "admin")).rejects.toThrow(/REDIRECT/);
  });

  it("redirects to /unauthorized when user has edit but admin is required", async () => {
    const mockGetSession = vi.fn().mockResolvedValue({
      user: { sub: "user-1", email: "user@example.com" },
    });
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);
    mockCreateClient.mockResolvedValue(makeDbClient({ permission: "edit" }) as never);

    await expect(requireAccess("my-app", "admin")).rejects.toThrow(/REDIRECT/);
  });

  it("treats missing email as empty string", async () => {
    const mockGetSession = vi.fn().mockResolvedValue({ user: { sub: "user-1" } });
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);
    mockCreateClient.mockResolvedValue(makeDbClient({ permission: "view" }) as never);

    const result = await requireAccess("my-app", "view");
    expect(result.user.email).toBe("");
  });

  it("includes app slug in login redirect URL", async () => {
    const mockGetSession = vi.fn().mockResolvedValue(null);
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);

    await expect(requireAccess("special-app")).rejects.toThrow(/special-app/);
  });

  it("defaults to view permission when none specified", async () => {
    const mockGetSession = vi.fn().mockResolvedValue({
      user: { sub: "user-1", email: "user@example.com" },
    });
    mockGetAuth0ClientForHost.mockReturnValue({ getSession: mockGetSession } as never);
    mockCreateClient.mockResolvedValue(makeDbClient({ permission: "view" }) as never);

    const result = await requireAccess("my-app");
    expect(result.permission).toBe("view");
  });
});
