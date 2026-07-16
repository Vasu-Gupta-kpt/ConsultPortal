import { createClient } from "@/lib/supabase/server";
import type { MaterialRow } from "@/lib/types";
import MaterialsBrowser, { type MaterialListItem } from "./MaterialsBrowser";

export default async function MaterialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: materials, error }, { data: profile }] = await Promise.all([
    supabase
      .from("materials")
      .select("*, material_downloads(count)")
      .order("created_at", { ascending: false }),
    user
      ? supabase.from("profiles").select("is_admin").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const items: MaterialListItem[] = (
    (materials ?? []) as Array<MaterialRow & { material_downloads: { count: number }[] }>
  ).map((m) => ({
    ...m,
    downloadCount: m.material_downloads?.[0]?.count ?? 0,
  }));

  return <MaterialsBrowser materials={items} isAdmin={profile?.is_admin ?? false} />;
}
