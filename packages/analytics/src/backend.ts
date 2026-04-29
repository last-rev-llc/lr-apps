export type AnalyticsProps = Record<string, unknown>;

export interface AnalyticsBackend {
  trackClient(event: string, props?: AnalyticsProps): void;
  captureServer(
    userId: string,
    event: string,
    props?: AnalyticsProps,
  ): Promise<void>;
}
