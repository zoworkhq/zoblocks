---
"@oxygenui-design/intl": minor
---

First release: messages and clinical register.

ADR 0008 argued this is a week's work at 24 components and an enormous project
at 500. It is being done at five.

Two things a generic i18n layer does not give a healthcare library. **Register**:
patient-facing and clinician-facing strings are different catalogs, not
different tones — `useTerm` requires both sides, so shipping clinical shorthand
to a patient is a type error rather than a review note. **Absence**: a missing
translation never renders as a blank, because an empty label on a wait is
indistinguishable from a component that failed to render.

Zero dependencies; `Intl` is in every runtime the library targets.
