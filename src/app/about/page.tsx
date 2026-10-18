import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export const metadata: Metadata = {
  title: "About Us | SeeBu",
  description:
    "SeeBu is a unified platform for reporting and monitoring public concerns in Cebu City — built as a capstone project at the University of Southern Philippines Foundation.",
}

const STEPS = [
  { icon: "campaign", title: "You report", text: "Describe the problem, pick the barangay, and add a photo. You get a tracking ID right away." },
  { icon: "fact_check", title: "The LGU reviews", text: "Your local administration checks the details, then escalates the report to the department that handles it." },
  { icon: "assignment_ind", title: "A team is assigned", text: "The department assigns a field officer from its team to take on the work." },
  { icon: "construction", title: "The work gets done", text: "The officer fixes the issue and uploads photos as proof of completion." },
  { icon: "task_alt", title: "You see the result", text: "Every step shows on your tracking page, and we email you as your report moves along." },
]

const ROLES = [
  { icon: "person", title: "Citizens", text: "Report community concerns and follow them until they're resolved." },
  { icon: "admin_panel_settings", title: "LGU Administrators", text: "Review incoming reports, then approve and route them — or reject invalid ones with a reason." },
  { icon: "supervisor_account", title: "Workforce Administrators", text: "Department heads who assign approved work to their field officers." },
  { icon: "engineering", title: "Workforce Officers", text: "Field personnel who carry out the work and submit proof photos." },
  { icon: "account_balance", title: "Super Administrators", text: "City-level oversight of the whole platform, its users, and its analytics." },
]

