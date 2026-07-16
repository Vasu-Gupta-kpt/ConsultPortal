"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hostel } from "@/lib/types";

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

  if (!user) {
    redirect("/");
  }

  const year = Number(formData.get("year"));
  const hostel = String(formData.get("hostel") ?? "").trim();
  const contactNumber = String(formData.get("contact_number") ?? "").trim();
  const roomNumber = String(formData.get("room_number") ?? "").trim();
  const specialization = String(formData.get("specialization") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (year !== 1 && year !== 2) {
    return { error: "Please select your year." };
  }
  if (!isHostel(hostel)) {
    return { error: "Please select a valid hostel." };
  }
  if (!isValidContactNumber(contactNumber)) {
    return { error: "Please enter a valid contact number." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      year,
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

  redirect("/dashboard");
}
