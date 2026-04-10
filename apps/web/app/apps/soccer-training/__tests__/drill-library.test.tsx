// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from "vitest";
import React from "react";
globalThis.React = React;
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

import type { Drill } from "../data/drills";
import { DrillLibrary } from "../components/drill-library";

// Stub ResizeObserver (not available in jsdom; required by some Radix primitives)
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

// Small fixture set spanning all difficulties and key categories
const FIXTURE_DRILLS: Drill[] = [
  {
    id: "warmup-test",
    name: "Warmup Drill",
    description: "Dynamic stretching routine for warmup.",
    duration: 10,
    difficulty: "Beginner",
    videoId: "vid-warmup",
    coachingPoints: ["Start slow", "Full range of motion"],
    equipment: ["Open space"],
    categories: ["warmup"],
    position: "both",
  },
  {
    id: "speed-test",
    name: "Speed Ladder Drill",
    description: "Fast footwork using agility ladder.",
    duration: 15,
    difficulty: "Intermediate",
    videoId: "vid-speed",
    coachingPoints: ["Stay on balls of feet", "Drive arms in sync"],
    equipment: ["Agility ladder"],
    categories: ["speed", "agility"],
    position: "both",
  },
  {
    id: "dribbling-test",
    name: "Ball Mastery Challenge",
    description: "Advanced ball mastery for close control.",
    duration: 20,
    difficulty: "Advanced",
    videoId: "vid-dribbling",
    coachingPoints: ["Use all surfaces of both feet"],
    equipment: ["Soccer ball", "4 cones"],
    categories: ["dribbling", "ball-mastery"],
    position: "both",
  },
  {
    id: "finishing-test",
    name: "Clinical Finishing Exercise",
    description: "Shooting drills for clinical finishing.",
    duration: 25,
    difficulty: "Intermediate",
    videoId: "vid-finishing",
    coachingPoints: ["Plant foot pointing at target"],
    equipment: ["Soccer balls", "Goal", "Cones"],
    categories: ["finishing", "shooting"],
    position: "striker",
  },
  {
    id: "strength-test",
    name: "Strength Training Drill",
    description: "Bodyweight exercises for soccer players.",
    duration: 20,
    difficulty: "Beginner",
    videoId: "vid-strength",
    coachingPoints: ["Focus on form over reps"],
    equipment: ["Exercise mat"],
    categories: ["strength", "core"],
    position: "both",
  },
  {
    id: "recovery-test",
    name: "Recovery Stretching Drill",
    description: "Quick stretching for recovery.",
    duration: 10,
    difficulty: "Beginner",
    videoId: "vid-recovery",
    coachingPoints: ["Hold each stretch 20-30 seconds"],
    equipment: ["Exercise mat"],
    categories: ["recovery"],
    position: "both",
  },
  {
    id: "1v1-test",
    name: "1v1 Skills Drill",
    description: "Learn effective 1v1 skills to beat defenders.",
    duration: 20,
    difficulty: "Advanced",
    videoId: "vid-1v1",
    coachingPoints: ["Sell the fake with your body", "Accelerate after move"],
    equipment: ["Soccer ball", "Cones"],
    categories: ["dribbling", "1v1"],
    position: "winger",
  },
];

describe("DrillLibrary — Render", () => {
  it("renders search input", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    expect(
      screen.getByPlaceholderText(/search drills/i),
    ).toBeInTheDocument();
  });

  it("renders 'All Drills' category tab", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    expect(screen.getByRole("button", { name: "All Drills" })).toBeInTheDocument();
  });

  it("renders all category tabs", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    expect(screen.getByRole("button", { name: "Warm-Up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Speed & Agility" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dribbling" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finishing" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Strength" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recovery" })).toBeInTheDocument();
  });

  it("renders all difficulty filter buttons", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beginner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Intermediate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Advanced" })).toBeInTheDocument();
  });

  it("renders all drill cards by name initially", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    for (const drill of FIXTURE_DRILLS) {
      expect(screen.getByText(drill.name)).toBeInTheDocument();
    }
  });
});

