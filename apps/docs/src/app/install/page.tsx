import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { InstallCommand, RevealRoot } from "@/components/site/interactions";

/**
 * The integration guide, written only after the builds were run.
 *
 * The content audit listed this page as missing and I declined to write it,
 * because the stack had only ever been exercised against the Next.js App
 * Router and publishing untested Vite guidance would have broken the standard
 * the audit itself sets. So the matrix was built first: a scratch Vite 6 +
 * React 19 + Tailwind v4 project, four components installed through the same
 * `target` resolution the CLI uses, then `vite build` and `tsc --noEmit`.
 *
 * That probe found a real defect on its first run — `lib/result-value.ts`
 * imported a sibling relatively, and the registry renames files as it installs
 * them, so `zoblocks add result-value` produced a tree that did not compile. The
 * fix and the guard that prevents a recurrence both came out of writing this
 * page, which is the argument for building the matrix before the prose.
 *
 * Every claim below corresponds to something that was run. Remix and Astro are
 * named as untested rather than omitted, because a developer who cannot find
 * their framework assumes it does not work.
 */
export const metadata: Metadata = {
  title: "Install — Next.js, Vite and Tailwind setup",
  description:
    "Install ZoBlocks components into a React project. Verified setup for Next.js App Router and Vite, with Tailwind v4 config and client boundary rules.",
  alternates: { canonical: "/install" },
};

const REQUIREMENTS = [
  { name: "React", version: "19", note: "18 is partly covered." },
  { name: "TypeScript", version: "5.7+", note: "Sources ship as .tsx and .ts." },
  { name: "Tailwind CSS", version: "4", note: "CSS-first config. No tailwind.config.js." },
  { name: "npm dependencies", version: "2", note: "clsx and tailwind-merge. Nothing else." },
];

const MATRIX: ReadonlyArray<{
  stack: string;
  status: "verified" | "partial" | "untested";
  detail: string;
}> = [
  {
    stack: "Next.js 16, App Router",
    status: "verified",
    detail:
      "This documentation site is built on it, including every live demo on every component page.",
  },
  {
    stack: "Vite 6 + @tailwindcss/vite",
    status: "verified",
    /*
     * A record of what was run, not a claim about what exists.
     *
     * Deriving this from the catalogue would make it lie the next time a
     * component ships: the probe installed four, and it will always have
     * installed four. This is the case the count rule cannot see from the
     * string, so it is stated here.
     */
    detail:
      // eslint-disable-next-line @zoblocks/no-hardcoded-count -- historical record; see above
      "Four components installed from the registry, then vite build and tsc --noEmit, both clean. 40 modules, no polyfills, no shims.",
  },
  {
    stack: "Remix / React Router 7",
    status: "untested",
    detail:
      "Nothing about the components is Next-specific — no framework imports, no Node built-ins anywhere in the registry — so it is expected to work. We have not run it, so it is listed as untested rather than supported.",
  },
  {
    stack: "React 18",
    status: "partial",
    detail:
      "The loaders and tokens build and typecheck against React 18 in a dedicated smoke package. The registry components are authored against React 19 and some use patterns that may not have 18 equivalents; nobody has checked those.",
  },
];

