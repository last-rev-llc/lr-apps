// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import ChangelogPage from "../changelog/page";

describe("ChangelogPage", () => {
  it("renders 'Changelog' heading", () => {
    renderWithProviders(<ChangelogPage />);

    expect(screen.getByText("Changelog")).toBeInTheDocument();
  });

  it("renders all 3 version entries", () => {
    renderWithProviders(<ChangelogPage />);

    expect(screen.getByText(/v3\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText(/v2\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
  });
});
