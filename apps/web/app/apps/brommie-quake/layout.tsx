import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "Brommie Starts the Quake!!",
  description: "One kid. One wave. 18,000 fans losing their minds.",
};

export const viewport = {
  themeColor: "#0067B1",
};

export default async function BrommieQuakeLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("brommie-quake");
  return children;
}
