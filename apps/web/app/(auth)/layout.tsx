import type { ReactNode } from "react";

export const metadata = {
  title: "Last Rev",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
