import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilitySlotRow, BookingStatus, ProfileRow, SlotLocation } from "@/lib/types";
import ProfileEditor from "./ProfileEditor";
import AvailabilityManager, { type OwnSlot } from "./AvailabilityManager";
import MyBookings, { type OutgoingBooking } from "./MyBookings";
import MyCalendar, { type ConfirmedSession } from "./MyCalendar";
import ConnectCalendarButton from "./ConnectCalendarButton";
import SlotRequestsInbox, { type IncomingSlotRequest } from "./SlotRequestsInbox";

type RequesterProfile = {
  full_name: string | null;
  contact_number: string | null;
  room_number: string | null;
};

type SlotBookingRow = {
  id: string;
  status: BookingStatus;
  booked_by: string;
  profiles: RequesterProfile | null;
};

type SlotWithBookings = AvailabilitySlotRow & {
  bookings: SlotBookingRow[];
};

type OutgoingBookingRow = {
  id: string;
  status: BookingStatus;
  availability_slots: {
    slot_date: string;
    start_time: string;
    end_time: string;
    location: SlotLocation;
    profiles: RequesterProfile | null;
  } | null;
};

type IncomingSlotRequestRow = {
  id: string;
  message: string | null;
  created_at: string;
  profiles: { full_name: string | null; contact_number: string | null } | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: profile }, { data: mySlotsRaw }, { data: myBookingsRaw }, { data: slotRequestsRaw }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("availability_slots")
        .select("*, bookings(id, status, booked_by, profiles(full_name, contact_number, room_number))")
        .eq("profile_id", user.id)
        .order("slot_date"),
      supabase
        .from("bookings")
        .select(
          "id, status, availability_slots(slot_date, start_time, end_time, location, profiles(full_name, contact_number, room_number))"
        )
        .eq("booked_by", user.id)
        .order("booked_at", { ascending: false }),
      supabase
        .from("slot_requests")
        .select("id, message, created_at, profiles!slot_requests_requested_by_fkey(full_name, contact_number)")
        .eq("requested_of", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

  if (!profile) {
    redirect("/onboarding");
  }

  const mySlots: OwnSlot[] = ((mySlotsRaw ?? []) as unknown as SlotWithBookings[])
    .map((s) => {
      const activeBookings = s.bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
      return {
        id: s.id,
        date: s.slot_date,
        startTime: s.start_time.slice(0, 5),
        endTime: s.end_time.slice(0, 5),
        location: s.location,
        bookings: activeBookings.map((b) => ({
          id: b.id,
          status: b.status as "pending" | "confirmed",
          requesterName: b.profiles?.full_name ?? "a classmate",
          requesterContact: b.profiles?.contact_number ?? null,
          requesterRoom: b.profiles?.room_number ?? null,
        })),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const myBookings: OutgoingBooking[] = ((myBookingsRaw ?? []) as unknown as OutgoingBookingRow[])
    .filter((b) => b.availability_slots !== null)
    .map((b) => {
      const slot = b.availability_slots!;
      return {
        id: b.id,
        date: slot.slot_date,
        startTime: slot.start_time.slice(0, 5),
        endTime: slot.end_time.slice(0, 5),
        location: slot.location,
        hostName: slot.profiles?.full_name ?? "a classmate",
        hostContact: slot.profiles?.contact_number ?? null,
        hostRoom: slot.profiles?.room_number ?? null,
        status: b.status,
      };
    });

  const incomingSlotRequests: IncomingSlotRequest[] = (
    (slotRequestsRaw ?? []) as unknown as IncomingSlotRequestRow[]
  ).map((r) => ({
    id: r.id,
    requesterName: r.profiles?.full_name ?? "A classmate",
    requesterContact: r.profiles?.contact_number ?? null,
    message: r.message,
    createdAt: r.created_at,
  }));

  const confirmedSessions: ConfirmedSession[] = [
    ...mySlots.flatMap((s) => {
      const confirmed = s.bookings.find((b) => b.status === "confirmed");
      if (!confirmed) return [];
      return [
        {
          id: confirmed.id,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location,
          counterpartName: confirmed.requesterName,
        },
      ];
    }),
    ...myBookings
      .filter((b) => b.status === "confirmed")
      .map((b) => ({
        id: b.id,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        location: b.location,
        counterpartName: b.hostName,
      })),
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Profile</h1>
          <p className="text-muted-foreground text-sm">{profile.email}</p>
        </div>
        <ConnectCalendarButton connected={(profile as ProfileRow).google_calendar_connected} />
      </div>
      <ProfileEditor profile={profile as ProfileRow} />
      <MyCalendar sessions={confirmedSessions} />
      <SlotRequestsInbox requests={incomingSlotRequests} />
      <AvailabilityManager slots={mySlots} />
      <MyBookings bookings={myBookings} />
    </div>
  );
}
