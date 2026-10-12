import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  ALIAS_SETUP,
  FIRST_COMPONENT_USAGE,
  GLOBAL_STYLESHEET,
  SERVER_COMPONENTS,
  WEB_COMPONENTS,
  distributionState,
} from "@zoblocks/component-meta";
import { CATALOG } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { CodeBlock } from "@/components/site/code-block";
import { DocTabs } from "@/components/site/doc-tabs";
import { PmCommand } from "@/components/site/pm-command";
import { AntdSetup, MuiSetup, ZoBlocksStyle } from "./ui-library-setup";
import {
  C,
  DocSection,
  DocStep,
  DocSteps,
  DocsHero,
  DocsShell,
} from "@/components/site/docs-shell";

/**
 * The documentation: one page, from an empty folder to a styled component.
 *
 * Written to be short. Each instruction appears once — a new project is
 * "create the app, then follow the existing-app steps", not a second copy of
 * them — and every command is described once and rendered for the reader's
 * package manager (`package-managers.ts` in `@zoblocks/component-meta`).
 *
 * Every path on this page was run before it was written, on 28 Sep 2026: a
 * fresh Next.js 16 and Vite 8 app, each with npm, pnpm, Yarn 1 and Bun; `init`
 * and `add --yes` from the published CLI; the stylesheet; the render; then the
 * production build. The Ant Design and Material UI setups follow each
 * library's own Next.js guide for both routers and were built and checked in
 * the server-rendered HTML — see `./ui-library-setup.tsx` for what that
 * found. The other frameworks' snippets are the ones `apps/smoke` builds and
 * drives in CI.
 *
 * One known defect is stated rather than hidden: a few registry components
 * import React without using it, which Vite's strict template rejects at
 * `tsc`. It is in Troubleshooting until the registry fix ships.
 */
