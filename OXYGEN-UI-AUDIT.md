# Oxygen UI — Enterprise Readiness Audit and Roadmap

**Prepared for:** Zowork engineering leadership
**Repository:** `github.com/zoworkhq/oxygenui` (private) · branch `claude/server-port-config-cd23e0`
**Audit date:** 16 August 2026
**Method:** Direct inspection of 278 tracked files, all configuration, all workflows, all packages, plus executed verification (`pnpm audit`, `node -e` import tests, `eslint --print-config`, `pnpm gen --strict`, tarball packing).

> **Evidence rule applied throughout.** Every claim below cites a file, a line, or a command whose output is quoted. Where something could not be determined from the repository, it is listed in §14.7 _Open questions requiring investigation_ rather than assumed.

---

## 1. Executive summary

Oxygen UI is a **healthcare-specific component library with an unusually strong architectural spine and an unusually small body**. The metadata generator, the token pipeline, the custom ESLint rules, and the clinical content standard are the work of someone who has clearly maintained a design system before, and several of them are better than what most Series-B companies ship. Against that, the library currently contains **five components, all in one category (loaders), all `beta`**, and the delivery, governance, and security layers that enterprise buyers actually audit are largely absent.

The gap is not quality — it is **surface area and institutional readiness**.

### The five findings that matter most

| #   | Finding                                                                                                                                                                                                                                                                              | Severity                       | Evidence                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **The published npm package crashes on import in any Node/SSR context.** `class OxLoaderElement extends HTMLElement` evaluates at module scope.                                                                                                                                      | 🔴 **Critical — ship blocker** | `node -e "import('./dist/index.js')"` → `ReferenceError: HTMLElement is not defined`. `packages/loaders/src/base.ts:135`. The package README explicitly promises Nuxt and Angular Universal support.                                                               |
| 2   | **CI on `main` is broken right now.** The docs deploy gate fetches a registry item deleted earlier in this work stream.                                                                                                                                                              | 🔴 **Critical**                | `.github/workflows/ci.yml:265` → `https://oxygenui.design/r/vitals-panel.json`; `ls apps/docs/public/r/ \| grep -c vitals` → `0`. The next merge to `main` fails `deploy-docs`.                                                                                    |
| 3   | **The documentation lies about the API.** The props table for `pulse-loader` renders **1 prop** (`bpm`); the component has ~20.                                                                                                                                                      | 🔴 **Critical for adoption**   | Generated catalog: `prop count: 1`. Root cause is a single line: `scripts/gen/props.ts:141` excludes any prop not declared in the component's own file, which now excludes `LoaderCommonProps`.                                                                    |
| 4   | **Releases are gated on strictly less than merges are.** `release.yml` runs no lint, no typecheck, no format, no `gen` drift check, no PHI scan, no a11y audit, and has no dependency on CI passing.                                                                                 | 🔴 **Critical**                | `.github/workflows/release.yml:48–78` — install → build → test → tarball → publish.                                                                                                                                                                                |
| 5   | **Three WCAG 2.2 AA contrast failures are shipping in the light palette**, all outside the validator's checked pair list. The worst is the focus indicator at **2.50:1** against a 3:1 requirement — it affects every focusable element in every future component.                   | 🔴 **Critical**                | Computed from emitted `tokens.json`: `focus-ring #10b995` on `bg #ffffff` = 2.50:1 (SC 1.4.11 / 2.4.11); `text-on-accent #ffffff` on `accent #059478` = 3.81:1 (SC 1.4.3); `border-strong #cbd5e1` on `bg` = 1.48:1 (SC 1.4.11, and it backs `--ox-field-border`). |
| 6   | **The published `@oxygenui-design/tokens@0.1.0` predates the entire token pipeline** and still contains a bug fixed in source nine days ago: an 8-digit zero-alpha `surface-overlay` that renders every dialog and popover fully transparent. No changeset is pending to correct it. | 🔴 **Critical**                | `npm view` → published 2026-08-05, 4 files, 2 exports; repo has 6 exports and 12 files. Tag predates pipeline commit `4bacb7e` (2026-08-13). `packages/tokens/tokens/semantic/dark.json:13` documents the fix.                                                     |
| 7   | **Zero open-source governance.** No `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CODEOWNERS`, PR/issue templates, `dependabot.yml`, or `CHANGELOG.md`.                                                                                                                   | 🟠 **High**                    | `.github/` contains only `workflows/`. Verified by direct `find`.                                                                                                                                                                                                  |

### Scores at a glance

**Current unweighted mean across 18 categories: 4.7 / 10.** **Achievable in two quarters: 8.9 / 10.**

The three investments with the largest score movement are, in order: **(a)** publishing a real `@oxygenui/react` package with framework adapters generated from one source (fixes interoperability 3→9 and packaging 4→9); **(b)** arming the quality gates that already exist but are switched off — Storybook, `gen --strict`, coverage thresholds, VRT (testing 5→9); **(c)** the governance and security layer, which is almost entirely additive files and CI steps and is the cheapest large gain (open-source readiness 1→9, security 3→9).

### The strategic question this audit answers

> _Should Oxygen bet on Web Components, framework adapters, headless primitives, or native implementations?_

**Recommendation: a hybrid — a framework-free core, a first-class native React package, and Web Components as the compatibility channel for everything else — with all three channels generated from one source.** Today the React and Web Component implementations are **two hand-written copies of the same five components held together by a parity test** (`test/loader-parity.test.ts`). That test has already caught two real divergences in one week of existence. At 50 components it becomes the project's primary source of bugs. §4 and §15 set out the full comparison and the migration.

### What Oxygen should _not_ do

Do not build breadth before fixing distribution. Shipping 50 components on the current foundation means 50 components with a broken SSR path, an undocumented API surface, and no release gate — which is materially worse for a Netsmart or CVS procurement review than 5 components that are demonstrably correct.

---

## 2. Current-state assessment

### 2.1 What already exists — and is genuinely good

| Area                             | What is there                                                                                                                                                                                                         | Evidence                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Metadata generation**          | `*.meta.ts` per component drives `registry.json`, the docs catalog, tsconfig path mappings, the Tailwind `@source` list, `llms.txt`, and a coverage manifest. Drift is a CI failure.                                  | `scripts/gen/` (16 files); `.github/workflows/ci.yml:64–79`                              |
| **Design tokens**                | Three-tier pipeline (primitive → semantic → component) with light, dark, and high-contrast themes and three density modes, emitted to CSS custom properties. 316 `--ox-*` variables.                                  | `packages/tokens/`; `scripts/gen/tokens/{load,emit,validate}.ts`; ADR 0005               |
| **Domain-specific lint rules**   | Six custom rules encoding real clinical failure modes: `no-absence-placeholder`, `no-ambiguous-clinical-copy`, `no-primitive-token`, `no-dynamic-class-name`, `no-forbidden-capability`, `prefer-logical-properties`. | `packages/eslint-plugin/rules/`                                                          |
| **Accessibility in CI**          | axe-core against 9 pages × 2 themes on every push, with `process.exit(1)` on any violation. Currently passing.                                                                                                        | `scripts/a11y.ts`; verified run: _"no WCAG 2.2 AA violations across 9 pages × 2 themes"_ |
| **Content standard**             | A clinical copy style guide with two rules mechanically enforced by lint.                                                                                                                                             | `CONTENT.md` (10.4 KB), `packages/eslint-plugin/rules/content-rules.test.js` (27 tests)  |
| **Supply-chain constraints**     | Components structurally cannot reach `process.env`, the network, `eval`, `innerHTML`, or `console`.                                                                                                                   | `no-forbidden-capability.js`; enforced in `emit/registry.ts` `FORBIDDEN`                 |
| **Publish rehearsal discipline** | `check-tarball.mjs` asserts entry points, absence of tests, ESM extension correctness, and that `publishConfig` actually applied.                                                                                     | `packages/{fhir,loaders}/scripts/check-tarball.mjs`                                      |
| **Architecture documentation**   | A 30 KB architecture document and 9 ADRs.                                                                                                                                                                             | `ARCHITECTURE.md`; `content/decisions/`                                                  |

### 2.2 What is partially implemented

| Area                        | State                                                                                       | Gap                                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Component catalog**       | 5 components, 1 category, all `beta`.                                                       | ADR 0004 and `ARCHITECTURE.md:199` design for 500. The 29-component POC catalog was deliberately deleted; the current catalog is the rebuild's first increment. |
| **Testing pyramid**         | Unit + contract + parity + jsdom-axe = **439 tests**, all passing.                          | ADR 0007 specifies 8 layers. Missing: stories, interaction tests, visual regression, E2E, type tests, API-surface tests, bundle tests.                          |
| **Quality gate**            | `coverage.json` is generated and reports per-component gaps.                                | `pnpm gen --strict` **fails today** (verified) because `withStory: 0`. The gate exists and cannot be armed.                                                     |
| **Cross-framework support** | Custom elements exist and are tested in jsdom (73 tests).                                   | **Broken in Node/SSR** (§1 finding 1). No framework smoke apps. No React npm package at all.                                                                    |
| **Release automation**      | Changesets configured; provenance/OIDC correctly enabled.                                   | No quality gates on the release path; `packages/tokens` is publishable and inspected by nothing.                                                                |
| **Docs site**               | Next.js site with per-component pages, live previews, command menu, dark mode, source view. | Props tables are wrong (§1 finding 3). No versioning, no changelog, no migration guides, no a11y statement.                                                     |

### 2.3 What is missing entirely

`CONTRIBUTING.md` · `CODE_OF_CONDUCT.md` · `SECURITY.md` · `SUPPORT.md` · `GOVERNANCE.md` · `CODEOWNERS` · PR template · issue templates · `dependabot.yml`/`renovate.json` · root `CHANGELOG.md` · `.nvmrc` · `.editorconfig` · `browserslist` · Storybook · Playwright config · visual regression · E2E tests · coverage thresholds · `size-limit` · `api-extractor` · `dependency-cruiser` · `publint`/`are-the-types-wrong` · commit convention · `husky`/`lint-staged` · CodeQL/SAST · SBOM · `@oxygenui-design/intl` (specified in ADR 0008 and `ARCHITECTURE.md:490–500`) · `packages/react`.

### 2.4 What is broken or risky right now

1. **`@oxygenui-design/loaders` cannot be imported in Node.** Verified. Blocks Nuxt, Angular Universal, Astro, SvelteKit, and Next.js server components — every SSR framework the README names.
2. **`deploy-docs` will fail on the next merge to `main`.** `ci.yml:265` fetches a deleted registry item; the check also asserts an `@oxygenui-design/fhir` dependency that no current component has.
3. **1 critical + 5 high + 5 moderate npm advisories.** `pnpm audit`: critical in `vitest`, high in `vite`, `sharp`, `postcss` ×2, `nanoid`. All in build tooling, none in published runtime surface — but a procurement reviewer runs `npm audit` and sees "critical".
4. **The shipped npm package receives none of Oxygen's own lint rules.** `eslint --print-config packages/loaders/src/base.ts` → `@oxygenui rules applied: NONE`. The config globs `packages/react/**` and `packages/pro-*/**`, **neither of which exists**; `packages/loaders/**` matches no block.
5. **`README.md` documents components that were deleted.** Lines 27, 29, 51, 59, 163 reference `vitals-panel` / `ObservationPanel`. The documented install command 404s.
6. **Script injection in a production workflow.** `hq-indexes.yml:38` interpolates `${{ inputs.confirm }}` directly into a shell script in a job holding `secrets.HQ_DATABASE_URL`.
7. **`passWithNoTests: true`** (`vitest.config.ts:50`) means deleting every registry test leaves CI green.
8. **Two hand-maintained implementations of the same components.** Scaling risk, discussed in §4.

