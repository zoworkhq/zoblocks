---
"@zoblocks/react": patch
---

A disabled `Switch` fades its control, not its words. The whole switch used to drop to 45% opacity, so its label and state word ("Enabled") fell to 2:1 in light and 3.3:1 in dark. Now only the track, chip or segments fade; the label, description and state word keep full contrast, and the faded control and not-allowed cursor still say the switch is unavailable.
