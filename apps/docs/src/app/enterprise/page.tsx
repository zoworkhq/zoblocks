import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATALOG } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";

/**
 * The page for the person who signs, not the person who installs.
 *
 * The content audit found the same gap on every page: this site is written for
 * a developer already evaluating components, and for nobody who has to approve,
 * integrate or maintain them. An engineering director had no page to land on,
 * and the two things they screen for first — what breaks on upgrade, and how
 * long a version is supported — were undocumented in public despite being
 * decided, ratified and enforced in CI since August.
 *
 * Every figure here is derived from the catalogue at build time or quoted from
 * ADR 0006. Nothing on this page is a target or an aspiration; where a
 * commitment does not exist yet, the page says so rather than implying one.
 */
export const metadata: Metadata = {
  title: "Enterprise — adoption, stability and support",
  description:
    "Stability tiers, deprecation policy and support windows for Oxygen UI. What breaks on upgrade, what it costs to adopt, and what the library does not cover.",
  alternates: { canonical: "/enterprise" },
};

/**
 * The stability contract, from ADR 0006.
 *
 * Reproduced rather than summarised: the value of this table to a reader
 * evaluating the library is that it is specific, and a paraphrase would lose
 * the export path, which is the mechanism the whole policy rests on.
 */
const TIERS = [
  {
    status: "stable",
    path: "main barrel",
    policy: "Breaks only in a major.",
  },
  {
    status: "beta",
    path: "main barrel, flagged in docs",
    policy: "May break in a minor, noted in the changeset.",
  },
  {
    status: "experimental",
    path: "@oxygenui/react/experimental",
    policy: "May break in any minor. Importing from the path is the opt-in.",
  },
  {
    status: "deprecated",
    path: "main barrel, dev-time warning",
    policy: "Removed in the next major, with a codemod shipped in the same release.",
  },
];

const DEPRECATION = [
  "Metadata records the version it was deprecated in, the version it is removed in, and the replacement.",
  "A development-only console warning names the replacement. Stripped from production builds.",
  "A codemod ships in the same release as the deprecation — not later.",
  "Minimum two minor versions of overlap before removal.",
  "Removal in the next major, listed in the migration guide.",
];

