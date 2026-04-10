import { Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@repo/ui";
import type { Subscription } from "@repo/billing";
import { ManageSubscriptionButton } from "./ManageSubscriptionButton";

interface SubscriptionCardProps {
  subscription: Subscription | null;
}

function formatDate(isoString: string | null): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const isActive =
    subscription?.status === "active" || subscription?.status === "trialing";
  const isPastDue = subscription?.status === "past_due";
  const isCanceled = subscription?.status === "canceled";
  const hasStripeCustomer = Boolean(subscription?.stripe_customer_id);

  if (!subscription || !hasStripeCustomer) {
    return (
      <Card className="glass-sm max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Free Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are on the free tier. Upgrade to unlock more features.
          </p>
          <a
            href="/pricing"
            className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            View Pricing
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-sm max-w-lg">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            {capitalize(subscription.tier)} Plan
          </CardTitle>
          {isActive && (
            <StatusBadge variant="success">Active</StatusBadge>
          )}
          {isPastDue && (
            <StatusBadge variant="warning">Past Due</StatusBadge>
          )}
          {isCanceled && (
            <StatusBadge variant="error">Canceled</StatusBadge>
          )}
          {subscription.status === "incomplete" && (
            <StatusBadge variant="pending">Incomplete</StatusBadge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{capitalize(subscription.status.replace("_", " "))}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Renewal date</dt>
            <dd className="font-medium">{formatDate(subscription.current_period_end)}</dd>
          </div>
        </dl>
        {isPastDue && (
          <p className="text-sm text-amber-400">
            Your payment is past due. Please update your payment method to avoid service interruption.
          </p>
        )}
        {isCanceled && (
          <p className="text-sm text-red-400">
            Your subscription has been canceled. Access continues until the end of the billing period.
          </p>
        )}
        <ManageSubscriptionButton />
      </CardContent>
    </Card>
  );
}
