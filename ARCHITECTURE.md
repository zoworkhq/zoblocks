# Oxygen UI — Platform Architecture

**Status:** proposed · 6 August 2026
**Horizon:** the structure below is intended to hold from 24 components to 500+
without a rewrite.

This document describes the target architecture and the path from what exists
today. It is written for whoever is making a change five years from now and
needs to know why the seams are where they are.

Individual decisions and their rejected alternatives live in
[`content/decisions/`](content/decisions/). This file is the map; those are the
arguments.

---

## 1. The scaling problem, stated concretely

The repository today ships 24 components through a shadcn registry and works
well at that size. Three properties of it do not survive multiplication.

### 1.1 Adding one component edits five shared files

| File                                      | Per-component work today              | Line count at 500 |
| ----------------------------------------- | ------------------------------------- | ----------------- |
| `registry.json`                           | hand-written entry                    | ~25,000           |
| `apps/docs/src/lib/catalog.ts`            | hand-written metadata, ~70 lines each | ~35,000           |
| `tsconfig.json` `paths`                   | one mapping per shared component      | —                 |
| `apps/docs/src/app/globals.css` `@source` | one entry per new directory           | —                 |
| `apps/docs/src/app/page.tsx`              | catalog listing                       | —                 |

Each of those files carries a comment telling the next author to remember to
update it. That is the correct response at 24 components and the wrong one at
500: five shared files edited by every contributor is a merge-conflict
generator, and "remember to" is not a mechanism. Two of them — `tsconfig.json`
and `globals.css` — fail _silently_, producing components that typecheck but
render unstyled.

**The architecture's central move is to invert this.** Metadata is authored once
per component, colocated with the component, and every shared artifact is
generated from it. Adding a component must touch exactly one directory.

### 1.2 Prop documentation is hand-transcribed

`catalog.ts` restates each component's props in prose. Nothing checks that the
restatement matches the implementation. At 24 components a reviewer catches
drift; at 500 the documentation becomes confidently wrong, which is worse than
absent — a prop table is read as a contract.

Props must be **extracted from the TypeScript types**, never written twice.

### 1.3 Copy-source distribution has no upgrade channel

This is the load-bearing one, and it is in direct tension with four of the
brief's requirements: versioning, backward compatibility, migration paths, and
deprecation strategy.

Once the shadcn CLI writes a file into a customer's repository, that file is
theirs. There is no channel to reach it. A bug in `ClinicalValue` that
misrenders a comparator ships to every customer who installed it and can never
be recalled — not by a patch release, not by a security advisory, not by a
codemod. For a general-purpose UI kit that is an acceptable trade. For clinical
display components it is a liability, and enterprise procurement will ask about
it directly.

Copy-source is a genuinely good product property and the README is right to sell
it. It just cannot be the _only_ channel.

**Decision: npm becomes the source of truth; the registry becomes a generated
projection of it.** Both ship from the same files. Customers choose whether they
want an upgrade path or ownership of the source, and they are told plainly that
choosing ownership means they have forked. See
[ADR 0002](content/decisions/0002-dual-channel-distribution.md).

### 1.4 What is absent entirely

No ESLint configuration exists (`packages/*` scripts read
`echo "lint: configured in Phase 1"`). One test file covers `@oxygenui-design/fhir`
helpers; no component has a test. There is no Storybook, no visual regression,
no per-component accessibility check (the axe run is page-level on the docs
site), no internationalisation, no bundle budget, and no public API surface
tracking.

These are all cheaper to establish at 24 components than at 100.

---

## 2. Layer model

Clean architecture applied to a component library means dependencies point in
one direction, and the direction is _away from the domain_. Clinical knowledge
sits at the bottom as data and types; rendering sits above it; composition above
that.

```
┌──────────────────────────────────────────────────────────────────┐
│  L4  Distribution   npm channels · shadcn registry · CDN · Figma │
├──────────────────────────────────────────────────────────────────┤
│  L3  Composition    blocks · patterns · app shells · templates   │
├──────────────────────────────────────────────────────────────────┤
│  L2  Components     primitives → clinical → domain packs         │
├──────────────────────────────────────────────────────────────────┤
│  L1  Behaviour      headless hooks · state machines · a11y prims │
├──────────────────────────────────────────────────────────────────┤
│  L0  Foundation     tokens · FHIR types · intl · utils           │
└──────────────────────────────────────────────────────────────────┘
```

