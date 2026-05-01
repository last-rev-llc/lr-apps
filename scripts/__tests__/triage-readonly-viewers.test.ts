import { describe, expect, it } from "vitest";
import {
  TARGETS,
  aggregateApp,
  bucketRow,
  type TableResult,
} from "../triage-readonly-viewers";

const stub = (
  app: string,
  table: string,
  bucket: TableResult["bucket"],
  total = 0,
): TableResult => ({
  app,
  table,
  createdAtCol: "created_at",
  row:
    bucket === "error"
      ? null
      : {
          total_rows: total,
          rows_last_30d: bucket === "live" ? 1 : 0,
          rows_last_7d: 0,
          latest_row: null,
        },
  bucket,
});

describe("triage-readonly-viewers", () => {
  describe("TARGETS", () => {
    it("covers all 14 viewer-app tables across 9 apps", () => {
      expect(TARGETS).toHaveLength(14);
      const apps = new Set(TARGETS.map((t) => t.app));
      expect(apps.size).toBe(9);
      expect([...apps].sort()).toEqual(
        [
          "accounts",
          "daily-updates",
          "lighthouse",
          "meeting-summaries",
          "sales",
          "sprint-planning",
          "standup",
          "summaries",
          "uptime",
        ].sort(),
      );
    });

    it("uses quoted-camelCase createdAt for clients, sites, days, leads, lighthouse_audits", () => {
      const camelCase = TARGETS.filter((t) => t.createdAtCol === "createdAt").map(
        (t) => t.table,
      );
      expect(camelCase.sort()).toEqual(
        ["clients", "days", "leads", "lighthouse_audits", "sites"].sort(),
      );
    });

    it("uses snake_case created_at for the remaining tables", () => {
      const snake = TARGETS.filter((t) => t.createdAtCol === "created_at").map(
        (t) => t.table,
      );
      expect(snake).toEqual([
        "daily_digests",
        "daily_overviews",
        "weekly_summaries",
        "summaries_zoom",
        "summaries_slack",
        "summaries_jira",
        "daily_updates",
        "daily_update_profiles",
        "zoom_transcripts",
      ]);
    });
  });

  describe("bucketRow", () => {
    it("returns abandoned when total_rows is 0", () => {
      expect(
        bucketRow({ total_rows: 0, rows_last_30d: 0, rows_last_7d: 0, latest_row: null }),
      ).toBe("abandoned");
    });

    it("returns live when rows_last_30d > 0", () => {
      expect(
        bucketRow({
          total_rows: 100,
          rows_last_30d: 5,
          rows_last_7d: 1,
          latest_row: "2026-04-30T00:00:00Z",
        }),
      ).toBe("live");
    });

    it("returns stalled when total_rows > 0 but rows_last_30d == 0", () => {
      expect(
        bucketRow({
          total_rows: 50,
          rows_last_30d: 0,
          rows_last_7d: 0,
          latest_row: "2025-01-01T00:00:00Z",
        }),
      ).toBe("stalled");
    });
  });

  describe("aggregateApp", () => {
    it("flags an app as 'error' if any of its tables errored", () => {
      const result = aggregateApp("summaries", [
        stub("summaries", "summaries_zoom", "live", 10),
        stub("summaries", "summaries_slack", "error"),
        stub("summaries", "summaries_jira", "stalled", 5),
      ]);
      expect(result.bucket).toBe("error");
    });

    it("flags an app as 'stalled' if any table is abandoned but at least one has rows", () => {
      const result = aggregateApp("daily-updates", [
        stub("daily-updates", "daily_updates", "live", 10),
        stub("daily-updates", "daily_update_profiles", "abandoned"),
      ]);
      expect(result.bucket).toBe("stalled");
    });

    it("flags an app as 'abandoned' only when every table is abandoned", () => {
      const result = aggregateApp("uptime", [stub("uptime", "sites", "abandoned")]);
      expect(result.bucket).toBe("abandoned");
    });

    it("flags an app as 'stalled' when any table is stalled (and no error/abandoned-mix)", () => {
      const result = aggregateApp("sprint-planning", [
        stub("sprint-planning", "daily_digests", "live", 10),
        stub("sprint-planning", "daily_overviews", "stalled", 5),
        stub("sprint-planning", "weekly_summaries", "live", 1),
      ]);
      expect(result.bucket).toBe("stalled");
    });

    it("flags an app as 'live' only when every table is live", () => {
      const result = aggregateApp("summaries", [
        stub("summaries", "summaries_zoom", "live", 100),
        stub("summaries", "summaries_slack", "live", 50),
        stub("summaries", "summaries_jira", "live", 25),
      ]);
      expect(result.bucket).toBe("live");
    });

    it("includes a summary string with table buckets and totals", () => {
      const result = aggregateApp("accounts", [
        stub("accounts", "clients", "stalled", 5),
      ]);
      expect(result.summary).toBe("clients=stalled(5)");
      expect(result.table_count).toBe(1);
    });
  });
});
