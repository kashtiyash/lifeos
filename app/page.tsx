import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { targetSizes } from "@/lib/ui/targets";

export default async function HomePage() {
  // Signed-in visitors go straight into the app; the landing page is for
  // signed-out visitors and new sign-ups.
  const userId = await getCurrentUserId();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-2 px-4 py-3 md:px-6">
        <span className="font-heading text-base font-semibold">LifeOS</span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" className={targetSizes.default}>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Your day, organized.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground text-pretty">
            Tasks, projects, habits, notes, and reminders in one calm system that
            keeps today in front of you.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className={cn("gap-2", targetSizes.primary)}>
              <Link href="/sign-up">
                Create your account
                <ArrowRightIcon aria-hidden className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={targetSizes.primary}
            >
              <Link href="/sign-in">I already have an account</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted-foreground md:px-6">
        LifeOS v1 — greenfield build
      </footer>
    </div>
  );
}
