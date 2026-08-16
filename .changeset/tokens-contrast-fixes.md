---
"@oxygenui-design/tokens": minor
---

Fix three WCAG 2.2 AA contrast failures, and widen the gate that missed them.

The focus indicator measured **2.50:1** against the 3:1 floor in SC 1.4.11 and
2.4.11 — it governs every focusable element in every component. `text-on-accent`
measured **3.81:1** against 4.5:1, which is every primary button label.
`border-strong`, which backs `--ox-field-border` and `--ox-chart-axis`, measured
**1.48:1** on light and **2.02:1** on dark against a 3:1 floor.

Values changed: `accent` → `brand.700`, `accent-hover` → `brand.800`,
`focus-ring` → `brand.600`, `border-strong` → `slate.500` (light) and a new
`ref.ink.500` (dark). Expect a slightly deeper accent and a more visible field
border — both deliberate.

The real fix is the gate. It checked four hand-picked text pairs; it now checks
every foreground the system composes over a background, split by the WCAG rule
that applies (4.5:1 for text, 3:1 for interface components), and the published
`contrast.json` reports the same floors the gate enforces. The validator also
has tests for the first time.

Also fixed: unresolved DTCG aliases leaked into `tokens.json`, which is
documented as a flat map for external tooling — density and component values
now resolve to literals, or to a runtime `var()` where they genuinely vary.

The package is properly publishable for the first time: `main`, `types`,
`type: module`, a real build, and a `check-tarball` gate. The previously
published 0.1.0 predated the token pipeline entirely and still contained a
zero-alpha `surface-overlay` that rendered dialogs and popovers transparent.
