# @zoblocks/loaders

**Healthcare page loaders as dependency-free custom elements.** Five marks drawn
from clinical instruments rather than from spinners — a heartbeat, a rhythm
strip, a breath, a helix, and an infusion — themeable, accessible, and honest
about how long a wait has taken.

Part of [Zoblocks](https://zoblocks.design). Zero runtime dependencies. Works
in React, Vue, Angular, Svelte, Solid, Rails, Django, or a plain HTML file.

```bash
npm install @zoblocks/loaders
```

```html
<script type="module">
  import "@zoblocks/loaders/pulse";
</script>

<zb-pulse-loader label="Loading your records"></zb-pulse-loader>
```

---

## The five

| Element                | Mark                         | Cadence  | Best for                                    |
| ---------------------- | ---------------------------- | -------- | ------------------------------------------- |
| `<zb-pulse-loader>`    | Open heart + rhythm line     | 60 bpm   | App boot, patient portals, the brand moment |
| `<zb-rhythm-loader>`   | One rhythm strip, swept      | 60 bpm   | Clinical density, inline, tables            |
| `<zb-breath-loader>`   | Three rings from a soft core | 15 / min | Patient-facing screens, long waits          |
| `<zb-helix-loader>`    | Two strands of dots          | 23 / min | Labs, genomics, diagnostics                 |
| `<zb-infusion-loader>` | Capsule with a soft slug     | 21 / min | **Determinate progress** — imports, uploads |

`<zb-pulse-loader>` renders the rhythm line alone below 40px, where the heart's
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

Every framework below has a running application in
[`apps/smoke`](../../apps/smoke), built by that framework's real compiler and
driven through the same script in Chromium, Firefox, and WebKit on every CI run.
"Works in Vue" is a test result here, not a claim — and it was not always true:
the smoke apps' first run found the elements broken in React 19, in Vue, and in
Angular, for three different reasons.

| Framework  | Tested version | Setup required                            |
| ---------- | -------------- | ----------------------------------------- |
| Plain HTML | —              | none                                      |
| React      | 18.3 and 19.2  | none                                      |
| Vue        | 3.5            | one `isCustomElement` line                |
| Angular    | 22.1           | `CUSTOM_ELEMENTS_SCHEMA` on the component |
| Svelte     | 5.19           | none                                      |

### Vue 3 / Nuxt

```ts
// main.ts
import "@zoblocks/loaders/breath";
```

```ts
// vite.config.ts — tell the compiler these are custom elements
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("zb-") } } });
```

```vue
<zb-breath-loader mode="page" label="Loading your information" :open="pending" />
```

### Angular 17+

```ts
// main.ts
import "@zoblocks/loaders/pulse";

// component
@Component({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })
```

```html
<zb-pulse-loader
  mode="overlay"
  label="Loading results"
  [attr.progress]="progress()"
  (zb-loader-slow)="onSlow()"
>
</zb-pulse-loader>
```

Angular's `(event)` syntax reserves the colon for its global-target form —
`(window:resize)` — so an event named `zb-loader:slow` would not compile. That
is why these events are hyphenated; see [Events](#events).

### Svelte, Solid, Lit, plain HTML

Import the module and use the tag. No wrapper needed.

### React

Both React 18 and React 19 work, by different routes. React 19 writes a DOM
property when the element has one and an attribute otherwise; React 18 has no
property path and stringifies everything into an attribute. The elements reflect
every property to its attribute and read state back from attributes only, so the
two majors converge on identical DOM.

For a React project we still recommend the registry components — they are copied
into your repo as readable source:

```bash
npx @zoblocks/cli add pulse-loader
```

### Before the bundle loads

The elements need their module. For a boot screen that must render before any
JavaScript, copy the static markup and stylesheet from the
[loader documentation](https://zoblocks.design/components/pulse-loader) instead.

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
| `slow-after`   | ms, 0 = off              | 8000                  | Show the stall hint and fire `zb-loader-slow`.                            |
| `slow-hint`    | string                   | see below             | Replaces the stall wording.                                               |
| `open`         | `"false"` to close       | open                  | Controlled visibility; respects `min-duration`.                           |
| `motion`       | `auto\|reduced\|full`    | `auto`                | `auto` follows the OS; `full` opts out of it.                             |
| `scrim`        | `"false"` to disable     | on                    | Backdrop behind `overlay` and `page`.                                     |
| `announce`     | `polite\|assertive\|off` | `polite`              | Live-region politeness while indeterminate.                               |

Default stall wording: _"Still loading. You can keep waiting or go back."_ — it
names the situation and says what remains possible, rather than apologising.

## Properties

Every attribute above is also a property, in camelCase — `show-label` is
`showLabel`, `min-duration` is `minDuration`. Setting one writes the attribute:

```js
loader.label = "Loading imaging study"; //  → label="Loading imaging study"
loader.progress = 40; //  → progress="40"
loader.open = false; //  → open="false"
loader.label = null; //  → attribute removed, default restored
```

Attributes stay the single source of truth; properties are a typed way to write
them. This matters more than it looks: React 19, Vue, Solid, and Lit all decide
per binding whether to write a property or an attribute, and they all decide the
same way — `if (key in element)`. A property that exists but cannot be assigned
throws, which is what these elements did before `apps/smoke` existed.

`sizePx` is derived from `size` and is read-only.

## Events

`zb-loader-show`, `zb-loader-slow`, `zb-loader-hide` — exported as
`LOADER_EVENTS`. All bubble and cross the shadow boundary, so you can listen on
a wrapper rather than on the element.

```js
loader.addEventListener("zb-loader-slow", () => analytics.track("slow_wait"));
```

Hyphens rather than colons, because Angular's `(event)` binding reserves the
colon for global targets and cannot bind a name that contains one.

## Styling

Every colour resolves through Zoblocks's semantic tokens, falling back to
`currentColor` when the token stylesheet is absent.

```css
zb-pulse-loader {
  --zb-loader-color: var(--brand-500);
  --zb-loader-size: 120px;
  --zb-loader-scrim: rgb(0 0 0 / 0.6);
  --zb-loader-z: 9999;
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

Zoblocks is not a compliance boundary. It does not make an application HIPAA,
GDPR, or DPDP compliant, and it is not a medical device or clinical decision
support. These loaders display no patient data and depict no real rhythm — a
`bpm` value is a cadence for an animation, never a measurement of a person.

## Licence

MIT © Zowork
