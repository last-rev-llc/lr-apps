// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import { GENERATIONS } from "../lib/generations";

// Mock next/navigation notFound
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("Not found");
  }),
}));

// Mock the SlangApp component
vi.mock("../components/slang-app", () => ({
  SlangApp: ({ terms, gen }: any) => (
    <div data-testid="slang-app">
      <span data-testid="gen-name">{gen.name}</span>
      <span data-testid="term-count">{terms.length}</span>
    </div>
  ),
}));

// Mock dynamic JSON imports
vi.mock("../data/gen-alpha.json", () => ({
  default: [
    {
      id: "rizz",
      term: "Rizz",
      definition: "Charisma",
      example: "He has rizz",
      category: "compliment",
      vibeScore: 10,
      origin: "Internet",
      era: "2022-present",
      aliases: [],
    },
  ],
}));

import { generateStaticParams } from "../[gen]/page";

describe("generateStaticParams", () => {
  it("returns one entry per generation", async () => {
    const params = await generateStaticParams();
    expect(params).toHaveLength(GENERATIONS.length);
  });

  it("returns all 6 generation slugs", async () => {
    const params = await generateStaticParams();
    const slugs = params.map((p) => p.gen);

    expect(slugs).toContain("gen-alpha");
    expect(slugs).toContain("gen-z");
    expect(slugs).toContain("gen-y");
    expect(slugs).toContain("gen-x");
    expect(slugs).toContain("gen-boomers");
    expect(slugs).toContain("gen-silent");
  });

  it("each entry has a 'gen' key", async () => {
    const params = await generateStaticParams();
    for (const p of params) {
      expect(p).toHaveProperty("gen");
    }
  });
});

describe("GenPage", () => {
  it("renders SlangApp with correct generation and terms", async () => {
    const { default: GenPage } = await import("../[gen]/page");
    const jsx = await GenPage({ params: Promise.resolve({ gen: "gen-alpha" }) });
    renderWithProviders(jsx);

    expect(screen.getByTestId("slang-app")).toBeInTheDocument();
    expect(screen.getByTestId("gen-name")).toHaveTextContent("Gen Alpha");
    expect(screen.getByTestId("term-count")).toHaveTextContent("1");
  });

  it("calls notFound for an unknown generation slug", async () => {
    const { notFound } = await import("next/navigation");
    const { default: GenPage } = await import("../[gen]/page");

    await expect(
      GenPage({ params: Promise.resolve({ gen: "gen-unknown" }) }),
    ).rejects.toThrow("Not found");

    expect(notFound).toHaveBeenCalled();
  });
});
