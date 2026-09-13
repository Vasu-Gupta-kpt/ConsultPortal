"use client";

import { useState, useTransition } from "react";
import { MessageCircle, X, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { dismissSlotRequest, fulfillSlotRequest } from "@/lib/actions/peer-practice";
import type { SlotLocation } from "@/lib/types";
import { formatDateLabel, slotsOverlap, toDateInputValue } from "@/lib/utils";

export type IncomingSlotRequest = {
  id: string;
  requesterName: string;
  requesterContact: string | null;
  message: string | null;
  createdAt: string;
};

type ExistingSlot = { date: string; startTime: string; endTime: string };

const LOCATIONS: SlotLocation[] = ["NH", "OH", "Annexe", "Library", "LVH", "Tagore", "Online"];

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const today = new Date();
today.setHours(0, 0, 0, 0);

export default function SlotRequestsInbox({
  requests: initialRequests,
  existingSlots,
}: {
  requests: IncomingSlotRequest[];
  existingSlots: ExistingSlot[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDismiss(id: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await dismissSlotRequest(id);
      setBusyId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== id));
    });
  }

  function handleFulfilled(id: string, whatsappLink: string | null) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    if (whatsappLink) {
      window.open(whatsappLink, "_blank", "noopener,noreferrer");
    }
  }

  if (requests.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Slot Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground -mt-1 mb-2">
          Classmates asking you to add a Peer Practice slot. Add & book one directly, or dismiss.
        </p>
        {requests.map((r) => (
          <div key={r.id} className="rounded-lg border px-3 py-2.5 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {r.requesterName.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{r.requesterName}</p>
                  {r.message && <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.requesterContact && (
                  <a
                    href={`https://wa.me/${r.requesterContact.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                    title="Message on WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={isPending && busyId === r.id}
                  onClick={() => handleDismiss(r.id)}
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <div className="mt-2 ml-[42px]">
              <FulfillRequestButton
                request={r}
                existingSlots={existingSlots}
                onFulfilled={(whatsappLink) => handleFulfilled(r.id, whatsappLink)}
              />
            </div>
          </div>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

// Same date/time/location picker + slotsOverlap clash pre-check as
// AddSlotButton.tsx's "List a Practice Slot" dialog, retargeted to call
// fulfillSlotRequest instead of createAvailabilitySlot -- the slot it
// creates is immediately confirmed with this specific requester rather than
// left open for anyone to request.
function FulfillRequestButton({
  request,
  existingSlots,
  onFulfilled,
}: {
  request: IncomingSlotRequest;
  existingSlots: ExistingSlot[];
  onFulfilled: (whatsappLink: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [location, setLocation] = useState<SlotLocation>("NH");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    if (!date) {
      setError("Please pick a date.");
      return;
    }
    if (endTime <= startTime) {
      setError("End time must be after start time.");
      return;
    }
    const isoDate = toDateInputValue(date);
    const clash = existingSlots.find((s) => slotsOverlap(s, { date: isoDate, startTime, endTime }));
    if (clash) {
      setError(`This clashes with your ${clash.startTime}–${clash.endTime} slot on ${formatDateLabel(clash.date)}.`);
      return;
    }
    startTransition(async () => {
      const result = await fulfillSlotRequest(request.id, isoDate, startTime, endTime, location);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onFulfilled(result.whatsappLink);
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1.5"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
      >
        <CalendarPlus className="h-3.5 w-3.5" />
        Add & Book Slot
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add & Book a Slot for {request.requesterName}</DialogTitle>
            <DialogDescription>
              Pick a date and time — this slot is created and immediately confirmed with{" "}
              {request.requesterName}, no separate request step.
            </DialogDescription>
          </DialogHeader>

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
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground text-center">
                  Selected: {formatDateLabel(toDateInputValue(date))}
                </p>
                {(() => {
                  const isoDate = toDateInputValue(date);
                  const sameDaySlots = existingSlots.filter((s) => s.date === isoDate);
                  if (sameDaySlots.length === 0) return null;
                  return (
                    <div className="rounded-md border border-border bg-muted/40 p-2 text-xs">
                      <p className="font-medium text-muted-foreground mb-1 text-center">
                        Already listed this day:
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {sameDaySlots.map((s, i) => (
                          <span key={i} className="rounded-full border border-border bg-background px-2 py-0.5">
                            {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button className="w-full" disabled={isPending} onClick={handleConfirm}>
              {isPending ? "Booking..." : `Add & Book with ${request.requesterName.split(" ")[0]}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
