// Users are in Cebu, and Vercel renders in UTC, so the time of day is read in Philippine time.
const phHour = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", hourCycle: "h23" })

/** "Good morning, Snarp!" — morning 5–11, afternoon 12–17, evening otherwise; first name only. */
export function greeting(fullName?: string | null, now: Date = new Date()): string {
  const hour = Number(phHour.format(now))
  const part = hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : "evening"
  const firstName = fullName?.trim().split(/\s+/)[0]
  return firstName ? `Good ${part}, ${firstName}!` : `Good ${part}!`
}
