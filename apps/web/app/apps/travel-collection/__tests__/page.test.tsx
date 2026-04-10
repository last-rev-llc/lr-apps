// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("../lib/queries", () => ({
  getProperties: vi.fn().mockResolvedValue([
    {
      id: "1",
      name: "Aman Tokyo",
      location: "Tokyo, Japan",
      region: "Asia Pacific",
      category: "Urban Retreat",
      type: "Hotel",
      description: "Minimalist sanctuary above the city.",
      website: null,
      pricing: null,
      photos: null,
      amenities: null,
      highlights: null,
      tags: null,
      rating: null,
      researched: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "2",
      name: "Soneva Fushi",
      location: "Maldives",
      region: "Indian Ocean",
      category: "Island Escape",
      type: "Private Island",
      description: "No shoes, no news, pure luxury.",
      website: null,
      pricing: null,
      photos: null,
      amenities: null,
      highlights: null,
      tags: null,
      rating: null,
      researched: false,
      created_at: "",
      updated_at: "",
    },
  ]),
}));

vi.mock("../components/travel-app", () => ({
  TravelApp: ({ initialProperties }: { initialProperties: unknown[] }) => (
    <div data-testid="travel-app">properties: {initialProperties.length}</div>
  ),
}));

import TravelCollectionPage from "../page";

describe("TravelCollectionPage", () => {
  it("passes fetched properties to TravelApp", async () => {
    const jsx = await TravelCollectionPage();
    renderWithProviders(jsx);
    expect(screen.getByTestId("travel-app")).toHaveTextContent("properties: 2");
  });

  it("renders without auth requirement (public app)", async () => {
    // No requireAccess mock needed — travel-collection has no auth gate
    const jsx = await TravelCollectionPage();
    expect(jsx).toBeTruthy();
    renderWithProviders(jsx);
    expect(screen.getByTestId("travel-app")).toBeInTheDocument();
  });
});