### 2.5 What should be deferred or avoided

- **Do not add component breadth yet.** Fix distribution first (§18 Phase 1–2).
- **Do not open-source before** the SSR fix, the security baseline, and the governance files land — an open repo with a critical advisory and no `SECURITY.md` is a reputational event, not a launch.
- **Avoid a second commercial "Pro" tier** (`apps/docs/src/app/pro/page.tsx` markets one) until the free core has a stable API. Per the strategy record, services and enterprise contracts are the revenue plan; a Pro registry adds a build-time secret boundary to maintain for little near-term return.
- **Avoid Style Dictionary migration** for now. The bespoke token build is small, tested, and works; replacing it is a multi-week project with no user-visible gain.
- **Do not chase 500 components.** The number appears seven times in `ARCHITECTURE.md` and is a scaling _stress test_, not a target. Netsmart and CVS will evaluate 40 excellent components far more favourably than 500 uneven ones.

---

## 3. Current architecture overview

### 3.1 Repository shape

```
oxygenui/
├── registry/oxygen/           ← React components (copy-source, shadcn channel)
│   ├── lib/loader.tsx         ← shared frame + gate + art constants  (20 exports)
│   ├── lib/loader.css         ← keyframes, structure, reduced-motion, forced-colors
│   ├── lib/utils.ts           ← cn()
│   └── {pulse,rhythm,breath,helix,infusion}-loader/
│       ├── *.tsx  *.meta.ts  *.test.tsx        ← 3 files per component, no stories
├── packages/
│   ├── loaders/               ← 🆕 npm: 5 custom elements  (PUBLISHABLE, currently broken in Node)
│   ├── tokens/                ← npm: DTCG source → CSS custom properties  (PUBLISHABLE, unguarded)
│   ├── fhir/                  ← npm: FHIR R4 types + helpers  (PUBLISHED @ 0.1.1)
│   ├── component-meta/        ← private: zod schema for *.meta.ts
│   ├── eslint-plugin/         ← private: 6 architecture/content rules
│   ├── fixtures/              ← private: synthetic FHIR data
│   └── tsconfig/              ← private: shared tsconfigs
├── apps/
│   ├── docs/                  ← Next.js 15 docs site + CDN for registry JSON
│   └── hq/                    ← 104 MB internal task tracker, NOT MIT-licensed
├── scripts/gen/               ← the generator (16 files)
├── content/decisions/         ← 9 ADRs (8 still "proposed")
└── test/                      ← contract + loader suite + parity + axe
```

### 3.2 The two delivery channels

```
                    ┌──────────────────────────┐
                    │  registry/oxygen/lib/    │
                    │  loader.tsx  (React)     │──► shadcn CLI ──► customer's repo
                    │  loader.css              │     (copy-source, React only)
                    └──────────────────────────┘
                                 ╎
                    parity test  ╎  ← test/loader-parity.test.ts (62 assertions)
                    (hand-written)╎     the ONLY thing keeping these in step
                                 ╎
                    ┌──────────────────────────┐
                    │  packages/loaders/src/   │
                    │  art.ts base.ts css.ts   │──► npm ──► Vue / Angular / Svelte / HTML
                    └──────────────────────────┘
```

**This is the central architectural finding.** Two independent implementations of identical behaviour, reconciled by assertions a human wrote. The parity suite caught a mistyped bezier control point and a `NaN` handling divergence within its first run — evidence both that it works and that divergence is the _normal_ case, not the exception.

### 3.3 What is well-designed

- **Layer discipline is real.** `packages/fhir` and `packages/tokens` contain no React (verified: `"react"` appears in `fhir/package.json` only inside `keywords`). ARCHITECTURE §2's rule that L0 holds no React is upheld.
- **The generator makes adding a component touch one directory.** Confirmed in practice this session: five components were added and no shared file was hand-edited except by the generator.
- **Copy-source components are genuinely self-contained.** `test/loader-parity.test.ts:172–195` asserts no workspace imports and no forbidden capabilities in every shipped file.

### 3.4 Architectural weaknesses

| Weakness                                        | Consequence                                                                                                                                            | Evidence                                                                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| No `packages/react`                             | React consumers cannot `npm install` Oxygen at all — the only React channel is copy-source. No versioning, no semver, no upgrade path for React users. | `ls packages/` — no `react`. ADR 0002 §"copy-source distribution has no upgrade channel" names this as a known problem and it remains unsolved. |
| Duplicate implementations                       | Divergence risk scales linearly with component count.                                                                                                  | §3.2                                                                                                                                            |
| `loader-core` has 20 exports and is copy-source | _Everything_ in it is public API with no `api-extractor` guard. A rename is a silent breaking change for every consumer who installed it.              | `grep -c "^export" registry/oxygen/lib/loader.tsx` → 20                                                                                         |
| Docs app doubles as the registry CDN            | `oxygenui.design` availability is coupled to `apps/docs` deploys; a docs build failure takes the install channel down.                                 | `apps/docs/public/r/*.json`; `ci.yml:262`                                                                                                       |
| `apps/hq` (104 MB, proprietary) in the OSS repo | Blocks open-sourcing without a `git filter-repo` history rewrite.                                                                                      | `apps/hq/README.md:5–6` — _"not covered by the MIT licence"_                                                                                    |

---

## 4. Framework-compatibility assessment

### 4.1 Current state, measured

| Framework                           | Channel available today    | Works?                         | Evidence                                       |
| ----------------------------------- | -------------------------- | ------------------------------ | ---------------------------------------------- |
| **React 19**                        | shadcn copy-source         | ✅ Yes                         | 366 tests; docs site renders them              |
| **React 18**                        | shadcn copy-source         | ⚠️ Untested                    | No React 18 in any lockfile; no matrix         |
| **React (npm install)**             | —                          | ❌ **None**                    | No `packages/react`                            |
| **Vue 3 / Nuxt**                    | `@oxygenui-design/loaders` | ❌ **Broken under SSR**        | `ReferenceError: HTMLElement is not defined`   |
| **Angular 17+**                     | `@oxygenui-design/loaders` | ❌ **Broken under Universal**  | same                                           |
| **Svelte / Solid / Lit**            | `@oxygenui-design/loaders` | ⚠️ Client-only                 | same; fine in SPA mode                         |
| **Plain HTML / CDN**                | `@oxygenui-design/loaders` | ✅ Yes                         | Element tests cover late upgrade               |
| **Server-rendered (Rails, Django)** | Static snippet             | ⚠️ Documented, not implemented | README references a recipe that does not exist |

**No framework smoke-test application exists** for any framework. The Vue/Angular/Svelte support claims in `packages/loaders/README.md` are **unverified by any automated test** — and the one verification I ran (Node import) fails.

### 4.2 Strategy comparison

|                           | **A. Separate native impls**                    | **B. Web Components only**                                                               | **C. Core + adapters**                        | **D. Headless + renderers**               | **E. Hybrid (recommended)**                           |
| ------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| **Benefits**              | Best possible DX per framework; idiomatic APIs  | One implementation, universal reach, style encapsulation                                 | One behaviour source; thin idiomatic wrappers | Maximum flexibility; consumers own markup | Native DX where it matters; universal reach elsewhere |
| **Trade-offs**            | N× maintenance, N× tests, guaranteed divergence | Poor React 18 DX; SSR/hydration friction; form participation; shadow-DOM theming         | Adapter layer to build and version            | Consumers must build UI; slower adoption  | Two systems to reason about                           |
| **Developer experience**  | ★★★★★                                           | ★★☆☆☆ (React), ★★★★☆ (others)                                                            | ★★★★☆                                         | ★★★☆☆                                     | ★★★★★ (React), ★★★★☆ (others)                         |
| **Accessibility**         | Each impl re-solves a11y — highest defect risk  | Shadow DOM complicates `aria-*` cross-boundary refs, label association, focus delegation | a11y solved once in core                      | a11y in primitives, consumer can break it | Solved once in core, verified per channel             |
| **Performance**           | Optimal per framework                           | Extra custom-element runtime; hydration cost                                             | Near-optimal; thin wrappers                   | Optimal                                   | Optimal for React; small runtime elsewhere            |
| **Maintenance cost**      | 🔴 Highest                                      | 🟢 Lowest                                                                                | 🟡 Medium                                     | 🟡 Medium                                 | 🟡 Medium                                             |
| **Distribution**          | N packages, N release trains                    | 1 package                                                                                | 1 core + N adapters                           | 1 core + N renderers                      | core + react + elements                               |
| **Long-term scalability** | Fails past ~20 components                       | Scales, but React adoption suffers                                                       | Scales well                                   | Scales, narrower audience                 | Scales; matches buyer mix                             |

### 4.3 Recommendation

**Adopt E (hybrid), and make the two existing channels _generated from one source_ rather than hand-written twins.**

Concretely:

```
packages/core/          framework-free: art constants, geometry, state machines,
                        ARIA contracts, the timing gate, CSS. No React, no DOM
                        assumptions beyond types.
        │
        ├──► packages/react/      ← REAL npm package, peerDeps react ^18||^19
        │         │                  thin: core + JSX. Ships .d.ts, tree-shakeable.
        │         └──► registry/  ← shadcn copy-source GENERATED from packages/react
        │                            (keeps the "read the source" promise without
        │                             a second hand-written implementation)
        │
        └──► packages/elements/   ← custom elements for Vue/Angular/Svelte/HTML
                  └──► packages/{vue,angular}/  ← optional thin typed wrappers
                                                   (added only on customer demand)
```

**Why this shape, given the repository:**

1. **React is the buyer reality.** Netsmart, Heidi Health, and most digital-health startups are React shops. Making React a second-class Web Component consumer would be strategically wrong.
2. **The copy-source promise is a genuine differentiator** — _"the source lands in your repository where you can read every line before you trust it"_ is a strong argument in a healthcare procurement review. Keep it, but **generate** the registry from `packages/react` so it stops being a second source of truth.
3. **Web Components are the right compatibility layer, not the right primary layer.** They reach Angular and Vue with one artifact, which is exactly the long tail Oxygen needs, but the SSR and form-participation friction (already demonstrated by finding 1) makes them a poor primary React story.
4. **ADR 0002 and ADR 0003 already anticipate this**; the packages they describe (`packages/react`) simply do not exist yet.

**Rejected:** _B (Web Components only)_ — would make React adoption worse for the primary buyer. _A (separate native)_ — the parity test already demonstrates the divergence cost at 5 components. _D (headless only)_ — Oxygen's value is opinionated clinical UI; headless-only discards the differentiator.

---

## 5. Component and API-quality assessment

### 5.1 What is good

The five loaders share **one prop interface** (`LoaderCommonProps`, `registry/oxygen/lib/loader.tsx:64–108`) with consistent naming and sensible defaults. Specifically strong:

- **Naming is consistent and predictable.** `label` / `showLabel` / `hint` / `mode` / `size` / `speed` / `progress` / `motion` / `announce` / `delay` / `minDuration` / `slowAfter` / `slowHint` / `open` / `scrim` / `actions`. Boolean props read as adjectives; time props carry units in the name.
- **The API forbids the wrong thing.** `bpm` is clamped 40–100 (`beatMs`), `speed` 0.5–2, `progress` 0–100, `size` 12–480. A caller cannot drive the component into a WCAG 2.3.1 flash violation.
- **State is expressed in types, not booleans.** `progress?: number` switching `role="status"` → `role="progressbar"` is the correct modelling — one prop, two coherent behaviours.
- **Defaults differ by mode where that is right.** `showLabel` defaults true for `page`/`overlay`, false inline.
- **`PulseLoader` degrades to `RhythmLoader` below 40 px** rather than rendering a worse version of itself — a genuinely thoughtful API decision.

