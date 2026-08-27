# Oxygen UI in a Svelte or SvelteKit app

The five loaders ship as dependency-free custom elements. Svelte needs no setup
at all — import the module and use the tag.

← [How to start](../how-to-start.md)

> The clinical components — Result Value, Care Timeline, Signature, Identity —
> are React-only. The loaders are the whole of the Svelte story today.

---

## 1. Install

```bash
npm install @oxygenui-design/loaders @oxygenui-design/tokens
```

Zero runtime dependencies, SSR-safe.

## 2. Import the tokens and the loaders you use

```ts
// src/main.ts, or +layout.svelte in SvelteKit
import "@oxygenui-design/tokens/oxygen-tokens.css";
import "@oxygenui-design/loaders/pulse";
import "@oxygenui-design/loaders/infusion";
```

Import per loader rather than the barrel, so you ship only what you render.

## 3. Use the tag

```svelte
<script>
  let pending = $state(true);
  let percent = $state(0);
</script>

<ox-pulse-loader label="Loading your records" mode="page" open={pending} />

<ox-infusion-loader label="Importing records" progress={percent} />

<div on:ox-loader-slow={() => track("slow_wait")}>
  <ox-rhythm-loader label="Loading results" slow-after="8000" />
</div>
```

No wrapper, no schema, no compiler option. Svelte writes attributes for unknown
elements, which is the path these elements treat as canonical.

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

Svelte scopes component styles, so target the element from a global block —
`:global(ox-pulse-loader) { … }` — or set the custom properties on an ancestor.

## SvelteKit and SSR

The elements touch no browser global at module scope, so importing them in
`+layout.svelte` is safe. The server renders an unupgraded tag that upgrades on
hydration.

**A boot screen that must render before any JavaScript** cannot use them — they
need their module. Copy the static markup and stylesheet from the
[loader documentation](https://oxygenui.design/components/pulse-loader) instead.

---

## Is Svelte actually tested?

`apps/smoke/svelte` is a running Svelte 5.19 application, compiled by Svelte's
own compiler and driven in Chromium, Firefox, and WebKit on every CI run.

---

- Something not working? [Troubleshooting](../reference/troubleshooting.md)
- [Vue](vue.md) · [Angular](angular.md) · [Plain HTML](html.md)
