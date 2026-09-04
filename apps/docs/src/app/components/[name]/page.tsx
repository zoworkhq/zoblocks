import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CircleAlert } from "lucide-react";
import type { Alternative, ComponentDoc, FrameworkRelation } from "@oxygenui-design/component-meta";
import { CATALOG, STATUS_LABEL, getComponent } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { PropsTable } from "@/components/site/props-table";
import { ComponentPreview } from "@/components/site/component-preview";
import { TabsGallery } from "@/components/site/tabs-gallery";
import { CopilotGallery } from "@/components/site/copilot-gallery";
import { SwitchGallery } from "@/components/site/switch-gallery";
import { DatePickerGallery } from "@/components/site/date-picker-gallery";
import { InstallCommand, RevealRoot } from "@/components/site/interactions";
import { LanguageSwitch } from "@/components/site/language-switch";
import { HostStage } from "@/components/site/host-stage";
import { SectionTabs, type RailSection } from "@/components/site/section-tabs";
import { Playground } from "@/components/site/playground";
import { hasPlayground } from "@/components/site/playground-registry";
import { isReady, readyRank } from "@/lib/readiness";
import { ComponentNav, type NavItem } from "@/components/site/component-nav";

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
    codeRepository: "https://github.com/oxygenui-design/oxygen",
    url: `https://oxygenui.design/components/${seo?.slug ?? component.name}`,
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
      { "@type": "ListItem", position: 1, name: "Oxygen UI", item: "https://oxygenui.design" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Components",
        item: "https://oxygenui.design/components",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: component.title,
        item: `https://oxygenui.design/components/${slug}`,
      },
    ],
  };
}

/**
 * Read the component's source from the generated registry JSON rather than
 * from the .tsx file directly. The registry is what customers actually
 * receive, so documenting it guarantees the page can never show source that
 * differs from what `oxygen add` installs.
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
 * control is a thin switch over `datetime-core`, and `oxygen add date-picker`
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

/**
 * Previews that need more width than the prose column.
 *
 * Switch shows forty controls at once. Data Grid is a five-column worklist with
 * a 15.5rem state rail beside it, which at 6xl left the table about 840px —
 * two hundred less than the same grid gets on the home page, and the reason its
 * columns read as cramped there and comfortable here.
 */