**The rule:** a module may import from its own layer or any layer below it,
never above. A primitive never imports a domain pack. A clinical component never
imports a block.

This is enforced, not documented — `import/no-restricted-paths` in the ESLint
config plus a `dependency-cruiser` check in CI. An architecture rule that is only
written down is a suggestion.

Two consequences worth naming:

- **L1 exists so that L2 is skinnable.** A combobox's keyboard interaction,
  focus management, and ARIA wiring belong in a headless hook that has no
  opinion about markup. When a customer needs their own visual language, they
  rebuild L2 and keep L1 — which is where the accessibility correctness lives,
  and the part they should not be rewriting.
- **L0 holds no React.** `@oxygenui-design/fhir`, `@oxygenui-design/tokens`, and
  `@oxygenui-design/intl` are consumable by a Vue app, a server, or a test harness.
  This is what keeps a future non-React target from being a rewrite.

---

## 3. Package topology

### 3.1 Why not one package per component

Radix-style per-component packages give precise versioning and minimal installs.
They also mean 500 `package.json` files, 500 changelogs, and — the disqualifier
— a shared-internals problem. `StatusBadge` is imported by most of the catalog.
Under per-component packaging, either every package inlines its own copy or 400
packages take a dependency on `@oxygenui-design/status-badge`, and every consumer
resolves version skew across them. Radix itself consolidated for this reason.

### 3.2 Why not one package

A single `@oxygenui-design/react` gives one version for everything: a patch to a
scheduling component bumps the version of the patient banner, every release note
is noise for most consumers, and there is no seam to put the free/Pro boundary
on.

### 3.3 Domain-scoped packages with subpath exports

```
@oxygenui-design/tokens        L0   design tokens — generated, multi-brand
@oxygenui-design/fhir          L0   FHIR R4 types + pure helpers        (exists)
@oxygenui-design/intl          L0   locale, units, dates, message catalog
@oxygenui-design/utils         L0   cn, id generation, invariant

@oxygenui-design/primitives    L1   headless behaviour hooks, unstyled
@oxygenui-design/system        L1   variant engine, polymorphism, slots, density ctx

@oxygenui-design/react         L2   free core components
@oxygenui-design/icons         L2   icon set — generated from SVG source

@oxygenui-design/pro-charts    L2   commercial: clinical charting, trends, flowsheets
@oxygenui-design/pro-forms     L2   commercial: FHIR Questionnaire renderer
@oxygenui-design/pro-scheduling L2  commercial: availability, booking, calendars
@oxygenui-design/blocks        L3   composed screens and templates
@oxygenui-design/pro-blocks    L3   commercial: full EHR-shaped screens

@oxygenui-design/codemod       —    migration codemods
@oxygenui-design/cli           —    scaffolding, registry install, license auth
```

Roughly 15 packages at maturity, not 500 and not 1. Each is a coherent unit that
a customer buys, upgrades, and reads release notes for.

**Tree-shaking does not depend on package granularity.** Every package is
ESM-only, `sideEffects: false` (except CSS), and exposes both a root barrel and
per-component subpaths:

```jsonc
"exports": {
  ".":            { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
  "./*":          { "types": "./dist/*/index.d.ts", "default": "./dist/*/index.js" },
  "./experimental": { "...": "..." },
  "./package.json": "./package.json"
}
```

Both `import { VitalsPanel } from "@oxygenui-design/react"` and
`from "@oxygenui-design/react/vitals-panel"` shake correctly under any modern bundler.
The barrel is generated, so it stays complete and correctly ordered.

Bundle size is defended by budget, not by hope: `size-limit` asserts a per-subpath
ceiling and a total-barrel ceiling, and fails CI on regression.

---

## 4. Component anatomy — the unit of scale

This is the part that determines whether 500 components is tractable.

Every component is a directory with a fixed, generated-scaffold layout. There
are no exceptions and no variants of the layout, because uniformity is what
lets tooling operate over the whole catalog without special cases.

