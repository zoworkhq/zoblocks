import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, X } from "lucide-react";
import { CATALOG, STATUS_LABEL, getComponent } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { ComponentPreview } from "@/components/site/component-preview";
import { TabsGallery } from "@/components/site/tabs-gallery";
import { SwitchGallery } from "@/components/site/switch-gallery";
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

  // Primitives take no FHIR resource, and "FHIR undefined React component" is
  // the kind of title that ends up in a search result.
  return {
    title: component.resource
      ? `${component.title} — FHIR ${component.resource} React component`
      : `${component.title} — React component for healthcare interfaces`,
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
  const related = component.related.map(getComponent).filter(Boolean);

  /*
   * Every entry here is conditional on the section it points at, `related`
   * included — it used to be unconditional while the section it links to only
   * renders when there is something to put in it. A component with no related
   * entries (Tabs, today) therefore showed a "Related" tab in its in-page nav
   * whose href pointed at an id that was not on the page: clicking it did
   * nothing, and it could never be marked current, so the rail's last entry was
   * permanently dead.
   */
  const railSections: RailSection[] = [
    { id: "preview", label: "Preview" },
    ...(component.usage ? [{ id: "usage", label: "Usage & props" }] : []),
    ...(component.guidance.use.length ? [{ id: "guidance", label: "Guidance" }] : []),
    ...(component.accessibility.length ? [{ id: "quality", label: "Quality" }] : []),
    ...(source ? [{ id: "source", label: "Source" }] : []),
    ...(related.length ? [{ id: "related", label: "Related" }] : []),
  ];

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
              {/* Primitives take no FHIR resource. Rendering the link anyway
                  leaves an anchor with no text and no destination, which is
                  both an empty affordance and an axe violation. */}
              {component.resource && component.resourceUrl ? (
                <a
                  href={component.resourceUrl}
                  className="numeric inline-flex items-center gap-1 text-oxygen-deep transition-colors hover:text-ink"
                >
                  {component.resource}
                  <ArrowUpRight aria-hidden="true" className="size-3" />
                </a>
              ) : null}
              <span className="text-graphite-soft">{component.categories.join(" · ")}</span>
            </p>

            <p className="lede mt-6 max-w-3xl text-pretty">{component.rationale}</p>

            <div className="mt-8 max-w-2xl">
              {/*
                Two channels, and the command has to match the one this
                component actually uses. A package component shown a
                `shadcn add` line sends the reader to a registry item that does
                not exist — which is worse than no install instructions.
              */}
              {component.distribution === "package" ? (
                <InstallCommand
                  command={`pnpm add ${component.packageName}`}
                  note={
                    <>
                      {/*
                        The reason differs per package and stating the wrong one
                        is worse than stating none: a reader who is told Tabs
                        wraps Ant Design will add a dependency it does not need.
                      */}
                      {component.name === "signature"
                        ? "This one ships on npm rather than as copied source, because it wraps Ant Design — copying a framework into your repository would be a fork, not a component."
                        : "This one ships on npm rather than as copied source, because it carries a headless core you can take on its own. Ant Design is an optional peer: the component works without it."}{" "}
                      Import its stylesheet too:{" "}
                      <code className="font-mono text-[0.6875rem] text-ink">
                        {`import "${component.packageName}/styles.css"`}
                      </code>
                      .
                    </>
                  }
                />
              ) : (
                <InstallCommand
                  command={`pnpm dlx shadcn@latest add @oxygenui/${component.name}`}
                  note={
                    <>
                      First install? Add{" "}
                      <code className="font-mono text-[0.6875rem] text-ink">
                        {'"@oxygenui": "https://oxygenui.design/r/{name}.json"'}
                      </code>{" "}
                      to the <code className="font-mono text-[0.6875rem] text-ink">registries</code>{" "}
                      block of your{" "}
                      <code className="font-mono text-[0.6875rem] text-ink">components.json</code>{" "}
                      first — or skip the config and pass{" "}
                      <code className="font-mono text-[0.6875rem] text-ink">
                        {`https://oxygenui.design/r/${component.name}.json`}
                      </code>{" "}
                      directly.
                    </>
                  }
                />
              )}
            </div>
          </div>
        </section>

        <SectionRail sections={railSections} />

        {/* Preview ------------------------------------------------------ */}
        <section id="preview" className="scroll-mt-24 border-b border-rule bg-paper-sunk/40">
          {/*
            Switch takes the whole width and shows everything at once rather
            than one card behind a switcher.

            The scenario switcher is the right shape for a component whose
            states are alternatives — a loader is spinning or it is not. It is
            the wrong shape for one whose argument is that three axes are
            independent and seven commit phases are seven different recoveries:
            those are a *set*, and a set shown one card at a time reads as a
            list of unrelated screenshots. The absence reasons in particular
            only make their point side by side, where the word changes and the
            colour does not.
          */}
          <div
            className={`mx-auto section-minor px-5 sm:px-8 ${
              component.name === "switch" ? "max-w-[92rem]" : "max-w-6xl"
            }`}
          >
            <SectionHeading
              eyebrow="Preview"
              title={
                component.name === "switch"
                  ? "Every state, phase and surface — live, on the page."
                  : "Every state, switchable."
              }
            />
            <div className="mt-8" data-reveal>
              {component.name === "switch" ? (
                <SwitchGallery />
              ) : (
                <ComponentPreview name={component.name} />
              )}
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

          {/*
            Tabs earns a gallery rather than a single preview: the claim it
            makes is that eleven skins and four semantic modes share one
            keyboard model, and a claim about sameness cannot be shown with
            one example.

            It also earns its own container. The prose column is 6xl, and a tab
            strip is not prose: at that width the grid gives each demo ~340px,
            which is narrower than the strips themselves — so the workhorse
            variants rendered permanently overflowed, showing nudge arrows and a
            clipped last label as if that were the design rather than the demo
            being too small to hold it.
          */}
          {component.name === "tabs" && (
            <div className="mx-auto max-w-[92rem] px-5 pb-[clamp(2.75rem,5vw,4.5rem)] sm:px-8">
              <div data-reveal>
                <SectionHeading eyebrow="Gallery" title="Every variant, mode and state — live." />
                <div className="mt-8">
                  <TabsGallery />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Usage & props ------------------------------------------------ */}
        {component.usage && (
          <section id="usage" className="scroll-mt-24 border-b border-rule">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <SectionHeading eyebrow="Usage" title="Props are the FHIR resource." />

              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div data-reveal>
                  <pre
                    tabIndex={0}
                    className="scroll-thin-dark overflow-x-auto rounded-2xl border border-panel-rule bg-panel p-5 font-mono text-[0.75rem] leading-relaxed text-panel-fg/90"
                  >
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
                  {/* A container that scrolls must be reachable by keyboard —
                      WCAG 2.1.1. `tabIndex={0}` makes it focusable so arrow
                      keys can pan it, and the group role plus label mean a
                      screen-reader user is told what they have landed on rather
                      than hearing an unnamed focus stop. This became a real
                      violation the moment the props table started listing the
                      full API instead of one prop. */}
                  <div
                    className="scroll-thin overflow-x-auto rounded-2xl border border-rule bg-paper"
                    tabIndex={0}
                    role="group"
                    aria-label={`${component.title} props — scrollable table`}
                  >
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
                              <span className="numeric text-xs font-medium text-ink">
                                {prop.name}
                              </span>
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
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeading eyebrow="Guidance" title="When to use it, and when not to." />
                <p className="guidance-readout numeric shrink-0 text-xs text-graphite-soft">
                  DECISION SURFACE /{" "}
                  {component.guidance.use.length + component.guidance.avoid.length} RULES
                </p>
              </div>

              <div className="guidance-board mt-10">
                <GuidanceList
                  title="Use it"
                  label="Recommended context"
                  items={component.guidance.use}
                  icon={Check}
                  tone="use"
                />
                <GuidanceList
                  title="Don't"
                  label="Guardrails"
                  items={component.guidance.avoid}
                  icon={X}
                  tone="avoid"
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
                    className="limitation-panel self-start"
                  >
                    <div className="limitation-panel__header">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="limitation-panel__signal" aria-hidden="true">
                          <CircleAlert className="size-4" />
                        </span>
                        <div>
                          <p className="limitation-panel__kicker numeric text-[0.625rem] text-graphite-soft">
                            Open gaps
                          </p>
                          <h3 className="mt-1 font-display text-base font-semibold tracking-tight">
                            Known limitations
                          </h3>
                        </div>
                      </div>
                      <span
                        className="limitation-panel__count numeric"
                        aria-label={`${component.limitations.length} known limitations`}
                      >
                        {String(component.limitations.length).padStart(2, "0")}
                      </span>
                    </div>
                    {/* Stated plainly. An undocumented limitation becomes a
                        bug report, and in this domain, sometimes worse. */}
                    <ul className="limitation-list" aria-label="Known limitations">
                      {component.limitations.map((limitation, index) => (
                        <li
                          key={limitation}
                          className="limitation-item text-sm leading-relaxed text-graphite"
                        >
                          <span className="limitation-index numeric" aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="limitation-marker" aria-hidden="true">
                            ↳
                          </span>
                          <span>{limitation}</span>
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
              <SectionHeading eyebrow="Source" title="Exactly what lands in your repository." />
              <p className="mt-3 max-w-2xl text-sm text-graphite" data-reveal>
                Read directly from the published registry, so this can never drift from what the CLI
                installs.
              </p>
              <details className="mt-6 group" data-reveal>
                <summary className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-rule bg-paper px-4 py-2 text-sm text-graphite transition-colors hover:border-rule-strong hover:text-ink">
                  <span className="group-open:hidden">Show source</span>
                  <span className="hidden group-open:inline">Hide source</span>
                  <span className="numeric text-xs text-graphite-soft">
                    {source.split("\n").length} lines
                  </span>
                </summary>
                <pre
                  tabIndex={0}
                  className="scroll-thin-dark mt-4 max-h-[32rem] overflow-auto rounded-2xl border border-panel-rule bg-panel p-5 font-mono text-[0.7rem] leading-relaxed text-panel-fg/90"
                >
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
  label,
  items,
  icon: Icon,
  tone,
  delay = false,
}: {
  title: string;
  label: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  tone: "use" | "avoid";
  delay?: boolean;
}) {
  return (
    <div
      data-reveal
      style={delay ? ({ "--reveal-delay": "80ms" } as React.CSSProperties) : undefined}
      className={`guidance-column guidance-column--${tone}`}
    >
      <div className="guidance-column__header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="guidance-column__marker" aria-hidden="true" />
          <div>
            <p className="guidance-kicker numeric text-[0.625rem] text-graphite-soft">{label}</p>
            <h3 className="mt-1 font-display text-base font-semibold tracking-tight">{title}</h3>
          </div>
        </div>
        <span className="guidance-count numeric" aria-label={`${items.length} guidance items`}>
          {String(items.length).padStart(2, "0")}
        </span>
      </div>
      <ul className="guidance-list" aria-label={`${title} guidance`}>
        {items.map((item, index) => (
          <li key={item} className="guidance-item text-sm leading-relaxed text-graphite">
            <span className="guidance-index numeric" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="guidance-icon" aria-hidden="true">
              <Icon />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
