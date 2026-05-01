import type { EmailTemplate } from "../types";
// BRAND mirrors @repo/theme tokens — email clients strip <link>/<style>, so
// these inline style colors stand in for the design tokens.
import { BRAND, escapeHtml, renderLayout } from "./layout";

export type ClientHealthAlertSeverity = "critical" | "warning";
export type ClientHealthAlertType =
  | "status-down"
  | "ssl-expired"
  | "ssl-expiring"
  | "score-drop";

export interface ClientHealthAlertOffender {
  name: string;
  url: string;
  detail: string;
}

export interface ClientHealthAlertEmailData {
  clientName: string;
  alertType: ClientHealthAlertType;
  severity: ClientHealthAlertSeverity;
  summary: string;
  score?: number | null;
  scoreDelta?: number | null;
  offenders: ClientHealthAlertOffender[];
  dashboardUrl?: string | null;
}

const SEVERITY_LABEL: Record<ClientHealthAlertSeverity, string> = {
  critical: "CRITICAL",
  warning: "WARNING",
};

function renderOffenders(offenders: ClientHealthAlertOffender[]): string {
  if (offenders.length === 0) return "";
  const items = offenders
    .map(
      (o) =>
        `<li style="margin:0 0 8px;font-size:13px;line-height:1.5;"><strong>${escapeHtml(o.name)}</strong> &mdash; <a href="${escapeHtml(o.url)}" style="color:${BRAND.muted};">${escapeHtml(o.url)}</a><br /><span style="color:${BRAND.muted};">${escapeHtml(o.detail)}</span></li>`,
    )
    .join("");
  return `
        <h2 style="margin:24px 0 12px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.muted};">Affected sites</h2>
        <ul style="margin:0 0 16px;padding:0 0 0 18px;">${items}</ul>`;
}

export const clientHealthAlertEmail: EmailTemplate<ClientHealthAlertEmailData> = {
  subject: ({ clientName, severity }) =>
    `[${SEVERITY_LABEL[severity]}] Client health: ${clientName}`,
  html: (data) =>
    renderLayout({
      title: `Client health: ${data.clientName}`,
      preheader: data.summary,
      body: `
        <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3;">
          ${escapeHtml(SEVERITY_LABEL[data.severity])} &mdash; ${escapeHtml(data.clientName)}
        </h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">${escapeHtml(data.summary)}</p>
        ${typeof data.score === "number"
          ? `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${BRAND.muted};">Score: <strong style="color:${BRAND.text};">${data.score}</strong>${
              typeof data.scoreDelta === "number"
                ? ` (${data.scoreDelta > 0 ? "+" : ""}${data.scoreDelta})`
                : ""
            }</p>`
          : ""}
        ${renderOffenders(data.offenders)}
        ${data.dashboardUrl
          ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;"><a href="${escapeHtml(data.dashboardUrl)}" style="color:${BRAND.accent};">View dashboard</a></p>`
          : ""}
      `,
    }),
  text: (data) => {
    const lines: string[] = [];
    lines.push(`${SEVERITY_LABEL[data.severity]} — ${data.clientName}`);
    lines.push("");
    lines.push(data.summary);
    if (typeof data.score === "number") {
      const delta =
        typeof data.scoreDelta === "number"
          ? ` (${data.scoreDelta > 0 ? "+" : ""}${data.scoreDelta})`
          : "";
      lines.push(`Score: ${data.score}${delta}`);
    }
    if (data.offenders.length) {
      lines.push("");
      lines.push("Affected sites:");
      for (const o of data.offenders) {
        lines.push(`- ${o.name} (${o.url}) — ${o.detail}`);
      }
    }
    if (data.dashboardUrl) {
      lines.push("");
      lines.push(`Dashboard: ${data.dashboardUrl}`);
    }
    return lines.join("\n");
  },
};