```
packages/react/src/components/vitals-panel/
├── index.ts                    generated barrel
├── vitals-panel.tsx            implementation
├── vitals-panel.meta.ts        metadata — the single source of truth
├── vitals-panel.stories.tsx    Storybook: docs, VRT, a11y, and interaction source
├── vitals-panel.test.tsx       unit + integration
└── vitals-panel.css            only when tokens cannot express it (rare)
```

### 4.1 `*.meta.ts` is the source of truth

A typed, validated object per component:

```ts
export default defineComponentMeta({
  name: "vitals-panel",
  title: "Vitals Panel",
  tier: "free",                    // free | pro
  status: "stable",                // experimental | beta | stable | deprecated
  since: "0.1.0",
  layer: "clinical",
  categories: ["observation", "clinical"],
  fhir: { resources: ["Observation"], profiles: [] },
  states: ["Preliminary", "Corrected", "Critical", "Absent value", ...],
  a11y: [{ label: "...", detail: "..." }],
  guidance: { use: [...], avoid: [...] },
  limitations: [...],
  related: ["clinical-value", "reference-range"],
});
```

**Props are deliberately not in this file.** They are extracted from the
component's TypeScript types by `react-docgen-typescript` at build time. There
is exactly one statement of the prop contract — the code — and documentation
cannot drift from it.

### 4.2 Everything downstream is generated

From `*.meta.ts` + extracted props + the source files, `pnpm gen` produces:

- `registry.json` and `apps/docs/public/r/*.json`
- the docs catalog data and navigation
- root `tsconfig.json` path mappings
- the Tailwind `@source` list
- package barrels and `exports` maps
- `llms.txt` and an MCP manifest, so coding agents can consume the catalog
- the coverage manifest that CI uses to assert every stable component has a
  story, a test, and zero axe violations

Generated files carry a header banner and are checked in CI with `--check`,
which fails if the working tree differs from what the generator produces. That
makes drift a build failure rather than a review burden.

**Net effect: adding a component touches one directory.** `pnpm gen:component`
scaffolds it; nothing shared is edited by hand.

### 4.3 Import direction is fixed

Today, registry source is written with consumer-shaped specifiers
(`@/lib/utils`, `@/components/oxygen/status-badge`) and mapped _backwards_ via
root `tsconfig.json` paths so it typechecks in this repo. That is the reason the
path map needs a manual entry per shared component.

Under the target architecture the direction reverses. Source is written with
real package specifiers — `import { cn } from "@oxygenui-design/utils"` — which
typecheck natively with no path mapping. The **registry generator rewrites them**
to `@/` form when it emits copy-source output. The rewrite is one function with
a test, rather than a growing hand-maintained map.

---

## 5. Distribution and the commercial boundary

### 5.1 Two channels, one source

|                                | npm                       | Registry (shadcn CLI)           |
| ------------------------------ | ------------------------- | ------------------------------- |
| Upgrade path                   | semver, patches, codemods | none — the customer has forked  |
| Security fixes reach customers | yes                       | no                              |
| Customer can read and edit     | yes (node_modules)        | yes (their repo, permanently)   |
| Deprecation warnings           | yes, dev-only             | no                              |
| Recommended for                | production applications   | teams that want to own the code |

Both are generated from the same source. The registry output is a build
artifact, not a hand-maintained parallel copy.

The registry channel keeps its current product promise, with one addition: the
docs must state that installing from the registry means forgoing updates. That
is a fair trade stated plainly, and it is the kind of clarity a healthcare buyer
notices.

### 5.2 Free / Pro

`tier` in `*.meta.ts` drives the boundary mechanically:

- **Free** → public npm under `@oxygenui-design/*`, public registry JSON on the CDN.
- **Pro** → private npm dist-tag with per-customer access tokens; registry items
  served from an authenticated endpoint keyed to the same license.

The npm scope is `@oxygenui-design`, not `@oxygenui`. The shorter one is not
available: `oxygen-ui` is already published by an unrelated project, and npm
rejects names that differ from an existing package only by punctuation, so every
variant of it is blocked. This is unrelated to the `@oxygenui` that appears in
install commands — that is a shadcn registry namespace declared in the
consumer's `components.json`, and it is free to keep the shorter name.

