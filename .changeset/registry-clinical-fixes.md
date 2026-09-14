---
"@zoblocks/react": patch
---

Three clinical fixes.

- DataGrid: `number` and `measure` columns sort ">90" and "<0.01" by their number, with "<x" just below x and ">x" just above. Text that is not a number sorts after the numbers in both directions, above absent values. The comparator never returns NaN.
- CareTimeline: group headings use the record's own wall clock, so an event at 2026-09-01T02:00+10:00 heads "September 2026", matching its row. Order still follows the true instant.
- Switch: an `until` more than ~24.8 days away no longer calls `onExpire` on mount.
