import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, X } from "lucide-react";
import type { Alternative, ComponentDoc, FrameworkRelation } from "@oxygenui-design/component-meta";
import { CATALOG, STATUS_LABEL, getComponent } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { ComponentPreview } from "@/components/site/component-preview";
import { TabsGallery } from "@/components/site/tabs-gallery";
import { CopilotGallery } from "@/components/site/copilot-gallery";
import { SwitchGallery } from "@/components/site/switch-gallery";
import { InstallCommand, RevealRoot } from "@/components/site/interactions";
import { SectionRail, type RailSection } from "@/components/site/section-rail";
import { Playground } from "@/components/site/playground";
import { hasPlayground } from "@/components/site/playground-registry";

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

  /*
   * An authored title wins over the derived one.
   *
   * The fallback is still here and still matters — most components have not
   * declared `seo` yet — but a derived title is a guess, and on the components
   * that have thought about it the guess is worse than the answer. Primitives
   * take no FHIR resource, and "FHIR undefined React component" is the kind of
   * title that ends up in a search result.
   */
  const seo = component.seo;
  const title =
    seo?.title ??
    (component.resource
      ? `${component.title} — FHIR ${component.resource} React component`
      : `${component.title} — React component for healthcare interfaces`);
  const description = seo?.description ?? component.summary;
  const slug = seo?.slug ?? component.name;
  const keywords = [seo?.primaryKeyword, ...(seo?.secondaryKeywords ?? [])].filter(
    (keyword): keyword is string => Boolean(keyword),
  );

  return {
    title,
    description,
    ...(keywords.length ? { keywords } : {}),
    alternates: { canonical: `/components/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/components/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Structured data for the page, as `SoftwareSourceCode`.
 *
 * Not `Product`: nothing here is for sale on its own, and marking a free
 * component as a product with no offer is the kind of mismatch that gets a
 * whole domain's rich results withdrawn. `TechArticle` was the other
 * candidate and describes the prose rather than the thing the prose is about.
 */
function structuredData(component: ComponentDoc) {
  const seo = component.seo;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: component.title,
    alternateName: component.aliases,
    description: seo?.description ?? component.summary,
    programmingLanguage: "TypeScript",
    runtimePlatform: "React",
    codeRepository: "https://github.com/oxygenui-design/oxygen",
    url: `https://oxygenui.design/components/${seo?.slug ?? component.name}`,
    keywords: [seo?.primaryKeyword, ...(seo?.secondaryKeywords ?? [])].filter(Boolean).join(", "),
    isAccessibleForFree: component.tier === "free",
    license: "https://opensource.org/licenses/MIT",
  };
}

/**
 * Read the component's source from the generated registry JSON rather than
 * from the .tsx file directly. The registry is what customers actually
 * receive, so documenting it guarantees the page can never show source that
 * differs from what `oxygen add` installs.
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

/**
 * Why this component ships on npm, in its own words.
 *
 * ADR 0010 classifies every component against each UI framework —
 * `compatible` (matches the API, imports nothing), `wrapping` (inherits
 * behaviour worth having, and must name it), or `neutral`. The schema refuses a
 * wrapping component that does not say what it inherits, so the sentence below
 * can be built from data instead of from a conditional that goes stale.
 */
