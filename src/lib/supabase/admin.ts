import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role Supabase client. Bypasses RLS entirely -- server-only, and
 * only ever call this from Server Actions / Route Handlers, never from a
 * Server or Client Component that renders to the browser.
 *
 * Currently used to read src/lib/actions/peer-practice.ts's
 * `google_calendar_tokens` rows, which have no SELECT policy or grant for
 * `authenticated` by design (see supabase/migrations/*_google_calendar.sql)
 * -- the service role is the only way to read a token back out.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
