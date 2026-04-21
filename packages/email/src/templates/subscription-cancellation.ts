import type { EmailTemplate } from "../types";
import { escapeHtml, renderButton, renderLayout } from "./layout";

export interface SubscriptionCancellationData {
  name?: string;
  tier: string;
  /** Date the access ends (ISO string or human-readable string). */
  periodEnd: string;
  resubscribeUrl: string;
}

export const subscriptionCancellationEmail: EmailTemplate<SubscriptionCancellationData> = {
  subject: () => "Your Last Rev subscription has been cancelled",
  html: ({ name, tier, periodEnd, resubscribeUrl }) =>
    renderLayout({
      title: "Subscription cancelled",
      preheader: `Access continues until ${periodEnd}.`,
      body: `
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Subscription cancelled</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
          ${name ? `Hi ${escapeHtml(name)}, y` : "Y"}our <strong>${escapeHtml(tier)}</strong> subscription has been cancelled. You'll keep access to ${escapeHtml(tier)} features until <strong>${escapeHtml(periodEnd)}</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
          We're sorry to see you go. You can resubscribe at any time from the link below.
        </p>
        ${renderButton("Resubscribe", resubscribeUrl)}
      `,
    }),
  text: ({ name, tier, periodEnd, resubscribeUrl }) =>
    `${name ? `Hi ${name}, y` : "Y"}our ${tier} subscription has been cancelled. Access continues until ${periodEnd}.\n\nResubscribe:\n${resubscribeUrl}`,
};
