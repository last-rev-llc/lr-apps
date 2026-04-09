import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "Alpha Wins",
  description: "Recent wins & accomplishments — AlphaClaw integration gallery",
};

export const viewport = {
  themeColor: "#f59e0b",
};

export default async function AlphaWinsLayout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("alpha-wins");
  return <>{children}</>;
}
