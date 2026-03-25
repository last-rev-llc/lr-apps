"use client";

import { use, useState } from "react";
import { createClient } from "@repo/db/client";
import { Button, Input, Label, Separator } from "@repo/ui";

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = use(searchParams);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.error ?? "");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.lastrev.com";
    const redirectTo = params.redirect
      ? `https://${params.redirect}.lastrev.com`
      : `${authUrl}/my-apps`;
    window.location.href = redirectTo;
  };

  return (
    <div>
      <h1 className="font-heading text-2xl text-accent mb-1 text-center">
        Sign In
      </h1>
      <p className="text-muted-foreground text-sm text-center mb-6">
        Access your Last Rev apps
      </p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@lastrev.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <Separator className="my-6" />

      <p className="text-sm text-muted-foreground text-center">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-accent hover:underline">
          Sign up
        </a>
      </p>
    </div>
  );
}
