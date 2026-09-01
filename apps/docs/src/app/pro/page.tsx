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
 * `Publish` stays a hollow ring. Done and pending are two *shapes* rather than
 * two colours, so the state survives a greyscale print and a red-green
 * deficiency — the same rule the components are held to.
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
const STEPS: { step: string; label: string; pending?: boolean }[] = [
  { step: "01", label: "Brand colour" },
  { step: "02", label: "Eleven steps" },
  { step: "03", label: "Contrast gate" },
  { step: "04", label: "Publish", pending: true },
];

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
        <section className="soonFrame">
          {/*
            The page underneath, out of focus. Decoration — it carries no
            information the reader is expected to recover, so it is hidden
            from the accessibility tree rather than read out blurred.
          */}
          <div className="soonBehind" aria-hidden="true">
            <div className="soonBehindInner">
              <p className="eyebrow text-oxygen-deep">Oxygen Pro</p>
              <p className="soonBehindHead">
                Your brand, through a gate that will not let it fail.
              </p>
              <p className="soonBehindBody">
                A theming console for behavioral health. Set one brand colour, get eleven validated
                steps. Publish only what passes contrast.
              </p>
              <div className="soonBehindBtns">
                <span />
                <span />
              </div>
            </div>
          </div>
          <div className="soonScrim" aria-hidden="true" />

          <div className="soonStack">
            <div className="soonPanel">
              {/* The validation sweep, crossing the panel the way it crosses a theme. */}
              <div className="soonSweep" aria-hidden="true">
                <i />
              </div>

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
                Built, gated, and not in the first release. The open components are.
              </p>

              <ol className="soonGate">
                {STEPS.map(({ step, label, pending }) => (
                  <li key={step} className="soonStep" {...(pending ? { "data-pending": "" } : {})}>
                    <span className="soonStepK">Step {step}</span>
                    <span className="soonStepV">
                      <i className="soonDot" aria-hidden="true" />
                      {label}
                      <span className="sr-only">{pending ? " — not yet" : " — done"}</span>
                    </span>
                  </li>
                ))}
              </ol>

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
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
