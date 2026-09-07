<div align="center">

<h1>ZoBlocks</h1>

**Healthcare components that already know what the data means.**

React components typed to FHIR R4, delivered as source you own.<br />
Built for the states a demo skips — the preliminary result, the missing<br />
reference range, the restricted record, the patient who refused to sign.

[![CI](https://github.com/zoworkhq/zoblocks/actions/workflows/ci.yml/badge.svg)](https://github.com/zoworkhq/zoblocks/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)](packages/tsconfig/base.json)
[![Tests](https://img.shields.io/badge/tests-1%2C635%20passing-brightgreen.svg)](#quality-is-a-gate-not-a-goal)
[![Coverage](https://img.shields.io/badge/coverage-gated%2090%25%2F85%25-brightgreen.svg)](#quality-is-a-gate-not-a-goal)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG%202.2-AA%20tested-success.svg)](#accessibility-is-tested-not-claimed)
[![FHIR R4](https://img.shields.io/badge/FHIR-R4-e6007e.svg)](packages/fhir)
[![Status](https://img.shields.io/badge/status-pre--release-orange.svg)](#status)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**Documentation**](https://zoblocks.design) · [**Architecture**](ARCHITECTURE.md) · [**Engineering standard**](ENGINEERING.md) · [**Decisions**](content/decisions/)

</div>

---

## The problem

Most component libraries render a value. They have no opinion about a result
that came back preliminary, a reference range that doesn't exist, a record
flagged restricted, or a potassium of 6.8.

In healthcare those aren't edge cases. They are the normal working set — and
every one of them fails the same way: **it renders perfectly and says something
false.** A blank cell is indistinguishable from a rendering bug. An empty
signature field is indistinguishable from a patient who refused. A severity
carried by colour alone disappears in forced-colors mode.

ZoBlocks is built around those states rather than around the happy path, and
the invariants are enforced by lint rules and failing builds rather than by code
review.

```tsx
import { Signature, signatureRequired } from "@zoblocks/signature";

<Form.Item name="consent" rules={[signatureRequired()]}>
  <Signature now={serverTime} meaning="consent" attestation="I agree to…" />
</Form.Item>;
```

That `signatureRequired()` accepts a **decline** as a valid answer. A rule that
demanded `outcome === "signed"` would make refusal impossible to submit — which
is the kind of defect this library exists to make unwritable.

---

## Four ideas, each enforced by something that fails

|                                    | The idea                                                                                         | What enforces it                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **Absence is a state**             | A missing value renders as explicitly missing, and _why_ it is missing is part of the value.     | `@zoblocks/no-absence-placeholder` — `{value ?? "—"}` is a lint error.          |
| **Never colour alone**             | Every severity carries an icon, a text label, and a second structural cue.                       | Contrast gate in the token build; forced-colors tested in three engines.        |
| **Don't infer clinical meaning**   | A stated interpretation always wins. Otherwise it is derived only from the value's own range.    | Component contract tests assert the safety claim, not the render.               |
| **Semantic tokens, never palette** | A component reaching past `--zb-status-critical` to `--zb-red-600` ignores every brand override. | `@zoblocks/no-primitive-token`; the brand axis has a worked example and a gate. |

---

## What ships today

### Loaders — five, paced to resting physiology

Not spinners. A spinner's tempo says _the system is working hard_; on a screen
where someone is waiting for their own results, that is the wrong sentence.

| Element            | Mark                         | Cadence  | For                                         |
| ------------------ | ---------------------------- | -------- | ------------------------------------------- |
| `<PulseLoader>`    | Open heart + rhythm line     | 60 bpm   | App boot, patient portals, the brand moment |
| `<RhythmLoader>`   | One rhythm strip, swept      | 60 bpm   | Clinical density, inline, tables            |
| `<BreathLoader>`   | Three rings from a soft core | 15 / min | Patient-facing screens, long waits          |
| `<HelixLoader>`    | Two strands of dots          | 23 / min | Labs, genomics, diagnostics                 |
| `<InfusionLoader>` | Capsule with a soft slug     | 21 / min | **Determinate progress** — imports, uploads |

Clamped to 40–100 bpm, nothing above 1.7 Hz (inside WCAG 2.3.1's three-flash
limit), and `prefers-reduced-motion` gets a **designed still state** rather than
a paused one.

### Signature — the outcomes a signature pad has no answer for

Draw, type or upload — and record the times nobody signed. The value is a
discriminated union over seven outcomes, not `string | null`:

```ts
signed · declined · unable · verbal · on-paper · pending · revoked
```

A patient who **refused to sign** and a form nobody opened are different facts
with different consequences. `unable` without a witness is a compile error.
Emits a FHIR transaction Bundle, because `Consent` carries no signature element
in R4 or R5 — only `Provenance.signature` does.

### Identity — the banner is a safety control, not a heading

A patient avatar, chip and banner. The banner is the last surface a clinician
reads before they act, so it is built like a control: two person-specific
identifiers before a care action are a **compile error**, not a review comment
(Joint Commission NPSG.01.01.01), and `Patient.gender` is not a renderable field
at all — it is administrative gender, and a bare "M" beside a dose is a
prescriber reading the wrong reference range.

```tsx
<PatientBanner patient={patient} context="action" identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}>
  <PatientGuard expect={openedFor.id}>
    <OrderForm />
  </PatientGuard>
</PatientBanner>
```

`PatientGuard` refuses to render when the chart on screen is not the chart the
form was opened for. `disambiguate()` keeps two patients who share a name apart
on a worklist, adding the minimum that separates them — full given name, then
date of birth, then identifier — and it handles the newborn-twins case that
colour and initials both fail. Absence is five states, not one fallback: a
photograph that **could not load** is not a record with **no photograph**, and
conflating them silently degrades a control that measurably reduces
wrong-patient orders.

**Not React?** The loaders also ship as dependency-free custom elements for Vue,
Angular, Svelte, or plain HTML — see [`@zoblocks/loaders`](packages/loaders/README.md).

---

## Install

Components are distributed as **source you own**. The CLI writes the files into
your project, pulls in anything they share, and adds any runtime dependencies.

Run once, to say where your `@/` import alias points:

```bash
npx @zoblocks/cli init
```

Then add components by name:

```bash
npx @zoblocks/cli add pulse-loader
```

The public catalog needs no configuration, no namespace, and no account.

<details>
<summary>Paid components</summary>

Pro components come from an authenticated registry. Mint a token with the
`registry` scope in the console under **Marketplace → Access tokens**, add the
namespace to `zoblocks.json`, and keep the token in your environment:

```jsonc
// zoblocks.json — committed; the token is not
"registries": {
  "@zoblocks-pro": {
    "url": "https://app.zoblocks.design/r/pro/{name}.json",
    "headers": { "Authorization": "Bearer ${ZOBLOCKS_TOKEN}" }
  }
}
```

```bash
ZOBLOCKS_TOKEN=zb_live_… npx @zoblocks/cli add @zoblocks-pro/vitals-flowsheet
```

</details>

<details>
<summary>Installing by URL</summary>

Any registry item can be named by its full URL instead, which is what a mirror
or a vendored copy of the catalog needs:

```bash
npx @zoblocks/cli add https://zoblocks.design/r/pulse-loader.json
```

</details>

Installing from the registry means you have forked, deliberately: the source is
yours to read and change, and no release we publish will reach it. For semver
and patches, install [`@zoblocks/react`](packages/react/README.md)
instead. Both channels are generated from the same source.

---

## Packages

| Package                    | What it is                                                                |
| -------------------------- | ------------------------------------------------------------------------- |
| `@zoblocks/cli`            | Installs components into your repo. Zero runtime dependencies.            |
| `@zoblocks/loaders`        | The five loaders as custom elements. Zero dependencies, SSR-safe.         |
| `@zoblocks/signature`      | Signature capture for Ant Design. antd is a peer dependency.              |
| `@zoblocks/signature-core` | The capture engine. No React, no antd, no DOM, no dependencies.           |
| `@zoblocks/identity`       | Patient avatar, chip and banner. No antd dependency; inherits its tokens. |
| `@zoblocks/identity-core`  | The identity engine. No React, no antd, no DOM.                           |
| `@zoblocks/tabs`           | Tabs that know what they are. Four semantic modes, eleven skins.          |
| `@zoblocks/tabs-core`      | The selection engine. No React, no DOM, no dependencies.                  |
| `@zoblocks/tabs-testing`   | Assertions that read a tab strip's accessibility tree.                    |
| `@zoblocks/react`          | Generated React package — same source as the registry, one build.         |
| `@zoblocks/fhir`           | FHIR R4 types and pure read helpers.                                      |
| `@zoblocks/tokens`         | Semantic clinical tokens: 3 themes × 3 densities × a brand axis.          |
| `@zoblocks/theme`          | Customer themes: the document model, ramp generator, validation and CSS.  |
| `@zoblocks/bridge-core`    | The theme-bridge contract. No framework, no React, no DOM.                |
| `@zoblocks/bridge-antd`    | Ant Design ↔ ZoBlocks, both directions. antd is an optional peer.         |
| `@zoblocks/bridge-mui`     | Material UI ↔ ZoBlocks, both directions. MUI is an optional peer.         |
| `@zoblocks/intl`           | Terminology that requires both a clinician and a patient phrasing.        |
| `@zoblocks/eslint-plugin`  | Eighteen rules enforcing the invariants above.                            |
| `@zoblocks/fixtures`       | Synthetic, non-PHI FHIR fixtures that over-represent the hard states.     |

### Theme bridges

A bridge is the only sanctioned way a UI framework reaches a ZoBlocks component.
It reads that framework's resolved theme and writes ZoBlocks's token surface —
nothing else crosses the boundary, so no component is swapped and no capability
is reduced to what two frameworks happen to share.

```tsx
// ZoBlocks components in your antd app's design language
<ConfigProvider theme={brand}>
  <AntdBridge>{app}</AntdBridge>
</ConfigProvider>

// ...and the inverse: your own antd components in your ZoBlocks brand
<ZoBlocksAntdProvider>{app}</ZoBlocksAntdProvider>
```

Switching framework changes the wrapper and nothing inside it —
`e2e/bridge-hosts.spec.ts` renders one application under antd, MUI and neither
and asserts the accessibility trees are identical.

**Clinical status is never bridged, in either direction.** Ours carries a
validated contrast floor and 60° of hue separation so the direction of an
abnormal result survives colour-vision deficiency; a framework's `colorError` has
neither, and going the other way a framework would apply ours to a form
validation message. See
[ADR 0012](content/decisions/0012-token-surface-is-a-contract.md).

---

## Quality is a gate, not a goal

Every number here is produced by CI on every pull request. None of it is
aspirational.

| Gate                    | What it holds                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **1,635 tests**         | Package tests, registry components rendered from the source customers receive, and story-derived a11y.                   |
| **Coverage thresholds** | 90% lines / 85% branches, enforced per package. The build fails below them.                                              |
| **Six frameworks**      | HTML, React 18, React 19, Vue, Angular, Svelte — each built by its own compiler, driven in Chromium, Firefox and WebKit. |
| **Contrast gate**       | 21 token pairs × 3 themes × every brand. A palette edit that breaks a floor does not build.                              |
| **Catalog gate**        | `pnpm gen --strict` — a beta component without a story cannot merge.                                                     |
| **Layer rules**         | dependency-cruiser. It found a real import cycle on its first run.                                                       |
| **Supply chain**        | Blocking `pnpm audit`, Dependabot, CycloneDX SBOM, npm provenance, SHA-pinned actions.                                   |
| **Size budgets**        | `size-limit` on the bytes a customer installs.                                                                           |

The framework smoke apps earned their keep on day one: they found the elements
**broken in React 19 and Vue** (getter-only properties, which both frameworks
assign to) and **unbindable in Angular** (a colon in an event name is Angular's
global-target syntax). The 126-test unit suite was green throughout, because it
drove elements through `setAttribute` — the one path that always worked.

### Accessibility is tested, not claimed

WCAG 2.2 AA across three engines: 320 px reflow, 200% zoom, forced-colors, focus
indicators, and the reduced-motion still state. `axe` runs per story × 3 themes
× 3 densities.

The signature component's Level A claim is a **test**, not a sentence: one test
signs the form using `tab()` and `keyboard()` only, never dispatching a pointer
event. The corresponding authoring mistake — a draw-only signature pad — is a
lint error, because it renders perfectly and passes every other test.

---

## Repository layout

```
zoblocks/
├─ apps/
│  ├─ docs/              # zoblocks.design — site, catalog, registry host
│  ├─ smoke/             # HTML · React 19 · Vue · Angular · Svelte
│  └─ smoke-react18/     # React 18, which cannot share a node_modules with 19
├─ packages/             # the published packages (see the table above)
├─ registry/zoblocks/      # component source — this is what customers receive
├─ content/decisions/    # nine architecture decision records
├─ scripts/gen/          # the generator
├─ e2e/                  # Playwright: VRT, a11y, reflow, cross-framework
└─ ARCHITECTURE.md       # how it fits together, and why
```

`registry/` is the source of truth for anything a customer installs — those
files are copied verbatim into their project, so they must be self-contained and
readable on their own.

`registry.json`, `tsconfig.generated.json`, `apps/docs/src/lib/generated/`,
`apps/docs/public/r/`, and `apps/docs/public/llms.txt` are **generated**. Edit a
component's `*.meta.ts` and run `pnpm gen`; CI fails if they are stale.

---

## Development

```bash
pnpm install
pnpm gen              # generate the registry, catalog, and path mappings
pnpm dev              # docs site on http://localhost:6001
```

| Command                     | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `pnpm dev`                  | Run the docs site                                     |
| `pnpm build`                | Build every package and app                           |
| `pnpm test`                 | Package tests, then every registry component          |
| `pnpm test:coverage`        | Coverage with thresholds enforced                     |
| `pnpm e2e`                  | Playwright: VRT, a11y, reflow, cross-framework        |
| `pnpm lint` · `typecheck`   | Lint and typecheck the workspace, registry included   |
| `pnpm gen`                  | Regenerate everything derived from component metadata |
| `pnpm gen:component <name>` | Scaffold a new component                              |
| `pnpm changeset`            | Record a release intent                               |

### Adding a component

```bash
pnpm gen:component vitals-trend
```

Fill in the `.tsx` and its `.meta.ts`, then run `pnpm gen`. **That is the whole
process** — no shared file is edited. The registry manifest, the docs catalog
and its prop tables, TypeScript path mappings, the Tailwind source list, and the
agent manifest are all derived from the metadata and the component's own types.

Prop documentation is **extracted from the TypeScript types** and must never be
written by hand — a prop table is read as a contract, and one that has silently
drifted is worse than none.

### Testing a component

A test asserts **the safety claim the component exists to make**, not that it
renders — because the failures worth catching all look fine on screen.

```tsx
it("shows an uninterpreted result as uninterpreted, never as normal", () => {
  render(<ResultValue observation={uninterpreted} />);
  expect(screen.getByText(/not interpreted/i)).toBeInTheDocument();
  expect(screen.queryByText(/^normal$/i)).not.toBeInTheDocument();
});
```

Three conventions: start from the component's own doc comment (its prose states
the rules, and those sentences are the test list); use
`@zoblocks/fixtures`, which deliberately over-represents critical,
uninterpreted, masked, refuted and expired; and assert the meaning is **in
words** — `expectStatedInWords` checks a state is readable without colour.

---

## Status

Pre-release. The catalog is being rebuilt on a hardened foundation: **Loaders**
and **Signature** ship today, and the clinical layer — which takes FHIR
resources as props directly, with no adapter and no bespoke prop shape — follows.

Nothing is published to npm yet; the release pipeline is gated and ready.
Progress against the enterprise-readiness audit is tracked in
[`ZOBLOCKS-UI-AUDIT.md`](ZOBLOCKS-UI-AUDIT.md).

---

## What this is not

ZoBlocks is **not a compliance boundary**. Installing it does not make an
application HIPAA, GDPR, or DPDP compliant, and it is not a medical device or
clinical decision support. Access control, audit, data residency, and clinical
validation remain yours.

Signature capture does not by itself establish the legal validity of any record,
and does not satisfy DEA EPCS, which is a separate and stricter regime.

It is well-built UI with healthcare implementation guidance. That is the claim,
and it is the only one we make.

**Synthetic data only.** Every fixture, demo, and screenshot uses invented values
on reserved `example.org` systems. No PHI enters this repository, its issues, or
its analytics.

---

## Contributing

Read [`ENGINEERING.md`](ENGINEERING.md) first — it is the standard every
component, fix, and release is evaluated against, and it opens with a one-page
definition of done. Then [`CONTRIBUTING.md`](CONTRIBUTING.md) for the mechanics,
and [`CONTENT.md`](CONTENT.md) for how clinical copy is written.

Security issues go to the process in [`SECURITY.md`](SECURITY.md), never to a
public issue.

## License

MIT for the core — see [LICENSE](LICENSE). Premium registry resources, when
introduced, will carry a separate commercial license stated on each item.

<div align="center">

Built by [Zowork](https://github.com/zoworkhq) · [zoblocks.design](https://zoblocks.design)

</div>
