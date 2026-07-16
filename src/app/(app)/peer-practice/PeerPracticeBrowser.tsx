"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Search,
  Star,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { requestBooking } from "@/lib/actions/peer-practice";
import type { SlotLocation } from "@/lib/types";
import { cn, formatDateLabel, parseDateInputValue, toDateInputValue } from "@/lib/utils";

export type PeerSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: SlotLocation;
  isBooked: boolean;
};

export type PeerListItem = {
  id: string;
  name: string;
  year: 1 | 2;
  hostel: string;
  specialization: string | null;
  bio: string;
  contactNumber: string | null;
  roomNumber: string | null;
  rating: number;
  reviewCount: number;
  tags: string[];
  availability: PeerSlot[];
};

type YearFilter = "all" | "1" | "2";
type TimeBucket = "Morning" | "Afternoon" | "Evening" | "Night";

const LOCATIONS: SlotLocation[] = ["NH", "OH", "Annexe", "Library", "LVH", "Tagore"];

const TIME_BUCKETS: { label: TimeBucket; range: string }[] = [
  { label: "Morning", range: "6–12" },
  { label: "Afternoon", range: "12–17" },
  { label: "Evening", range: "17–20" },
  { label: "Night", range: "20+" },
];

function getTimeBucket(time: string): TimeBucket {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 20) return "Evening";
  return "Night";
}

function slotMatchesFilters(
  slot: PeerSlot,
  locations: Set<SlotLocation>,
  times: Set<TimeBucket>
): boolean {
  if (slot.isBooked) return false;
  if (locations.size > 0 && !locations.has(slot.location)) return false;
  if (times.size > 0 && !times.has(getTimeBucket(slot.startTime))) return false;
  return true;
}

