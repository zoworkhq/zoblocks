---
"@oxygenui-design/theme": minor
"@oxygenui-design/tokens": patch
---

Print artwork, an honest token surface, and one field removed

Two more asset roles for paper. `letterhead` is the header band on a discharge
summary or referral letter; `watermark-draft` is laid across any note that has
not been countersigned — the one asset in this set with a patient-safety
argument, because an unsigned note that prints clean gets filed and read as
final. Both emit at the root and are used only by `@media print`: a customer
working in the dark theme still prints on white, and a letterhead that followed
the screen theme would come out reversed on the page.

The surface manifest also stopped lying about what kind of value three tokens
hold. Both causes were ordering, and both reported green for as long as nobody
looked:

- `kindOf` tested colour before shadow, and a shadow _contains_ a colour — so
  every shadow in the system was typed `color`. Composite kinds are now tested
  before the scalar kinds they are built out of.
- A DTCG group `$type` is flattened onto every token beneath it, so
  `switch.ease` — an alias to a cubic-bezier — inherited `color` from the fifty
  switch tokens that genuinely are colours. An alias now takes its type from
  what it points at, which fixes the class rather than the instance.

Consumers act on `kind`: a bridge writing an antd theme, an editor rendering a
colour picker, a validator deciding what a customer may type. A timing function
labelled `color` is a swatch picker on a cubic-bezier, which is what the app
was showing. Five tests now hold the manifest to it in both directions, so a
future fix cannot pass by labelling everything `dimension`.

**Removed:** `themeAssetsSchema.iconSet`. It offered a choice between `lucide`
— a library this design system deliberately does not use, as
`copilot-react/icons.tsx` says in as many words — and `custom`, which nothing
implemented and no component could have consumed, because the library has no
icon layer at all. A field that advertises a capability that does not exist and
misnames the default is worse than no field. If customer icon overrides are
wanted later, the shape to generalise is the 30-glyph registry already in
`copilot-react`, and that is a project rather than a schema line.
