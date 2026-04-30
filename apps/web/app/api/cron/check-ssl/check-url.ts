// Shared SSL check helper used by the daily cron (issue #276) and the
// manual single-URL re-check route (issue #277). Opens a TLS connection
// to the given URL, reads the leaf cert, and UPSERTs site_metadata.
import tls from "node:tls";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withSpan } from "@/lib/otel";
import { log } from "@repo/logger";

export type CertInfo = {
  validTo: string;
  issuer: string | null;
};

const TLS_HANDSHAKE_TIMEOUT_MS = 10_000;

function parseHost(rawUrl: string): { host: string; port: number } {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`unsupported protocol: ${url.protocol}`);
  }
  const port = url.port ? Number(url.port) : 443;
  return { host: url.hostname, port };
}

export async function readCertificate(rawUrl: string): Promise<CertInfo> {
  const { host, port } = parseHost(rawUrl);

  return new Promise<CertInfo>((resolve, reject) => {
    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        // Keep the handshake alive even if the cert chain doesn't validate so
        // we can still record expiry/issuer details. The intent is monitoring,
        // not validation — UPSERT errors are recorded for review.
        rejectUnauthorized: false,
        ALPNProtocols: ["http/1.1"],
      },
      () => {
        try {
          const cert = socket.getPeerCertificate(true);
          if (!cert || Object.keys(cert).length === 0) {
            reject(new Error("no peer certificate"));
            return;
          }
          const validTo = cert.valid_to;
          if (!validTo) {
            reject(new Error("certificate missing valid_to"));
            return;
          }
          const issuer = cert.issuer?.CN ?? cert.issuer?.O ?? null;
          resolve({
            validTo: new Date(validTo).toISOString(),
            issuer,
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        } finally {
          socket.end();
        }
      },
    );

    const timeout = setTimeout(() => {
      socket.destroy(new Error("tls handshake timeout"));
    }, TLS_HANDSHAKE_TIMEOUT_MS);

    socket.once("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    socket.once("close", () => clearTimeout(timeout));
  });
}

export type SslCheckResult =
  | { url: string; ok: true; sslExpiry: string; sslIssuer: string | null }
  | { url: string; ok: false; error: string };

export async function checkSslForUrl(
  url: string,
  db: SupabaseClient,
): Promise<SslCheckResult> {
  return withSpan("cron.check-ssl.url", { "ssl.url": url }, async () => {
    const checkedAt = new Date().toISOString();
    try {
      const cert = await readCertificate(url);
      const { error } = await db.from("site_metadata").upsert(
        {
          url,
          sslExpiry: cert.validTo,
          sslIssuer: cert.issuer,
          sslLastChecked: checkedAt,
          sslLastError: null,
        },
        { onConflict: "url" },
      );
      if (error) {
        log.error("ssl upsert failed", { url, err: error });
        return { url, ok: false, error: error.message };
      }
      return { url, ok: true, sslExpiry: cert.validTo, sslIssuer: cert.issuer };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn("ssl check failed", { url, err: message });
      // Record the failure but leave prior sslExpiry/sslIssuer values intact.
      const { error } = await db.from("site_metadata").upsert(
        {
          url,
          sslLastChecked: checkedAt,
          sslLastError: message,
        },
        { onConflict: "url" },
      );
      if (error) {
        log.error("ssl error upsert failed", { url, err: error });
      }
      return { url, ok: false, error: message };
    }
  });
}
