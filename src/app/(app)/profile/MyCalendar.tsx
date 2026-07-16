"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLabel, parseDateInputValue, toDateInputValue } from "@/lib/utils";
import type { SlotLocation } from "@/lib/types";

export type ConfirmedSession = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: SlotLocation;
  counterpartName: string;
};

export default function MyCalendar({ sessions }: { sessions: ConfirmedSession[] }) {
  const [selected, setSelected] = useState<Date | undefined>(undefined);

  const sessionDates = useMemo(() => sessions.map((s) => parseDateInputValue(s.date)), [sessions]);

  const selectedIso = selected ? toDateInputValue(selected) : null;
  const sessionsOnSelected = selectedIso ? sessions.filter((s) => s.date === selectedIso) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No confirmed practice sessions yet -- once a request is accepted, it&apos;ll show up
            here.
          </p>
        ) : (
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            modifiers={{ hasSession: sessionDates }}
            modifiersClassNames={{
              hasSession: "[&>button]:font-semibold [&>button]:ring-2 [&>button]:ring-primary/50",
            }}
            className="rounded-lg border w-fit"
          />
        )}

        {sessionsOnSelected.length > 0 && selectedIso && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {formatDateLabel(selectedIso)}
            </p>
            {sessionsOnSelected.map((s) => (
              <div key={s.id} className="rounded-lg border px-3 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {s.startTime} – {s.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {s.location}
                  </span>
                  <span>with {s.counterpartName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
