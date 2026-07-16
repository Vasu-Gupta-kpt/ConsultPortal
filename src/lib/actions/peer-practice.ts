"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { createCalendarEvent, deleteCalendarEvent, getFreshAccessToken } from "@/lib/google-calendar";
import type { SlotLocation } from "@/lib/types";

type RequestResult = { error: string } | { success: true; whatsappLink: string | null };
type SimpleResult = { error: string } | { success: true };

// Best-effort: creates a Google Calendar event on `ownerId`'s calendar
// (organizer) with `attendeeEmail` invited, if and only if that owner has
// connected Calendar (has a row in google_calendar_tokens). Returns the
// created event id, or null if skipped/failed for any reason -- never
// throws, since Calendar sync must never block the booking action itself.
async function tryCreateCalendarEvent({
  ownerId,
  attendeeEmail,
  summary,
  slot,
}: {
  ownerId: string;
  attendeeEmail: string;
  summary: string;
  slot: { slot_date: string; start_time: string; end_time: string; location: string };
}): Promise<string | null> {
  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from("google_calendar_tokens")
    .select("refresh_token")
    .eq("profile_id", ownerId)
    .maybeSingle();
  if (!tokenRow) return null;

  const accessToken = await getFreshAccessToken(tokenRow.refresh_token);
  if (!accessToken) return null;

  return createCalendarEvent({
    accessToken,
    summary,
    description: "Booked via the IIMC Consult Club portal.",
    location: slot.location,
    startISO: `${slot.slot_date}T${slot.start_time}`,
    endISO: `${slot.slot_date}T${slot.end_time}`,
    attendeeEmail,
  });
}

// Best-effort: deletes a previously-created event from `ownerId`'s calendar.
async function tryDeleteCalendarEvent({ ownerId, eventId }: { ownerId: string; eventId: string }) {
  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from("google_calendar_tokens")
    .select("refresh_token")
    .eq("profile_id", ownerId)
    .maybeSingle();
  if (!tokenRow) return;

  const accessToken = await getFreshAccessToken(tokenRow.refresh_token);
  if (!accessToken) return;

  await deleteCalendarEvent({ accessToken, eventId });
}

function formatSlot(slot: { slot_date: string; start_time: string; end_time: string; location: string }) {
  return `${slot.slot_date} (${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}) at ${slot.location}`;
}

export async function requestBooking(slotId: string): Promise<RequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: booking, error } = await supabase.rpc("request_booking", { p_slot_id: slotId });
  if (error || !booking) return { error: error?.message ?? "Failed to request this slot." };

  const [{ data: slot }, { data: requesterProfile }] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("slot_date, start_time, end_time, location, profiles(full_name, email, contact_number)")
      .eq("id", slotId)
      .single(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  let whatsappLink: string | null = null;

  const owner = slot?.profiles as
    | { full_name: string | null; email: string; contact_number: string | null }
    | null
    | undefined;

  if (slot && owner) {
    const requesterName = requesterProfile?.full_name ?? "A classmate";
    const slotDescription = formatSlot(slot);
    const message = `Hi! I've requested to book your Peer Practice slot on ${slotDescription} via the IIMC Consult Club portal. Please accept or decline it at /profile.`;

    void sendEmail({
      to: owner.email,
      subject: "New Peer Practice request",
      html: `<p><strong>${requesterName}</strong> has requested to book your practice slot on ${slotDescription}.</p><p>Accept or decline it from your profile page.</p>`,
    });

    if (owner.contact_number) {
      whatsappLink = buildWhatsAppLink(owner.contact_number, message);
    }
  }

  revalidatePath("/peer-practice");
  revalidatePath("/profile");
  return { success: true, whatsappLink };
}

