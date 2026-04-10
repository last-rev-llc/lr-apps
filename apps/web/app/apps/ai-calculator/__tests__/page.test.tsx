// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

// ── Mock next/headers ──────────────────────────────────────────────────────

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("localhost:3000"),
  }),
}));

// ── Mock next/link ─────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => ({
  Button: ({ children, asChild, className, variant }: any) => (
    <button className={className ?? ""}>{children}</button>
  ),
  Card: ({ children, className }: any) => (
    <div className={className ?? ""}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

// ── Mock app-registry and helpers ─────────────────────────────────────────

vi.mock("@/lib/app-registry", () => ({
  getAppBySlug: vi.fn().mockReturnValue({
    slug: "ai-calculator",
    subdomain: "ai-calculator",
    tier: "free",
    publicRoutes: ["/"],
    routeGroup: "ai-calculator",
  }),
}));

vi.mock("@/lib/platform-urls", () => ({
  getPlatformBaseUrl: vi.fn().mockReturnValue("http://localhost:3000"),
}));

vi.mock("@/lib/proxy-utils", () => ({
  hrefWithinDeployedApp: vi
    .fn()
    .mockReturnValue("http://ai-calculator.localhost:3000/calculator"),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("AiCalculatorLandingPage", () => {
  it("renders the hero heading", async () => {
    const { default: AiCalculatorLandingPage } = await import("../page");
    const jsx = await AiCalculatorLandingPage();
    renderWithProviders(jsx);

    expect(screen.getByText("AI ROI Calculator")).toBeInTheDocument();
  });

  it("renders the Last Rev brand label", async () => {
    const { default: AiCalculatorLandingPage } = await import("../page");
    const jsx = await AiCalculatorLandingPage();
    renderWithProviders(jsx);

    expect(screen.getByText("Last Rev")).toBeInTheDocument();
  });

  it("renders the public description text", async () => {
    const { default: AiCalculatorLandingPage } = await import("../page");
    const jsx = await AiCalculatorLandingPage();
    renderWithProviders(jsx);

    expect(
      screen.getByText(/This page is open to everyone/),
    ).toBeInTheDocument();
  });

  it("renders a link to the protected calculator", async () => {
    const { default: AiCalculatorLandingPage } = await import("../page");
    const jsx = await AiCalculatorLandingPage();
    renderWithProviders(jsx);

    expect(screen.getByText("Open ROI calculator")).toBeInTheDocument();
  });

  it("renders a Back to My Apps link", async () => {
    const { default: AiCalculatorLandingPage } = await import("../page");
    const jsx = await AiCalculatorLandingPage();
    renderWithProviders(jsx);

    expect(screen.getByText("Back to My Apps")).toBeInTheDocument();
  });

  it("throws when ai-calculator is not in the registry", async () => {
    const { getAppBySlug } = await import("@/lib/app-registry");
    vi.mocked(getAppBySlug).mockReturnValueOnce(undefined as any);

    const { default: AiCalculatorLandingPage } = await import("../page");
    await expect(AiCalculatorLandingPage()).rejects.toThrow(
      "ai-calculator missing from registry",
    );
  });
});