### 5.2 Problems

| #   | Issue                                                                                                                                          | Severity    | Evidence                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Props are undocumented.** The generated catalog exposes 1 prop for `pulse-loader`.                                                           | 🔴 Critical | `scripts/gen/props.ts:141` — `if (path.resolve(declaration.getSourceFile().fileName) !== path.resolve(ownFile)) continue;` The rule exists to exclude ~280 `React.HTMLAttributes` members and now also excludes Oxygen's own `LoaderCommonProps`. |
| 2   | **`loader-core`'s entire surface is public API** with no extraction guard. 20 exports, no `api-extractor`, no `@public`/`@internal` markers.   | 🟠 High     | `grep -c "^export"` → 20                                                                                                                                                                                                                          |
| 3   | **No events on the React side.** The elements emit `ox-loader:show/slow/hide`; React exposes only `onSlow`. Asymmetric.                        | 🟡 Medium   | `base.ts:243,262,277` vs `LoaderCommonProps.onSlow`                                                                                                                                                                                               |
| 4   | **No `ref` forwarding** on any React component.                                                                                                | 🟡 Medium   | No `forwardRef` in `registry/oxygen/`                                                                                                                                                                                                             |
| 5   | **`slugWidth` and `PULSE_MIN_SIZE_PX` are exported from component files** — implementation detail promoted to public API to make tests easier. | 🟡 Medium   | `infusion-loader.tsx:44`, `pulse-loader.tsx:42`                                                                                                                                                                                                   |
| 6   | **No controlled/uncontrolled convention documented**, no `id`/`aria-*` passthrough contract, no slot/composition standard.                     | 🟡 Medium   | Absent from `ARCHITECTURE.md` and `CONTENT.md`                                                                                                                                                                                                    |
| 7   | **`actions` prop takes `ReactNode`** with no guidance; a consumer can put anything in a live region.                                           | 🟢 Low      | `LoaderCommonProps.actions`                                                                                                                                                                                                                       |

### 5.3 Missing API governance

There is no documented standard for: prop naming, event naming, controlled vs uncontrolled, ref forwarding, polymorphic `as`, composition/slots, or breaking-change classification. §16 supplies one.

---

## 6. UI, UX, design-system, and accessibility assessment

### 6.1 Accessibility — the strongest area, with real gaps

**What is verified working:**

- axe-core in CI: 9 pages × 2 themes, `process.exit(1)` on violation. Passing.
- 42 jsdom axe runs across every loader × every state (`test/loader-a11y.test.tsx`).
- `role="status"` + `aria-live="polite"` indeterminate; `role="progressbar"` + full value set + `aria-valuetext` determinate.
- Label always in the DOM (visually hidden when not shown) — correct, because an empty live region announces nothing.
- Art is `aria-hidden`; `focusable="false"` on every SVG.
- `prefers-reduced-motion` gets a **designed** still state, not a paused one (`loader.css:322–380`).
- `forced-colors: active` maps to `CanvasText`/`Canvas` (`loader.css:428–443`).
- Unique label ids via `React.useId()`, verified against duplicate-id violations.

**What is missing:**

| Gap                                   | Risk      | Note                                                                                                          |
| ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| **No screen-reader test matrix**      | 🟠 High   | ARCHITECTURE §10 specifies NVDA/JAWS/VoiceOver. No record of any manual pass. Enterprise buyers ask for this. |
| **No VPAT / ACR**                     | 🟠 High   | Netsmart and CVS will request a VPAT during procurement. None exists.                                         |
| **No forced-colors automated test**   | 🟡 Medium | CSS exists; nothing verifies it renders.                                                                      |
| **No 200% zoom / 320 px reflow test** | 🟡 Medium | WCAG 1.4.10 / 1.4.4 unverified.                                                                               |
| **No keyboard interaction tests**     | 🟡 Medium | Loaders are non-interactive so low impact _now_; will matter immediately for the first input component.       |
| **axe runs at one viewport**          | 🟡 Medium | 1440×900 only (`scripts/a11y.ts:62`).                                                                         |
| **Chromium only**                     | 🟡 Medium | No Firefox/WebKit despite a public WCAG claim.                                                                |

### 6.2 Design tokens and theming

**The architecture is mature; the delivery and completeness are not.**

Four source maps (primitive 141 · shared 20 · semantic 59×3 themes · density 19 · component 86 = **443 source tokens → 313 CSS custom properties**), with a validator that runs _first_ in the generator and exits non-zero on any problem. Six checks: theme key-space parity (bidirectional), density parity, reference resolution, component-tier violations, status contrast, and text contrast. Hue separation between `status.high` and `status.low` must exceed 60° so direction survives colour-vision deficiency. `prefers-reduced-motion` zeroes all three duration tokens; `forced-colors` maps borders to `CanvasText` and focus to `Highlight`. `no-primitive-token` is an ESLint **error** on shipped source, and `grep` for hardcoded hex across `registry/` returns **zero hits**.

That is a better foundation than most commercial design systems have. The problems are what surrounds it:

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Severity              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1   | **The published package is nine days stale and ships a known bug.** `@oxygenui-design/tokens@0.1.0` on npm predates the pipeline entirely: 4 files, 2 exports (repo has 12 and 6), no high-contrast theme, no density profiles, and it still contains the `#1d263000` zero-alpha `surface-overlay` that makes every dialog and popover fully transparent — documented as fixed in `semantic/dark.json:13`. **No changeset is pending.** The shadcn channel serves current CSS; the npm channel does not.       | 🔴 Critical           |
| 2   | **Three WCAG AA failures outside the validator's pair list.** `focus-ring` on `bg` = **2.50:1** (needs 3:1, SC 1.4.11/2.4.11 — and it backs `--ox-field-border-focus`); `text-on-accent` on `accent` = **3.81:1** (needs 4.5:1, SC 1.4.3 — every primary button label); `border-strong` on `bg` = **1.48:1** light / **2.02:1** dark (needs 3:1 — it backs `--ox-field-border` and `--ox-chart-axis`). The gate checks 15 status pairs and 12 text pairs and none of these.                                    | 🔴 Critical           |
| 3   | **The high-contrast theme is dead code.** 59 tokens held to a 7:1 floor, selected by `[data-ox-theme="high-contrast"]` — a value **nothing in the repository ever sets**. `scripts/a11y.ts:50` iterates `["light", "dark"]` only, so it is never audited either.                                                                                                                                                                                                                                               | 🟠 High               |
| 4   | **The brand axis does not exist.** ADR 0005's headline claim — _"A new customer brand is a JSON file and a build"_ — is unimplemented: `[data-ox-brand]` appears nowhere, `THEME_SELECTOR` has no brand dimension, there is no `brands/` directory. For Netsmart or CVS white-labelling this is the capability they will ask for first.                                                                                                                                                                        | 🟠 High               |
| 5   | **Not DTCG-spec-compliant**, despite the `$value`/`$type` shape. `dimension`, `duration`, `cubicBezier`, and `shadow` all use raw CSS strings where the spec requires structured objects, and `load.ts:70` coerces with `String($value)` — so a spec-compliant file would parse to `"[object Object]"`. Tokens Studio, Style Dictionary v4, and Figma Variables import would all reject or mangle it. Only `color` and `fontFamily` round-trip.                                                                | 🟠 High               |
| 6   | **`tokens.json` leaks unresolved aliases.** The density block is built from raw values (`emit.ts:309–314` skips the resolution the theme and component blocks apply), so consumers get the literal string `{ref.size.md}` instead of `1rem`. No validator checks output shape.                                                                                                                                                                                                                                 | 🟠 High               |
| 7   | **The tokens package is not properly publishable.** No `main`, no `types`, no `"type": "module"`, no build (`"echo \"[tokens] css is published as source\""`), no `check-tarball.mjs` — and `exports["."]` serves raw uncompiled `.ts`, which fails in plain Node and in any SSR build without `transpilePackages`.                                                                                                                                                                                            | 🟠 High               |
| 8   | **Tailwind output is mis-namespaced.** Font sizes and radii land in `--spacing-*` (so `text-ox-text-base` and `rounded-ox-radius-lg` do not exist); shadow, duration, and easing types fall through and are dropped entirely; density is omitted from the emit loop.                                                                                                                                                                                                                                           | 🟡 Medium             |
| 9   | **Four of five emitted outputs have zero consumers** — `tailwind.css`, `tokens.ts`, `tokens.json`, and `contrast.json` are generated and imported by nothing. `contrast.json`'s stated purpose is publication "in the accessibility conformance table"; no such page exists.                                                                                                                                                                                                                                   | 🟡 Medium             |
| 10  | **The validator has no tests.** `vitest.config.ts` excludes `packages/**`, and `test/` contains no test for `contrastRatio`, `parseHex`, `hue`, or any `check*` function. The gate protecting clinical colour has nothing proving it fires.                                                                                                                                                                                                                                                                    | 🟡 Medium             |
| 11  | **Coverage holes in the gate itself:** `flag.restricted` is measured in `contrast.json` and enforced by nothing; `checkDensityParity` is unidirectional (extra keys pass); multi-reference values like `"1px solid {border}"` are never reference-checked.                                                                                                                                                                                                                                                     | 🟡 Medium             |
| 12  | **Missing token groups:** no breakpoints, no z-index scale, no `@layer` for cascade control, no `$deprecated` migration path, no wide-gamut/OKLCH. The only stacking value in the system is a hardcoded `--ox-loader-z: 1000`.                                                                                                                                                                                                                                                                                 | 🟡 Medium             |
| 13  | **Two parallel un-piped systems.** `registry/oxygen/lib/loader.css:31–44` defines ten `--ox-loader-*` properties (including that z-index and two easing curves that are _not_ the semantic `--ox-ease`) outside the pipeline, in the `--ox-*` namespace where a consumer cannot tell the difference. `apps/docs/src/app/globals.css` is a second ~30-value hardcoded system whose own comments record two historical AA failures it had to repair by hand — precisely because the contrast gate cannot see it. | 🟡 Medium             |
| 14  | **All 86 component-tier tokens are orphaned** — they target `badge`, `alert`, `field`, `chart`, `nav`, `banner`, `range`, `surface-card`, `value`, `absent`, none of which exist in the current catalog.                                                                                                                                                                                                                                                                                                       | 🟢 Low (branch state) |

### 6.3 UI/UX consistency

With one component category, cross-component consistency is largely unprovable. The docs site itself is well-crafted (dark/light, command menu, section rails, live previews). Two concrete issues found:

- **`ComponentCard` status styles were dead.** Keyed on `shipping`/`review`/`design` while components declare `experimental`/`beta`/`stable`/`deprecated` — every badge rendered unstyled. _(Corrected during this session.)_
- **Responsive strategy is undocumented.** ARCHITECTURE §10 specifies container queries; no component uses one, and there are no breakpoint tokens.

---

## 7. Code-quality and maintainability assessment

**Strengths.** TypeScript `strict` plus `noUncheckedIndexedAccess` and `noImplicitOverride` (`packages/tsconfig/base.json`). Zero `any` in shipped source. Lint currently reports **0 problems**. Comments explain _why_, consistently and unusually well. Modularity is good: shared behaviour lives in one place per channel.

**Weaknesses.**

