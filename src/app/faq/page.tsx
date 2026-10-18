import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export const metadata: Metadata = {
  title: "FAQs | SeeBu",
  description: "Answers to common questions about reporting issues, tracking progress, privacy, and accounts on SeeBu.",
}

const CONTACT_EMAIL = "vfrancelaurence@gmail.com"
const ISSUES_URL = "https://github.com/Prannsss/SeeBu/issues/new"

const link = "font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"

const SECTIONS: { title: string; icon: string; faqs: { q: string; a: ReactNode }[] }[] = [
  {
    title: "Reporting an issue",
    icon: "campaign",
    faqs: [
      {
        q: "What can I report on SeeBu?",
        a: "Non-emergency community problems the local government can fix: infrastructure (like potholes and broken streetlights), sanitation, safety and security, traffic, utilities, and environmental concerns. If it doesn't fit a category, choose “Other” and describe it.",
      },
      {
        q: "Do I need an account to report?",
        a: "No. You can report as a guest by entering your name and email, or report anonymously with just an email so we can send your tracking ID. With an account, all your reports are saved in your history and you get an email each time one moves to a new stage.",
      },
      {
        q: "What should I include in a report?",
        a: "A short title and description, the municipality or city and barangay (“Use my location” can fill this in for you), how urgent it is, and at least one photo — you can add up to five.",
      },
      {
        q: "Can I report anonymously?",
        a: "Yes. Tick “Report Anonymously” in the contact step. Your name and contact details aren’t saved with the report; your email is only used to send you the tracking ID.",
      },
      {
        q: "Is SeeBu for emergencies?",
        a: (
          <>
            No. For fires, crimes, accidents, or anything life-threatening, call <strong>911</strong>, the national
            emergency hotline. SeeBu is for issues that can wait for the local government to schedule a fix.
          </>
        ),
      },
      {
        q: "What if I lose my connection while submitting?",
        a: "If you’re signed in, your report is saved on your device and sent automatically as soon as you’re back online.",
      },
    ],
  },
  {
    title: "Tracking & updates",
    icon: "manage_search",
    faqs: [
      {
        q: "How do I track my report?",
        a: (
          <>
            Every report gets a tracking ID, such as <span className="font-mono text-text-main dark:text-white">RPT-1A2B3C4D-1234</span>.
            Enter it on the <Link href="/track" className={link}>Track Report</Link> page — no sign-in needed. If you have an
            account, all your reports are also listed in your History.
          </>
        ),
      },
      {
        q: "What do the report statuses mean?",
        a: (
          <dl className="grid gap-2">
            {[
              ["In Review", "Your local administration is checking the details and photos."],
              ["Action Taken", "The report was verified and escalated to the department that handles it."],
              ["In Progress", "A field team has been assigned and is working on it."],
              ["Resolved", "The work is done. The team’s proof photos are attached to the report."],
              ["Rejected", "It couldn’t be processed. The reason is shown on the report."],
            ].map(([term, desc]) => (
              <div key={term}>
                <dt className="inline font-semibold text-text-main dark:text-white">{term}: </dt>
                <dd className="inline">{desc}</dd>
              </div>
            ))}
          </dl>
        ),
      },
      {
        q: "Will I be notified about updates?",
        a: "Yes, by email. We confirm when your report is received, then email you when it’s escalated to a department, when work starts, and when it’s resolved or rejected. Anonymous reports only get the tracking-ID email, since their contact details aren’t stored.",
      },
      {
        q: "How long does it take to fix an issue?",
        a: "It depends on the issue and the department handling it. You can follow every step on the tracking page, and resolved reports include photos from the field team as proof.",
      },
      {
        q: "Why was my report rejected?",
        a: "Common reasons are spam, a duplicate of an existing report, too few details, or a missing photo. The reason is shown on your report. You’re welcome to submit a new one with more details or clearer photos.",
      },
    ],
  },
  {
    title: "Photos & privacy",
    icon: "shield_person",
    faqs: [
      {
        q: "Why was my photo flagged?",
        a: "SeeBu checks each photo on your own device before it’s uploaded. If it detects a face, you’ll need to retake or replace that photo so bystanders aren’t identifiable. License plates are blurred automatically.",
      },
      {
        q: "Who can see my report?",
        a: "Your local administration and the department assigned to it. Anyone with your tracking ID can see the report and its progress on the tracking page, but your name and contact details are never shown there.",
      },
      {
        q: "How is my information used?",
        a: (
          <>
            Only to process your report and keep you updated. The full details are in our{" "}
            <Link href="/privacy" className={link}>Privacy Policy</Link> and{" "}
            <Link href="/terms" className={link}>Terms of Service</Link>.
          </>
        ),
      },
    ],
  },
  {
    title: "Accounts & the app",
    icon: "person",
    faqs: [
      {
        q: "How do I create an account?",
        a: (
          <>
            <Link href="/auth/register" className={link}>Sign up</Link> with your email — we send a 6-digit code to verify
            it — or continue with Google or Facebook.
          </>
        ),
      },
      {
        q: "I didn’t get my verification code.",
        a: "Check your spam or promotions folder. Codes expire after 15 minutes; tap “Resend verification code” on the verification page to get a new one.",
      },
      {
        q: "I forgot my password.",
        a: (
          <>
            Choose <Link href="/auth/forgot-pw" className={link}>Forgot password?</Link> on the login page, enter your email,
            and use the code we send you to set a new password.
          </>
        ),
      },
      {
        q: "Can I install SeeBu as an app?",
        a: "Yes. On Android or a computer, use “Install App” at the bottom of this page or your browser’s install option. On iPhone or iPad, tap the Share button, then “Add to Home Screen”.",
      },
      {
        q: "Is SeeBu free?",
        a: "Yes. Reporting, tracking, and updates are free for everyone.",
      },
      {
        q: "I found a bug in the app. Where do I report it?",
        a: (
          <>
            Please <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer" className={link}>open an issue on GitHub</a>{" "}
            and describe what happened and on which device.
          </>
        ),
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 font-body overflow-x-hidden transition-colors">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <header className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase mb-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-base" aria-hidden="true">help</span>
              Help
            </span>
            <h1 className="text-4xl lg:text-5xl font-black text-text-main dark:text-white tracking-tight mt-2">
              Frequently Asked Questions
            </h1>
            <p className="mt-3 text-text-muted dark:text-gray-400 text-base lg:text-lg">
              Quick answers about reporting issues, tracking progress, and keeping your information safe.
            </p>
          </header>

          <div className="space-y-12">
            {SECTIONS.map((section) => (
              <section key={section.title} aria-labelledby={`faq-${section.icon}`}>
                <h2 id={`faq-${section.icon}`} className="flex items-center gap-2 text-xl font-bold text-text-main dark:text-white mb-4">
                  <span className="material-symbols-outlined text-primary" aria-hidden="true">{section.icon}</span>
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.faqs.map(({ q, a }) => (
                    <details
                      key={q}
                      className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-soft [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 font-semibold text-text-main dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        {q}
                        <span
                          className="material-symbols-outlined shrink-0 text-text-muted transition-transform group-open:rotate-180"
                          aria-hidden="true"
                        >
                          expand_more
                        </span>
                      </summary>
                      <div className="px-5 pb-5 text-text-muted dark:text-gray-400 leading-relaxed">{a}</div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-14 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-soft p-6 text-center">
            <h2 className="text-lg font-bold text-text-main dark:text-white">Still have questions?</h2>
            <p className="mt-2 text-text-muted dark:text-gray-400">
              Email us at <a href={`mailto:${CONTACT_EMAIL}`} className={link}>{CONTACT_EMAIL}</a>, or{" "}
              <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer" className={link}>report a problem with the app</a>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
