"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { targetSizes } from "@/lib/ui/targets";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

function toDateInputValue(date?: Date): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type DatePickerProps = {
  value?: Date;
  onChange?: (date?: Date) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Native date input on touch devices; a calendar popover on pointer devices.
 * Values are plain `Date` objects in local time; callers convert to the user's
 * timezone when persisting.
 */
export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
  const isTouch = useMediaQuery("(pointer: coarse)");

  if (isTouch) {
    return (
      <Input
        id={id}
        type="date"
        value={toDateInputValue(value)}
        disabled={disabled}
        className={className}
        onChange={(event) =>
          onChange?.(
            event.target.value
              ? new Date(`${event.target.value}T00:00:00`)
              : undefined,
          )
        }
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            targetSizes.default,
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon aria-hidden className="size-4" />
          {value ? dateFormatter.format(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
