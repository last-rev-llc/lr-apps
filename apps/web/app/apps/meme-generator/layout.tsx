import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "Meme Generator",
};

export default async function MemeGeneratorLayout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("meme-generator");
  return <main className="min-h-screen max-w-6xl mx-auto px-4 py-6">{children}</main>;
}
