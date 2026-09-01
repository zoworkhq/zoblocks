---
"@oxygenui-design/react": minor
---

DatePicker — the range half of the component, which was previously a
single-month calendar with no field in front of it.

Selecting a range was the one temporal job this component could not really do.
`mode="range"` existed, but only as an inline month grid: no trigger field, no
readout, no way to reach a range that crossed a month boundary without paging
and losing sight of the end you were aiming at, and no way to take "last month"
in one press. Two variants and a rebuilt panel close that.

- **`variant="date-range"`** — both ends typeable in one shell, a two-month
  panel behind them, named periods down the side and an inclusive day count
  beside the value. The halves stay two tab stops on purpose: the
  single-tab-stop rule is per field, and arrowing through six segments to reach
  the end date is past the point where a reader can tell which half they are in.
  The day count is inclusive of both ends, because an authorisation from the 1st
  to the 7th is seven days of care, and it is the field's own proof-read — a
  transposed month is invisible in `03/07 – 07/07` and unmissable as "123 days".
- **`variant="time-range"`** — a start, an end, and the length between them. Two
  columns rather than one list of spans, because a day at half-hour steps is
  over a thousand spans. **The end column is filtered, not merely ordered**:
  every time that cannot be an end — before the start, shorter than the minimum,
  longer than the maximum — is struck with the reason in its accessible name.
  Offering a time that will be rejected on commit is how a booking form teaches
  people to distrust it. A night shift is accepted under `allowOvernight` and
  the crossing is stated in words, never wrapped in silence.
- **`Calendar` gains `months`, `presets`, `shortcuts`, `commit`, `hints`,
  `defaultRange` and `defaultDates`.** Presets are data (`dateRangePresets(now)`), for the same
  reason `relativeDateOptions` is: the right seven periods for a billing report
  and for an authorisation window are not the same seven. `commit="explicit"`
  holds a draft behind Cancel and Done — a range is built by two clicks and the
  first is often wrong, and a parent already told about the half-built one has
  already filtered a report on a range nobody chose. `Calendar` keeps
  `commit="immediate"`, so nothing that exists today changes behaviour.

**The rail is not range-only.** `shortcuts` takes the single-date half —
`relativeDateOptions(now)`'s shape — so a plain date picker gets "Today",
"Tomorrow", "Next Monday" beside its grid rather than as chips underneath it.
It is a second way into the same answer and belongs next to the grid rather
than after it. In `multiple` a shortcut toggles rather than replaces, because
that is what every other press in that mode does, and "Custom" is pressed only
once there is a selection the rail cannot name — an empty calendar has not been
customised, it has not been answered. `DateField` reaches all of it through
`calendarShortcuts`, `calendarShowCustom`, `calendarHints`, `calendarMonths`
and `calendarCommit`, alongside the `calendarFooter` it already had;
`BirthDateField` takes `calendarHints` and `calendarCommit` and deliberately no
rail, because there is no "Today" for a date of birth and a shortcut nobody can
use is a row between the reader and the year they came for.

**Four defects fixed on the way, all of them visible.**

1. **The range band was not a band.** Cells carried a 1px column gap, so the
   fill rendered as a dashed stripe, and `--range-start`/`--range-end` were dead
   classes that only ever landed on a cell already fully rounded by its selected
   state. The band now covers the whole span — endpoints included, because a
   band that starts a cell late reads as though the day it bounds were outside
   the range it bounds — and is capped at the ends of the range _and_ at every
   week boundary.
2. **Two months drew the overlap twice.** Adjacent panels share up to a
   fortnight, so the same date got two cells, both matched the focus date, and
   the grid grew a second tabstop — the exact failure this component's own
   documentation calls the most common one in a date picker. Adjacent-month days
   are no longer drawn when more than one month is shown.
3. **The header controls ignored `min` and `max`.** A bounded calendar paged to
   any year and enforced its limits only once somebody clicked a day. The CSS
   for the disabled state had been there since the beginning and nothing ever
   set it.
4. **The footer set the panel's width.** A legend plus two buttons is wider
   than one month, so as a normal flex item it stretched a single-month
   calendar half a screen wide. It now takes the width it is given and
   contributes none of its own, wrapping instead.
5. **The month heading failed SC 2.5.3.** Its accessible name was "Choose month
   and year", which contains none of the visible "September 2026". It now names
   the month it opens.

Two smaller calls worth knowing about. Weekday headings are **two letters**
rather than one: Tuesday and Thursday are both "T" and Saturday and Sunday are
both "S", so a single-letter row leaves four of seven columns unnamed for
anybody reading rather than counting. And with more than one month there is one
previous control and one next for the whole window, not a pair per month — two
buttons both announced "Previous month" and both doing the same thing is a
riddle for anybody reading the dialog through its names.

**`@oxygenui-design/react` engine additions:** `startOfWeek`, `endOfWeek`,
`startOfMonth`, `endOfMonth`, `startOfYear`, `endOfYear`, `normalizeDateRange`,
`rangeDayCount`, `rangeContains`, `isSameRange`, `isCompleteRange`,
`dateRangePresets`, `matchRangePreset`, `timeRangeMinutes`, a `DateShortcut`
type, and a `compact` option on `formatDuration`. Every one takes the caller's `now`; nothing here
reads a clock, so a preset is deterministic and the surface stays testable.

Measured rather than asserted: 0 contrast failures across 454 text nodes and 0
targets under 24px across 624 interactive elements, in both themes at every
density, with the panels open. RTL mirrors the rail, the months and the arrow,
and pins `dir="ltr"` on both halves of the value — a range field that lets its
segments inherit `dir="rtl"` renders a plausible and wrong date twice.
