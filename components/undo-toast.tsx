"use client";

import { toast } from "sonner";

export type UndoToastOptions = {
  description?: string;
  undoLabel?: string;
  onUndo?: () => void;
  duration?: number;
};

/**
 * Optimistic "Moved to Trash" / "Completed" feedback with Undo. Mount a single
 * `<Toaster />` in the root layout (already done) and call this from mutation
 * handlers. Prefer this over a blocking dialog for completions and Trash.
 */
export function showUndoToast(
  message: string,
  { description, undoLabel = "Undo", onUndo, duration = 6000 }: UndoToastOptions = {},
) {
  toast(message, {
    description,
    duration,
    action: onUndo
      ? {
          label: undoLabel,
          onClick: onUndo,
        }
      : undefined,
  });
}

/** Non-undo informational toast, kept here so notifications live in one place. */
export function showToast(
  message: string,
  options?: { description?: string; duration?: number },
) {
  toast(message, options);
}
