"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Hostel } from "@/lib/types";
import { isProgram } from "@/lib/constants";

export type ProfileState = { error: string } | { success: true } | null;

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

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const program = String(formData.get("program") ?? "").trim();
  const batchNumber = Number(formData.get("batch_number"));
  const hostel = String(formData.get("hostel") ?? "").trim();
  const contactNumber = String(formData.get("contact_number") ?? "").trim();
  const roomNumber = String(formData.get("room_number") ?? "").trim();
  const specialization = String(formData.get("specialization") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  if (!isProgram(program)) return { error: "Please select your program." };
  if (!Number.isInteger(batchNumber) || batchNumber <= 0 || batchNumber >= 1000) {
    return { error: "Please enter a valid batch number." };
  }
  if (!isHostel(hostel)) return { error: "Please select a valid hostel." };
  if (!isValidContactNumber(contactNumber)) {
    return { error: "Please enter a valid contact number." };
  }

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
      tags,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/peer-practice");
  revalidatePath("/dashboard");
  return { success: true };
}
