# Oxygen UI in a Vue 3 or Nuxt app

The five loaders ship as dependency-free custom elements. Vue needs exactly one
line of compiler configuration; everything else is a tag.

← [How to start](../how-to-start.md)

> The clinical components — Result Value, Care Timeline, Signature, Identity —
> are React-only. The loaders are the whole of the Vue story today.

---

## 1. Install

```bash
npm install @oxygenui-design/loaders @oxygenui-design/tokens
```

Zero runtime dependencies, SSR-safe.

## 2. Tell Vue these are custom elements

Without this, Vue's compiler treats `<ox-pulse-loader>` as a component, fails to
resolve it, and **warns at runtime rather than failing the build** — so it
ships.

```ts
// vite.config.ts
import vue from "@vitejs/plugin-vue";

vue({
  template: {
    compilerOptions: { isCustomElement: (tag) => tag.startsWith("ox-") },
  },
});
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  vue: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("ox-") } },
});
```

## 3. Import the tokens and the loaders you use

```ts
// main.ts
import "@oxygenui-design/tokens/oxygen-tokens.css";
import "@oxygenui-design/loaders/pulse";
import "@oxygenui-design/loaders/rhythm";
```

Import per loader rather than the barrel, so you ship only what you render. The
tokens stylesheet is optional — without it every colour falls back to
`currentColor` — but you want it.

## 4. Use the tag

```vue
<template>
  <ox-pulse-loader label="Loading your records" mode="page" :open="pending" />

  <ox-infusion-loader label="Importing records" :progress="percent" />
</template>
```

`:progress="percent"` binds a number. Vue writes a DOM property when the key
exists on the element and an attribute otherwise; the elements reflect every
property to its attribute and read state back from attributes only, so both
paths converge on identical DOM.

## 5. Listen for events

Three events, all bubbling and crossing the shadow boundary, so you can listen
on a wrapper rather than on the element:

```vue
<div @ox-loader-slow="track('slow_wait')">
  <ox-pulse-loader label="Loading results" slow-after="8000" />
</div>
```

`ox-loader-show` · `ox-loader-slow` · `ox-loader-hide`. They are hyphenated
rather than colon-separated because Angular's `(event)` binding reserves the
colon — a name Vue would accept but Angular could not compile.

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

Every colour resolves through Oxygen's semantic tokens, and per-element
overrides are plain custom properties:

```css
ox-pulse-loader {
  --ox-loader-color: var(--brand-500);
  --ox-loader-size: 120px;
}
```

Shadow parts: `::part(art)`, `::part(label)`, `::part(hint)`, `::part(progress)`.

## Nuxt and SSR

The elements are SSR-safe: they touch no browser global at module scope. Import
them in a client plugin (`plugins/loaders.client.ts`) so the custom-element
registration runs only in the browser, and the server-rendered markup is an
unupgraded tag that upgrades on hydration.

**A boot screen that must render before any JavaScript** cannot use these — they
need their module. Copy the static markup and stylesheet from the
[loader documentation](https://oxygenui.design/components/pulse-loader) instead.

---

## Is Vue actually tested?

`apps/smoke/vue` is a running Vue 3.5 application, compiled by Vue's real SFC
compiler and driven in Chromium, Firefox, and WebKit on every CI run. It is not
a claim — and it was not always true: that app's first run found the elements
broken in Vue, because Vue assigns to a property when one exists and `progress`
was a getter with no setter.

---

- Something not working? [Troubleshooting](../reference/troubleshooting.md)
- [Angular](angular.md) · [Svelte](svelte.md) · [Plain HTML](html.md)
