import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// "yyyy-mm-dd" in local time -- deliberately not toISOString(), which
// converts to UTC first and can shift the date by a day depending on the
// browser's timezone offset.
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Parses a "yyyy-mm-dd" string as a local-time Date (avoids `new Date(iso)`,
// which treats a bare date string as UTC midnight and can render as the
// previous day in timezones behind UTC).
export function parseDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateLabel(value: string): string {
  return parseDateInputValue(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

// Public buckets (e.g. `case-structures`) serve objects at a predictable
// URL with no signing needed -- unlike the private `materials` bucket's
// signed-URL flow in src/lib/actions/materials.ts. Plain string
// construction, works in both server and client contexts.
export function getPublicStorageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

// Same-day interval overlap check (start inclusive, end exclusive -- so a
// 18:00-19:00 slot and a 19:00-20:00 slot are back-to-back, not clashing).
// Mirrors the DB-level EXCLUDE constraint in
// supabase/migrations/*_no_overlapping_slots.sql, giving immediate
// client-side feedback instead of a raw Postgres error.
export function slotsOverlap(
  a: { date: string; startTime: string; endTime: string },
  b: { date: string; startTime: string; endTime: string }
): boolean {
  return a.date === b.date && a.startTime < b.endTime && b.startTime < a.endTime
}

// Guards the `next` redirect param (see src/proxy.ts, src/app/page.tsx,
// src/app/auth/callback/route.ts) against being turned into an open
// redirect -- must be an internal, single-slash path only.
export function isSafeNextPath(next: string | undefined | null): next is string {
  return !!next && next.startsWith("/") && !next.startsWith("//")
}
