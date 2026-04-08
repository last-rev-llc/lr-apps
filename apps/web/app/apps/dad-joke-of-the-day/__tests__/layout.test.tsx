import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
});

async function callLayout() {
  const mod = await import("../layout");
  return mod.default({ children: "test" as any });
}

describe("DadJokeLayout", () => {
  it("calls requireAppLayoutAccess with 'dad-joke-of-the-day'", async () => {
    mockRequireAppLayoutAccess.mockResolvedValueOnce(undefined);
    await callLayout();
    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("dad-joke-of-the-day");
  });

  it("redirects unauthenticated user to /login", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    (redirectError as any).digest = "NEXT_REDIRECT;/login";
    mockRequireAppLayoutAccess.mockRejectedValueOnce(redirectError);

    await expect(callLayout()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("dad-joke-of-the-day");
  });

  it("redirects unauthorized user to /unauthorized", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    (redirectError as any).digest = "NEXT_REDIRECT;/unauthorized";
    mockRequireAppLayoutAccess.mockRejectedValueOnce(redirectError);

    await expect(callLayout()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("dad-joke-of-the-day");
  });

  it("renders children for authenticated user with permission", async () => {
    mockRequireAppLayoutAccess.mockResolvedValueOnce(undefined);
    const result = await callLayout();
    expect(result).toBeTruthy();
    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("dad-joke-of-the-day");
  });
});
