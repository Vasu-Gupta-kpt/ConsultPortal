"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Rendered instead of the marketing homepage when a signed-out visitor
// arrives via `next` (i.e. they followed a deep link -- e.g. from a
// notification email -- to a signed-in-only page). Immediately sends them
// into the Google sign-in window rather than making them click a button,
// carrying `next` through so auth/callback/route.ts can return them to that
// exact page afterward.
export default function AutoSignIn({ next }: { next: string }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }, [next]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
      <div>
        <p className="text-lg font-medium mb-1">Taking you to sign in…</p>
        <p className="text-sm text-muted-foreground">
          You&apos;ll be redirected back here once you&apos;re signed in.
        </p>
      </div>
    </div>
  );
}
