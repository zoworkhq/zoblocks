import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleAlert } from "lucide-react";
import type { Alternative, ComponentDoc, FrameworkRelation } from "@zoblocks/component-meta";
import { CATALOG, STATUS_LABEL, getComponent } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { PropsTable } from "@/components/site/props-table";
import { ComponentPreview } from "@/components/site/component-preview";
import { CopilotGallery } from "@/components/site/copilot-gallery";
import { RevealRoot } from "@/components/site/interactions";
import { SignatureDemo } from "@/components/site/signature-demo";
import { LanguageSwitch } from "@/components/site/language-switch";
import { HostStage } from "@/components/site/host-stage";
import { Playground } from "@/components/site/playground";
import { hasPlayground } from "@/components/site/playground-registry";
import { isReady, readyRank } from "@/lib/readiness";
import { ComponentNav, type NavItem } from "@/components/site/component-nav";
import { CodeBlock, PlatformLinks } from "@/components/site/docs/code-block";
import { DocSection, DocSubsection } from "@/components/site/docs/doc-section";
import { ExampleBlock } from "@/components/site/docs/example-block";
import { InstallPill } from "@/components/site/docs/install-pill";
import { OnThisPage, type TocEntry } from "@/components/site/docs/on-this-page";
import { demoLinks } from "@/components/site/docs/sandbox";