const WIDE_PREVIEW = new Set(["switch", "data-grid"]);

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

  const railSections: RailSection[] = [
    { id: "preview", label: "Preview" },
    { id: "why", label: "Why it exists" },
    ...(playable ? [{ id: "playground", label: "Playground" }] : []),
    ...(variants.length ? [{ id: "variants", label: "Variants" }] : []),
    ...(component.usage ? [{ id: "usage", label: "Usage & props" }] : []),
    ...(examples.length ? [{ id: "examples", label: "Examples" }] : []),
    ...(hasClinical ? [{ id: "clinical", label: "Clinical" }] : []),
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData(component)) }}
        />

        {/*
          Two columns from `lg`: the component list, then the page.

          The outer measure is wider than the site's 6xl because the pane is
          added beside the content rather than taken out of it — at 1440px
          the content column still lands within a few pixels of 6xl. Every
          section keeps its own `mx-auto max-w-6xl` container and simply
          centres inside the narrower column; the two wide previews fill it.
        */}
        <div className="mx-auto grid max-w-[92rem] px-5 sm:px-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-x-10">
          <ComponentNav items={navItems} soon={navSoon} current={component.name} />

          <div className="min-w-0">
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
                  {/* Every resource, not just the first. A component that reads
                  three of them said so in its metadata and showed one. */}
                  {component.fhir.map((resource) => (
                    <a
                      key={resource.url}
                      href={resource.url}
                      className="numeric inline-flex items-center gap-1 text-oxygen-deep transition-colors hover:text-ink"
                    >
                      {resource.name}
                      <ArrowUpRight aria-hidden="true" className="size-3" />
                    </a>
                  ))}
                  <span className="text-graphite-soft">{component.categories.join(" · ")}</span>
                </p>

                {/*
              The summary goes here; the rationale goes below the preview.

              Three of the four people who open this page are looking rather
              than reading, and the fourth quotes a passage that works as well
              under a demo as over one. Leading with the rationale put the
              component 962px down the page — past the fold on every laptop —
              so a client in a demo call met a paragraph instead of the product.
              The prose is not cut; it is moved and given a lead line.
            */}
                <p className="lede mt-6 max-w-3xl text-pretty">{component.summary}</p>

                {/* Facts a reader scans for before deciding to read anything. */}
                <p className="numeric mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] uppercase tracking-wide text-graphite-soft">
                  <span>{component.states.length} states</span>
                  <span aria-hidden="true">·</span>
                  <span>{component.props.length} props</span>
                  {weight ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span
                        title={`Gzipped source copied by \`oxygen add\`: ${weight.files} files across this component and ${weight.shared} shared registry modules. A ceiling, not a bundle delta.`}
                      >
                        {(weight.gzip / 1024).toFixed(1)} KB installed
                      </span>
                    </>
                  ) : null}
                  {component.since ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>since {component.since}</span>
                    </>
                  ) : null}
                </p>

                {/*
              The design-language switch.

              Here rather than in the site header, because it changes the
              preview on this page and nothing else — a global control would
              imply it re-skins the site, and it deliberately does not. Beside
              the install command because both answer the same question: does
              this fit the stack we already have.
            */}
                {/*
              On every component page, with no exceptions.

              Signature was excepted at first, on the reasoning that it wraps
              Ant Design itself so a second framework around it would either
              fight its own provider or show an antd control inside a Material
              frame. That was the wrong call: the second half of it is *true
              and worth showing*. `@oxygenui-design/signature` declares antd as
              a peer, so a Material UI shop installing it really does get antd
              components in their palette, and a demo that hides that is a demo
              that misleads about what the package costs.
            */}
                <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="eyebrow text-graphite-soft">Design language</span>
                  <LanguageSwitch />
                  <span className="max-w-[36ch] text-[0.75rem] leading-snug text-graphite-soft">
                    Renders the preview in that framework&rsquo;s own components and tokens.
                    Clinical colours never change.
                  </span>
                </div>

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
                          <code className="font-mono text-[0.6875rem] text-ink">oxygen init</code>{" "}
                          once to say where your{" "}
                          <code className="font-mono text-[0.6875rem] text-ink">@/</code> alias
                          points. The source is copied into your repository, along with anything it
                          depends on.
                        </>
                      }
                    />
                  )}
                </div>
              </div>
            </section>

            {/*

              Tabs, not anchors. One section shows at a time and nothing

              scrolls when a tab is chosen; every section still renders on the

              server and stays in the document, hidden. See `SectionTabs`.

            */}

            <SectionTabs sections={railSections}>
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
                    WIDE_PREVIEW.has(component.name) ? "max-w-[92rem]" : "max-w-6xl"
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
                      /*
                  The gallery replaces the shared preview here, so it has to
                  mount the host itself — otherwise the one page whose subject
                  is a primitive would be the one page the language switch did
                  nothing on. No chrome band: forty switches already answer
                  every question a row of buttons would.
                */
                      <HostStage className="flex w-full min-w-0 flex-col">
                        <SwitchGallery />
                      </HostStage>
                    ) : (
                      <ComponentPreview name={component.name} states={component.states} />
                    )}
                  </div>

                  {/*
              The declared states are rendered by the preview itself, which is
              the only place that knows whether it had scenarios to show. Two
              lists of the same eighteen strings, one under the other, was the
              shape this page had before.
            */}
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
                      <SectionHeading
                        eyebrow="Gallery"
                        title="Every variant, mode and state — live."
                      />
                      <div className="mt-8">
                        <HostStage className="flex w-full min-w-0 flex-col">
                          <TabsGallery />
                        </HostStage>
                      </div>
                    </div>
                  </div>
                )}

                {/*
            The date control earns a gallery for Tabs' reason, doubled. Its
            claim is that fourteen presentations share one value space, one
            keyboard model and one accessibility contract — and a claim about
            sameness cannot be made with one example. Several of the variants
            are also compositions rather than controls: a scheduler and a
            series review are wider than the prose column, and squeezed into
            it they render permanently scrolled, which demonstrates overflow
            rather than scheduling.
          */}
                {component.name === "date-picker" && (
                  <div className="mx-auto max-w-[92rem] px-5 pb-[clamp(2.75rem,5vw,4.5rem)] sm:px-8">
                    <div data-reveal>
                      {/* Derived from the component being rendered, not typed — this
                    heading sits directly above the gallery that would falsify
                    it. */}
                      <SectionHeading
                        eyebrow="Gallery"
                        title={`${component.variants?.length ?? 0} variants, one contract — live.`}
                      />
                      <div className="mt-8">
                        <HostStage className="flex w-full min-w-0 flex-col">
                          <DatePickerGallery />
                        </HostStage>
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
                        <HostStage className="flex w-full min-w-0 flex-col">
                          <CopilotGallery />
                        </HostStage>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Why it exists ------------------------------------------------ */}
              {/*
          The rationale, under the thing it is describing.

          It keeps every word it had at the top of the page. What it gains is a
          lead line: the first sentence is lifted to display size because it is
          the sentence a reader quotes, and the remainder reads as argument
          rather than as a wall. `leadOf` splits on the first sentence boundary
          and falls back to the whole string when there is no clean one.
        */}
              <section id="why" className="scroll-mt-24 border-b border-rule">
                <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
                  <SectionHeading
                    eyebrow="Why it exists"
                    title={leadOf(component.rationale).lead}
                  />
                  {leadOf(component.rationale).rest ? (
                    <p
                      className="mt-6 max-w-3xl text-pretty text-[1.0625rem] leading-relaxed text-graphite"
                      data-reveal
                    >
                      {leadOf(component.rationale).rest}
                    </p>
                  ) : null}

                  {/* Which elements the component reads, and what it does with them.
                Visible text rather than a `title` tooltip: this is the detail an
                integrator checks their own feed against, and a tooltip is
                unreachable by keyboard, invisible on touch, and unsearchable. */}
                  {component.fhir.some((resource) => resource.note) ? (
                    <dl
                      className="mt-8 max-w-3xl space-y-2 border-l-2 border-rule pl-4 text-sm"
                      data-reveal
                    >
                      {component.fhir
                        .filter((resource) => resource.note)
                        .map((resource) => (
                          <div key={resource.url} className="flex flex-wrap gap-x-2">
                            <dt className="numeric font-medium text-ink">{resource.name}</dt>
                            <dd className="flex-1 text-graphite">{resource.note}</dd>
                          </div>
                        ))}
                    </dl>
                  ) : null}
                </div>
              </section>

              {/* Playground --------------------------------------------------- */}
              {playable && (
                <section id="playground" className="scroll-mt-24 border-b border-rule">
                  <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                      <SectionHeading
                        eyebrow="Playground"
                        title="Change a prop, watch it change."
                      />
                      <p className="numeric shrink-0 text-xs text-graphite-soft">
                        {controls.length} PROPS / LIVE
                      </p>
                    </div>
                    {/* The knobs come from the same metadata the props table does,
                  and the generator checks every option against the prop's real
                  type — so a control here cannot offer a value the component
                  would reject. */}
                    <div className="mt-8" data-reveal>
                      <HostStage className="flex w-full min-w-0 flex-col">
                        <Playground name={component.name} controls={controls} />
                      </HostStage>
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
                      Every variant is the same accessibility contract and the same keyboard model.
                      Pick by what the surface needs, not by what the code would be easier to write.
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

                    {/*
                The sample and its dependencies share the top row; the API takes
                the full width underneath.

                Beside a 1.1fr column the description track measured 271px —
                about 43 characters — so every sentence wrapped to three or four
                lines and an 18-prop component ran to 1753px next to half a page
                of nothing. The height was the measure, not the number of props.
                The sample was clipping its own import path in the same column
                (580px of code in 501px of box), which full width also fixes.
              */}
                    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] lg:items-start">
                      <pre
                        data-reveal
                        tabIndex={0}
                        className="scroll-thin-dark overflow-x-auto rounded-2xl border border-panel-rule bg-panel p-5 font-mono text-[0.75rem] leading-relaxed text-panel-fg/90"
                      >
                        <code>{component.usage}</code>
                      </pre>

                      <div data-reveal style={{ "--reveal-delay": "80ms" } as React.CSSProperties}>
                        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-graphite">
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
                    </div>

                    <div
                      data-reveal
                      style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
                      className="mt-10 space-y-8"
                    >
                      {/*
                    One table per exported component, not one for the first.

                    The catalog has always carried `exports`; the page rendered
                    only `props`, which is the primary export's. For most
                    components those are the same list. For the ones whose
                    surface is several components — Switch and its field and
                    list, the note and its gate, the date control and its
                    fourteen parts — everything after the first was extracted,
                    written to the catalog, and never shown to anybody. The date
                    control made it impossible to ignore: its dispatch is a
                    union, so the intersection the checker can see is three
                    props and the whole API was missing from its own page.
                  */}
                      {apiTables.map(({ name, props: exportProps }, tableIndex) => (
                        <div key={name}>
                          {apiTables.length > 1 && (
                            <h3 className="mb-3 flex flex-wrap items-baseline gap-x-2 font-display text-sm font-semibold tracking-tight">
                              <code className="numeric text-oxygen-deep">{name}</code>
                              <span className="text-xs font-normal text-graphite-soft">
                                {exportProps.length} {exportProps.length === 1 ? "prop" : "props"}
                                {tableIndex === 0 && component.exports.length > 1
                                  ? " · the front door"
                                  : ""}
                              </span>
                            </h3>
                          )}
                          <PropsTable props={exportProps} label={name} />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Examples ----------------------------------------------------- */}
              {examples.length > 0 && (
                <section
                  id="examples"
                  className="scroll-mt-24 border-b border-rule bg-paper-sunk/40"
                >
                  <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
                    <SectionHeading eyebrow="Examples" title="The cases worth copying." />
                    {/*
                Under the heading rather than beside it.

                These are identifiers, not a caption: seven of them set in mono
                are wider than the heading they were sharing a row with, and
                `shrink-0` on a flex row meant the heading gave up its width
                instead — "The cases worth copying." broke to one word a line.
                They also keep their camel case now, because uppercasing
                `observationPotassiumCritical` is what made it unreadable.
              */}
                    {(component.fixtures ?? []).length > 0 && (
                      <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-graphite-soft">
                        <span className="numeric uppercase tracking-wide">Data</span>
                        {(component.fixtures ?? []).map((fixture) => (
                          <code key={fixture} className="font-mono tracking-normal">
                            {fixture}
                          </code>
                        ))}
                      </p>
                    )}

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
                            {/* No `uppercase` here. These are identifiers a reader
                          types, and the camel case is the only thing making
                          `observationPotassiumCritical` legible — uppercasing it
                          produces OBSERVATIONPOTASSIUMCRITICAL, which is a wall. */}
                            {example.fixture && (
                              <code className="font-mono text-[0.6875rem] tracking-normal text-graphite-soft">
                                {example.fixture}
                              </code>
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

              {/* Clinical ----------------------------------------------------- */}
              {hasClinical && domain && (
                <section id="clinical" className="scroll-mt-24 border-b border-rule">
                  <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
                    <SectionHeading eyebrow="Clinical" title="Where it sits in the record." />

                    {domain.clinicalContext && (
                      <p
                        className="mt-3 max-w-3xl text-sm leading-relaxed text-graphite"
                        data-reveal
                      >
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

              {/* Conformance -------------------------------------------------- */}
              {a11yChecks.length > 0 && (
                <section
                  id="conformance"
                  className="scroll-mt-24 border-b border-rule bg-paper-sunk/40"
                >
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
                            <tr
                              key={`${check.wcag}-${check.name}`}
                              className="border-b border-rule/60"
                            >
                              <td className="py-3 pr-4 align-top">
                                <span className="numeric text-xs text-graphite-soft">
                                  {check.wcag}
                                </span>
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
                    <SectionHeading
                      eyebrow="Source"
                      title="Exactly what lands in your repository."
                    />
                    <p className="mt-3 max-w-2xl text-sm text-graphite" data-reveal>
                      Read directly from the published registry, so this can never drift from what
                      the CLI installs.
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
                          <p className="mt-2 text-sm leading-relaxed text-graphite">
                            {item!.summary}
                          </p>
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
            </SectionTabs>
          </div>
        </div>
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
              className="underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-oxygen"
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
    <th
      scope="col"
      className="px-4 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-graphite-soft"
    >
      {children}
    </th>
  );
}
