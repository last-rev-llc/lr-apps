import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAuthorizedCronRequest } from "../cron-auth";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/cron/cleanup", { headers });
}

describe("isAuthorizedCronRequest", () => {
  it("returns false when CRON_SECRET is unset (fails closed)", () => {
    delete process.env.CRON_SECRET;
    const req = makeRequest({ authorization: "Bearer anything" });
    expect(isAuthorizedCronRequest(req)).toBe(false);
  });

  it("returns false when Authorization header is missing", () => {
    process.env.CRON_SECRET = "shh";
    const req = makeRequest();
    expect(isAuthorizedCronRequest(req)).toBe(false);
  });

  it("returns false when scheme is not Bearer", () => {
    process.env.CRON_SECRET = "shh";
    const req = makeRequest({ authorization: "Basic shh" });
    expect(isAuthorizedCronRequest(req)).toBe(false);
  });

  it("returns false when token does not match", () => {
    process.env.CRON_SECRET = "shh";
    const req = makeRequest({ authorization: "Bearer wrong" });
    expect(isAuthorizedCronRequest(req)).toBe(false);
  });

  it("returns true when Bearer token matches CRON_SECRET", () => {
    process.env.CRON_SECRET = "shh-very-secret";
    const req = makeRequest({ authorization: "Bearer shh-very-secret" });
    expect(isAuthorizedCronRequest(req)).toBe(true);
  });

  it("returns false when token has same prefix but different length", () => {
    process.env.CRON_SECRET = "shh-very-secret";
    const req = makeRequest({ authorization: "Bearer shh-very-secret-longer" });
    expect(isAuthorizedCronRequest(req)).toBe(false);
  });
});
