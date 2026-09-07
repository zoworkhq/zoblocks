---
"@zoblocks/theme": patch
---

App screens for import, export, comparison and typography.

The export and import logic landed with tests but no interface. These wire it
up, and the framing matters in two places:

**Import previews before it saves.** An import that writes on upload gives a
customer no chance to see that their status colours were discarded, and the
first they hear of it is a support conversation about a red that did not change.
The result names what was matched, what had no counterpart, and what was
discarded — and an imported palette still has to clear the publish gate, so a
file from another system cannot smuggle a failing colour into production.

**Comparison shows the effect, not only the values.** A customer looking at
`#1d63c9` beside `#7c3aed` cannot tell which one their primary button label will
be readable on. Each version carries its validation result under today's rules,
so a version that passed when it was published and would not pass now says so.

Typography's specimen is a result table rather than a paragraph, because that is
where a font choice actually fails: a face without tabular figures looks fine in
a heading and makes every vitals column ragged.
