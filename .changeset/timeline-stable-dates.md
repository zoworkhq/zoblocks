---
"@zoblocks/react": patch
---

**CareTimeline** dates render the same on the server and in every browser, so pages with a timeline no longer throw a hydration error in Safari. Node and Safari ship different locale data. For the same `en-GB` time one rendered "2 Sep 2026 at 09:30" and the other "2 Sept 2026, 09:30". Dates and times are now formatted separately and joined with a comma. English short months are cut from the full month name. The narrow space some runtimes put before "AM" is now a plain space.

Visible change: English timelines now read "2 Sep 2026, 09:30" everywhere.
