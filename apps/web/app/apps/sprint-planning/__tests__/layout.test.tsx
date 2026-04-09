// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import SprintPlanningLayout from "../layout";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
});

describe("SprintPlanningLayout", () => {
  it("calls requireAppLayoutAccess with 'sprint-planning'", async () => {
    const jsx = await SprintPlanningLayout({ children: <div>child</div> });
    renderWithProviders(jsx);

    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("sprint-planning");
  });

  it("renders children when authenticated", async () => {
    const jsx = await SprintPlanningLayout({ children: <div>child content</div> });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders 'Sprint Planning' title in header", async () => {
    const jsx = await SprintPlanningLayout({ children: <div>test</div> });
    renderWithProviders(jsx);

    expect(screen.getByText("Sprint Planning")).toBeInTheDocument();
  });

  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      SprintPlanningLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
