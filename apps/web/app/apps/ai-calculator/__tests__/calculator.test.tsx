// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className ?? ""}>
      {children}
    </button>
  ),
  Input: ({ id, type, value, onChange, min, max, step, placeholder }: any) => (
    <input
      id={id}
      type={type ?? "text"}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
    />
  ),
  Label: ({ htmlFor, children }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Card: ({ children, className }: any) => (
    <div className={className ?? ""}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

// ── Mock @repo/db/client ───────────────────────────────────────────────────

vi.mock("@repo/db/client", () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

// ── Mock @repo/auth/server (used by protected layout) ─────────────────────

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Pure function unit tests ───────────────────────────────────────────────

describe("calculate()", () => {
  it("returns zero results for empty inputs", async () => {
    const { calculate } = await import(
      "../(protected)/calculator/page"
    );
    const result = calculate({
      teamSize: "",
      meetingHours: "",
      manualHours: "",
      hourlyCost: "",
    });
    expect(result.totalHoursSavedYear).toBe(0);
    expect(result.netSavings).toBe(0);
    expect(result.roi).toBe(0);
  });

  it("produces correct hours saved for known inputs", async () => {
    const { calculate } = await import(
      "../(protected)/calculator/page"
    );
    // team=10, meetings=5, manual=10, hourly=50
    // meetingHoursSaved/week = 5 * 0.30 * 10 = 15
    // manualHoursSaved/week  = 10 * 0.40 * 10 = 40
    // totalSaved/year        = (15 + 40) * 50 = 2,750
    const result = calculate({
      teamSize: "10",
      meetingHours: "5",
      manualHours: "10",
      hourlyCost: "50",
    });
    expect(result.meetingHoursSavedWeek).toBe(15);
    expect(result.manualHoursSavedWeek).toBe(40);
    expect(result.totalHoursSavedYear).toBe(2750);
  });

  it("produces correct financial results for known inputs", async () => {
    const { calculate } = await import(
      "../(protected)/calculator/page"
    );
    // team=10, meetings=5, manual=10, hourly=50
    // costSavedYear = 2750 * 50 = $137,500
    // aiCostYear    = 10 * 50 * 12 = $6,000
    // netSavings    = $131,500
    const result = calculate({
      teamSize: "10",
      meetingHours: "5",
      manualHours: "10",
      hourlyCost: "50",
    });
    expect(result.costSavedYear).toBe(137500);
    expect(result.aiCostYear).toBe(6000);
    expect(result.netSavings).toBe(131500);
  });

  it("computes ROI correctly", async () => {
    const { calculate } = await import(
      "../(protected)/calculator/page"
    );
    const result = calculate({
      teamSize: "10",
      meetingHours: "5",
      manualHours: "10",
      hourlyCost: "50",
    });
    // roi = round((131500 / 6000) * 100) = round(2191.67) = 2192
    expect(result.roi).toBe(2192);
  });
});

// ── Component tests ────────────────────────────────────────────────────────

describe("AiCalculatorPage", () => {
  it("renders all four input fields", async () => {
    const { default: AiCalculatorPage } = await import(
      "../(protected)/calculator/page"
    );
    renderWithProviders(<AiCalculatorPage />);

    expect(screen.getByLabelText(/Team Size/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Avg Hours in Meetings/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hours on Manual Tasks/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Avg Hourly Cost per Employee/),
    ).toBeInTheDocument();
  });

  it("renders the Calculate My ROI button", async () => {
    const { default: AiCalculatorPage } = await import(
      "../(protected)/calculator/page"
    );
    renderWithProviders(<AiCalculatorPage />);

    expect(
      screen.getByRole("button", { name: /Calculate My ROI/i }),
    ).toBeInTheDocument();
  });

  it("shows results after initial mount (auto-calculate via useEffect)", async () => {
    const { default: AiCalculatorPage } = await import(
      "../(protected)/calculator/page"
    );

    await act(async () => {
      renderWithProviders(<AiCalculatorPage />);
    });

    // With defaults (team=25, meetings=12, manual=10, cost=55), results appear
    expect(screen.getByText("Your Projected AI Savings")).toBeInTheDocument();
    expect(screen.getByText(/Hours Saved \/ Year/)).toBeInTheDocument();
    expect(screen.getByText(/Annual Cost Savings/)).toBeInTheDocument();
    expect(screen.getByText(/Projected ROI/)).toBeInTheDocument();
  });

  it("updates results when inputs change and Calculate is clicked", async () => {
    const { default: AiCalculatorPage } = await import(
      "../(protected)/calculator/page"
    );

    await act(async () => {
      renderWithProviders(<AiCalculatorPage />);
    });

    // Change teamSize input to 1 to get minimal values
    const teamInput = screen.getByLabelText(/Team Size/);
    await act(async () => {
      fireEvent.change(teamInput, { target: { value: "1" } });
    });

    const meetingInput = screen.getByLabelText(/Avg Hours in Meetings/);
    await act(async () => {
      fireEvent.change(meetingInput, { target: { value: "1" } });
    });

    const manualInput = screen.getByLabelText(/Hours on Manual Tasks/);
    await act(async () => {
      fireEvent.change(manualInput, { target: { value: "0" } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Calculate My ROI/i }));
    });

    // Results card should still be visible
    expect(screen.getByText("Your Projected AI Savings")).toBeInTheDocument();
  });

  it("renders the lead capture form", async () => {
    const { default: AiCalculatorPage } = await import(
      "../(protected)/calculator/page"
    );
    renderWithProviders(<AiCalculatorPage />);

    expect(
      screen.getByText("Want a Personalized AI Strategy?"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Work email"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Get My Report/i }),
    ).toBeInTheDocument();
  });

  it("renders the methodology section", async () => {
    const { default: AiCalculatorPage } = await import(
      "../(protected)/calculator/page"
    );
    renderWithProviders(<AiCalculatorPage />);

    expect(
      screen.getByText("How We Calculate Your Savings"),
    ).toBeInTheDocument();
  });
});

// ── Protected layout auth gate ─────────────────────────────────────────────

describe("AiCalculatorProtectedLayout", () => {
  it("calls requireAccess with 'ai-calculator'", async () => {
    const { requireAccess } = await import("@repo/auth/server");
    vi.mocked(requireAccess).mockResolvedValueOnce(undefined as any);

    const { default: AiCalculatorProtectedLayout } = await import(
      "../(protected)/layout"
    );
    await AiCalculatorProtectedLayout({ children: "test" as any });
    expect(requireAccess).toHaveBeenCalledWith("ai-calculator");
  });

  it("redirects unauthenticated user via requireAccess", async () => {
    const { requireAccess } = await import("@repo/auth/server");
    const redirectError = new Error("NEXT_REDIRECT");
    (redirectError as any).digest = "NEXT_REDIRECT;/login";
    vi.mocked(requireAccess).mockRejectedValueOnce(redirectError);

    const { default: AiCalculatorProtectedLayout } = await import(
      "../(protected)/layout"
    );
    await expect(
      AiCalculatorProtectedLayout({ children: "test" as any }),
    ).rejects.toThrow("NEXT_REDIRECT");
  });

  it("renders children when auth passes", async () => {
    const { requireAccess } = await import("@repo/auth/server");
    vi.mocked(requireAccess).mockResolvedValueOnce(undefined as any);

    const { default: AiCalculatorProtectedLayout } = await import(
      "../(protected)/layout"
    );
    const result = await AiCalculatorProtectedLayout({
      children: "test" as any,
    });
    expect(result).toBeTruthy();
  });
});
