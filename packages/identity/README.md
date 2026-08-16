# @oxygenui-design/identity

Patient identity for Ant Design: an avatar that says _why_ a photograph is
missing, a chip that keeps two patients with one name apart, and a banner that
knows what it is guarding.

```tsx
import { IdentityProvider, PatientBanner, PatientGuard } from "@oxygenui-design/identity";
import "@oxygenui-design/identity/styles.css";

<IdentityProvider disclosure="clinical" photos="allow" onSensitiveReveal={audit.write}>
  <PatientBanner
    patient={patient}
    context="action"
    identifiers={[{ kind: "mrn" }, { kind: "nhs" }]} // two — enforced by the type
  >
    <PatientGuard expect={openedFor.id} expectName={openedFor.name}>
      <OrderForm />
    </PatientGuard>
  </PatientBanner>
</IdentityProvider>;
```

## The argument

A banner is the last surface a clinician reads before they act. Adelman et al.
(_JAMIA_ 2013, 901,776 ordering sessions) found a dismissible "check the
patient" alert reduced wrong-patient orders with an odds ratio of 0.84, while
making the clinician re-enter the patient's initials reduced them with an odds
ratio of 0.60. Everyone ships the first. `PatientVerify` is the second, and
`PatientGuard` is what makes either possible: the action knows which chart is on
screen.

## Invariants the compiler holds

| Invariant                                     | How                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Two identifiers before a care action          | `context="action"` takes `readonly [T, T, ...T[]]`. NPSG.01.01.01 as a compile error. |
| The legal name costs a sentence               | `nameContext="legal"` requires `legalNameReason`.                                     |
| `Patient.gender` is not renderable            | Absent from the `Field` union; the four alternatives are named in the error.          |
| Identity is atomic                            | `patient` \| `loading` \| `error`. No shape carries a name without its identifiers.   |
| One banner per screen                         | Reported through `onBannerViolation`.                                                 |
| A form's patient equals the displayed patient | `PatientGuard` refuses to render on mismatch.                                         |

Nothing throws and nothing writes to the console. A wrong-patient mismatch
refuses to render in _every_ environment — that is not a developer-experience
concern to compile out of a production bundle — and a component that logged
would send PHI onward to whatever error reporter the customer installed.

## Five absences, not one fallback

Displaying a patient's photograph in the banner is associated with a measurable
reduction in wrong-patient order entry. That makes a silently missing
photograph a silently _degraded safety control_, so the component distinguishes
`present`, `none-on-file`, `unavailable`, `withheld` and `loading` — visually,
and in the accessible name. Every other design system collapses the first four
into "show initials".

## Accessibility

One region, one composed name — `"Patient: Amara Chinelo Okonkwo, born 8 March
1985, age 41 y, M R N 123, 456, 789, St Aidan's. Active."` — rather than seven
fragments a screen-reader user has to reassemble into a person. `M R N` is
spelled out because screen readers pronounce the unspaced form "mern".

When the displayed patient changes, a polite live region says so. A sighted user
gets a full visual repaint; without this, a screen-reader user gets nothing.

## Motion

Motion on an identity means _this changed_, and nothing else. The patient swap
animates the whole block as one unit — never field by field, because staggering
lets a reader catch one patient's identifier beside another's name for about a
tenth of a second. Photographs hard-cut rather than cross-fade, because a
dissolve between two faces produces a face that is neither person. Error states
have a zero entrance duration. `prefers-reduced-motion` sets every duration to
zero rather than shortening it.

## Peer dependencies

`antd` (>= 5.20 or >= 6), `react`, `react-dom`. The engine
(`@oxygenui-design/identity-core`) has none of these.

---

Oxygen UI is not a compliance boundary and is not a medical device. These
components reduce the chance of a _display_ error; they make no claim about
care.
