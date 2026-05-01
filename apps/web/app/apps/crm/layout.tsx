import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "CRM",
};

export default async function CrmLayout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("crm");
  return <main className="min-h-screen max-w-6xl mx-auto px-4 py-6">{children}</main>;
}
