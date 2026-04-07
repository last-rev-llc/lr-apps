import { headers } from "next/headers";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { getAppBySlug } from "@/lib/app-registry";
import { getPlatformBaseUrl } from "@/lib/platform-urls";
import { hrefWithinDeployedApp } from "@/lib/proxy-utils";

export const metadata = {
  title: "AI ROI Calculator — Last Rev",
  description:
    "Estimate time and cost savings from AI-assisted meetings and automation.",
};

export default async function AiCalculatorLandingPage() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const app = getAppBySlug("ai-calculator");
  if (!app) {
    throw new Error("ai-calculator missing from registry");
  }

  const calcHref = hrefWithinDeployedApp(host, app, "calculator");
  const myAppsHref = `${getPlatformBaseUrl(host)}/my-apps`;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">
          Last Rev
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          AI ROI Calculator
        </h2>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          This page is open to everyone. The interactive model uses conservative
          research-backed assumptions — sign in with an account that has access
          to run the full calculator and save leads.
        </p>
      </div>

      <Card className="border-purple-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">
            Run the calculator
          </CardTitle>
          <CardDescription>
            You’ll be asked to sign in if needed, then we check app access the
            same way as other internal tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            asChild
            className="w-full text-base font-semibold py-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 border-0"
          >
            <Link href={calcHref}>Open ROI calculator</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={myAppsHref}>Back to My Apps</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
