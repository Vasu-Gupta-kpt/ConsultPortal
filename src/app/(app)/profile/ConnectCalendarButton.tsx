"use client";

import { useState } from "react";
import { CalendarCheck, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function ConnectCalendarButton({ connected }: { connected: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.events",
        // access_type=offline + prompt=consent guarantee Google reissues a
        // refresh token, which src/app/auth/callback/route.ts captures.
        queryParams: { access_type: "offline", prompt: "consent" },
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      },
    });
  }

  if (connected) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" disabled>
        <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
        Google Calendar connected
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5" disabled={loading} onClick={handleConnect}>
      <CalendarPlus className="h-3.5 w-3.5" />
      {loading ? "Redirecting..." : "Connect Google Calendar"}
    </Button>
  );
}
