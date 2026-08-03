import Link from "next/link";
import { Github } from "lucide-react";
import { ThemeToggle } from "@/components/site/theme-toggle";

export function OxygenMark({ className = "h-4 w-7" }: { className?: string }) {
  // Two bonded circles — O₂. The bond is the brand color; the atoms are not.
  return (
    <svg viewBox="0 0 28 16" className={className} aria-hidden="true">
      <line x1="8" y1="8" x2="20" y2="8" stroke="var(--color-oxygen)" strokeWidth="2.5" />
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-ink" aria-label="Oxygen UI home">
          <OxygenMark />
          <span className="font-display text-[0.9375rem] font-semibold tracking-tight">Oxygen UI</span>
          <span className="numeric hidden rounded border border-rule px-1.5 py-0.5 text-[0.625rem] text-graphite sm:inline">
            v0.1.0
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/components"
            className="rounded-lg px-3 py-1.5 text-graphite transition-colors duration-200 hover:bg-paper-sunk hover:text-ink"
          >
            Components
          </Link>
          <Link
            href="/showcase"
            className="hidden rounded-lg px-3 py-1.5 text-graphite transition-colors duration-200 hover:bg-paper-sunk hover:text-ink sm:block"
          >
            Showcase
          </Link>
          <Link
            href="/pro"
            className="rounded-lg px-3 py-1.5 text-graphite transition-colors duration-200 hover:bg-paper-sunk hover:text-ink"
          >
            Pro
          </Link>
          <a
            href="https://github.com/zoworkhq/oxygenui"
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-rule px-3 py-1.5 text-sm text-graphite transition-all duration-200 hover:border-rule-strong hover:text-ink"
          >
            <Github aria-hidden="true" className="size-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-paper-sunk/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5 text-ink">
          <OxygenMark />
          <span className="font-display text-sm font-semibold tracking-tight">Oxygen UI</span>
          <span className="text-sm text-graphite">by Zowork</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-graphite">
          <Link href="/components" className="transition-colors duration-200 hover:text-ink">
            Components
          </Link>
          <Link href="/showcase" className="transition-colors duration-200 hover:text-ink">
            Showcase
          </Link>
          <Link href="/pro" className="transition-colors duration-200 hover:text-ink">
            Pro
          </Link>
          <a
            href="https://github.com/zoworkhq/oxygenui"
            className="transition-colors duration-200 hover:text-ink"
          >
            GitHub
          </a>
          <a href="/r/index.json" className="transition-colors duration-200 hover:text-ink">
            Registry
          </a>
          <span className="numeric text-xs text-graphite-soft">MIT · v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}
