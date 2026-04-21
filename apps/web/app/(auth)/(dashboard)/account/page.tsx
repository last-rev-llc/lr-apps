import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { getSubscription } from "@repo/billing";
import { SubscriptionCard } from "./components/SubscriptionCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account — LR Apps",
  description: "Manage your subscription and billing.",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const h = await headers();
  const host = getHostFromRequestHeaders(h);
  const auth0 = getAuth0ClientForHost(host);
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = session.user.sub as string;
  const subscription = await getSubscription(userId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-accent mb-1">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your plan and billing details.
        </p>
      </div>
      <SubscriptionCard subscription={subscription} />
    </div>
  );
}
