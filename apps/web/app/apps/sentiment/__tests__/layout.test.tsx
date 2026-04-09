// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import SentimentLayout from "../layout";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
});

describe("SentimentLayout", () => {
  it("calls requireAppLayoutAccess with 'sentiment'", async () => {
    const jsx = await SentimentLayout({ children: <div>child content</div> });
    renderWithProviders(jsx);

    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("sentiment");
  });

  it("renders children when authenticated", async () => {
    const jsx = await SentimentLayout({ children: <div>child content</div> });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders 'Sentiment' title in header", async () => {
    const jsx = await SentimentLayout({ children: <div>test</div> });
    renderWithProviders(jsx);

    expect(screen.getByText("Sentiment")).toBeInTheDocument();
  });

  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      SentimentLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