Pro source never reaches the public CDN, and CI asserts that: a check walks the
generated public registry output and fails if any item's meta says `tier: "pro"`.

One thing to be honest about internally: **any copy-source Pro item is trivially
redistributable.** Obfuscation is not worth attempting. What customers pay for
is updates, support, indemnity-adjacent assurances, and the clinical review
behind the components — price and message on that, not on access control. This
matches the services-and-contracts revenue model rather than a volume licence
model.

---

## 6. Theming and tokens

### 6.1 The problem with the current file

`packages/tokens/src/oxygen-tokens.css` is 292 hand-written lines mixing raw
palette (`--ox-red-600`) with semantics (`--ox-status-critical`). It is
well-organised and correctly commented, but it is a single artifact in a single
format. Multi-brand, Figma sync, JS access to token values, and high-contrast
themes each want a different output from the same data.

### 6.2 Three tiers, one source

Tokens are authored as W3C DTCG-format JSON and built to every output.

| Tier          | Example                  | Who references it                |
| ------------- | ------------------------ | -------------------------------- |
| **Primitive** | `--ox-ref-red-600`       | nothing outside the token build  |
| **Semantic**  | `--ox-status-critical`   | components                       |
| **Component** | `--ox-badge-critical-bg` | one component, an override point |

Components reference semantic tokens only. This is already the repo's stated
rule; making it a lint rule is what keeps it true at 500 components.

### 6.3 Three axes

```
brand   × theme                         × density
oxygen  │ light / dark / high-contrast   │ patient / standard / clinical
acme    │ light / dark / high-contrast   │ patient / standard / clinical
```

A brand overrides **semantic tokens only** and may replace the primitive palette
wholesale. Themes are value sets over the same semantic key space. Density is
already implemented via `data-ox-density` and is generalised as the third axis.

**A new brand is therefore a data file, not code** — which is the concrete
meaning of "future customisation without architectural changes."

Applied at runtime through CSS custom properties on `[data-ox-brand]`,
`[data-ox-theme]`, `[data-ox-density]`. No JavaScript, no flash of unstyled
content, works under SSR and React Server Components.

### 6.4 Build outputs

One source → CSS custom properties, a Tailwind v4 `@theme` block, typed TS
constants, a flat JSON map, and Figma-compatible tokens. A missing semantic key
in any brand is a build error, so brands cannot silently fall back to a default
that means something different clinically.

---

## 7. Testing

The current state is one test file and a page-level axe run. The target is a
pyramid where **test count scales with component count automatically**, because
most of it derives from stories rather than from separately authored tests.

| Level             | Tool                     | Scope                                               |
| ----------------- | ------------------------ | --------------------------------------------------- |
| Unit              | Vitest + Testing Library | every component; logic and rendering                |
| Interaction       | Storybook play functions | keyboard paths, focus, state transitions            |
| Accessibility     | axe on every story       | × 2 themes × 3 densities, plus forced-colors        |
| Visual regression | Playwright screenshots   | every story × theme × density                       |
| Type              | `expect-type`            | public prop contracts — catches silent API breakage |
| API surface       | `api-extractor`          | committed report; a diff is a required review       |
| Bundle            | `size-limit`             | per subpath and per barrel, fails on regression     |
| E2E               | Playwright               | docs site + a reference application                 |

Two details that matter more than the list:

**Visual regression must be deterministic** or it becomes noise the team learns
to ignore — the failure mode that kills VRT everywhere. Freeze time, disable
animation and transitions, pin fonts as local files, pin the browser version,
and render in a fixed-size container.

**Quality is gated at the catalog level, not per pull request.** CI reads the
generated coverage manifest and asserts that every component marked `stable`
has at least one story, at least one test, zero axe violations, and a VRT
baseline. A component that does not meet the bar cannot be marked stable. This
is how the standard holds without a human reviewing 500 components.

---

## 8. Versioning, stability, and backward compatibility

### 8.1 Stability tiers

`status` in `*.meta.ts` is a contract with consumers, not a label:

