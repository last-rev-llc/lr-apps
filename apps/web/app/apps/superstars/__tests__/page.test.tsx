// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
globalThis.React = React;
import { renderWithProviders, screen } from "@repo/test-utils";

// Stub superstars.css
vi.mock("../superstars.css", () => ({}));

import SuperstarsPage from "../page";
import peopleData from "../data/people.json";

describe("SuperstarsPage", () => {
  it("renders all people names from data", () => {
    renderWithProviders(<SuperstarsPage />);
    for (const person of peopleData as Array<{ id: string; name: string }>) {
      expect(screen.getAllByText(person.name).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("renders a link to each person profile", () => {
    renderWithProviders(<SuperstarsPage />);
    for (const person of peopleData as Array<{ id: string; name: string }>) {
      const links = screen.getAllByRole("link");
      const profileLink = links.find((l) =>
        l.getAttribute("href")?.includes(person.id),
      );
      expect(profileLink).toBeTruthy();
    }
  });

  it("renders page heading", () => {
    renderWithProviders(<SuperstarsPage />);
    expect(screen.getByText(/Superstars/i)).toBeInTheDocument();
  });

  it("renders 'View Profile' prompt on cards", () => {
    renderWithProviders(<SuperstarsPage />);
    const viewProfileLinks = screen.getAllByText(/View.*Profile/i);
    expect(viewProfileLinks.length).toBeGreaterThanOrEqual(1);
  });
});
