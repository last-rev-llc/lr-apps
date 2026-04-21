import type { EmailTemplate } from "../types";
import { escapeHtml, renderButton, renderLayout } from "./layout";

export interface WelcomeEmailData {
  name?: string;
  loginUrl: string;
}

export const welcomeEmail: EmailTemplate<WelcomeEmailData> = {
  subject: () => "Welcome to Last Rev",
  html: ({ name, loginUrl }) =>
    renderLayout({
      title: "Welcome to Last Rev",
      preheader: "Your Last Rev account is ready.",
      body: `
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Welcome${name ? `, ${escapeHtml(name)}` : ""}!</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
          Thanks for signing up. Your Last Rev account is ready — sign in to explore the apps you have access to.
        </p>
        ${renderButton("Open Last Rev", loginUrl)}
        <p style="margin:0;font-size:13px;line-height:1.6;color:#a1a8c4;">
          Reply to this email if you have any questions.
        </p>
      `,
    }),
  text: ({ name, loginUrl }) =>
    `Welcome${name ? `, ${name}` : ""}!\n\nYour Last Rev account is ready. Sign in here:\n${loginUrl}\n\nReply to this email if you have any questions.`,
};
