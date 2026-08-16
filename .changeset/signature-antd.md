---
"@oxygenui-design/signature": minor
"@oxygenui-design/signature-core": minor
---

New package: `@oxygenui-design/signature`, healthcare signature capture for Ant
Design v6, built on the framework-free engine in `signature-core`.

`<Signature>` is an antd `Form.Item` control offering draw, type and upload —
plus the outcomes a signature pad has no answer for: declined, unable, verbal,
on paper. `<SignatureManifest>` renders the read-only record 21 CFR 11.50 asks
for. `useSignatureCapture()` is the headless hook.

Three things worth knowing:

- **`signatureRequired()` treats a decline as an answer.** A rule that demands
  `outcome === "signed"` makes refusal impossible to submit, which defeats the
  component. `signatureAffirmative()` is the stricter variant for consent gates.
- **The typed path is required for WCAG 2.1.1 (Level A).** The new
  `@oxygenui/signature-requires-typed-path` lint rule makes `methods={["draw"]}`
  an error, because the mistake renders perfectly and passes every other test.
- **No `dangerouslySetInnerHTML` anywhere.** `Ink` now carries structured render
  data (path strings, positioned text) alongside the SVG string, and
  `<SignatureInk>` builds real elements from it — a stored SVG rendered through
  innerHTML would be an XSS vector, since the value round-trips through a
  database.

`signature-core` gains `toInkPaths()`, `Ink.render`, and
`SignatureCapture.committedCount` (finished strokes, excluding one in progress —
what a live region should count).
