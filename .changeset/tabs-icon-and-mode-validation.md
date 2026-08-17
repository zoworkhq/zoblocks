---
"@oxygenui-design/tabs": patch
"@oxygenui-design/tabs-core": patch
---

Two fixes to the shapes a caller actually reaches for first.

**An icon-only trigger sizes its glyph.** Passing an icon as `label` — the
supported shape, and the reason `textLabel` exists — left the SVG in a slot with
no size constraint. An inline `<svg>` with a `viewBox` and no width or height
has no intrinsic size, so it took whatever the strip offered: on the `command`
variant, four glyphs meant to render at 14px filled the bar at roughly eighty.
A bare SVG in the label slot is now 1em, matching the icon slot, so an icon-only
trigger and an icon beside a label are the same size on the same strip. A caller
who sets width and height on their own SVG still wins.

**An unrecognised `as` is reported rather than crashed on.** Validation tested
only for a _missing_ mode. A value outside the four — `"tablist"` is the one
everybody tries, since that is the ARIA role — passed the guard, resolved to no
role spec, and threw `Cannot read properties of undefined (reading 'ownsPanels')`
from inside the validator. The one function whose job is to explain a
misconfiguration was the one that failed to, with a stack trace pointing at
library internals instead of at the caller's prop. It now names the value it was
given and lists the four valid modes, exactly as the missing case does.
`isSemanticMode` is exported for hosts validating an `as` that arrived as data.
