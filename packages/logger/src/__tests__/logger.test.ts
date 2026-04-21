import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger, setSentry } from "../logger";
import { withRequestContext } from "../context";

type Captured = { stdout: string[]; stderr: string[] };

function captureStreams(): Captured {
  const captured: Captured = { stdout: [], stderr: [] };
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    captured.stdout.push(String(chunk));
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => {
    captured.stderr.push(String(chunk));
    return true;
  });
  return captured;
}

function lastJson(lines: string[]): Record<string, unknown> {
  const last = lines.at(-1) ?? "";
  return JSON.parse(last.trim()) as Record<string, unknown>;
}

describe("logger", () => {
  const originalLogLevel = process.env.LOG_LEVEL;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.LOG_LEVEL = "debug";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.LOG_LEVEL = originalLogLevel;
    process.env.NODE_ENV = originalNodeEnv;
    setSentry(null);
  });

  it("writes a JSON line with timestamp/level/message", () => {
    const cap = captureStreams();
    const log = createLogger();
    log.info("hello world");
    const record = lastJson(cap.stdout);
    expect(record.level).toBe("info");
    expect(record.message).toBe("hello world");
    expect(typeof record.timestamp).toBe("string");
  });

  it("merges base context with call context", () => {
    const cap = captureStreams();
    const log = createLogger({ appSlug: "accounts" });
    log.info("event", { userId: "u1" });
    const record = lastJson(cap.stdout);
    expect(record.appSlug).toBe("accounts");
    expect(record.userId).toBe("u1");
  });

  it("respects LOG_LEVEL gating", () => {
    process.env.LOG_LEVEL = "warn";
    const cap = captureStreams();
    const log = createLogger();
    log.info("ignored");
    log.debug("ignored");
    log.warn("kept");
    expect(cap.stdout).toHaveLength(0);
    expect(cap.stderr).toHaveLength(1);
    expect(lastJson(cap.stderr).message).toBe("kept");
  });

  it("emits warn/error to stderr and info/debug to stdout", () => {
    const cap = captureStreams();
    const log = createLogger();
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    expect(cap.stdout).toHaveLength(2);
    expect(cap.stderr).toHaveLength(2);
  });

  it("serializes Error objects", () => {
    const cap = captureStreams();
    const log = createLogger();
    log.error("boom", { err: new Error("explosion") });
    const record = lastJson(cap.stderr);
    expect(record.error).toMatchObject({ name: "Error", message: "explosion" });
    expect(typeof (record.error as Record<string, unknown>).stack).toBe("string");
  });

  it("prunes undefined fields from the record", () => {
    const cap = captureStreams();
    const log = createLogger();
    log.info("clean", { foo: undefined });
    const record = lastJson(cap.stdout);
    expect("foo" in record).toBe(false);
  });

  it("child() merges contexts", () => {
    const cap = captureStreams();
    const log = createLogger({ a: 1 }).child({ b: 2 });
    log.info("nested", { c: 3 });
    const record = lastJson(cap.stdout);
    expect(record.a).toBe(1);
    expect(record.b).toBe(2);
    expect(record.c).toBe(3);
  });

  it("forwards errors to Sentry when configured", () => {
    const cap = captureStreams();
    const captureException = vi.fn();
    setSentry({ captureException });
    const log = createLogger();
    const err = new Error("forwarded");
    log.error("failed", { err, route: "/x" });
    expect(captureException).toHaveBeenCalledWith(err, {
      extra: expect.objectContaining({ route: "/x" }),
    });
    expect(cap.stderr).toHaveLength(1);
  });

  it("does not forward non-error levels to Sentry", () => {
    captureStreams();
    const captureException = vi.fn();
    setSentry({ captureException });
    const log = createLogger();
    log.warn("nope", { err: new Error("ignored") });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("propagates AsyncLocalStorage context across awaits", async () => {
    const cap = captureStreams();
    const log = createLogger();
    await withRequestContext({ requestId: "req-1", userId: "u-1" }, async () => {
      await Promise.resolve();
      log.info("inside");
    });
    const record = lastJson(cap.stdout);
    expect(record.requestId).toBe("req-1");
    expect(record.userId).toBe("u-1");
  });

  it("call context overrides AsyncLocalStorage context", async () => {
    const cap = captureStreams();
    const log = createLogger();
    await withRequestContext({ userId: "from-store" }, async () => {
      log.info("override", { userId: "from-call" });
    });
    expect(lastJson(cap.stdout).userId).toBe("from-call");
  });
});
