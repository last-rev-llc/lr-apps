"use client";

import { useState } from "react";
import { createClient } from "@repo/db/client";
import { Button, Input, Label, Separator } from "@repo/ui";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.lastrev.com";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${authUrl}/my-apps`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-heading text-2xl text-accent mb-2">
          Check your email
        </h1>
        <p className="text-muted-foreground">
          We sent a confirmation link to <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl text-accent mb-1 text-center">
        Create Account
      </h1>
      <p className="text-muted-foreground text-sm text-center mb-6">
        Get access to Last Rev apps
      </p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
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
            minLength={8}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <Separator className="my-6" />

      <p className="text-sm text-muted-foreground text-center">
        Already have an account?{" "}
        <a href="/login" className="text-accent hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
