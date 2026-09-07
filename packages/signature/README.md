# @zoblocks/signature

**Healthcare signature capture for Ant Design.** Draw, type or upload — and
record the times nobody signed, which is most of what makes this different from
a signature pad.

```bash
npm install @zoblocks/signature
```

```tsx
import { Form } from "antd";
import { Signature, signatureRequired } from "@zoblocks/signature";
import "@zoblocks/signature/styles.css";

<Form.Item name="consent" label="Patient signature" rules={[signatureRequired()]}>
  <Signature
    now={serverTime}
    meaning="consent"
    attestation="I have read the information about this procedure, I have had the chance to ask questions, and I agree to go ahead."
    subject={{ display: "Randall, Josh", reference: "Patient/4471902" }}
    recordedBy={{ name: "A. Okafor", credential: "RN" }}
  />
</Form.Item>;
```

antd is a **peer dependency** (v5.20+ or v6). The engine underneath —
[`@zoblocks/signature-core`](../signature-core) — has no dependency on
React or antd at all.

---

## The three things worth knowing before you integrate

### 1 · A decline is an answer, not an empty field

The value is a discriminated union over seven outcomes, not `string | null`.
The single most likely integration mistake is writing a rule that demands
`outcome === "signed"` — that makes a refusal impossible to submit, so the
product cannot record the one thing this component exists to record.

```ts
signatureRequired(); // isAnswered — a decline counts. Use this.
signatureAffirmative(); // isAffirmative — a decline does not. For consent gates only.
```

Then branch on the outcome to decide whether to proceed:

```ts
import { isAffirmative } from "@zoblocks/signature";
if (!isAffirmative(value)) return escalateToClinician(value);
```

### 2 · The typed path is not optional

Drawing is a path-dependent input technique. **WCAG 2.1.1 Keyboard — Level A**
— excepts only functions that genuinely require a path, and its normative
Note 1 refuses that excuse using handwriting as its worked example: the
technique needs a path, the underlying function does not. The function here is
recording assent, and typing a name achieves it.

`@zoblocks/signature-requires-typed-path` makes `methods={["draw"]}` a lint
error rather than a runtime warning, because the mistake renders perfectly and
passes every other test.

The typed field is also **never pre-filled**. Every authority on typed
signatures turns on intent to sign, and the one case that went the other way
(_Cunningham v. Zurich_) failed precisely because nothing showed the name was
"typed purposefully rather than generated automatically".

### 3 · The clock is yours

`now` is a required prop. A browser clock is not evidence — 42 CFR
482.24(c)(1) wants record entries "dated, timed, and authenticated" by whoever
is accountable, not by whatever the device was set to. Neither package reads
the current time anywhere, and a test greps the source to keep it that way.

---

## What you get

| Component               | For                                                              |
| ----------------------- | ---------------------------------------------------------------- |
| `<Signature>`           | The `Form.Item` control. Renders the record once signed.         |
| `<Signature.Pad>`       | Just the capture surface, for your own chrome.                   |
| `<SignatureModal>`      | The dialog — tabs, identity, attestation, outcomes.              |
| `<SignatureManifest>`   | The read-only record. Prints. This is what an auditor asks for.  |
| `<SignatureInk>`        | Draws an `Ink` as React elements. Never `innerHTML` — see below. |
| `<OutcomeSheet>`        | "Can't sign?" — declined, unable, verbal, on paper.              |
| `useSignatureCapture()` | Headless: pointer plumbing plus the engine, no chrome.           |

### Props worth calling out

| Prop                | Notes                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `now`               | **Required.** ISO 8601, server-supplied.                              |
| `meaning`           | `consent` · `author` · `verification` · … Maps to the ISO E1762 code. |
| `attestation`       | The statement being signed. Stored, so the manifest can reprint it.   |
| `capacities`        | Self, parent, proxy, legal representative, clinician, witness.        |
| `outcomes`          | Which non-signature exits to offer. `[]` hides "Can't sign?".         |
| `documentHash`      | Carried into the value, so later tampering is detectable.             |
| `captureBiometrics` | **Off by default.** See signature-core's README.                      |
| `onAuditEvent`      | opened · method-changed · signed · declined. You write the trail.     |

---

## Accessibility

The `<canvas>` is deliberately not the control. There is no ARIA role meaning
"freehand drawing surface", and `role="img"` on a live capture surface asserts
a non-interactive graphic — a lie about an element that takes input, and an
SC 4.1.2 failure. So:

- the widget is a `role="group"` with a real label and description (SC 1.3.1);
- the surface is `aria-hidden`, and the operable path is native DOM;
- a polite live region announces capture and clearing, because SVG changes are
  invisible to assistive technology and nothing else reports them;
- every toolbar control is a real `<button>` at 24×24 minimum (SC 2.5.8 — note
  the canvas itself is exempt, since spatially-selected areas count as one
  target, so 2.5.8 is entirely a chrome problem);
- the finished signature's alt text is _whose it is and when_, which is the
  equivalent purpose under SC 1.1.1 — never a description of the strokes.

A test signs the form using `userEvent.tab()` and `.keyboard()` only, never
dispatching a pointer event. If it passes, the Level A claim is a test result.

### antd gaps this closes by hand

antd ships no accessibility documentation, and its maintainers' stated position
on WCAG is "no plans yet". Verified gaps, all closed here:

| Gap                                                    | What we do                                               |
| ------------------------------------------------------ | -------------------------------------------------------- |
| Modal has no accessible name without `title`           | Pass `title` **and** `aria-labelledby` via `modalRender` |
| Initial focus lands on an invisible sentinel `<div>`   | Move it to the active tab in `afterOpenChange`           |
| Tabs drop `aria-controls` entirely without `<Tabs id>` | Always pass `id`                                         |
| `Upload` nests `role="button"` inside a `<button>`     | Use `Upload.Dragger`                                     |
| Close button's `aria-label` is hardcoded English       | Ours comes from the locale, and differs from "Cancel"    |

---

## Security

**No `dangerouslySetInnerHTML` anywhere.** `Ink` round-trips through a
database, so rendering a stored SVG string would let anyone able to write that
record store `<image href=x onerror=…>` and run it in the next reviewer's
browser. `<script>` inside injected SVG is inert, which is exactly what makes
that feel safe and is not.

Instead the value carries structured render data — path strings and positioned
text — and `<SignatureInk>` builds real elements from it. Path data cannot
carry script. The `svg` string stays on the value for storage, print and
export, where it never touches a DOM parser.

The component also never transmits anything. Uploads are read and re-encoded in
the browser, which is what strips EXIF from a phone photo of a signed page.

---

## Theming

Everything resolves through antd's CSS variables, so a `ConfigProvider` theme —
including `darkAlgorithm` — applies with no JavaScript. Forced-colors mode is
handled explicitly: the ink is `currentColor` on real SVG elements rather than a
script-painted canvas bitmap, so it is recoloured with everything else instead
of vanishing against a forced background.

---

## Not a medical device

ZoBlocks provides user-interface components. Signature capture does not by
itself establish the legal validity of any record; that depends on the
deployment, the jurisdiction, and the procedures around it. This component does
not authenticate anyone — 21 CFR 11.200(a)'s two-component rule lives in your
auth layer — and it does not satisfy DEA EPCS, which is a separate and far
stricter regime.
