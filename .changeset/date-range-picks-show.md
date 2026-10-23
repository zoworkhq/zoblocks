---
"@zoblocks/react": patch
---

A range picked from the panel now shows in the field. `DateRangeField` and `TimeRangeField` updated their value, their `onChange` and their span badge when a range was chosen from the calendar or the time columns, but left both typed halves empty — the field treated its own write as an echo to ignore. Typed entry was unaffected.
