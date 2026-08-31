"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Hostel } from "@/lib/types";
import { isProgram } from "@/lib/constants";

export type OnboardingState = { error: string } | null;

const HOSTELS: Hostel[] = [
  "New Hostel",
  "Tagore",
  "Ramanujan Hostel(OH)",
  "Lake View Hostel",
  "Annexe",
  "Tata Hall",
  "Others",
];

function isHostel(value: string): value is Hostel {
  return (HOSTELS as string[]).includes(value);
}

function isValidContactNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && /^[\d\s+\-()]+$/.test(value);
}

export async function submitOnboarding(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/");
  }

  const program = String(formData.get("program") ?? "").trim();
  const batchNumber = Number(formData.get("batch_number"));
  const hostel = String(formData.get("hostel") ?? "").trim();
  const contactNumber = String(formData.get("contact_number") ?? "").trim();
  const roomNumber = String(formData.get("room_number") ?? "").trim();
  const specialization = String(formData.get("specialization") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!isProgram(program)) {
    return { error: "Please select your program." };
  }
  if (!Number.isInteger(batchNumber) || batchNumber <= 0 || batchNumber >= 1000) {
    return { error: "Please enter a valid batch number." };
  }
  if (!isHostel(hostel)) {
    return { error: "Please select a valid hostel." };
  }
  if (!isValidContactNumber(contactNumber)) {
    return { error: "Please enter a valid contact number." };
  }

  // Plain update, not upsert: profiles has no INSERT policy for regular
  // users (row creation is exclusively the on_auth_user_created trigger's
  // job, running as SECURITY DEFINER) -- upsert compiles to
  // INSERT ... ON CONFLICT DO UPDATE, and Postgres checks INSERT-permission
  // RLS on that statement shape regardless of whether the row already
  // exists, so it fails RLS for every user, not just the rare missing-row
  // edge case it was meant to guard against. Reverted after that broke
  // onboarding for everyone.
  const { error } = await supabase
    .from("profiles")
    .update({
      program,
      batch_number: batchNumber,
      hostel,
      contact_number: contactNumber,
      room_number: roomNumber || null,
      specialization: specialization || null,
      bio: bio || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  // Without this, Next.js can serve a cached pre-onboarding render of
  // /dashboard (and /onboarding itself) right after this redirect --
  // showing the stale "not yet onboarded" gate result and bouncing back to
  // /onboarding in a loop, even though profiles.batch_number was just set.
  revalidatePath("/", "layout");

  redirect("/dashboard");
}