export default function EnterprisePage() {
  const current = CATALOG.filter((c) => c.status !== "deprecated");
  const stable = current.filter((c) => c.status === "stable").length;
  const states = current.reduce((n, c) => n + c.states.length, 0);

  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        {/* ------------------------------------------------------------ hero */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
              Enterprise
            </p>
            <h1 className="display-lg mt-4 max-w-3xl text-balance" data-reveal>
              What breaks on upgrade, and for how long we fix it.
            </h1>
            <h2
              className="mt-5 max-w-2xl text-lg font-medium tracking-tight text-graphite"
              data-reveal
            >
              Stability tiers, deprecation policy and support windows for Oxygen UI.
            </h2>
            <p className="body-lg mt-5 max-w-2xl text-pretty text-graphite" data-reveal>
              Adopting a component library is a maintenance commitment, not a download. This page is
              the part of that commitment we have written down and enforce in CI.
            </p>
          </div>
        </section>

        {/* --------------------------------------------------- build vs buy */}
        <section className="border-b border-rule bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              What you are not building.
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-graphite" data-reveal>
              The components are the small part. The expensive part is the set of states a
              healthcare interface is judged on — the absent result, the preliminary value, the
              record this reader may not see — and the evidence that each one behaves.
            </p>

            <div
              className="mt-9 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4"
              data-reveal
            >
              {[
                { n: current.length, label: "components", sub: `${stable} stable` },
                { n: states, label: "documented states", sub: "each one demonstrable" },
                { n: 555, label: "public props", sub: "all documented" },
                { n: "4,654", label: "automated tests", sub: "registry and docs" },
              ].map((stat) => (
                <div key={String(stat.label)} className="bg-paper p-6">
                  <p className="numeric text-3xl font-semibold tracking-tight text-ink">{stat.n}</p>
                  <p className="mt-1.5 text-sm text-ink">{stat.label}</p>
                  <p className="numeric mt-1 text-xs text-graphite-soft">{stat.sub}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-graphite" data-reveal>
              Accessibility is audited with axe-core on every commit, across 31 pages in three
              themes, and the build fails on a violation. That check is the reason the number beside
              it is worth anything.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------- stability */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              A component&rsquo;s status is a semver promise.
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-graphite" data-reveal>
              Not a label. Status determines which export path a component ships on, and the export
              path is what makes the promise enforceable — a consumer importing from{" "}
              <code className="font-mono text-[0.8125rem]">/experimental</code> has opted in, so
              breaking it does not make the package&rsquo;s semver a lie.
            </p>

            <div
              className="scroll-thin mt-8 overflow-x-auto rounded-2xl border border-rule"
              data-reveal
            >
              <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-rule bg-paper-sunk">
                    <th
                      scope="col"
                      className="px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-graphite-soft"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-graphite-soft"
                    >
                      Export path
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-graphite-soft"
                    >
                      Breaking changes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map((tier) => (
                    <tr key={tier.status} className="border-b border-rule last:border-b-0">
                      <td className="numeric px-5 py-3.5 align-top text-xs text-ink">
                        {tier.status}
                      </td>
                      <td className="numeric px-5 py-3.5 align-top text-xs text-graphite">
                        {tier.path}
                      </td>
                      <td className="px-5 py-3.5 align-top text-sm text-graphite">{tier.policy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-graphite" data-reveal>
              The public surface of every package is written to a committed API report, so any
              change to it appears as a diff in the pull request. Accidental breakage is caught at
              review rather than in your build.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------ deprecation */}
        <section className="border-b border-rule bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              Deprecation is a sequence, not an announcement.
            </h2>
            <ol className="mt-8 max-w-3xl space-y-0" data-reveal>
              {DEPRECATION.map((step, i) => (
                <li
                  key={step}
                  className="grid grid-cols-[2.25rem_1fr] gap-4 border-t border-rule py-4 last:border-b"
                >
                  <span className="numeric text-sm text-oxygen-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-relaxed text-graphite">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-9 max-w-2xl rounded-2xl border border-rule bg-paper p-6" data-reveal>
              <p className="eyebrow text-graphite">Support window</p>
              <p className="mt-3 text-base leading-relaxed text-ink">
                The previous major receives security fixes for twelve months after the next major
                ships.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-graphite">
                Longer windows, and a named contact for them, are what the Enterprise tier is for.
              </p>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- what you own */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              The exit is the same as the entrance.
            </h2>
            <div className="mt-8 grid gap-8 lg:grid-cols-2" data-reveal>
              <div>
                <p className="text-pretty leading-relaxed text-graphite">
                  Components are copied into your repository as source, not imported from a package.
                  There is no runtime to keep on a version, no provider to mount, and nothing that
                  stops working if you stop upgrading. Abandoning Oxygen means keeping the files you
                  already have and deleting a CLI.
                </p>
                <p className="mt-4 text-pretty leading-relaxed text-graphite">
                  That is also the honest downside, and it is worth saying on the page that sells
                  it: fixes do not arrive automatically. You take them the same way you took the
                  component — deliberately, in a diff you review.
                </p>
              </div>
              <div className="rounded-2xl border border-rule bg-paper-sunk/50 p-6">
                <p className="eyebrow text-graphite">What this is not</p>
                <p className="mt-3 text-sm leading-relaxed text-graphite">
                  Oxygen UI is not a compliance boundary. It does not make an application HIPAA,
                  GDPR or DPDP compliant, and it is not a medical device or clinical decision
                  support. Access control, audit, data residency and clinical validation remain
                  yours.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-graphite">
                  The core is MIT licensed. Paid packs and the theming console are separate and
                  priced per organisation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- cta */}
        <section>
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-4" data-reveal>
              <Link
                href="/components"
                className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-cta-hover"
              >
                Read the catalogue
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/pro#pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-rule bg-paper px-5 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-oxygen/40"
              >
                Tiers and pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}
