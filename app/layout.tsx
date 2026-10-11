import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { isE2ETestAuthEnabled } from "@/lib/auth/e2e/config";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LifeOS",
    template: "%s · LifeOS",
  },
  description:
    "A calm personal operating system for tasks, projects, habits, notes, and reminders.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.145 0 0)" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const tree = (
    <html
      lang="en"
      className={cn("font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );

  // The secret-free test-auth adapter runs without a configured Clerk instance,
  // so ClerkProvider is omitted entirely in E2E mode (see lib/auth/e2e/config).
  if (isE2ETestAuthEnabled()) {
    return tree;
  }

  return <ClerkProvider>{tree}</ClerkProvider>;
}
