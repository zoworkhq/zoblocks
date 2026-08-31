---
"@oxygenui-design/react": minor
"@oxygenui-design/tokens": minor
---

ChartContextMenu — a context menu that names what it is about before it offers
to change it.

A right-click menu is the shortest path in a clinical interface to an
irreversible act, and it opens on top of the row that said whose act it was. The
mechanics of a popup are solved elsewhere and solved well; what is not modelled
anywhere is what the menu is _about_. So this is an L0 resolver (`menu-core`)
with a thin binding, and three rules the code refuses to break.

**The menu states its subject, and the subject row is the safe landing.** Every
menu opens with a non-interactive header naming the record, so the first thing
under the pointer is never a verb — one decision closing the wrong-patient check
and the accidental click-through at once. The header is also the popup's
accessible name through `aria-labelledby`, so a screen reader announces the
subject before any item. There is no prop that removes it.

**Consequence is a rank, not a boolean.** Four tiers — `routine`,
`documented`, `clinical`, `disclosive` — and the tier decides the interaction
rather than the colour: run; run and say what was written; take a second step
inside the menu; take a recorded reason. Bands sort consequence to the bottom
with separators the resolver inserts, so an author cannot place a discontinue
next to a copy. `validateActions` refuses a clinical action with no confirmation
sentence, a disclosure with no reason list, and a toggle above `routine`.

**The menu cannot out-disclose its trigger.** A masked row produces a masked
header. An availability check still running holds its final position rather than
being appended when it resolves. Actions the policy withholds are counted in a
row inside the menu rather than silently dropped, and a disclosure emits its
audit record on every path — including the one where the reader read the reasons
and pressed Escape.

Also new: `menu-core` (`resolveMenu`, `actionOutcome`, `describeSubject`,
`disclosureRecord`, `validateActions`, `bulkPartition`, `toPaletteItems`) with
no React and no DOM, a `menu` token group that is structural only because the
four tiers resolve through the existing status ramp, and an `@a11y` Playwright
suite that asserts the pointer never lands on a verb — from real coordinates, at
three viewport positions, in Chromium, Firefox and WebKit.
