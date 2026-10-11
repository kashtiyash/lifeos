import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { AppShell } from "@/components/app-shell";

/**
 * Protected area. Route protection in the proxy is a UX layer only; this
 * server-side check on the verified Clerk session is the real gate. Every
 * protected server operation still verifies identity independently.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return <AppShell>{children}</AppShell>;
}
