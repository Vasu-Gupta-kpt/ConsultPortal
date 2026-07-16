import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate for every signed-in-only route (Cases, Materials, Peer Practice,
 * Dashboard, Profile). Two checks:
 *   1. Not signed in -> back to the marketing home page.
 *   2. Signed in but onboarding incomplete (`profiles.year IS NULL`) ->
 *      /onboarding, which lives OUTSIDE this route group by design so this
 *      redirect can never loop back onto itself.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("year")
    .eq("id", user.id)
    .single();

  if (!profile?.year) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
