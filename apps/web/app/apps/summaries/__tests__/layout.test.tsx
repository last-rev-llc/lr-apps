// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import SummariesLayout from "../layout";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
});

describe("SummariesLayout", () => {
  it("calls requireAppLayoutAccess with 'summaries'", async () => {
    const jsx = await SummariesLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("summaries");
  });

  it("renders children when authenticated", async () => {
    const jsx = await SummariesLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders header with Summaries title and tagline", async () => {
    const jsx = await SummariesLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("Summaries")).toBeInTheDocument();
    expect(screen.getByText("Cut through the noise")).toBeInTheDocument();
  });

  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      SummariesLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
