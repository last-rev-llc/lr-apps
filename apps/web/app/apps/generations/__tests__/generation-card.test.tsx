// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@repo/ui", () => ({
  Card: ({ children, className, style }: any) => (
    <div className={className} style={style}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

import { GenerationCard } from "../components/generation-card";
import type { GenerationConfig } from "../lib/types";

const genFixture: GenerationConfig = {
  slug: "gen-alpha",
  name: "Gen Alpha",
  era: "2010s–Present",
  color: "#a855f7",
  emoji: "🧠",
  tagline: "Brainrot, rizz, and skibidi vibes",
};

describe("GenerationCard", () => {
  it("renders generation name", () => {
    renderWithProviders(<GenerationCard gen={genFixture} termCount={42} />);
    expect(screen.getByText("Gen Alpha")).toBeInTheDocument();
  });

  it("renders generation era", () => {
    renderWithProviders(<GenerationCard gen={genFixture} termCount={42} />);
    expect(screen.getByText("2010s–Present")).toBeInTheDocument();
  });

  it("renders term count", () => {
    renderWithProviders(<GenerationCard gen={genFixture} termCount={5} />);
    expect(screen.getByText("5 terms")).toBeInTheDocument();
  });

  it("renders a link to the generation page", () => {
    renderWithProviders(<GenerationCard gen={genFixture} termCount={42} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/apps/generations/gen-alpha");
  });

  it("renders the emoji", () => {
    renderWithProviders(<GenerationCard gen={genFixture} termCount={42} />);
    expect(screen.getByText("🧠")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    renderWithProviders(<GenerationCard gen={genFixture} termCount={42} />);
    expect(
      screen.getByText("Brainrot, rizz, and skibidi vibes"),
    ).toBeInTheDocument();
  });
});
