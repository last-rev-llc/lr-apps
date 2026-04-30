import { describe, it, expect } from "vitest";
import {
  welcomeEmail,
  subscriptionConfirmationEmail,
  subscriptionCancellationEmail,
  clientHealthAlertEmail,
} from "./index";

describe("welcomeEmail", () => {
  it("includes the loginUrl in html and text", () => {
    const data = { name: "Ada", loginUrl: "https://lastrev.com/login" };
    expect(welcomeEmail.subject(data)).toMatch(/welcome/i);
    expect(welcomeEmail.html(data)).toContain("https://lastrev.com/login");
    expect(welcomeEmail.html(data)).toContain("Ada");
    expect(welcomeEmail.text?.(data)).toContain("https://lastrev.com/login");
  });

  it("renders without a name", () => {
    const html = welcomeEmail.html({ loginUrl: "https://x.test/" });
    expect(html).toContain("Welcome!");
    expect(html).not.toContain("undefined");
  });

  it("escapes html in name to prevent injection", () => {
    const html = welcomeEmail.html({
      name: "<script>alert(1)</script>",
      loginUrl: "https://x.test/",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("subscriptionConfirmationEmail", () => {
  it("includes tier in subject and html", () => {
    const data = {
      name: "Bob",
      tier: "pro" as const,
      manageUrl: "https://lastrev.com/billing",
    };
    expect(subscriptionConfirmationEmail.subject(data)).toContain("Pro");
    const html = subscriptionConfirmationEmail.html(data);
    expect(html).toContain("pro");
    expect(html).toContain("https://lastrev.com/billing");
  });

  it("works with enterprise tier", () => {
    const subject = subscriptionConfirmationEmail.subject({
      tier: "enterprise",
      manageUrl: "https://x.test/",
    });
    expect(subject).toContain("Enterprise");
  });
});

describe("subscriptionCancellationEmail", () => {
  it("includes periodEnd and resubscribeUrl", () => {
    const data = {
      tier: "pro",
      periodEnd: "2026-05-01",
      resubscribeUrl: "https://lastrev.com/pricing",
    };
    const html = subscriptionCancellationEmail.html(data);
    expect(html).toContain("2026-05-01");
    expect(html).toContain("https://lastrev.com/pricing");
    expect(subscriptionCancellationEmail.subject(data)).toMatch(/cancel/i);
  });
});

describe("clientHealthAlertEmail", () => {
  const baseData = {
    clientName: "Acme",
    alertType: "status-down" as const,
    severity: "critical" as const,
    summary: "1 site is down",
    score: 60,
    scoreDelta: -25,
    offenders: [
      { name: "https://acme.example/a", url: "https://acme.example/a", detail: "down" },
    ],
    dashboardUrl: "https://lastrev.com/client-health",
  };

  it("renders subject with severity label and client name", () => {
    expect(clientHealthAlertEmail.subject(baseData)).toBe(
      "[CRITICAL] Client health: Acme",
    );
  });

  it("includes summary, score delta, and offender URLs in html", () => {
    const html = clientHealthAlertEmail.html(baseData);
    expect(html).toContain("1 site is down");
    expect(html).toContain("60");
    expect(html).toContain("-25");
    expect(html).toContain("https://acme.example/a");
    expect(html).toContain("https://lastrev.com/client-health");
  });

  it("escapes script tags in client name to prevent injection", () => {
    const html = clientHealthAlertEmail.html({
      ...baseData,
      clientName: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders text fallback with offenders", () => {
    const text = clientHealthAlertEmail.text!(baseData);
    expect(text).toContain("CRITICAL");
    expect(text).toContain("Acme");
    expect(text).toContain("https://acme.example/a");
  });
});
