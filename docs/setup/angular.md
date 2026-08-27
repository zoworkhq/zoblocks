# Oxygen UI in an Angular app

The five loaders ship as dependency-free custom elements. Angular needs one
schema declaration; everything else is a tag.

← [How to start](../how-to-start.md)

> The clinical components — Result Value, Care Timeline, Signature, Identity —
> are React-only. The loaders are the whole of the Angular story today.

---

## 1. Install

```bash
npm install @oxygenui-design/loaders @oxygenui-design/tokens
```

Zero runtime dependencies, SSR-safe.

## 2. Import the tokens and the loaders you use

```ts
// main.ts
import "@oxygenui-design/tokens/oxygen-tokens.css";
import "@oxygenui-design/loaders/pulse";
import "@oxygenui-design/loaders/rhythm";
```

Import per loader rather than the barrel, so you ship only what you render.

## 3. Declare the schema

Angular is the one framework here whose default behaviour is to **fail the
build** on an unrecognised element (NG0304). That is a good default and it means
you cannot forget this step:

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

@Component({
  selector: "app-chart",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `…`,
})
export class ChartComponent {}
```

For a `NgModule`-based app, put `schemas: [CUSTOM_ELEMENTS_SCHEMA]` on the
module instead.

## 4. Bind with `[attr.…]`, not `[…]`

```html
<ox-pulse-loader
  label="Loading results"
  mode="overlay"
  [attr.open]="open()"
  [attr.progress]="progress()"
  (ox-loader-slow)="onSlow()"
>
</ox-pulse-loader>
```

Property binding to a name Angular cannot find on the element is itself an
error, so bind the **attribute**. The elements reflect every property to its
attribute and read state back from attributes only, so the attribute path is the
canonical one, not a workaround.

Events are hyphenated — `ox-loader-slow`, not `ox-loader:slow` — precisely
because Angular's `(event)` syntax reserves the colon for its global-target form
(`(window:resize)`). A colon in the name would not compile.

---

## The five

| Element                | Mark                         | Cadence  | Best for                                    |
| ---------------------- | ---------------------------- | -------- | ------------------------------------------- |
| `<ox-pulse-loader>`    | Open heart + rhythm line     | 60 bpm   | App boot, patient portals                   |
| `<ox-rhythm-loader>`   | One rhythm strip, swept      | 60 bpm   | Clinical density, inline, tables            |
| `<ox-breath-loader>`   | Three rings from a soft core | 15 / min | Patient-facing screens, long waits          |
| `<ox-helix-loader>`    | Two strands of dots          | 23 / min | Labs, genomics, diagnostics                 |
| `<ox-infusion-loader>` | Capsule with a soft slug     | 21 / min | **Determinate progress** — imports, uploads |

Full attribute, property, and event tables:
[`@oxygenui-design/loaders`](../../packages/loaders/README.md).

## Styling

```css
ox-pulse-loader {
  --ox-loader-color: var(--brand-500);
  --ox-loader-size: 120px;
}
```

Shadow parts: `::part(art)`, `::part(label)`, `::part(hint)`, `::part(progress)`.

## SSR

The elements touch no browser global at module scope, so they are safe under
Angular Universal. **A boot screen that must render before any JavaScript**
cannot use them — they need their module. Copy the static markup and stylesheet
from the [loader documentation](https://oxygenui.design/components/pulse-loader)
instead.

---

## Is Angular actually tested?

`apps/smoke/angular` is a running Angular 22 application, compiled by Angular's
own template compiler and driven in Chromium, Firefox, and WebKit on every CI
run. It is not a claim — and it was not always true: that app's first run found
the elements **unbindable in Angular**, because an event name contained a colon.

---

- Something not working? [Troubleshooting](../reference/troubleshooting.md)
- [Vue](vue.md) · [Svelte](svelte.md) · [Plain HTML](html.md)