const card = "rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-soft"
const sectionTitle = "text-2xl lg:text-3xl font-black text-text-main dark:text-white tracking-tight"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 font-body overflow-x-hidden transition-colors">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6 space-y-16">
          <header className="text-center">
            <span className="inline-flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase mb-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-base" aria-hidden="true">info</span>
              About Us
            </span>
            <h1 className="text-4xl lg:text-5xl font-black text-text-main dark:text-white tracking-tight mt-2">
              About SeeBu
            </h1>
            <p className="mt-3 text-text-muted dark:text-gray-400 max-w-2xl mx-auto text-base lg:text-lg">
              A unified platform for reporting and monitoring public concerns and services in Cebu City.
            </p>
          </header>

          <section aria-labelledby="why" className="grid gap-6 md:grid-cols-2">
            <div className={`${card} p-6 lg:p-8`}>
              <h2 id="why" className={sectionTitle}>Why we built SeeBu</h2>
              <p className="mt-4 text-text-muted dark:text-gray-400 leading-relaxed">
                Cebuanos already speak up about flooding, damaged roads, broken streetlights, and late garbage
                collection. But those concerns end up scattered — a Facebook post here, a hotline call or a barangay
                logbook entry there. With no single place to follow them, people are left wondering whether their
                concern was received, passed on, resolved, or quietly discarded.
              </p>
            </div>
            <div className={`${card} p-6 lg:p-8`}>
              <h2 className={sectionTitle}>What we&apos;re working toward</h2>
              <p className="mt-4 text-text-muted dark:text-gray-400 leading-relaxed">
                SeeBu brings every report into one organized, traceable process. Residents can see exactly where
                their concern stands, local government offices can coordinate across departments, and over time the
                reports reveal recurring problems — so decisions can be based on what the data shows, not guesswork.
              </p>
            </div>
          </section>

          <section aria-labelledby="how">
            <h2 id="how" className={`${sectionTitle} text-center`}>How it works</h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map(({ icon, title, text }, i) => (
                <li key={title} className={`${card} p-5`}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">{icon}</span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-gray-400">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-3 font-bold text-text-main dark:text-white">{title}</h3>
                  <p className="mt-1 text-sm text-text-muted dark:text-gray-400 leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="roles">
            <h2 id="roles" className={`${sectionTitle} text-center`}>Built for everyone involved</h2>
            <p className="mt-3 text-center text-text-muted dark:text-gray-400 max-w-2xl mx-auto">
              Each role sees only what it needs, mirroring how responsibilities are already divided in local government.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ROLES.map(({ icon, title, text }) => (
                <li key={title} className={`${card} p-5 flex gap-4`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-text-main dark:text-white">{title}</h3>
                    <p className="mt-1 text-sm text-text-muted dark:text-gray-400 leading-relaxed">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="principles" className="grid gap-6 md:grid-cols-3">
            <h2 id="principles" className="sr-only">Our principles</h2>
            <div className={`${card} p-6`}>
              <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true">shield_person</span>
              <h3 className="mt-3 text-lg font-bold text-text-main dark:text-white">Privacy by design</h3>
              <p className="mt-2 text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                Photos are screened on your own device before upload: pictures showing a person&apos;s face must be
                retaken, and license plates are blurred automatically. We follow the Data Privacy Act of 2012
                (RA 10173) — see our <Link href="/privacy" className="font-semibold text-primary underline underline-offset-2">Privacy Policy</Link>.
              </p>
            </div>
            <div className={`${card} p-6`}>
              <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true">install_mobile</span>
              <h3 className="mt-3 text-lg font-bold text-text-main dark:text-white">Works like an app</h3>
              <p className="mt-2 text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                SeeBu is a Progressive Web App: use it right in your browser or install it to your home screen. If
                you&apos;re signed in and lose your connection, your report is sent once you&apos;re back online.
              </p>
            </div>
            <div className={`${card} p-6`}>
              <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true">volunteer_activism</span>
              <h3 className="mt-3 text-lg font-bold text-text-main dark:text-white">Non-profit, for non-emergencies</h3>
              <p className="mt-2 text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                SeeBu is free for residents and handles everyday community concerns. For fires, crimes, accidents,
                or anything life-threatening, call <strong className="text-text-main dark:text-white">911</strong>.
              </p>
            </div>
          </section>

          <section aria-labelledby="team" className={`${card} p-6 lg:p-10`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true">school</span>
              <h2 id="team" className={sectionTitle}>The team behind SeeBu</h2>
            </div>
            <p className="mt-4 text-text-muted dark:text-gray-400 leading-relaxed">
              SeeBu began as a capstone project of the College of Computer Studies at the University of Southern
              Philippines Foundation (USPF), Lahug, Cebu City, in partial fulfillment of the degree of Bachelor of
              Science in Information Technology.
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-gray-400">Researchers &amp; developers</dt>
                <dd className="mt-1 font-semibold text-text-main dark:text-white">France Laurence Velarde<br />John Norman Curato</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-gray-400">Research adviser</dt>
                <dd className="mt-1 font-semibold text-text-main dark:text-white">Ms. Niña Mae L. Leopando</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-text-muted dark:text-gray-400 leading-relaxed">
              With thanks to Mr. Gian Carlo Cataraja, Dean of the College of Computer Studies; Mrs. Marie Joy Sanchez,
              our Capstone 1 adviser; the Capstone Defense Panel; and the community respondents and IT specialists
              who evaluated the platform.
            </p>
          </section>

          <section className="text-center">
            <h2 className={sectionTitle}>Help make Cebu better</h2>
            <p className="mt-3 text-text-muted dark:text-gray-400">
              Spot something that needs fixing? It only takes a few minutes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/report"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/30 transition-colors hover:bg-primary-dark"
              >
                <span className="material-symbols-outlined" aria-hidden="true">campaign</span>
                Report an Issue
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3 font-bold text-text-main dark:text-white transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="material-symbols-outlined" aria-hidden="true">manage_search</span>
                Track a Report
              </Link>
            </div>
            <p className="mt-4 text-sm text-text-muted dark:text-gray-400">
              Questions? Read the <Link href="/faq" className="font-semibold text-primary underline underline-offset-2">FAQs</Link>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
