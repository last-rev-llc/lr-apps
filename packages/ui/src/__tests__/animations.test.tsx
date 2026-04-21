import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

import { FadeIn } from "../components/fade-in";
import { SlideIn } from "../components/slide-in";
import { Stagger } from "../components/stagger";
import { Reveal } from "../components/reveal";
import { StatCounter } from "../components/stat-counter";
import { Typewriter } from "../components/typewriter";
import { Confetti } from "../components/confetti";
import { Particles } from "../components/particles";

beforeAll(() => {
  const mockObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  vi.stubGlobal("IntersectionObserver", mockObserver);

  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    setTimeout(() => cb(performance.now()), 0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

describe("FadeIn", () => {
  it("renders children", () => {
    render(
      <FadeIn>
        <span>Fade content</span>
      </FadeIn>,
    );
    expect(screen.getByText("Fade content")).toBeDefined();
  });

  it("renders with all direction variants without crashing", () => {
    const directions = ["up", "down", "left", "right"] as const;
    directions.forEach((direction) => {
      const { unmount } = render(
        <FadeIn direction={direction}>
          <span>{direction}</span>
        </FadeIn>,
      );
      expect(screen.getByText(direction)).toBeDefined();
      unmount();
    });
  });

  it("applies custom delay and duration", () => {
    const { container } = render(
      <FadeIn delay={500} duration={1000}>
        <span>Delayed</span>
      </FadeIn>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.style.transitionDelay).toBe("500ms");
    expect(div.style.transitionDuration).toBe("1000ms");
  });
});

describe("SlideIn", () => {
  it("renders children", () => {
    render(
      <SlideIn>
        <span>Slide content</span>
      </SlideIn>,
    );
    expect(screen.getByText("Slide content")).toBeDefined();
  });

  it("renders with custom direction", () => {
    render(
      <SlideIn direction="right">
        <span>Right slide</span>
      </SlideIn>,
    );
    expect(screen.getByText("Right slide")).toBeDefined();
  });
});

describe("Stagger", () => {
  it("renders children with stagger effect", () => {
    render(
      <Stagger>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Stagger>,
    );
    expect(screen.getByText("Item 1")).toBeDefined();
    expect(screen.getByText("Item 3")).toBeDefined();
  });
});

describe("Reveal", () => {
  it("renders children", () => {
    render(
      <Reveal>
        <span>Revealed</span>
      </Reveal>,
    );
    expect(screen.getByText("Revealed")).toBeDefined();
  });
});

describe("StatCounter", () => {
  it("renders numeric value", () => {
    const { container } = render(<StatCounter value={100} />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders with label", () => {
    render(<StatCounter value={42} label="Users" />);
    expect(screen.getByText("Users")).toBeDefined();
  });

  it("renders with prefix and suffix", () => {
    const { container } = render(
      <StatCounter value={99} prefix="$" suffix="+" />,
    );
    expect(container.textContent).toContain("$");
    expect(container.textContent).toContain("+");
  });

  it("renders non-numeric value directly", () => {
    const { container } = render(<StatCounter value="N/A" />);
    expect(container.textContent).toContain("N/A");
  });
});

describe("Typewriter", () => {
  it("renders without crashing", () => {
    const { container } = render(<Typewriter text="Hello World" />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders with custom speed", () => {
    const { container } = render(<Typewriter text="Fast" speed={10} />);
    expect(container.firstChild).toBeDefined();
  });
});

describe("Confetti", () => {
  it("renders null (side-effect only component)", () => {
    const { container } = render(<Confetti autoFire={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders with trigger prop without crashing", () => {
    const { container } = render(<Confetti trigger={false} autoFire={false} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("Particles", () => {
  it("renders a canvas element", () => {
    const { container } = render(<Particles count={5} />);
    expect(container.querySelector("canvas")).toBeDefined();
  });

  it("renders with custom colors", () => {
    const { container } = render(
      <Particles color1="255,0,0" color2="0,255,0" count={3} />,
    );
    expect(container.querySelector("canvas")).toBeDefined();
  });
});
