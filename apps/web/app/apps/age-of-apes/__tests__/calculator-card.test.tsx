// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...rest }, children),
}));

import { CalculatorCard } from "../components/calculator-card";

const calc = {
  slug: "buildings" as const,
  label: "Buildings",
  description: "Multi-level upgrade costs and time.",
  icon: "🏗️",
  color: "var(--color-accent)",
};

describe("CalculatorCard", () => {
  it("renders the calculator label, description, and link href", () => {
    renderWithProviders(<CalculatorCard calc={calc} />);
    expect(screen.getByText("Buildings")).toBeInTheDocument();
    expect(screen.getByText("Multi-level upgrade costs and time.")).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/apps/age-of-apes/buildings");
  });

  it("renders the calculator icon and 'Open Calculator' affordance", () => {
    renderWithProviders(<CalculatorCard calc={calc} />);
    expect(screen.getByText("🏗️")).toBeInTheDocument();
    expect(screen.getByText(/Open Calculator/)).toBeInTheDocument();
  });
});
