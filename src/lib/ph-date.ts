// Cebu runs on Philippine time (UTC+8, no DST). Analytics ranges are PH calendar days ("YYYY-MM-DD"),
// matching how the backend filters and buckets reports.

const phDayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }) // en-CA → YYYY-MM-DD

export const phDay = (date: Date | string) => phDayFormat.format(new Date(date))

export const phToday = () => phDay(new Date())

export function shiftDay(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Local-midnight Date for a day string — the form react-day-picker works with. */
export function dayToDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function dateToDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })

/** "Oct 18, 2026" or "Oct 1 – 18, 2026" / "Sep 28 – Oct 18, 2026". */
export function formatDayRange(from: string, to: string): string {
  return from === to ? dayLabel.format(dayToDate(from)) : dayLabel.formatRange(dayToDate(from), dayToDate(to))
}

/** Chart axis label for a "YYYY-MM-DD" day or a "YYYY-MM" month bucket. */
export function formatBucket(bucket: string, long = false): string {
  if (bucket.length === 7) {
    return dayToDate(`${bucket}-01`).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }
  return dayToDate(bucket).toLocaleDateString("en-US", long ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" })
}
