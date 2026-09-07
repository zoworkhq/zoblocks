---
"@zoblocks/react": minor
---

Switch: the controlled-phase escape hatch, and three phase guards.

`phase`, `requested` and `error` were in the design and not in the component,
which left one class of caller unserved — anyone who already owns a state
machine. A mutation library, a websocket subscription, an offline queue: each
of those knows when a write is in flight and whether it landed, and the only
way to use that knowledge before was to reimplement the rendering.

Supplying `phase` now takes the internal machine out of the loop entirely.
Nothing starts a timer, `requested` decides what is drawn while in flight, and
`error` is announced verbatim. Every rendering, announcement and availability
rule is the same code as the uncontrolled path, so the two cannot drift.

Also exported: `isPending`, `isCommitted` and `isUnresolved`. They partition
the seven phases exactly — `idle` is the only one none of them claim — and they
exist because `phase === "commited"` is silently false forever, and the bug it
produces is a confirmation that never appears.
