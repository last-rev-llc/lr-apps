// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import { TravelApp } from "../components/travel-app";
import type { TravelProperty } from "../lib/types";

// Dialog uses ResizeObserver
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

const makeProperty = (
  id: string,
  name: string,
  category: string,
  region: string,
  type: string,
  researched = false,
): TravelProperty => ({
  id,
  name,
  location: `${region} City`,
  region,
  category,
  type,
  description: `Beautiful ${name}`,
  website: null,
  pricing: null,
  photos: null,
  amenities: ["Pool", "Spa"],
  highlights: ["Stunning views"],
  tags: ["luxury"],
  rating: 5,
  researched,
  created_at: "",
  updated_at: "",
});

const MOCK_PROPERTIES: TravelProperty[] = [
  makeProperty("1", "Aman Tokyo", "Hotels & Resorts", "Asia & Middle East", "Hotel", true),
  makeProperty("2", "Soneva Fushi", "Private Retreats & Villas", "South Pacific", "Private Island"),
  makeProperty("3", "Four Seasons Paris", "Hotels & Resorts", "Europe", "Hotel", true),
  makeProperty("4", "Amangiri", "Private Retreats & Villas", "Americas", "Resort"),
  makeProperty("5", "Como Uma Ubud", "Hotels & Resorts", "Asia & Middle East", "Resort"),
];

describe("TravelApp", () => {
  it("renders all properties by default", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    expect(screen.getByText("Aman Tokyo")).toBeInTheDocument();
    expect(screen.getByText("Soneva Fushi")).toBeInTheDocument();
    expect(screen.getByText("Four Seasons Paris")).toBeInTheDocument();
    expect(screen.getByText("Amangiri")).toBeInTheDocument();
    expect(screen.getByText("Como Uma Ubud")).toBeInTheDocument();
  });

  it("shows stats bar with total count", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    const stats = screen.getByText("5");
    expect(stats).toBeInTheDocument();
  });

  it("filters properties by search input", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    const input = screen.getByPlaceholderText("Search properties...");
    fireEvent.change(input, { target: { value: "Tokyo" } });
    expect(screen.getByText("Aman Tokyo")).toBeInTheDocument();
    expect(screen.queryByText("Soneva Fushi")).not.toBeInTheDocument();
    expect(screen.queryByText("Four Seasons Paris")).not.toBeInTheDocument();
  });

  it("shows empty state and clear button when search yields no results", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    const input = screen.getByPlaceholderText("Search properties...");
    fireEvent.change(input, { target: { value: "zzznomatch" } });
    expect(screen.getByText(/No properties match/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear filters/i })).toBeInTheDocument();
  });

  it("clear filters button restores all properties", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    const input = screen.getByPlaceholderText("Search properties...");
    fireEvent.change(input, { target: { value: "zzznomatch" } });
    expect(screen.queryByText("Aman Tokyo")).not.toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: /Clear filters/i });
    fireEvent.click(clearBtn);
    expect(screen.getByText("Aman Tokyo")).toBeInTheDocument();
    expect(screen.getByText("Soneva Fushi")).toBeInTheDocument();
  });

  it("opens modal when a property card is clicked", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    const card = screen.getByRole("button", { name: /Aman Tokyo/i });
    fireEvent.click(card);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows property name and description in modal", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    const card = screen.getByRole("button", { name: /Aman Tokyo/i });
    fireEvent.click(card);
    expect(screen.getByText(/Beautiful Aman Tokyo/i)).toBeInTheDocument();
  });

  it("shows 'Researched' badge for researched properties", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    expect(screen.getAllByText(/✓ Researched/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'Pending' badge for unresearched properties", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    expect(screen.getAllByText(/Pending/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders hero title", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    expect(screen.getByText("🏨 Travel Collection")).toBeInTheDocument();
  });

  it("filters properties by category select", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    const categorySelect = screen.getByLabelText("Category");
    fireEvent.change(categorySelect, { target: { value: "Hotels & Resorts" } });

    expect(screen.getByText("Aman Tokyo")).toBeInTheDocument();
    expect(screen.getByText("Four Seasons Paris")).toBeInTheDocument();
    expect(screen.getByText("Como Uma Ubud")).toBeInTheDocument();
    expect(screen.queryByText("Soneva Fushi")).not.toBeInTheDocument();
    expect(screen.queryByText("Amangiri")).not.toBeInTheDocument();
  });

  it("filters properties by region select", () => {
    renderWithProviders(<TravelApp initialProperties={MOCK_PROPERTIES} />);
    const regionSelect = screen.getByLabelText("Region");
    fireEvent.change(regionSelect, { target: { value: "Europe" } });

    expect(screen.getByText("Four Seasons Paris")).toBeInTheDocument();
    expect(screen.queryByText("Aman Tokyo")).not.toBeInTheDocument();
    expect(screen.queryByText("Soneva Fushi")).not.toBeInTheDocument();
  });
});