export const metadata: Metadata = {
  title: "Docs — install and use ZoBlocks",
  description:
    "Install ZoBlocks in an existing React app or a new Next.js or Vite project, style it as ZoBlocks, Ant Design or Material UI, and use the loaders in Vue, Angular, Svelte or HTML.",
  alternates: { canonical: "/docs" },
};

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "install", label: "Add to a React app" },
  { id: "new-project", label: "Start a new project" },
  { id: "styles", label: "Choose a style" },
  { id: "other-frameworks", label: "Vue, Angular, Svelte, HTML" },
  { id: "npm-components", label: "Components from npm" },
  { id: "cli", label: "CLI commands" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

const link = "text-ink underline underline-offset-2";

/** The old install page's "three things to configure", pointed at the steps that do them. */
const SETUP = [
  {
    title: "The path alias",
    body: "Components import each other as @/…. TypeScript and your bundler both need to resolve it.",
    step: "Step 1",
    href: "#step-1",
  },
  {
    title: "Tailwind sources and tokens",
    body: "@source so Tailwind sees the components, and the tokens stylesheet they are coloured with.",
    step: "Step 4",
    href: "#step-4",
  },
  {
    title: "The client boundary",
    body: 'Next.js App Router only. Components that need the browser declare their own "use client"; the rest render on the server. Your pages can stay Server Components.',
    step: "Server Components",
    href: "#server-components",
  },
];

// The Server Components example — see `SERVER_COMPONENTS` in
// @zoblocks/component-meta for what was built to establish it.
const SERVER_PAGE = SERVER_COMPONENTS.page.code;
const CLIENT_ROW = SERVER_COMPONENTS.clientWrapper.code;

const REQUIREMENTS = [
  { name: "Node.js", version: "20.11+", note: "What the CLI runs on." },
  { name: "React", version: "19", note: "18 is partly covered." },
  { name: "TypeScript", version: "5.7+", note: "Sources ship as .tsx and .ts." },
  { name: "Tailwind CSS", version: "4", note: "CSS-first config. No tailwind.config.js." },
  { name: "npm packages", version: "2", note: "clsx and tailwind-merge. Nothing else." },
];

/* ------------------------------------------------------------------ */
/* Snippets                                                           */
/* ------------------------------------------------------------------ */

/*
 * Every snippet on this page is read from `@zoblocks/component-meta`
 * (integration.ts), the same objects `pnpm gen` writes into the agent manifest
 * (ADR 0017), so this page and a coding agent cannot be told different things.
 */
const NEXT_TSCONFIG = ALIAS_SETUP.next[0]!.code;
const VITE_CONFIG = ALIAS_SETUP.vite[0]!.code;
const VITE_TSCONFIG = ALIAS_SETUP.vite[1]!.code;

const NEXT_CSS = GLOBAL_STYLESHEET["next-app"].code;
const PAGES_CSS = GLOBAL_STYLESHEET["next-pages"].code;
const VITE_CSS = GLOBAL_STYLESHEET.vite.code;

const USAGE = FIRST_COMPONENT_USAGE;

const VUE = WEB_COMPONENTS.frameworks.vue.code;
const ANGULAR = WEB_COMPONENTS.frameworks.angular.code;
const SVELTE = WEB_COMPONENTS.frameworks.svelte.code;
const HTML = WEB_COMPONENTS.frameworks.html.code;

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

/** Derived from the catalogue, so a component that moves to npm appears here by itself. */
const PACKAGES = CATALOG.filter(
  (component) =>
    component.distribution === "package" &&
    component.packageName &&
    distributionState(component.name) !== "announced",
);

/** Whether a package cannot run without Ant Design, from its own metadata. */
function needsAntd(component: (typeof CATALOG)[number]): boolean {
  return Object.entries(component.frameworks ?? {}).some(
    ([framework, relation]) => framework === "antd" && relation.policy === "wrapping",
  );
}

const CLI = [
  { command: "init", body: "Create zoblocks.json. Once per project." },
  { command: "add <name…>", body: "Copy components, and what they depend on, into your project." },
  { command: "list", body: "List every component you can add." },
  {
    command: "--yes",
    body: "Let add install the npm packages it needs. Without it, it prints the command.",
  },
  { command: "--dry-run", body: "Show what add would write, and write nothing." },
  {
    command: "--overwrite",
    body: "Replace files that already exist — how you update a component.",
  },
  { command: "--cwd <dir>", body: "Run in another folder." },
];

const TROUBLESHOOTING: ReadonlyArray<{ q: string; a: React.ReactNode }> = [
  {
    q: "The component has no styling.",
    a: (
      <>
        Check the <C>@source</C> line and the <C>zoblocks-tokens.css</C> import from step 4.
      </>
    ),
  },
  {
    q: "Layout is fine but the status colours are missing.",
    a: (
      <>
        Import the component&rsquo;s own stylesheet. <C>add</C> lists every{" "}
        <C>styles/zoblocks-*.css</C> it writes; each needs an <C>@import</C>.
      </>
    ),
  },
  {
    q: "Cannot find module '@/…'",
    a: (
      <>
        The <C>@</C> alias is missing — step 1. On Vite it must be in <C>vite.config.ts</C> as well
        as <C>tsconfig</C>.
      </>
    ),
  },
  {
    q: "'React' is declared but its value is never read.",
    a: (
      <>
        A known issue in a few components, reported by Vite&rsquo;s strict <C>tsc</C>. Delete the
        line <C>import * as React from &quot;react&quot;;</C> in the file it names. The dev server
        is unaffected.
      </>
    ),
  },
  {
    q: "Functions cannot be passed directly to Client Components.",
    a: (
      <>
        On the App Router, <C>providers.tsx</C> (Ant Design) or <C>theme.ts</C> (Material UI) is
        missing <C>&quot;use client&quot;</C> on its first line.
      </>
    ),
  },
  {
    q: "Event handlers cannot be passed to Client Component props.",
    a: (
      <>
        A Server Component passed a function, such as <C>onOpenReport</C>. Move that usage into a
        file that starts with <C>&quot;use client&quot;</C> — see{" "}
        <a href="#server-components" className={link}>
          Server Components
        </a>
        .
      </>
    ),
  },
  {
    q: "useState is not a function (or another hook error) in a Server Component.",
    a: (
      <>
        That component does not declare <C>&quot;use client&quot;</C> yet. Render it from a file
        that starts with <C>&quot;use client&quot;</C>, the same way.
      </>
    ),
  },
  {
    q: "Ant Design or MUI flashes unstyled when the page loads.",
    a: (
      <>
        The server is not sending the library&rsquo;s styles. Use <C>AntdRegistry</C> or{" "}
        <C>AppRouterCacheProvider</C> on the App Router, and the <C>_document.tsx</C> setup on the
        Pages Router — see{" "}
        <a href="#styles" className={link}>
          Choose a style
        </a>
        .
      </>
    ),
  },
  {
    q: "Pages Router: ZoBlocks uses the default antd or MUI colours, not mine.",
    a: (
      <>
        Add the <C>transpilePackages</C> line to <C>next.config.ts</C> from the Pages Router tab of{" "}
        <a href="#styles" className={link}>
          Choose a style
        </a>
        .
      </>
    ),
  },
  {
    q: "No zoblocks.json, or zoblocks.json already exists.",
    a: (
      <>
        Run <C>init</C> once, in the folder with your <C>package.json</C>. To start over, add{" "}
        <C>--force</C>.
      </>
    ),
  },
  {
    q: "npm warns EBADENGINE, or the CLI will not start.",
    a: (
      <>
        Node.js is older than 20.11. Check with <C>node -v</C> and install the current LTS.
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function DocsPage() {
  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <DocsHero
          eyebrow="Docs"
          title="Install ZoBlocks and use your first component."
          lede="Add it to a React app in five steps, match Ant Design or Material UI, or use the loaders from Vue, Angular, Svelte and plain HTML."
        />

        <DocsShell current="/docs" toc={TOC}>
          {/* ------------------------------------------------ overview */}
          <DocSection id="overview" title="Overview">
            <ul className="max-w-2xl space-y-3 text-sm leading-relaxed text-graphite">
              <li>
                <span className="font-medium text-ink">React</span> gets every component. A
                command-line tool copies each one into your project as source you own.
              </li>
              <li>
                <span className="font-medium text-ink">Vue, Angular, Svelte and HTML</span> get the
                loaders and the switch, as web components from npm.
              </li>
              <li>
                <span className="font-medium text-ink">Three styles.</span> Components look like
                ZoBlocks by default, and take on your Ant Design or Material UI theme with one
                wrapper.
              </li>
            </ul>
            <h3 className="mt-8 text-base font-semibold tracking-tight">What it needs</h3>
            <div className="mt-3 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-5">
              {REQUIREMENTS.map((r) => (
                <div key={r.name} className="bg-paper p-4">
                  <p className="numeric text-lg font-semibold tracking-tight text-ink">
                    {r.version}
                  </p>
                  <p className="mt-1 text-sm text-ink">{r.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-graphite-soft">{r.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-graphite">
              No component imports a Node built-in, so nothing needs a polyfill or a server runtime.
              Pick your package manager on any command below; the whole page follows.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-graphite">
              Using an AI coding agent?{" "}
              <Link href="/docs/ai" className={link}>
                Connect it to ZoBlocks
              </Link>{" "}
              so it uses the real components instead of guessing.
            </p>
          </DocSection>

          {/* ------------------------------------------------- install */}
          <DocSection
            id="install"
            title="Add to a React app"
            intro={
              <p>
                For a Next.js or Vite app you already have. No app yet?{" "}
                <a href="#new-project" className={link}>
                  Create one first
                </a>
                , then come back.
              </p>
            }
          >
            <DocSteps>
              <DocStep n={1} id="step-1" title="Check the @ alias">
                <p>
                  Components import each other as <C>@/…</C>. Next.js apps — App Router or Pages
                  Router — usually have this already; Vite apps need it in three files.
                </p>
                <DocTabs
                  label="Framework"
                  tabs={[
                    {
                      id: "next",
                      label: "Next.js",
                      content: (
                        <CodeBlock title="tsconfig.json" language="json" code={NEXT_TSCONFIG} />
                      ),
                    },
                    {
                      id: "vite",
                      label: "Vite",
                      content: (
                        <div className="space-y-3">
                          <CodeBlock title="vite.config.ts" language="ts" code={VITE_CONFIG} />
                          <CodeBlock
                            title="tsconfig.app.json and tsconfig.json"
                            language="jsonc"
                            code={VITE_TSCONFIG}
                          />
                        </div>
                      ),
                    },
                  ]}
                />
              </DocStep>

              <DocStep
                n={2}
                id="step-2"
                title="Set up ZoBlocks"
                check={
                  <>
                    <C>Created zoblocks.json</C>
                  </>
                }
              >
                <p>
                  <C>init</C> writes <C>zoblocks.json</C>, which records where your <C>@/</C> alias
                  points (<C>src</C>, or <C>.</C> if there is no <C>src</C> folder). Every later{" "}
                  <C>add</C> copies source relative to it. Run it once per project.
                </p>
                <PmCommand commands={[{ dlx: "@zoblocks/cli init" }]} />
              </DocStep>

              <DocStep
                n={3}
                id="step-3"
                title="Add a component"
                check={
                  <>
                    <C>write</C> lines for the files under <C>src/components/zoblocks</C>,{" "}
                    <C>src/lib</C> and <C>src/styles</C>
                  </>
                }
              >
                <p>
                  <C>--yes</C> also installs the two small packages it needs.
                </p>
                <PmCommand commands={[{ dlx: "@zoblocks/cli add pulse-loader --yes" }]} />
              </DocStep>

              <DocStep n={4} id="step-4" title="Import the styles">
                <p>
                  Add these lines under <C>@import &quot;tailwindcss&quot;;</C> in your global
                  stylesheet. <C>zoblocks-tokens.css</C> is required — it holds the design tokens.
                  Then add one <C>@import</C> for each other <C>zoblocks-*.css</C> that <C>add</C>{" "}
                  wrote.
                </p>
                <p>
                  <C>@source</C> tells Tailwind to scan the component files. Tailwind only builds
                  classes it finds, so without it a component renders with no styling at all.
                </p>
                <DocTabs
                  label="Framework"
                  tabs={[
                    {
                      id: "app",
                      label: "Next.js App Router",
                      content: (
                        <CodeBlock title="src/app/globals.css" language="css" code={NEXT_CSS} />
                      ),
                    },
                    {
                      id: "pages",
                      label: "Next.js Pages Router",
                      content: (
                        <CodeBlock title="src/styles/globals.css" language="css" code={PAGES_CSS} />
                      ),
                    },
                    {
                      id: "vite",
                      label: "Vite",
                      content: <CodeBlock title="src/index.css" language="css" code={VITE_CSS} />,
                    },
                  ]}
                />
              </DocStep>

              <DocStep
                n={5}
                id="step-5"
                title="Use it"
                check="a slowly beating heart with “Loading your records” under it."
              >
                <CodeBlock title="Any page or component" language="tsx" code={USAGE} />
                <p>
                  On the Next.js App Router this can be a Server Component — see{" "}
                  <a href="#server-components" className={link}>
                    Server Components
                  </a>{" "}
                  below.
                </p>
                <PmCommand commands={[{ run: "dev" }]} />
              </DocStep>
            </DocSteps>
            <p className="text-sm leading-relaxed text-graphite">
              Every other component installs the same way. Its <C>add</C> command is at the top of
              its{" "}
              <Link href="/components" className={link}>
                component page
              </Link>
              .
            </p>

            <div id="server-components" className="mt-10 scroll-mt-24">
              <h3 className="text-base font-semibold tracking-tight">
                Server Components (Next.js App Router)
              </h3>
              <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-graphite">
                <p>
                  Components that need the browser declare their own <C>&quot;use client&quot;</C>{" "}
                  boundary, so they work unchanged inside a Server Component. The rest —{" "}
                  <C>ResultValue</C>, <C>ClinicalStatus</C>, <C>AllergyChip</C> and a few others —
                  are pure presentation and render on the server. Either way, your page does not
                  need <C>&quot;use client&quot;</C>.
                </p>
              </div>
              <CodeBlock
                className="mt-4"
                title="src/app/page.tsx — a Server Component"
                language="tsx"
                code={SERVER_PAGE}
              />
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-graphite">
                Passing a function — <C>onOpenReport</C>, <C>onChange</C>, any <C>on…</C> prop —
                needs a Client Component, because functions cannot cross from the server. Put that
                usage in its own file:
              </p>
              <CodeBlock
                className="mt-4"
                title="src/app/result-row.tsx"
                language="tsx"
                code={CLIENT_ROW}
              />
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-graphite">
                The Pages Router and Vite have no Server Components, so none of this applies there.
              </p>
            </div>
          </DocSection>

          {/* --------------------------------------------- new project */}
          <DocSection
            id="new-project"
            title="Start a new project"
            intro={<p>Create the app, then follow the five steps above.</p>}
          >
            <DocTabs
              label="Framework"
              tabs={[
                {
                  id: "next",
                  label: "Next.js",
                  content: (
                    <div className="space-y-3">
                      <PmCommand commands={[{ createNext: "my-app" }, { raw: "cd my-app" }]} />
                      <p className="text-sm leading-relaxed text-graphite">
                        This comes with TypeScript, Tailwind v4 and the <C>@</C> alias, so step 1 is
                        already done. It uses the App Router; for the Pages Router, change{" "}
                        <C>--app</C> to <C>--no-app</C>. Open <C>http://localhost:3000</C> in step
                        5.
                      </p>
                    </div>
                  ),
                },
                {
                  id: "vite",
                  label: "Vite",
                  content: (
                    <div className="space-y-3">
                      <PmCommand
                        commands={[
                          { createVite: "my-app" },
                          { raw: "cd my-app" },
                          { install: true },
                          { add: "tailwindcss @tailwindcss/vite" },
                        ]}
                      />
                      <p className="text-sm leading-relaxed text-graphite">
                        Then do step 1 for Vite. In step 4, replace everything in{" "}
                        <C>src/index.css</C>. Open <C>http://localhost:5173</C> in step 5.
                      </p>
                    </div>
                  ),
                },
              ]}
            />

            <h3 className="mt-10 text-base font-semibold tracking-tight">
              Two commands, one alias, one stylesheet
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-graphite">
              Beyond <C>init</C> and <C>add</C>, a new project needs three things configured. The
              steps above do all of them:
            </p>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {SETUP.map((item, i) => (
                <li key={item.title} className="rounded-2xl border border-rule bg-paper p-4">
                  <p className="numeric text-xs text-brand-deep">0{i + 1}</p>
                  <p className="mt-1.5 text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-graphite">{item.body}</p>
                  <a href={item.href} className={`mt-2 inline-block text-sm ${link}`}>
                    {item.step}
                  </a>
                </li>
              ))}
            </ol>
          </DocSection>

          {/* -------------------------------------------------- styles */}
          <DocSection
            id="styles"
            title="Choose a style"
            intro={
              <p>
                Pick the design your app already uses. Components never change — only the wrapper
                does.
              </p>
            }
          >
            <DocTabs
              label="Style"
              tabs={[
                {
                  id: "zoblocks",
                  label: "ZoBlocks",
                  content: <ZoBlocksStyle />,
                },
                {
                  id: "antd",
                  label: "Ant Design",
                  content: <AntdSetup />,
                },
                {
                  id: "mui",
                  label: "Material UI",
                  content: <MuiSetup />,
                },
              ]}
            />
          </DocSection>

          {/* ---------------------------------------- other frameworks */}
          <DocSection
            id="other-frameworks"
            title="Vue, Angular, Svelte and HTML"
            intro={
              <p>
                The loaders and the switch ship as web components, so they work anywhere without
                Tailwind or the CLI. Install them, import once, and use the tag.
              </p>
            }
          >
            <div className="space-y-4">
              <PmCommand commands={[{ add: WEB_COMPONENTS.packages }]} />
              <DocTabs
                label="Framework"
                tabs={[
                  { id: "vue", label: "Vue", content: <CodeBlock language="vue" code={VUE} /> },
                  {
                    id: "angular",
                    label: "Angular",
                    content: <CodeBlock language="ts" code={ANGULAR} />,
                  },
                  {
                    id: "svelte",
                    label: "Svelte",
                    content: <CodeBlock language="svelte" code={SVELTE} />,
                  },
                  { id: "html", label: "HTML", content: <CodeBlock language="html" code={HTML} /> },
                ]}
              />
              <p className="text-sm leading-relaxed text-graphite">
                The other loaders are <C>/rhythm</C>, <C>/breath</C>, <C>/helix</C> and{" "}
                <C>/infusion</C>. See each{" "}
                <Link href="/components/pulse-loader" className={link}>
                  loader&rsquo;s page
                </Link>{" "}
                for its attributes.
              </p>
            </div>
          </DocSection>

          {/* ------------------------------------------ npm components */}
          <DocSection
            id="npm-components"
            title="Components from npm"
            intro={
              <p>
                A few React components are npm packages instead of copied source. Install the
                package and import its stylesheet once — no <C>init</C> needed.
              </p>
            }
          >
            <div className="space-y-5">
              {PACKAGES.map((component) => (
                <div key={component.name}>
                  <p className="text-sm text-ink">
                    <Link href={`/components/${component.name}`} className="font-semibold">
                      {component.title}
                    </Link>
                    {needsAntd(component) ? (
                      <span className="text-graphite"> — needs Ant Design</span>
                    ) : null}
                  </p>
                  <PmCommand
                    className="mt-2"
                    commands={[
                      {
                        add: `${component.packageName}${needsAntd(component) ? " antd" : ""}`,
                      },
                    ]}
                  />
                  <CodeBlock
                    className="mt-2"
                    language="tsx"
                    code={`import "${component.packageName}/styles.css";`}
                  />
                </div>
              ))}
            </div>
          </DocSection>

          {/* ----------------------------------------------------- cli */}
          <DocSection
            id="cli"
            title="CLI commands"
            intro={
              <p>
                Run with <C>npx @zoblocks/cli</C> (or your package manager&rsquo;s equivalent, shown
                above).
              </p>
            }
          >
            <dl className="overflow-hidden rounded-2xl border border-rule">
              {CLI.map((c) => (
                <div
                  key={c.command}
                  className="grid gap-1 border-t border-rule bg-paper px-5 py-3.5 first:border-t-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
                >
                  <dt>
                    <C>{c.command}</C>
                  </dt>
                  <dd className="text-sm leading-relaxed text-graphite">{c.body}</dd>
                </div>
              ))}
            </dl>
          </DocSection>

          {/* ----------------------------------------- troubleshooting */}
          <DocSection id="troubleshooting" title="Troubleshooting">
            <dl className="max-w-3xl">
              {TROUBLESHOOTING.map((item) => (
                <div key={item.q} className="border-t border-rule py-4 last:border-b">
                  <dt className="text-sm font-medium text-ink">{item.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-graphite">{item.a}</dd>
                </div>
              ))}
            </dl>

            <Link
              href="/components"
              className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-cta-hover"
            >
              Browse components
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
              />
            </Link>
          </DocSection>
        </DocsShell>
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}
