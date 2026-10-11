"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { targetSizes } from "@/lib/ui/targets";

const THEMES = ["system", "light", "dark"] as const;
type ThemeName = (typeof THEMES)[number];

const LABELS: Record<ThemeName, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const ICONS: Record<ThemeName, React.ComponentType<{ "aria-hidden"?: boolean }>> = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
};

// False during SSR and the first paint, true on the client. Reading `theme`
// before hydration would mismatch the server markup, so gate on this.
const noopSubscribe = () => () => {};

/** Cycles System → Light → Dark. Theme is presentation only, never data. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const current: ThemeName = mounted
    ? ((THEMES as readonly string[]).includes(theme ?? "")
        ? (theme as ThemeName)
        : "system")
    : "system";
  const Icon = ICONS[current];

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${LABELS[current]}. Switch theme`}
      title={`Theme: ${LABELS[current]}`}
      className={targetSizes.icon}
      onClick={() =>
        setTheme(THEMES[(THEMES.indexOf(current) + 1) % THEMES.length])
      }
    >
      <Icon aria-hidden />
    </Button>
  );
}
