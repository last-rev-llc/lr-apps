import type { ReactNode } from "react";

export const metadata = {
  title: "Brommie Starts the Quake!!",
  description: "One kid. One wave. 18,000 fans losing their minds.",
};

export const viewport = {
  themeColor: "#0067B1",
};

export default function BrommieQuakeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
