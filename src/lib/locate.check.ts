// Self-check for "Use my location" place matching. Run: npx tsx src/lib/locate.check.ts
import assert from "node:assert/strict"
import { matchPlace, normalizePlaceName } from "./locate"

// The live Cebu City barangay list (82 names, as in the database).
const names = "Adlaon|Agsungot|Apas|Babag|Bacayan|Banilad|Basak Pardo|Basak San Nicolas|Binaliw|Bonbon|Budlaan|Buhisan|Bulacao|Buot-Taup Pardo|Busay|Calamba|Cambinocot|Capitol Site|Carreta|Central|Cogon Pardo|Cogon Ramos|Day-as|Duljo Fatima|Ermita|Guadalupe|Guba|Hipodromo|Inayawan|Kalubihan|Kalunasan|Kamagayan|Kamputhaw|Kasambagan|Kinasang-an Pardo|Labangon|Lahug|Lorega San Miguel|Lusaran|Luz|Mabini|Mabolo|Malubog|Mambaling|Pahina Central|Pahina San Nicolas|Pamutan|Pardo|Pari-an|Paril|Pasil|Pit-os|Poblacion Pardo|Pulangbato|Pung-ol Sibugay|Punta Princesa|Quiot Pardo|Sambag I|Sambag II|San Antonio|San Jose|San Nicolas Central|San Nicolas Proper|San Roque|Santa Cruz|Sapangdaku|Sawang Calero|Sinsin|Sirao|Suba Pasil|Sudlon I|Sudlon II|T. Padilla|Tabunan|Tagbao|Talamban|Taptap|Tejero|Tinago|Tisa|To-ong Pardo|Zapatera"
const barangays = names.split("|").map((name) => ({ name }))
const pick = (...candidates: (string | undefined)[]) => matchPlace(barangays, candidates)?.name

// Spelling variants seen in OSM (Nominatim / Photon)
assert.equal(pick("Sambag Ⅱ"), "Sambag II") // Photon uses the Unicode Roman numeral
assert.equal(pick("Sambag 1"), "Sambag I")
assert.equal(pick("Budla-an"), "Budlaan")
assert.equal(pick("Camputhaw"), "Kamputhaw")
assert.equal(pick("Hippodromo"), "Hipodromo")
assert.equal(pick("Sta. Cruz"), "Santa Cruz")
assert.equal(pick("Barangay Lahug"), "Lahug")
assert.equal(pick("Brgy. Pit-os"), "Pit-os")
assert.equal(pick("Pari-an"), "Pari-an")
assert.equal(pick("Parian"), "Pari-an")
assert.equal(pick("Tomas Padilla"), "T. Padilla")

// Unique prefixes resolve; ambiguous ones don't guess
assert.equal(pick("Quiot"), "Quiot Pardo")
assert.equal(pick("Kinasang-an"), "Kinasang-an Pardo")
assert.equal(pick("Duljo"), "Duljo Fatima")
assert.equal(pick("Sambag"), undefined)
assert.equal(pick("Basak"), undefined)
assert.equal(pick("San Nicolas"), undefined)
assert.equal(pick("Pah"), undefined) // too short to prefix-match

// Candidates are tried in priority order, not list order (the old matcher returned "Calamba"
// for an address with quarter "Sambag II" and suburb "Calamba", because C sorts first).
assert.equal(pick("Sambag II", "Calamba"), "Sambag II")
assert.equal(pick("Upper Pailob", "Calamba"), "Calamba")
assert.equal(pick(undefined, "", "Mabolo"), "Mabolo")

// Not one of ours
assert.equal(pick("Señor Santo Niño"), undefined)
assert.equal(normalizePlaceName("Señor Santo Niño"), "senorsantonino")

// Municipalities: "City" is noise, but the province "Cebu" must not be passed as a candidate
const munis = [{ name: "Cebu City" }]
assert.equal(matchPlace(munis, ["City of Cebu"])?.name, "Cebu City")
assert.equal(matchPlace(munis, ["Mandaue City"]), undefined)

console.log("locate.check PASS")
