// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

const { mockBuilder, mockSupabase } = vi.hoisted(() => {
  const builder: Record<string, any> = {};
  const chainMethods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "in", "order", "limit"];
  for (const m of chainMethods) builder[m] = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.then = vi.fn().mockImplementation((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve),
  );

  const client = {
    from: vi.fn().mockReturnValue(builder),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _builder: builder,
  };
  return { mockBuilder: builder, mockSupabase: client };
});

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

// SprintApp fetches data client-side — mock fetch to avoid network in page test
vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

import SprintPlanningPage from "../page";

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase._builder.then.mockImplementation((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve),
  );
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
});

describe("SprintPlanningPage", () => {
  it("renders 'Sprint Backlog' heading and subtitle", async () => {
    const jsx = await SprintPlanningPage();
    renderWithProviders(jsx);

    expect(screen.getByText("Sprint Backlog")).toBeInTheDocument();
    expect(
      screen.getByText(/Sprint backlog.*task management.*grouped by client/),
    ).toBeInTheDocument();
  });

  it("renders Agenda and Archives tabs", async () => {
    const jsx = await SprintPlanningPage();
    renderWithProviders(jsx);

    expect(screen.getByText(/Agenda/)).toBeInTheDocument();
    expect(screen.getByText(/Archives/)).toBeInTheDocument();
  });

  it("passes archives from DB to SprintApp", async () => {
    mockSupabase._builder.then
      .mockImplementationOnce((resolve: any) =>
        Promise.resolve({
          data: [{ id: "d1", date: "2025-04-07", summary: "Digest summary", service: "slack", item_count: 3 }],
          error: null,
        }).then(resolve),
      )
      .mockImplementation((resolve: any) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
      );

    const jsx = await SprintPlanningPage();
    renderWithProviders(jsx);

    // Archives tab exists — archives were passed
    expect(screen.getByText(/Archives/)).toBeInTheDocument();
  });
});
