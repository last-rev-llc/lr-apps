import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import type { ReactNode } from "react";

export const metadata = {
  title: "Lighthouse",
  description: "Performance monitoring and Lighthouse score tracking.",
};

export const viewport = {
  themeColor: "#f97316",
};

export default async function LighthouseLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("lighthouse");

  return <>{children}</>;
}
