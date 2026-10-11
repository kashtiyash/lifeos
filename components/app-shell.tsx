"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

import { QuickAdd } from "@/components/quick-add";
import { ThemeToggle } from "@/components/theme-toggle";
import { isActivePath, navItems } from "@/lib/ui/nav";
import { targetSizes } from "@/lib/ui/targets";
import { cn } from "@/lib/utils";

const skipLinkClass =
  "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring";

/**
 * Application shell: sidebar at/above 768px, bottom navigation below it.
 * Includes a skip link, labelled landmarks, `min-h-dvh`, safe-area insets for
 * the notched bottom bar, and a `QuickAdd` action within thumb reach.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <a href="#main" className={skipLinkClass}>
        Skip to content
      </a>

      {/* Sidebar (≥768px) */}
      <aside className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-64 md:flex-col md:gap-2 md:p-3">
        <div className="px-2 py-2">
          <Link
            href="/dashboard"
            className="font-heading text-base font-semibold"
          >
            LifeOS
          </Link>
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  targetSizes.default,
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <UserButton />
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* Top bar (<768px) */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] backdrop-blur md:hidden">
          <Link
            href="/dashboard"
            className="font-heading text-base font-semibold"
          >
            LifeOS
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserButton />
          </div>
        </header>

        <main
          id="main"
          className="flex-1 px-4 pt-4 pb-28 md:px-8 md:pt-6 md:pb-8"
        >
          {children}
        </main>

        {/* Bottom navigation (<768px) */}
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
          <ul className="grid grid-cols-5">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-14 min-h-11 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon aria-hidden className="size-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <QuickAdd />
    </div>
  );
}
