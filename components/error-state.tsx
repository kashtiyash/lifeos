"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { targetSizes } from "@/lib/ui/targets";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/** Retryable error state for data views. */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this view. Please try again.",
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border px-6 py-12 text-center",
        className,
      )}
    >
      <TriangleAlertIcon aria-hidden className="mb-3 size-8 text-destructive" />
      <h2 className="font-heading text-base font-medium">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          className={cn("mt-5", targetSizes.default)}
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
