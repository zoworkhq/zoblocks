# 0005 — Tokens are built from a DTCG source across brand × theme × density

**Status:** accepted · 6 August 2026

> **Ratified 16 August 2026.** Three tiers, three themes, three densities, all validated. The contrast gate now covers every composed pair and has its own tests. The brand axis remains unimplemented — tracked as follow-up, not a blocker to accepting the tier model.

## Context

`packages/tokens/src/oxygen-tokens.css` is 292 hand-written lines. It is well
structured, correctly commented, and states the right rule — components
reference semantic tokens, never raw palette values.

It is also a single artifact in a single format. Supporting multiple customer
brands, a high-contrast theme, Figma synchronisation, and programmatic access to
token values from JavaScript each want a different output from the same data. A
hand-written CSS file can be exactly one of those.

The stated requirement is that new brands and themes arrive "without
architectural changes." That is only true if a brand is data.

## Decision

**Tokens are authored as W3C DTCG-format JSON and built to every output.**

Three tiers, with a strict reference rule:

| Tier      | Example                  | May be referenced by |
| --------- | ------------------------ | -------------------- |
| Primitive | `--ox-ref-red-600`       | semantic tokens only |
| Semantic  | `--ox-status-critical`   | components           |
| Component | `--ox-badge-critical-bg` | its own component    |

Three axes: **brand** × **theme** (light, dark, high-contrast) × **density**
(patient, standard, clinical). Density already exists as `data-ox-density` and
is generalised rather than replaced.

Supporting decisions:

1. **A brand overrides primitive tokens only.** It replaces steps of the
   palette; the semantic tier resolves through them, so one brand file reaches
   every component. It never introduces new semantic keys, and it may not
   redefine a semantic one — letting it would let a brand redefine what
   _critical_ means, which is the one thing a clinical design system does not
   delegate.

   > **Corrected 19 August 2026.** This clause originally read "overrides
   > semantic tokens only", which is the opposite of what was built and of what
   > `packages/tokens/tokens/brands/README.md` has always said. The
   > implementation — `themeTokensSchema`, the emitted `[data-ox-brand]` blocks,
   > and the brand key-space check — has only ever accepted primitives. The
   > wording is fixed here rather than in a new ADR because nothing was decided
   > differently; the record was simply wrong.
   >
   > A **customer theme** may additionally override non-clinical _semantic_ and
   > _component_ tokens, per ADR 0014. That is a wider surface than a built-in
   > brand has, and it is guarded by the generated clinical refusal rather than
   > by this tier rule.

2. **A missing semantic key in any brand is a build error.** Silent fallback to
   a default is unacceptable when the token means "critical" — a brand that
   forgets to define it must fail the build, not render the default green.

3. **Applied through CSS custom properties** on `[data-ox-brand]`,
   `[data-ox-theme]`, `[data-ox-density]`. No JavaScript, no flash of unstyled
   content, correct under SSR and React Server Components.

4. **Components referencing a primitive token is a lint error**, so the rule
   the current file states in a comment is actually enforced.

5. Outputs: CSS custom properties, a Tailwind v4 `@theme` block, typed TS
   constants, flat JSON, and Figma-compatible tokens.

## Consequences

**Good.** A new customer brand is a JSON file and a build, with no code change
and no new component work. Token values become available to JavaScript for
canvas and chart rendering, which the Pro charting pack will need. Figma and
code share one source, so design drift is a merge conflict rather than a
discovery. High-contrast and forced-colors support become value sets rather than
a parallel stylesheet.

**Costs.** A build step between authoring and output — a token change is no
longer a one-line CSS edit. Generated CSS is checked in so consumers of the
registry channel still receive plain CSS, which means generated output in
review diffs. The DTCG format is more verbose than the CSS it replaces.

**Rejected: keeping hand-written CSS and adding brand files alongside it.** It
works for two brands and collapses at five, because nothing guarantees the brand
files cover the same key space, and the failure is a wrong colour on a clinical
status rather than an error.

**Rejected: CSS-in-JS theming.** Runtime cost, bundle cost, and it breaks React
Server Components. Custom properties do everything required here at zero runtime.
