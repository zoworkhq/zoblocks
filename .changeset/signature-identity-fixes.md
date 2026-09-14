---
"@zoblocks/signature": patch
"@zoblocks/signature-core": patch
"@zoblocks/identity-core": patch
"@zoblocks/identity": patch
---

`SignatureModal`: going to "Can't sign?" and back now restores the drawn
signature. Before, the pad came back blank but Sign still submitted the old ink.

`IdentityCache` now re-resolves a patient whose record changed under the same
id, such as a new security label, a death or a merge. Records with no id,
identifier or name are no longer cached.

`PatientVerify` in `birth-date` mode now accepts the DDMMYYYY it asks for, with
or without `/`, `-`, `.` or spaces. It never confirms against a partial birth
date.

`SignatureCapture.cancel()` takes the cancelled pointer's id. When the OS
cancels a rejected palm touch, the pen stroke being drawn is kept.

`SignaturePad` no longer draws with a stylus eraser or barrel button. Its ids
are stable across renders and match on hydration. Under `StrictMode`,
`initialStrokes` no longer vanish on the next change.

`PatientBanner`: unmounting one of two banners for the same patient no longer
hides a later banner for a different patient.

`IdentityProvider` no longer rebuilds its policy, clears its cache or reads a
new clock when `identifierSystems` or a callback is passed inline. Changing a
system's label, grouping or validator now re-resolves.

`PatientVerify` in `birth-date` mode shows no field when the record has no day
or no date of birth. It says so and points to initials or the wristband.

`resolveAge` and `yearsBetween` handle `YYYY` and `YYYY-MM`. `1985-03` no longer
ages the patient in January. A partial date shows a range when the window
spans a boundary (`40–41 y`, `7–19 mo`); `yearsBetween` returns the lower
bound. `2025` no longer renders as `24320 mo`.
