// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn(),
}));

vi.mock("@repo/billing", () => ({
  hasFeatureAccess: vi.fn(),
}));

vi.mock("@/components/UpgradePrompt", () => ({
  default: ({ requiredTier }: { requiredTier: string }) => (
    <div data-testid="upgrade-prompt">
      <a href="/pricing">View Pricing</a>
      <span>{requiredTier}</span>
    </div>
  ),
}));

vi.mock("@repo/ui", () => ({
  Topbar: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <header>
      <span>{title}</span>
      {children}
    </header>
  ),
  AppNav: ({ items }: { items: { href: string; label: string }[] }) => (
    <nav>
      {items.map((item) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  ),
}));

import { requireAccess } from "@repo/auth/server";
import { hasFeatureAccess } from "@repo/billing";
import GenerationsLayout from "../layout";

const mockRequireAccess = vi.mocked(requireAccess);
const mockHasFeatureAccess = vi.mocked(hasFeatureAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAccess.mockResolvedValue({
    user: { id: "user-123", email: "test@example.com" },
    permission: "view",
  });
  mockHasFeatureAccess.mockResolvedValue(true);
});

describe("GenerationsLayout", () => {
  it("calls requireAccess with 'generations'", async () => {
    const jsx = await GenerationsLayout({ children: <div>child</div> });
    renderWithProviders(jsx);

    expect(mockRequireAccess).toHaveBeenCalledWith("generations");
  });

  it("calls hasFeatureAccess with userId and 'generations'", async () => {
    const jsx = await GenerationsLayout({ children: <div>child</div> });
    renderWithProviders(jsx);

    expect(mockHasFeatureAccess).toHaveBeenCalledWith("user-123", "generations");
  });

  it("renders children when user has pro access", async () => {
    const jsx = await GenerationsLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders UpgradePrompt with requiredTier='pro' when access denied", async () => {
    mockHasFeatureAccess.mockResolvedValue(false);

    const jsx = await GenerationsLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByTestId("upgrade-prompt")).toBeInTheDocument();
    expect(screen.queryByText("child content")).not.toBeInTheDocument();
    expect(screen.getByText("pro")).toBeInTheDocument();
  });

  it("UpgradePrompt links to /pricing when access denied", async () => {
    mockHasFeatureAccess.mockResolvedValue(false);

    const jsx = await GenerationsLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    const pricingLink = screen.getByRole("link", { name: /pricing/i });
    expect(pricingLink).toHaveAttribute("href", "/pricing");
  });

  it("renders the app title when access granted", async () => {
    const jsx = await GenerationsLayout({ children: <div>test</div> });
    renderWithProviders(jsx);

    expect(screen.getByText(/Generations/)).toBeInTheDocument();
  });

  it("renders exactly 6 generation nav links", async () => {
    const jsx = await GenerationsLayout({ children: <div>test</div> });
    renderWithProviders(jsx);

    const links = screen.getAllByRole("link");
    const genLinks = links.filter((l) =>
      l.getAttribute("href")?.startsWith("/apps/generations/"),
    );
    expect(genLinks).toHaveLength(6);
  });

  it("renders a dashboard link", async () => {
    const jsx = await GenerationsLayout({ children: <div>test</div> });
    renderWithProviders(jsx);

    const dashLink = screen.getByRole("link", { name: /Dashboard/i });
    expect(dashLink).toHaveAttribute("href", "/");
  });

  it("propagates auth error when requireAccess rejects", async () => {
    mockRequireAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      GenerationsLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
