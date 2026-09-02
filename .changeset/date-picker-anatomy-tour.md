---
"@oxygenui-design/react": patch
---

DatePicker — the docs demo now explains the component instead of operating it,
and the catalogue stops saying fourteen.

The demo at the head of the Calendars chapter used to drive the panel through a
range selection with a drawn cursor. It has been replaced with the opposite
trade, which is the more useful one on a documentation page: a reader can
already see what clicking does, and what they cannot see is why any of it is
shaped the way it is. So the panel does not move at all, and six annotations
arrive one at a time over the part each describes.

**Every note is measured off the real DOM rather than written from memory.**
The note about accessible naming quotes the name that cell actually carries;
the note about target size prints the size that cell actually is, in the
reader's own browser, at whatever density is set. A note that asserted either
from memory would go on saying it after it stopped being true, which is the
failure this whole page exists to avoid.

**The list is the content and the halo is decoration.** Every note is a real
button in a real ordered list, so paused — or unscripted, or through a screen
reader — the demo reads as six labelled paragraphs about a calendar. Pressing
any note jumps to it and stops the tour, which is what makes it usable without
ever playing. It never starts under `prefers-reduced-motion`, autoplays only
once it is actually on screen, and Pause is a real button, per WCAG 2.2.2.

A floating bubble repeating the active note was built and then removed: it
covered the grid it was explaining, and the list sits directly beside the
panel already.

**One bug worth recording.** The halo was measured against the outer stage
while being positioned inside the panel, and the stage centres the panel within
itself — so every halo sat one cell to the right of the thing it named. The two
numbers agreed with each other and were both wrong, so it survived a numeric
check and was only visible in a screenshot.

**Stale counts, corrected.** The home page's featured card, the gallery
heading, the catalogue card and three comments all still said "fourteen
variants" and "14 variants". It has been sixteen since the range work landed.
The featured card's demo also predated that work entirely — it now shows the
date range, the time range and the session triple together, so all three
visible fields carry a derived member, which is the one thing this family does
that a date input does not. The catalogue preview gains a range scenario for
the same reason.
