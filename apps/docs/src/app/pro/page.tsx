import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";

/**
 * Pro — the holding page.
 *
 * The console is built and the contrast gate works; it is simply not in the
 * first release. That distinction is the whole design. A blank "coming soon"
 * says *nothing here yet*, which is the one thing that is not true, and the
 * page it replaces — ten animated glances, a feature browser and a tier table
 * — sells a console nobody can reach and takes payment decisions with it.
 *
 * So the page keeps its own argument and holds it one step short. The gate's
 * four steps are the console's real pipeline; three tick over in sequence and
 * `Publish` stays an open ring on a dashed rail. Done and pending are two
 * *shapes* rather than two colours, so the state survives a greyscale print
 * and a red-green deficiency — the same rule the components are held to.
 *
 * ## Why the stage is full-bleed
 *
 * The first build was a dark card centred on the light page with a blurred
 * copy of the old hero behind it. At 1280px that read as an overlay. At
 * 1920px it read as a bug: the blurred material sat on the left only, because
 * a left-aligned hero has nothing on its right, and the card floated in white
 * with a smudge beside it. An overlay only reads as one when something sits
 * behind it *everywhere*.
 *
 * So the stage is the overlay now — edge to edge, at any width, with the
 * console's own output out of focus along the bottom. Nothing to go lopsided.
 *
 * The page it replaces is still here, whole, in `console-page.tsx`.
 */

export const metadata: Metadata = {
  title: "Pro — coming soon",
  description:
    "The Oxygen theming console is built and gated, and not in the first release. The 27 open-source components are.",
  alternates: { canonical: "/pro" },
};

const HEADLINE = "Coming soon";

/** The console's real pipeline. Only the last one is outstanding. */
const STEPS: { step: string; label: string; note: string; pending?: boolean }[] = [
  { step: "01", label: "Brand colour", note: "one hex, from you" },
  { step: "02", label: "Eleven steps", note: "generated, not guessed" },
  { step: "03", label: "Contrast gate", note: "every pair checked" },
  { step: "04", label: "Publish", note: "held for the next release", pending: true },
];

/**
 * The eleven steps the console emits from one hue — its output, blurred along
 * the bottom of the stage.
 *
 * Mirrored, and that is the whole point. Laid out in its natural order the
 * ramp runs light to dark across the viewport, and once blurred that is a
 * band bright on the left and black on the right — the exact lopsidedness the
 * full-bleed stage exists to avoid. Reflected about its darkest step it reads
 * as a centred bloom instead, symmetric at any width.
 *
 * Hard-coded rather than computed: a decorative band that changes between
 * renders is a visual-regression failure waiting to happen, and ADR 0007 is
 * explicit that VRT must be deterministic.
 */
const RAMP_STEPS = [
  "#eafaf5",
  "#c6f1e5",
  "#9be7d4",
  "#6cdcc1",
  "#3fd0ad",
  "#10b995",
  "#0d9c7e",
  "#0a7f67",
  "#086651",
  "#064e3e",
  "#04372c",
];
const RAMP = [...RAMP_STEPS].reverse().concat(RAMP_STEPS.slice(1));

/*
 * No waitlist exists to post to, and a field that swallows an address is worse
 * than no field. `hello@zowork.com` is the address the showcase page already
 * uses for the same reason.
 */
const NOTIFY_HREF =
  "mailto:hello@zowork.com?subject=" + encodeURIComponent("Notify me when Oxygen Pro ships");

export default function ProPage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="soon">
        <section className="soonStage">
          {/* Texture, and none of it carries information. */}
          <div className="soonGlow" aria-hidden="true" />
          <div className="soonRamp" aria-hidden="true">
            {RAMP.map((c, i) => (
              <span key={`${c}${i}`} style={{ ["--c" as string]: c }} />
            ))}
          </div>
          {/* The validation sweep, crossing the stage the way it crosses a theme. */}
          <div className="soonSweep" aria-hidden="true">
            <i />
          </div>

          <div className="soonInner">
            <div className="soonSay">
              <p className="eyebrow eyebrow-rule soonEyebrow">Oxygen Pro</p>
              {/*
                One span per letter is what staggers the entrance, and eleven
                single-character nodes are not a heading — so the whole run is
                hidden from the accessibility tree and `aria-label` supplies
                the name.

                The first attempt used a visually-hidden copy of the string
                instead, which reads correctly but leaves `ComingsoonComing
                soon` in `textContent` — what a reader gets when they select
                the headline and copy it. The word space is a real text node
                for the same reason: an empty spacer span would make the copy
                read `Comingsoon`.
              */}
              <h1 className="soonHead" aria-label={HEADLINE}>
                <span aria-hidden="true">
                  {HEADLINE.split("").map((c, i) =>
                    c === " " ? (
                      " "
                    ) : (
                      <span key={`${c}${i}`} className="soonCh" style={{ ["--i" as string]: i }}>
                        {c}
                      </span>
                    ),
                  )}
                </span>
              </h1>
              <p className="soonLede">
                The theming console is built and the gate works. It is not in the first release —
                the 27 open components are.
              </p>

              <div className="soonActions">
                <a href={NOTIFY_HREF} className="soonCta">
                  Email me when it ships
                </a>
                <Link href="/components" className="soonGhost">
                  Browse the open components
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
              <p className="soonNote">Free · no card · the components ship today</p>
            </div>

            {/*
              The pipeline, read top to bottom. The rail into `Publish` is
              dashed because that segment has not been travelled — the one
              piece of state the page exists to communicate.
            */}
            <ol className="soonGate">
              {STEPS.map(({ step, label, note, pending }, i) => (
                <li
                  key={step}
                  className="soonStep"
                  style={{ ["--n" as string]: i }}
                  {...(pending ? { "data-pending": "" } : {})}
                >
                  <i className="soonDot" aria-hidden="true" />
                  <span className="soonStepK">Step {step}</span>
                  <span className="soonStepV">
                    {label}
                    <span className="sr-only">{pending ? " — not yet" : " — done"}</span>
                  </span>
                  <span className="soonStepN">{note}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
