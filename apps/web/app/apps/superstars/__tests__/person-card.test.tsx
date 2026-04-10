// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
globalThis.React = React;
import { renderWithProviders, screen } from "@repo/test-utils";
import { PersonCard } from "../components/person-card";

vi.mock("../superstars.css", () => ({}));

const MOCK_PERSON = {
  id: "test-person",
  name: "Test Person",
  tagline: "Athlete · Coach · Legend",
  currentRole: "Head Coach",
  currentOrg: "Test FC",
  photos: {
    headshot: "",
  },
  theme: {
    primary: "#00543C",
    accent: "#FDBB30",
  },
};

describe("PersonCard", () => {
  it("renders person name", () => {
    renderWithProviders(<PersonCard person={MOCK_PERSON} />);
    expect(screen.getByText("Test Person")).toBeInTheDocument();
  });

  it("renders person tagline", () => {
    renderWithProviders(<PersonCard person={MOCK_PERSON} />);
    expect(screen.getByText("Athlete · Coach · Legend")).toBeInTheDocument();
  });

  it("renders person role", () => {
    renderWithProviders(<PersonCard person={MOCK_PERSON} />);
    expect(screen.getByText("Head Coach")).toBeInTheDocument();
  });

  it("renders person org", () => {
    renderWithProviders(<PersonCard person={MOCK_PERSON} />);
    expect(screen.getByText(/Test FC/)).toBeInTheDocument();
  });

  it("links to the correct person profile route", () => {
    renderWithProviders(<PersonCard person={MOCK_PERSON} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toContain("test-person");
  });

  it("shows emoji avatar when no headshot photo", () => {
    const person = { ...MOCK_PERSON, photos: {} };
    renderWithProviders(<PersonCard person={person} />);
    expect(screen.getByText("⭐")).toBeInTheDocument();
  });

  it("renders View Profile text", () => {
    renderWithProviders(<PersonCard person={MOCK_PERSON} />);
    expect(screen.getByText(/View Profile/)).toBeInTheDocument();
  });
});
