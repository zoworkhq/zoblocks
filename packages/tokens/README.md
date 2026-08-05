# @oxygenui-design/tokens

**Design tokens for healthcare interfaces: semantic clinical status, density
modes, light and dark themes.**

Published as CSS custom properties, not as a JavaScript object. This is the
token layer behind [Oxygen UI](https://oxygenui.design).

```bash
npm install @oxygenui-design/tokens
```

Import once, as early as possible, so your own styles can override deliberately:

```ts
import "@oxygenui-design/tokens/oxygen-tokens.css";
```

## What it defines

**Clinical status.** Five interpretation states — `normal`, `low`, `high`,
`critical`, and `unknown` — each with a foreground, background, and border
variable (`--ox-status-critical`, `--ox-status-critical-bg`,
`--ox-status-critical-border`). Record-level flags are separate, because they
are a different kind of assertion: `--ox-flag-restricted`,
`--ox-flag-provisional`, `--ox-flag-deceased`.

Tokens are named for meaning rather than colour, so a theme can change the
palette without changing what a component asserts. `unknown` is a real state
with its own treatment, not a fallback to `normal`.

**Density.** Three modes, switched with `data-ox-density` on any container:

```html
<div data-ox-density="clinical">…</div>
```

`patient`, `standard`, and `clinical` change spacing and type scale, and nothing
else. Density never changes what is shown, only how much of it fits.

**Light and dark.** Both themes are defined here. Dark is driven by a `dark`
class on the root element, so it composes with Tailwind's `dark:` variant and
with a no-flash inline theme script.

## Contrast

Every status token pair is checked to WCAG 2.2 AA in both themes, and the check
runs in CI. Colour is never the only signal a component uses — tokens are
designed on the assumption that each status also carries an icon, a text label,
and a structural cue, so the system stays readable in forced-colors mode, in
grayscale, and in print.

## Tailwind

The variables are plain CSS custom properties and work with any styling
approach. With Tailwind v4, reference them directly:

```css
@theme {
  --color-critical: var(--ox-status-critical);
}
```

Never build a class name from a variable — Tailwind resolves classes by scanning
source text, so an interpolated class produces no CSS and severity styling
vanishes silently. Use a literal lookup map.

## License

MIT — see [LICENSE](./LICENSE). Built by [Zowork](https://github.com/zoworkhq).
