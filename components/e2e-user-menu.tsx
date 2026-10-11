"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { targetSizes } from "@/lib/ui/targets";
import { cn } from "@/lib/utils";

/**
 * Account control for the secret-free test-auth adapter.
 *
 * Mirrors `UserMenu`'s layout (name beside a sign-out control) without Clerk:
 * sign-out clears the test cookie via the `/api/e2e/auth` endpoint and returns
 * to sign-in. Only rendered when the adapter is active (never in production).
 */
export function E2EUserMenu({
  name,
  className,
  hideNameBelowSm = false,
}: {
  name: string;
  className?: string;
  /** Hide the name below the `sm` breakpoint to protect narrow top bars. */
  hideNameBelowSm?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function signOut() {
    setPending(true);
    try {
      await fetch("/api/e2e/auth", { method: "DELETE" });
      router.push("/sign-in");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span
        data-testid="e2e-user-name"
        className={cn(
          "min-w-0 truncate text-sm font-medium",
          hideNameBelowSm && "hidden sm:inline",
        )}
      >
        {name}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        disabled={pending}
        onClick={signOut}
        className={targetSizes.icon}
      >
        <LogOutIcon aria-hidden />
      </Button>
    </div>
  );
}
