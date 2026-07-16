"use client";

import { useState, useTransition } from "react";
import { Calendar, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelBooking } from "@/lib/actions/peer-practice";
import type { BookingStatus, SlotLocation } from "@/lib/types";
import { cn, formatDateLabel } from "@/lib/utils";

export type OutgoingBooking = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: SlotLocation;
  hostName: string;
  hostContact: string | null;
  hostRoom: string | null;
  status: BookingStatus;
};

const statusStyles: Record<BookingStatus, string> = {
  pending: "text-amber-600 bg-amber-50 border-amber-200",
  confirmed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  declined: "text-red-600 bg-red-50 border-red-200",
  cancelled: "text-muted-foreground bg-muted border-border",
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
};

export default function MyBookings({ bookings: initialBookings }: { bookings: OutgoingBooking[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel(bookingId: string) {
    setError(null);
    setBusyId(bookingId);
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      setBusyId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
      if (result.whatsappLink) {
        window.open(result.whatsappLink, "_blank", "noopener,noreferrer");
      }
    });
  }

  const visible = bookings.filter((b) => b.status !== "cancelled" && b.status !== "declined");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t requested any practice sessions yet.
          </p>
        ) : (
          visible.map((b) => (
            <div key={b.id} className="rounded-lg border px-3 py-2.5 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{formatDateLabel(b.date)}</span>
                    <span className="text-muted-foreground">
                      {b.startTime} – {b.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground ml-5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {b.location}
                    </span>
                    <span>with {b.hostName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs", statusStyles[b.status])}>
                    {statusLabels[b.status]}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending && busyId === b.id}
                    onClick={() => handleCancel(b.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              {b.status === "confirmed" && (
                <div className="mt-2 ml-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {b.hostContact && <span>{b.hostContact}</span>}
                  {b.hostRoom && <span>Room {b.hostRoom}</span>}
                  {b.hostContact && (
                    <a
                      href={`https://wa.me/${b.hostContact.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <MessageCircle className="h-3 w-3" />
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
