"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CaseType, Difficulty, FileType, Industry, MaterialCategory } from "@/lib/types";

export type AdminFormState = { error: string } | null;

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

// Authorization is enforced entirely by RLS (see
// supabase/migrations/*_admin_content.sql -- INSERT is only permitted when
// profiles.is_admin is true for the caller). No redundant app-level check
// here, to keep a single source of truth for who's allowed to write.
export async function createCase(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const title = String(formData.get("title") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "") as Difficulty;
  const type = String(formData.get("type") ?? "") as CaseType;
  const industry = String(formData.get("industry") ?? "") as Industry;
  const company = String(formData.get("company") ?? "").trim();
  const framework = splitList(String(formData.get("framework") ?? ""));
  const casebook = String(formData.get("casebook") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const estimatedTime = Number(formData.get("estimated_time"));
  const tags = splitList(String(formData.get("tags") ?? ""));

  if (!title || !company || !description) {
    return { error: "Please fill in title, company, and description." };
  }
  if (!Number.isFinite(estimatedTime) || estimatedTime <= 0) {
    return { error: "Please enter a valid estimated time in minutes." };
  }

  const { error } = await supabase.from("cases").insert({
    title,
    difficulty,
    type,
    industry,
    company,
    framework,
    casebook: casebook || null,
    description,
    estimated_time: estimatedTime,
    tags,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/cases");
  redirect("/cases");
}

export async function createMaterial(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "") as MaterialCategory;
  const fileType = String(formData.get("file_type") ?? "") as FileType;
  // Set client-side by NewMaterialForm.tsx after it uploads the file
  // directly to Storage (see that component for why -- avoids routing file
  // bytes through this Server Action). Empty when no file was attached.
  const filePath = String(formData.get("file_path") ?? "").trim();
  const uploadedByLabel = String(formData.get("uploaded_by_label") ?? "").trim();
  const tags = splitList(String(formData.get("tags") ?? ""));

  if (!title || !description) {
    return { error: "Please fill in title and description." };
  }

  const { error } = await supabase.from("materials").insert({
    title,
    description,
    category,
    file_type: fileType,
    file_path: filePath || null,
    uploaded_by_label: uploadedByLabel || null,
    tags,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/materials");
  redirect("/materials");
}
