// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

vi.mock("@repo/ui", () => ({
  Topbar: ({ title, children }: any) => (
    <header>
      <span>{title}</span>
      {children}
    </header>
  ),
  AppNav: ({ items }: any) => (
    <nav>
      {items.map((item: any) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  ),
}));

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import GenerationsLayout from "../layout";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
});

describe("GenerationsLayout", () => {
  it("calls requireAppLayoutAccess with 'generations'", async () => {
    const jsx = await GenerationsLayout({ children: <div>child</div> });
    renderWithProviders(jsx);

    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("generations");
  });

  it("renders children when authenticated", async () => {
    const jsx = await GenerationsLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders the app title", async () => {
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

  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      GenerationsLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