describe("DrillLibrary — Search", () => {
  it("filters drill cards by name when typing in search", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    const input = screen.getByPlaceholderText(/search drills/i);
    fireEvent.change(input, { target: { value: "Speed Ladder" } });
    expect(screen.getByText("Speed Ladder Drill")).toBeInTheDocument();
    expect(screen.queryByText("Warmup Drill")).not.toBeInTheDocument();
  });

  it("shows no-results state when search matches nothing", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    const input = screen.getByPlaceholderText(/search drills/i);
    fireEvent.change(input, { target: { value: "xyznonexistentxyz" } });
    expect(
      screen.getByText(/No drills match your filters/i),
    ).toBeInTheDocument();
  });

  it("restores all drills when search input is cleared", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    const input = screen.getByPlaceholderText(/search drills/i);
    fireEvent.change(input, { target: { value: "Speed Ladder" } });
    fireEvent.change(input, { target: { value: "" } });
    for (const drill of FIXTURE_DRILLS) {
      expect(screen.getByText(drill.name)).toBeInTheDocument();
    }
  });
});

describe("DrillLibrary — Category Filter", () => {
  it("shows only warmup drills when Warm-Up tab is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByRole("button", { name: "Warm-Up" }));
    expect(screen.getByText("Warmup Drill")).toBeInTheDocument();
    expect(screen.queryByText("Speed Ladder Drill")).not.toBeInTheDocument();
    expect(screen.queryByText("Ball Mastery Challenge")).not.toBeInTheDocument();
  });

  it("shows only speed/agility drills when Speed & Agility tab is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByRole("button", { name: "Speed & Agility" }));
    expect(screen.getByText("Speed Ladder Drill")).toBeInTheDocument();
    expect(screen.queryByText("Warmup Drill")).not.toBeInTheDocument();
  });

  it("shows dribbling drills when Dribbling tab is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByRole("button", { name: "Dribbling" }));
    expect(screen.getByText("Ball Mastery Challenge")).toBeInTheDocument();
    expect(screen.getByText("1v1 Skills Drill")).toBeInTheDocument();
    expect(screen.queryByText("Speed Ladder Drill")).not.toBeInTheDocument();
  });

  it("restores full list when All Drills tab is clicked after a filter", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByRole("button", { name: "Warm-Up" }));
    fireEvent.click(screen.getByRole("button", { name: "All Drills" }));
    for (const drill of FIXTURE_DRILLS) {
      expect(screen.getByText(drill.name)).toBeInTheDocument();
    }
  });
});

describe("DrillLibrary — Difficulty Filter", () => {
  it("shows only Beginner drills when Beginner is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByRole("button", { name: "Beginner" }));
    expect(screen.getByText("Warmup Drill")).toBeInTheDocument();
    expect(screen.getByText("Strength Training Drill")).toBeInTheDocument();
    expect(screen.getByText("Recovery Stretching Drill")).toBeInTheDocument();
    expect(screen.queryByText("Speed Ladder Drill")).not.toBeInTheDocument();
    expect(screen.queryByText("Ball Mastery Challenge")).not.toBeInTheDocument();
  });

  it("shows only Intermediate drills when Intermediate is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByRole("button", { name: "Intermediate" }));
    expect(screen.getByText("Speed Ladder Drill")).toBeInTheDocument();
    expect(screen.getByText("Clinical Finishing Exercise")).toBeInTheDocument();
    expect(screen.queryByText("Warmup Drill")).not.toBeInTheDocument();
  });

  it("shows only Advanced drills when Advanced is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(screen.getByText("Ball Mastery Challenge")).toBeInTheDocument();
    expect(screen.getByText("1v1 Skills Drill")).toBeInTheDocument();
    expect(screen.queryByText("Warmup Drill")).not.toBeInTheDocument();
  });

  it("restores all drills when All difficulty is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByRole("button", { name: "Beginner" }));
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    for (const drill of FIXTURE_DRILLS) {
      expect(screen.getByText(drill.name)).toBeInTheDocument();
    }
  });
});

