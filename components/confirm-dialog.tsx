"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { targetSizes } from "@/lib/ui/targets";

type ConfirmDialogProps = {
  trigger?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Confirmation before moving data to Trash or another destructive change.
 * Toggle actions (complete, check-in) stay immediate and must not use this.
 *
 * Uses Radix AlertDialog (role="alertdialog") for the confirmation semantics.
 * A bottom-sheet presentation for phones can be layered on when the Trash flow
 * lands (P-3); the accessible contract stays the same.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Move to Trash",
  cancelLabel = "Cancel",
  onConfirm,
  destructive = true,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={cn(targetSizes.default)}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            className={cn(targetSizes.primary)}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