| Status         | Export path                           | Breaking-change policy                      |
| -------------- | ------------------------------------- | ------------------------------------------- |
| `experimental` | `@oxygenui-design/react/experimental` | may break in any minor                      |
| `beta`         | main barrel, flagged in docs          | may break in a minor, with a changeset note |
| `stable`       | main barrel                           | breaks only in a major                      |
| `deprecated`   | main barrel, dev-time warning         | removed in the next major                   |

Routing experimental components through a separate export path is what lets the
library ship new ideas without either freezing them prematurely or making the
main package's semver dishonest.

### 8.2 Deprecation

A deprecation is not an announcement, it is a sequence:

1. `status: "deprecated"` with `deprecatedIn`, `removeIn`, and a `replacement`.
2. A development-only `console.warn` naming the replacement, stripped from
   production builds by the `NODE_ENV` guard.
3. A codemod in `@oxygenui-design/codemod`, shipped in the same release.
4. Minimum two minor versions of overlap.
5. Removal in the next major, listed in the migration guide.

### 8.3 Enforcement

`api-extractor` writes a committed API report per package. Any change to the
public surface produces a diff in the pull request, which makes accidental
breakage visible at review time rather than at a customer's build. Combined
with changesets, a major bump becomes a deliberate act.

### 8.4 Support window

N−1 major receives security fixes for 12 months. This is stated because
enterprise procurement asks, and answering it in a document is much cheaper than
answering it per deal.

---

## 9. Security

A healthcare buyer runs a vendor security review. The architecture should make
that review short.

**Supply chain.** Publish only from CI using npm trusted publishing (OIDC), no
long-lived tokens. `npm publish --provenance` for SLSA attestation. A CycloneDX
SBOM generated per release and attached as a release asset. Dependencies pinned,
`pnpm audit` as a CI gate, Renovate for updates.

**Dependency policy.** Every new runtime dependency is an architectural decision
requiring an ADR. At 500 components, dependency creep is the primary driver of
both bundle size and CVE exposure. The current runtime surface — `clsx`,
`tailwind-merge`, `lucide-react` — is deliberately small and should stay that way.

**Component source constraints**, enforced by lint rather than review:

- no `process.env` (the registry builder already checks this; generalised)
- no network calls, no telemetry, no analytics
- no `dangerouslySetInnerHTML`
- no logging of props — a component that logs a `Patient` writes PHI to a
  browser console and, through error reporting, to a third-party service
- no `eval`, no dynamic `import()` of non-local paths

**PHI.** The existing synthetic-data CI scan is a good backstop and is retained.
Its comment about why the bare acronym was removed from the pattern is exactly
the right instinct and should be preserved.

**CSP.** Components must work under a strict Content-Security-Policy. Styling is
CSS custom properties and class names, so no `unsafe-inline` is required; the
docs state a nonce strategy for the one place a style tag is unavoidable.

**The boundary statement stays.** Oxygen UI is not a compliance boundary and not
a medical device. That claim is in the README, and it belongs in the
architecture too, because it constrains what components are allowed to do:
nothing in this library may present itself as clinical decision support.

---

## 10. Accessibility, internationalisation, responsiveness

**Accessibility** is already treated as a gate rather than an aspiration, and
the CI axe job is the right shape. Extending it: per-story rather than per-page,
plus forced-colors mode, reduced-motion, 200% zoom and 320px reflow, and a
documented screen-reader support matrix (NVDA, JAWS, VoiceOver) per component.

**Internationalisation is the one item that must land early or become
prohibitive.** Components currently hardcode user-visible English —
`"Not interpreted"`, `"milligrams per decilitre"`. Retrofitting 500 components
is an enormous project; retrofitting 24 is a week. `@oxygenui-design/intl` provides a
provider and a message catalog with English defaults, so the change is
mechanical and non-breaking.

Healthcare adds requirements a generic i18n layer does not cover:

- **Unit systems.** mg/dL and mmol/L differ by a clinically significant factor.
  Conversion must be explicit and locale-aware, never silent.
- **Date and time.** Time zone handling around administration and observation
  times is a correctness issue, not a formatting one.
- **RTL.** CSS logical properties throughout (`ms-`/`me-`, not `ml-`/`mr-`).
- **Reading level.** Patient-facing and clinician-facing strings are different
  catalogs, not different tones of the same string.