| #   | Issue                                                                                                                         | Evidence                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | **Shipped npm source is ungoverned by Oxygen's own rules.**                                                                   | `eslint --print-config packages/loaders/src/base.ts` → `@oxygenui rules applied: NONE` |
| 2   | **`--max-warnings 35`** is a ratchet, not a standard.                                                                         | `package.json:19`                                                                      |
| 3   | **`packages/loaders/src/css.ts` is a 200-line CSS string in TypeScript** — no linting, no formatting, no autocomplete.        | `css.ts`                                                                               |
| 4   | **Duplicated logic across channels:** `clamp`, `beatMs`, `cycleMs`, `strokePx`, `slugWidth`, size resolution all exist twice. | `loader.tsx` vs `base.ts`                                                              |
| 5   | **No `dependency-cruiser`**, so ARCHITECTURE §2's layer rule ("enforced, not documented") is in fact only documented.         | Absent from `package.json`                                                             |
| 6   | **`apps/hq` is 104 MB** in the same repository.                                                                               | `du -sh apps/hq`                                                                       |

---

## 8. Testing and quality-assurance assessment

### 8.1 What exists — 439 tests, all passing

| Suite                                   | Count | File                                                 |
| --------------------------------------- | ----- | ---------------------------------------------------- |
| Shared loader contract (× 5 components) | ~200  | `test/loader-suite.tsx`                              |
| Per-component specifics                 | ~62   | `registry/oxygen/*/*.test.tsx`                       |
| Custom element behaviour (jsdom)        | 73    | `packages/loaders/test/elements.test.ts`             |
| Cross-channel parity                    | 62    | `test/loader-parity.test.ts`                         |
| Accessibility (axe, jsdom)              | 42    | `test/loader-a11y.test.tsx`                          |
| FHIR helpers                            | 76    | `packages/fhir/src/helpers.test.ts`                  |
| Content lint rules                      | 27    | `packages/eslint-plugin/rules/content-rules.test.js` |
| hq (real MongoDB)                       | 99    | `apps/hq/src/**`                                     |

The **parity suite is the standout idea** — it turns a structural risk into a build failure and has already paid for itself twice.

### 8.2 What is missing

| Layer                            | State         | Consequence                                                                                                |
| -------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| **Storybook / stories**          | **0 files**   | `pnpm gen --strict` fails; the catalog quality gate cannot be armed; no component playground for designers |
| **Visual regression**            | None          | No protection against CSS regressions — the primary failure mode for a loader library                      |
| **Interaction tests**            | None          | No keyboard/focus coverage                                                                                 |
| **E2E**                          | None          | `@playwright/test` installed but no config; used only by `scripts/a11y.ts`                                 |
| **Coverage thresholds**          | **None**      | `vitest.config.ts:51–56` reports but does not gate; `test:coverage` is never run in CI                     |
| **`passWithNoTests: true`**      | Present       | Deleting all registry tests keeps CI green                                                                 |
| **Node-environment import test** | None          | **This is why finding 1 shipped.** jsdom provides `HTMLElement`; Node does not.                            |
| **Type tests**                   | None          | No `expect-type`; prop contracts can break silently                                                        |
| **API surface tests**            | None          | No `api-extractor` report                                                                                  |
| **Bundle size tests**            | None          | No `size-limit`                                                                                            |
| **Framework smoke apps**         | None          | Vue/Angular/Svelte support is claimed and unverified                                                       |
| **Cross-browser**                | Chromium only | Firefox/WebKit unverified                                                                                  |
| **Node matrix**                  | Node 22 only  | `engines: >=20.11.0` never tested                                                                          |

---

## 9. Documentation assessment

**Internal documentation is excellent** — `ARCHITECTURE.md` (30 KB), `CONTENT.md`, `DESIGN.md`, `DEPLOYMENT.md`, 9 ADRs. This is above the standard of most commercial design systems.

**Consumer documentation is the weakest area of the project.**

| Issue                                                           | Severity    | Evidence                                                            |
| --------------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| **Props tables show ~1 of 20 props**                            | 🔴 Critical | §1 finding 3                                                        |
| **`README.md` documents deleted components**                    | 🔴 Critical | lines 27, 29, 51, 59, 163 — the install command 404s                |
| **No `CHANGELOG.md`**                                           | 🟠 High     | Enterprise consumers require one                                    |
| **No migration guides, no versioned docs**                      | 🟠 High     | ADR 0006 defines a deprecation sequence with no place to publish it |
| **8 of 9 ADRs still "proposed"**                                | 🟡 Medium   | The architecture is documented but unratified                       |
| **`ARCHITECTURE.md` describes a catalog that no longer exists** | 🟡 Medium   | "all 29 components" at line 560; Phase 0 marked "implemented"       |
| **No getting-started, theming, a11y-statement, or FAQ pages**   | 🟠 High     | Docs site has 5 routes total                                        |
| **No JSDoc → docs pipeline for the elements package**           | 🟡 Medium   | Only the React channel has generated docs                           |

---

## 10. NPM packaging and distribution assessment

### 10.1 Package inventory

| Package                    | Version | Published  | `sideEffects` | `publishConfig` | Tarball gate   | peerDeps                                |
| -------------------------- | ------- | ---------- | ------------- | --------------- | -------------- | --------------------------------------- |
| `@oxygenui-design/fhir`    | 0.1.1   | ✅ npm     | `false`       | ✅              | ✅             | none                                    |
| `@oxygenui-design/loaders` | 0.1.0   | ❌ not yet | `true` ✅     | ✅              | ✅             | **none — should declare none, correct** |
| `@oxygenui-design/tokens`  | 0.1.0   | ❌         | `*.css`       | ✅              | ❌ **missing** | none                                    |
| 5 others                   | —       | private    | —             | —               | —              | —                                       |

### 10.2 Findings

1. 🔴 **The `@oxygenui` npm scope is not secured.** `npm view @oxygenui/core` → 404. The shadcn _registry namespace_ is `@oxygenui` and the docs tell users to type `@oxygenui/pulse-loader`. If someone else registers the npm scope, that is a **name-confusion supply-chain risk** on a healthcare library. **Register the scope this week regardless of which scope you publish under.**
2. 🔴 **`packages/tokens` is publishable and inspected by nothing** (`release.yml:73` gates on a file that does not exist there).
3. 🟠 **No `packages/react`** — React consumers cannot install Oxygen from npm.
4. 🟠 **No `publint` / `are-the-types-wrong`** in CI.
5. 🟠 **Two scopes in play.** `@oxygenui-design/*` on npm vs `@oxygenui` in the registry — defensible but must be documented explicitly or it reads as a typosquat to a security reviewer.
6. 🟡 **Subpath tree-shaking is imperfect.** `dist/pulse.js` imports `./rhythm.js` (the small-size fallback), so `@oxygenui-design/loaders/pulse` pulls two elements. Measured: 8.1 KB gz for one loader, 9.5 KB for all five — acceptable, but document it.
7. 🟡 **No CDN/UMD build**, despite the README recommending a `<script type="module">` CDN tag.

### 10.3 Measured payloads

| Artifact                  | Raw    | Gzipped          |
| ------------------------- | ------ | ---------------- |
| One loader (pulse + deps) | ~27 KB | **8.1 KB**       |
| All five elements         | ~34 KB | **9.5 KB**       |
| Registry CSS              | ~11 KB | **3.2 KB**       |
| Tarball                   | —      | 31 KB (48 files) |

---

## 11. CI/CD and release-process assessment

### 11.1 What exists

`ci.yml` (403 lines) runs on push/PR to `main` with concurrency cancellation, and gates: `gen` + stale-file check, lint, format, typecheck, test, build, axe a11y (both themes), and a PHI scan. Then deploys docs and hq to Vercel with post-deploy verification, plus PR previews. `release.yml` uses Changesets with **npm provenance via OIDC correctly configured** (`id-token: write` + `NPM_CONFIG_PROVENANCE: "true"`) — the best-implemented part of the pipeline.

### 11.2 Critical findings

| #   | Finding                                                                                                                                                           | Evidence                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | **`deploy-docs` is broken.** Verifies a deleted registry item.                                                                                                    | `ci.yml:265`                                        |
| 2   | **Release runs no lint, format, typecheck, gen-drift, PHI, or a11y gate**, and has no `needs` on CI. A red-CI commit can publish.                                 | `release.yml:48–78`                                 |
| 3   | **No `permissions:` block in `ci.yml`.** All 5 jobs inherit the repo default token scope while executing `pnpm dlx vercel@48` and unpinned `npx wait-on`.         | `ci.yml` — no `permissions` anywhere                |
| 4   | **Script injection.** `${{ inputs.confirm }}` expanded into shell in a job holding `secrets.HQ_DATABASE_URL`.                                                     | `hq-indexes.yml:38`; same pattern `ci.yml:303`      |
| 5   | **Vercel org and project IDs hardcoded in plaintext.**                                                                                                            | `ci.yml:16–17`                                      |
| 6   | **Every action on a mutable tag**, never a SHA.                                                                                                                   | `actions/checkout@v4`, `changesets/action@v1`, etc. |
| 7   | **Deployed bytes ≠ tested bytes.** Deploy jobs re-checkout and rebuild via `vercel build`; no artifact promotion.                                                 | `ci.yml:251–253`                                    |
| 8   | **`deploy-preview` exits 0 when the token is missing** — the normal path for fork PRs. Every external contribution gets a green "deployed" that deployed nothing. | `ci.yml:395–398`                                    |
| 9   | **`turbo.json` declares no `globalEnv`**, so under turbo 2.x strict env mode `MONGOMS_DOWNLOAD_DIR` never reaches the tests and the mongod cache cannot work.     | `turbo.json`; `ci.yml:24,45–49`                     |
| 10  | **No dependency scanning, no CodeQL, no SBOM, no Dependabot/Renovate.**                                                                                           | `.github/` contains only `workflows/`               |
| 11  | **No coverage in CI at all.** `test:coverage` exists and is never invoked.                                                                                        | `package.json:25`                                   |
| 12  | **No matrix**: Node 22 only, `ubuntu-latest` only, Chromium only.                                                                                                 | hardcoded at 6 sites                                |
| 13  | **No changeset enforcement** — a PR touching a published package can merge with no version bump.                                                                  | no `pull_request` changeset check                   |
| 14  | **`.changeset/config.json` ignores 2 of 6 private packages** and does not set `privatePackages`, so private packages get versioned and changelogged.              | `.changeset/config.json:10`                         |

---

## 12. Open-source readiness assessment

**Score: 1/10. This is the lowest-scoring area and the cheapest to fix.**

| Requirement                        | State                                        |
| ---------------------------------- | -------------------------------------------- |
| LICENSE (MIT)                      | ✅ Present, root + 3 packages                |
| `CONTRIBUTING.md`                  | ❌                                           |
| `CODE_OF_CONDUCT.md`               | ❌                                           |
| `SECURITY.md` + disclosure policy  | ❌                                           |
| `SUPPORT.md`                       | ❌                                           |
| `GOVERNANCE.md` / `MAINTAINERS.md` | ❌                                           |
| Issue templates                    | ❌                                           |
| PR template                        | ❌                                           |
| `CODEOWNERS`                       | ❌                                           |
| `CHANGELOG.md`                     | ❌                                           |
| Commit convention                  | ❌                                           |
| Public roadmap                     | ❌                                           |
| DCO/CLA decision                   | ❌                                           |
| Release notes                      | ❌ (Changesets configured, nothing released) |

**Structural blockers beyond files:**

