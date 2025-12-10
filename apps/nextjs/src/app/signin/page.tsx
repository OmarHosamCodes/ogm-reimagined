"use client";

import { Button, Input, Label } from "@ogm/ui";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Sign in failed");
      }

      // Redirect to home page
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: email.split("@")[0], // Use email prefix as name
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Sign up failed");
      }

      // Auto sign in after signup
      await handleSignIn(new Event("submit") as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="text-muted-foreground">
            Sign in to access your communities
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSignUp}
              disabled={isLoading}
            >
              Sign Up
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or for GHL users
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <h2 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
              GoHighLevel SSO
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Access your community through the GoHighLevel app or your
              community's custom link.
            </p>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
