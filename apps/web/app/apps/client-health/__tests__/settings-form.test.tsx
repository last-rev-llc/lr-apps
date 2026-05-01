// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from "@repo/test-utils";

const updateAlertSettingsMock = vi.fn();
vi.mock("../lib/actions", () => ({
  updateAlertSettings: (...args: unknown[]) =>
    updateAlertSettingsMock(...args),
}));

import { SettingsForm } from "../settings/components/settings-form";

const DEFAULTS = {
  emailEnabled: true,
  alertEmail: null,
  sslWarnDays: 14,
  healthDropThreshold: 20,
};

beforeEach(() => {
  updateAlertSettingsMock.mockReset();
  updateAlertSettingsMock.mockResolvedValue({ ok: true });
});

describe("SettingsForm", () => {
  it("renders with the supplied defaults when no row exists", () => {
    renderWithProviders(<SettingsForm initial={DEFAULTS} />);
    expect(screen.getByLabelText(/Email alerts/i)).toBeChecked();
    expect(screen.getByLabelText(/SSL expiry warning/i)).toHaveValue(14);
    expect(screen.getByLabelText(/Health drop threshold/i)).toHaveValue(20);
  });

  it("renders existing values from a saved row", () => {
    renderWithProviders(
      <SettingsForm
        initial={{
          emailEnabled: false,
          alertEmail: "alerts@example.com",
          sslWarnDays: 30,
          healthDropThreshold: 15,
        }}
      />,
    );
    expect(screen.getByLabelText(/Email alerts/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Alert email override/i)).toHaveValue(
      "alerts@example.com",
    );
    expect(screen.getByLabelText(/SSL expiry warning/i)).toHaveValue(30);
    expect(screen.getByLabelText(/Health drop threshold/i)).toHaveValue(15);
  });

  it("submits the controlled values through the server action", async () => {
    renderWithProviders(<SettingsForm initial={DEFAULTS} />);

    fireEvent.change(screen.getByLabelText(/Alert email override/i), {
      target: { value: "alerts@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/SSL expiry warning/i), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText(/Health drop threshold/i), {
      target: { value: "25" },
    });

    fireEvent.submit(screen.getByTestId("settings-form"));

    await waitFor(() =>
      expect(updateAlertSettingsMock).toHaveBeenCalledWith({
        emailEnabled: true,
        alertEmail: "alerts@example.com",
        sslWarnDays: 30,
        healthDropThreshold: 25,
      }),
    );
  });

  it("surfaces field errors returned by the action", async () => {
    updateAlertSettingsMock.mockResolvedValueOnce({
      ok: false,
      error: "invalid input",
      fieldErrors: { sslWarnDays: "out of range" },
    });

    renderWithProviders(<SettingsForm initial={DEFAULTS} />);
    fireEvent.submit(screen.getByTestId("settings-form"));

    await waitFor(() =>
      expect(screen.getByText("out of range")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/SSL expiry warning/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("clears alertEmail to null when the input is empty", async () => {
    renderWithProviders(
      <SettingsForm
        initial={{ ...DEFAULTS, alertEmail: "old@example.com" }}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Alert email override/i), {
      target: { value: "" },
    });
    fireEvent.submit(screen.getByTestId("settings-form"));

    await waitFor(() =>
      expect(updateAlertSettingsMock).toHaveBeenCalledWith(
        expect.objectContaining({ alertEmail: null }),
      ),
    );
  });
});