1. **`apps/hq` is proprietary and 104 MB.** Open-sourcing requires extracting it — and because it is in history, a `git filter-repo` rewrite, which invalidates every existing clone and fork.
2. **1 critical + 5 high advisories.** Opening the repo publishes that vulnerability surface.
3. **`better-design-system-research.html` (77 KB), `oxygen-ui-component-library-proposal.html` (467 KB), and `oxygen-page-loader-brief.html` (108 KB)** sit at the repository root. These are internal strategy documents — review before any public release.

---

## 13. Security, performance, and scalability assessment

### 13.1 Security

**Genuinely strong:** the `no-forbidden-capability` rule means components structurally cannot read `process.env`, call `fetch`, open a WebSocket, `eval`, or write to `console` — and the registry emitter re-checks the file text (`emit/registry.ts` `FORBIDDEN`). For a hospital security review this is a materially better story than most libraries can tell. The PHI scan and synthetic-data-only policy are also real.

**Weak:**

| Issue                                                      | Severity                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| 1 critical + 5 high + 5 moderate npm advisories            | 🔴 (all dev/build tooling; published runtime deps are zero)  |
| No `SECURITY.md`, no disclosure channel, no embargo policy | 🔴                                                           |
| No dependency scanning, no SAST/CodeQL, no SBOM            | 🟠 (SBOM is frequently a healthcare procurement requirement) |
| Actions unpinned; `npx wait-on` unpinned and undeclared    | 🟠                                                           |
| Script injection in `hq-indexes.yml`                       | 🟠                                                           |
| No `permissions` block in `ci.yml`                         | 🟠                                                           |
| Long-lived `NPM_TOKEN` still wired alongside OIDC          | 🟡                                                           |
| `@oxygenui` npm scope unclaimed                            | 🟠                                                           |

### 13.2 Performance

Measured and good: 8.1 KB gz per loader; animations restricted to `transform`, `opacity`, and `stroke-dashoffset`; `visibilitychange` pauses animation in background tabs. **Unverified:** no `size-limit` budgets, no frame-rate testing under CPU throttle, no CLS measurement, no runtime perf tests. The performance claims in the design brief are currently assertions.

### 13.3 Scalability

The generator genuinely scales — adding a component touches one directory. What does **not** scale: two hand-written implementations, no `api-extractor`, no VRT (at 50 components, manual visual review is impossible), no remote build cache (`turbo.json` has none; every CI run is cold), and a single monolithic docs app that is also the CDN.

---

## 14. Detailed bugs, gaps, risks, and technical debt

### 14.1 Critical — fix before any release

| ID     | Issue                                                                                                                                  | File                                         | Fix                                                                                                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1** | Element package throws in Node                                                                                                         | `packages/loaders/src/base.ts:135`           | Guard the class definition: export a `defineLoaders()` that constructs classes lazily, or wrap in `typeof HTMLElement !== "undefined"`. **Add a Node-environment import test** — its absence is why this shipped.               |
| **C2** | `deploy-docs` verifies a deleted item                                                                                                  | `.github/workflows/ci.yml:265`               | Verify `index.json` and assert the item set matches `registry.json`, rather than naming one component.                                                                                                                          |
| **C3** | Props tables show 1 of ~20 props                                                                                                       | `scripts/gen/props.ts:141`                   | Include props declared anywhere inside the repository's own source (`registry/`, `packages/`); exclude only `node_modules`.                                                                                                     |
| **C4** | Release has no quality gates                                                                                                           | `.github/workflows/release.yml`              | Add lint, format, typecheck, `gen --check`, PHI, a11y; or make release `needs` a reusable CI workflow.                                                                                                                          |
| **C5** | 1 critical + 5 high advisories                                                                                                         | lockfile                                     | Upgrade `vitest`→≥3.2.6, `@vitest/coverage-v8`, and `next`. Add `pnpm audit --audit-level=high` to CI.                                                                                                                          |
| **C6** | README documents deleted components                                                                                                    | `README.md:27,29,51,59,163`                  | Rewrite against the current catalog.                                                                                                                                                                                            |
| **C7** | **Three WCAG AA contrast failures shipping in the light palette** — focus ring 2.50:1, `text-on-accent` 3.81:1, `border-strong` 1.48:1 | `packages/tokens/tokens/semantic/light.json` | Darken `focus-ring` and `accent`; strengthen `border-strong`. **Then extend `checkTextContrast` to cover focus, borders, and on-accent pairs** — the values are fixable in an hour; the _gate's blind spot_ is the real defect. |
| **C8** | **Published `@oxygenui-design/tokens@0.1.0` predates the pipeline** and ships the zero-alpha overlay bug                               | npm registry vs `4bacb7e`                    | Add a changeset, republish. Add `check-tarball.mjs`, `main`, `types`, and a real build so the package is not raw `.ts`.                                                                                                         |

### 14.2 High

**H1** Shipped npm source gets no Oxygen lint rules (`eslint.config.mjs:43` globs non-existent packages) · **H2** No `packages/react` · **H3** Zero stories → `gen --strict` unarmable · **H4** No VRT · **H5** No coverage thresholds; `passWithNoTests: true` · **H6** No governance files · **H7** `packages/tokens` publishable but unguarded · **H8** No `SECURITY.md`/disclosure · **H9** No dependency scanning/SBOM/CodeQL · **H10** Script injection in `hq-indexes.yml:38` · **H11** `@oxygenui` npm scope unclaimed · **H12** No i18n package (ADR 0008 explicitly warns this becomes prohibitive after ~50 components; the window is open **now** at 5) · **H13** No VPAT/ACR · **H14** No `CHANGELOG.md` or migration guides.

### 14.3 Medium

No matrix testing (Node 20 untested despite `engines`) · no browserslist while using `color-mix()` · no `api-extractor` · no `dependency-cruiser` · no `size-limit` · no commit convention or hooks · turbo `globalEnv` missing · no remote cache · deployed bytes ≠ tested bytes · `deploy-preview` no-ops on forks · actions unpinned · Vercel IDs in plaintext · 8 ADRs unratified · `ARCHITECTURE.md` stale · duplicated helpers across channels · `css.ts` as an unlinted string · no `ref` forwarding · no React events parity · component tokens declared in CSS not DTCG.

### 14.4 Low

`slugWidth`/`PULSE_MIN_SIZE_PX` exported for tests · no `.nvmrc`/`.editorconfig` · docs app is also the CDN · no CDN/UMD build · internal HTML strategy docs at repo root · no container queries despite ARCHITECTURE §10.

### 14.5 Technical debt register

| Debt                             | Interest rate                                                                                 | Pay down by                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Two hand-written implementations | **High** — grows with every component                                                         | Phase 2: generate both from `packages/core` |
| No stories                       | **High** — blocks VRT, a11y-per-story, and the catalog gate simultaneously                    | Phase 2                                     |
| No i18n                          | **Very high** — ADR 0008 quantifies it: a week at 24 components, "an enormous project" at 500 | Phase 3, and not later                      |
| `apps/hq` in-repo                | Low now, **very high at open-source time**                                                    | Phase 4                                     |
| `--max-warnings 35`              | Low                                                                                           | Phase 1                                     |

### 14.6 Risks unique to healthcare

1. **No VPAT** — will stall procurement at CVS and Netsmart.
2. **No SBOM** — increasingly a contractual requirement.
3. **PHI scan is regex-only** and self-describes as a backstop (`ci.yml:169–170`).
4. **The "not a medical device" disclaimer** is present in README, docs footer, and package READMEs — good, and it must stay on every surface.

### 14.7 Open questions requiring investigation

- Is the **`@oxygenui` npm scope** owned by Zowork? (`npm whoami` returned 401 — not verifiable from here.)
- Are **branch protection rules / required status checks** configured on GitHub? Not representable in-repo.
- Is `vars.VERCEL_PROJECT_ID_HQ` set? `deploy-hq` silently self-skips when it is not (`ci.yml:303–309`).
- Has any **manual screen-reader pass** ever been performed?
- What is the **actual React version floor** customers need — 18 or 19?
- Is there a **design source of truth** (Figma library)? No evidence in-repo, and `DESIGN.md` is a template rather than a filled contract.

---

## 15. Recommended target architecture

### 15.1 Package topology

```
packages/
├── core/          @oxygenui/core          L0/L1 · zero deps · no React, no DOM
│                    ├── tokens (re-export)     · art geometry + viewBoxes
│                    ├── state machines         · the loading gate, disclosure, focus order
│                    ├── ARIA contracts         · role/name/value shapes per component
│                    └── styles/*.css           · the ONE stylesheet, channel-agnostic
│
├── react/         @oxygenui/react         peerDeps: react ^18 || ^19
│                    thin bindings over core · forwardRef · SSR-safe · tree-shakeable
│                    └── generates ──► registry/oxygen/**  (shadcn copy-source view)
│
├── elements/      @oxygenui/elements      custom elements over the same core
│                    lazy class definition · declarative shadow DOM · SSR-safe
│
├── vue/           @oxygenui/vue           OPTIONAL — typed wrappers, added on demand
├── angular/       @oxygenui/angular       OPTIONAL — same
│
├── tokens/        @oxygenui/tokens        DTCG source → CSS/JS/JSON/Tailwind/Figma
├── fhir/          @oxygenui/fhir          already published
├── intl/          @oxygenui/intl          NEW — message catalog + useTerm (ADR 0008)
└── (private) component-meta · eslint-plugin · fixtures · tsconfig
```

**Decision: consolidate on the `@oxygenui` npm scope** if it can be secured, keeping `@oxygenui-design/*` as deprecated aliases that re-export. If it cannot be secured, standardise on `@oxygenui-design/*` **and change the shadcn registry namespace to match**, because two similar-looking scopes is a supply-chain smell in a healthcare review.

### 15.2 The single-source rule

> **One behaviour source. Every channel is generated or a thin binding. No component's logic is written twice.**

This is the single most important architectural change. Today: `registry/oxygen/lib/loader.tsx` and `packages/loaders/src/base.ts` are twins. Target: `packages/core` owns the gate, the geometry, the ARIA contract, and the CSS; `react` and `elements` bind to it; `registry/` is **generated output**, not source.

The existing parity test becomes a _regression net during migration_, then largely retires.

### 15.3 Component anatomy (target)

```
packages/react/src/components/pulse-loader/
├── index.ts                     generated barrel
├── pulse-loader.tsx             binding only — no geometry, no timing
├── pulse-loader.meta.ts         source of truth for docs/registry
├── pulse-loader.stories.tsx     ← NEW: docs + VRT + a11y + interaction fixture
├── pulse-loader.test.tsx        unit + integration
└── pulse-loader.api.md          ← NEW: api-extractor report, committed, diff = review
```

### 15.4 Layer enforcement

Add `dependency-cruiser` with a rule set that makes ARCHITECTURE §2 executable rather than aspirational:

```js
// .dependency-cruiser.cjs — forbidden edges
{ name: "core-holds-no-react",   from: { path: "^packages/core" },   to: { path: "react" } },
{ name: "no-upward-imports",     from: { path: "^packages/core" },   to: { path: "^packages/(react|elements|vue|angular)" } },
{ name: "registry-is-generated", from: { path: "^registry" },        to: { path: "^packages/(?!.*generated)" } },
```

---

## 16. Recommended engineering and governance standards

The full standard belongs in a committed document — **`ENGINEERING.md`** — outlined in §16.10. The substance:

### 16.1 Component structure

Every component is one directory containing exactly: implementation, `meta.ts`, stories, test, optional CSS, optional `api.md`. No variants of this layout. Scaffolded by `pnpm gen:component`, never by hand.

### 16.2 File and folder naming

