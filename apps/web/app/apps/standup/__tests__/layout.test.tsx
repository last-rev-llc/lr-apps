// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
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

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import StandupLayout from "../layout";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
});

describe("StandupLayout", () => {
  it("calls requireAppLayoutAccess with 'standup'", async () => {
    const jsx = await StandupLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("standup");
  });

  it("renders children when authenticated", async () => {
    const jsx = await StandupLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders header with Daily Standup title", async () => {
    const jsx = await StandupLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText(/Daily Standup/)).toBeInTheDocument();
  });

  it("renders Dashboard link", async () => {
    const jsx = await StandupLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    const link = screen.getByText(/Dashboard/);
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });

  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      StandupLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
