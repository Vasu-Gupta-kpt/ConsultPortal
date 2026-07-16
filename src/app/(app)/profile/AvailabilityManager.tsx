"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, MapPin, Calendar as CalendarIcon, MessageCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  acceptBooking,
  declineBooking,
  cancelBooking,
} from "@/lib/actions/peer-practice";
import type { SlotLocation } from "@/lib/types";
import { cn, formatDateLabel, toDateInputValue } from "@/lib/utils";

export type OwnBooking = {
  id: string;
  status: "pending" | "confirmed";
  requesterName: string;
  requesterContact: string | null;
  requesterRoom: string | null;
};

export type OwnSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: SlotLocation;
  // Multiple students can have a pending request on the same slot at once;
  // at most one of these will ever be 'confirmed' (the rest auto-decline).
  bookings: OwnBooking[];
};

const LOCATIONS: SlotLocation[] = ["NH", "OH", "Annexe", "Library", "LVH", "Tagore"];

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const today = new Date();
today.setHours(0, 0, 0, 0);

export default function AvailabilityManager({ slots: initialSlots }: { slots: OwnSlot[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [location, setLocation] = useState<SlotLocation>("NH");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
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
    const isoDate = toDateInputValue(date);
    startTransition(async () => {
      const result = await createAvailabilitySlot(isoDate, startTime, endTime, location);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSlots((prev) =>
        [
          ...prev,
          {
            id: crypto.randomUUID(),
            date: isoDate,
            startTime,
            endTime,
            location,
            bookings: [],
          },
        ].sort((a, b) => a.date.localeCompare(b.date))
      );
      setDate(undefined);
    });
  }

  function handleDelete(slotId: string) {
    setBusyId(slotId);
    startTransition(async () => {
      const result = await deleteAvailabilitySlot(slotId);
      setBusyId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    });
  }

  function handleAccept(slotId: string, bookingId: string) {
    setError(null);
    setBusyId(bookingId);
    startTransition(async () => {
      const result = await acceptBooking(bookingId);
      setBusyId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      // Accepting one request auto-declines every other pending request on
      // the same slot server-side -- reflect that by keeping only the
      // accepted booking.
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId
            ? {
                ...s,
                bookings: s.bookings
                  .filter((b) => b.id === bookingId)
                  .map((b) => ({ ...b, status: "confirmed" as const })),
              }
            : s
        )
      );
      if (result.whatsappLink) {
        window.open(result.whatsappLink, "_blank", "noopener,noreferrer");
      }
    });
  }

  function handleDecline(slotId: string, bookingId: string) {
    setError(null);
    setBusyId(bookingId);
    startTransition(async () => {
      const result = await declineBooking(bookingId);
      setBusyId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, bookings: s.bookings.filter((b) => b.id !== bookingId) } : s
        )
      );
    });
  }

  function handleCancel(slotId: string, bookingId: string) {
    setError(null);
    setBusyId(bookingId);
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      setBusyId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, bookings: s.bookings.filter((b) => b.id !== bookingId) } : s
        )
      );
      if (result.whatsappLink) {
        window.open(result.whatsappLink, "_blank", "noopener,noreferrer");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t listed any time slots yet. Add one below so classmates can request a
            practice session with you.
          </p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => {
              const confirmed = slot.bookings.find((b) => b.status === "confirmed");
              const pending = slot.bookings.filter((b) => b.status === "pending");
              return (
                <div key={slot.id} className="rounded-lg border px-3 py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{formatDateLabel(slot.date)}</span>
                        <span className="text-muted-foreground">
                          {slot.startTime} – {slot.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-5">
                        <MapPin className="h-3 w-3" />
                        {slot.location}
                      </div>
                    </div>
                    {!confirmed && pending.length === 0 && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={isPending && busyId === slot.id}
                        onClick={() => handleDelete(slot.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {confirmed && (
                    <div className="mt-2 ml-5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Confirmed with {confirmed.requesterName}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                          disabled={isPending && busyId === confirmed.id}
                          onClick={() => handleCancel(slot.id, confirmed.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {confirmed.requesterContact && <span>{confirmed.requesterContact}</span>}
                        {confirmed.requesterRoom && <span>Room {confirmed.requesterRoom}</span>}
                        {confirmed.requesterContact && (
                          <a
                            href={`https://wa.me/${confirmed.requesterContact.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {!confirmed && pending.length > 0 && (
                    <div className="mt-2 ml-5 space-y-1.5">
                      {pending.map((b) => (
                        <div key={b.id} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Pending: {b.requesterName}
                          </Badge>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            disabled={isPending && busyId === b.id}
                            onClick={() => handleAccept(slot.id, b.id)}
                            title="Accept"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            disabled={isPending && busyId === b.id}
                            onClick={() => handleDecline(slot.id, b.id)}
                            title="Decline"
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-border space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Add a slot
          </p>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={{ before: today }}
            className="rounded-lg border w-fit"
          />
          <div className="flex flex-wrap items-end gap-2">
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
            <Button size="sm" className={cn("gap-1")} disabled={isPending} onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5" />
              Add slot
            </Button>
          </div>
          {date && (
            <p className="text-xs text-muted-foreground">Selected: {formatDateLabel(toDateInputValue(date))}</p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
