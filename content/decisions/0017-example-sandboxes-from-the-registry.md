# 0017 — Example sandboxes are generated from the registry

**Status:** accepted · 20 November 2026

## Context

Every documented example existed three times: as a `code` string in the
component's `*.meta.ts` (the Code tab), as a hand-written preview in
`apps/docs/src/components/site/*-demos.tsx` (the Preview tab), and as a Vite
app in the separate `zoblocks-examples` repository (the hosted demo). Nothing
kept the three in step.

The "Open in StackBlitz" button went through two designs, and each had a cost.

**GitHub import** (`stackblitz.com/github/<repo>/tree/main/demos/<name>`).
StackBlitz downloads the repository at that commit, keeps the folder, and
installs it in a fresh WebContainer for every reader. It opened one app per
component with every example in it, rather than the example the reader was
looking at, and ran a vendored copy of the component source.

**Runtime transform** (PR #237). The browser rewrote the example's `code`
string into a module with a regex, pointed its imports at the published npm
packages pinned by hand in `VERSIONS`, and opened it in StackBlitz's
`create-react-app` environment. That was fast and specific, but it ran npm
`0.2.x` rather than the registry source the page documents. Only 40 of 216
examples could run, and that list was kept by hand.

## Decision

1. **An example is a file**, `examples/<component>/<id>.tsx`, in a private
   workspace package outside `registry/`. The loader reads it as the example's
   code. A file and a `code` string for the same example, or a file that no
   example names, fail `pnpm gen`.
2. **The Preview tab renders that file.** Hand-written previews remain only for
   examples that are still inline strings.
3. **`pnpm gen` writes one sandbox per example** to
   `apps/docs/public/sandbox/<component>/<id>.json`. It contains the example,
   the helpers it imports, a Vite shell, and the _names_ of the registry items
   it needs. The browser fetches those items from `/r/` (the documents
   `zoblocks add` installs from) and lays them out under `src/`. A sandbox
   runs the published source by construction, and the repository carries no
   second copy of each component per example. Like `public/r`, the output is
   gitignored and rebuilt by the deploy.
4. **Every example runs or says why not.** `notRunnable` in metadata gives the
   reason. An example still inline is reported as such. `SANDBOXES` and
   `NOT_RUNNABLE` are generated, not kept by hand.
5. **CI proves each sandbox compiles.** `pnpm sandboxes:check` assembles every
   project the way the browser does, installs the union of their dependencies
   from npm once, typechecks each project, and builds a rotating few with Vite.
   Full tier only.

### Why examples live outside `registry/`

Several examples deliberately use antd or the host bridges to show a component
inside a real form. `.dependency-cruiser.cjs` keeps those frameworks out of the
registry ("it belongs to composition — apps and demos"), and the registry's
coverage thresholds apply to every `.tsx` file under it. Examples are demos, so
they get their own package with their own dependencies.

## Runtime

Measured on the Switch examples in Chrome on an M-series Mac, from the click to
the example rendering in StackBlitz's preview:

| Shell                                                    | Cold open |
| -------------------------------------------------------- | --------- |
| Vite 8, Tailwind plugin, TypeScript in `devDependencies` | ~40 s     |
| Vite 7, Tailwind plugin, no TypeScript (chosen)          | ~35 s     |
| Vite 7, Tailwind browser build from a CDN, no TypeScript | ~35 s     |

About half of that time is WebContainer boot and `npm install`. StackBlitz also
fetches a WASI binding on every cold start whichever Vite version is used, so
none of our choices remove it. The in-browser Tailwind build saved too little
to justify a project that differs from the one a reader builds.

`create-react-app` (EngineBlock) starts in a few seconds, but it runs neither
Vite nor Tailwind's plugin and does not resolve `@/` paths. Using it would mean
rewriting example code on the way out, which is what this decision removes.

## Consequences

- Readers get the exact example, running the registry source, in about the
  same time the GitHub import took. Every example can have a button.
- A cold open takes about half a minute, not seconds. If that proves to matter,
  the next lever is StackBlitz's own project caching (`openProjectId` against
  pre-created projects), not changing the code being run.
- `zoblocks-examples` stops being a source of anything and can be archived.
