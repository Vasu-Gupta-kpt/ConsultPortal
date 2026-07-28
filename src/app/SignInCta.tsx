"use client";

import { createClient } from "@/lib/supabase/client";

// Every button on the homepage should open the Google sign-in window
// directly rather than linking to a gated page and bouncing back --
// this page only ever renders for signed-out visitors (see page.tsx's
// own redirect for signed-in ones), so that's true unconditionally here.
export default function SignInCta({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
