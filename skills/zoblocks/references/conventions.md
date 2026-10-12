<!--
  GENERATED FILE — DO NOT EDIT.
  Produced by `pnpm gen` from the component catalog and
  packages/component-meta/src/integration.ts. CI fails if it is stale.
-->

# ZoBlocks conventions

## Rules for generated code

- A missing value renders as explicitly missing. Never substitute an empty string or a dash.
- An uninterpreted result reads "Not interpreted", never "Normal".
- Status is never conveyed by colour alone; every severity carries an icon and a text label.
- Never build a Tailwind class name from a variable. Tailwind resolves classes by scanning source text, so a template literal produces no CSS and the severity styling silently disappears.
- Clinical status colours — critical, high, low — always stay ZoBlocks’s, whatever your theme says, because they are tested for contrast and colour blindness.

## Invariants ZoBlocks enforces on its own source

These are lint rules in the ZoBlocks repository. The plugin is not published,
so they cannot be run in your project — follow them in the code you write.

- `@zoblocks/identity-requires-stable-key` — Require an identity swatch key to be derived from a stable record identifier rather than from a name.
- `@zoblocks/no-absence-placeholder` — Disallow punctuation and placeholder text standing in for an absent clinical value; state the absence instead.
- `@zoblocks/no-ambiguous-clinical-copy` — Flag user-visible clinical copy that omits a fact the interface already has.
- `@zoblocks/no-disabled-with-reason` — Disallow `disabled` alongside `lockedReason`; the author knew the reason and reached for the wrong prop.
- `@zoblocks/no-dynamic-class-name` — Disallow building a Tailwind class name from an interpolated value; Tailwind cannot see it and emits no CSS.
- `@zoblocks/no-forbidden-capability` — Disallow environment access, network calls, dynamic evaluation, raw HTML injection, and console output in component source.
- `@zoblocks/no-hardcoded-count` — Require a countable figure in user-visible copy to be derived rather than typed.
- `@zoblocks/no-heading-level-drift` — Require an explicit headingLevel on an accordion nested inside another, so the document outline is not silently flattened.
- `@zoblocks/no-primitive-token` — Disallow referencing primitive palette tokens from component source; components use semantic tokens.
- `@zoblocks/no-room-number-identifier` — Disallow a room, bed or ward number in a patient identifier position.
- `@zoblocks/no-stigmatising-language` — Flag stigmatising clinical language in string literals, with the person-first alternative.
- `@zoblocks/no-truncated-identity` — Disallow CSS truncation on elements that render a patient name or an identifier.
- `@zoblocks/no-vague-failure` — Require a failure message to name what failed.
- `@zoblocks/prefer-logical-properties` — Require CSS logical properties over physical ones so components lay out correctly in right-to-left locales.
- `@zoblocks/require-accordion-summary` — Require an accordion item that declares a severity to also carry a summary, so the severity rail is never the only signal.
- `@zoblocks/signature-requires-typed-path` — Require the typed capture method on signature controls; drawing alone is not keyboard operable.
- `@zoblocks/switch-audit-needs-now` — Require a server-supplied `now` wherever audit events are recorded.
- `@zoblocks/switch-needs-commit-strategy` — Require an explicit commit strategy on a Switch inside a Form; a switch means applied now.
- `@zoblocks/switch-not-for-questions` — Flag a Switch whose label reads as a question; a pill shows only the answer it is currently on.
- `@zoblocks/tabs-semantic-mode` — Require an explicit semantic mode on ZoBlocks Tabs, and keep the mode consistent with links and overflow.
