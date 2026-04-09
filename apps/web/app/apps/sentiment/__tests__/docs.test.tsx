// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import DocsPage from "../docs/page";

describe("DocsPage", () => {
  it("renders 'Documentation' heading", () => {
    renderWithProviders(<DocsPage />);

    expect(screen.getByText("Documentation")).toBeInTheDocument();
  });

  it("renders all 3 section headings", () => {
    renderWithProviders(<DocsPage />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Data Schema")).toBeInTheDocument();
    expect(screen.getByText("Scoring Guide")).toBeInTheDocument();
  });

  it("renders scoring range entries", () => {
    renderWithProviders(<DocsPage />);

    expect(screen.getByText("9-10:")).toBeInTheDocument();
    expect(screen.getByText("7-8:")).toBeInTheDocument();
    expect(screen.getByText("5-6:")).toBeInTheDocument();
    expect(screen.getByText("3-4:")).toBeInTheDocument();
    expect(screen.getByText("1-2:")).toBeInTheDocument();
  });
});
