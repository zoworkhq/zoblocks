---
"@zoblocks/cli": patch
"@zoblocks/bridge-mui": patch
"@zoblocks/clinical-note-core": patch
---

`zoblocks add` no longer writes through a symlink that leads out of the project,
or through a target file that is a symlink. A bare dependency of an item added
by URL now resolves beside that URL, not in the public catalog.

`ZoBlocksMuiProvider` now derives `primary.dark`, `light` and `contrastText`
from your brand, and your font reaches every typography variant.

`toFhirBundle` entries now carry `fullUrl` and `request`, as FHIR transactions
require, and the Provenance targets the Composition. Pass `uuid` to supply your
own ids; by default they derive from the note.
