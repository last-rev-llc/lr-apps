import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import type { ReactNode } from "react";

export const metadata = {
  title: "Area 52",
  description: "Top-secret experiments and classified projects.",
};

export const viewport = {
  themeColor: "#22c55e",
};

export default async function Area52Layout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("area-52");

  return children;
}
