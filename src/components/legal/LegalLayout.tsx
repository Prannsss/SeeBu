"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export interface LegalSection {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  effectiveDate: string;
  sections: LegalSection[];
  children: React.ReactNode;
}

export function LegalLayout({ title, effectiveDate, sections, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-gray-950 font-body transition-colors">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-12 border-b border-gray-200 dark:border-gray-800 pb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-text-main dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="mt-3 text-sm text-text-muted dark:text-gray-400">
            Effective date: {effectiveDate}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12">
          <nav className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-gray-500 mb-3">
                On this page
              </p>
              <ul className="space-y-2 text-sm border-l border-gray-200 dark:border-gray-800">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block pl-4 -ml-px border-l border-transparent text-text-muted dark:text-gray-400 hover:text-primary hover:border-primary transition-colors"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <article className="prose-legal max-w-none">{children}</article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