export default function InstallPage() {
  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
              Install
            </p>
            <h1 className="display-lg mt-4 max-w-3xl text-balance" data-reveal>
              Two commands, one alias, one stylesheet.
            </h1>
            <h2
              className="mt-5 max-w-2xl text-lg font-medium tracking-tight text-graphite"
              data-reveal
            >
              Setting up ZoBlocks in a Next.js or Vite project with Tailwind v4.
            </h2>
            <div className="mt-8 max-w-2xl" data-reveal>
              <InstallCommand command="npx @zoblocks/cli init" />
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-graphite" data-reveal>
              <code className="font-mono text-[0.8125rem]">init</code> writes{" "}
              <code className="font-mono text-[0.8125rem]">zoblocks.json</code>, which records where
              your <code className="font-mono text-[0.8125rem]">@/</code> alias points. Every later{" "}
              <code className="font-mono text-[0.8125rem]">add</code> copies source relative to it.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------ requirements */}
        <section className="border-b border-rule bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              What it needs.
            </h2>
            <div
              className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4"
              data-reveal
            >
              {REQUIREMENTS.map((r) => (
                <div key={r.name} className="bg-paper p-6">
                  <p className="numeric text-2xl font-semibold tracking-tight text-ink">
                    {r.version}
                  </p>
                  <p className="mt-1.5 text-sm text-ink">{r.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-graphite-soft">{r.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-graphite" data-reveal>
              No component in the registry imports a Node built-in, so nothing here requires a
              polyfill or a server runtime to bundle.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ setup */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              Three things to configure.
            </h2>

            <div className="mt-9 space-y-8" data-reveal>
              <Step
                n="01"
                title="The path alias"
                body="Components import each other and their shared library by the paths the CLI writes. Both files below are what a working build uses."
                code={`// tsconfig.json
{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }

// vite.config.ts — Vite needs the alias too; Next reads tsconfig directly
resolve: { alias: { "@": path.resolve(__dirname, "src") } }`}
              />

              <Step
                n="02"
                title="Tailwind sources and tokens"
                body="Tailwind v4 finds classes by scanning files it knows about. Components installed outside your existing content roots are invisible to it until you say where they went — which shows up as a component that renders with no styling at all."
                code={`/* your global stylesheet */
@import "tailwindcss";
@source "./components/zoblocks";      /* or wherever zoblocks.json put them */

@import "./styles/zoblocks-tokens.css";      /* required — the design tokens */
@import "./styles/zoblocks-result-value.css"; /* one per component that ships CSS */`}
              />

              <Step
                n="03"
                title="The client boundary"
                body="About half the registry declares its own “use client” boundary, so components work unchanged in a React Server Component tree. The ones that do not are pure presentation and render on the server."
                code={`// app/page.tsx — a Server Component
import { ResultValue } from "@/components/zoblocks/result-value";

// Works. ResultValue declares its own boundary where it needs one.
// You do not need to mark your page "use client" to use these.`}
              />
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- matrix */}
        <section className="border-b border-rule bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              What we have actually run.
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-graphite" data-reveal>
              &ldquo;Untested&rdquo; below means nobody has run it, not that it is known to fail;
              &ldquo;partial&rdquo; means some of the surface is covered and the rest is not. We
              would rather name the gap than let you find it.
            </p>

            <div
              className="mt-8 space-y-px overflow-hidden rounded-2xl border border-rule bg-rule"
              data-reveal
            >
              {MATRIX.map((row) => (
                <div key={row.stack} className="bg-paper p-6">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="text-base font-semibold tracking-tight">{row.stack}</h3>
                    <span
                      className={`numeric rounded px-2 py-0.5 text-[0.625rem] uppercase tracking-wider ${
                        row.status === "verified"
                          ? "bg-brand/10 text-brand-deep"
                          : row.status === "partial"
                            ? "border border-rule-strong text-ink"
                            : "bg-rule/60 text-graphite"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-graphite">
                    {row.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- troubleshooting */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              If something is wrong, it is probably one of these.
            </h2>
            <dl className="mt-8 max-w-3xl" data-reveal>
              {[
                {
                  q: "The component renders with no styling.",
                  a: "Tailwind has not been told where the files are. Add @source pointing at your components directory. This is the most common setup failure and it looks like a broken component rather than a missing config line.",
                },
                {
                  q: "Severity colours are missing, but layout is fine.",
                  a: "The component's own stylesheet is not imported. Clinical severity is carried by CSS custom properties in styles/zoblocks-*.css, not by Tailwind utilities, so it fails independently of the rest.",
                },
                {
                  q: "Cannot find module '@/lib/zoblocks-…'",
                  a: "The @ alias is missing or points somewhere else. Vite needs it in vite.config.ts as well as tsconfig.json — TypeScript resolving it is not enough for the bundler.",
                },
                {
                  q: "A hook error inside a Server Component.",
                  a: 'You are importing a non-component export across the boundary. A value exported from a "use client" module becomes an opaque reference in a Server Component; pass it as a prop from a client component instead.',
                },
                {
                  q: "Styles disappear when a value is dynamic.",
                  a: "Never build a Tailwind class from a variable. Tailwind resolves classes by scanning source text, so a template literal produces no CSS and severity styling silently vanishes. Map the value to whole class strings.",
                },
              ].map((item) => (
                <div key={item.q} className="border-t border-rule py-5 last:border-b">
                  <dt className="text-sm font-medium text-ink">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-graphite">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-4" data-reveal>
              <Link
                href="/components"
                className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-cta-hover"
              >
                Pick a component
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}

function Step({ n, title, body, code }: { n: string; title: string; body: string; code: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
      <div>
        <p className="numeric text-xs text-brand-deep">{n}</p>
        <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-graphite">{body}</p>
      </div>
      {/* The panel treatment, because this is code rather than a component
          demo — `instrument-demo` follows the page theme and would render a
          code block on paper, which is not what a reader expects here. */}
      {/* `tabIndex={0}`: this block scrolls now that `.instrument` no longer
          clips it, and a region that scrolls has to be reachable by keyboard
          (axe `scrollable-region-focusable`). The component page's usage
          block does the same. */}
      <pre
        tabIndex={0}
        className="scroll-thin-dark instrument overflow-x-auto rounded-2xl p-5 font-mono text-[0.75rem] leading-relaxed text-panel-fg/90"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
