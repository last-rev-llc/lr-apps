// @opentelemetry/api falls back to a no-op tracer when no SDK is
// registered, so this module is safe to import in any runtime.
import { trace, SpanStatusCode, type Attributes, type Span } from "@opentelemetry/api";

const tracer = trace.getTracer("lr-apps-billing");

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
