---
"@zoblocks/tokens": patch
---

A note on dimming a filled control

No token changed here, but the finding belongs with them. Both site palettes
used `hover:opacity-90` on their primary button. Against the near-black CTA
that was harmless — it had contrast to spare. Against a mid-tone brand colour
it is not: the green composited over the page at `#1e8371`, and the label
measured **4.37:1** against the 4.5 floor. The primary action, below AA, on
hover only, in light mode only.

The lesson generalises past this repository. **Opacity is not a hover state for
anything that carries text.** It moves both the foreground and the background
toward whatever is behind, and how far depends on the page — so a control that
passes in isolation can fail in place. Hover now darkens in light and lightens
in dark, through `--site-cta-hover`, which is a colour somebody chose and a
test can measure.

Caught by axe in Firefox and nowhere else, because the failure only exists
while the pointer is over the button and only Firefox happened to leave it
there after the click that preceded the audit.
