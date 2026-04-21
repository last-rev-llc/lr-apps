import { log } from "@repo/logger";
import { getResend } from "./resend-client";
import type { SendEmailParams, SendEmailResult } from "./types";

const DEFAULT_FROM = "noreply@lastrev.com";

export async function sendEmail<T>(
  params: SendEmailParams<T>,
): Promise<SendEmailResult> {
  const { to, from, replyTo, template, data } = params;
  const subject = template.subject(data);
  const html = template.html(data);
  const text = template.text?.(data);
  const fromAddress = from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM;

  const isDev = process.env.NODE_ENV !== "production";
  const hasKey = Boolean(process.env.RESEND_API_KEY);

  if (isDev && !hasKey) {
    const id = `dev-${cryptoRandomId()}`;
    log.info("email skipped (dev mode, no RESEND_API_KEY)", {
      id,
      to,
      from: fromAddress,
      subject,
      html,
      text,
    });
    return { id };
  }

  const resend = getResend();
  const result = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
    text,
    replyTo,
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Resend send failed");
  }
  if (!result.data?.id) {
    throw new Error("Resend response missing id");
  }
  return { id: result.data.id };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
