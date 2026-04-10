// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(() => {
      callback([{ isIntersecting: true }], {});
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { RizzGuideApp } from "../rizz-guide/components/rizz-guide-app";

describe("RizzGuideApp", () => {
  it("renders the page header", () => {
    renderWithProviders(<RizzGuideApp />);

    expect(screen.getByText("✨ Rizz Guide")).toBeInTheDocument();
    expect(screen.getByText("Communication coaching — tips, templates, and scenarios")).toBeInTheDocument();
  });

  it("renders all scenario filter buttons", () => {
    renderWithProviders(<RizzGuideApp />);

    expect(screen.getByText("Opening Line")).toBeInTheDocument();
    expect(screen.getByText("Callback")).toBeInTheDocument();
    expect(screen.getByText("Banter")).toBeInTheDocument();
    expect(screen.getByText("Deep Convo")).toBeInTheDocument();
    expect(screen.getByText("Exit / Close")).toBeInTheDocument();
  });

  it("renders tips for the default opener scenario", () => {
    renderWithProviders(<RizzGuideApp />);

    // Default scenario is "opener"
    expect(screen.getByText("Specific compliment beats generic")).toBeInTheDocument();
    expect(screen.getByText("The confident pause")).toBeInTheDocument();
  });

  it("renders message templates section", () => {
    renderWithProviders(<RizzGuideApp />);

    expect(screen.getByText("Message Templates")).toBeInTheDocument();
    expect(screen.getByText("First message after meeting IRL")).toBeInTheDocument();
    expect(screen.getByText("Reigniting a cold conversation")).toBeInTheDocument();
    expect(screen.getByText("Asking them out casually")).toBeInTheDocument();
    expect(screen.getByText("After a great date")).toBeInTheDocument();
  });

  it("renders golden rules section", () => {
    renderWithProviders(<RizzGuideApp />);

    expect(screen.getByText("🏆 Golden Rules")).toBeInTheDocument();
    expect(screen.getByText("Be genuinely interested, not interesting")).toBeInTheDocument();
    expect(screen.getByText("Specificity > generality always")).toBeInTheDocument();
  });
});