export function generateStaticParams() {
  return CATALOG.filter((component) => isReady(component.name)).map((component) => ({
    name: component.name,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const component = getComponent(name);
  if (!component || !isReady(name)) return {};

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
/**
 * Split a rationale into its lead sentence and the rest.
 *
 * The first sentence of every rationale in this catalogue is the claim — the
 * line a reader quotes — and the remainder is the evidence for it. Setting the
 * claim at heading size and the evidence as body turns a 160-word block into
 * something with a shape, without editing a word of it.
 *
 * Deliberately conservative: it splits only on a period followed by whitespace
 * and something that can open a sentence, and only when the lead lands between
 * 40 and 220 characters. A rationale that opens with "Dr. Vance" or with one
 * very long sentence keeps its whole text as the lead, which reads exactly as
 * it does today rather than wrongly.
 *
 * Measured against all 27 rationales in the catalogue: 26 split, with a median
 * lead of 110 characters and a longest of 196. The one that does not —
 * `clinical-status` — opens with a genuinely long sentence and is correct to
 * keep it whole. The backtick in the lookahead is not decoration: `allergy-chip`
 * opens its second sentence with `criticality`.
 */
function leadOf(rationale: string): { lead: string; rest: string } {
  const match = /^(.{40,220}?[.?!])\s+(?=[A-Z(“"`])/.exec(rationale);
  if (!match) return { lead: rationale, rest: "" };
  return { lead: match[1]!, rest: rationale.slice(match[0].length).trim() };
}

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
    codeRepository: "https://github.com/zoblocks-design/zoblocks",
    url: `https://zoblocks.design/components/${seo?.slug ?? component.name}`,
    keywords: [seo?.primaryKeyword, ...(seo?.secondaryKeywords ?? [])].filter(Boolean).join(", "),
    isAccessibleForFree: component.tier === "free",
    license: "https://opensource.org/licenses/MIT",
  };
}

/**
 * The trail, for the result page rather than for this one.
 *
 * There are no visible breadcrumbs on this site and this does not add any — the
 * header already carries "All components" and a second trail above the title
 * would be furniture. What was missing is the machine-readable version, which
 * changes how the result itself is drawn: without it a component page shows a
 * bare URL under the title, and with it, the path.
 */
function breadcrumbData(component: ComponentDoc) {
  const slug = component.seo?.slug ?? component.name;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ZoBlocks", item: "https://zoblocks.design" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Components",
        item: "https://zoblocks.design/components",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: component.title,
        item: `https://zoblocks.design/components/${slug}`,
      },
    ],
  };
}

/**
 * Read the component's source from the generated registry JSON rather than
 * from the .tsx file directly. The registry is what customers actually
 * receive, so documenting it guarantees the page can never show source that
 * differs from what `zoblocks add` installs.
 */
/**
 * What this component weighs, gzipped, including everything installed with it.
 *
 * "How big is it" is the most common question asked of any component library
 * and this site did not answer it once — the hero claimed `Runtime: 0` with no
 * figure anywhere behind it.
 *
 * The walk over `registryDependencies` is the whole point. A first version
 * measured only the component's own file and reported Date Picker at 3.0 KB,
 * which is true of `date-picker.tsx` and badly false about installing it: the
 * control is a thin switch over `datetime-core`, and `zoblocks add date-picker`
 * copies that too. A number that shrinks the more work you move into a shared
 * module is worse than no number.
 *
 * It is the gzipped size of the source the CLI copies — a ceiling, not a bundle
 * delta. Nothing is imported from a package at runtime, so there is no bundle
 * to measure; the code lands in your app and is minified, tree-shaken and
 * deduplicated with everything around it. Labelled "installed", never "bundle
 * size", because those are different claims.
 */
async function readRegistryWeight(
  name: string,
): Promise<{ gzip: number; files: number; shared: number } | undefined> {
  const dir = path.join(process.cwd(), "public", "r");

  const read = async (id: string) => {
    try {
      return JSON.parse(await readFile(path.join(dir, `${id}.json`), "utf8"));
    } catch {
      return undefined;
    }
  };

  const root = await read(name);
  if (!root) return undefined;

  // Breadth-first with a seen set: `utils` and `tokens` are depended on by
  // nearly everything, and counting them once per path would inflate a
  // component with four dependencies into one with eleven.
  const seen = new Set<string>([name]);
  const queue: string[] = [...(root.registryDependencies ?? [])];
  const bodies: string[] = (root.files ?? []).map((f: { content?: string }) => f.content ?? "");
  let files = (root.files ?? []).length;
  let shared = 0;

  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const item = await read(id);
    if (!item) continue;
    shared += 1;
    files += (item.files ?? []).length;
    for (const f of item.files ?? []) bodies.push(f.content ?? "");
    queue.push(...(item.registryDependencies ?? []));
  }

  const body = bodies.join("");
  if (!body) return undefined;

  const { gzipSync } = await import("node:zlib");
  return { gzip: gzipSync(Buffer.from(body)).byteLength, files, shared };
}

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
  if (!component || !isReady(name)) notFound();

  const source = await readRegistrySource(name);
  /*
   * Related and alternative links point at pages; an unfinished component has
   * none, so it is dropped rather than rendered as a link into a 404.
   */
  const related = component.related
    .map(getComponent)
    .filter((entry) => Boolean(entry) && isReady(entry!.name));
  const weight = await readRegistryWeight(name);

  /*
   * The left pane's list: a projection, not the catalogue.
   *
   * Name, title, stability and categories — the four things the pane draws.
   * Sent whole, a ComponentDoc carries every prop table and example on the
   * site, and a client component would ship all thirty to draw fourteen
   * names. Documented ones in catalogue order; the rest listed, never linked.
   */
  const toNavItem = (entry: ComponentDoc): NavItem => ({
    name: entry.name,
    title: entry.title,
    status: entry.status,
    category: entry.categories[0] ?? "Other",
    categories: entry.categories,
  });
  const navItems = CATALOG.filter((entry) => isReady(entry.name))
    .slice()
    .sort((a, b) => readyRank(a.name) - readyRank(b.name))
    .map(toNavItem);
  const navSoon = CATALOG.filter((entry) => !isReady(entry.name) && entry.status !== "deprecated")
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(toNavItem);

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
  // See the note beside the control below.
  /*
   * One props table per exported component.
   *
   * `component.props` is the primary export's, already carrying any overrides
   * from the meta, so it is used verbatim rather than re-read from `exports`.
   * Exports with no props of their own — a component whose whole API is its
   * children — get no table, because an empty table reads as a missing one.
   */
  const apiTables = (
    component.exports.length > 0
      ? component.exports.map((entry, index) =>
          index === 0 ? { name: entry.name, props: component.props } : entry,
        )
      : [{ name: component.technicalName ?? component.title, props: component.props }]
  ).filter((entry) => entry.props.length > 0);
  const builtWith = component.relationships?.builtWith ?? [];
  const usedIn = component.relationships?.usedIn ?? [];
  const hasClinical = Boolean(
    domain?.industries.length ||
    domain?.workflows.length ||
    domain?.phi ||
    domain?.permissions.length ||
    domain?.terminology.length,
  );

  /*
   * The page's sections, in reading order, each present only when it has
   * something in it. The "On this page" list is built from this same array,
   * so an entry can never point at a section that did not render — the bug the
   * old tab bar had with Related on Tabs.
   */
  const hostedDemo = demoLinks(component.name, component.title);
  const isPackage = component.distribution === "package";
  const installLine = isPackage
    ? `pnpm add ${component.packageName}`
    : `npx @zoblocks/cli add ${component.name}`;
  const importName =
    component.technicalName ?? component.exports[0]?.name ?? component.title.replace(/\s+/g, "");
  const importFrom = isPackage
    ? (component.packageName ?? `@/components/zoblocks/${component.name}`)
    : `@/components/zoblocks/${component.name}`;
  const hasGallery = ["copilot"].includes(component.name);
  /*
   * Examples that declare a group are listed under it, in declaration order of
   * the first example in each group. "On this page" then lists the groups
   * rather than every example, which on Tabs would be twenty-three entries.
   */
  const grouped = examples.some((example) => example.group);
  const exampleGroups = grouped
    ? [...new Set(examples.map((example) => example.group ?? "More"))].map((group) => ({
        group,
        id: `examples-${group.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        items: examples.filter((example) => (example.group ?? "More") === group),
      }))
    : [];
  const hasRelated =
    related.length > 0 || alternatives.length > 0 || builtWith.length > 0 || usedIn.length > 0;
  const hasA11y = component.accessibility.length > 0 || a11yChecks.length > 0;

  /*
   * Signature keeps its full live demo beside the playground. The playground
   * shows props; the demo shows what no prop can — the stroke replay, the
   * value the form actually receives, and the states a signature reaches
   * after it is captured (locked, awaiting, withdrawn).
   */
  const hasLiveDemo = component.name === "signature";

  const toc: TocEntry[] = [
    { id: "overview", label: "Overview" },
    { id: "playground", label: playable ? "Playground" : "Preview" },
    ...(hasLiveDemo ? [{ id: "live-demo", label: "Live demo" }] : []),
    ...(examples.length
      ? [
          { id: "examples", label: "Examples" },
          ...(grouped
            ? exampleGroups.map((g) => ({ id: g.id, label: g.group, depth: 1 as const }))
            : examples.map((example) => ({
                id: `ex-${example.id}`,
                label: example.title,
                depth: 1 as const,
              }))),
        ]
      : []),
    ...(hasGallery ? [{ id: "gallery", label: "Gallery" }] : []),
    ...(variants.length ? [{ id: "variants", label: "Variants" }] : []),
    { id: "installation", label: "Installation" },
    ...(component.usage ? [{ id: "usage", label: "Usage" }] : []),
    ...(apiTables.length ? [{ id: "api", label: "API" }] : []),
    ...(hasA11y ? [{ id: "accessibility", label: "Accessibility" }] : []),
    ...(hasClinical ? [{ id: "clinical", label: "Clinical" }] : []),
    ...(source ? [{ id: "source", label: "Source" }] : []),
    ...(hasRelated ? [{ id: "related", label: "Related" }] : []),
  ];

  const position = navItems.findIndex((item) => item.name === component.name);
  const previous = position > 0 ? navItems[position - 1] : undefined;
  const next = position >= 0 ? navItems[position + 1] : undefined;
  const why = leadOf(component.rationale);

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData(component)) }}
        />

        {/*
          Two columns from `lg`: the component list, then the page. The list
          and the site header are shared with the rest of the site and are not
          part of this layout's business.
        */}
        <div className="mx-auto grid max-w-[92rem] px-5 sm:px-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-x-10">
          <ComponentNav items={navItems} soon={navSoon} current={component.name} />

          {/*
            The document, then "On this page" beside it from `xl`. One scroll:
            every section is in the page at once, so it can be read end to end,
            searched with the browser and printed whole.
          */}
          <div className="flex min-w-0 justify-center gap-14 pb-24 pt-9 lg:pt-11">
            <article className="flex min-w-0 max-w-[800px] flex-1 flex-col">
              {/* Overview ---------------------------------------------------- */}
              <section
                id="overview"
                data-toc="overview"
                aria-labelledby="overview-title"
                className="flex flex-col gap-[18px] pb-10"
              >
                <nav
                  aria-label="Breadcrumb"
                  className="flex flex-wrap gap-1.5 text-[13px] text-graphite"
                >
                  <Link href="/components" className="text-graphite no-underline hover:text-ink">
                    Components
                  </Link>
                  <span aria-hidden="true" className="text-graphite-soft">
                    /
                  </span>
                  <span>{component.categories.join(" · ")}</span>
                </nav>

                <div className="flex flex-wrap items-center gap-3">
                  <h1
                    id="overview-title"
                    className="m-0 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[40px]"
                  >
                    {component.title}
                  </h1>
                  <span className="rounded-full bg-brand/8 px-2 py-0.5 font-mono text-[11.5px] font-medium text-brand-deep">
                    {STATUS_LABEL[component.status]}
                  </span>
                </div>

                <p className="m-0 max-w-[640px] text-pretty text-[17px] leading-relaxed text-graphite">
                  {component.summary}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {/* Every resource, not just the first. Primitives take none,
                      and render no empty anchor in its place. */}
                  {component.fhir.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-graphite-soft">FHIR R4</span>
                      {component.fhir.map((resource) => (
                        <a
                          key={resource.url}
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-[5px] border border-rule px-[7px] py-0.5 font-mono text-[11.5px] text-ink no-underline transition-colors hover:border-rule-strong"
                        >
                          {resource.name}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {/* Facts a reader scans for before deciding to read anything. */}
                  <div className="flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-xs text-graphite">
                    <span>{component.states.length} states</span>
                    <span>{component.props.length} props</span>
                    {weight ? (
                      <span
                        title={`Gzipped source copied by \`zoblocks add\`: ${weight.files} files across this component and ${weight.shared} shared registry modules. A ceiling, not a bundle delta.`}
                      >
                        {(weight.gzip / 1024).toFixed(1)} KB installed
                      </span>
                    ) : null}
                    {component.since ? <span>since {component.since}</span> : null}
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2.5">
                  <InstallPill command={installLine} />
                  {source ? (
                    <a
                      href="#source"
                      className="flex h-[38px] items-center rounded-[9px] px-3 text-[13px] text-graphite no-underline transition-colors hover:bg-paper-sunk hover:text-ink"
                    >
                      View source
                    </a>
                  ) : null}
                  {isPackage ? (
                    <a
                      href={`https://www.npmjs.com/package/${component.packageName}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-[38px] items-center rounded-[9px] px-3 text-[13px] text-graphite no-underline transition-colors hover:bg-paper-sunk hover:text-ink"
                    >
                      npm ↗
                    </a>
                  ) : (
                    <a
                      href={`/r/${component.name}.json`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-[38px] items-center rounded-[9px] px-3 text-[13px] text-graphite no-underline transition-colors hover:bg-paper-sunk hover:text-ink"
                    >
                      Registry JSON ↗
                    </a>
                  )}
                </div>

                {/*
                  Why it exists. The first sentence of every rationale is the
                  claim a reader quotes, so it leads; the rest is the evidence.
                */}
                <div className="mt-4 flex flex-col gap-2.5 border-l-2 border-rule pl-4">
                  <p className="m-0 text-xs font-medium text-graphite-soft">Why it exists</p>
                  <p className="m-0 max-w-[640px] text-pretty text-[15.5px] font-medium leading-relaxed text-ink">
                    {why.lead}
                  </p>
                  {why.rest ? (
                    <p className="m-0 max-w-[640px] text-pretty text-[14.5px] leading-relaxed text-graphite">
                      {why.rest}
                    </p>
                  ) : null}
                  {/* Which elements the component reads, and what it does with
                      them — visible text, because this is what an integrator
                      checks their own feed against. */}
                  {component.fhir.some((resource) => resource.note) ? (
                    <dl className="m-0 mt-1 space-y-1.5 text-sm">
                      {component.fhir
                        .filter((resource) => resource.note)
                        .map((resource) => (
                          <div key={resource.url} className="flex flex-wrap gap-x-2">
                            <dt className="font-mono text-[12.5px] font-medium text-ink">
                              {resource.name}
                            </dt>
                            <dd className="m-0 flex-1 text-graphite">{resource.note}</dd>
                          </div>
                        ))}
                    </dl>
                  ) : null}
                </div>
              </section>

              {/* Playground / Preview -------------------------------------- */}
              {/*
                The design-language switch sits with the live stage it re-skins,
                and nowhere else: it changes nothing else on the page.
              */}
              <DocSection
                id="playground"
                title={playable ? "Playground" : "Preview"}
                first
                lead={
                  playable
                    ? "Change a prop and watch the component and its code change with it."
                    : "Every declared state, live. Pick one from the list to see it."
                }
              >
                <div data-language-bar="" className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="text-xs font-medium text-graphite-soft">Design language</span>
                  <LanguageSwitch />
                </div>
                {playable ? (
                  <HostStage className="flex w-full min-w-0 flex-col">
                    <Playground
                      name={component.name}
                      controls={controls}
                      importName={importName}
                      importFrom={importFrom}
                      links={hostedDemo}
                    />
                  </HostStage>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-rule bg-paper">
                    <div className="zb-stage p-4 sm:p-6">
                      <ComponentPreview name={component.name} states={component.states} />
                    </div>
                    {hostedDemo.length > 0 ? (
                      <div className="flex h-11 items-center justify-between gap-2 border-t border-rule bg-paper-sunk pl-3.5 pr-1.5">
                        <span className="min-w-0 truncate text-xs text-graphite">
                          Run it yourself
                        </span>
                        <div className="flex flex-none items-center gap-0.5">
                          <PlatformLinks links={hostedDemo} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </DocSection>

              {/* Live demo ------------------------------------------------- */}
              {hasLiveDemo && (
                <DocSection
                  id="live-demo"
                  title="Live demo"
                  lead="The real component and the value it records: sign, decline, or step through a locked, awaiting and withdrawn signature."
                >
                  <SignatureDemo />
                </DocSection>
              )}

              {/* Examples -------------------------------------------------- */}
              {examples.length > 0 && (
                <DocSection
                  id="examples"
                  title="Examples"
                  lead={
                    hostedDemo.length
                      ? "The cases worth copying. Open any of them in a sandbox to run the component with its dependencies installed."
                      : "The cases worth copying."
                  }
                >
                  {(component.fixtures ?? []).length > 0 && (
                    <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-graphite-soft">
                      <span>Data</span>
                      {/* Camel case kept: these are identifiers a reader types. */}
                      {(component.fixtures ?? []).map((fixture) => (
                        <code key={fixture} className="font-mono">
                          {fixture}
                        </code>
                      ))}
                    </p>
                  )}
                  {grouped ? (
                    <div className="mt-4 flex flex-col gap-14">
                      {exampleGroups.map((g) => (
                        <div key={g.id} className="flex flex-col gap-10">
                          <h3
                            id={g.id}
                            data-toc={g.id}
                            className="m-0 border-b border-rule pb-2 text-[19px] font-semibold tracking-[-0.015em] text-ink"
                          >
                            {g.group}
                          </h3>
                          {g.items.map((example) => (
                            <ExampleBlock
                              key={example.id}
                              component={component.name}
                              id={example.id}
                              title={example.title}
                              description={example.description}
                              code={example.code}
                              fixture={example.fixture}
                              links={hostedDemo}
                              level={4}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-10">
                      {examples.map((example) => (
                        <ExampleBlock
                          key={example.id}
                          component={component.name}
                          id={example.id}
                          title={example.title}
                          description={example.description}
                          code={example.code}
                          fixture={example.fixture}
                          links={hostedDemo}
                        />
                      ))}
                    </div>
                  )}
                </DocSection>
              )}

              {/* Gallery --------------------------------------------------- */}
              {/* Copilot's gallery shows the part that is not a chat box. */}
              {hasGallery && (
                <DocSection id="gallery" title="Gallery" lead="The part that is not a chat box.">
                  <HostStage className="flex w-full min-w-0 flex-col">
                    {component.name === "copilot" && <CopilotGallery />}
                  </HostStage>
                </DocSection>
              )}

              {/* Variants -------------------------------------------------- */}
              {variants.length > 0 && (
                <DocSection
                  id="variants"
                  title="Variants"
                  lead="Every variant is the same accessibility contract and the same keyboard model. Pick by what the surface needs."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="rounded-[10px] border border-rule bg-paper px-4 py-3.5"
                      >
                        <h3 className="m-0 text-[14.5px] font-semibold text-ink">
                          {variant.label}
                        </h3>
                        <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-graphite">
                          {variant.description}
                        </p>
                        {Object.keys(variant.args ?? {}).length > 0 && (
                          <p className="m-0 mt-2 font-mono text-[11.5px] leading-relaxed text-graphite-soft">
                            {Object.entries(variant.args ?? {})
                              .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
                              .join("  ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </DocSection>
              )}

              {/* Installation ---------------------------------------------- */}
              <DocSection id="installation" title="Installation">
                <CodeBlock code={installLine} lang="sh" file="Terminal" numbered={false} />
                <p className="m-0 max-w-[640px] text-pretty text-sm text-graphite">
                  {isPackage ? (
                    <>
                      {frameworkNote(component)} Import its stylesheet too:{" "}
                      <InlineCode>{`import "${component.packageName}/styles.css"`}</InlineCode>.
                    </>
                  ) : (
                    <>
                      First install? Run <InlineCode>zoblocks init</InlineCode> once to say where
                      your <InlineCode>@/</InlineCode> alias points. The source is copied into your
                      repository, along with anything it depends on.
                    </>
                  )}
                </p>
                {component.dependencies.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-graphite-soft">Dependencies</span>
                    {component.dependencies.map((dep) => (
                      <code
                        key={dep}
                        className="rounded-[5px] border border-rule px-[7px] py-0.5 font-mono text-[11.5px] text-graphite"
                      >
                        {dep}
                      </code>
                    ))}
                  </div>
                ) : null}
              </DocSection>

              {/* Usage ----------------------------------------------------- */}
              {component.usage && (
                <DocSection id="usage" title="Usage" lead="Props are the FHIR resource.">
                  <CodeBlock code={component.usage} file="usage.tsx" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Guidance title="Use it when" items={component.guidance.use} />
                    <Guidance title="Avoid it when" items={component.guidance.avoid} />
                  </div>
                </DocSection>
              )}

              {/* API ------------------------------------------------------- */}
              {/*
                One table per exported component, not one for the first. The
                date control's dispatch is a union, so the intersection the
                checker can see is three props — everything after the primary
                export is where most of its API lives.
              */}
              {apiTables.length > 0 && (
                <DocSection
                  id="api"
                  title="API"
                  lead="Every prop is typed. Props not listed are forwarded to the root element."
                  className="gap-7"
                >
                  {apiTables.map(({ name, props: exportProps }, tableIndex) => (
                    <div key={name} className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <h3 className="m-0 font-mono text-[15px] font-semibold text-ink">{name}</h3>
                        <span className="text-[13px] text-graphite">
                          {exportProps.length} {exportProps.length === 1 ? "prop" : "props"}
                          {tableIndex === 0 && component.exports.length > 1
                            ? " · the front door"
                            : ""}
                        </span>
                      </div>
                      <PropsTable props={exportProps} label={name} />
                    </div>
                  ))}
                </DocSection>
              )}

              {/* Accessibility --------------------------------------------- */}
              {hasA11y && (
                <DocSection id="accessibility" title="Accessibility" className="gap-6">
                  {component.accessibility.length > 0 && (
                    <DocSubsection title="Screen readers and semantics">
                      <ul className="m-0 flex flex-col gap-2 pl-[18px] text-sm text-graphite">
                        {component.accessibility.map((note) => (
                          <li key={note.label} className="text-pretty pl-1">
                            <span className="font-medium text-ink">{note.label}.</span>{" "}
                            {note.detail}
                          </li>
                        ))}
                      </ul>
                    </DocSubsection>
                  )}

                  {/* A claim with no evidence is prose. The schema requires the
                      evidence column; this renders it. */}
                  {a11yChecks.length > 0 && (
                    <DocSubsection
                      title={`Conformance · WCAG 2.2 AA · ${a11yChecks.filter((c) => c.status === "pass").length} of ${a11yChecks.length} pass`}
                    >
                      {/* Focusable and named: on a phone the table scrolls
                          sideways, and a scrolling region has to be reachable
                          by keyboard (axe `scrollable-region-focusable`). */}
                      <div
                        className="scroll-thin overflow-x-auto rounded-[10px] border border-rule"
                        tabIndex={0}
                        role="region"
                        aria-label="Accessibility checks"
                      >
                        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                          <thead className="bg-paper-sunk">
                            <tr>
                              <Th>Criterion</Th>
                              <Th>Status</Th>
                              <Th>How</Th>
                              <Th>Evidence</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {a11yChecks.map((check) => (
                              <tr
                                key={`${check.wcag}-${check.name}`}
                                className="border-t border-rule"
                              >
                                <td className="px-4 py-3 align-top">
                                  <span className="font-mono text-xs text-graphite-soft">
                                    {check.wcag}
                                  </span>
                                  <span className="mt-0.5 block font-medium text-ink">
                                    {check.name}
                                  </span>
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <span
                                    className="font-mono text-[11px] uppercase tracking-wide"
                                    data-zb-check={check.status}
                                  >
                                    {check.status === "not-applicable" ? "n/a" : check.status}
                                  </span>
                                </td>
                                <td className="max-w-md px-4 py-3 align-top leading-relaxed text-graphite">
                                  {check.how}
                                </td>
                                <td className="px-4 py-3 align-top font-mono text-[11px] text-graphite-soft">
                                  {check.evidence ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </DocSubsection>
                  )}
                </DocSection>
              )}

              {/* Clinical -------------------------------------------------- */}
              {hasClinical && domain && (
                <DocSection id="clinical" title="Clinical" lead={domain.clinicalContext}>
                  <dl className="m-0 grid gap-5 sm:grid-cols-2">
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
                    <div className="limitation-panel mt-2 self-start">
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
                </DocSection>
              )}

              {/* Source ---------------------------------------------------- */}
              {source && (
                <DocSection
                  id="source"
                  title="Source"
                  lead="Exactly what lands in your repository, read from the published registry so it can never drift from what the CLI installs."
                >
                  <details className="group">
                    <summary className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-rule bg-paper px-3.5 py-2 text-[13px] text-graphite transition-colors hover:border-rule-strong hover:text-ink">
                      <span className="group-open:hidden">Show source</span>
                      <span className="hidden group-open:inline">Hide source</span>
                      <span className="font-mono text-xs text-graphite-soft">
                        {source.split("\n").length} lines
                      </span>
                    </summary>
                    <CodeBlock
                      code={source}
                      file={`${component.name}.tsx`}
                      className="mt-4"
                      bodyClassName="max-h-[32rem]"
                    />
                  </details>
                </DocSection>
              )}

              {/* Related --------------------------------------------------- */}
              {hasRelated && (
                <DocSection id="related" title="Related" className="pb-12">
                  {/* "Use X instead when Y" is the strongest trust signal a
                      component page carries. */}
                  {alternatives.length > 0 && (
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                      {alternatives.map((alternative: Alternative) => {
                        const found = getComponent(alternative.ref);
                        const target = found && isReady(found.name) ? found : undefined;
                        return (
                          <li
                            key={alternative.ref}
                            className="text-sm leading-relaxed text-graphite"
                          >
                            Use{" "}
                            {target ? (
                              <Link
                                href={`/components/${target.name}`}
                                className="font-medium text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-brand"
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

                  {related.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {related.map((item) => (
                        <Link
                          key={item!.name}
                          href={`/components/${item!.name}`}
                          className="flex flex-col gap-1 rounded-[10px] border border-rule bg-paper px-4 py-3.5 no-underline transition-colors hover:border-rule-strong hover:bg-paper-sunk"
                        >
                          <span className="text-sm font-medium text-ink">{item!.title}</span>
                          <span className="line-clamp-3 text-pretty text-[13px] text-graphite">
                            {item!.summary}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Derived from what each component depends on, never declared. */}
                  {(builtWith.length > 0 || usedIn.length > 0) && (
                    <dl className="m-0 mt-2 grid gap-5 sm:grid-cols-2">
                      <ComponentLinks label="Built with" names={builtWith} />
                      <ComponentLinks label="Used in" names={usedIn} />
                    </dl>
                  )}
                </DocSection>
              )}

              {/* Pagination ------------------------------------------------ */}
              <nav aria-label="Pagination" className="grid grid-cols-2 gap-3 pt-4">
                {previous ? (
                  <Link
                    href={`/components/${previous.name}`}
                    className="flex flex-col gap-0.5 rounded-[10px] border border-rule px-4 py-3.5 no-underline transition-colors hover:border-rule-strong"
                  >
                    <span className="text-xs text-graphite-soft">← Previous</span>
                    <span className="text-[14.5px] font-medium text-ink">{previous.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/components/${next.name}`}
                    className="flex flex-col items-end gap-0.5 rounded-[10px] border border-rule px-4 py-3.5 text-right no-underline transition-colors hover:border-rule-strong"
                  >
                    <span className="text-xs text-graphite-soft">Next →</span>
                    <span className="text-[14.5px] font-medium text-ink">{next.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            </article>

            <OnThisPage entries={toc} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}

/* -------------------------------------------------------------------------- */

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded px-[5px] py-px font-mono text-[12.5px] text-ink [background:var(--color-paper-sunk)]">
      {children}
    </code>
  );
}

function Guidance({ title, items }: { title: string; items: readonly string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-[10px] border border-rule px-4 py-3.5">
      <h3 className="m-0 text-[14px] font-semibold text-ink">{title}</h3>
      <ul className="m-0 mt-2 flex flex-col gap-1.5 pl-[18px] text-[13.5px] leading-relaxed text-graphite">
        {items.map((item) => (
          <li key={item} className="text-pretty">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A labelled row of other components, or nothing when empty.
 *
 * Built-with and used-in name real relationships, so an unfinished component
 * is still worth naming — it is part of how this one is put together. It just
 * is not a link, because there is no page behind it yet.
 */
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
          const label = target?.title ?? name;
          return isReady(name) ? (
            <Link
              key={name}
              href={`/components/${name}`}
              className="underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-brand"
            >
              {label}
            </Link>
          ) : (
            <span key={name} className="text-graphite-soft">
              {label}
            </span>
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
    <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-graphite-soft">
      {children}
    </th>
  );
}
