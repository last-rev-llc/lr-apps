import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

import { Topbar } from "../components/topbar";
import { Sidebar } from "../components/sidebar";
import { AppNav } from "../components/app-nav";
import { PageHeader } from "../components/page-header";
import { EmptyState } from "../components/empty-state";

describe("Topbar", () => {
  it("renders the title", () => {
    render(<Topbar title="My App" />);
    expect(screen.getByText("My App")).toBeDefined();
  });

  it("renders children in a nav element", () => {
    render(
      <Topbar title="App">
        <button>Action</button>
      </Topbar>,
    );
    expect(screen.getByText("Action")).toBeDefined();
    expect(screen.getByRole("navigation")).toBeDefined();
  });

  it("renders without children", () => {
    const { container } = render(<Topbar title="Empty" />);
    expect(container.querySelector("nav")).toBeNull();
  });
});

describe("Sidebar", () => {
  const items = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings", active: true },
  ];

  it("renders all items", () => {
    render(<Sidebar items={items} />);
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("renders collapsed state", () => {
    const { container } = render(<Sidebar items={items} collapsed />);
    expect(container.querySelector("aside")?.className).toContain("w-14");
  });

  it("renders expanded state by default", () => {
    const { container } = render(<Sidebar items={items} />);
    expect(container.querySelector("aside")?.className).toContain("w-56");
  });

  it("renders toggle button when onToggle is provided", () => {
    render(<Sidebar items={items} onToggle={() => {}} />);
    expect(screen.getByLabelText("Collapse sidebar")).toBeDefined();
  });

  it("shows expand label when collapsed", () => {
    render(<Sidebar items={items} collapsed onToggle={() => {}} />);
    expect(screen.getByLabelText("Expand sidebar")).toBeDefined();
  });

  it("renders with icons", () => {
    const itemsWithIcons = [
      { label: "Home", href: "/", icon: <span data-testid="home-icon">🏠</span> },
    ];
    render(<Sidebar items={itemsWithIcons} />);
    expect(screen.getByTestId("home-icon")).toBeDefined();
  });

  it("renders empty list", () => {
    const { container } = render(<Sidebar items={[]} />);
    expect(container.querySelector("nav")).toBeDefined();
  });
});

describe("AppNav", () => {
  const items = [
    { label: "Overview", href: "/overview", active: true },
    { label: "Reports", href: "/reports" },
  ];

  it("renders all nav items", () => {
    render(<AppNav items={items} />);
    expect(screen.getByText("Overview")).toBeDefined();
    expect(screen.getByText("Reports")).toBeDefined();
  });

  it("renders as a nav element", () => {
    const { container } = render(<AppNav items={items} />);
    expect(container.querySelector("nav")).toBeDefined();
  });

  it("renders links with correct hrefs", () => {
    const { container } = render(<AppNav items={items} />);
    const links = container.querySelectorAll("a");
    expect(links[0]?.getAttribute("href")).toBe("/overview");
    expect(links[1]?.getAttribute("href")).toBe("/reports");
  });
});

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="My Page" />);
    expect(screen.getByText("My Page")).toBeDefined();
  });

  it("renders with subtitle", () => {
    render(<PageHeader title="Title" subtitle="Some subtitle" />);
    expect(screen.getByText("Some subtitle")).toBeDefined();
  });

  it("renders with actions", () => {
    render(<PageHeader title="Title" actions={<button>Action</button>} />);
    expect(screen.getByText("Action")).toBeDefined();
  });
});

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeDefined();
  });

  it("renders with description", () => {
    render(<EmptyState title="Empty" description="Add some items to get started" />);
    expect(screen.getByText("Add some items to get started")).toBeDefined();
  });

  it("renders with icon", () => {
    render(<EmptyState title="Empty" icon={<span data-testid="icon">📭</span>} />);
    expect(screen.getByTestId("icon")).toBeDefined();
  });

  it("renders with action", () => {
    render(
      <EmptyState title="Empty" action={<button>Create</button>} />,
    );
    expect(screen.getByText("Create")).toBeDefined();
  });
});
