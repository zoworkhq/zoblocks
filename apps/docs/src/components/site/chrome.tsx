"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Github } from "lucide-react";
import { CommandMenu } from "@/components/site/command-menu";
import { SiteMenu } from "@/components/site/site-menu";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { cn } from "@/lib/utils";

export function ZoBlocksMark({ className = "h-4 w-7" }: { className?: string }) {
  /*
   * Two blocks and the tenon that joins them.
   *
   * It keeps the skeleton of the mark it replaces — two shapes either side of a
   * brand-coloured joint — because the header sits one click from a customer's
   * bookmark and a wholly unrelated shape reads as a different product. What
   * changed is the vocabulary: squares rather than circles, and a tenon rather
   * than a bond, which is the thing this library actually does. You take a
   * block and it fits.
   *
   * The composition is symmetric about its centre, so the header's 180° hover
   * rotation lands back on itself rather than on a mirrored shape.
   *
   * The tenon is painted before the outlines so the blocks' strokes stay
   * unbroken over it: a joint that cuts the outline reads as a gap at 16px.
   */
  return (
    <svg viewBox="0 0 28 16" className={className} aria-hidden="true">
      <rect x="11.5" y="5.5" width="5" height="5" rx="1.25" fill="var(--color-brand)" />
      <rect
        x="2.5"
        y="3"
        width="9.5"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="16"
        y="3"
        width="9.5"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

/*
 * Three slots: the catalogue, the blocks and Premium. Premium was two slots,
 * Marketplace and Pro, until 16 Sep 2026.
 *
 * Install and Compare were promoted here briefly during the content audit,
 * on the argument that they are the two highest-intent pages for a developer
 * and an engineering lead. Rahul reversed that on 4 Sep 2026 — the header is
 * for what the product *is*, and those two are how you get it and why. Both
 * stay one keystroke away in the command palette and in the footer, which is
 * where they were before.
 *
 * "Blocks" rather than "Showcase" for the third slot: the page's own eyebrow,
 * heading and landmark all say Blocks, and "showcase" additionally promises
 * customer work that the page then has to walk back in its first paragraph.
 */
const NAV = [
  { href: "/components", label: "Components" },
  { href: "/showcase", label: "Blocks" },
  { href: "/premium", label: "Premium" },
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
      /*
       * The site's own header, named.
       *
       * `page.locator("header")` used to be unambiguous and is not any more:
       * ChartHeader *is* a `<header role="banner">`, and it appears as card art
       * on this page. A test that has to guess which header it meant is a test
       * that will guess wrong.
       */
      data-site-header=""
      data-scrolled={scrolled || undefined}
      className={cn(
        "sticky top-0 z-40 backdrop-blur-xl transition-[height,background-color,border-color] duration-500 ease-[var(--ease-out-expo)]",
        /*
         * Translucent, and it stays that way.
         *
         * This was briefly fully opaque when scrolled: `/pro` grew a dark hero
         * card, the card passed behind the bar, and 80% of paper over near
         * black is a grey the version badge beside the wordmark could not hold
         * 4.5:1 against. That hero is gone and the site has no other near-black
         * full-width section, so the change is reverted rather than kept — a
         * site-wide opacity change to serve one page that no longer exists is
         * a change nobody would be able to explain later.
         *
         * It is worth knowing the hazard is real. If a dark band ever returns,
         * this is where it will show up, and axe will find it before a reader
         * does.
         */
        scrolled
          ? "h-13 border-b border-rule bg-paper/90"
          : "h-16 border-b border-transparent bg-paper/40",
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          href="/"
          // min-h-6 is the WCAG 2.5.8 floor. The wordmark's own line box came
          // to 23px, one short — and the logo is a standalone navigation
          // target, not a link inside a sentence, so the Inline exception does
          // not cover it. It sits in a taller header row, so nothing moves.
          className="group flex min-h-6 items-center gap-2.5 text-ink"
          aria-label="ZoBlocks by Zowork, home"
        >
          <ZoBlocksMark className="h-4 w-7 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-180" />
          <span className="font-display text-[0.9375rem] font-semibold tracking-tight">
            ZoBlocks
          </span>
          <span className="-ml-1 text-[0.8125rem] whitespace-nowrap text-graphite">by Zowork</span>
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
                        "absolute inset-x-3 -bottom-px h-px origin-left bg-brand transition-transform duration-400 ease-[var(--ease-out-expo)]",
                        active ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <CommandMenu />

          {/* GitHub and the theme picker stand down on a phone.

              The reason they were hidden has gone: the two app links that took
              the room came out on 10 Sep 2026, so 375px now has slack. They
              stay hidden anyway, because the condition for hiding a control was
              never "no room" — it was that nothing is lost. GitHub is in the
              footer and the picker moves there below `sm`, so a phone reader
              reaches both, and a six-control bar at 375px is worse than a
              four-control one even when it fits.

              Nothing is lost, which is the condition for hiding it. The picker
              is light/dark only now, and both are preferences — a reader on a
              phone whose machine is dark already lands on dark, because the
              boot script follows `prefers-color-scheme` when nothing is stored.

              This used to say the opposite, and the reason is worth keeping:
              the picker carried high contrast, which is an accessibility
              control rather than a preference, so hiding it on small screens
              took it from the readers most likely to need it. High contrast is
              no longer offered here (see `lib/theme.ts`) — the 7:1 tokens and
              their audit are untouched, but nothing in the UI turns them on. If
              it ever returns to the picker, this exemption has to go with it. */}
          <a
            href="https://github.com/zoworkhq/zoblocks"
            className="ml-1 hidden items-center gap-1.5 rounded-lg border border-rule px-2.5 py-1.5 text-sm text-graphite transition-colors duration-200 hover:border-rule-strong hover:text-ink sm:inline-flex"
          >
            <Github aria-hidden="true" className="size-3.5" />
            <span className="sr-only">GitHub</span>
          </a>

          <div className="ml-1 hidden sm:block">
            <ThemeToggle />
          </div>

          <SiteMenu mark={<ZoBlocksMark className="h-4 w-7" />} />

          {/* No Sign in and no Request access.

              Both used to sit here, behind a rule, as the way into the app.
              The app is not in this release, so the one filled control on the
              site pointed at a form for a product a reader cannot have yet —
              and it was the loudest thing in the header. Removed on
              10 Sep 2026 rather than disabled: a greyed door still promises
              a room. `lib/app.ts` keeps both addresses, and
              `pro/console-page.tsx` still renders them, so putting them back
              is two anchors and an import. */}
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
      { href: "/install", label: "Install" },
      { href: "/compare", label: "Compare" },
      { href: "/showcase", label: "Blocks" },
      { href: "/premium", label: "Premium" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/r/index.json", label: "Registry JSON", external: true },
      { href: "https://github.com/zoworkhq/zoblocks", label: "GitHub", external: true },
      { href: "https://hl7.org/fhir/R4/", label: "FHIR R4 spec", external: true },
    ],
  },
  /*
   * There is no third "App" column.
   *
   * It held Sign in and Request access, mirroring the header pair so a reader
   * on a phone had somewhere to go that was not the sign-up form. Both doors
   * came out on 10 Sep 2026 — see the header — and a footer column pointing
   * into an application this release does not ship is the same promise in
   * smaller type.
   */
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-rule bg-paper-sunk/40">
      <div className="ticks mx-auto max-w-6xl px-5 opacity-60 sm:px-8" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 text-ink">
              <ZoBlocksMark />
              <span className="font-display text-sm font-semibold tracking-tight">ZoBlocks</span>
            </div>
            <p className="body-sm mt-3 text-graphite">
              Healthcare components typed to FHIR R4. Source you own, states you can trust.
            </p>
            <p className="axis-label mt-4">MIT core · v0.1.0</p>

            {/* A maker's stamp, not a sentence.

                Two problems with what was here. It read "Built by" followed by
                a logo, which is the plainest possible way to say it and looked
                like a caption someone forgot to style. And it used Tailwind's
                `dark:invert-0` to un-invert the mark on dark grounds — see
                `.zwStamp` in `globals.css` for why that silently did nothing.

                It is a chip now, in the same language as the release chip on
                `/premium`: a hairline border, a mono micro-label, the mark, and an
                arrow that arrives on hover. A studio signing its work rather
                than a line of body copy. */}
            <a href="https://www.zowork.com/" rel="noopener" className="zwStamp group mt-4">
              <span className="zwStampLabel axis-label text-graphite-soft">Built by</span>
              <Image
                src="/brand/zowork.png"
                alt="Zowork"
                width={202}
                height={52}
                className="zwStampMark"
                unoptimized
              />
              <ArrowUpRight aria-hidden="true" className="zwStampArrow size-3" />
            </a>

            {/* Where the theme picker goes when the header cannot hold it.

                `sm:hidden` against the header's `hidden sm:block`: exactly one
                of the two is ever rendered, so a screen reader never meets two
                radiogroups both called "Color theme". `hidden` is
                `display: none`, which takes the other out of the accessibility
                tree rather than merely out of sight. */}
            <div className="mt-6 sm:hidden">
              <p className="axis-label mb-2">Theme</p>
              <ThemeToggle />
            </div>
          </div>

          {/* Two columns, so two-up at every width. It was `sm:grid-cols-3`
              while App existed; with two children that reserved an empty
              third and pulled both away from the footer's right edge. */}
          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            {FOOTER_LINKS.map((column) => (
              <div key={column.title}>
                <p className="axis-label">{column.title}</p>
                {/* 24px rows, the WCAG 2.5.8 floor. They were 17px; with
                    `space-y-2` the pitch stays the 32px it was. */}
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          className="group inline-flex min-h-6 items-center gap-1 text-sm text-graphite transition-colors duration-200 hover:text-ink"
                        >
                          {link.label}
                          {/* Shown outright where there is no hover to reveal it. */}
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                          />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-flex min-h-6 items-center text-sm text-graphite transition-colors duration-200 hover:text-ink"
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
            ZoBlocks is not a compliance boundary and is not a medical device. All demo data on this
            site is synthetic.
          </p>
        </div>
      </div>
    </footer>
  );
}
