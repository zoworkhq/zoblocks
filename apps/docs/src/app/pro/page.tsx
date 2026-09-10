import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATALOG } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { NotifyDialog } from "@/components/site/notify-dialog";
import { ProConsole } from "@/components/site/pro-console";
import { ZoworkDesk } from "@/components/site/zowork-desk";

/**
 * Pro.
 *
 * The console is built and its contrast gate works; it is simply not in the
 * first release. That distinction is the whole design problem, because
 * "coming soon" reads as *nothing here yet*, which is the one thing that is
 * not true.
 *
 * ## What this page has been, and what it is now
 *
 * Three shapes so far. An animated stage that spent two screens saying "soon"
 * and carried none of the console's capabilities. Then a grid of ten equal
 * panels — accurate, and flat: ten things at identical weight is no hierarchy,
 * and the page read as documentation. Five rounds of fixing panels one at a
 * time did not move it, because the panels were never the problem.
 *
 * It is now one console with the copy walking past it. Each chapter puts the
 * console into the state that chapter describes: a colour lands, the scale
 * derives, the gate refuses, an application repaints, a version is pinned, a
 * host takes over the styling. Six views of one machine rather than ten
 * diagrams of six.
 *
 * `components/site/pro-tour.tsx` holds it, and the reasoning behind the dark
 * console ground is there too.
 *
 * ## The status is the heading
 *
 * "Coming soon" is the `h1` and the eyebrow names the product. On a page about
 * something nobody can have yet, the release state is the only fact a visitor
 * does not already hold, so it takes the largest type. A version of this page
 * reversed that and put the product description in the heading with the status
 * in a chip above it; Rahul asked for the reversal to be undone.
 * `e2e/pro.spec.ts` asserts it either way, so the trade stays deliberate.
 *
 * ## The notify button asks for an address
 *
 * It was a `mailto:`, because no waitlist backend exists. It is now a dialog
 * that posts to `app/api/notify/route.ts`, which forwards to whatever
 * `NOTIFY_WEBHOOK_URL` names — and, when nothing is configured, answers `501`
 * so the dialog hands the visitor to their mail client with the address filled
 * in. The rule that has not changed is that nothing may accept an address and
 * drop it.
 *
 * ## Copy
 *
 * Deliberately flat. Every capability is named the way a changelog would name
 * it. An earlier draft used magazine headings — "One colour, eleven steps" —
 * which on a component library reads as marketing rather than documentation.
 */

export const metadata: Metadata = {
  title: "Pro — a theming console for behavioural health",
  description:
    `ZoBlocks Pro is a theming console: one brand colour in, eleven validated steps out, ` +
    `a contrast gate that refuses to publish a failure, and a stylesheet pinned to a version. ` +
    `Built and running, not in the current release. The ${CATALOG.length} open-source ` +
    `components are available now.`,
  alternates: { canonical: "/pro" },
};

export default function ProPage() {
  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main" className="pro">
        {/*
          The hero, in the shape every other page on this site uses.

          It was a dark inset card with a brand wash and a 4.75rem headline —
          striking, and a different product from the page before it. Rahul
          asked for the earlier one back and for it to match the rest of the
          site, so this is the house hero: `eyebrow eyebrow-rule`, `display-lg`,
          `body-lg`, `section-major` on a ruled section, exactly as
          `/showcase`, `/components` and `/marketplace` build theirs.

          ## The status is the heading again

          "Coming soon" is the `h1`, and the eyebrow names the product. That
          restores the rule this page held for most of its life and that a
          previous version of it reversed: on a page about something nobody can
          have yet, the release state is the only fact a visitor does not
          already hold, so it takes the largest type. `e2e/pro.spec.ts` asserts
          it, so the reversal cannot happen again by accident.
        */}
        <section className="border-b border-rule">
          <div className="section-major mx-auto max-w-6xl px-5 sm:px-8">
            <p className="eyebrow eyebrow-rule text-brand-deep" data-reveal>
              ZoBlocks Pro
            </p>
            <h1 className="display-lg mt-5 text-balance" data-reveal>
              Coming soon
            </h1>
            <p className="body-lg mt-5 max-w-xl text-pretty text-ink" data-reveal>
              A theming console for behavioural health.
            </p>
            <p className="body-lg mt-4 max-w-xl text-pretty text-graphite" data-reveal>
              One brand colour in. Eleven validated steps out, a gate that refuses to publish a
              failure, and a stylesheet pinned to a version. It is built and running. It is not in
              this release.
            </p>

            <div className="mt-8 flex flex-wrap gap-3" data-reveal>
              <NotifyDialog className="proCta">Notify me when it ships</NotifyDialog>
              <Link href="/components" className="proGhost">
                View components
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/*
          The console, as a bento.

          `aria-label` rather than a visible heading: every tile carries its
          own, and a wrapper heading would announce a section that is really
          just a layout.
        */}
        <section className="proWrap" aria-label="What the console does">
          <ProConsole />
        </section>

        {/*
          The one thing on this page that is not held back. It closes on
          something a reader can actually do, which a page about an unreleased
          product otherwise fails to offer.
        */}
        <section className="proNowBand">
          <div className="proNow">
            <div>
              <p className="proNowHead">The component library is available now</p>
              <p className="proNowBody">
                {CATALOG.length} components, MIT licensed, installed as source into your repository.
                No account and no card.
              </p>
            </div>
            <Link href="/components" className="proNowLink">
              Browse components
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>

        <ZoworkDesk />
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}