describe("DrillLibrary — Combined Filter", () => {
  it("narrows to Dribbling + Advanced together", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByRole("button", { name: "Dribbling" }));
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(screen.getByText("Ball Mastery Challenge")).toBeInTheDocument();
    expect(screen.getByText("1v1 Skills Drill")).toBeInTheDocument();
    expect(screen.queryByText("Speed Ladder Drill")).not.toBeInTheDocument();
    expect(screen.queryByText("Clinical Finishing Exercise")).not.toBeInTheDocument();
  });

  it("shows no results when category + difficulty have no overlap", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    // Warm-Up only has Beginner drills; Advanced should yield nothing
    fireEvent.click(screen.getByRole("button", { name: "Warm-Up" }));
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(
      screen.getByText(/No drills match your filters/i),
    ).toBeInTheDocument();
  });
});

describe("DrillLibrary — Modal Open/Close", () => {
  it("opens modal with drill title when a drill card is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByText("Warmup Drill"));
    // Modal shows drill name in heading
    expect(
      screen.getAllByText("Warmup Drill").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("closes modal when close button is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByText("Warmup Drill"));
    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    // After close the modal heading is gone (only card name remains)
    expect(screen.getAllByText("Warmup Drill").length).toBe(1);
  });

  it("closes modal when overlay backdrop is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByText("Warmup Drill"));
    // The overlay is the fixed backdrop div
    const overlay = document.querySelector(".fixed.inset-0");
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay!);
    expect(screen.getAllByText("Warmup Drill").length).toBe(1);
  });
});

describe("DrillLibrary — Modal Content", () => {
  it("shows drill title, description, difficulty, duration, coaching points, equipment, and YouTube link", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByText("Speed Ladder Drill"));

    // Title appears in modal heading (multiple instances: card + modal)
    expect(
      screen.getAllByText("Speed Ladder Drill").length,
    ).toBeGreaterThanOrEqual(2);

    // Description
    expect(
      screen.getAllByText("Fast footwork using agility ladder.").length,
    ).toBeGreaterThanOrEqual(1);

    // Difficulty badge
    expect(screen.getAllByText("Intermediate").length).toBeGreaterThanOrEqual(1);

    // Duration (15 min appears in card badge and modal badge)
    expect(screen.getAllByText("15 min").length).toBeGreaterThanOrEqual(1);

    // Coaching points
    expect(screen.getByText("Stay on balls of feet")).toBeInTheDocument();
    expect(screen.getByText("Drive arms in sync")).toBeInTheDocument();

    // Equipment
    expect(screen.getAllByText("Agility ladder").length).toBeGreaterThanOrEqual(1);

    // YouTube link button
    expect(
      screen.getByRole("link", { name: /Watch on YouTube/i }),
    ).toBeInTheDocument();
  });
});

describe("DrillLibrary — VideoEmbed", () => {
  it("shows thumbnail image and play button initially", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByText("Speed Ladder Drill"));

    // Play button (aria-label "Play Speed Ladder Drill")
    const playBtn = screen.getByRole("button", { name: /Play Speed Ladder Drill/i });
    expect(playBtn).toBeInTheDocument();

    // iframe should not be present yet
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
  });

  it("swaps thumbnail for iframe when play button is clicked", () => {
    renderWithProviders(<DrillLibrary drills={FIXTURE_DRILLS} />);
    fireEvent.click(screen.getByText("Speed Ladder Drill"));

    const playBtn = screen.getByRole("button", { name: /Play Speed Ladder Drill/i });
    fireEvent.click(playBtn);

    // iframe should now be in the document
    const iframe = document.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe?.src).toContain("vid-speed");
  });
});
