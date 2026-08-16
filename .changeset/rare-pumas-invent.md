---
"@oxygenui-design/elements": minor
---

New package: Oxygen controls as dependency-free custom elements, starting with
`<ox-switch>`.

The framework-agnostic channel for the Switch. Same three axes and the same
vocabulary as the React component — including the `"unknown"` value with its
FHIR-shaped `absent-reason`, the seven commit phases, `tone`, and the hit area
that does not shrink with the pill.

The division of labour differs, on purpose. React's `onCommit` can take a
promise, so the component owns the machine; an element cannot assume one, so
the host sets `phase` and the element renders and announces. Activating it
dispatches `ox-switch-request` and changes nothing on its own — a switch that
flips optimistically and snaps back on failure is the defect this whole
component exists to prevent.

`test/switch-parity.test.ts` asserts the two channels cannot drift: same
absence words, same label presets, same geometry, same keyframes, same
reduced-motion and forced-colours behaviour, and the same rule that a user may
leave `unknown` but never enter it.
