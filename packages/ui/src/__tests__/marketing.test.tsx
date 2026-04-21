import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

import { Hero } from "../components/hero";
import { CTA } from "../components/cta";
import { FeatureList } from "../components/feature-list";
import { SectionIntro } from "../components/section-intro";
import { Timeline } from "../components/timeline";
import { Testimonial } from "../components/testimonial";
import { IntroText } from "../components/intro-text";
import { Pricing } from "../components/pricing";

describe("Hero", () => {
  it("renders the title", () => {
    render(<Hero title="Welcome" />);
    expect(screen.getByText("Welcome")).toBeDefined();
  });

  it("renders subtitle when provided", () => {
    render(<Hero title="Hello" subtitle="A great platform" />);
    expect(screen.getByText("A great platform")).toBeDefined();
  });

  it("renders children", () => {
    render(
      <Hero title="Title">
        <button>Get Started</button>
      </Hero>,
    );
    expect(screen.getByText("Get Started")).toBeDefined();
  });

  it("renders as a section element", () => {
    const { container } = render(<Hero title="Test" />);
    expect(container.querySelector("section")).toBeDefined();
  });
});

describe("CTA", () => {
  it("renders the title", () => {
    render(<CTA title="Try it now" />);
    expect(screen.getByText("Try it now")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(<CTA title="Title" description="Start your free trial" />);
    expect(screen.getByText("Start your free trial")).toBeDefined();
  });

  it("renders children as action buttons", () => {
    render(
      <CTA title="Title">
        <button>Sign Up</button>
      </CTA>,
    );
    expect(screen.getByText("Sign Up")).toBeDefined();
  });
});

describe("FeatureList", () => {
  const features = [
    { title: "Fast", description: "Very quick" },
    { title: "Secure", description: "Rock solid" },
    { title: "Scalable" },
  ];

  it("renders all feature titles", () => {
    render(<FeatureList features={features} />);
    expect(screen.getByText("Fast")).toBeDefined();
    expect(screen.getByText("Secure")).toBeDefined();
    expect(screen.getByText("Scalable")).toBeDefined();
  });

  it("renders feature descriptions", () => {
    render(<FeatureList features={features} />);
    expect(screen.getByText("Very quick")).toBeDefined();
  });

  it("renders with 2 columns", () => {
    const { container } = render(<FeatureList features={features} columns={2} />);
    expect(container.querySelector("div")?.className).toContain("sm:grid-cols-2");
  });

  it("renders with 4 columns", () => {
    const { container } = render(<FeatureList features={features} columns={4} />);
    expect(container.querySelector("div")?.className).toContain("lg:grid-cols-4");
  });

  it("renders feature with icon", () => {
    const featuresWithIcon = [
      { title: "Awesome", icon: <span data-testid="star-icon">⭐</span> },
    ];
    render(<FeatureList features={featuresWithIcon} />);
    expect(screen.getByTestId("star-icon")).toBeDefined();
  });
});

describe("SectionIntro", () => {
  it("renders title", () => {
    render(<SectionIntro title="Our Features" />);
    expect(screen.getByText("Our Features")).toBeDefined();
  });

  it("renders with description", () => {
    render(<SectionIntro title="Features" description="Everything you need" />);
    expect(screen.getByText("Everything you need")).toBeDefined();
  });
});

describe("Timeline", () => {
  const events = [
    { date: "Jan 2024", title: "Founded", description: "Company started" },
    { date: "Mar 2024", title: "Launch", description: "Product launched" },
  ];

  it("renders all timeline events", () => {
    render(<Timeline events={events} />);
    expect(screen.getByText("Founded")).toBeDefined();
    expect(screen.getByText("Launch")).toBeDefined();
  });

  it("renders dates", () => {
    render(<Timeline events={events} />);
    expect(screen.getByText("Jan 2024")).toBeDefined();
  });
});

describe("Testimonial", () => {
  it("renders the quote", () => {
    render(
      <Testimonial
        quote="Amazing product!"
        author="Jane Doe"
      />,
    );
    expect(screen.getByText("Amazing product!")).toBeDefined();
    expect(screen.getByText("Jane Doe")).toBeDefined();
  });

  it("renders with role", () => {
    render(
      <Testimonial
        quote="Great!"
        author="John Smith"
        role="CEO at Acme Corp"
      />,
    );
    expect(screen.getByText("CEO at Acme Corp")).toBeDefined();
  });
});

describe("IntroText", () => {
  it("renders the text content", () => {
    render(<IntroText>Welcome to our platform</IntroText>);
    expect(screen.getByText("Welcome to our platform")).toBeDefined();
  });
});

describe("Pricing", () => {
  const features = ["Unlimited projects", "Priority support", "Custom domain"];

  it("renders the plan title", () => {
    render(<Pricing title="Pro" price={29} features={features} />);
    expect(screen.getByText("Pro")).toBeDefined();
  });

  it("renders numeric price as dollar amount", () => {
    const { container } = render(<Pricing title="Pro" price={29} features={features} />);
    expect(container.textContent).toContain("$29");
  });

  it("renders zero price as $0", () => {
    const { container } = render(<Pricing title="Free" price={0} features={features} />);
    expect(container.textContent).toContain("$0");
  });

  it("renders string price directly", () => {
    const { container } = render(<Pricing title="Custom" price="Contact us" features={features} />);
    expect(container.textContent).toContain("Contact us");
  });

  it("renders period when provided", () => {
    const { container } = render(<Pricing title="Pro" price={29} period="month" features={features} />);
    expect(container.textContent).toContain("month");
  });

  it("renders all features", () => {
    render(<Pricing title="Pro" price={29} features={features} />);
    expect(screen.getByText("Unlimited projects")).toBeDefined();
    expect(screen.getByText("Priority support")).toBeDefined();
  });

  it("shows 'Most Popular' badge when highlighted", () => {
    render(<Pricing title="Pro" price={29} features={features} highlighted />);
    expect(screen.getByText("Most Popular")).toBeDefined();
  });

  it("does not show badge when not highlighted", () => {
    render(<Pricing title="Basic" price={0} features={[]} />);
    expect(screen.queryByText("Most Popular")).toBeNull();
  });

  it("renders CTA element", () => {
    render(
      <Pricing
        title="Pro"
        price={29}
        features={features}
        cta={<button>Get Started</button>}
      />,
    );
    expect(screen.getByText("Get Started")).toBeDefined();
  });
});
