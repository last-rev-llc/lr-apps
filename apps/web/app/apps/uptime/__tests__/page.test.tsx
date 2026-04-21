// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "@repo/test-utils";
import { renderWithProviders, screen } from "@repo/test-utils";
import type { Site } from "../lib/types";

const { mockBuilder, mockSupabase } = vi.hoisted(() => {
  const builder: Record<string, any> = {};
  const chainMethods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "in", "order", "limit"];
  for (const m of chainMethods) builder[m] = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue({ data: [], error: null });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: [], error: null });
  builder.then = vi.fn().mockImplementation((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve),
  );

  const client = {
    from: vi.fn().mockReturnValue(builder),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _builder: builder,
  };
  return { mockBuilder: builder, mockSupabase: client };
});

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

import UptimePage from "../page";

function makeSite(overrides: Partial<Site> = {}): Site {
  return {
    id: "site-1",
    name: "Marketing Site",
    url: "https://lastrev.com",
    status: "up",
    responseTimeMs: 120,
    uptimePercent: 99.9,
    history: [
      { date: "2025-04-07", status: "up", responseTimeMs: 110 },
      { date: "2025-04-06", status: "up", responseTimeMs: 130 },
      { date: "2025-04-05", status: "down", responseTimeMs: undefined },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UptimePage", () => {
  describe("status banner", () => {
    it("shows 'All Systems Operational' when all sites are up", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({
          data: [makeSite(), makeSite({ id: "site-2", name: "Docs Site" })],
          error: null,
        }).then(resolve),
      );

      const jsx = await UptimePage();
      renderWithProviders(jsx);

      expect(screen.getByText("All Systems Operational")).toBeInTheDocument();
    });

    it("shows issue count when some sites are not up", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({
          data: [
            makeSite(),
            makeSite({ id: "site-2", name: "API", status: "down" }),
            makeSite({ id: "site-3", name: "CDN", status: "degraded" }),
          ],
          error: null,
        }).then(resolve),
      );

      const jsx = await UptimePage();
      renderWithProviders(jsx);

      expect(
        screen.getByText(/2 Systems Experiencing Issues/),
      ).toBeInTheDocument();
    });

    it("shows singular 'System' when exactly one site has issues", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({
          data: [
            makeSite(),
            makeSite({ id: "site-2", name: "API", status: "down" }),
          ],
          error: null,
        }).then(resolve),
      );

      const jsx = await UptimePage();
      renderWithProviders(jsx);

      expect(
        screen.getByText(/1 System Experiencing Issues/),
      ).toBeInTheDocument();
    });
  });

  describe("site list", () => {
    it("renders site names and URLs", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({
          data: [
            makeSite(),
            makeSite({ id: "site-2", name: "Docs Site", url: "https://docs.lastrev.com" }),
          ],
          error: null,
        }).then(resolve),
      );

      const jsx = await UptimePage();
      renderWithProviders(jsx);

      expect(screen.getByText("Marketing Site")).toBeInTheDocument();
      expect(screen.getByText("https://lastrev.com")).toBeInTheDocument();
      expect(screen.getByText("Docs Site")).toBeInTheDocument();
      expect(screen.getByText("https://docs.lastrev.com")).toBeInTheDocument();
    });

    it("renders correct status labels for each status", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({
          data: [
            makeSite({ id: "s1", name: "Site A", status: "up" }),
            makeSite({ id: "s2", name: "Site B", status: "down" }),
            makeSite({ id: "s3", name: "Site C", status: "degraded" }),
          ],
          error: null,
        }).then(resolve),
      );

      const jsx = await UptimePage();
      renderWithProviders(jsx);

      expect(screen.getByText("Operational")).toBeInTheDocument();
      expect(screen.getByText("Down")).toBeInTheDocument();
      expect(screen.getByText("Degraded")).toBeInTheDocument();
    });

    it("renders response time and uptime percentage", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({
          data: [makeSite({ responseTimeMs: 250, uptimePercent: 98.5 })],
          error: null,
        }).then(resolve),
      );

      const jsx = await UptimePage();
      renderWithProviders(jsx);

      expect(screen.getByText("250ms")).toBeInTheDocument();
      expect(screen.getByText("98.5%")).toBeInTheDocument();
    });

    it("shows Unknown label for unrecognized status", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({
          data: [makeSite({ status: "maintenance" as Site["status"] })],
          error: null,
        }).then(resolve),
      );

      const jsx = await UptimePage();
      renderWithProviders(jsx);

      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });
  });

  describe("history chart (UptimeBars)", () => {
    it("renders bars with title attributes containing date and status", async () => {
      const history = [
        { date: "2025-04-07", status: "up" as const, responseTimeMs: 100 },
        { date: "2025-04-06", status: "down" as const },
      ];
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({
          data: [makeSite({ history })],
          error: null,
        }).then(resolve),
      );

      const jsx = await UptimePage();
      const { container } = renderWithProviders(jsx);

      // Bars are reversed for display (oldest first)
      const bars = container.querySelectorAll("[title]");
      const titles = Array.from(bars).map((b) => b.getAttribute("title"));

      expect(titles).toContain("2025-04-06: down");
      expect(titles).toContain("2025-04-07: up (100ms)");
    });

    it("renders correct color classes for bar statuses", async () => {
      const history = [
        { date: "2025-04-07", status: "up" as const },
        { date: "2025-04-06", status: "down" as const },
        { date: "2025-04-05", status: "degraded" as const },
      ];
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({
          data: [makeSite({ history })],
          error: null,
        }).then(resolve),
      );

      const jsx = await UptimePage();
      const { container } = renderWithProviders(jsx);

      const bars = container.querySelectorAll("[title]");
      const classes = Array.from(bars).map((b) => b.className);

      expect(classes.some((c) => c.includes("bg-green"))).toBe(true);
      expect(classes.some((c) => c.includes("bg-red"))).toBe(true);
      expect(classes.some((c) => c.includes("bg-yellow"))).toBe(true);
    });

    it("renders no bars when site has no history", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({
          data: [makeSite({ history: [] })],
          error: null,
        }).then(resolve),
      );

      const jsx = await UptimePage();
      const { container } = renderWithProviders(jsx);

      // UptimeBars returns null for empty history, so no bar container
      const barContainers = container.querySelectorAll(".flex.gap-0\\.5");
      expect(barContainers).toHaveLength(0);
    });
  });

  describe("empty state", () => {
    it("renders empty state when no sites returned", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
      );

      const jsx = await UptimePage();
      renderWithProviders(jsx);

      expect(
        screen.getByText("No sites are being monitored yet."),
      ).toBeInTheDocument();
    });

    it("still shows All Systems Operational banner with no sites", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
      );

      const jsx = await UptimePage();
      renderWithProviders(jsx);

      expect(screen.getByText("All Systems Operational")).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("renders empty state when supabase returns an error", async () => {
      mockSupabase._builder.then.mockImplementation((resolve: Function) =>
        Promise.resolve({ data: null, error: { message: "DB error" } }).then(resolve),
      );

      const jsx = await UptimePage();
      renderWithProviders(jsx);

      expect(
        screen.getByText("No sites are being monitored yet."),
      ).toBeInTheDocument();
    });
  });
});
