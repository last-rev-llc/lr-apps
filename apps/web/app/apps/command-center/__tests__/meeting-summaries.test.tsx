// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(() => {
      callback([{ isIntersecting: true }], {});
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { MeetingsApp } from "../meeting-summaries/components/meetings-app";
import type { ZoomTranscript } from "../meeting-summaries/lib/types";

// Use dates within the last 30 days so default rangeFilter="30" shows them
const RECENT_DATE = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

const FIXTURE_MEETINGS: ZoomTranscript[] = [
  {
    id: "m1",
    topic: "Q1 Planning Session",
    start_time: RECENT_DATE,
    duration: 60,
    summary: "Planned Q1 roadmap and assigned owners.",
    client_id: "acme",
    sentiment: "productive",
    attendees: ["Alice", "Bob"],
    action_items: [{ action: "Draft roadmap doc", owner: "Alice", priority: "high" }],
    decisions: ["Proceed with new product line"],
  },
  {
    id: "m2",
    topic: "Design Review",
    start_time: RECENT_DATE,
    duration: 45,
    summary: "Reviewed wireframes and gave feedback.",
    client_id: "globex",
    sentiment: "neutral",
    attendees: ["Carol", "Dave"],
    action_items: [],
    decisions: [],
  },
];

describe("MeetingsApp", () => {
  it("renders EmptyState when no meetings match the date range", () => {
    renderWithProviders(<MeetingsApp initialMeetings={[]} />);
    expect(screen.getByText("No meetings found")).toBeInTheDocument();
  });

  it("renders meeting topic titles when meetings are provided", () => {
    renderWithProviders(<MeetingsApp initialMeetings={FIXTURE_MEETINGS} />);
    expect(screen.getByText("Q1 Planning Session")).toBeInTheDocument();
    expect(screen.getByText("Design Review")).toBeInTheDocument();
  });

  it("renders client_id badges for meetings with a client", () => {
    renderWithProviders(<MeetingsApp initialMeetings={FIXTURE_MEETINGS} />);
    expect(screen.getByText("acme")).toBeInTheDocument();
    expect(screen.getByText("globex")).toBeInTheDocument();
  });

  it("renders sentiment badges for meetings", () => {
    renderWithProviders(<MeetingsApp initialMeetings={FIXTURE_MEETINGS} />);
    expect(screen.getByText("productive")).toBeInTheDocument();
    expect(screen.getByText("neutral")).toBeInTheDocument();
  });
});
