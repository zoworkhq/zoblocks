---
"@oxygenui-design/theme": minor
---

Customer themes at runtime: the document model, the ramp generator, the
validation adapter, and the CSS payload a published theme is served as.

A customer theme is a built-in brand plus an envelope. The `tokens` body is
byte-compatible with `packages/tokens/tokens/brands/*.json`, so a theme authored
in the console can be committed as a brand and a brand can be imported into the
console — one format, not two, which is what keeps "bring your own design
system" from meaning two things to support.

- **`validateTheme()`** shapes a customer's ramp as a `Brand` and hands it to
  the Phase 1 validator, so a customer is demonstrably held to the same bar
  `northwind.json` is rather than to a second implementation that agrees today.
- **`generateRamp()`** takes one brand colour and produces eleven steps, holding
  hue and saturation. The console asks for a colour rather than a ramp because
  most of what the contrast gate catches is a hand-picked step.
  `nearestPassing()` is the "apply nearest passing" repair — a rejection with no
  route out is how an accessibility gate becomes something a team works around.
- **`emitThemeCss()`** writes an immutable, version-pinned stylesheet. Token
  values are parsed and re-serialised rather than interpolated: a value reaches
  it from a text field, and `red; } body { display: none` would otherwise close
  the rule and open another.
- **`isServable()`** refuses a theme validated by an older validator, so
  tightening a rule cannot leave an older palette live and restoring an old
  version re-checks it.
- **`<OxygenTheme>`** applies tokens inline, for multi-tenant pages where a
  root-scoped stylesheet would let the last one loaded win.

Only the primitive ramp is ever emitted. Semantic tokens are not, and cannot be
— which is how a customer theme reaches every component without being able to
redefine what `critical` means.
