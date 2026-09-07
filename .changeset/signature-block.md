---
"@zoblocks/signature": minor
"@zoblocks/signature-core": minor
---

SignatureBlock — the attestation at the foot of a document

`SignatureManifest` is the record: every field 21 CFR §11.50 requires, laid out
for somebody auditing what happened. `SignatureBlock` is the other thing a
clinical enterprise needs — the compact strip under a discharge summary,
referral letter or policy approval — and it answers a different question, for a
reader who is not auditing anything: _did the right person sign this, and may I
act on it?_

That question is not answered by a signature and a name. A foundation doctor
and a consultant may both be "Dr A Rao", and the difference decides whether a
discharge is valid. So `Signer` gains two optional fields:

- `role` — the job title held at the time of signing. Distinct from
  `credential`, which is a qualification somebody keeps for life; the role is
  what gave them the standing to sign _this_.
- `register` — which body the identifier belongs to. A bare number is not a
  verifiable credential: "7412589" identifies nobody, and "GMC 7412589" is a
  lookup a reader can actually perform.

Two properties the component holds deliberately:

- **An unsigned document cannot be mistaken for a signed one.** Declined,
  unable, verbal, on-paper, pending and revoked render as a bordered notice
  saying "Not signed" — never as a rule with a name beneath it, which is how a
  reader skims a letter and comes away believing an attestation exists.
- **Print is the primary medium.** The block refuses to break across a page,
  never depends on a background colour, and states every status in words as
  well as marking it, so it survives toner and forced colors.

Integrity is shown only when the host supplies a verdict: an absent check and a
passing check are different facts and must not look the same.
