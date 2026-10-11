import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/auth/session";

/**
 * Protected area. Route protection in the proxy is a UX layer only; this
 * server-side session check is the real gate. Every protected server operation
 * still verifies identity independently.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const account =
    session.source === "e2e"
      ? ({ mode: "e2e", name: session.name ?? "Test user" } as const)
      : ({ mode: "clerk" } as const);

  return <AppShell account={account}>{children}</AppShell>;
}
