import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn(),
}));

vi.mock("../app-registry", () => ({
  isPublicRoute: vi.fn(),
}));

import { requireAccess } from "@repo/auth/server";
import { isPublicRoute } from "../app-registry";
import { requireAppLayoutAccess } from "../require-app-layout-access";

const mockRequireAccess = vi.mocked(requireAccess);
const mockIsPublicRoute = vi.mocked(isPublicRoute);

beforeEach(() => {
  vi.clearAllMocks();
  mockIsPublicRoute.mockReturnValue(false);
});

describe("requireAppLayoutAccess", () => {
  it("calls requireAccess for a standard auth app", async () => {
    await requireAppLayoutAccess("sentiment");
    expect(mockRequireAccess).toHaveBeenCalledWith("sentiment");
  });

  it("calls requireAccess for ai-calculator when no pathname provided", async () => {
    await requireAppLayoutAccess("ai-calculator");
    expect(mockRequireAccess).toHaveBeenCalledWith("ai-calculator");
  });

  it("skips requireAccess for ai-calculator when pathname matches public route", async () => {
    mockIsPublicRoute.mockReturnValue(true);
    await requireAppLayoutAccess("ai-calculator", "/");
    expect(mockRequireAccess).not.toHaveBeenCalled();
    expect(mockIsPublicRoute).toHaveBeenCalledWith("ai-calculator", "/");
  });

  it("calls requireAccess for ai-calculator when pathname does not match public route", async () => {
    mockIsPublicRoute.mockReturnValue(false);
    await requireAppLayoutAccess("ai-calculator", "/calculator");
    expect(mockRequireAccess).toHaveBeenCalledWith("ai-calculator");
  });

  it("calls requireAccess for unknown slug", async () => {
    await requireAppLayoutAccess("nonexistent");
    expect(mockRequireAccess).toHaveBeenCalledWith("nonexistent");
  });

  it("calls requireAccess for auth:false app without publicRoutes", async () => {
    await requireAppLayoutAccess("dad-joke-of-the-day");
    expect(mockRequireAccess).toHaveBeenCalledWith("dad-joke-of-the-day");
  });
});
