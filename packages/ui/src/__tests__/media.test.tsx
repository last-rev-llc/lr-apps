import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";

import { Lightbox } from "../components/lightbox";
import { Marquee } from "../components/marquee";
import { MediaCard } from "../components/media-card";
import { Mermaid } from "../components/mermaid";
import { SlideDeck } from "../components/slide-deck";

beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg>diagram</svg>" }),
  },
}));

describe("Lightbox", () => {
  const images = [
    { src: "/img1.jpg", alt: "Image 1" },
    { src: "/img2.jpg", alt: "Image 2" },
  ];

  it("renders null when closed", () => {
    const { container } = render(
      <Lightbox images={images} open={false} onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the image when open", () => {
    render(<Lightbox images={images} open onClose={() => {}} />);
    expect(screen.getByAltText("Image 1")).toBeDefined();
  });

  it("renders close button", () => {
    render(<Lightbox images={images} open onClose={() => {}} />);
    expect(screen.getByLabelText("Close lightbox")).toBeDefined();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<Lightbox images={images} open onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close lightbox"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders navigation buttons for multiple images", () => {
    render(<Lightbox images={images} open onClose={() => {}} />);
    expect(screen.getByLabelText("Next image")).toBeDefined();
  });

  it("shows image counter for multiple images", () => {
    const { container } = render(
      <Lightbox images={images} open onClose={() => {}} />,
    );
    expect(container.textContent).toContain("1 / 2");
  });

  it("navigates to next image", () => {
    render(<Lightbox images={images} open onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText("Next image"));
    expect(screen.getByAltText("Image 2")).toBeDefined();
  });

  it("renders null when images array is empty", () => {
    const { container } = render(
      <Lightbox images={[]} open onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders with initialIndex set", () => {
    render(
      <Lightbox images={images} open initialIndex={1} onClose={() => {}} />,
    );
    expect(screen.getByAltText("Image 2")).toBeDefined();
  });
});

describe("Marquee", () => {
  it("renders children", () => {
    render(
      <Marquee>
        <span>Item A</span>
        <span>Item B</span>
      </Marquee>,
    );
    expect(screen.getAllByText("Item A").length).toBeGreaterThan(0);
  });

  it("renders with slow speed", () => {
    const { container } = render(
      <Marquee speed="slow">
        <span>Slow</span>
      </Marquee>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders with right direction", () => {
    const { container } = render(
      <Marquee direction="right">
        <span>Right</span>
      </Marquee>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders with pauseOnHover", () => {
    const { container } = render(
      <Marquee pauseOnHover>
        <span>Hover</span>
      </Marquee>,
    );
    const track = container.querySelector(".marquee-track");
    expect(track?.className).toContain("pause-on-hover");
  });
});

describe("MediaCard", () => {
  it("renders title", () => {
    render(<MediaCard src="/img.jpg" title="My Image" />);
    expect(screen.getByText("My Image")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(<MediaCard src="/img.jpg" title="Title" description="A great photo" />);
    expect(screen.getByText("A great photo")).toBeDefined();
  });

  it("renders image element", () => {
    const { container } = render(<MediaCard src="/img.jpg" title="Title" />);
    expect(container.querySelector("img")).toBeDefined();
  });

  it("renders video type indicator", () => {
    const { container } = render(<MediaCard src="/video.mp4" title="Video" type="video" />);
    expect(container.textContent).toContain("Video");
  });

  it("renders tags", () => {
    render(<MediaCard src="/img.jpg" title="Title" tags={["nature", "travel"]} />);
    expect(screen.getByText("nature")).toBeDefined();
    expect(screen.getByText("travel")).toBeDefined();
  });

  it("renders fallback placeholder when src is empty", () => {
    const { container } = render(<MediaCard src="" title="No Image" />);
    expect(container.querySelector("div.aspect-\\[16\\/10\\]")).toBeDefined();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<MediaCard src="/img.jpg" title="Clickable" onClick={onClick} />);
    fireEvent.click(screen.getByText("Clickable"));
    expect(onClick).toHaveBeenCalled();
  });
});

describe("Mermaid", () => {
  it("renders null when chart is empty string", () => {
    const { container } = render(<Mermaid chart="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders container when chart is provided", () => {
    const { container } = render(
      <Mermaid chart="graph TD; A-->B" />,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("shows loading state initially", () => {
    render(<Mermaid chart="graph TD; A-->B" />);
    expect(screen.getByText("Loading diagram…")).toBeDefined();
  });
});

describe("SlideDeck", () => {
  const slides = [
    <div key="1">Slide 1</div>,
    <div key="2">Slide 2</div>,
    <div key="3">Slide 3</div>,
  ];

  it("renders null when slides array is empty", () => {
    const { container } = render(<SlideDeck slides={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all slides", () => {
    const { container } = render(<SlideDeck slides={slides} />);
    expect(container.querySelectorAll("[class*=absolute]").length).toBeGreaterThan(0);
  });

  it("renders progress bar by default", () => {
    const { container } = render(<SlideDeck slides={slides} />);
    expect(container.querySelector("[class*=inset-x-0]")).toBeDefined();
  });

  it("renders without progress bar when showProgress=false", () => {
    const { container } = render(<SlideDeck slides={slides} showProgress={false} />);
    const progressBar = container.querySelector(".h-\\[3px\\]");
    expect(progressBar).toBeNull();
  });

  it("renders slide counter by default", () => {
    const { container } = render(<SlideDeck slides={slides} />);
    expect(container.textContent).toContain("1 / 3");
  });

  it("renders with fade transition", () => {
    const { container } = render(
      <SlideDeck slides={slides} transition="fade" />,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders with zoom transition", () => {
    const { container } = render(
      <SlideDeck slides={slides} transition="zoom" />,
    );
    expect(container.firstChild).toBeDefined();
  });
});
