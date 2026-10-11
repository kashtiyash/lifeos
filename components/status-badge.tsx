import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Semantic tones only. Feature code never uses raw palette values. */
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral:
    "border-status-neutral/25 bg-status-neutral/10 text-status-neutral",
  info: "border-status-info/25 bg-status-info/10 text-status-info",
  success: "border-status-success/25 bg-status-success/10 text-status-success",
  warning: "border-status-warning/25 bg-status-warning/10 text-status-warning",
  danger: "border-status-danger/25 bg-status-danger/10 text-status-danger",
};

type StatusBadgeProps = {
  tone?: StatusTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * Status is never communicated by color alone: pass text (and optionally an
 * icon) alongside the tone.
 */
export function StatusBadge({
  tone = "neutral",
  icon,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("tabular-nums", TONE_CLASSES[tone], className)}
    >
      {icon}
      {children}
    </Badge>
  );
}

export type Priority = "low" | "medium" | "high" | "urgent";

const PRIORITY_TONE: Record<Priority, StatusTone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

type PriorityBadgeProps = {
  priority: Priority;
  className?: string;
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <StatusBadge tone={PRIORITY_TONE[priority]} className={className}>
      {PRIORITY_LABEL[priority]}
    </StatusBadge>
  );
}