function frameworkNote(component: ComponentDoc): string {
  const wrapping = Object.entries(component.frameworks ?? {}).find(
    ([, relation]) => (relation as FrameworkRelation).policy === "wrapping",
  ) as [string, FrameworkRelation] | undefined;

  if (wrapping) {
    const [framework, relation] = wrapping;
    const inherits = relation.inherits?.[0]?.replace(/\s+—.*$/, "").replace(/\.$/, "");
    return (
      `This one ships on npm rather than as copied source, because it wraps ${framework} — ` +
      `copying a framework into your repository would be a fork, not a component.` +
      (inherits ? ` What it inherits: ${inherits.toLowerCase()}.` : "")
    );
  }

  return (
    "This one ships on npm rather than as copied source, because it carries a headless core " +
    "you can take on its own. Ant Design is an optional peer: the component works without it."
  );
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
  const variants = component.variants ?? [];
  const examples = component.examples ?? [];
  const a11yChecks = component.a11yChecks ?? [];
  const domain = component.domain;
  const alternatives = component.relationships?.alternatives ?? [];
  const controls = component.controls ?? [];
  const playable = controls.length > 0 && hasPlayground(component.name);
  const builtWith = component.relationships?.builtWith ?? [];
  const usedIn = component.relationships?.usedIn ?? [];
  const hasClinical = Boolean(
    domain?.industries.length ||
    domain?.workflows.length ||
    domain?.phi ||
    domain?.permissions.length ||
    domain?.terminology.length,
  );

  const railSections: RailSection[] = [
    { id: "preview", label: "Preview" },
    ...(playable ? [{ id: "playground", label: "Playground" }] : []),
    ...(variants.length ? [{ id: "variants", label: "Variants" }] : []),
    ...(component.usage ? [{ id: "usage", label: "Usage & props" }] : []),
    ...(examples.length ? [{ id: "examples", label: "Examples" }] : []),
    ...(component.guidance.use.length ? [{ id: "guidance", label: "Guidance" }] : []),
    ...(hasClinical ? [{ id: "clinical", label: "Clinical" }] : []),
    ...(component.accessibility.length ? [{ id: "quality", label: "Quality" }] : []),
    ...(a11yChecks.length ? [{ id: "conformance", label: "Conformance" }] : []),
    ...(source ? [{ id: "source", label: "Source" }] : []),
    ...(related.length || alternatives.length || builtWith.length || usedIn.length
      ? [{ id: "related", label: "Related" }]
      : []),
  ];

  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <script
          type="application/ld+json"
          // Serialised from the same metadata the page renders, so the two
          // cannot disagree — a rich result describing a component page that
          // says something else is worse than no rich result.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(component)) }}
        />

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
                component actually uses. A package component shown an
                `oxygen add` line sends the reader to a registry item that does
                not exist — which is worse than no install instructions.
              */}
              {component.distribution === "package" ? (
                <InstallCommand
                  command={`pnpm add ${component.packageName}`}
                  note={
                    <>
                      {/*
                        Read from the component's own metadata rather than a
                        conditional on its name. The reason differs per package
                        and stating the wrong one is worse than stating none —
                        a reader told Tabs wraps Ant Design adds a dependency it
                        does not need. A hardcoded `name === "signature"` was
                        right for exactly as long as there were two of these.
                      */}
                      {frameworkNote(component)} Import its stylesheet too:{" "}
                      <code className="font-mono text-[0.6875rem] text-ink">
                        {`import "${component.packageName}/styles.css"`}
                      </code>
                      .
                    </>
                  }
                />
              ) : (
                <InstallCommand
                  command={`npx @oxygenui-design/cli add ${component.name}`}
                  note={
                    <>
                      First install? Run{" "}
                      <code className="font-mono text-[0.6875rem] text-ink">oxygen init</code> once
                      to say where your{" "}
                      <code className="font-mono text-[0.6875rem] text-ink">@/</code> alias points.
                      The source is copied into your repository, along with anything it depends on.
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

          {/*
            Copilot earns one for the opposite reason to Tabs. Tabs needs a
            gallery because one strip cannot show that eleven skins share a
            keyboard model. Copilot needs one because the scenario switcher
            above shows a chat surface, and a chat surface is the least
            interesting thing in the package — the mode contract, the pipeline
            order, the fence and the crisis classifier are the product, and
            none of them is visible in a screenshot of a text field.
          */}
          {component.name === "copilot" && (
            <div className="mx-auto max-w-[92rem] px-5 pb-[clamp(2.75rem,5vw,4.5rem)] sm:px-8">
              <div data-reveal>
                <SectionHeading
                  eyebrow="Under the surface"
                  title="The part that is not a chat box."
                />
                <div className="mt-8">
                  <CopilotGallery />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Playground --------------------------------------------------- */}
        {playable && (
          <section id="playground" className="scroll-mt-24 border-b border-rule">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeading eyebrow="Playground" title="Change a prop, watch it change." />
                <p className="numeric shrink-0 text-xs text-graphite-soft">
                  {controls.length} PROPS / LIVE
                </p>
              </div>
              {/* The knobs come from the same metadata the props table does,
                  and the generator checks every option against the prop's real
                  type — so a control here cannot offer a value the component
                  would reject. */}
              <div className="mt-8" data-reveal>
                <Playground name={component.name} controls={controls} />
              </div>
            </div>
          </section>
        )}

        {/* Variants ----------------------------------------------------- */}
        {variants.length > 0 && (
          <section id="variants" className="scroll-mt-24 border-b border-rule">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <SectionHeading
                eyebrow="Variants"
                title="One component, and what each skin is for."
              />
              <p className="mt-3 max-w-2xl text-sm text-graphite" data-reveal>
                Every variant is the same accessibility contract and the same keyboard model. Pick
                by what the surface needs, not by what the code would be easier to write.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {variants.map((variant, index) => (
                  <div
                    key={variant.id}
                    data-reveal
                    style={{ "--reveal-delay": `${index * 40}ms` } as React.CSSProperties}
                    className="surface-2 rounded-2xl p-5"
                  >
                    <h3 className="font-display text-base font-semibold tracking-tight">
                      {variant.label}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-graphite">
                      {variant.description}
                    </p>
                    {Object.keys(variant.args ?? {}).length > 0 && (
                      <p className="mt-3 font-mono text-[0.7rem] leading-relaxed text-graphite-soft">
                        {Object.entries(variant.args ?? {})
                          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
                          .join("  ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

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

        {/* Examples ----------------------------------------------------- */}
        {examples.length > 0 && (
          <section id="examples" className="scroll-mt-24 border-b border-rule bg-paper-sunk/40">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeading eyebrow="Examples" title="The cases worth copying." />
                {(component.fixtures ?? []).length > 0 && (
                  <p className="numeric shrink-0 text-xs text-graphite-soft">
                    DATA / {(component.fixtures ?? []).join(", ")}
                  </p>
                )}
              </div>

              <div className="mt-8 space-y-8">
                {examples.map((example, index) => (
                  <article
                    key={example.id}
                    data-reveal
                    style={{ "--reveal-delay": `${index * 60}ms` } as React.CSSProperties}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-lg font-semibold tracking-tight">
                        {example.title}
                      </h3>
                      {example.fixture && (
                        <span className="numeric text-[0.625rem] uppercase tracking-wide text-graphite-soft">
                          {example.fixture}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-graphite">
                      {example.description}
                    </p>
                    <pre
                      tabIndex={0}
                      className="scroll-thin-dark mt-4 overflow-auto rounded-2xl border border-panel-rule bg-panel p-5 font-mono text-[0.7rem] leading-relaxed text-panel-fg/90"
                    >
                      <code>{example.code}</code>
                    </pre>
                  </article>
                ))}
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

        {/* Clinical ----------------------------------------------------- */}
        {hasClinical && domain && (
          <section id="clinical" className="scroll-mt-24 border-b border-rule">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <SectionHeading eyebrow="Clinical" title="Where it sits in the record." />

              {domain.clinicalContext && (
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-graphite" data-reveal>
                  {domain.clinicalContext}
                </p>
              )}

              <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal>
                <Fact label="Industries" values={domain.industries} />
                <Fact label="Workflows" values={domain.workflows} />
                <Fact label="Terminology" values={domain.terminology} />
                <Fact label="Permissions" values={domain.permissions} />
                {typeof domain.auditable === "boolean" && (
                  <Fact
                    label="Audit"
                    values={[domain.auditable ? "Emits AuditEvent" : "Emits no AuditEvent"]}
                  />
                )}
              </dl>

              {domain.phi && (
                <div className="limitation-panel mt-8 self-start" data-reveal>
                  <div className="limitation-panel__header">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="limitation-panel__signal" aria-hidden="true">
                        <CircleAlert className="size-4" />
                      </span>
                      <div>
                        <p className="limitation-panel__kicker numeric text-[0.625rem] text-graphite-soft">
                          Protected health information
                        </p>
                        <h3 className="mt-1 font-display text-base font-semibold tracking-tight">
                          {domain.phi.handles ? "Handles PHI" : "Handles no PHI"}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-graphite">
                    {domain.phi.notes}
                  </p>
                </div>
              )}
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

        {/* Conformance -------------------------------------------------- */}
        {a11yChecks.length > 0 && (
          <section id="conformance" className="scroll-mt-24 border-b border-rule bg-paper-sunk/40">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeading
                  eyebrow="Conformance"
                  title="Every claim, and the test behind it."
                />
                <p className="numeric shrink-0 text-xs text-graphite-soft">
                  WCAG 2.2 AA / {a11yChecks.filter((c) => c.status === "pass").length} OF{" "}
                  {a11yChecks.length} PASS
                </p>
              </div>

              {/* A claim with no evidence is prose, and prose in an
                  accessibility panel is how a library ends up asserting
                  conformance it has never measured. The schema requires the
                  evidence column; this renders it. */}
              <div className="scroll-thin mt-8 overflow-x-auto" data-reveal>
                <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-rule">
                      <Th>Criterion</Th>
                      <Th>Status</Th>
                      <Th>How</Th>
                      <Th>Evidence</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {a11yChecks.map((check) => (
                      <tr key={`${check.wcag}-${check.name}`} className="border-b border-rule/60">
                        <td className="py-3 pr-4 align-top">
                          <span className="numeric text-xs text-graphite-soft">{check.wcag}</span>
                          <span className="mt-0.5 block font-medium">{check.name}</span>
                        </td>
                        <td className="py-3 pr-4 align-top">
                          <span
                            className="numeric text-[0.625rem] uppercase tracking-wide"
                            data-ox-check={check.status}
                          >
                            {check.status === "not-applicable" ? "n/a" : check.status}
                          </span>
                        </td>
                        <td className="max-w-md py-3 pr-4 align-top leading-relaxed text-graphite">
                          {check.how}
                        </td>
                        <td className="py-3 align-top font-mono text-[0.7rem] text-graphite-soft">
                          {check.evidence ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        {(related.length > 0 ||
          alternatives.length > 0 ||
          builtWith.length > 0 ||
          usedIn.length > 0) && (
          <section id="related" className="scroll-mt-24">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <SectionHeading eyebrow="Related" title="Pairs well with." />

              {/* "Use X instead when Y" is the single strongest trust signal a
                  component page carries: a library that will send you
                  elsewhere is one you can believe when it does not. */}
              {alternatives.length > 0 && (
                <ul className="mt-6 space-y-2" data-reveal>
                  {alternatives.map((alternative: Alternative) => {
                    const target = getComponent(alternative.ref);
                    return (
                      <li key={alternative.ref} className="text-sm leading-relaxed text-graphite">
                        Use{" "}
                        {target ? (
                          <Link
                            href={`/components/${target.name}`}
                            className="font-medium text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-oxygen"
                          >
                            {target.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-ink">{alternative.ref}</span>
                        )}{" "}
                        instead when {alternative.when}.
                      </li>
                    );
                  })}
                </ul>
              )}

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

              {/* Derived from what each component depends on, never declared.
                  `usedIn` in particular is a fact no component can know about
                  itself, and a hand-maintained one is wrong within a month. */}
              {(builtWith.length > 0 || usedIn.length > 0) && (
                <dl className="mt-10 grid gap-6 sm:grid-cols-2" data-reveal>
                  <ComponentLinks label="Built with" names={builtWith} />
                  <ComponentLinks label="Used in" names={usedIn} />
                </dl>
              )}
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

/** A labelled row of links to other components, or nothing when empty. */
function ComponentLinks({ label, names }: { label: string; names: readonly string[] }) {
  if (!names.length) return null;
  return (
    <div>
      <dt className="numeric text-[0.625rem] uppercase tracking-wide text-graphite-soft">
        {label}
      </dt>
      <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-graphite">
        {names.map((name) => {
          const target = getComponent(name);
          return (
            <Link
              key={name}
              href={`/components/${name}`}
              className="underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-oxygen"
            >
              {target?.title ?? name}
            </Link>
          );
        })}
      </dd>
    </div>
  );
}

/** One labelled list of short values, or nothing when the list is empty. */
function Fact({ label, values }: { label: string; values: readonly string[] }) {
  if (!values.length) return null;
  return (
    <div>
      <dt className="numeric text-[0.625rem] uppercase tracking-wide text-graphite-soft">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-graphite">{values.join(", ")}</dd>
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
