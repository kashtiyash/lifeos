"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export interface SignInOption {
  id: string;
  name: string;
}

/**
 * Sign-in form for the secret-free test-auth adapter.
 *
 * Replaces Clerk's `<SignIn/>`/`<SignUp/>` when the adapter is active. It offers
 * one button per registered test user; choosing one posts to `/api/e2e/auth`,
 * which sets the session cookie, then navigates into the app.
 */
export function E2ESignIn({
  options,
  title,
  description,
}: {
  options: readonly SignInOption[];
  title: string;
  description: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function signIn(userId: string) {
    setPending(userId);
    setError(null);
    try {
      const response = await fetch("/api/e2e/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        setError("Could not start the test session. Try again.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not start the test session. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ul className="space-y-2">
        {options.map((option) => (
          <li key={option.id}>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center"
              disabled={pending !== null}
              onClick={() => signIn(option.id)}
            >
              {pending === option.id ? "Signing in…" : `Continue as ${option.name}`}
            </Button>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <p className="text-center text-xs text-muted-foreground">
        Test-auth mode — no Clerk instance is contacted.
      </p>
    </div>
  );
}
