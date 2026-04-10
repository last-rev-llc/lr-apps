// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
globalThis.React = React;
import { renderWithProviders, screen, fireEvent, act } from "@repo/test-utils";
import { LeadsApp } from "../components/leads-app";
import type { Lead } from "../lib/types";

const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    name: "Acme Corp",
    domain: "acme.com",
    industry: "SaaS",
    size: "50-200",
    fitScore: 9,
    fitReasons: ["Uses Contentful", "React-based"],
    talkingPoints: ["Cost savings", "Migration path"],
    people: [{ name: "Jane Smith", title: "CTO", decisionMaker: true }],
    news: [],
    techStack: { framework: "Next.js", cms: "Contentful" },
    socialLinks: {},
    stage: "prospect",
  },
  {
    id: "2",
    name: "Beta Inc",
    domain: "beta.io",
    fitScore: 5,
    stage: "qualified",
    people: [],
    news: [],
    techStack: {},
    socialLinks: {},
  },
  {
    id: "3",
    name: "Gamma LLC",
    domain: "gamma.dev",
    fitScore: 3,
    stage: null,
    people: [],
    news: [],
    techStack: {},
    socialLinks: {},
  },
];

describe("LeadsApp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders company names from initial leads", () => {
    renderWithProviders(<LeadsApp initialLeads={MOCK_LEADS} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    expect(screen.getByText("Gamma LLC")).toBeInTheDocument();
  });

  it("shows lead count in header", () => {
    renderWithProviders(<LeadsApp initialLeads={MOCK_LEADS} />);
    expect(screen.getByText(/3 companies/)).toBeInTheDocument();
  });

  it("renders List and Pipeline tabs", () => {
    renderWithProviders(<LeadsApp initialLeads={MOCK_LEADS} />);
    expect(screen.getByRole("tab", { name: /List/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Pipeline/i })).toBeInTheDocument();
  });

  it("shows pipeline stage columns when Pipeline tab is clicked", () => {
    renderWithProviders(<LeadsApp initialLeads={MOCK_LEADS} />);
    // Radix Tabs activates on mouseDown, not click
    fireEvent.mouseDown(screen.getByRole("tab", { name: /Pipeline/i }));
    expect(screen.getByText("Prospect")).toBeInTheDocument();
    expect(screen.getByText("Outreach")).toBeInTheDocument();
    expect(screen.getByText("Qualified")).toBeInTheDocument();
    expect(screen.getByText("Proposal")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("filters leads by search query", async () => {
    renderWithProviders(<LeadsApp initialLeads={MOCK_LEADS} />);
    const searchInput = screen.getByPlaceholderText(
      /Search companies, people, domains/i,
    );
    fireEvent.change(searchInput, { target: { value: "Acme" } });
    await act(async () => {
      vi.runAllTimers();
    });
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Inc")).not.toBeInTheDocument();
  });

  it("shows empty state when no leads match search", async () => {
    renderWithProviders(<LeadsApp initialLeads={MOCK_LEADS} />);
    const searchInput = screen.getByPlaceholderText(
      /Search companies, people, domains/i,
    );
    fireEvent.change(searchInput, { target: { value: "zzznomatch" } });
    await act(async () => {
      vi.runAllTimers();
    });
    expect(screen.getByText("No leads match your search")).toBeInTheDocument();
  });

  it("renders empty state with no leads", () => {
    renderWithProviders(<LeadsApp initialLeads={[]} />);
    expect(screen.getByText("No leads match your search")).toBeInTheDocument();
  });
});
