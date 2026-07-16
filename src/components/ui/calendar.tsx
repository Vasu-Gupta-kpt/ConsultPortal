"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-2",
        month: "space-y-2",
        month_caption: "flex justify-center items-center h-8 relative",
        caption_label: "text-sm font-medium",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 h-8 px-1",
        button_previous:
          "inline-flex items-center justify-center rounded-md h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none",
        button_next:
          "inline-flex items-center justify-center rounded-md h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none",
        month_grid: "w-full border-collapse mt-1",
        weekdays: "flex",
        weekday: "text-muted-foreground w-9 text-xs font-normal text-center",
        week: "flex w-full mt-1",
        day: "text-center text-sm p-0 relative",
        day_button:
          "inline-flex items-center justify-center rounded-md h-9 w-9 text-sm font-normal transition-colors hover:bg-muted",
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90",
        today: "[&>button]:border [&>button]:border-primary",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30 [&>button]:pointer-events-none [&>button]:opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
