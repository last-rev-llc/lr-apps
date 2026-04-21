import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { LastRevMiniHeader } from "@/components/last-rev-mini-header";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Last Rev Apps",
  description: "Internal tools and applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
    >
      <body className="min-h-screen flex flex-col">
        <WebVitalsReporter />
        <LastRevMiniHeader />
        <div className="flex-1">{children}</div>
        <script src="http://localhost:4747/widget.js" data-project="lr-apps" />
      </body>
    </html>
  );
}
