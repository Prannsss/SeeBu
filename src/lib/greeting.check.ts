// Self-check for the dashboard greeting. Run: npx tsx src/lib/greeting.check.ts
import assert from "node:assert/strict"
import { greeting } from "./greeting"

// UTC instants → Philippine time (UTC+8)
const at = (utc: string) => new Date(`2026-10-18T${utc}:00Z`)

assert.equal(greeting("Snarp Edralev", at("21:00")), "Good morning, Snarp!") // 05:00 PH
assert.equal(greeting("Snarp Edralev", at("03:59")), "Good morning, Snarp!") // 11:59 PH
assert.equal(greeting("Snarp Edralev", at("04:00")), "Good afternoon, Snarp!") // 12:00 PH
assert.equal(greeting("Snarp Edralev", at("09:59")), "Good afternoon, Snarp!") // 17:59 PH
assert.equal(greeting("Snarp Edralev", at("10:00")), "Good evening, Snarp!") // 18:00 PH
assert.equal(greeting("Snarp Edralev", at("20:59")), "Good evening, Snarp!") // 04:59 PH
assert.equal(greeting("  Juan  Dela Cruz ", at("21:00")), "Good morning, Juan!")
assert.equal(greeting(null, at("21:00")), "Good morning!")
assert.equal(greeting("", at("10:00")), "Good evening!")

console.log("greeting.check PASS")
