// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@repo/ui", () => ({
  Topbar: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
    className?: string;
  }) => (
    <div data-testid="topbar">
      <span>{title}</span>
      {children}
    </div>
  ),
  AppNav: ({
    items,
  }: {
    items: { label: string; href: string }[];
    className?: string;
  }) => (
    <nav data-testid="app-nav">
      {items.map((item) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  ),
}));

import React from "react";
import { renderWithProviders, screen } from "@repo/test-utils";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import GenerationsLayout from "../layout";

const mockRequireAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAccess.mockResolvedValue(undefined);
});

describe("GenerationsLayout", () => {
  it("calls requireAppLayoutAccess with 'generations'", async () => {
    const ui = await GenerationsLayout({ children: <div>child</div> });
    renderWithProviders(ui);
    expect(mockRequireAccess).toHaveBeenCalledWith("generations");
  });

  it("renders children when authorized", async () => {
    const ui = await GenerationsLayout({ children: <div>App Content</div> });
    renderWithProviders(ui);
    expect(screen.getByText("App Content")).toBeTruthy();
  });

  it("throws when requireAppLayoutAccess rejects (unauthorized)", async () => {
    mockRequireAccess.mockRejectedValue(new Error("Unauthorized"));
    await expect(
      GenerationsLayout({ children: <div>child</div> })
    ).rejects.toThrow("Unauthorized");
  });

  it("renders navigation with all 6 generation links", async () => {
    const ui = await GenerationsLayout({ children: <div>child</div> });
    renderWithProviders(ui);
    const nav = screen.getByTestId("app-nav");
    const links = nav.querySelectorAll("a");
    expect(links.length).toBe(6);
  });

  it("renders topbar with title", async () => {
    const ui = await GenerationsLayout({ children: <div>child</div> });
    renderWithProviders(ui);
    expect(screen.getByText("🕰️ Generations")).toBeTruthy();
  });

  it("renders Dashboard link", async () => {
    const ui = await GenerationsLayout({ children: <div>child</div> });
    renderWithProviders(ui);
    expect(screen.getByText("← Dashboard")).toBeTruthy();
  });
});
