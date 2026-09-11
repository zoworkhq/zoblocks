import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  ZOWORK_ANCHORS,
  ZOWORK_CASE_STUDIES_HREF,
  ZOWORK_HREF,
  ZOWORK_PROOF,
  ZOWORK_SINCE,
  ZOWORK_TRACKS,
  zoworkYears,
} from "@/lib/zowork";

/**
 * Zowork, on the home page.
 *
 * This argument was only on `/pro`, under a heading that says "Coming soon" —
 * which put the one thing on this site that has revenue behind it at the
 * bottom of the one page that admits it has nothing to sell yet. The services
 * are the business; the components are how the business is met.
 *
 * It is deliberately not the `/pro` panel moved. That one is a desk: a contact
 * card, phone numbers, offices, somewhere to land once you have decided. A
 * reader arrives here undecided, so this one carries the two things that
 * decide it — how long they have done this, and what they actually sell.
 *
 * ## The rail is the section's one drawn claim
 *
 * Every firm in this market writes the same service list. What none of them
 * can write is a tenure, so tenure is what gets drawn. It is also Zowork's own
 * framing — "Years, not sprints" is their line, and it is quoted as theirs.
 *
 * The band is a band and not four bars on purpose: zowork.com publishes the
 * count and the span, not which partnership ran which length. Four bars would
 * mean inventing three numbers to make a chart look specific.
 *
 * ## Facts
 *
 * All of them live in `lib/zowork.ts`, read from zowork.com on 11 September
 * 2026, and are shared with the `/pro` panel so the two cannot disagree.
 */

/**
 * Where the anchor band starts, as a share of the company's own life.
 *
 * The track *is* the decade, so the band has something to be measured
 * against. Both ends run to `now`, because zero churn means none of the four
 * has ended: what varies is how far back each one reaches. The solid core is
 * the shortest tenure — the span every one of them covers — and the lighter
 * extension is how much further the longest reaches.
 */
const CORE_FROM = (years: number) => `${((years - ZOWORK_ANCHORS.minYears) / years) * 100}%`;
const REACH_FROM = (years: number) => `${((years - ZOWORK_ANCHORS.maxYears) / years) * 100}%`;

export function ZoworkPractice() {
  const years = zoworkYears();

  return (
    <section id="zowork" className="scroll-mt-16 border-t border-rule bg-paper-sunk/50">
      <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
              Who builds this
            </p>
            <h2 className="display-lg mt-4 text-balance" data-reveal>
              Behavioral health since {ZOWORK_SINCE}. Without a pivot.
            </h2>
            {/*
              Three plain sentences, and the middle one is the section's whole
              job: name what Zowork actually builds, so "for hire" is a
              conclusion a reader reaches rather than a thing we assert.

              The three domains are the ones zowork.com can evidence — EHR
              integration (50+ of them), the documentation AI that became
              Bells.ai, and 12M+ telehealth encounters. A vaguer sentence would
              have been shorter and worth less.
            */}
            <p className="lede mt-5 max-w-2xl text-pretty" data-reveal>
              Zowork builds the clinical systems these components came out of — EHR integration,
              ambient documentation, telehealth at scale. The components are free. The rest is the
              work Zowork does.
            </p>
          </div>

          {/*
            The mark, signing the section from its bottom-right corner.

            `items-start` / `lg:items-end` is load-bearing rather than tidy. A
            flex column's default is `align-items: stretch`, which overrides an
            image's `width: auto` and paints the mark at full column width with
            its height still pinned — not a subtle distortion, and it has
            shipped here once before. An explicit alignment closes that path;
            `.zwpMark` carries the second line of defence.
          */}
          <div className="flex flex-col items-start gap-4 lg:items-end lg:pb-2" data-reveal="right">
            <Image
              src="/brand/zowork.png"
              alt="Zowork"
              width={202}
              height={52}
              className="zwpMark"
              unoptimized
            />
            <a
              href={ZOWORK_HREF}
              rel="noopener"
              className="group inline-flex items-center gap-1.5 text-sm text-graphite transition-colors hover:text-ink"
            >
              zowork.com
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </div>
        </div>

        {/* The ledger: one drawn claim, four checkable ones. */}
        <div className="surface-1 mt-14 overflow-hidden rounded-2xl" data-reveal>
          <figure className="zwpRail">
            <figcaption className="zwpRailHead">
              <span className="axis-label">Tenure</span>
              <span className="zwpRailQuote">
                &ldquo;Years, not sprints.&rdquo; <span className="zwpRailCite">— Zowork</span>
              </span>
            </figcaption>

            {/*
              One track, because the first version drew two and neither said
              anything. A bar filling an axis that was defined by its own value
              is a tautology, and a band floating on a second axis repeated a
              number the label had already given.

              The track is the company's decade. The band inside it is how much
              of that decade the anchor clients have been present for — which
              is the fact, and it is only visible when the two share one scale.
            */}
            <div className="zwpRailTrack">
              <span
                className="zwpRailBar zwpRailBar--reach"
                style={{ insetInlineStart: REACH_FROM(years) }}
              />
              <span
                className="zwpRailBar zwpRailBar--core"
                style={{ insetInlineStart: CORE_FROM(years) }}
              />
            </div>

            <div className="zwpRailEnds" aria-hidden="true">
              <span className="numeric">{ZOWORK_SINCE}</span>
              <span className="numeric">now</span>
            </div>

            <p className="zwpRailKey">
              {ZOWORK_ANCHORS.count} anchor partnerships, each running{" "}
              <b>
                {ZOWORK_ANCHORS.minYears}–{ZOWORK_ANCHORS.maxYears} of those {years} years
              </b>
              .
            </p>
            <p className="zwpRailNames">{ZOWORK_ANCHORS.names.join(" · ")}</p>
          </figure>

          <dl className="zwpProof">
            {ZOWORK_PROOF.map(({ value, label }) => (
              <div key={value}>
                <dt className="zwpProofV">{value}</dt>
                <dd className="zwpProofL">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/*
          What they sell, in four columns and nothing else.

          This has been cut twice. It started as four cards, each with a
          heading, a strapline and a blurb before a reader reached a single
          service. Then it kept a published metric under every name, which
          doubled the height and made a glanceable list into something to read.

          What is left is the list. The numbers that decide anything are in the
          ledger above at a size that carries; the rest are on zowork.com.
        */}
        <div className="zwpTracks mt-12" data-reveal>
          {ZOWORK_TRACKS.map((track) => (
            <section key={track.name} aria-labelledby={`zwp-${track.name.toLowerCase()}`}>
              <h3 id={`zwp-${track.name.toLowerCase()}`} className="axis-label">
                {track.name}
              </h3>
              <ul className="zwpServices">
                {track.services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3" data-reveal>
          <a
            href={ZOWORK_HREF}
            rel="noopener"
            className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-cta-hover"
          >
            Book a 30-minute consultation
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
            />
          </a>
          <a
            href={ZOWORK_CASE_STUDIES_HREF}
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-xl border border-rule px-5 py-3.5 text-sm font-medium text-ink transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-brand/40"
          >
            Case studies
          </a>
        </div>
      </div>
    </section>
  );
}