export async function acceptBooking(bookingId: string): Promise<RequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // accept_booking now returns the confirmed row PLUS every sibling pending
  // request that got auto-declined as a side effect (a slot can have
  // multiple simultaneous pending requests -- see
  // supabase/migrations/*_multi_request_slots.sql).
  const { data: rows, error } = await supabase.rpc("accept_booking", { p_booking_id: bookingId });
  if (error || !rows || rows.length === 0) {
    return { error: error?.message ?? "Failed to accept this request." };
  }

  const confirmed = rows.find((r) => r.status === "confirmed");
  const autoDeclined = rows.filter((r) => r.status === "declined");
  if (!confirmed) return { error: "Failed to accept this request." };

  const [{ data: slot }, { data: ownerProfile }, { data: requesterProfile }] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("slot_date, start_time, end_time, location")
      .eq("id", confirmed.slot_id)
      .single(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("profiles")
      .select("email, contact_number, full_name")
      .eq("id", confirmed.booked_by)
      .single(),
  ]);

  let whatsappLink: string | null = null;

  if (slot && requesterProfile) {
    const ownerName = ownerProfile?.full_name ?? "Your practice partner";
    const slotDescription = formatSlot(slot);
    const message = `Hi! ${ownerName} accepted your Peer Practice request for ${slotDescription}. See you then!`;

    void sendEmail({
      to: requesterProfile.email,
      subject: "Your Peer Practice request was accepted",
      html: `<p><strong>${ownerName}</strong> accepted your request for ${slotDescription}.</p>`,
    });

    if (requesterProfile.contact_number) {
      whatsappLink = buildWhatsAppLink(requesterProfile.contact_number, message);
    }

    const eventId = await tryCreateCalendarEvent({
      ownerId: user.id,
      attendeeEmail: requesterProfile.email,
      summary: `Peer Practice: ${ownerName} x ${requesterProfile.full_name ?? "classmate"}`,
      slot,
    });
    if (eventId) {
      const admin = createAdminClient();
      await admin.from("bookings").update({ google_event_id: eventId }).eq("id", confirmed.id);
    }
  }

  // Every other student who'd requested this slot lost out to whoever just
  // got accepted -- let them know so they can go find another slot.
  for (const declined of autoDeclined) {
    const { data: declinedRequester } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", declined.booked_by)
      .single();
    if (declinedRequester) {
      void sendEmail({
        to: declinedRequester.email,
        subject: "Your Peer Practice request was declined",
        html: `<p>This slot was confirmed with another student. Feel free to browse other available slots on Peer Practice.</p>`,
      });
    }
  }

  revalidatePath("/peer-practice");
  revalidatePath("/profile");
  return { success: true, whatsappLink };
}

export async function declineBooking(bookingId: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: booking, error } = await supabase.rpc("decline_booking", { p_booking_id: bookingId });
  if (error || !booking) return { error: error?.message ?? "Failed to decline this request." };

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", booking.booked_by)
    .single();

  if (requesterProfile) {
    void sendEmail({
      to: requesterProfile.email,
      subject: "Your Peer Practice request was declined",
      html: `<p>Your practice request was declined. Feel free to browse other available slots on Peer Practice.</p>`,
    });
  }

  revalidatePath("/peer-practice");
  revalidatePath("/profile");
  return { success: true };
}

export async function cancelBooking(bookingId: string): Promise<RequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // Read the booking (and who's on the other end of it) before cancelling,
  // while RLS still lets a participant see it.
  const { data: bookingBefore } = await supabase
    .from("bookings")
    .select(
      "booked_by, google_event_id, availability_slots(profile_id, slot_date, start_time, end_time, location)"
    )
    .eq("id", bookingId)
    .single();

  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: bookingId });
  if (error) return { error: error.message };

  let whatsappLink: string | null = null;

  if (bookingBefore) {
    const slot = bookingBefore.availability_slots as
      | { profile_id: string; slot_date: string; start_time: string; end_time: string; location: string }
      | null;
    const ownerId = slot?.profile_id;
    const otherPartyId = user.id === bookingBefore.booked_by ? ownerId : bookingBefore.booked_by;

    if (otherPartyId) {
      const { data: otherProfile } = await supabase
        .from("profiles")
        .select("email, contact_number")
        .eq("id", otherPartyId)
        .single();

      if (otherProfile) {
        const slotDescription = slot ? formatSlot(slot) : "your session";
        void sendEmail({
          to: otherProfile.email,
          subject: "A Peer Practice session was cancelled",
          html: `<p>Your practice session${slot ? ` on ${slotDescription}` : ""} was cancelled.</p>`,
        });

        if (otherProfile.contact_number) {
          whatsappLink = buildWhatsAppLink(
            otherProfile.contact_number,
            `Hi, just letting you know our Peer Practice session${slot ? ` on ${slotDescription}` : ""} has been cancelled.`
          );
        }
      }
    }

    if (bookingBefore.google_event_id && ownerId) {
      await tryDeleteCalendarEvent({ ownerId, eventId: bookingBefore.google_event_id });
    }
  }

  revalidatePath("/peer-practice");
  revalidatePath("/profile");
  return { success: true, whatsappLink };
}

export async function createAvailabilitySlot(
  date: string,
  startTime: string,
  endTime: string,
  location: SlotLocation
): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("availability_slots").insert({
    profile_id: user.id,
    slot_date: date,
    start_time: startTime,
    end_time: endTime,
    location,
  });
  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/peer-practice");
  return { success: true };
}

export async function deleteAvailabilitySlot(slotId: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("availability_slots")
    .delete()
    .eq("id", slotId)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/peer-practice");
  return { success: true };
}
