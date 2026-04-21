// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
globalThis.React = React;
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("../components/drill-library", () => ({
  DrillLibrary: ({ drills }: { drills: unknown[] }) => (
    <div data-testid="drill-library" data-drill-count={drills.length} />
  ),
}));

import SoccerTrainingPage from "../page";
import { DRILLS } from "../data/drills";

describe("SoccerTrainingPage", () => {
  it("renders hero title 'Soccer Training Drills'", () => {
    renderWithProviders(<SoccerTrainingPage />);
    expect(
      screen.getByRole("heading", { name: /Soccer Training Drills/i }),
    ).toBeInTheDocument();
  });

  it("renders total drill count stat", () => {
    renderWithProviders(<SoccerTrainingPage />);
    expect(screen.getByText(String(DRILLS.length))).toBeInTheDocument();
  });

  it("renders hours stat calculated from DRILLS duration sum", () => {
    renderWithProviders(<SoccerTrainingPage />);
    const totalMinutes = DRILLS.reduce((sum, d) => sum + d.duration, 0);
    const hours = Math.round(totalMinutes / 60);
    expect(screen.getByText(`${hours}h+`)).toBeInTheDocument();
  });

  it("renders category count stat of 7", () => {
    renderWithProviders(<SoccerTrainingPage />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders the 'Drills' label", () => {
    renderWithProviders(<SoccerTrainingPage />);
    expect(screen.getByText("Drills")).toBeInTheDocument();
  });

  it("renders the 'Content' label", () => {
    renderWithProviders(<SoccerTrainingPage />);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders the 'Categories' label", () => {
    renderWithProviders(<SoccerTrainingPage />);
    expect(screen.getByText("Categories")).toBeInTheDocument();
  });

  it("passes the full DRILLS array to DrillLibrary", () => {
    renderWithProviders(<SoccerTrainingPage />);
    const library = screen.getByTestId("drill-library");
    expect(library).toBeInTheDocument();
    expect(library.getAttribute("data-drill-count")).toBe(
      String(DRILLS.length),
    );
  });
});