`kebab-case` directories and files; the directory name **is** the registry name, the URL slug, and the npm subpath (already enforced: `load.ts` fails if `meta.name !== directory`). React components `PascalCase`; hooks `useCamelCase`; custom elements `ox-kebab-case`; CSS classes `ox-<component>__<part>`; custom properties `--ox-<component>-<property>`.

### 16.3 Component and prop naming

- Booleans read as state or ability: `showLabel`, `disabled`, `lockScroll` — never `isX`/`hasX` in public props.
- Time carries units: `delay`, `minDuration`, `slowAfter` (ms implied and documented).
- Enums are lowercase string unions, never booleans-that-should-be-enums: `mode="inline|overlay|page"`, not `overlay + page` booleans.
- Handlers are `onX` and describe the event, not the intent: `onSlow`, `onOpenChange`.
- Every component accepts `className`, `style`, `id`, and `data-*`/`aria-*` passthrough, and forwards `ref`.
- Clinical vocabulary follows `CONTENT.md` §7 register rules; user-visible strings go through `@oxygenui/intl`.

### 16.4 Public API design

- Controlled/uncontrolled pairs are `value` + `defaultValue` + `onValueChange`.
- Composition over configuration past three related props.
- Everything exported from a package entry point is public and semver-protected; internals are marked `@internal` and excluded by `api-extractor`.
- **No component fetches, reads the environment, logs, or injects HTML** (already lint-enforced — extend to all packages).

### 16.5 Breaking-change management

Classified in ADR 0006 terms and made mechanical:

| Change                            | Semver                                | Required                                         |
| --------------------------------- | ------------------------------------- | ------------------------------------------------ |
| New optional prop                 | minor                                 | changeset                                        |
| New required prop                 | **major**                             | migration guide + codemod                        |
| Rename/remove prop or export      | **major**                             | deprecate ≥1 minor first, `api.md` diff reviewed |
| Default value change              | **major** if output changes           | migration note                                   |
| Visual change beyond token values | minor + VRT baseline update, reviewed |                                                  |
| Token rename                      | **major** for `--ox-*` public tokens  | alias for one major                              |
| ARIA/role change                  | **major**                             | a11y re-verification                             |

Support window: current major + previous major for 12 months.

### 16.6 Documentation templates

Every component page must have: purpose, when to use / when not to, live preview of **every** declared state, full props table (generated), accessibility notes, keyboard map (where interactive), i18n notes, install command, source, related components. A component cannot reach `stable` without all of them — machine-checkable from `meta.ts` + `coverage.json`.

### 16.7 Testing requirements (per stability tier)

|                                        | experimental | beta | stable |
| -------------------------------------- | ------------ | ---- | ------ |
| Unit tests                             | ✅           | ✅   | ✅     |
| Contract suite                         | ✅           | ✅   | ✅     |
| Stories, all states                    | —            | ✅   | ✅     |
| axe per story × 2 themes × 3 densities | —            | ✅   | ✅     |
| VRT baselines                          | —            | —    | ✅     |
| Interaction tests (if interactive)     | —            | ✅   | ✅     |
| Type tests                             | —            | —    | ✅     |
| `api.md` committed                     | —            | —    | ✅     |
| Coverage ≥ 90% lines / 85% branches    | —            | ✅   | ✅     |
| Manual SR pass recorded                | —            | —    | ✅     |

Enforced by `pnpm gen --strict` in CI. **Turning `--strict` on is the acceptance criterion for Phase 2.**

### 16.8 Accessibility requirements

WCAG 2.2 AA is the floor for every component: zero axe violations across themes and densities; forced-colors verified; `prefers-reduced-motion` with a _designed_ state; keyboard path documented and tested; visible focus; 200% zoom and 320 px reflow; SR pass on NVDA + JAWS + VoiceOver before `stable`; published VPAT per release.

### 16.9 Process standards

**Commits** — Conventional Commits, enforced by `commitlint` + `husky`. **PRs** — template requiring: what changed, why, screenshots/VRT diff for visual changes, a11y impact, breaking-change classification, changeset attached. **Review** — `CODEOWNERS` requires a design-system maintainer on anything under `packages/core`, `packages/react`, `packages/tokens`, or `registry/`. **Checklist** (in the PR template): API follows §16.3 · a11y verified · states documented in `meta.ts` and shown in stories · tests at the tier bar · no new dependency without an ADR · changeset present · no token tier violation · copy follows `CONTENT.md`. **Releases** — Changesets; every published change needs a changeset (CI-enforced); release notes generated with `@changesets/changelog-github`; a maintainer approves the version PR. **Deprecation** — ADR 0006 sequence: announce in a minor with a console-free runtime warning path, document the replacement, ship a codemod, remove in the next major, minimum two minors' notice. **Security** — `SECURITY.md` with a private disclosure address, 90-day embargo, and a supported-versions table.

### 16.10 The `ENGINEERING.md` standard document

Create one document at the repository root that every future contribution is evaluated against, with these sections (each ~½–2 pages):

1. Purpose and scope · 2. Architecture invariants (layer rule, single-source rule, zero-runtime-dependency rule) · 3. Component anatomy · 4. Naming standards · 5. Public API design rules · 6. Accessibility bar · 7. Content and clinical copy (links `CONTENT.md`) · 8. Tokens and theming rules · 9. Testing requirements by tier · 10. Documentation requirements · 11. Performance budgets · 12. Security constraints · 13. Versioning and breaking changes · 14. Deprecation policy · 15. Release process · 16. CI quality gates (the authoritative list) · 17. PR and review checklist · 18. Commit conventions · 19. Dependency policy (new runtime deps require an ADR) · 20. ADR process · 21. Definition of done (per component / per PR / per release).

It should open with a one-page **"Definition of Done"** checklist, because that is the part people will actually read.

---

## 17. Prioritized implementation plan

### 🔴 Critical blockers — this week

| #   | Task                                                 | Effort |
| --- | ---------------------------------------------------- | ------ |
| 1   | Fix the Node/SSR crash (C1) + add a Node-import test | 0.5 d  |
| 2   | Fix `deploy-docs` registry verification (C2)         | 0.5 d  |
| 3   | Fix props extraction (C3)                            | 1 d    |
| 4   | Add quality gates to `release.yml` (C4)              | 0.5 d  |
| 5   | Resolve the critical/high advisories (C5)            | 1 d    |
| 6   | Rewrite `README.md` (C6)                             | 0.5 d  |
| 7   | Secure the `@oxygenui` npm scope                     | 0.5 d  |
| 8   | `SECURITY.md` + private disclosure channel           | 0.5 d  |

### 🟠 High priority — weeks 2–8

React npm package · Storybook + stories for all 5 · arm `gen --strict` · VRT · coverage thresholds + remove `passWithNoTests` · governance file set · dependency scanning + CodeQL + SBOM · lint rules applied to all shipped packages · `packages/tokens` tarball gate · i18n package · CHANGELOG + migration guide practice.

### 🟡 Medium — quarter 2

`packages/core` consolidation · framework smoke apps (React/Vue/Angular/Svelte/HTML) · `api-extractor` · `dependency-cruiser` · `size-limit` · matrix CI (Node 20/22, Chromium/Firefox/WebKit) · commit hooks · turbo `globalEnv` + remote cache · browserslist + `color-mix` fallbacks · VPAT · docs versioning.

### 🟢 Nice to have

Figma token sync · CDN/UMD build · container-query responsive layer · `@oxygenui/vue` and `@oxygenui/angular` typed wrappers · public roadmap · Chromatic.

### 🔵 Long-term

Open-source launch (needs `apps/hq` extraction + history rewrite) · Pro tier · MCP/agent distribution beyond `llms.txt` · design-token round-tripping with Figma · community governance.

---

## 18. Phased roadmap

### Phase 0 — Stop the bleeding (1 week)

- **Objective:** Nothing shipped is broken; nothing published is unsafe.
- **Scope:** C1–C8 plus npm-scope registration and `SECURITY.md`.
- **Tasks:** SSR guard + Node-import test · registry verification rewrite · `props.ts` fix + regression test asserting `pulse-loader` documents ≥15 props · release-workflow gates · dependency upgrades · README rewrite · npm scope · `SECURITY.md`.
- **Deliverables:** Green CI on `main`; `@oxygenui-design/loaders@0.1.0` published and importable in Node; accurate props tables.
- **Dependencies:** None.
- **Acceptance criteria:** `node -e "import('@oxygenui-design/loaders')"` succeeds · `pnpm audit --audit-level=high` exits 0 · docs props table for `pulse-loader` shows ≥15 rows · a fresh `main` push deploys green.
- **Risks:** Upgrading `vitest` 2→3 may need test adjustments (medium; timebox 1 day, else pin transitive deps via `pnpm.overrides`).
- **Effort:** 6 person-days. **Priority:** P0.
- **DoD:** All eight critical items closed, verified by command output pasted in the PR.

### Phase 1 — The React package and the quality gate (3 weeks)

- **Objective:** React consumers can `npm install`; the catalog gate can be armed.
- **Scope:** `packages/react`; Storybook; stories for all five; coverage thresholds; lint coverage for all shipped packages.
- **Tasks:** Extract `packages/react` with `peerDependencies: react ^18 || ^19` · generate `registry/` from it · Storybook 8 with a11y and interactions addons · stories covering every state in each `meta.ts` · `pnpm gen --strict` in CI · coverage thresholds (90/85) and remove `passWithNoTests` · extend `eslint.config.mjs` to `packages/{core,react,elements}/**` · `packages/tokens` tarball gate.
- **Deliverables:** `@oxygenui/react@0.1.0`; Storybook deployed; `--strict` armed.
- **Dependencies:** Phase 0.
- **Acceptance criteria:** `pnpm gen --strict` exits 0 · Storybook builds in CI · coverage gate fails on a deliberate regression · `eslint --print-config packages/elements/src/*.ts` lists the `@oxygenui` rules.
- **Risks:** Generating `registry/` from `packages/react` while keeping files self-contained is the hard part (high) — mitigate by generating with an import-inlining step and keeping the parity test until it is proven.
- **Effort:** 15 person-days. **Priority:** P0.
- **DoD:** A React consumer can install from npm **or** copy source, and both are byte-identical in behaviour, proven by the parity suite.

### Phase 2 — Single source and visual safety (4 weeks)

- **Objective:** No behaviour written twice; visual regressions cannot merge.
- **Scope:** `packages/core`; `packages/elements` rebuilt on it; VRT; framework smoke apps.
- **Tasks:** Extract core (geometry, gate, ARIA contracts, CSS) · rebuild both channels as bindings · Playwright config + VRT baselines per story × theme × density with animations paused deterministically · five smoke apps in CI (React 18, React 19, Vue 3, Angular 18, SvelteKit) each asserting render + SSR + a11y · `api-extractor` reports committed · `dependency-cruiser`.
- **Deliverables:** `@oxygenui/core`; VRT in CI; smoke apps.
- **Dependencies:** Phase 1.
- **Acceptance criteria:** Deleting a line of core breaks both channels' tests · VRT catches a 1 px change · every smoke app SSRs without error · `api.md` diffs appear in PRs.
- **Risks:** VRT flakiness (high) — mitigate with pinned browser, frozen time, `getAnimations()` pause, fixed viewport, and font subsetting, as ADR 0007 already prescribes.
- **Effort:** 20 person-days. **Priority:** P1.
- **DoD:** `test/loader-parity.test.ts` can be deleted without loss of safety.

### Phase 3 — Enterprise and open-source readiness (4 weeks)

