import { requireAccess } from "@repo/auth/server";
import type { ReactNode } from "react";

export default async function AiCalculatorProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAccess("ai-calculator");
  return children;
}