**Responsiveness** uses container queries, not viewport queries. These
components live inside panels, split views, and embedded SMART on FHIR frames —
the viewport is rarely the relevant width.

---

## 11. Documentation

Two surfaces, one data source:

- **Storybook** — the development surface. Every story is simultaneously
  documentation, the VRT fixture, the a11y fixture, and the interaction test.
- **`apps/docs`** — the public product surface, consuming the generated catalog.

Auto-generated per component: prop tables (from types), examples (from stories),
accessibility notes, FHIR resource mapping, states rendered, and a changelog
filtered to that component.

Hand-written: guidance, limitations, and clinical rationale. These are the parts
that carry the product's actual value and must not be generated.

Also generated: `llms.txt` and an MCP manifest. Coding agents are a real
distribution channel for a shadcn-lineage library, and the catalog is already
structured data.

---

## 12. CI/CD

**Pull request.** Affected-only via `turbo run --filter=...[origin/main]` with
remote caching. Gates: generated-file drift check, lint, typecheck, unit tests,
a11y, VRT, API surface diff, bundle budget, synthetic-data scan, `pnpm audit`.
Merge queue on `main`.

**Release.** Changesets opens a version pull request; merging it publishes with
provenance, generates the SBOM, deploys the docs site, and pushes registry JSON
to the CDN. Pro packages publish to the private channel in the same run.

---

## 13. Migration path

Ordered by what unblocks the most and by what gets more expensive the longer it
waits.

### Phase 0 — stop the bleeding — **implemented**

Component metadata colocated as `*.meta.ts` for all 29 components; props
extracted from TypeScript types; generators for `registry.json`, the docs
catalog, tsconfig path mappings, the Tailwind source list, `llms.txt`, and the
coverage manifest; drift detection in CI; `pnpm gen:component` scaffolding;
ESLint flat config with four architecture-invariant rules.

**Adding a component now touches one directory.** Five hand-edited shared files
became zero.

Two defects surfaced during the work and are fixed:

- Registry component source — the exact files copied into customer projects —
  was never typechecked, because the root config covering it was not part of any
  workspace task. Four components had unresolvable imports. `pnpm typecheck` now
  covers it.
- `IdentityToken` drew its avatar swatches from clinical status tokens, so a
  hash of someone's name could tint their avatar with the amber that means
  "high" — a false severity cue beside real results. Decorative
  `--ox-swatch-*` tokens now exist, constrained to hues that carry no clinical
  meaning.

Still open in this phase: the coverage gate is wired and reporting but not
enforcing (`--strict`), because the story and test infrastructure it checks
against arrives in Phase 2.

### Phase 1 — foundations

Token pipeline with the three-tier model and brand/theme/density axes. Package
topology: `@oxygenui-design/utils`, `@oxygenui-design/system`, `@oxygenui-design/primitives`, and
`@oxygenui-design/react` carved out; import direction reversed so the registry
generator rewrites specifiers rather than tsconfig mapping them back.

### Phase 2 — quality infrastructure

Storybook, Vitest workspace, per-story a11y, visual regression, API surface
reports, bundle budgets, coverage manifest gate.

### Phase 3 — commercial readiness

npm channel live with semver and codemods; Pro boundary and licensed
distribution; provenance and SBOM; support-window policy published.

### Phase 4 — internationalisation

`@oxygenui-design/intl` and the message-catalog retrofit across the catalog. Kept as a
distinct phase because it is mechanical and wide, but it must not slip past
roughly 50 components.

---

## 14. What this architecture deliberately does not do

- **No runtime CSS-in-JS.** It costs bundle size and breaks React Server
  Components. Tokens plus Tailwind cover the requirement.
- **No component-level state management.** Components are controlled or take
  FHIR resources. Applications own state.
- **No data fetching.** No FHIR client, no query layer. That is a different
  product with a different risk profile, and bundling it would make the library
  a dependency of the customer's data architecture.
- **No cross-framework abstraction layer.** React only. L0 and L1 are framework
  independent so a future target is additive rather than a rewrite, but building
  the abstraction before there is a second consumer is speculative generality.
- **No clinical decision support.** Stated in §9 and worth repeating: this is a
  regulatory boundary, not a feature gap.
