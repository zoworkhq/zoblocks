---
"@oxygenui-design/identity-core": minor
"@oxygenui-design/identity": minor
"@oxygenui-design/fhir": minor
"@oxygenui-design/tokens": minor
---

Patient identity: avatar, chip and banner, with the engine underneath.

`@oxygenui-design/identity-core` is React-free and antd-free. It resolves a FHIR
`Patient` into a renderable identity — chosen name over legal name, unambiguous
dates, ages that are correct for neonates and frozen for the deceased,
script-aware initials, identifier systems with check digits, and the five states
that every design system collapses into one grey "Inactive" pill. It also ships
`disambiguate()`, which keeps two patients with one name apart on a worklist.

`@oxygenui-design/identity` renders that value for Ant Design, and encodes four
invariants in the type system: two identifiers before a care action
(NPSG.01.01.01), a stated reason for reaching the legal name, an atomic identity
that cannot be half-loaded, and no way to render `Patient.gender` at all.

`@oxygenui-design/fhir` gains `Patient.link` and `Patient.extension`, which is
what makes merged records and the Gender Harmony fields readable.

`@oxygenui-design/tokens` gains a motion group, including a deliberately zero
alert duration and the one looping animation the system permits.

`@oxygenui-design/eslint-plugin` gains three rules:
`identity-requires-stable-key`, `no-room-number-identifier`, and
`no-truncated-identity`.
