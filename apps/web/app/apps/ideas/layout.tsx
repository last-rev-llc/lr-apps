import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "Ideas",
};

export default async function IdeasLayout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("ideas");
  return <main className="min-h-screen max-w-6xl mx-auto px-4 py-6">{children}</main>;
}
