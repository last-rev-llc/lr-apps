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
import CommandCenterLayout from "../layout";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
});

describe("CommandCenterLayout", () => {
  it("calls requireAppLayoutAccess with 'command-center'", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("command-center");
  });

  it("renders children when authenticated", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders topbar with Command Center title", async () => {
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

  it("renders sidebar with Hub + 21 module items (22 total)", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    // Hub link
    expect(screen.getByText("Hub")).toBeInTheDocument();

    // All 21 module labels should be in the sidebar
    const moduleLabels = [
      "Leads", "Agents", "Ideas", "Recipes", "Users", "Crons",
      "Gallery", "Architecture", "Client Health", "Concerts",
      "Contentful", "Iron", "Meeting Summaries", "Meme Generator",
      "PR Review", "Rizz Guide", "Shopping List", "Team USF",
      "AI Scripts", "App Access", "AlphaClaw",
    ];

    for (const label of moduleLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("sidebar Hub links to /apps/command-center", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    const hubLink = screen.getByText("Hub").closest("a");
    expect(hubLink).toHaveAttribute("href", "/apps/command-center");
  });

  it("sidebar module links point to correct routes", async () => {
    const jsx = await CommandCenterLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    const leadsLink = screen.getByText("Leads").closest("a");
    expect(leadsLink).toHaveAttribute("href", "/apps/command-center/leads");

    const alphaclawLink = screen.getByText("AlphaClaw").closest("a");
    expect(alphaclawLink).toHaveAttribute("href", "/apps/command-center/alphaclaw");
  });

  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      CommandCenterLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
