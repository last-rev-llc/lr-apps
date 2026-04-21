// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { act } from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import { CalculatorApp } from "../components/calculator-app";
import type {
  BuildingsData,
  ResearchData,
  TroopsData,
  FightersData,
  MechsData,
  EquipmentData,
} from "../lib/types";

// Empty data — only the time calculator is exercised here, which needs no data.
const emptyBuildings: BuildingsData = {};
const emptyResearch: ResearchData = { categories: {} };
const emptyTroops: TroopsData = { types: [], tiers: {} };
const emptyFighters: FightersData = { experience: {}, medals: {}, types: {} };
const emptyMechs: MechsData = {};
const emptyEquipment: EquipmentData = { slots: [], rarities: {} };

function renderTimeCalc() {
  return renderWithProviders(
    <CalculatorApp
      slug="time"
      label="Time"
      color="var(--color-orange)"
      buildings={emptyBuildings}
      research={emptyResearch}
      troops={emptyTroops}
      fighters={emptyFighters}
      mechs={emptyMechs}
      equipment={emptyEquipment}
    />,
  );
}

describe("CalculatorApp — Time calculator", () => {
  it("renders the calculator heading and Calculate button", () => {
    renderTimeCalc();
    expect(screen.getByText(/Time Calculator/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Calculate/ })).toBeInTheDocument();
  });

  it("renders all five duration inputs", () => {
    renderTimeCalc();
    expect(screen.getByText("Days")).toBeInTheDocument();
    expect(screen.getByText("Hours")).toBeInTheDocument();
    expect(screen.getByText("Minutes")).toBeInTheDocument();
    expect(screen.getByText("Seconds")).toBeInTheDocument();
    expect(screen.getByText("Speed %")).toBeInTheDocument();
  });

  it("computes results and renders ResultGrid items after clicking Calculate", async () => {
    renderTimeCalc();

    // No results before clicking
    expect(screen.queryByText("Original Time")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Calculate/ }));
    });

    expect(screen.getByText("Original Time")).toBeInTheDocument();
    expect(screen.getByText("Actual Time")).toBeInTheDocument();
    expect(screen.getByText("Time Saved")).toBeInTheDocument();
    expect(screen.getByText("Speed Bonus")).toBeInTheDocument();
  });
});
