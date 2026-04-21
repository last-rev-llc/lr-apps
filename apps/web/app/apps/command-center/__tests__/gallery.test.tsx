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

import { GalleryApp } from "../gallery/components/gallery-app";
import type { MediaItem } from "../gallery/lib/types";

const FIXTURE_ITEMS: MediaItem[] = [
  {
    id: "m1",
    name: "Hero Banner",
    type: "Image",
    file: "https://example.com/hero.png",
    tags: ["branding", "hero"],
    created: "2024-01-15T10:00:00Z",
  },
  {
    id: "m2",
    name: "Product Demo",
    type: "Video",
    file: "https://example.com/demo.mp4",
    tags: ["product", "demo"],
    created: "2024-02-20T12:00:00Z",
  },
  {
    id: "m3",
    name: "Logo Animation",
    type: "GIF",
    file: "https://example.com/logo.gif",
    tags: ["branding", "animation"],
    created: "2024-03-01T09:00:00Z",
  },
];

describe("GalleryApp", () => {
  it("renders EmptyState when no items match the filter", () => {
    renderWithProviders(<GalleryApp initialItems={[]} />);
    expect(screen.getByText("No media found")).toBeInTheDocument();
  });

  it("renders media item names when items are provided", () => {
    renderWithProviders(<GalleryApp initialItems={FIXTURE_ITEMS} />);
    expect(screen.getByText("Hero Banner")).toBeInTheDocument();
    expect(screen.getByText("Product Demo")).toBeInTheDocument();
    expect(screen.getByText("Logo Animation")).toBeInTheDocument();
  });

  it("renders type badges for each media item", () => {
    renderWithProviders(<GalleryApp initialItems={FIXTURE_ITEMS} />);
    // MediaType values are "Image", "Video", "GIF" (not uppercase)
    expect(screen.getAllByText("Image").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Video").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GIF").length).toBeGreaterThan(0);
  });

  it("renders correct item count in header", () => {
    renderWithProviders(<GalleryApp initialItems={FIXTURE_ITEMS} />);
    expect(screen.getByText("Media Gallery")).toBeInTheDocument();
    // "3 items" may appear in multiple places (subtitle and filter area)
    expect(screen.getAllByText(/3 items/).length).toBeGreaterThan(0);
  });
});
