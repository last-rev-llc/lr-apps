// Shared OpenTelemetry helper for apps/web.
//
// The NodeSDK is initialized in instrumentation.ts (nodejs runtime only).
// On the edge runtime (proxy.ts) the SDK isn't loaded — `@opentelemetry/api`
// falls back to a no-op tracer, so `withSpan` becomes a cheap pass-through.
//
// Usage:
//   await withSpan("stripe.webhook.verify", { "event.id": id }, async () => {
//     return stripe.webhooks.constructEvent(body, sig, secret);
//   });
import { trace, SpanStatusCode, type Attributes, type Span } from "@opentelemetry/api";

export const tracer = trace.getTracer("lr-apps-web");

export async function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => Promise<T> | T,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw err;
    } finally {
      span.end();
    }
  });
}
