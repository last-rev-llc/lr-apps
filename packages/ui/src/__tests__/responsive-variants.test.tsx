import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Topbar } from "../components/topbar";
import { AppNav } from "../components/app-nav";
import { Card, CardContent, CardHeader } from "../components/card";
import { DataGrid, type DataGridColumn } from "../components/data-grid";
import { SlideDeck } from "../components/slide-deck";

describe("Topbar — mobile hamburger", () => {
  it("renders title and nav children", () => {
    render(
      <Topbar title="My App">
        <a href="/x">X</a>
        <a href="/y">Y</a>
      </Topbar>,
    );
    expect(screen.getByText("My App")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  it("renders hamburger button when nav children exist", () => {
    render(
      <Topbar title="App">
        <a href="/x">X</a>
      </Topbar>,
    );
    const button = screen.getByRole("button", { name: /open menu/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("md:hidden");
  });

  it("does not render hamburger when no children provided", () => {
    render(<Topbar title="App" />);
    expect(screen.queryByRole("button", { name: /menu/i })).not.toBeInTheDocument();
  });

  it("does not render hamburger when disableMobileMenu is true", () => {
    render(
      <Topbar title="App" disableMobileMenu>
        <a href="/x">X</a>
      </Topbar>,
    );
    expect(screen.queryByRole("button", { name: /menu/i })).not.toBeInTheDocument();
  });

  it("toggles aria-expanded when hamburger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Topbar title="App">
        <a href="/x">X</a>
      </Topbar>,
    );
    const button = screen.getByRole("button", { name: /open menu/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(screen.getByRole("button", { name: /close menu/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});

describe("AppNav — mobile horizontal scroll", () => {
  it("renders all items as links", () => {
    render(
      <AppNav
        items={[
          { label: "One", href: "/one" },
          { label: "Two", href: "/two" },
        ]}
      />,
    );
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("applies horizontal scroll classes for mobile overflow", () => {
    const { container } = render(
      <AppNav items={[{ label: "X", href: "/x" }]} />,
    );
    const nav = container.querySelector("nav")!;
    expect(nav.className).toMatch(/overflow-x-auto/);
    expect(nav.className).toMatch(/snap-x/);
  });

  it("makes items shrink-0 and whitespace-nowrap so they do not wrap", () => {
    const { container } = render(
      <AppNav items={[{ label: "X", href: "/x" }]} />,
    );
    const link = container.querySelector("a")!;
    expect(link.className).toMatch(/shrink-0/);
    expect(link.className).toMatch(/whitespace-nowrap/);
  });
});

describe("Card — compact size variant", () => {
  it("default size uses p-6 padding on header and content", () => {
    const { container } = render(
      <Card>
        <CardHeader data-testid="header">Header</CardHeader>
        <CardContent data-testid="content">Body</CardContent>
      </Card>,
    );
    const card = container.querySelector('[data-size]');
    expect(card).toHaveAttribute("data-size", "default");
    expect(screen.getByTestId("header").className).toMatch(/\bp-6\b/);
    expect(screen.getByTestId("content").className).toMatch(/\bp-6\b/);
  });

  it("compact size uses p-3 padding on header and content", () => {
    const { container } = render(
      <Card size="compact">
        <CardHeader data-testid="header">Header</CardHeader>
        <CardContent data-testid="content">Body</CardContent>
      </Card>,
    );
    const card = container.querySelector('[data-size]');
    expect(card).toHaveAttribute("data-size", "compact");
    expect(screen.getByTestId("header").className).toMatch(/\bp-3\b/);
    expect(screen.getByTestId("content").className).toMatch(/\bp-3\b/);
  });
});

describe("DataGrid — compact size variant", () => {
  interface Row { id: string; name: string; value: number; [k: string]: unknown }
  const columns: DataGridColumn<Row>[] = [
    { key: "name", header: "Name" },
    { key: "value", header: "Value" },
  ];
  const data: Row[] = [
    { id: "a", name: "Alpha", value: 1 },
    { id: "b", name: "Beta", value: 2 },
  ];

  it("default size renders only the table view", () => {
    const { container } = render(<DataGrid columns={columns} data={data} />);
    expect(container.querySelector('[data-size]')).toHaveAttribute("data-size", "default");
    // No stacked mobile list
    expect(container.querySelector('[role="list"]')).not.toBeInTheDocument();
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("compact size renders both stacked mobile list and desktop table", () => {
    const { container } = render(
      <DataGrid columns={columns} data={data} size="compact" />,
    );
    expect(container.querySelector('[data-size]')).toHaveAttribute("data-size", "compact");

    // Stacked mobile listview is present
    const list = container.querySelector('[role="list"]');
    expect(list).toBeInTheDocument();
    // Each row becomes a listitem on mobile
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(data.length);

    // Desktop table is hidden via md:block (still in DOM for md+ viewports)
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("compact stacked rows show the column header label and value", () => {
    render(<DataGrid columns={columns} data={data} size="compact" />);
    // The mobile listview duplicates labels — at least 2 occurrences (header + listview header)
    expect(screen.getAllByText("Name").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Alpha").length).toBeGreaterThanOrEqual(1);
  });
});

describe("SlideDeck — responsive padding", () => {
  it("uses tighter horizontal padding on mobile and ramps up at sm/md", () => {
    const { container } = render(
      <SlideDeck slides={[<div key="0">slide one</div>]} />,
    );
    const slide = container.querySelector(".absolute.inset-0");
    expect(slide).toBeTruthy();
    const cls = slide!.className;
    // Mobile baseline keeps content reachable at 375px
    expect(cls).toMatch(/\bpx-4\b/);
    expect(cls).toMatch(/\bpy-10\b/);
    // Larger viewports get the original generous padding
    expect(cls).toMatch(/sm:px-12/);
    expect(cls).toMatch(/md:px-20/);
  });
});
