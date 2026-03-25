import { Button } from "@repo/ui";

export default function UnauthorizedPage() {
  return (
    <div className="text-center">
      <h1 className="font-heading text-2xl text-accent mb-2">Access Denied</h1>
      <p className="text-muted-foreground mb-6">
        You don&apos;t have permission to access this app.
      </p>
      <a href="/my-apps">
        <Button>Go to My Apps</Button>
      </a>
    </div>
  );
}
