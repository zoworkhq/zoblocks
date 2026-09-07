# @zoblocks/elements

ZoBlocks controls as dependency-free custom elements. No framework, no build
step, no runtime dependencies — a `<script type="module">` tag is enough.

```bash
npm install @zoblocks/elements
```

```html
<script type="module">
  import "@zoblocks/elements/switch";
</script>

<zb-switch label="Contact precautions" value="on" tone="caution" state-labels="in-effect">
</zb-switch>
```

---

## `<zb-switch>`

A binary control for a record that is shared, asynchronous, and often missing
the fact you are asking it about.

### The element asks; the host decides

`<zb-switch>` never changes its own value. Activating it dispatches
`zb-switch-request` and nothing else happens until you say so.

That is not caution for its own sake. A switch that flips optimistically and
snaps back when the write fails is the single most common defect in clinical
software: a clinician sees green, walks away, and the precaution was never set.
Making the request explicit means the failure path has to be written down.

```js
const el = document.querySelector("zb-switch");

el.addEventListener("zb-switch-request", async (event) => {
  el.phase = "pending";
  try {
    await api.setPrecautions(event.detail.value === "on");
    el.value = event.detail.value;
    el.phase = "committed";
  } catch (error) {
    el.error = error.message;
    el.phase = "reverted"; // announced assertively, with the value that now holds
  }
});
```

The React channel — `@zoblocks/react` — owns this machine itself, because
`onCommit` can take a promise. An element cannot assume one, so the division
falls here.

### Three values, not two

`value` is `"on"`, `"off"`, or **`"unknown"`**.

"Off" and "nobody asked" are different clinical facts. An advance directive
recorded as absent and one nobody collected must not render identically, and a
two-state control cannot tell you which you are looking at. Pair `unknown` with
`absent-reason` and the element renders the specific word — "Not asked",
"Declined to answer", "Restricted — not shown", "Result pending".

A user can leave `unknown`. A user can never enter it: re-entering would be
un-asking a question, and the correction for a wrong answer is a new answer with
a provenance. Activating an unknown switch requests `"on"`; a visually hidden,
keyboard-reachable button requests `"off"`.

### Attributes

| Attribute       | Values                                                                                                            | Notes                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `value`         | `on` · `off` · `unknown`                                                                                          | What the record says.                                |
| `phase`         | `idle` · `pending` · `committed` · `reverted` · `blocked` · `queued` · `stale`                                    | What the system is doing about it. You set this.     |
| `error`         | any string                                                                                                        | Shown and announced in `reverted` and `blocked`.     |
| `readonly`      | boolean                                                                                                           | Stays in the tab order. Prefer this over `disabled`. |
| `locked-reason` | any string                                                                                                        | Why it cannot be changed. Announced.                 |
| `disabled`      | boolean                                                                                                           | Last resort — see below.                             |
| `tone`          | `affirmative` · `neutral` · `caution` · `critical`                                                                | The direction of the on-state, not its severity.     |
| `size`          | `micro` · `small` · `default` · `large`                                                                           | The hit area does not shrink with the pill.          |
| `label`         | any string                                                                                                        | The accessible name.                                 |
| `state-labels`  | `on-off` · `yes-no` · `active-inactive` · `in-effect` · `allowed-blocked` · `given-declined` · `enabled-disabled` | "On"/"Off" is wrong for most clinical facts.         |
| `absent-reason` | a FHIR data-absent-reason group                                                                                   | The specific word for an absence.                    |
| `show-state`    | `false` to hide                                                                                                   | The word beside the control.                         |

Everything is also a property: `el.value`, `el.phase`, `el.error`,
`el.readOnly`, `el.disabled`.

### Events

All bubble and cross the shadow boundary. Hyphens rather than colons, because
Angular reserves the colon in `(event)` bindings for its global-target syntax.

- `zb-switch-request` — `detail: { value, from }`
- `zb-switch-resolve-conflict`
- `zb-switch-cancel-queued`

### `readonly`, not `disabled`

In clinical software the honest reason is almost never "disabled". It is _the
encounter is signed_, _your role cannot change this_, _this is historical_.
`disabled` removes the control from the tab order, so a screen-reader user never
learns it exists — let alone why. Use `readonly` with a `locked-reason`;
`disabled` is correct only when the unavailability is transient and caused by
something the user just did.

### Styling

Every colour and dimension resolves through an `--zb-switch-*` custom property,
with a literal fallback so the element is legible without the ZoBlocks token
stylesheet. Load `@zoblocks/tokens` and it follows your theme, your
brand, and your density automatically.

```css
[data-brand="northshore"] {
  --zb-switch-radius: 0.25rem;
  --zb-switch-track-on-bg: #1f4ed8;
}
```

Shadow parts are exposed for anything tokens cannot reach: `root`, `control`,
`track`, `thumb`, `glyph`, `state`.

### Accessibility

- A real `role="switch"` with `aria-checked`, on a `<button>`. `aria-checked="mixed"` for `unknown`.
- The state is mirrored onto the host as `data-zb-*`, so your own queries and your axe run find it without piercing the shadow boundary.
- The hit area is decoupled from the pill: a 26×14&nbsp;px `micro` switch keeps a full-size target.
- Thumb position, a thumb glyph and a text state word each carry the state alone — on-track and off-track sit within about 1.2:1 of each other in luminance, so colour cannot be the signal.
- `pending` keeps focus, keeps the accessible name, and sets `aria-busy`. It never disables.
- Success is announced politely; a failed write interrupts, and names the value that now holds.
- Reduced motion is a designed still state. Forced colours renders a real switch.

### What it does not do

- It does not own the commit machine. That is deliberate — see above.
- It does not ship the `segmented`, `chip` or `row` appearances yet; the pill only. Use `@zoblocks/react` if you need those.
- It is not a compliance boundary, and it is not clinical decision support.

---

MIT © Zowork
