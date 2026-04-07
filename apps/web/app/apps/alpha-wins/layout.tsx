import type { ReactNode } from "react";

export const metadata = {
  title: "Alpha Wins",
  description: "Recent wins & accomplishments — AlphaClaw integration gallery",
};

export const viewport = {
  themeColor: "#f59e0b",
};

export default function AlphaWinsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
