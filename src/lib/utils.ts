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
