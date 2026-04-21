// Renders each transactional template to ./.preview/<name>.html so you can
// open them in a browser to QA branding/layout before sending real emails.
//
// Usage: pnpm --filter @repo/email preview
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  subscriptionCancellationEmail,
  subscriptionConfirmationEmail,
  welcomeEmail,
} from "../src/templates";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "..", ".preview");
mkdirSync(outDir, { recursive: true });

const files: Array<{ name: string; html: string }> = [
  {
    name: "welcome",
    html: welcomeEmail.html({ name: "Ada", loginUrl: "https://lastrev.com/login" }),
  },
  {
    name: "subscription-confirmation",
    html: subscriptionConfirmationEmail.html({
      name: "Ada",
      tier: "pro",
      manageUrl: "https://lastrev.com/billing",
    }),
  },
  {
    name: "subscription-cancellation",
    html: subscriptionCancellationEmail.html({
      name: "Ada",
      tier: "pro",
      periodEnd: "May 1, 2026",
      resubscribeUrl: "https://lastrev.com/pricing",
    }),
  },
];

for (const f of files) {
  const path = join(outDir, `${f.name}.html`);
  writeFileSync(path, f.html);
  console.log(`file://${path}`);
}
