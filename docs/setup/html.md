# Oxygen UI in plain HTML, Rails, Django, Solid, or Lit

The five loaders ship as dependency-free custom elements. No framework, no build
step, no wrapper.

← [How to start](../how-to-start.md)

> The clinical components — Result Value, Care Timeline, Signature, Identity —
> are React-only. The loaders are the whole of the story for a non-React stack
> today.

---

## With a bundler

```bash
npm install @oxygenui-design/loaders @oxygenui-design/tokens
```

```html
<script type="module">
  import "@oxygenui-design/tokens/oxygen-tokens.css";
  import "@oxygenui-design/loaders/pulse";
</script>

<ox-pulse-loader label="Loading your records"></ox-pulse-loader>
```

Import per loader rather than the barrel, so you ship only what you render.

## Without a bundler

Copy `node_modules/@oxygenui-design/loaders/dist/` and
`node_modules/@oxygenui-design/tokens/oxygen-tokens.css` into your static assets
and load them as modules. Vendoring rather than hotlinking a CDN is the right
default for a healthcare application, and the packages have no runtime
dependencies to chase.

```html
<link rel="stylesheet" href="/assets/oxygen-tokens.css" />
<script type="module" src="/assets/oxygen/pulse.js"></script>

<ox-pulse-loader label="Loading your records" mode="page"></ox-pulse-loader>
```

## Rails, Django, Laravel

Serve the modules from your asset pipeline and render the tag from the template.
Nothing about server-rendered HTML needs special handling — the element upgrades
when its module evaluates, and an unupgraded tag is inert rather than broken.

```erb
<%= tag.ox_infusion_loader label: "Importing records", progress: @percent %>
```

## Solid and Lit

Import the module and use the tag. Both write a DOM property when one exists and
an attribute otherwise; the elements reflect every property to its attribute and
read state back from attributes only, so both paths converge on identical DOM.

---

## Driving it from JavaScript

Every attribute is also a property, in camelCase. Setting one writes the
attribute:

```js
const loader = document.querySelector("ox-pulse-loader");

loader.label = "Loading imaging study"; // → label="Loading imaging study"
loader.progress = 40; // → progress="40"
loader.open = false; // → open="false"
loader.label = null; // → attribute removed, default restored
```

Attributes stay the single source of truth; properties are a typed way to write
them.

Three events, all bubbling and crossing the shadow boundary:

```js
loader.addEventListener("ox-loader-slow", () => analytics.track("slow_wait"));
```

`ox-loader-show` · `ox-loader-slow` · `ox-loader-hide`.

---

## The five

| Element                | Mark                         | Cadence  | Best for                                    |
| ---------------------- | ---------------------------- | -------- | ------------------------------------------- |
| `<ox-pulse-loader>`    | Open heart + rhythm line     | 60 bpm   | App boot, patient portals                   |
| `<ox-rhythm-loader>`   | One rhythm strip, swept      | 60 bpm   | Clinical density, inline, tables            |
| `<ox-breath-loader>`   | Three rings from a soft core | 15 / min | Patient-facing screens, long waits          |
| `<ox-helix-loader>`    | Two strands of dots          | 23 / min | Labs, genomics, diagnostics                 |
| `<ox-infusion-loader>` | Capsule with a soft slug     | 21 / min | **Determinate progress** — imports, uploads |

`<ox-pulse-loader>` renders the rhythm line alone below 40px, where the heart's
detail collapses. That is the correct rendering of the mark at that size, not a
fallback.

Full attribute, property, and event tables:
[`@oxygenui-design/loaders`](../../packages/loaders/README.md).

## Styling

```css
ox-pulse-loader {
  --ox-loader-color: var(--brand-500);
  --ox-loader-size: 120px;
  --ox-loader-scrim: rgb(0 0 0 / 0.6);
  --ox-loader-z: 9999;
}
```

Shadow parts: `::part(art)`, `::part(label)`, `::part(hint)`, `::part(progress)`.

Without `oxygen-tokens.css` every colour falls back to `currentColor`, which is
a designed fallback rather than a failure — but you want the stylesheet.

## Before the bundle loads

A boot screen that must render before any JavaScript cannot use these: they need
their module. Copy the static markup and stylesheet from the
[loader documentation](https://oxygenui.design/components/pulse-loader) instead.

---

- Something not working? [Troubleshooting](../reference/troubleshooting.md)
- [Vue](vue.md) · [Angular](angular.md) · [Svelte](svelte.md)