export default function PeerPracticeBrowser({ students }: { students: PeerListItem[] }) {
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [locationFilter, setLocationFilter] = useState<Set<SlotLocation>>(new Set());
  const [timeFilter, setTimeFilter] = useState<Set<TimeBucket>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<PeerListItem | null>(null);
  const [dialogDate, setDialogDate] = useState<Date | undefined>(undefined);
  const [requestedSlot, setRequestedSlot] = useState<PeerSlot | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requestingSlotId, setRequestingSlotId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Locally-known-requested slot ids, layered on top of server data so a
  // just-requested slot immediately shows as unavailable everywhere without
  // waiting for revalidatePath's next full server round trip.
  const [locallyRequested, setLocallyRequested] = useState<Set<string>>(new Set());

  function toggleLocation(loc: SlotLocation) {
    setLocationFilter((prev) => {
      const next = new Set(prev);
      if (next.has(loc)) next.delete(loc);
      else next.add(loc);
      return next;
    });
  }

  function toggleTime(bucket: TimeBucket) {
    setTimeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) next.delete(bucket);
      else next.add(bucket);
      return next;
    });
  }

  const studentsWithLiveStatus = useMemo(
    () =>
      students.map((s) => ({
        ...s,
        availability: s.availability.map((slot) => ({
          ...slot,
          isBooked: slot.isBooked || locallyRequested.has(slot.id),
        })),
      })),
    [students, locallyRequested]
  );

  const filtered = useMemo(
    () =>
      studentsWithLiveStatus.filter((s) => {
        const matchesSearch =
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
          (s.specialization?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchesYear = yearFilter === "all" || s.year.toString() === yearFilter;
        const hasMatchingSlot =
          locationFilter.size === 0 && timeFilter.size === 0
            ? s.availability.some((sl) => !sl.isBooked)
            : s.availability.some((sl) => slotMatchesFilters(sl, locationFilter, timeFilter));
        return matchesSearch && matchesYear && hasMatchingSlot;
      }),
    [studentsWithLiveStatus, search, yearFilter, locationFilter, timeFilter]
  );

  const dialogStudent = selectedStudent
    ? studentsWithLiveStatus.find((s) => s.id === selectedStudent.id) ?? selectedStudent
    : null;

  const availableDates = useMemo(
    () =>
      dialogStudent
        ? [...new Set(dialogStudent.availability.filter((s) => !s.isBooked).map((s) => s.date))].map(
            parseDateInputValue
          )
        : [],
    [dialogStudent]
  );

  const dialogDateIso = dialogDate ? toDateInputValue(dialogDate) : null;
  const dialogSlots = dialogStudent
    ? dialogStudent.availability.filter((s) => !dialogDateIso || s.date === dialogDateIso)
    : [];

  function handleRequest(slot: PeerSlot) {
    setRequestError(null);
    setRequestingSlotId(slot.id);
    startTransition(async () => {
      const result = await requestBooking(slot.id);
      setRequestingSlotId(null);
      if ("error" in result) {
        setRequestError(result.error);
        return;
      }
      setLocallyRequested((prev) => new Set(prev).add(slot.id));
      setRequestedSlot(slot);
      setWhatsappLink(result.whatsappLink);
      setConfirmOpen(true);
    });
  }

  const hasSlotFilters = locationFilter.size > 0 || timeFilter.size > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Peer Practice</h1>
        <p className="text-muted-foreground text-sm">
          Find batchmates and seniors to practice mock case interviews.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Row 1: search + year */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or case type..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(["all", "1", "2"] as YearFilter[]).map((y) => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  yearFilter === y
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {y === "all" ? "All Years" : `Year ${y}`}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: location chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
            <MapPin className="h-3.5 w-3.5" /> Location
          </span>
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              onClick={() => toggleLocation(loc)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                locationFilter.has(loc)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* Row 3: time bucket chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
            <Clock className="h-3.5 w-3.5" /> Time
          </span>
          {TIME_BUCKETS.map(({ label, range }) => (
            <button
              key={label}
              onClick={() => toggleTime(label)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                timeFilter.has(label)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {label}
              <span className="ml-1 opacity-60">({range})</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Showing {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        {hasSlotFilters && (
          <button
            onClick={() => {
              setLocationFilter(new Set());
              setTimeFilter(new Set());
            }}
            className="ml-2 underline hover:text-foreground"
          >
            Clear slot filters
          </button>
        )}
      </p>

      {/* Student grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            locationFilter={locationFilter}
            timeFilter={timeFilter}
            onBook={() => {
              setSelectedStudent(student);
              setDialogDate(undefined);
            }}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>No students found. Try a different search or filter.</p>
        </div>
      )}

      {/* Request modal */}
      <Dialog
        open={!!selectedStudent}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedStudent(null);
            setRequestError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          {dialogStudent && (
            <>
              <DialogHeader>
                <DialogTitle>Request a Session</DialogTitle>
                <DialogDescription>
                  Pick a date and time slot with {dialogStudent.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-3 py-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {dialogStudent.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{dialogStudent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Year {dialogStudent.year} &bull; {dialogStudent.hostel}
                  </p>
                </div>
              </div>
              <Separator />
              {requestError && <p className="text-sm text-destructive pt-2">{requestError}</p>}
              <div className="py-2">
                <Calendar
                  mode="single"
                  selected={dialogDate}
                  onSelect={(d) => setDialogDate((prev) => (prev && d && prev.getTime() === d.getTime() ? undefined : d))}
                  disabled={(d) => !availableDates.some((a) => a.toDateString() === d.toDateString())}
                  className="rounded-lg border w-fit mx-auto"
                />
              </div>
              <div className="space-y-2 py-2">
                <p className="text-sm font-medium">
                  {dialogDateIso ? `Slots on ${formatDateLabel(dialogDateIso)}` : "All available slots"}
                </p>
                {dialogSlots.length === 0 && (
                  <p className="text-sm text-muted-foreground">No slots for this date.</p>
                )}
                {dialogSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm",
                      slot.isBooked
                        ? "opacity-50 bg-muted"
                        : "hover:border-primary/40 hover:bg-accent/50 cursor-pointer"
                    )}
                  >
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
                    {slot.isBooked ? (
                      <Badge variant="secondary" className="text-xs">
                        Unavailable
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={requestingSlotId === slot.id}
                        onClick={() => handleRequest(slot)}
                      >
                        {requestingSlotId === slot.id ? "Requesting..." : "Request"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <DialogTitle>Request Sent</DialogTitle>
          <DialogDescription className="mt-1">
            {requestedSlot && selectedStudent && (
              <>
                Your request to{" "}
                <span className="font-medium text-foreground">{selectedStudent.name}</span> for{" "}
                <span className="font-medium text-foreground">
                  {formatDateLabel(requestedSlot.date)}, {requestedSlot.startTime}
                </span>{" "}
                at <span className="font-medium text-foreground">{requestedSlot.location}</span> has
                been sent. They&apos;ll confirm it from their profile.
              </>
            )}
          </DialogDescription>
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-3 inline-flex items-center justify-center gap-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
              )}
            >
              <MessageCircle className="h-4 w-4" />
              Message on WhatsApp
            </a>
          )}
          <Button
            className="mt-2 w-full"
            onClick={() => {
              setConfirmOpen(false);
              setSelectedStudent(null);
            }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentCard({
  student,
  locationFilter,
  timeFilter,
  onBook,
}: {
  student: PeerListItem;
  locationFilter: Set<SlotLocation>;
  timeFilter: Set<TimeBucket>;
  onBook: () => void;
}) {
  const matchingSlots = student.availability.filter((s) =>
    slotMatchesFilters(s, locationFilter, timeFilter)
  );
  const availableSlots = student.availability.filter((s) => !s.isBooked).length;
  const displayCount =
    locationFilter.size === 0 && timeFilter.size === 0 ? availableSlots : matchingSlots.length;

  const slotLocations = [
    ...new Set(student.availability.filter((s) => !s.isBooked).map((s) => s.location)),
  ];

  return (
    <Card className="card-hover flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {student.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{student.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Year {student.year}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {student.hostel}
              </span>
            </div>
            {student.specialization && (
              <p className="text-xs text-primary font-medium mt-0.5 truncate">
                {student.specialization}
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">
          {student.bio}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {student.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>

        {slotLocations.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {slotLocations.map((loc) => (
              <span
                key={loc}
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border font-medium",
                  locationFilter.has(loc)
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border text-muted-foreground"
                )}
              >
                {loc}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="font-medium text-foreground">{student.rating.toFixed(1)}</span>
              <span>({student.reviewCount})</span>
            </span>
            <span
              className={cn(
                "font-medium",
                displayCount > 0 ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {displayCount} slot{displayCount !== 1 ? "s" : ""} free
            </span>
          </div>
          <Button size="sm" className="h-7 text-xs" disabled={availableSlots === 0} onClick={onBook}>
            Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
