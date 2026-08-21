---
"@oxygenui-design/theme": minor
---

Font asset hosting, and the component tier made editable.

**Uploads are judged by their bytes.** An endpoint that trusts a filename serves
whatever was renamed to `.woff2`, so `checkFont` reads the four-byte signature
instead, caps at 2 MB before doing any parsing work, and records a SHA-256 of
exactly the bytes accepted — so what is served can be checked against what was
approved, months later, by someone who was not there.

It also detects tabular figures from the OpenType feature list. A face without
`tnum` makes every numeric column ragged; in a flowsheet that is a real problem
and it is invisible in a heading, so the customer is told at upload rather than
discovering it in a vitals table. For a compressed container the answer is
reported as _unknown_ rather than _absent_ — a face reported as lacking a
feature it has would push someone away from a font that was fine.

The app's component screen is now an editor over the generated 282-token
surface, grouped by component, showing what each token inherits and locking the
84 that resolve to clinical status.
