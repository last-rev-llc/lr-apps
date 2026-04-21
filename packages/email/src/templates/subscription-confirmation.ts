import type { EmailTemplate } from "../types";
import { escapeHtml, renderButton, renderLayout } from "./layout";

export interface SubscriptionConfirmationData {
  name?: string;
  tier: "pro" | "enterprise";
  manageUrl: string;
}

export const subscriptionConfirmationEmail: EmailTemplate<SubscriptionConfirmationData> = {
  subject: ({ tier }) => `Your Last Rev ${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription is active`,
  html: ({ name, tier, manageUrl }) =>
    renderLayout({
      title: "Subscription confirmed",
      preheader: `Your ${tier} subscription is active.`,
      body: `
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">You're on Last Rev ${escapeHtml(tier)}</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
          ${name ? `Hi ${escapeHtml(name)}, t` : "T"}hanks for upgrading. Your <strong style="color:#f59e0b;">${escapeHtml(tier)}</strong> subscription is now active and all matching app features are unlocked.
        </p>
        ${renderButton("Manage subscription", manageUrl)}
        <p style="margin:0;font-size:13px;line-height:1.6;color:#a1a8c4;">
          You can change your plan or update payment details from your billing portal at any time.
        </p>
      `,
    }),
  text: ({ name, tier, manageUrl }) =>
    `${name ? `Hi ${name}, t` : "T"}hanks for upgrading. Your ${tier} subscription is now active.\n\nManage your subscription:\n${manageUrl}`,
};
