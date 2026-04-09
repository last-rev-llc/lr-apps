// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

import CringeRizzlerAboutPage from "../about/page";

describe("CringeRizzlerAboutPage", () => {
  it("renders the page hero heading", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    expect(screen.getByText(/Embarrass Gen Alpha/i)).toBeInTheDocument();
  });

  it("renders all 6 feature sections", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    expect(screen.getByText("AI Phrase Generator")).toBeInTheDocument();
    expect(screen.getByText("Meme Generator")).toBeInTheDocument();
    expect(screen.getByText("Slang Glossary")).toBeInTheDocument();
    expect(screen.getByText("Copy & Share")).toBeInTheDocument();
    expect(screen.getByText("Vibe Scores")).toBeInTheDocument();
    expect(screen.getByText("Category Filters")).toBeInTheDocument();
  });

  it("renders all 3 use-case sections", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    expect(screen.getByText("Gen X Parents")).toBeInTheDocument();
    expect(screen.getByText("Boomer Grandparents")).toBeInTheDocument();
    expect(screen.getByText("Cool Coworkers")).toBeInTheDocument();
  });

  it("renders the 3-step how-it-works steps", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    expect(screen.getByText("Generate")).toBeInTheDocument();
    expect(screen.getByText("Study")).toBeInTheDocument();
    expect(screen.getByText("Deploy")).toBeInTheDocument();
  });

  it("renders CTA links to the app", () => {
    renderWithProviders(<CringeRizzlerAboutPage />);
    const links = screen.getAllByRole("link", { name: /Start the Cringe/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/apps/cringe-rizzler");
  });
});
