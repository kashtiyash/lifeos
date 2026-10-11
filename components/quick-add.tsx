"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { FormField } from "@/components/form-field";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { showToast } from "@/components/undo-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { targetSizes } from "@/lib/ui/targets";

type QuickAddProps = {
  onCreate?: (title: string) => void | Promise<void>;
  label?: string;
};

/**
 * Capture a task from anywhere in two taps. Sits within thumb reach above the
 * bottom navigation on phones. `onCreate` is wired to the task mutation in P-1;
 * until then it reports that capture is not yet connected.
 */
export function QuickAdd({ onCreate, label = "Quick add" }: QuickAddProps) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;

    setPending(true);
    try {
      if (onCreate) {
        await onCreate(value);
      } else {
        showToast("Quick add is not connected yet", {
          description: "Task capture arrives in the first product slice.",
        });
      }
      setTitle("");
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="icon"
        aria-label={label}
        className={cn(
          "fixed right-4 bottom-20 z-40 rounded-full shadow-lg md:right-6 md:bottom-6",
          targetSizes.primaryIcon,
        )}
        onClick={() => setOpen(true)}
      >
        <PlusIcon aria-hidden className="size-5" />
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Quick add"
        description="Capture a task in two taps."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Task" htmlFor="quick-add-title">
            <Input
              id="quick-add-title"
              value={title}
              autoFocus
              autoComplete="off"
              placeholder="What needs doing?"
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className={targetSizes.default}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={targetSizes.primary}
              disabled={pending || title.trim().length === 0}
            >
              Add task
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </>
  );
}
