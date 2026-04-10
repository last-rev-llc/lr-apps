// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

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

import { ShoppingListApp } from "../shopping-list/components/shopping-list-app";

describe("ShoppingListApp", () => {
  it("renders empty state when list is empty (fresh localStorage)", () => {
    // localStorage is empty in jsdom test environment
    renderWithProviders(<ShoppingListApp />);

    expect(screen.getByText("List is empty")).toBeInTheDocument();
    expect(screen.getByText("Add items above to get started")).toBeInTheDocument();
  });

  it("renders the page header", () => {
    renderWithProviders(<ShoppingListApp />);

    expect(screen.getByText("🛒 Shopping List")).toBeInTheDocument();
  });

  it("renders add item form controls", () => {
    renderWithProviders(<ShoppingListApp />);

    expect(screen.getByText("Add Item")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Item name…")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Qty")).toBeInTheDocument();
    expect(screen.getByText("+ Add")).toBeInTheDocument();
  });

  it("adds an item and renders it in the list", () => {
    renderWithProviders(<ShoppingListApp />);

    const nameInput = screen.getByPlaceholderText("Item name…");
    fireEvent.change(nameInput, { target: { value: "Apples" } });
    fireEvent.click(screen.getByText("+ Add"));

    expect(screen.getByText("Apples")).toBeInTheDocument();
  });

  it("adds item and renders category filter button", () => {
    renderWithProviders(<ShoppingListApp />);

    const nameInput = screen.getByPlaceholderText("Item name…");
    fireEvent.change(nameInput, { target: { value: "Milk" } });

    // Change category to dairy
    const categorySelect = screen.getByDisplayValue("📦 other");
    fireEvent.change(categorySelect, { target: { value: "dairy" } });
    fireEvent.click(screen.getByText("+ Add"));

    expect(screen.getByText("Milk")).toBeInTheDocument();
    // Category filter button appears for dairy; may also appear in the select option
    expect(screen.getAllByText("🥛 dairy").length).toBeGreaterThan(0);
  });
});
