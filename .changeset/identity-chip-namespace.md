---
"@zoblocks/identity": minor
---

Move `PatientChip` off `.zb-chip`, which Accordion already owns.

`.zb-chip` is Accordion's severity badge. Any page loading both stylesheets gave
every patient chip the badge's border, background and text-sized padding — so
the avatar hung outside its own tint and a column of chips came out as a ragged
staircase. The class is now `.zb-patient-chip`; anyone who styled the old name
should update their selector.

Escalation no longer changes the box. It was adding `padding-inline`, so running
the disambiguation pass nudged every collided row sideways; it now changes
colour and reveals an inset rail, at identical geometry.

Adds `block` to `PatientChip` for worklists, and `enabled` to `IdentitySet` so
the pass can be turned off without unmounting the list — which is what makes the
escalation animate rather than snap. Set `--zb-row` on a row wrapper to stagger.
