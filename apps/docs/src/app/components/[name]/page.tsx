import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, X } from "lucide-react";
import { CATALOG, STATUS_LABEL, getComponent } from "@/lib/catalog";
import { ScrollRail, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { ComponentPreview } from "@/components/site/component-preview";
import { InstallCommand, RevealRoot } from "@/components/site/interactions";
import { SectionRail, type RailSection } from "@/components/site/section-rail";

export function generateStaticParams() {
  return CATALOG.map((component) => ({ name: component.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const component = getComponent(name);
  if (!component) return {};

  return {
    title: `${component.title} — FHIR ${component.resource} React component`,
    description: component.summary,
    alternates: { canonical: `/components/${component.name}` },
  };
}

/**
 * Read the component's source from the generated registry JSON rather than
 * from the .tsx file directly. The registry is what customers actually
 * receive, so documenting it guarantees the page can never show source that
 * differs from what `shadcn add` installs.
 */
async function readRegistrySource(name: string): Promise<string | undefined> {
  try {
    const file = path.join(process.cwd(), "public", "r", `${name}.json`);
    const item = JSON.parse(await readFile(file, "utf8"));
    return item.files?.[0]?.content;
  } catch {
    return undefined;
  }
}

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const component = getComponent(name);
  if (!component) notFound();

  const source = await readRegistrySource(name);
  const railSections: RailSection[] = [
    { id: "preview", label: "Preview" },
    ...(component.usage ? [{ id: "usage", label: "Usage & props" }] : []),
    ...(component.guidance.use.length ? [{ id: "guidance", label: "Guidance" }] : []),
    ...(component.accessibility.length ? [{ id: "quality", label: "Quality" }] : []),
    ...(source ? [{ id: "source", label: "Source" }] : []),
    { id: "related", label: "Related" },
  ];
  const related = component.related.map(getComponent).filter(Boolean);

  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        {/* Header ------------------------------------------------------- */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <Link
              href="/components"
              className="inline-flex items-center gap-1.5 text-sm text-graphite transition-colors hover:text-ink"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              All components
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <h1 className="display-lg text-balance">{component.title}</h1>
              <span className="rounded-full border border-oxygen/30 bg-oxygen/8 px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wider text-oxygen-deep">
                {STATUS_LABEL[component.status]}
              </span>
            </div>

            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-graphite">
              <a
                href={component.resourceUrl}
                className="numeric inline-flex items-center gap-1 text-oxygen-deep transition-colors hover:text-ink"
              >
                {component.resource}
                <ArrowUpRight aria-hidden="true" className="size-3" />
              </a>
              <span className="text-graphite-soft">{component.categories.join(" · ")}</span>
            </p>

            <p className="lede mt-6 max-w-3xl text-pretty">{component.description}</p>

            <div className="mt-8 max-w-2xl">
              <InstallCommand command={`pnpm dlx shadcn@latest add @oxygenui/${component.name}`} />
            </div>

            <div className="mt-10 hidden lg:block">
              <SectionRail sections={railSections} />
            </div>
          </div>
        </section>

        {/* Preview ------------------------------------------------------ */}
        <section id="preview" className="scroll-mt-24 border-b border-rule bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <SectionHeading eyebrow="Preview" title="Every state, switchable." />
            <div className="mt-8" data-reveal>
              <ComponentPreview name={component.name} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2" data-reveal>
              {component.states.map((state) => (
                <span
                  key={state}
                  className="rounded-full border border-rule bg-paper px-2.5 py-1 text-xs text-graphite"
                >
                  {state}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Usage & props ------------------------------------------------ */}
        {component.usage && (
          <section id="usage" className="scroll-mt-24 border-b border-rule">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <SectionHeading eyebrow="Usage" title="Props are the FHIR resource." />

              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div data-reveal>
                  <pre tabIndex={0} className="scroll-thin-dark overflow-x-auto rounded-2xl border border-panel-rule bg-panel p-5 font-mono text-[0.75rem] leading-relaxed text-panel-fg/90">
                    <code>{component.usage}</code>
                  </pre>

                  <h3 className="mt-8 font-display text-sm font-semibold uppercase tracking-wide text-graphite">
                    Dependencies
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {component.dependencies.map((dep) => (
                      <li
                        key={dep}
                        className="numeric rounded-lg border border-rule bg-paper-sunk px-2.5 py-1 text-xs text-graphite"
                      >
                        {dep}
                      </li>
                    ))}
                  </ul>
                </div>

                <div data-reveal style={{ "--reveal-delay": "80ms" } as React.CSSProperties}>
                  <div className="scroll-thin overflow-x-auto rounded-2xl border border-rule bg-paper">
                    <table className="w-full border-collapse text-sm">
                      <caption className="sr-only">{component.title} props</caption>
                      <thead>
                        <tr className="border-b border-rule bg-paper-sunk">
                          <Th>Prop</Th>
                          <Th>Type</Th>
                          <Th>Default</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {component.props.map((prop) => (
                          <tr key={prop.name} className="border-b border-rule last:border-b-0">
                            <td className="px-4 py-3 align-top">
                              <span className="numeric text-xs font-medium text-ink">{prop.name}</span>
                              <p className="mt-1 text-xs leading-relaxed text-graphite">
                                {prop.description}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className="numeric text-xs text-oxygen-deep">{prop.type}</span>
                            </td>
                            <td className="numeric px-4 py-3 align-top text-xs text-graphite-soft">
                              {prop.default ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Guidance ----------------------------------------------------- */}
        {(component.guidance.use.length > 0 || component.guidance.avoid.length > 0) && (
          <section id="guidance" className="scroll-mt-24 border-b border-rule bg-paper-sunk/40">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <SectionHeading eyebrow="Guidance" title="When to use it, and when not to." />

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <GuidanceList
                  title="Use it"
                  items={component.guidance.use}
                  icon={Check}
                  tone="text-oxygen-deep"
                />
                <GuidanceList
                  title="Don't"
                  items={component.guidance.avoid}
                  icon={X}
                  tone="text-critical"
                  delay
                />
              </div>
            </div>
          </section>
        )}

        {/* Accessibility & limitations ---------------------------------- */}
        {(component.accessibility.length > 0 || component.limitations.length > 0) && (
          <section id="quality" className="scroll-mt-24 border-b border-rule">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <SectionHeading
                eyebrow="Quality"
                title="What was tested, and what is still missing."
              />

              <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <dl className="space-y-5" data-reveal>
                  {component.accessibility.map((item) => (
                    <div key={item.label}>
                      <dt className="font-display text-[0.9375rem] font-semibold tracking-tight">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-graphite">{item.detail}</dd>
                    </div>
                  ))}
                </dl>

                {component.limitations.length > 0 && (
                  <div
                    data-reveal
                    style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
                    className="surface-1 rounded-2xl p-6"
                  >
                    <h3 className="flex items-center gap-2 font-display text-[0.9375rem] font-semibold tracking-tight">
                      <CircleAlert aria-hidden="true" className="size-4 text-graphite" />
                      Known limitations
                    </h3>
                    {/* Stated plainly. An undocumented limitation becomes a
                        bug report, and in this domain, sometimes worse. */}
                    <ul className="mt-3 space-y-2">
                      {component.limitations.map((limitation) => (
                        <li key={limitation} className="text-sm leading-relaxed text-graphite">
                          — {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Source ------------------------------------------------------- */}
        {source && (
          <section id="source" className="scroll-mt-24 border-b border-rule bg-paper-sunk/40">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <SectionHeading
                eyebrow="Source"
                title="Exactly what lands in your repository."
              />
              <p className="mt-3 max-w-2xl text-sm text-graphite" data-reveal>
                Read directly from the published registry, so this can never drift from what the
                CLI installs.
              </p>
              <details className="mt-6 group" data-reveal>
                <summary className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-rule bg-paper px-4 py-2 text-sm text-graphite transition-colors hover:border-rule-strong hover:text-ink">
                  <span className="group-open:hidden">Show source</span>
                  <span className="hidden group-open:inline">Hide source</span>
                  <span className="numeric text-xs text-graphite-soft">
                    {source.split("\n").length} lines
                  </span>
                </summary>
                <pre tabIndex={0} className="scroll-thin-dark mt-4 max-h-[32rem] overflow-auto rounded-2xl border border-panel-rule bg-panel p-5 font-mono text-[0.7rem] leading-relaxed text-panel-fg/90">
                  <code>{source}</code>
                </pre>
              </details>
            </div>
          </section>
        )}

        {/* Related ------------------------------------------------------ */}
        {related.length > 0 && (
          <section id="related" className="scroll-mt-24">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <SectionHeading eyebrow="Related" title="Pairs well with." />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item!.name}
                    href={`/components/${item!.name}`}
                    data-reveal
                    className="group surface-2 lift rounded-2xl p-5 hover:border-oxygen/45"
                  >
                    <h3 className="font-display text-base font-semibold tracking-tight">
                      {item!.title}
                    </h3>
                    <p className="numeric mt-1 text-xs text-oxygen-deep">{item!.resource}</p>
                    <p className="mt-2 text-sm leading-relaxed text-graphite">{item!.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
      <ScrollRail />
    </RevealRoot>
  );
}

/* -------------------------------------------------------------------------- */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow text-graphite" data-reveal>
        {eyebrow}
      </p>
      <h2 className="display-sm mt-3 text-balance" data-reveal>
        {title}
      </h2>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-graphite-soft"
    >
      {children}
    </th>
  );
}

function GuidanceList({
  title,
  items,
  icon: Icon,
  tone,
  delay = false,
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  delay?: boolean;
}) {
  return (
    <div
      data-reveal
      style={delay ? ({ "--reveal-delay": "80ms" } as React.CSSProperties) : undefined}
      className="surface-1 rounded-2xl p-6"
    >
      <h3 className="font-display text-[0.9375rem] font-semibold tracking-tight">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-graphite">
            <Icon aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${tone}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
