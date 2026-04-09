// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import MeetingSummariesLayout from "../layout";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
});

describe("MeetingSummariesLayout", () => {
  it("calls requireAppLayoutAccess with 'meeting-summaries'", async () => {
    const jsx = await MeetingSummariesLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith(
      "meeting-summaries",
    );
  });

  it("renders children when authenticated", async () => {
    const jsx = await MeetingSummariesLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders header with Meeting Summaries title", async () => {
    const jsx = await MeetingSummariesLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText(/Meeting Summaries/)).toBeInTheDocument();
  });

  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      MeetingSummariesLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
