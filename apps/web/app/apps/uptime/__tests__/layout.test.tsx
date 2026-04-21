// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import UptimeLayout from "../layout";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
});

describe("UptimeLayout", () => {
  it("calls requireAppLayoutAccess with 'uptime'", async () => {
    const jsx = await UptimeLayout({ children: <div>child content</div> });
    renderWithProviders(jsx);

    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("uptime");
  });

  it("renders children when authenticated", async () => {
    const jsx = await UptimeLayout({ children: <div>child content</div> });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders Topbar with Uptime Status title", async () => {
    const jsx = await UptimeLayout({ children: <div>test</div> });
    renderWithProviders(jsx);

    expect(screen.getByText(/Uptime Status/)).toBeInTheDocument();
  });

  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      UptimeLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
