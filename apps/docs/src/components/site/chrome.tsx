"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Github } from "lucide-react";
import { CommandMenu } from "@/components/site/command-menu";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { cn } from "@/lib/utils";

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

const NAV = [
  { href: "/components", label: "Components" },
  { href: "/showcase", label: "Showcase" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pro", label: "Pro" },
];

/**
 * The header condenses on scroll rather than sitting at a fixed weight. It is
 * a small thing that makes a page feel engineered — the chrome recedes once
 * the reader has committed to the content.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);

  // Coalesced to one read per frame, like the section rail. `scrollY` is cheap
  // on its own, but the handler ran on every event and each one reached React —
  // and React's bail-out still costs a scheduled render to decide on.
  React.useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setScrolled(window.scrollY > 12);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
    };
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        "sticky top-0 z-40 backdrop-blur-xl transition-[height,background-color,border-color] duration-500 ease-[var(--ease-out-expo)]",
        scrolled
          ? "h-13 border-b border-rule bg-paper/80"
          : "h-16 border-b border-transparent bg-paper/40",
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-ink"
          aria-label="Oxygen UI home"
        >
          <OxygenMark className="h-4 w-7 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-180" />
          <span className="font-display text-[0.9375rem] font-semibold tracking-tight">
            Oxygen UI
          </span>
          <span className="numeric hidden rounded border border-rule px-1.5 py-0.5 text-[0.625rem] text-graphite-soft sm:inline">
            v0.1.0
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          <ul className="mr-1 hidden items-center gap-0.5 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-lg px-3 py-1.5 text-sm transition-colors duration-200",
                      active ? "text-ink" : "text-graphite hover:text-ink",
                    )}
                  >
                    {item.label}
                    {/* Active state is a measured underline, not a filled pill —
                        it reads as a tick on a scale, matching the instrument
                        language rather than a generic tab. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3 -bottom-px h-px origin-left bg-oxygen transition-transform duration-400 ease-[var(--ease-out-expo)]",
                        active ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <CommandMenu />

          <a
            href="https://github.com/zoworkhq/oxygenui"
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-rule px-2.5 py-1.5 text-sm text-graphite transition-colors duration-200 hover:border-rule-strong hover:text-ink"
          >
            <Github aria-hidden="true" className="size-3.5" />
            <span className="sr-only">GitHub</span>
          </a>

          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

const FOOTER_LINKS = [
  {
    title: "Library",
    links: [
      { href: "/components", label: "Components" },
      { href: "/showcase", label: "Showcase" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/pro", label: "Pro" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/r/index.json", label: "Registry JSON", external: true },
      { href: "https://github.com/zoworkhq/oxygenui", label: "GitHub", external: true },
      { href: "https://hl7.org/fhir/R4/", label: "FHIR R4 spec", external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-rule bg-paper-sunk/40">
      <div className="ticks mx-auto max-w-6xl px-5 opacity-60 sm:px-8" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 text-ink">
              <OxygenMark />
              <span className="font-display text-sm font-semibold tracking-tight">Oxygen UI</span>
            </div>
            <p className="body-sm mt-3 text-graphite">
              Healthcare components typed to FHIR R4. Source you own, states you can trust.
            </p>
            <p className="axis-label mt-4">MIT core · v0.1.0 · by Zowork</p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            {FOOTER_LINKS.map((column) => (
              <div key={column.title}>
                <p className="axis-label">{column.title}</p>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          className="group inline-flex items-center gap-1 text-sm text-graphite transition-colors duration-200 hover:text-ink"
                        >
                          {link.label}
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                          />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-graphite transition-colors duration-200 hover:text-ink"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-rule pt-6">
          <p className="body-sm max-w-2xl text-graphite-soft">
            Oxygen UI is not a compliance boundary and is not a medical device. All demo data on
            this site is synthetic.
          </p>
        </div>
      </div>
    </footer>
  );
}
