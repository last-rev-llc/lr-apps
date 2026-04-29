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

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { requireAccess } from "@repo/auth/server";
import { enforceFeatureTier } from "@/lib/enforce-feature-tier";
import CommandCenterLayout from "../layout";

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

describe("CommandCenterLayout", () => {
  it("calls requireAccess with 'command-center'", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(mockRequireAccess).toHaveBeenCalledWith("command-center");
  });

  it("calls hasFeatureAccess with userId and 'command-center'", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(mockHasFeatureAccess).toHaveBeenCalledWith("user-123", "command-center");
  });

  it("renders children when user has enterprise access", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders UpgradePrompt with requiredTier='enterprise' when access denied", async () => {
    mockHasFeatureAccess.mockResolvedValue(false);

    const jsx = await CommandCenterLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByTestId("upgrade-prompt")).toBeInTheDocument();
    expect(screen.queryByText("child content")).not.toBeInTheDocument();
    expect(screen.getByText("enterprise")).toBeInTheDocument();
  });

  it("UpgradePrompt links to /pricing when access denied", async () => {
    mockHasFeatureAccess.mockResolvedValue(false);

    const jsx = await CommandCenterLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    const pricingLink = screen.getByRole("link", { name: /pricing/i });
    expect(pricingLink).toHaveAttribute("href", "/pricing");
  });

  it("renders topbar with Command Center title when access granted", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("⚡ Command Center")).toBeInTheDocument();
  });

  it("renders Dashboard link in topbar", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    const dashboardLink = screen.getByText("← Dashboard");
    expect(dashboardLink).toHaveAttribute("href", "/");
  });

  it("renders sidebar with Hub + 20 module items (21 total)", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("Hub")).toBeInTheDocument();

    const moduleLabels = [
      "Leads", "Agents", "Ideas", "Recipes", "Users", "Crons",
      "Gallery", "Architecture", "Concerts",
      "Contentful", "Iron", "Meeting Summaries", "Meme Generator",
      "PR Review", "Rizz Guide", "Shopping List", "Team USF",
      "AI Scripts", "App Access", "AlphaClaw",
    ];

    for (const label of moduleLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("propagates auth error when requireAccess rejects", async () => {
    mockRequireAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      CommandCenterLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
