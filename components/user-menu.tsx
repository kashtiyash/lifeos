"use client";

import { UserButton, useUser } from "@clerk/nextjs";

import { cn } from "@/lib/utils";

/**
 * Account control: the avatar (click for profile and sign-out) with the
 * signed-in user's display name shown beside it. The name resolves once the
 * Clerk session has loaded, so the server and first client render agree.
 */
export function UserMenu({
  className,
  hideNameBelowSm = false,
}: {
  className?: string;
  /** Hide the name below the `sm` breakpoint to protect narrow top bars. */
  hideNameBelowSm?: boolean;
}) {
  const { isLoaded, user } = useUser();

  const name =
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "";

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <UserButton />
      {isLoaded && name ? (
        <span
          className={cn(
            "min-w-0 truncate text-sm font-medium",
            hideNameBelowSm && "hidden sm:inline",
          )}
        >
          {name}
        </span>
      ) : null}
    </div>
  );
}
