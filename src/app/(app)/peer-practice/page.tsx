import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilitySlotRow, ProfileRow } from "@/lib/types";
import { toDateInputValue } from "@/lib/utils";
import PeerPracticeBrowser, { type PeerListItem } from "./PeerPracticeBrowser";

export default async function PeerPracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const todayIso = toDateInputValue(new Date());

  const [{ data: profiles, error }, { data: bookedSlotRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, availability_slots(*)")
      .not("year", "is", null)
      .neq("id", user.id)
      .filter("availability_slots.slot_date", "gte", todayIso)
      .order("full_name"),
    supabase.rpc("booked_slot_ids"),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const bookedSlotIds = new Set((bookedSlotRows ?? []).map((row: { slot_id: string }) => row.slot_id));

  const students: PeerListItem[] = (
    (profiles ?? []) as Array<ProfileRow & { availability_slots: AvailabilitySlotRow[] }>
  )
    .map((p) => ({
      id: p.id,
      name: p.full_name ?? p.email,
      year: p.year as 1 | 2,
      hostel: p.hostel ?? "",
      specialization: p.specialization,
      bio: p.bio ?? "",
      contactNumber: p.contact_number,
      roomNumber: p.room_number,
      rating: p.rating ?? 0,
      reviewCount: p.review_count,
      tags: p.tags,
      availability: p.availability_slots
        .map((slot) => ({
          id: slot.id,
          date: slot.slot_date,
          startTime: slot.start_time.slice(0, 5),
          endTime: slot.end_time.slice(0, 5),
          location: slot.location,
          isBooked: bookedSlotIds.has(slot.id),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }));

  return <PeerPracticeBrowser students={students} />;
}
