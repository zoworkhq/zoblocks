---
"@oxygenui-design/signature": patch
---

The signing dialog no longer takes focus back off a reader who has started
moving.

Focus is placed on the name field from two hooks: an effect a frame after open,
and `afterOpenChange`, which exists because an environment that never runs the
open transition never fires the latter. Both were described as harmless on the
grounds that they target the same element — true only while nothing has moved
focus in between, and `afterOpenChange` fires at the _end_ of the transition,
a few hundred milliseconds later. A keyboard user who started tabbing inside
that window was hauled back to the first field mid-journey, with the dialog
sitting there looking idle.

The late call now stands down once the reader has pressed Tab or an arrow key,
or pointed at anything, since the dialog opened. Reading `document.activeElement`
would not have answered this: antd's focus trap parks focus on the close button,
a real and visible control, so "focus is on something in the dialog" is equally
true of the trap's landing spot and of a field the reader chose. Only the reason
focus is where it is separates them, and that is an event rather than a state.

Found as a Firefox flake in the keyboard-only end-to-end test, failing about one
run in ten on `main` — the same defect, at the speed a test drives a keyboard
rather than a person.
