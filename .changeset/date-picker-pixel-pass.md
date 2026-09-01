---
"@oxygenui-design/react": patch
"@oxygenui-design/tokens": patch
---

DatePicker — the calendar and the clock, matched to the design they were built
from.

Nothing here changes behaviour. It is the pass that closes the gap between what
the range work shipped and the design it was drawn from, and four of the six
changes are corrections rather than preferences.

- **`Mo Tu We`, not `MO TU WE`.** Two letters set in caps with tracking read as
  an abbreviation of something else — a code, a column key — rather than as the
  day they name. It was also the only place in the system labelling in anything
  but sentence case.
- **`7:00 AM`, not `07:00 AM`.** A padded hour belongs to a 24-hour clock,
  where `07:00` and `17:00` are the same width and the zero is part of the
  notation. On a twelve-hour clock nobody writes it, and the field disagreed
  with `formatClockTime` — so a picker reading `07:00 AM` sat above a list
  reading `7:00 AM` and looked like two different values.
- **Both halves of a time lean on their colon.** Every segment is held at the
  24px target floor whatever it contains, so two digits at 13px leave slack on
  each side and `9:30` rendered as `9 : 30` — three things rather than one
  time. The outermost segments now sit against the separator and the slack
  moves to the ends of the run. (A zero-width separator was tried first and is
  worse: it centres on a boundary between segments whose slack differs, so a
  one-digit hour pushes the colon off centre and it ends up touching the
  minute.)
- **Every month draws both chevrons.** A header with one arrow reads as a month
  that can only be left in one direction. They all page the whole window, so
  the months stay contiguous; only the outermost pair is a real control, and
  the repeats are taken out of the tab order and the accessibility tree
  together, because four buttons announced "Previous months" for one action is
  four times the work.
- **Row gap, not cell gap.** The columns close up so a band runs unbroken
  across a week, and the rows open out so it breaks cleanly between them. At a
  1px row gap every week's band touched the next and a selection read as one
  slab rather than a set of weeks.
- **`--ox-datetime-cell-size` 2rem → 2.25rem and `--ox-datetime-cell-radius`
  `radius-sm` → `radius`,** with the panel, rail, heading and commit buttons
  moved to match. The cells were wider than they were tall and cornered more
  tightly than anything else on the surface.

**Two things in the mockup were deliberately not copied.** The column headings
stay sentence case — `Start time`, not `Start Time` — because that is how every
other label in this system is written and one component is not the place to
break it. And the duplicated chevrons are visual only, for the reason above.

**The demo page, which had its own problems.** A calendar is a fixed-width
surface, so on a full-width stage it left-aligned against six hundred pixels of
nothing; inline calendars now centre in their stage while form fields keep
their left edge, because that is where a form puts them. Three demos sat alone
in a two-column row with an empty half beside them — the two single-month grids
are now adjacent so they pair, and the rest are full width. `.ox-dt-demo-chip`
went with the Picker's relative-date chips when they became a rail.

Measured after the change: 0 contrast failures across 454 text nodes and 0
targets under 24px across 632 interactive elements, both themes, every density,
panels open. 4,162 tests green.
