import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATALOG } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { ZoworkDesk } from "@/components/site/zowork-desk";

/**
 * Pro — the holding page.
 *
 * The console is built and the contrast gate works; it is simply not in the
 * first release. That distinction is the whole design. A blank "coming soon"
 * says *nothing here yet*, which is the one thing that is not true.
 *
 * ## What this replaced, and why
 *
 * The previous build made that point with a full-bleed animated stage: a
 * blurred token ramp, a sweep, and the console's four-step pipeline with
 * `Publish` held open on a dashed rail. It was honest and it was pretty, and
 * it carried **1,128 characters over two full screens** — a page whose largest
 * element said "soon" and whose only other content was a four-item list.
 *
 * The console has ten capabilities. None of them were on the page.
 *
 * So the shape is now the ordinary one a component library uses for a paid
 * tier: the status as the headline, one sentence saying what the thing is,
 * then the capabilities as a grid a reader can scan. Nothing here is
 * decorative. `console-page.tsx` still holds the full pitch, whole, for the
 * release that puts the console back.
 *
 * ## Why the copy reads flat
 *
 * Deliberately. An earlier draft of this page named the features things like
 * "One colour, eleven steps" and "A failing theme cannot go live". That is a
 * magazine voice, and on a component library it reads as marketing rather than
 * as documentation. Every name below is what the feature would be called in a
 * changelog: `Theme editor`, `Contrast validation`, `Versioned delivery`.
 */

export const metadata: Metadata = {
  title: "Pro — coming soon",
  description:
    `ZoBlocks Pro is a theming console: branded themes, automatic contrast validation and ` +
    `versioned stylesheet delivery. Not in the current release. The ${CATALOG.length} ` +
    `open-source components are available now.`,
  alternates: { canonical: "/pro" },
};

/**
 * The console's capabilities, in the order a reader meets them when using it.
 *
 * Six rather than ten. The remaining four — the component playground,
 * role-based access, Figma integration and organisation licensing — are real
 * and are listed in `lib/pro-features.ts`, but a holding page for something
 * nobody can buy does not need to enumerate them; six fills the grid without a
 * ragged final row at any breakpoint.
 */
const FEATURES: { name: string; detail: string }[] = [
  {
    name: "Theme editor",
    detail:
      "Create and edit themes as drafts. Changes reach a running application only when someone publishes them.",
  },
  {
    name: "Contrast validation",
    detail:
      "Every colour pair is checked against WCAG on the server. A theme below the threshold cannot be published.",
  },
  {
    name: "Colour scale generation",
    detail:
      "Enter one brand colour. The console derives an eleven-step scale from 50 to 950, anchored so step 600 is the colour you gave it.",
  },
  {
    name: "Versioned delivery",
    detail:
      "Each publish produces an immutable stylesheet URL with the version in the path, alongside a manifest for what CSS cannot carry.",
  },
  {
    name: "Density modes",
    detail:
      "Three densities share one token set. Row spacing changes; the minimum touch target does not.",
  },
  {
    name: "Framework bridges",
    detail:
      "Map a theme onto Ant Design or MUI tokens, so components match the application around them.",
  },
];

/*
 * No waitlist exists to post to, and a field that swallows an address is worse
 * than no field. `hello@zowork.com` is the address the showcase page already
 * uses for the same reason.
 */
const NOTIFY_HREF =
  "mailto:hello@zowork.com?subject=" + encodeURIComponent("Notify me when ZoBlocks Pro ships");

export default function ProPage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="pro">
        <section className="proHero">
          {/*
            The eyebrow names the product and the `h1` states its status, which
            is the wrong way round for a marketing page and the right way round
            for this one: the status is the only thing on this page a reader
            does not already know.
          */}
          <p className="eyebrow proEyebrow">ZoBlocks Pro</p>
          <h1 className="proHead">Coming soon</h1>
          <p className="proSay">Theme management for ZoBlocks</p>
          <p className="proLede">
            Create branded themes, validate colour contrast automatically, and deliver them to your
            applications as versioned stylesheets. The console is built and running. It is not in
            the current release.
          </p>

          <div className="proActions">
            <a href={NOTIFY_HREF} className="proCta">
              Notify me when it ships
            </a>
            <Link href="/components" className="proGhost">
              View components
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>

        {/*
          A description list rather than a grid of divs. Each cell is a term and
          its definition, which is what this is, and it means a screen reader
          announces the pairing rather than twelve unrelated fragments.
        */}
        <section aria-labelledby="pro-features-head">
          <h2 id="pro-features-head" className="sr-only">
            What the console does
          </h2>
          <dl className="proGrid">
            {FEATURES.map(({ name, detail }) => (
              <div key={name} className="proCell">
                <dt className="proCellName">{name}</dt>
                <dd className="proCellDetail">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/*
          The one thing on this page that is not held. It closes the page on
          something a reader can actually do, which a holding page otherwise
          fails to offer.
        */}
        <section className="proNow">
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
        </section>

        <ZoworkDesk />
      </main>

      <SiteFooter />
    </>
  );
}
