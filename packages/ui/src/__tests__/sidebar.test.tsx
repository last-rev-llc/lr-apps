import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar, type SidebarItem } from "../components/sidebar";

const SAMPLE_ITEMS: SidebarItem[] = [
  { label: "Hub", href: "/hub", icon: "⚡" },
  { label: "Leads", href: "/leads", icon: "🎯" },
  { label: "Agents", href: "/agents", icon: "🤖", active: true },
];

describe("Sidebar", () => {
  it("renders all items as links with correct href and label", () => {
    render(<Sidebar items={SAMPLE_ITEMS} />);

    for (const item of SAMPLE_ITEMS) {
      const link = screen.getByText(item.label).closest("a");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("renders icons for each item", () => {
    render(<Sidebar items={SAMPLE_ITEMS} />);

    expect(screen.getByText("⚡")).toBeInTheDocument();
    expect(screen.getByText("🎯")).toBeInTheDocument();
    expect(screen.getByText("🤖")).toBeInTheDocument();
  });

  it("applies active styling to active item", () => {
    render(<Sidebar items={SAMPLE_ITEMS} />);

    const activeLink = screen.getByText("Agents").closest("a");
    expect(activeLink).toHaveClass("bg-white/15", "text-white");

    const inactiveLink = screen.getByText("Hub").closest("a");
    expect(inactiveLink).toHaveClass("text-white/60");
    expect(inactiveLink).not.toHaveClass("bg-white/15");
  });

  it("hides labels when collapsed", () => {
    render(<Sidebar items={SAMPLE_ITEMS} collapsed />);

    // Labels should not be rendered when collapsed
    expect(screen.queryByText("Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("Leads")).not.toBeInTheDocument();

    // Icons should still be visible
    expect(screen.getByText("⚡")).toBeInTheDocument();
    expect(screen.getByText("🎯")).toBeInTheDocument();
  });

  it("uses narrow width when collapsed", () => {
    const { container } = render(<Sidebar items={SAMPLE_ITEMS} collapsed />);

    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("w-14");
    expect(aside).not.toHaveClass("w-56");
  });

  it("uses wide width when expanded", () => {
    const { container } = render(<Sidebar items={SAMPLE_ITEMS} />);

    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("w-56");
    expect(aside).not.toHaveClass("w-14");
  });

  it("renders toggle button when onToggle is provided", () => {
    const onToggle = vi.fn();
    render(<Sidebar items={SAMPLE_ITEMS} onToggle={onToggle} />);

    const toggleBtn = screen.getByLabelText("Collapse sidebar");
    expect(toggleBtn).toBeInTheDocument();
  });

  it("does not render toggle button when onToggle is not provided", () => {
    render(<Sidebar items={SAMPLE_ITEMS} />);

    expect(screen.queryByLabelText("Collapse sidebar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Expand sidebar")).not.toBeInTheDocument();
  });

  it("calls onToggle when toggle button is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Sidebar items={SAMPLE_ITEMS} onToggle={onToggle} />);

    await user.click(screen.getByLabelText("Collapse sidebar"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("shows 'Expand sidebar' label when collapsed with onToggle", () => {
    render(<Sidebar items={SAMPLE_ITEMS} collapsed onToggle={() => {}} />);

    expect(screen.getByLabelText("Expand sidebar")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Sidebar items={SAMPLE_ITEMS} className="hidden md:flex" />,
    );

    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("hidden", "md:flex");
  });
});
