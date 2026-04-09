// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@repo/ui", () => ({
  Card: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  CardContent: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  Button: ({
    children,
    asChild,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) => (
    <button {...rest}>{children}</button>
  ),
}));

import CringeRizzlerAboutPage from "../page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CringeRizzlerAboutPage", () => {
  it("renders the hero heading", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    expect(screen.getByText(/Embarrass Gen Alpha/)).toBeTruthy();
    expect(screen.getByText(/One Phrase at a Time/)).toBeTruthy();
  });

  it("renders all 6 feature cards", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    expect(screen.getByText("AI Phrase Generator")).toBeTruthy();
    expect(screen.getByText("Meme Generator")).toBeTruthy();
    expect(screen.getByText("Slang Glossary")).toBeTruthy();
    expect(screen.getByText("Copy & Share")).toBeTruthy();
    expect(screen.getByText("Vibe Scores")).toBeTruthy();
    expect(screen.getByText("Category Filters")).toBeTruthy();
  });

  it("renders how-it-works steps", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    expect(screen.getByText("Generate")).toBeTruthy();
    expect(screen.getByText("Study")).toBeTruthy();
    expect(screen.getByText("Deploy")).toBeTruthy();
  });

  it("renders use cases section", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    expect(screen.getByText("Gen X Parents")).toBeTruthy();
    expect(screen.getByText("Boomer Grandparents")).toBeTruthy();
    expect(screen.getByText("Cool Coworkers")).toBeTruthy();
  });

  it("renders CTA buttons linking to the app", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    const ctaButtons = screen.getAllByText(/Start the Cringe/);
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders section headings", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    expect(screen.getByText(/Your Dad Joke Arsenal/)).toBeTruthy();
    expect(screen.getByText(/Three Steps to/)).toBeTruthy();
    expect(screen.getByText(/Built for Parents/)).toBeTruthy();
    expect(screen.getByText(/Ready to Be the Most/)).toBeTruthy();
  });
});
