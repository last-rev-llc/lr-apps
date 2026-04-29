// Brand tokens mirrored from packages/theme (kept inline because email
// clients strip <link>/<style> and require inline styles to render reliably).
export const BRAND = {
  bg: "#0f1629",
  surface: "#171b4e",
  text: "#f8fafc",
  muted: "#a1a8c4",
  accent: "#f59e0b",
  accentHover: "#d97706",
  accentText: "#0f1629",
  border: "#2d356b",
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface LayoutOptions {
  title: string;
  preheader?: string;
  body: string;
}

export function renderLayout({ title, preheader, body }: LayoutOptions): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.bg};color:${BRAND.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${BRAND.bg};">${escapeHtml(preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:12px;padding:40px;">
            <tr>
              <td>
                <div style="font-size:20px;font-weight:700;color:${BRAND.accent};letter-spacing:0.5px;margin-bottom:24px;">LAST REV</div>
                ${body}
                <hr style="border:none;border-top:1px solid ${BRAND.border};margin:32px 0 16px;" />
                <p style="color:${BRAND.muted};font-size:12px;line-height:1.5;margin:0;">
                  Last Rev — ${escapeHtml(new Date().getFullYear().toString())}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:${BRAND.accent};border-radius:8px;">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;color:${BRAND.accentText};font-weight:600;text-decoration:none;font-size:14px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}
