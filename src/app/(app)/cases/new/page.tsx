import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewCaseForm from "./NewCaseForm";

export default async function NewCasePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/cases");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Add a Case</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Visible to every student in the Case Library once saved.
      </p>
      <NewCaseForm />
    </div>
  );
}
