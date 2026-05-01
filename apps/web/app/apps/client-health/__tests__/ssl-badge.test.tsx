// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import { SslBadge } from "../components/ssl-badge";

const NOW = new Date("2026-04-30T00:00:00.000Z").getTime();
const render = renderWithProviders;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SslBadge", () => {
  it("renders 'SSL data unavailable' when sslExpiry is null and sslLastError is set", () => {
    render(
      <SslBadge
        sslExpiry={null}
        sslLastError="tls handshake timeout"
        sslLastChecked="2026-04-30T00:00:00.000Z"
      />,
    );
    const badge = screen.getByTestId("ssl-badge-unavailable");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/SSL data unavailable/i);
  });

  it("surfaces the underlying error message in the tooltip", () => {
    render(
      <SslBadge
        sslExpiry={null}
        sslLastError="ECONNREFUSED"
        sslLastChecked="2026-04-30T00:00:00.000Z"
      />,
    );
    const badge = screen.getByTestId("ssl-badge-unavailable");
    expect(badge.getAttribute("title")).toContain("ECONNREFUSED");
  });

  it("renders 'SSL unchecked' when both sslExpiry and sslLastError are null", () => {
    render(
      <SslBadge
        sslExpiry={null}
        sslLastError={null}
        sslLastChecked={null}
      />,
    );
    expect(screen.getByTestId("ssl-badge-unknown")).toBeInTheDocument();
  });

  it("renders 'Valid' for certs with >=30 days remaining", () => {
    render(
      <SslBadge
        sslExpiry={new Date(NOW + 90 * 86_400_000).toISOString()}
        sslLastError={null}
        sslLastChecked={new Date(NOW).toISOString()}
      />,
    );
    expect(screen.getByTestId("ssl-badge-valid")).toBeInTheDocument();
  });

  it("renders 'Expires in Nd' (expiring state) for 7..30 days remaining", () => {
    render(
      <SslBadge
        sslExpiry={new Date(NOW + 20 * 86_400_000).toISOString()}
        sslLastError={null}
        sslLastChecked={new Date(NOW).toISOString()}
      />,
    );
    const badge = screen.getByTestId("ssl-badge-expiring");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/20d/);
  });

  it("renders critical state for <7 days remaining", () => {
    render(
      <SslBadge
        sslExpiry={new Date(NOW + 3 * 86_400_000).toISOString()}
        sslLastError={null}
        sslLastChecked={new Date(NOW).toISOString()}
      />,
    );
    expect(screen.getByTestId("ssl-badge-critical")).toBeInTheDocument();
  });

  it("renders 'Expired' for past expiry", () => {
    render(
      <SslBadge
        sslExpiry={new Date(NOW - 86_400_000).toISOString()}
        sslLastError={null}
        sslLastChecked={new Date(NOW).toISOString()}
      />,
    );
    expect(screen.getByTestId("ssl-badge-expired")).toBeInTheDocument();
  });
});
