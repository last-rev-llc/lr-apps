// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn(),
}));

vi.mock("@/lib/enforce-feature-tier", () => ({
  enforceFeatureTier: vi.fn(),
}));

vi.mock("@/components/UpgradePrompt", () => ({
  default: ({ requiredTier }: { requiredTier: string }) => (
    <div data-testid="upgrade-prompt">
      <a href="/pricing">View Pricing</a>
      <span>{requiredTier}</span>
    </div>
  ),
}));

import { requireAccess } from "@repo/auth/server";
import { enforceFeatureTier } from "@/lib/enforce-feature-tier";
import SentimentLayout from "../layout";

const mockRequireAccess = vi.mocked(requireAccess);
const mockHasFeatureAccess = vi.mocked(enforceFeatureTier);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAccess.mockResolvedValue({
    user: { id: "user-123", email: "test@example.com" },
    permission: "view",
  });
  mockHasFeatureAccess.mockResolvedValue(true);
});

describe("SentimentLayout", () => {
  it("calls requireAccess with 'sentiment'", async () => {
    const jsx = await SentimentLayout({ children: <div>child content</div> });
    renderWithProviders(jsx);

    expect(mockRequireAccess).toHaveBeenCalledWith("sentiment");
  });

  it("calls hasFeatureAccess with userId and 'sentiment'", async () => {
    const jsx = await SentimentLayout({ children: <div>child content</div> });
    renderWithProviders(jsx);

    expect(mockHasFeatureAccess).toHaveBeenCalledWith("user-123", "sentiment");
  });

  it("renders children when user has pro access", async () => {
    const jsx = await SentimentLayout({ children: <div>child content</div> });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders UpgradePrompt with requiredTier='pro' when access denied", async () => {
    mockHasFeatureAccess.mockResolvedValue(false);

    const jsx = await SentimentLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByTestId("upgrade-prompt")).toBeInTheDocument();
    expect(screen.queryByText("child content")).not.toBeInTheDocument();
    expect(screen.getByText("pro")).toBeInTheDocument();
  });

  it("UpgradePrompt links to /pricing when access denied", async () => {
    mockHasFeatureAccess.mockResolvedValue(false);

    const jsx = await SentimentLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    const pricingLink = screen.getByRole("link", { name: /pricing/i });
    expect(pricingLink).toHaveAttribute("href", "/pricing");
  });

  it("renders 'Sentiment' title in header when access granted", async () => {
    const jsx = await SentimentLayout({ children: <div>test</div> });
    renderWithProviders(jsx);

    expect(screen.getByText("Sentiment")).toBeInTheDocument();
  });

  it("propagates auth error when requireAccess rejects", async () => {
    mockRequireAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      SentimentLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
