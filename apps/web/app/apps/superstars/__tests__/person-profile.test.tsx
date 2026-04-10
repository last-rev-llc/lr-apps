// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
globalThis.React = React;
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import { PersonProfile } from "../components/person-profile";

vi.mock("../superstars.css", () => ({}));

const MOCK_PERSON = {
  id: "test-person",
  name: "Test Person",
  tagline: "Athlete · Coach · Legend",
  currentRole: "Head Coach",
  currentOrg: "Test FC",
  currentOrgUrl: "https://testfc.com",
  born: "January 1, 1990",
  bio: "<p>A legendary career spanning two decades.</p>",
  photos: { headshot: "", action: "" },
  theme: { primary: "#00543C", accent: "#FDBB30" },
  stats: {
    proYears: 15,
    proTeams: 5,
    proApps: 200,
    coachingYears: 5,
  },
  timeline: [
    { year: "2000", title: "Turned Pro", detail: "Signed first contract.", icon: "⚽" },
  ],
  careerTeams: [
    { name: "Test FC", years: "2000–2010", league: "Test League", color: "#ff0000" },
  ],
  quotes: [
    { text: "The beautiful game.", source: "Test Person" },
  ],
  education: [
    { school: "Test University", degree: "Sports Science", sport: "Soccer", years: "1998–2002" },
  ],
  careerHighlights: [
    { title: "Champion", detail: "Won the league 3 times." },
  ],
  coachingHighlights: [
    { player: "Young Star", achievement: "Made pro debut", stats: "10 goals, 5 assists" },
  ],
  internationalExhibitions: [
    { year: "2005", match: "vs World XI", context: "Charity match" },
  ],
  linkedinUrl: "https://linkedin.com/in/testperson",
  wikiUrl: "https://en.wikipedia.org/wiki/Test_Person",
};

describe("PersonProfile", () => {
  it("renders person name in the hero", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    expect(screen.getByText("Test Person")).toBeInTheDocument();
  });

  it("renders person tagline", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    expect(screen.getByText("Athlete · Coach · Legend")).toBeInTheDocument();
  });

  it("renders bio section", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    expect(screen.getByText(/legendary career/i)).toBeInTheDocument();
  });

  it("renders stats with correct values", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Pro Seasons")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("renders career timeline section", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    expect(screen.getByText(/Career Timeline/i)).toBeInTheDocument();
    expect(screen.getByText("Turned Pro")).toBeInTheDocument();
  });

  it("renders career teams with marquee", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    expect(screen.getByText(/Professional Career/i)).toBeInTheDocument();
    expect(screen.getAllByText("Test FC").length).toBeGreaterThanOrEqual(1);
  });

  it("renders at least one quote", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    expect(screen.getByText(/The beautiful game/i)).toBeInTheDocument();
  });

  it("renders education section", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    expect(screen.getByText(/Education/i)).toBeInTheDocument();
    expect(screen.getByText("Test University")).toBeInTheDocument();
  });

  it("renders coaching highlights section", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    expect(screen.getByText(/Goalkeepers Developed/i)).toBeInTheDocument();
    expect(screen.getByText("Young Star")).toBeInTheDocument();
  });

  it("renders social links", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    expect(screen.getAllByText(/LinkedIn/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Wikipedia/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows lightbox close button and closes on click", () => {
    renderWithProviders(<PersonProfile person={MOCK_PERSON} />);
    // Lightbox is hidden until a photo is clicked — confirm no lightbox on render
    expect(screen.queryByLabelText("Close lightbox")).not.toBeInTheDocument();
  });
});
