import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { audit } from "../audit-contacts-schema";

const ORIGINAL_ENV = { ...process.env };

const completeLiveContacts = {
  required: ["id", "name", "tags", "created_at", "updated_at"],
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string", format: "text" },
    email: { type: "string", format: "text" },
    phone: { type: "string", format: "text" },
    title: { type: "string", format: "text" },
    company: { type: "string", format: "text" },
    type: { type: "string", format: "text" },
    avatar: { type: "string", format: "text" },
    location: { type: "string", format: "text" },
    timezone: { type: "string", format: "text" },
    slack_id: { type: "string", format: "text" },
    slack_handle: { type: "string", format: "text" },
    github_handle: { type: "string", format: "text" },
    linkedin_url: { type: "string", format: "text" },
    twitter_handle: { type: "string", format: "text" },
    website: { type: "string", format: "text" },
    tags: { type: "object", format: "jsonb" },
    notes: { type: "string", format: "text" },
    insights: { type: "object", format: "jsonb" },
    last_researched_at: { type: "string", format: "timestamp with time zone" },
    confidence: { type: "string", format: "text" },
    source: { type: "string", format: "text" },
    created_at: { type: "string", format: "timestamp with time zone" },
    updated_at: { type: "string", format: "timestamp with time zone" },
  },
};

function mockOpenApi(definitions: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ definitions }),
    }),
  );
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("audit-contacts-schema", () => {
  it("reports all-ok when live shape matches EXPECTED_COLUMNS", async () => {
    mockOpenApi({ contacts: completeLiveContacts });
    const report = await audit();
    expect(report.found).toBe(true);
    expect(report.summary.drift).toBe(0);
    expect(report.summary.missing).toBe(0);
    expect(report.summary.extra).toBe(0);
    expect(report.summary.ok).toBeGreaterThan(0);
    expect(report.columns.every((c) => c.status === "ok")).toBe(true);
  });

  it("flags missing column when live omits a required field", async () => {
    const liveProps = { ...completeLiveContacts.properties } as Record<string, unknown>;
    delete liveProps.email;
    mockOpenApi({
      contacts: { required: completeLiveContacts.required, properties: liveProps },
    });
    const report = await audit();
    expect(report.summary.missing).toBe(1);
    const email = report.columns.find((c) => c.name === "email");
    expect(email?.status).toBe("missing-in-live");
  });

  it("flags extra column when live has fields not in EXPECTED_COLUMNS", async () => {
    const liveProps = {
      ...completeLiveContacts.properties,
      legacy_field: { type: "string", format: "text" },
    };
    mockOpenApi({
      contacts: { required: completeLiveContacts.required, properties: liveProps },
    });
    const report = await audit();
    expect(report.summary.extra).toBe(1);
    const legacy = report.columns.find((c) => c.name === "legacy_field");
    expect(legacy?.status).toBe("extra-in-live");
  });

  it("flags type drift when live type differs from expected", async () => {
    const liveProps = {
      ...completeLiveContacts.properties,
      tags: { type: "array", format: "ARRAY" },
    };
    mockOpenApi({
      contacts: { required: completeLiveContacts.required, properties: liveProps },
    });
    const report = await audit();
    expect(report.summary.drift).toBe(1);
    const tags = report.columns.find((c) => c.name === "tags");
    expect(tags?.status).toBe("type-mismatch");
  });

  it("flags nullability drift when required-list disagrees", async () => {
    mockOpenApi({
      contacts: {
        required: ["id", "tags", "created_at", "updated_at"],
        properties: completeLiveContacts.properties,
      },
    });
    const report = await audit();
    expect(report.summary.drift).toBe(1);
    const name = report.columns.find((c) => c.name === "name");
    expect(name?.status).toBe("nullability-mismatch");
  });

  it("returns found=false when contacts table is not exposed", async () => {
    mockOpenApi({});
    const report = await audit();
    expect(report.found).toBe(false);
    expect(report.columns).toEqual([]);
  });
});
