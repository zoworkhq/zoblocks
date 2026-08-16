# @oxygenui-design/loaders

**Healthcare page loaders as dependency-free custom elements.** Five marks drawn
from clinical instruments rather than from spinners — a heartbeat, a rhythm
strip, a breath, a helix, and an infusion — themeable, accessible, and honest
about how long a wait has taken.

Part of [Oxygen UI](https://oxygenui.design). Zero runtime dependencies. Works
in React, Vue, Angular, Svelte, Solid, Rails, Django, or a plain HTML file.

```bash
npm install @oxygenui-design/loaders
```

```html
<script type="module">
  import "@oxygenui-design/loaders/pulse";
</script>

<ox-pulse-loader label="Loading your records"></ox-pulse-loader>
```

---

## The five

| Element                | Mark                         | Cadence  | Best for                                    |
| ---------------------- | ---------------------------- | -------- | ------------------------------------------- |
| `<ox-pulse-loader>`    | Open heart + rhythm line     | 60 bpm   | App boot, patient portals, the brand moment |
| `<ox-rhythm-loader>`   | One rhythm strip, swept      | 60 bpm   | Clinical density, inline, tables            |
| `<ox-breath-loader>`   | Three rings from a soft core | 15 / min | Patient-facing screens, long waits          |
| `<ox-helix-loader>`    | Two strands of dots          | 23 / min | Labs, genomics, diagnostics                 |
| `<ox-infusion-loader>` | Capsule with a soft slug     | 21 / min | **Determinate progress** — imports, uploads |

`<ox-pulse-loader>` renders the rhythm line alone below 40px, where the heart's
detail collapses. That is the correct rendering of the mark at that size, not a
fallback.

---

## Why these and not a spinner

A spinner's tempo says _the system is working hard_. On a screen where someone
is waiting for their own results, that is the wrong sentence. These are paced to
resting physiology instead:

- **60 bpm** is a resting sinus rhythm. Clamped to 40–100, because this is
  decoration on a healthcare screen and a loader beating at 180 would be read as
  a number by the only people qualified to read it.
- **A 7% beat**, so the motion is noticed peripherally and never tracked.
- **Nothing above 1.7 Hz**, comfortably inside WCAG 2.3.1's three-flash limit.
- **Seamless loops.** The shapes draw once on mount, not once per cycle.

---

## Framework setup

### Vue 3 / Nuxt

```ts
// main.ts
import "@oxygenui-design/loaders/breath";
```

```ts
// vite.config.ts — tell the compiler these are custom elements
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("ox-") } } });
```

```vue
<ox-breath-loader mode="page" label="Loading your information" :open="pending" />
```

### Angular 17+

```ts
// main.ts
import "@oxygenui-design/loaders/pulse";

// component
@Component({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })
```

```html
<ox-pulse-loader mode="overlay" [attr.progress]="progress()" label="Loading results">
</ox-pulse-loader>
```

### Svelte, Solid, Lit, plain HTML

Import the module and use the tag. No wrapper needed.

### React

React 19 passes attributes and events to custom elements natively, so the
elements work directly. For a React project we recommend the registry
components instead — they are copied into your repo as readable source:

```bash
pnpm dlx shadcn@latest add @oxygenui/pulse-loader
```

### Before the bundle loads

The elements need their module. For a boot screen that must render before any
JavaScript, copy the static markup and stylesheet from the
[loader documentation](https://oxygenui.design/components/pulse-loader) instead.

---

## Attributes

| Attribute      | Type                     | Default               | What it does                                                              |
| -------------- | ------------------------ | --------------------- | ------------------------------------------------------------------------- |
| `label`        | string                   | `"Loading"`           | What is loading. Always announced; shown when `show-label`.               |
| `show-label`   | boolean                  | true in page/overlay  | Render the label as text.                                                 |
| `hint`         | string                   | —                     | A second line under the label.                                            |
| `size`         | `sm\|md\|lg\|xl` or px   | `lg` (`xl` for pulse) | 20 / 32 / 56 / 88, or an explicit width.                                  |
| `mode`         | `inline\|overlay\|page`  | `inline`              | Placement. `overlay` covers its positioned ancestor; `page` the viewport. |
| `progress`     | 0–100                    | —                     | Turns the loader determinate (`infusion` shows it).                       |
| `bpm`          | 40–100                   | 60                    | Beat rate for `pulse` and `rhythm`. Clamped.                              |
| `speed`        | 0.5–2                    | 1                     | Cadence multiplier for every loader. Clamped.                             |
| `delay`        | ms                       | 0                     | Wait before appearing, so a fast response never flashes a loader.         |
| `min-duration` | ms                       | 400                   | Once shown, stay at least this long.                                      |
| `slow-after`   | ms, 0 = off              | 8000                  | Show the stall hint and fire `ox-loader:slow`.                            |
| `slow-hint`    | string                   | see below             | Replaces the stall wording.                                               |
| `open`         | `"false"` to close       | open                  | Controlled visibility; respects `min-duration`.                           |
| `motion`       | `auto\|reduced\|full`    | `auto`                | `auto` follows the OS; `full` opts out of it.                             |
| `scrim`        | `"false"` to disable     | on                    | Backdrop behind `overlay` and `page`.                                     |
| `announce`     | `polite\|assertive\|off` | `polite`              | Live-region politeness while indeterminate.                               |

Default stall wording: _"Still loading. You can keep waiting or go back."_ — it
names the situation and says what remains possible, rather than apologising.

## Events

`ox-loader:show`, `ox-loader:slow`, `ox-loader:hide`. All bubble and cross the
shadow boundary.

```js
loader.addEventListener("ox-loader:slow", () => analytics.track("slow_wait"));
```

## Styling

Every colour resolves through Oxygen's semantic tokens, falling back to
`currentColor` when the token stylesheet is absent.

```css
ox-pulse-loader {
  --ox-loader-color: var(--brand-500);
  --ox-loader-size: 120px;
  --ox-loader-scrim: rgb(0 0 0 / 0.6);
  --ox-loader-z: 9999;
}
```

Shadow parts: `::part(art)`, `::part(label)`, `::part(hint)`, `::part(progress)`.

---

## Accessibility

- **Indeterminate** is `role="status"` in a polite live region. The label is
  always in the DOM — visually hidden when `show-label` is false — because an
  empty live region announces nothing at all.
- **Determinate** is `role="progressbar"` with `aria-valuemin`, `aria-valuemax`,
  `aria-valuenow`, and a spoken `aria-valuetext`.
- Roles land on the **host element**, so your own queries and tests can see them.
- The art is `aria-hidden`. A decorative mark that announces itself becomes a
  second, meaningless label on every wait in the product.
- `prefers-reduced-motion` gets a **designed** still state: shapes complete, the
  track comes to full strength, and the mark breathes in opacity. Nothing is
  frozen mid-sweep.
- Forced-colours mode maps to `CanvasText` and `Canvas`.
- Animations pause when the tab is hidden.

## What this is not

Oxygen UI is not a compliance boundary. It does not make an application HIPAA,
GDPR, or DPDP compliant, and it is not a medical device or clinical decision
support. These loaders display no patient data and depict no real rhythm — a
`bpm` value is a cadence for an animation, never a measurement of a person.

## Licence

MIT © Zowork
