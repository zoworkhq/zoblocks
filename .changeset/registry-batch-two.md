---
"@zoblocks/react": patch
---

Fix four registry defects. ChartContextMenu clears a pending long press or submenu hover on unmount or subject change, so it can't open a menu for a row that is gone. TimeSlotGrid scopes group heading ids per grid. TimeRangeField treats an end equal to its start as empty, even with `allowOvernight`. Recorder takes `transcriptLagMs`, so Stream can say "Transcript stalled".
