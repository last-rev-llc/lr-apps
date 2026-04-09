// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderWithProviders, screen } from "@repo/test-utils";
import type { GenerationConfig } from "../../lib/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@repo/ui", () => ({
  Card: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  CardHeader: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  CardContent: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  Badge: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => (
    <span {...rest}>{children}</span>
  ),
}));

import { GenerationCard } from "../generation-card";

const genZ: GenerationConfig = {
  slug: "gen-z",
  name: "Gen Z",
  era: "1997–2012",
  color: "#06b6d4",
  emoji: "💅",
  tagline: "No cap, it's giving main character energy",
};

describe("GenerationCard", () => {
  it("renders gen name", () => {
    renderWithProviders(<GenerationCard gen={genZ} termCount={42} />);
    expect(screen.getByText("Gen Z")).toBeTruthy();
  });

  it("renders emoji", () => {
    renderWithProviders(<GenerationCard gen={genZ} termCount={42} />);
    expect(screen.getByText("💅")).toBeTruthy();
  });

  it("renders era badge", () => {
    renderWithProviders(<GenerationCard gen={genZ} termCount={42} />);
    expect(screen.getByText("1997–2012")).toBeTruthy();
  });

  it("renders tagline", () => {
    renderWithProviders(<GenerationCard gen={genZ} termCount={42} />);
    expect(screen.getByText("No cap, it's giving main character energy")).toBeTruthy();
  });

  it("renders term count", () => {
    renderWithProviders(<GenerationCard gen={genZ} termCount={42} />);
    expect(screen.getByText("42 terms")).toBeTruthy();
  });

  it("links to correct generation page", () => {
    renderWithProviders(<GenerationCard gen={genZ} termCount={42} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/apps/generations/gen-z");
  });
});
