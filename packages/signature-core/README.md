# @zoblocks/signature-core

**The capture engine behind ZoBlocks's Signature component.** Stroke model,
smoothing, vector export, and a value type that records what actually happened —
including every time nobody signed.

No React. No Ant Design. No DOM. No dependencies.

```bash
npm install @zoblocks/signature-core
```

---

## Why this is a separate package

Two reasons, and the second is the load-bearing one.

**It is testable without a browser.** The engine takes plain samples, not
`PointerEvent`s, so undo/redo, the ink gate, and export determinism are asserted
by feeding it synthetic sequences and diffing SVG text — no jsdom, no headless
browser, no flake. 80 tests run in under 20 ms.

**It survives the architecture decision.** Whether ZoBlocks ends up wrapping Ant
Design, matching it, or migrating to it, none of that reaches this package. The
expensive half of a signature component is the engine, and this half is
portable.

---

## The three ideas

### 1 · Capture strokes, not pixels

Most signature pads draw onto a canvas and keep the bitmap. That loses four
things at once:

| Lost                    | Consequence                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Exact undo              | "Back" ends up meaning "start again", because nobody snapshots the canvas per stroke.    |
| Resolution independence | A 96 dpi bitmap on a printed consent form looks like a fax.                              |
| Re-theming              | Ink captured as dark pixels is invisible in dark mode and under forced colors.           |
| Any forensic content    | Timing and pressure are all a drawn signature has, and a flattened bitmap discards them. |

Here the `Stroke[]` is the source of truth and SVG, PNG and statistics are all
renders of it.

### 2 · Absence is a fact

The value is a discriminated union over seven outcomes, not `string | null`:

```ts
type SignatureValue =
  | SignedValue // they signed — draw, type or upload
  | DeclinedValue // they read it and refused. A decision, not a failure.
  | UnableValue // physically or cognitively cannot. Witness required.
  | VerbalValue // consent by phone or video. Witness required.
  | OnPaperValue // wet signature, scan pending
  | PendingValue // signed by one party, awaiting a countersignature
  | RevokedValue; // was valid, withdrawn. The original is retained.
```

A patient who **refused to sign** and a form nobody opened are different facts
with different consequences, and a two-state type makes the difference
unrecordable. `unable` without a witness is a compile error, not a code-review
comment.

Two predicates matter more than they look:

```ts
isAnswered(value); // a decline counts — otherwise `required` makes refusal impossible
isAffirmative(value); // a decline does not — nothing proceeds on it
```

Wiring a `required` rule to "signed" rather than `isAnswered` is the single most
likely integration mistake.

### 3 · The clock and the DOM belong to the host

There is no `Date.now()` and no `document` anywhere in this package, and a test
greps the source to keep it that way. A browser clock is not evidence — 42 CFR
482.24(c)(1) wants record entries "dated, timed, and authenticated" by whoever
is accountable, not by whatever the device was set to. Timestamps arrive as
props.

---

## Usage

```ts
import { SignatureCapture, toInk, toFhirBundle } from "@zoblocks/signature-core";

const pad = new SignatureCapture();

// Your pointer handlers feed it samples. `t` is relative, in ms.
pad.down({ x: 10, y: 40, t: 0, pointerType: "pen", pressure: 0.4 });
pad.move({ x: 32, y: 18, t: 16, pressure: 0.6 });
pad.up({ x: 61, y: 44, t: 33 });

pad.isEmpty; // false — enough ink to be a signature, not a stray tap
pad.canUndo; // true
pad.undo();
pad.redo();

const ink = toInk(pad.strokes); // { strokes, svg, bounds }
```

### The ink gate

A stray tap on a tablet otherwise enables the commit button and a dot becomes a
legal signature. Three measures, because each alone has a hole:

```ts
assessInk(strokes);
// { ok: false, failed: ["minPathLength", "minDiagonal"], … }
```

Path length alone passes a fast scribble in one spot; diagonal alone passes two
dots at opposite corners; point count alone passes a slow press that never
moves.

### Palm rejection

On a tablet, the hand holding the stylus lands on the glass and draws a second
line across the signature. Browsers report it as a legitimate touch pointer, so
the engine ignores touch once a pen has been seen — stickily, because a palm
often lands _before_ the nib. Touch-only signing (most patients, most of the
time) is unaffected.

### FHIR

```ts
const bundle = toFhirBundle(value, {
  release: "R4",
  subject: { reference: "Patient/4471902", display: "Randall, Josh" },
});
```

**`Consent` has no signature element** — not in R4, not in R5. Neither does
`Composition.attester` nor `DocumentReference.attester`. Only
`Provenance.signature`, `Contract.signer.signature` and `Bundle.signature` carry
the `Signature` datatype. So the output is a transaction `Bundle` containing the
consent _and_ a `Provenance` pointing at it.

The R4 shape is emitted for both releases: R5 only relaxed cardinality on
`type`, `when` and `who`, so R4's stricter shape is a strict subset of what R5
accepts.

Every outcome produces a `Provenance`, including the ones with no signature —
a decline is an event with an actor and a time, and modelling it as the absence
of a `Provenance` would make it indistinguishable from a form nobody opened.

---

## What this is not

`sigFormat` is `image/png`, and that is an honest declaration. This produces a
**graphical** signature: a picture of a mark, carrying no cryptographic
integrity guarantee. Anyone can crop it out and paste it elsewhere.

Where non-repudiation is genuinely required, put two entries in the same
`Provenance.signature` array — the PNG for human review, and a JWS over the
canonical bytes for actual integrity. `withDetachedSignature()` is the seam;
signing keys are a deployment concern and do not belong in a UI package.

It also does not authenticate anyone. 21 CFR 11.200(a)'s two-component rule
lives in the application's auth layer. This records the identity the host
asserts.

---

## Biometrics

`summariseBiometrics()` exists and is never called automatically. Stroke timing
and pressure have real forensic value and real privacy exposure. Illinois BIPA
explicitly excludes "writing samples, written signatures" from its definition of
a biometric identifier, and Texas CUBI's closed enumeration does not reach them
either — but whether the _dynamics_ behind a signature are a writing sample or a
behavioural biometric is not settled by either text. That is a call for the
integrator and their counsel, not a default inherited from us.

---

## Not a medical device

ZoBlocks provides user-interface components. Signature capture does not by
itself establish the legal validity of any record; that depends on the
deployment, the jurisdiction, and the procedures around it.
