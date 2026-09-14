---
"@zoblocks/react": patch
---

Five registry fixes. Switch timestamps say which day they mean ("08:00 tomorrow", "12 Aug, 09:14"), and `SwitchList` takes `now`. RecentPatientStack keeps a tab stop when `activeId` matches no chart. ChartCommandPalette clamps its highlight when items or scope change. ClinicalNote scopes its blocked-reason id per instance. CareTimeline marks a month that resumes after another as "(continued)" in its heading, list name and jump option.
