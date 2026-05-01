import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendEmailMock = vi.fn();
vi.mock("@repo/email", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
  clientHealthAlertEmail: {
    subject: () => "x",
    html: (data: { dashboardUrl?: string | null }) =>
      data.dashboardUrl ? `<a href="${data.dashboardUrl}">View dashboard</a>` : "x",
  },
}));

import {
  DEFAULT_ALERT_SETTINGS,
  evaluateAndAlert,
  getAlertSettingsForUser,
  type AlertCandidate,
} from "./alerting";

type AlertRow = { user_id: string; client_id: string; type: string; acknowledged_at: string | null };

let alertRows: AlertRow[] = [];
let settingsRow: Record<string, unknown> | null = null;
let insertCalls: Array<Record<string, unknown>> = [];

function makeQuery<T>(rows: T[]) {
  const builder: Record<string, unknown> = {
    eq: (col: string, val: unknown) => {
      rows = rows.filter((r) => (r as Record<string, unknown>)[col] === val);
      return builder;
    },
    is: (col: string, val: unknown) => {
      rows = rows.filter((r) => (r as Record<string, unknown>)[col] === val);
      return builder;
    },
    limit: () => builder,
    maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
    then: (resolve: (v: { data: T[]; error: null }) => unknown) =>
      resolve({ data: rows, error: null }),
  };
  return builder;
}

function makeDb() {
  return {
    from: vi.fn((table: string) => {
      if (table === "client_health_alerts") {
        return {
          select: () => makeQuery(alertRows),
          insert: vi.fn(async (payload: Record<string, unknown>) => {
            insertCalls.push(payload);
            return { error: null };
          }),
        };
      }
      if (table === "client_health_settings") {
        return {
          select: () => makeQuery(settingsRow ? [settingsRow] : []),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  } as unknown as Parameters<typeof evaluateAndAlert>[0]["db"];
}

beforeEach(() => {
  vi.clearAllMocks();
  alertRows = [];
  settingsRow = null;
  insertCalls = [];
});
afterEach(() => {
  vi.clearAllMocks();
});

const baseCandidate: AlertCandidate = {
  type: "status-down",
  clientId: "client-1",
  clientName: "Acme",
  summary: "1 site is down",
  offenders: [{ name: "https://acme.example", url: "https://acme.example", detail: "down" }],
};

describe("evaluateAndAlert", () => {
  it("inserts an alert row and sends an email on a fresh transition", async () => {
    sendEmailMock.mockResolvedValue({ id: "email-1" });
    const decisions = await evaluateAndAlert({
      db: makeDb(),
      userId: "user-1",
      userEmail: "user@example.com",
      settings: { ...DEFAULT_ALERT_SETTINGS },
      candidates: [baseCandidate],
    });
    expect(decisions).toEqual([{ status: "sent", type: "status-down", clientId: "client-1" }]);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({
      user_id: "user-1",
      client_id: "client-1",
      type: "status-down",
    });
    expect(sendEmailMock).toHaveBeenCalledOnce();
    expect(sendEmailMock.mock.calls[0]![0]).toMatchObject({ to: "user@example.com" });
  });

  it("dedupes against an unacknowledged alert of the same (type, clientId)", async () => {
    alertRows = [{ user_id: "user-1", client_id: "client-1", type: "status-down", acknowledged_at: null }];
    const decisions = await evaluateAndAlert({
      db: makeDb(),
      userId: "user-1",
      userEmail: "user@example.com",
      settings: { ...DEFAULT_ALERT_SETTINGS },
      candidates: [baseCandidate],
    });
    expect(decisions).toEqual([{ status: "deduped", type: "status-down", clientId: "client-1" }]);
    expect(insertCalls).toHaveLength(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("skips email send when emailEnabled is false", async () => {
    const decisions = await evaluateAndAlert({
      db: makeDb(),
      userId: "user-1",
      userEmail: "user@example.com",
      settings: { ...DEFAULT_ALERT_SETTINGS, emailEnabled: false },
      candidates: [baseCandidate],
    });
    expect(decisions).toEqual([
      { status: "skipped", reason: "email_disabled", type: "status-down", clientId: "client-1" },
    ]);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(insertCalls).toHaveLength(0);
  });

  it("uses settings.alertEmail when set, else falls back to userEmail", async () => {
    sendEmailMock.mockResolvedValue({ id: "email-2" });
    await evaluateAndAlert({
      db: makeDb(),
      userId: "user-1",
      userEmail: "fallback@example.com",
      settings: { ...DEFAULT_ALERT_SETTINGS, alertEmail: "alerts@example.com" },
      candidates: [baseCandidate],
    });
    expect(sendEmailMock.mock.calls[0]![0].to).toBe("alerts@example.com");
  });

  it("skips when no recipient is available anywhere", async () => {
    const decisions = await evaluateAndAlert({
      db: makeDb(),
      userId: "user-1",
      userEmail: null,
      settings: { ...DEFAULT_ALERT_SETTINGS },
      candidates: [baseCandidate],
    });
    expect(decisions).toEqual([
      { status: "skipped", reason: "no_recipient", type: "status-down", clientId: "client-1" },
    ]);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("renders a dashboard deep-link when dashboardOrigin is supplied", async () => {
    sendEmailMock.mockResolvedValue({ id: "email-3" });
    await evaluateAndAlert({
      db: makeDb(),
      userId: "user-1",
      userEmail: "user@example.com",
      settings: { ...DEFAULT_ALERT_SETTINGS },
      candidates: [baseCandidate],
      dashboardOrigin: "https://command-center.apps.lastrev.com",
    });
    expect(sendEmailMock).toHaveBeenCalledOnce();
    const sendArgs = sendEmailMock.mock.calls[0]![0] as {
      data: { dashboardUrl: string | null };
      template: { html: (d: { dashboardUrl?: string | null }) => string };
    };
    expect(sendArgs.data.dashboardUrl).toBe(
      "https://command-center.apps.lastrev.com/clients/client-1",
    );
    expect(sendArgs.template.html(sendArgs.data)).toContain(
      "https://command-center.apps.lastrev.com/clients/client-1",
    );
  });

  it("leaves dashboardUrl null when dashboardOrigin is omitted", async () => {
    sendEmailMock.mockResolvedValue({ id: "email-4" });
    await evaluateAndAlert({
      db: makeDb(),
      userId: "user-1",
      userEmail: "user@example.com",
      settings: { ...DEFAULT_ALERT_SETTINGS },
      candidates: [baseCandidate],
    });
    expect(sendEmailMock).toHaveBeenCalledOnce();
    const sendArgs = sendEmailMock.mock.calls[0]![0] as {
      data: { dashboardUrl: string | null };
    };
    expect(sendArgs.data.dashboardUrl).toBeNull();
  });
});

describe("getAlertSettingsForUser", () => {
  it("returns the row when present", async () => {
    settingsRow = {
      user_id: "user-1",
      emailEnabled: false,
      alertEmail: "x@y.com",
      sslWarnDays: 7,
      healthDropThreshold: 30,
    };
    const settings = await getAlertSettingsForUser("user-1", makeDb());
    expect(settings).toEqual({
      emailEnabled: false,
      alertEmail: "x@y.com",
      sslWarnDays: 7,
      healthDropThreshold: 30,
    });
  });

  it("falls back to defaults when no row exists", async () => {
    settingsRow = null;
    const settings = await getAlertSettingsForUser("user-2", makeDb());
    expect(settings).toEqual(DEFAULT_ALERT_SETTINGS);
  });
});
