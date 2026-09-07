# 0014 — A customer theme may override semantic and component tokens, never clinical ones

**Status:** accepted · 19 August 2026

## Context

A built-in brand is primitive overrides only (ADR 0005). That is the right rule
for a brand: one palette file, compiled at build time, reaching every component
through the semantic tier without any component knowing a brand exists.

It is not a sufficient rule for a **customer theme**. The app exists so an
enterprise customer can put ZoBlocks's components into their own design language,
and two things they reliably want are outside a ramp:

- **A semantic value that is not a shade of their brand.** `text-muted` against
  their surface, a focus ring that matches their existing product, a border
  weight. These are decisions about _their_ interface, not about our palette.
- **One component styled differently from the rest.** "Make the accordion
  header match our nav." Without a way to express it, the answer is to copy the
  component's stylesheet and edit it — and an edited copy can never receive an
  upstream fix. Every fork is a component that silently stops being maintained,
  which is the failure the 282-token published surface (ADR 0012) exists to
  prevent.

Both were specified in the app mockups and neither was expressible:
`themeTokensSchema` accepted `{ ref }` and nothing else.

## Decision

**A customer theme carries three tiers: `ref`, `semantic` and `component`.**

1. **`ref` is unchanged and stays byte-compatible with a built-in brand file.**
   A ramp-only theme still exports as something that can be committed to
   `packages/tokens/tokens/brands/` verbatim. That property is what keeps the
   app and the build one system rather than two.

2. **`semantic` and `component` are keyed per theme** — light, dark,
   high-contrast. Not a convenience: one literal cannot clear 4.5:1 against both
   a white and a near-black ground, so a theme-invariant override would fail the
   gate for most real brands and the only way out would be to weaken the gate.
   The semantic tier is per-theme for exactly this reason; the override tiers
   inherit it.

3. **Clinical tokens are refused, in both tiers, generated rather than listed.**
   `CLINICAL_SEMANTIC` (every `status.*` and `flag.*`) and `NOT_BRIDGEABLE` (the
   component tokens that fall through to one) come out of `pnpm gen`. A theme
   bridge is refused by the same two constants, so a colour cannot arrive
   through the framework door that was refused at the app door.

4. **Overrides are validated as a set, at save, by the same gate the build
   uses.** `sourceWithOverrides` lays them over the shipped palette and re-runs
   `validateTokens`, because contrast is a property of a _pair_ and either side
   may be overridden. A per-field save would have to either reject an
   intermediate state the customer was on their way through or accept one that
   fails.

5. **A component override is checked against the manifest, not just parsed.**
   `--zb-badge-critcal-bg` is a typo that would style nothing at all, silently,
   which is worse than styling the wrong thing.

## Consequences

**Good.** The app can offer what its mockups promised. "Customise the badge
without forking the component" becomes true. The clinical guarantee is stated
once, generated, and enforced at four separate points — schema, validator,
emitter, and bridge — rather than remembered.

**The validator version moved to 1.1.0**, so `needsRevalidation` refuses to
serve a theme validated under rules that had no concept of these tiers. That is
what the field is for.

**Documents written before this exist and are permanent.** A published version
is immutable by design, so `{ ref: … }` is not a transitional shape.
`withTierDefaults` is the boundary every consumer crosses; zod's defaults apply
on parse and these documents are never re-parsed.

**A scoped override does not reach the component tier**, and this surprised us
in the live preview. The component tier is declared at `:root` —
`--zb-switch-track-on-bg: var(--zb-accent)` — and a `var()` resolves at the
element that _declares_ it. Setting `--zb-accent` on a subtree therefore changes
`--zb-accent` there and leaves every component token holding the value it
computed at the root.

Publishing is unaffected: `emitThemeCss` writes to `:root`, where the component
declarations are. But it means two things are true and worth writing down:

- The app's preview applies the dependent component tokens itself, from the
  manifest's `semantic` field.
- **`EmitOptions.scope` was not sufficient for its documented multi-tenant use
  case.** Emitting a customer's tokens under `[data-zb-brand="x"]` on a subtree
  moved the primitives and left the semantic and component tiers behind.
  Applied at the root element it was correct, which is why it went unnoticed:
  `emitThemeCss` writes to `:root` unless asked otherwise, so publishing was
  never affected.

  > **Closed, 20 August 2026.** `emitThemeCss` now re-declares the dependent
  > chain when `scope` is not `:root` — for each overridden semantic token,
  > every component token that falls through to it is restated inside the
  > scope, where it resolves against the local value. An explicit component
  > override is left alone, and nothing is restated at `:root`, where the base
  > declarations already sit. Covered by `packages/theme/test/emit.test.ts`.
