import { describe, it, expect } from "vitest";
import { computeOverviewStats } from "../queries";
import type { Client } from "../types";

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "default",
    name: "Default Client",
    ...overrides,
  };
}

describe("computeOverviewStats", () => {
  it("returns correct totals for multiple clients", () => {
    const clients: Client[] = [
      makeClient({
        id: "c1",
        name: "Acme",
        github: { openPRs: 5 },
        contacts: [{ name: "A", email: "a@a.com" }, { name: "B", email: "b@b.com" }],
        jira: { openTickets: 10 },
      }),
      makeClient({
        id: "c2",
        name: "Beta",
        github: { openPRs: 3 },
        contacts: [{ name: "C", email: "c@c.com" }],
        jira: { openTickets: 7 },
      }),
    ];

    const stats = computeOverviewStats(clients);

    expect(stats.total).toBe(2);
    expect(stats.totalPRs).toBe(8);
    expect(stats.totalContacts).toBe(3);
    expect(stats.totalJiraTickets).toBe(17);
  });

  it("returns zeros for an empty array", () => {
    const stats = computeOverviewStats([]);

    expect(stats.total).toBe(0);
    expect(stats.totalPRs).toBe(0);
    expect(stats.totalContacts).toBe(0);
    expect(stats.totalJiraTickets).toBe(0);
  });

  it("handles clients with missing optional fields", () => {
    const clients: Client[] = [
      makeClient({ id: "c1", name: "Minimal" }),
      makeClient({
        id: "c2",
        name: "Partial",
        github: undefined,
        contacts: undefined,
        jira: undefined,
      }),
    ];

    const stats = computeOverviewStats(clients);

    expect(stats.total).toBe(2);
    expect(stats.totalPRs).toBe(0);
    expect(stats.totalContacts).toBe(0);
    expect(stats.totalJiraTickets).toBe(0);
  });

  it("handles clients with null github/jira fields", () => {
    const clients: Client[] = [
      makeClient({
        id: "c1",
        github: null,
        contacts: [],
        jira: null,
      }),
    ];

    const stats = computeOverviewStats(clients);

    expect(stats.total).toBe(1);
    expect(stats.totalPRs).toBe(0);
    expect(stats.totalContacts).toBe(0);
    expect(stats.totalJiraTickets).toBe(0);
  });

  it("handles a single client with large numbers", () => {
    const clients: Client[] = [
      makeClient({
        id: "c1",
        github: { openPRs: 100 },
        contacts: Array.from({ length: 50 }, (_, i) => ({ name: `Contact ${i}` })),
        jira: { openTickets: 200 },
      }),
    ];

    const stats = computeOverviewStats(clients);

    expect(stats.total).toBe(1);
    expect(stats.totalPRs).toBe(100);
    expect(stats.totalContacts).toBe(50);
    expect(stats.totalJiraTickets).toBe(200);
  });
});
