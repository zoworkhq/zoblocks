# @zoblocks/identity-core

The engine behind Zoblocks's patient avatar, chip and banner. No React, no Ant
Design, no DOM — it takes a FHIR `Patient` and returns a value a renderer can
walk without knowing any FHIR.

```ts
import { resolveIdentity, policy, disambiguate } from "@zoblocks/identity-core";

const p = policy({ locale: "en-GB", disclosure: "clinical", now: new Date() });
const me = resolveIdentity(patient, p);

me.name.text; // the name the person uses, not name[0]
me.birthDate.text; // "08 Mar 1985" — never "08/03/1985"
me.age.atDeath; // frozen for a deceased patient
me.states; // deceased | inactive | merged | test | restricted
me.photo.kind; // five-valued: absence is a fact, not a gap
me.swatch; // 0..5, decorative, hashed from the record id
```

## What it does that a hand-rolled version will not

**Chosen name wins.** `HumanName.use` resolves `usual → nickname → official`.
Russell et al. (_J Adolesc Health_, 2018) found chosen-name use across contexts
associated with 71% fewer severe depressive symptoms and 65% fewer suicide
attempts among transgender young people. A banner is a context, and `name[0]`
is not a neutral default. The legal name is reachable through
`nameContext: "legal"`, which the React layer requires a stated reason for.

**`Patient.gender` is never resolved.** It is administrative gender:
correspondence and registries, not dosing. The three fields with clinical or
affirming meaning — sex parameter for clinical use, gender identity, recorded
sex or gender — are resolved separately and each renders with its own label.

**Dates cannot mean two things.** `08 Mar 1985`, never `08/03/1985`, which is
3 August in Delhi and 8 March in Denver. Recorded precision is preserved: a
FHIR date of `1985-03` renders as `Mar 1985`, because widening it invents a
fact.

**Ages are correct at both ends of life.** Days under four weeks, weeks under
three months, months under two years. "0 y" on a neonate is a dosing hazard and
is what every naive implementation renders. A deceased patient's age freezes at
age-at-death rather than advancing every midnight.

**Initials are correct outside English.** One character for Han, Kana and
Hangul — 陳美琳 as "CM" is nonsense. Grapheme clusters for Devanagari and Thai,
so `रामेश` yields `रा` rather than a bare consonant. Particles dropped, so
_van der Meer_ is `VM`. Mononyms stay single. The case pass is skipped for
caseless scripts, because `toUpperCase` is not a no-op for Turkish or Greek.

**Swatches are keyed on the record, never the name.** FNV-1a over the UTF-8
bytes of `Patient.id`, so a marriage, a correction or a transition does not
repaint the person — and so a banner showing the chosen name agrees with a
worklist showing the legal one. Deterministic across server and client, with a
committed golden file so changing the hash is a reviewable diff rather than a
silent recolouring of every patient in every customer's product.

**`disambiguate()` keeps two patients with one name apart.** Given what is
actually on screen, it returns the minimum extra fields that make each identity
unique — full given name, then date of birth, then identifier — stopping at the
first rung that separates them. Jaro–Winkler for near-spellings, Double
Metaphone for sound-alikes, diacritic folding for _Nguyen_ against _Nguyên_, and
a same-date-of-birth rule for the newborn-twins case that colour and initials
both fail. No other component library offers this; every hospital that has
thought about it runs the equivalent on paper.

## What it deliberately does not do

Record matching. "Would a reader in a hurry confuse these two rows" is not "are
these the same person" — the second belongs to a master patient index, has a
different risk profile, and a component library that started guessing at it
would be making a claim it cannot support.

## Testing

241 tests, including a 40-name locale table, an exhaustive check-digit
corruption sweep, a property test over generated collision sets, and a scaling
assertion that fails if per-pair work creeps back into the O(n²) loop.

---

Zoblocks is not a compliance boundary and is not a medical device. See the
repository README.
