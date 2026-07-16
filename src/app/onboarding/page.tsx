import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "./OnboardingForm";

// Deliberately top-level (outside the (app) route group), so the
// (app)/layout.tsx gate -- which redirects here when profiles.year is NULL
// -- can never loop back onto this page.
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("year, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.year) {
    redirect("/dashboard");
  }

  const defaultFullName =
    profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-bold mb-1">Complete your profile</h1>
      <p className="text-sm text-muted-foreground mb-6">
        This helps classmates find you for peer practice and personalizes your dashboard.
      </p>
      <OnboardingForm defaultFullName={defaultFullName} />
    </div>
  );
}
