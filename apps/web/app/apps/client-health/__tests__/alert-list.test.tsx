// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from "@repo/test-utils";

const acknowledgeAlertMock = vi.fn();
const snoozeAlertMock = vi.fn();
vi.mock("../lib/actions", () => ({
  acknowledgeAlert: (...args: unknown[]) => acknowledgeAlertMock(...args),
  snoozeAlert: (...args: unknown[]) => snoozeAlertMock(...args),
}));

import { AlertList } from "../alerts/components/alert-list";
import type { AlertHistoryRow } from "../lib/queries";

const ALERT_ID_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ALERT_ID_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const SAMPLE: AlertHistoryRow[] = [
  {
    id: ALERT_ID_A,
    type: "ssl-expiring",
    severity: "critical",
    message: "Certificate expiring soon",
    clientId: "c1",
    clientName: "Acme Corp",
    deliveredAt: "2026-04-29T12:00:00.000Z",
    acknowledgedAt: null,
    createdAt: "2026-04-29T12:00:00.000Z",
  },
  {
    id: ALERT_ID_B,
    type: "score-drop",
    severity: "warning",
    message: "Composite score dropped",
    clientId: "c2",
    clientName: "Beta LLC",
    deliveredAt: null,
    acknowledgedAt: "2026-04-29T13:00:00.000Z",
    createdAt: "2026-04-29T11:00:00.000Z",
  },
];

beforeEach(() => {
  acknowledgeAlertMock.mockReset();
  snoozeAlertMock.mockReset();
  acknowledgeAlertMock.mockResolvedValue({ ok: true });
  snoozeAlertMock.mockResolvedValue({ ok: true });
});

describe("AlertList", () => {
  it("renders an empty state when there are no rows", () => {
    renderWithProviders(<AlertList initial={[]} />);
    expect(screen.getByText(/No alerts yet/i)).toBeInTheDocument();
  });

  it("renders one row per alert with type, severity, message, client name", () => {
    renderWithProviders(<AlertList initial={SAMPLE} />);
    const list = screen.getByTestId("alert-list");
    expect(list.children).toHaveLength(2);
    expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument();
    expect(screen.getByText(/Certificate expiring soon/i)).toBeInTheDocument();
    expect(screen.getAllByText(/critical/i).length).toBeGreaterThan(0);
  });

  it("optimistically marks an alert acknowledged after a successful ack", async () => {
    renderWithProviders(<AlertList initial={SAMPLE} />);
    const button = screen.getByTestId(`ack-${ALERT_ID_A}`);
    fireEvent.click(button);
    await waitFor(() =>
      expect(acknowledgeAlertMock).toHaveBeenCalledWith(ALERT_ID_A),
    );
    // Row state flips from 'open' to 'acknowledged'
    await waitFor(() => {
      const row = screen.getByTestId(`alert-row-${ALERT_ID_A}`);
      expect(row.getAttribute("data-state")).toBe("acknowledged");
    });
    expect(screen.queryByTestId(`ack-${ALERT_ID_A}`)).not.toBeInTheDocument();
  });

  it("shows snooze button on open rows and flips to snoozed state on success", async () => {
    renderWithProviders(<AlertList initial={SAMPLE} />);
    fireEvent.click(screen.getByTestId(`snooze-${ALERT_ID_A}`));
    await waitFor(() =>
      expect(snoozeAlertMock).toHaveBeenCalledWith(ALERT_ID_A, 24),
    );
    await waitFor(() => {
      const row = screen.getByTestId(`alert-row-${ALERT_ID_A}`);
      expect(row.getAttribute("data-state")).toBe("snoozed");
    });
  });

  it("does not render ack/snooze buttons on already-acknowledged rows", () => {
    renderWithProviders(<AlertList initial={SAMPLE} />);
    expect(screen.queryByTestId(`ack-${ALERT_ID_B}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`snooze-${ALERT_ID_B}`)).not.toBeInTheDocument();
  });

  it("surfaces an error when the action fails", async () => {
    acknowledgeAlertMock.mockResolvedValueOnce({ ok: false, error: "boom" });
    renderWithProviders(<AlertList initial={SAMPLE} />);
    fireEvent.click(screen.getByTestId(`ack-${ALERT_ID_A}`));
    await waitFor(() =>
      expect(screen.getByText("boom")).toBeInTheDocument(),
    );
  });
});
