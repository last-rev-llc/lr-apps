import { describe, it, expect, vi, beforeEach } from "vitest";

// Provide React globally for JSX in the layout under test
import React from "react";
globalThis.React = React;

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("a", null, children),
}));

vi.mock("../lib/calculators", () => ({
  CALCULATORS: [],
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

describe("AgeOfApesLayout", () => {
  it("calls requireAppLayoutAccess with 'age-of-apes'", async () => {
    mockRequireAppLayoutAccess.mockResolvedValueOnce(undefined);
    await callLayout();
    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("age-of-apes");
  });

  it("redirects unauthenticated user to /login", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    (redirectError as any).digest = "NEXT_REDIRECT;/login";
    mockRequireAppLayoutAccess.mockRejectedValueOnce(redirectError);

    await expect(callLayout()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("age-of-apes");
  });

  it("redirects unauthorized user to /unauthorized", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    (redirectError as any).digest = "NEXT_REDIRECT;/unauthorized";
    mockRequireAppLayoutAccess.mockRejectedValueOnce(redirectError);

    await expect(callLayout()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("age-of-apes");
  });

  it("renders children for authenticated user with permission", async () => {
    mockRequireAppLayoutAccess.mockResolvedValueOnce(undefined);
    const result = await callLayout();
    expect(result).toBeTruthy();
    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("age-of-apes");
  });
});
