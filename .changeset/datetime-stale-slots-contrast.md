---
"@zoblocks/react": patch
---

Stale availability is marked rather than faded. `TimeSlotGrid` dimmed the whole slot list to 55% opacity once its data passed `staleAfterSeconds`, which took every time and heading below text contrast (2.6:1 on white) while the slots stayed bookable. The age line still says how old the data is; the list now takes a dashed frame and dashed slot edges at full contrast. The billing-code text in a chip is no longer faded either (4.0:1 → full chip contrast).
