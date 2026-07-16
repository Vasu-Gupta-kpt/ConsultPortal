"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function downloadMaterial(
  materialId: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("file_path")
    .eq("id", materialId)
    .single();

  if (materialError || !material) return { error: "Material not found" };

  // Log the download regardless of whether a file is attached yet, so the
  // download count reflects genuine intent even for metadata-only rows.
  await supabase.from("material_downloads").insert({ material_id: materialId, user_id: user.id });
  revalidatePath("/materials");

  if (!material.file_path) {
    return { error: "This material doesn't have a file uploaded yet." };
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("materials")
    .createSignedUrl(material.file_path, 60);

  if (signError || !signed) {
    return { error: signError?.message ?? "Failed to generate download link." };
  }

  return { url: signed.signedUrl };
}
