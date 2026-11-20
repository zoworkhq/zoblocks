---
"@zoblocks/react": patch
---

A blocked "Sign & file" button is outlined rather than faded. `ClinicalNote` dimmed it to 60% opacity while findings blocked signing, which took its label to 2.6:1, yet the button stays clickable because it opens the sign gate. It now keeps full contrast with a strong border on the surface colour. In `SafetyPlan`, the "not filled in yet" text on the pinned crisis step steps up from subtle to muted, because subtle measured 4.35:1 on the critical tint.
