import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_DOMAINS = ["iimcal.ac.in", "email.iimcal.ac.in"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?reason=exchange_failed`);
  }

  // Domain check — enforce an allowed IIMC domain regardless of what Google returns
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email ?? "";

  if (!ALLOWED_DOMAINS.some((domain) => email.endsWith(`@${domain}`))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/error?reason=domain`);
  }

  // Present only when this sign-in requested offline access + the calendar
  // scope (see ConnectCalendarButton.tsx) -- absent on a normal sign-in, or
  // if Google didn't reissue one (e.g. already granted and no
  // prompt=consent). Best-effort: a student can always retry "Connect
  // Google Calendar" from /profile.
  const refreshToken = data.session?.provider_refresh_token;
  if (refreshToken && user) {
    await supabase
      .from("google_calendar_tokens")
      .upsert({ profile_id: user.id, refresh_token: refreshToken, updated_at: new Date().toISOString() });
    await supabase.from("profiles").update({ google_calendar_connected: true }).eq("id", user.id);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
