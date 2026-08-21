---
"@oxygenui-design/theme": minor
"@oxygenui-design/copilot-react": minor
"@oxygenui-design/copilot": minor
---

Customer icon overrides, for the twenty-nine glyphs that are actually swappable

"A custom icon set" implies two hundred icons across the design system. Read
against the library it is twenty-nine, all of them copilot chrome — send, stop,
close, copy, the chevron — plus five marks that must never be swappable and are
now refused by name.

**The five.** The switch draws `on`, `unknown`, `queued` and `locked`, and the
accordion draws its chevron. These encode meaning rather than decorating it: the
switch's `unknown` mark is the whole reason that component has a third value,
because a binary control cannot tell "no" from "nobody asked". A customer who
replaces it with something reading as "off" deletes that distinction and nothing
downstream notices. They appear in the registry so the app can show them
locked with the reason attached — a refusal nobody can see reads as a missing
feature — and the schema will not accept them.

**The mechanism is a CSS mask, not a React provider.** Every glyph is now a
span whose shape comes from `mask-image: var(--ox-icon-{slot}, <built-in>)`, so
an unset property draws what shipped and a set one draws the customer's. A
provider was the obvious design and the wrong one: the Tailwind skin is a file
copied _into_ the customer's tree and does not import our context, and a
framework bridge writes CSS and knows nothing about React. CSS is the only
surface all three share, and the `var()` fallback is the switching every token
in this system already uses.

Two consequences worth knowing:

- **A glyph is one colour.** A mask keeps the shape and discards the paint.
  Every built-in was already monochrome `currentColor` stroke art so nothing is
  lost, but a two-colour brand glyph renders as its silhouette — stated on the
  upload screen rather than discovered later.
- **`strokeWidth` is no longer a prop on an icon.** No call site used it. Size
  and colour still come from `em` and `currentColor` exactly as before.

The built-in data URIs were produced by rendering the previous React components,
so the geometry is byte-for-byte what shipped. They are readable rather than
base64 so a glyph change stays a reviewable diff, and slots are selected by
`data-icon` rather than a class because a class assembled from a variable is one
Tailwind cannot see when it scans source text.

Uploads take a whole folder at once, matched by filename to slot — a design team
delivers a set, and twenty-nine separate uploads is a feature somebody uses once
and abandons. A file matching no slot is named in the result rather than
dropped, and one bad glyph does not fail the other twenty-eight.
