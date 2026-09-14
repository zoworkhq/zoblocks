---
"@zoblocks/react": patch
"@zoblocks/tokens": patch
---

Care timeline secondary text now meets WCAG AA on tinted backgrounds. Dates, event kinds, relative times and group labels use `--zb-text-muted` instead of `--zb-text-subtle`, which only reaches AA on white; on a grey card they fell to 4.24:1. The "Now" divider's label takes body text colour, and its rule keeps the amber.

`--zb-care-timeline-meta` now defaults to `--zb-text-muted` in the token surface. If you override it, check your value against tinted backgrounds too.