- **Objective:** Survive a Netsmart/CVS procurement review and a public launch.
- **Scope:** i18n; governance; security posture; accessibility evidence; docs.
- **Tasks:** `@oxygenui/intl` + `useTerm` + extract all hardcoded strings (**do this now — 5 components, not 50**) · `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SUPPORT`, `GOVERNANCE`, `CODEOWNERS`, PR + issue templates · Dependabot/Renovate + CodeQL + SBOM (CycloneDX) + pin all actions to SHAs + `permissions:` blocks + fix the script injection · manual SR pass (NVDA/JAWS/VoiceOver) recorded · VPAT/ACR published · forced-colors, 200% zoom, 320 px reflow tests · `CHANGELOG.md` + migration-guide template + docs versioning · `ENGINEERING.md` · ratify the 8 proposed ADRs.
- **Deliverables:** Governance set; VPAT; SBOM per release; `ENGINEERING.md`.
- **Dependencies:** Phase 1 (i18n touches every component).
- **Acceptance criteria:** No hardcoded user-visible English in any shipped package · CodeQL and SBOM run per release · VPAT published · every ADR `accepted` or `superseded`.
- **Risks:** i18n retrofit is invasive (medium) — but the cost only grows; ADR 0008 makes the case.
- **Effort:** 20 person-days. **Priority:** P1.
- **DoD:** A security questionnaire and an accessibility questionnaire can both be answered from published artifacts.

### Phase 4 — Catalog breadth (ongoing, starts after Phase 2)

- **Objective:** Enough components to be adoptable.
- **Scope:** Rebuild the foundations layer, then the clinical layer, on the new architecture.
- **Sequence:** primitives (Button, Input, Select, Checkbox, Radio, Dialog, Tooltip, Popover, Table, Tabs, Skeleton, EmptyState, Alert, Badge) → clinical (StatusBadge, AbsentValue, ClinicalValue, ReferenceRange, ClinicalTime, IdentityToken, PatientBanner, VitalsPanel, ObservationTrend) → patterns.
- **Acceptance criteria per component:** meets the §16.7 tier bar; nothing merges below `beta`.
- **Effort:** ~2–3 person-days per component at `beta`, ~4–5 at `stable`.
- **Priority:** P2 — **and explicitly not before Phase 2.**

### Phase 5 — Open-source launch (2 weeks, gated)

Extract `apps/hq` to its own repository (`git filter-repo`), audit history for secrets, review the three root HTML strategy documents, publish the roadmap, decide DCO vs CLA, and announce. **Gate: Phases 0–3 complete and zero high advisories.**

---

## 19. Estimated effort, dependencies, and sequencing

| Phase                         | Effort   | Calendar (1 FTE) | Calendar (2 FTE) | Blocks     |
| ----------------------------- | -------- | ---------------- | ---------------- | ---------- |
| 0 — Stop the bleeding         | 6 d      | 1 week           | 3 days           | everything |
| 1 — React package + gate      | 15 d     | 3 weeks          | 1.5 weeks        | Phase 2, 3 |
| 2 — Single source + VRT       | 20 d     | 4 weeks          | 2 weeks          | Phase 4    |
| 3 — Enterprise/OSS ready      | 20 d     | 4 weeks          | 2 weeks          | Phase 5    |
| 4 — Catalog breadth           | ongoing  | —                | —                | —          |
| 5 — OSS launch                | 10 d     | 2 weeks          | 1 week           | —          |
| **Total to enterprise-ready** | **61 d** | **~14 weeks**    | **~7 weeks**     |            |

```
Week:  1    2    3    4    5    6    7    8    9   10   11   12   13   14
P0    ██
P1        ████████████
P2                    ████████████████
P3                    ████████████████          ← runs parallel to P2 (different skills)
P4                                    ████████████████████►
P5                                                        ████████
```

Phases 2 and 3 parallelise cleanly: Phase 2 is architecture/testing work, Phase 3 is governance/i18n/docs work. With two engineers, enterprise-ready lands in **~7 weeks**.

---

## 20. Current-state scorecard

| Category                         | Score    | Evidence                                                                                                                                                             | Why this score                                                                                                                                                                                                                                                                                | Key gap blocking higher                                                                                                                                                                          | Recommended improvement                                                           |
| -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **Architecture**                 | **6/10** | `scripts/gen/` 16 files; layer rule upheld (`fhir`/`tokens` hold no React); ADR set                                                                                  | The spine is excellent and the generator genuinely makes adding a component touch one directory. Undermined by two hand-written implementations and no `packages/react`.                                                                                                                      | Duplicate implementations; layer rule documented but unenforced (no `dependency-cruiser`)                                                                                                        | `packages/core` single-source (Phase 2)                                           |
| **Framework interoperability**   | **3/10** | `node -e import` → `ReferenceError`; no `packages/react`; zero smoke apps                                                                                            | Multi-framework support is _claimed in the README_ and **broken in every SSR framework named**. React cannot install from npm at all.                                                                                                                                                         | The SSR crash; the missing React package; zero verification                                                                                                                                      | C1 fix + Phase 1 + smoke apps                                                     |
| **Component quality**            | **6/10** | 439 tests; clamped inputs; designed reduced-motion; size-based degradation                                                                                           | The five that exist are thoughtfully built and well tested. But five components in one category is not a library.                                                                                                                                                                             | Breadth; no stories; no VRT                                                                                                                                                                      | Phase 1–2, then Phase 4                                                           |
| **API consistency**              | **7/10** | Shared `LoaderCommonProps`; consistent naming; enum-not-boolean modelling                                                                                            | Genuinely consistent and well-named across all five.                                                                                                                                                                                                                                          | No `ref` forwarding; React/element event asymmetry; no documented API standard; test helpers exported as public API                                                                              | §16.3–16.4 standard + `api-extractor`                                             |
| **UI/UX consistency**            | **5/10** | One category only; docs site well-crafted; dead status-style map found                                                                                               | Cannot be demonstrated with one component family. Density and theme systems are real and applied.                                                                                                                                                                                             | Breadth; no responsive strategy implemented; no Figma source of truth                                                                                                                            | Phase 4 + container-query layer                                                   |
| **Accessibility**                | **5/10** | axe in CI 9 pages × 2 themes passing; 42 jsdom axe runs; designed reduced-motion; forced-colors CSS — **but focus ring measures 2.50:1 against a 3:1 requirement**   | The component-level work is exemplary; the _palette_ has three shipping AA failures the gate does not check, and the focus indicator affects every future interactive component. Verified axe passes are real but do not exercise these pairs.                                                | The three C7 failures; high-contrast theme unreachable and unaudited; no SR testing; no VPAT; no forced-colors/zoom/reflow verification; Chromium-only                                           | Fix C7 and widen the contrast gate; then Phase 3 evidence package                 |
| **Design tokens & theming**      | **6/10** | 443 source tokens → 313 CSS properties; 4 tiers; 3 themes; 3 densities; 6 validator checks incl. contrast + 60° hue separation; zero hardcoded hex in shipped source | The pipeline architecture and its enforcement are genuinely excellent. The score is held down by _delivery_: the published package predates the pipeline and ships a known bug, the brand axis in ADR 0005 does not exist, high-contrast is unreachable, and 4 of 5 outputs have no consumer. | Stale published package (C8); missing brand axis; not DTCG-compliant so no Figma/Style Dictionary interop; Tailwind emit mis-namespaced; unresolved aliases in `tokens.json`; no validator tests | Republish; build the brand axis; make the emit spec-compliant; test the validator |
| **Code quality**                 | **7/10** | `strict` + `noUncheckedIndexedAccess`; 0 lint problems; 0 `any`; excellent comments                                                                                  | High standard, consistently applied, with domain-specific rules most teams never write.                                                                                                                                                                                                       | Shipped npm source gets **no** Oxygen rules; `--max-warnings 35`; duplicated helpers; CSS-in-string                                                                                              | Fix eslint globs; ratchet to 0; Phase 2 dedupe                                    |
| **Documentation**                | **4/10** | 30 KB ARCHITECTURE + 9 ADRs; docs site with live previews                                                                                                            | Internal docs are outstanding; **consumer docs are wrong** — props tables show 1 of 20 props and the README installs a deleted component.                                                                                                                                                     | C3, C6; no CHANGELOG, migration guides, versioning, getting-started                                                                                                                              | Phase 0 + Phase 3                                                                 |
| **Test coverage & reliability**  | **5/10** | 439 tests passing; parity suite caught 2 real bugs                                                                                                                   | The tests that exist are high quality and well-reasoned. The pyramid has one layer.                                                                                                                                                                                                           | 0 stories, 0 VRT, 0 E2E, 0 interaction, no thresholds, `passWithNoTests`, **no Node-env test (why C1 shipped)**                                                                                  | Phase 1–2                                                                         |
| **Performance**                  | **6/10** | 8.1 KB gz/loader; compositor-only animation; tab-visibility pause                                                                                                    | Good measured numbers and correct animation properties.                                                                                                                                                                                                                                       | No budgets enforced; no frame-rate/CLS testing; imperfect subpath shaking                                                                                                                        | `size-limit` + Playwright perf traces                                             |
| **NPM packaging**                | **4/10** | `fhir` published; `sideEffects: true` correct; provenance configured; tarball checks                                                                                 | The publishing _discipline_ (check-tarball, ESM extension fix, pnpm guard) is excellent.                                                                                                                                                                                                      | Package is broken in Node; `@oxygenui` scope unclaimed; `tokens` unguarded; no React package; no `publint`/`attw`                                                                                | Phase 0 + 1                                                                       |
| **CI/CD**                        | **4/10** | 403-line CI with real gates incl. a11y + PHI; provenance/OIDC correct                                                                                                | Substantive gates exist and mostly work.                                                                                                                                                                                                                                                      | **`main` is broken**; release bypasses every gate; no permissions blocks; injection; no matrix/scanning/coverage; deployed ≠ tested bytes                                                        | Phase 0 + Phase 3 hardening                                                       |
| **Release management**           | **4/10** | Changesets + provenance; check-tarball; ADR 0006 defines tiers                                                                                                       | The mechanism is right and the stability-tier thinking is good.                                                                                                                                                                                                                               | No CHANGELOG; nothing released; no changeset enforcement; private packages versioned by misconfiguration                                                                                         | Phase 3                                                                           |
| **Security**                     | **3/10** | `no-forbidden-capability` is genuinely strong; PHI scan; synthetic-data policy                                                                                       | The _component_ security story is better than most commercial libraries. Everything around it is unhardened.                                                                                                                                                                                  | 1 critical + 5 high advisories; no SECURITY.md; no scanning/SAST/SBOM; unpinned actions; script injection                                                                                        | Phase 0 + Phase 3                                                                 |
| **Open-source readiness**        | **1/10** | LICENSE only                                                                                                                                                         | Nothing but a licence.                                                                                                                                                                                                                                                                        | Every governance file; `apps/hq` in-repo; advisories; internal docs at root                                                                                                                      | Phase 3 + Phase 5                                                                 |
| **Developer experience**         | **5/10** | `pnpm gen:component`; turbo; fast tests (1.7 s)                                                                                                                      | Contributor loop is fast and scaffolding exists.                                                                                                                                                                                                                                              | No Storybook; no commit hooks; no `.nvmrc`/`.editorconfig`; no contributor docs; cold CI cache                                                                                                   | Phase 1 + Phase 3                                                                 |
| **Governance & maintainability** | **3/10** | 9 ADRs; stability tiers; deprecation policy documented                                                                                                               | The _thinking_ is done and written down.                                                                                                                                                                                                                                                      | 8 ADRs unratified; no CODEOWNERS/review policy; no deprecation ever exercised; quality gate unarmable                                                                                            | §16 + Phase 3                                                                     |

