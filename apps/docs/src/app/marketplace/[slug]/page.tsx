import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, Info } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { KIND_LABEL, buyHref, findItem, priceLabel, shelf } from "@/lib/marketplace";
import { DOES_NOT_CLAIM } from "@/lib/market-preview";

export const revalidate = 600;

/**
 * Rendered on demand when the catalogue was unreachable at build time.
 *
 * The alternative is a 404 on a real product because a private service was
 * restarting while CI ran, which is the kind of failure that is discovered by
 * a customer rather than by us.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  // The shelf, not the console. With the console unreachable this used to
  // return nothing, so not one detail page was generated — every /marketplace
  // link was a 404 waiting for a service that does not exist yet.
  return (await shelf()).map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await findItem(slug);
  if (!item) return {};

  return {
    title: `${item.title} — ${KIND_LABEL[item.kind]} for healthcare interfaces`,
    description: item.blurb,
    alternates: { canonical: `/marketplace/${item.slug}` },
  };
}

/**
 * One item, and the evidence for it.
 *
 * The evidence is the page. Anybody can draw three hundred glyphs; publishing
 * them with a contrast record, a named review scope and an explicit list of
 * things they do not claim requires a company that already works that way — and
 * it is the only part of this worth reading before you have decided to buy.
 */
export default async function MarketplaceItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await findItem(slug);
  if (!item) notFound();

  const { accessibility, clinical, authorship, licence, fhir } = item.provenance;

  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <Link
              href="/marketplace"
              className="group inline-flex items-center gap-2 text-sm text-graphite transition-colors hover:text-ink"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Marketplace
            </Link>

            <p className="eyebrow eyebrow-rule mt-8 text-brand-deep" data-reveal>
              {KIND_LABEL[item.kind]}
            </p>
            <h1 className="display-xl mt-5 max-w-4xl text-balance" data-reveal>
              {item.title}
            </h1>
            <p className="lede mt-6 max-w-2xl text-pretty" data-reveal>
              {item.blurb}
            </p>

            {/*
              One statement of availability, not three.

              A chip reading "Coming soon", a line reading "what it will cost ·
              not yet on sale", and a disabled button reading "Coming soon" all
              sat in a sixty-pixel band saying the same thing three ways — which
              reads as hedging rather than as clarity. It was also the wrong
              word for a finished pack: these are built and measured, and the
              shop is what is shut.
            */}
            <div className="mt-8 flex flex-wrap items-baseline gap-4" data-reveal>
              <span className="tabular font-mono text-2xl font-semibold">
                {priceLabel(item.price)}
              </span>
              <span className="body-sm text-graphite">
                {item.purchasable
                  ? "one-time · the whole organisation · perpetual"
                  : item.comingSoon
                    ? "the price it will carry · not built yet"
                    : "the price it will carry · not yet on sale"}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3" data-reveal>
              {!item.purchasable ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-rule bg-paper-sunk px-5 py-3.5 text-sm font-medium text-graphite-soft"
                >
                  {/* The line above carries whether it is built; this carries whether
                      it can be bought. Two questions, two answers, said once each. */}
                  Coming soon
                </button>
              ) : (
                <a
                  href={buyHref(item.slug)}
                  className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-cta-hover"
                >
                  Buy in the app
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                  />
                </a>
              )}
              {/*
                Was "Compare with Pro", pointing at a holding page with nothing
                to compare against. The useful second destination from an item
                is the rest of the shelf.
              */}
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 rounded-xl border border-rule px-5 py-3.5 text-sm font-medium text-ink transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-brand/40"
              >
                See the whole shelf
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              What was checked
            </h2>
            <p className="body-sm mt-3 max-w-2xl text-graphite" data-reveal>
              Generated from the record stored beside the artwork, so it cannot drift from what was
              actually tested. Export it into your own accessibility evidence file.
            </p>

            <ul className="mt-8 grid gap-3 lg:grid-cols-2">
              <Fact tone="pass">
                {accessibility.contrastPairs.passed}/{accessibility.contrastPairs.total} contrast
                pairs at or above {accessibility.contrastPairs.floor}
                <Detail>
                  checker v{accessibility.checkerVersion} · {accessibility.checkedAt.slice(0, 10)}
                </Detail>
              </Fact>

              <Fact tone="pass">
                Forced colours {accessibility.forcedColors}
                <Detail>meaning carried by {accessibility.nonColourChannel}</Detail>
              </Fact>

              {clinical ? (
                <Fact tone="pass">
                  Clinically reviewed {clinical.reviewedAt.slice(0, 10)}
                  <Detail>
                    {clinical.reviewedBy} ({clinical.registration}) — {clinical.scope}
                  </Detail>
                </Fact>
              ) : (
                /*
                 * Stated, not omitted.
                 *
                 * Clinical review is the differentiator this whole page is
                 * built on, and it is the one thing not yet in place. A missing
                 * row reads as an oversight; a row that says so reads as the
                 * truth, and it is the truth a safety officer needs before they
                 * read anything else here.
                 */
                <Fact tone="info">
                  Clinical review pending
                  <Detail>no registered clinician has reviewed this pack</Detail>
                </Fact>
              )}

              <Fact tone="info">
                {authorship.method}
                <Detail>
                  {authorship.thirdPartyContent.length > 0
                    ? `includes ${authorship.thirdPartyContent.join(", ")}`
                    : "no third-party content"}
                </Detail>
              </Fact>

              {fhir && (
                <Fact tone="info">
                  Maps {fhir.maps.join(", ")}
                  <Detail>FHIR {fhir.release}</Detail>
                </Fact>
              )}

              <Fact tone="info">
                {item.files} file{item.files === 1 ? "" : "s"} · version {item.version}
                <Detail>
                  {item.frameworks ? item.frameworks.join(", ") : "framework-agnostic"}
                </Detail>
              </Fact>
            </ul>

            <div className="surface mt-8 px-6 py-6" data-reveal>
              <p className="flex items-center gap-2 font-display text-base font-semibold">
                <CircleAlert aria-hidden="true" className="size-4 text-graphite" />
                What it does not claim
              </p>
              <ul className="mt-3 space-y-1.5">
                {(clinical?.doesNotClaim ?? DOES_NOT_CLAIM).map((claim) => (
                  <li key={claim} className="body-sm text-graphite">
                    {claim}
                  </li>
                ))}
              </ul>
              <p className="body-xs mt-4 text-graphite-soft">
                We would rather lose a sale than imply otherwise.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              Licence
            </h2>
            <dl className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2" data-reveal>
              <Term label="Grant">{licence.grant}</Term>
              <Term label="Derivatives">{licence.derivatives}</Term>
              <Term label="Resale">{licence.resale}</Term>
              <Term label="Identifier">{licence.id}</Term>
            </dl>
          </div>
        </section>
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}

/**
 * One checked fact.
 *
 * A word beside every mark, never a bare tick. Meaning carried by colour alone
 * is the defect this whole library argues about, and an evidence list is the
 * last place to commit it.
 */
function Fact({ tone, children }: { tone: "pass" | "info"; children: React.ReactNode }) {
  const Icon = tone === "pass" ? Check : Info;
  return (
    <li className="flex gap-3 rounded-xl border border-rule bg-paper px-4 py-3.5" data-reveal>
      <Icon
        aria-hidden="true"
        className={
          tone === "pass"
            ? "mt-0.5 size-4 shrink-0 text-brand-deep"
            : "mt-0.5 size-4 shrink-0 text-graphite"
        }
      />
      <p className="body-sm text-ink">
        <span className="sr-only">{tone === "pass" ? "Passed: " : "Note: "}</span>
        {children}
      </p>
    </li>
  );
}

function Detail({ children }: { children: React.ReactNode }) {
  return <span className="mt-0.5 block text-graphite-soft">{children}</span>;
}

function Term({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="eyebrow text-graphite-soft">{label}</dt>
      <dd className="body-sm mt-1.5 text-graphite">{children}</dd>
    </div>
  );
}
