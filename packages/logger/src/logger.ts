import { getRequestContext } from "./context";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LogContext = Record<string, unknown> & {
  err?: unknown;
};

export type Logger = {
  debug: (message: string, ctx?: LogContext) => void;
  info: (message: string, ctx?: LogContext) => void;
  warn: (message: string, ctx?: LogContext) => void;
  error: (message: string, ctx?: LogContext) => void;
  child: (ctx: LogContext) => Logger;
};

type SentryLike = {
  captureException: (err: unknown, hint?: { extra?: Record<string, unknown> }) => unknown;
};

let sentryRef: SentryLike | null = null;

export function setSentry(sentry: SentryLike | null): void {
  sentryRef = sentry;
}

function resolveLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function serializeError(err: unknown): Record<string, unknown> | undefined {
  if (err === undefined || err === null) return undefined;
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  if (typeof err === "object") {
    return { value: err };
  }
  return { message: String(err) };
}

function pruneUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function emit(
  level: LogLevel,
  message: string,
  baseCtx: LogContext,
  callCtx: LogContext | undefined,
): void {
  const min = LEVELS[resolveLevel()];
  if (LEVELS[level] < min) return;

  const requestCtx = getRequestContext() ?? {};
  const merged: LogContext = { ...requestCtx, ...baseCtx, ...(callCtx ?? {}) };

  const { err, ...rest } = merged;
  const errorPayload = serializeError(err);

  const record: Record<string, unknown> = pruneUndefined({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...rest,
  });

  if (errorPayload) {
    record.error = errorPayload;
  }

  const line = JSON.stringify(record);

  // Use console.* (not process.stdout/stderr.write): the latter is undefined in
  // the Edge Runtime and would crash any logger call from edge code (e.g.,
  // /api/vitals, the proxy.ts auth0 middleware callback). console.error/warn
  // still route to stderr in Node, and Vercel captures both runtimes' output.
  if (level === "error") {
    console.error(line);
    if (sentryRef && err !== undefined) {
      try {
        sentryRef.captureException(err, { extra: rest });
      } catch {
        /* swallow */
      }
    }
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function createLogger(baseContext: LogContext = {}): Logger {
  const baseCtx = { ...baseContext };
  return {
    debug: (msg, ctx) => emit("debug", msg, baseCtx, ctx),
    info: (msg, ctx) => emit("info", msg, baseCtx, ctx),
    warn: (msg, ctx) => emit("warn", msg, baseCtx, ctx),
    error: (msg, ctx) => emit("error", msg, baseCtx, ctx),
    child: (ctx) => createLogger({ ...baseCtx, ...ctx }),
  };
}

export const log: Logger = createLogger();