**Unweighted mean across 18 categories: 4.7 / 10.**

---

## 21. Target-state scorecard

| Category                     | Now | Target | Largest single lever                                                 |
| ---------------------------- | --- | ------ | -------------------------------------------------------------------- |
| Architecture                 | 6   | **9**  | `packages/core` single-source                                        |
| Framework interoperability   | 3   | **9**  | SSR fix + React package + smoke apps                                 |
| Component quality            | 6   | **9**  | Stories + VRT + breadth                                              |
| API consistency              | 7   | **9**  | `api-extractor` + written API standard                               |
| UI/UX consistency            | 5   | **8**  | Breadth + responsive layer                                           |
| Accessibility                | 5   | **9**  | Fix the palette failures + widen the contrast gate; SR matrix + VPAT |
| Design tokens & theming      | 6   | **9**  | Republish; brand axis; DTCG-compliant emit; validator tests          |
| Code quality                 | 7   | **9**  | Lint all shipped packages; ratchet to 0                              |
| Documentation                | 4   | **9**  | Fix props extraction; CHANGELOG; versioned docs                      |
| Test coverage & reliability  | 5   | **9**  | Stories → VRT + a11y + interaction; thresholds                       |
| Performance                  | 6   | **9**  | `size-limit` budgets in CI                                           |
| NPM packaging                | 4   | **9**  | React package + scope + `publint`                                    |
| CI/CD                        | 4   | **9**  | Release gates + matrix + scanning + artifact promotion               |
| Release management           | 4   | **9**  | CHANGELOG + changeset enforcement + first real release               |
| Security                     | 3   | **9**  | Advisories + SECURITY.md + SBOM + SHA pinning (CodeQL: see below)    |
| Open-source readiness        | 1   | **9**  | The governance file set                                              |
| Developer experience         | 5   | **9**  | Storybook + hooks + contributor docs                                 |
| Governance & maintainability | 3   | **9**  | `ENGINEERING.md` + CODEOWNERS + ratified ADRs                        |

**Target unweighted mean: 8.9 / 10.**

### A correction on CodeQL

The remediation added `.github/workflows/codeql.yml`, and an earlier revision of
this report counted it as delivered. It is not, and the distinction matters for
a security questionnaire.

Uploading CodeQL results requires code scanning to be enabled, and on a
**private** repository that requires GitHub Advanced Security. `zoworkhq/oxygenui`
is private and owned by a personal account, where GHAS is not available — so the
analysis ran for four minutes on every pull request and then failed on the
upload with `Code scanning is not enabled for this repository`.

The workflow is now conditional. It skips while neither condition holds, and
arms itself with no further action when either does:

- the repository goes public (Phase 5), which makes code scanning free; or
- Advanced Security is enabled and the repository variable `ENABLE_CODEQL` is
  set to `true`.

Leaving it red was the worse option. A check that always fails is a check
everybody learns to scroll past, and the next failure scrolls past with it —
the same reasoning that keeps the darwin visual-regression baselines out of CI.

**What actually stands in for SAST today:** `pnpm audit --audit-level=high` as a
blocking gate, dependency-cruiser layer rules, the `no-forbidden-capability`
lint rule (which caught a real XSS vector in the signature manifest during
implementation), and the PHI regex scan. That is a defensible answer to a vendor
questionnaire. "We run CodeQL" is not yet one.

### Where the gains actually come from

| Investment                             | Effort | Categories moved                                                                    | Δ        |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------- | -------- |
| **Phase 0 critical fixes**             | 6 d    | Framework interop, Documentation, Security, CI/CD, Packaging, Accessibility, Tokens | **+1.3** |
| **Storybook + stories + VRT**          | 12 d   | Testing, Component quality, DX, UI/UX, A11y                                         | **+1.0** |
| **React package + core consolidation** | 25 d   | Interop, Architecture, Packaging, API                                               | **+0.9** |
| **Governance + security file set**     | 8 d    | OSS readiness, Security, Governance                                                 | **+0.8** |
| **i18n**                               | 6 d    | A11y, Component quality, Architecture                                               | **+0.3** |

**The single highest-leverage week is Phase 0** — five days of work moves more score than any other five days, because it converts _broken_ into _working_ rather than _good_ into _better_.

### Definitions, in measurable terms

**Production-ready** — a team can adopt a component and not be surprised.
`pnpm audit --audit-level=high` exits 0 · zero axe violations across themes and densities · SSR verified in ≥3 frameworks · props documentation matches the type surface · coverage ≥90% lines / ≥85% branches with thresholds enforced · VRT baselines for every story · semver with a published CHANGELOG · CI green on `main`.

**Enterprise-ready** — a Netsmart or CVS procurement review passes.
All of the above, plus: published VPAT/ACR · SBOM per release · documented support window (current + previous major, 12 months) · security disclosure policy with SLA · signed/provenanced releases · no critical or high advisories · dependency scanning in CI · documented browser support matrix · SLA-backed issue triage · design-to-development workflow documented.

**Open-source-ready** — an outside contributor can land a PR unaided.
All of the above, plus: `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, `SUPPORT`, `GOVERNANCE`, `CODEOWNERS`, issue/PR templates · public roadmap · `ENGINEERING.md` as the contribution standard · no proprietary code in the repository or its history · commit convention enforced · a first-time contributor can go from clone to green PR using only committed documentation.

---

## 22. Risks and mitigation strategies

| #   | Risk                                                                                   | Likelihood              | Impact                                                 | Mitigation                                                                                                             |
| --- | -------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | **An enterprise pilot starts before Phase 0** and hits the SSR crash                   | High                    | Critical — first impression with a named account       | Fix C1 this week; do not demo the npm package until then                                                               |
| 2   | **Breadth is prioritised over foundation** — 40 components on the current architecture | Medium                  | Critical — 40× the duplication debt                    | Hard gate: no new component category before Phase 2 completes                                                          |
| 3   | **The two implementations diverge silently**                                           | High (already twice)    | High                                                   | Parity suite now; `packages/core` in Phase 2                                                                           |
| 4   | **i18n is deferred past 50 components**                                                | Medium                  | High — ADR 0008 quantifies it as "an enormous project" | Do it at 5 components, in Phase 3                                                                                      |
| 5   | **Procurement stalls on VPAT/SBOM**                                                    | High                    | High — blocks revenue, not just adoption               | Phase 3 produces both as release artifacts                                                                             |
| 6   | **Open-sourcing exposes `apps/hq`** or the internal strategy documents                 | Medium                  | High — proprietary code and commercial strategy        | Extract before launch; history rewrite; review the three root HTML files                                               |
| 7   | **`@oxygenui` npm scope taken by a third party**                                       | Medium                  | High — name-confusion attack surface                   | Register this week                                                                                                     |
| 8   | **Single-maintainer bus factor**                                                       | High                    | High                                                   | `ENGINEERING.md` + ADRs + CODEOWNERS; the generator already lowers onboarding cost                                     |
| 9   | **VRT becomes flaky and is ignored**                                                   | Medium                  | Medium — the classic VRT failure                       | Determinism prescribed in ADR 0007: pinned browser, frozen time, paused animations, fixed viewport, subset fonts       |
| 10  | **Name conflict with wso2/oxygen-ui and the Oxygen trademark**                         | Known, accepted         | Medium                                                 | Per the recorded strategy: never brand as bare "Oxygen", stay out of the page-builder category, own the FHIR long tail |
| 11  | **`--max-warnings 35` ratchet drifts upward**                                          | Medium                  | Low                                                    | Ratchet down each release; target 0 by Phase 2                                                                         |
| 12  | **Docs site outage takes down the install channel**                                    | Low                     | High — `oxygenui.design/r/*` is the CDN                | Split the registry onto its own origin or a dedicated CDN bucket                                                       |
| 13  | **The two token channels drift again** — npm stale while shadcn is current             | High (already happened) | High — a customer's overlays render transparent        | Make "a changeset exists for every changed publishable package" a CI gate                                              |
| 14  | **A palette change silently breaks contrast** in a pair the gate does not check        | High                    | Critical in a clinical UI                              | Widen the gate to every foreground/background pair the system actually composes, and unit-test the validator           |

---

## 23. Immediate next steps

### This week — one engineer, five days

| Day | Task                                                                                                                                                        | Verification                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | **Fix C1** — lazy element definition behind a DOM guard; add `packages/loaders/test/ssr.test.ts` running in the `node` environment                          | `node -e "import('./dist/index.js')"` exits 0                                 |
| 1   | **Register the `@oxygenui` npm scope**                                                                                                                      | `npm org ls`                                                                  |
| 2   | **Fix C3** — `props.ts` include rule; add a regression test                                                                                                 | `pulse-loader` catalog entry lists ≥15 props                                  |
| 2   | **Fix C2** — verify `index.json` against `registry.json` instead of a named component                                                                       | Dry-run the workflow step locally                                             |
| 3   | **Fix C5** — upgrade `vitest`/`next`; add `pnpm audit --audit-level=high` to CI                                                                             | `pnpm audit` clean at high                                                    |
| 3   | **Fix C4** — release workflow gets the full gate set, or `needs` a reusable CI workflow                                                                     | Inspect the workflow run                                                      |
| 4   | **Rewrite `README.md`**; add `SECURITY.md`, `.nvmrc`, `.editorconfig`                                                                                       | Install command in README works verbatim                                      |
| 4   | **Fix the eslint globs** so `packages/**` shipped source gets the Oxygen rules                                                                              | `eslint --print-config` lists them                                            |
| 5   | **Fix C7** — darken `focus-ring`, `accent`, and `border-strong`; extend `checkTextContrast` to focus, border, and on-accent pairs; add validator unit tests | `contrast.json` shows ≥3:1 for focus and borders, ≥4.5:1 for `text-on-accent` |
| 5   | **Fix C8** — changeset + republish `@oxygenui-design/tokens`; add `main`/`types`/build/`check-tarball.mjs`                                                  | `npm view` shows 6 exports and the current CSS                                |
| 5   | **Publish `@oxygenui-design/loaders@0.1.0`** and verify from a clean project in Vue, Angular, and Node                                                      | Fresh `npm install` in a scratch app                                          |

### Decisions needed from leadership before Phase 1

1. **npm scope** — consolidate on `@oxygenui` (if securable) or standardise on `@oxygenui-design` and align the registry namespace. _Recommendation: `@oxygenui`, with the registry namespace matching._
2. **React version floor** — 18 or 19? Determines `peerDependencies` and whether custom elements are a viable React path. _Recommendation: `^18 || ^19`._
3. **Open-source timing** — before or after the first enterprise pilot? Determines whether Phase 5 blocks Phase 4. _Recommendation: after; use pilots to harden the API first._
4. **Headcount** — one engineer means enterprise-ready in ~14 weeks; two means ~7. _Recommendation: two, because Phases 2 and 3 need different skills and parallelise cleanly._
5. **Component priority for Phase 4** — foundations first (Button/Input/Dialog/Table) or clinical first (StatusBadge/PatientBanner/VitalsPanel)? _Recommendation: foundations, because the clinical components compose them and the POC catalog already proved the clinical layer is achievable._

### The one-sentence summary for leadership

> Oxygen UI has an architecture worth building on and a governance layer that does not yet exist; five days of critical fixes and roughly seven weeks of two-engineer work turn a promising internal project into something Netsmart or CVS can be shown without caveats.

---

_Prepared by direct repository inspection. Every finding is reproducible from the commands and file references cited. Findings marked 🔴 were verified by execution, not by reading._
