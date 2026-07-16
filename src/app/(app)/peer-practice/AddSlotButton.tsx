"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createAvailabilitySlot } from "@/lib/actions/peer-practice";
import type { SlotLocation } from "@/lib/types";
import { formatDateLabel, toDateInputValue } from "@/lib/utils";

const LOCATIONS: SlotLocation[] = ["NH", "OH", "Annexe", "Library", "LVH", "Tagore"];

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const today = new Date();
today.setHours(0, 0, 0, 0);

export default function AddSlotButton() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [location, setLocation] = useState<SlotLocation>("NH");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    if (!date) {
      setError("Please pick a date.");
      return;
    }
    if (endTime <= startTime) {
      setError("End time must be after start time.");
      return;
    }
    startTransition(async () => {
      const result = await createAvailabilitySlot(
        toDateInputValue(date),
        startTime,
        endTime,
        location
      );
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setDate(undefined);
    });
  }

  return (
    <>
      <Button
        size="sm"
        className="gap-1.5"
        onClick={() => {
          setOpen(true);
          setSuccess(false);
          setError(null);
        }}
      >
        <Plus className="h-4 w-4" />
        Add My Slot
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>List a Practice Slot</DialogTitle>
            <DialogDescription>
              Pick a date and time you&apos;re free — classmates will be able to request it.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-4 text-center space-y-3">
              <p className="text-sm text-emerald-600 font-medium">Slot added.</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => setSuccess(false)}>
                  Add another
                </Button>
                <Button size="sm" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={{ before: today }}
                className="rounded-lg border w-fit mx-auto"
              />
              <div className="flex flex-wrap items-end gap-2 justify-center">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Start</label>
                  <input
                    type="time"
                    className={selectClass}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">End</label>
                  <input
                    type="time"
                    className={selectClass}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Location</label>
                  <select
                    className={selectClass}
                    value={location}
                    onChange={(e) => setLocation(e.target.value as SlotLocation)}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {date && (
                <p className="text-xs text-muted-foreground text-center">
                  Selected: {formatDateLabel(toDateInputValue(date))}
                </p>
              )}
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button className="w-full" disabled={isPending} onClick={handleAdd}>
                {isPending ? "Adding..." : "Add Slot"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
