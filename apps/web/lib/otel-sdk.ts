// Initializes the OpenTelemetry NodeSDK for the server runtime. Skipped
// when `OTEL_SDK_DISABLED=true` (tests, CI without a backend) or when
// neither `OTEL_EXPORTER_OTLP_ENDPOINT` nor `NEXT_RUNTIME=nodejs` is set.
//
// Imported from `instrumentation.ts` in the nodejs branch only.

export async function startOtelSdk(): Promise<void> {
  if (process.env.OTEL_SDK_DISABLED === "true") return;
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;

  const { NodeSDK } = await import("@opentelemetry/sdk-node");
  const { OTLPTraceExporter } = await import(
    "@opentelemetry/exporter-trace-otlp-http"
  );
  const { resourceFromAttributes } = await import("@opentelemetry/resources");
  const { ATTR_SERVICE_NAME } = await import(
    "@opentelemetry/semantic-conventions"
  );

  const serviceName = process.env.OTEL_SERVICE_NAME ?? "lr-apps-web";

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
  });

  sdk.start();

  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("otel shutdown failed", err);
      });
  });
}
