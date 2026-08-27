# Theming

Three independent axes — theme, density, and brand — all driven by attributes on
any container. No provider is required.

← [How to start](../how-to-start.md)

---

## Theme

```html
<html class="dark">
  …
</html>
```

Three themes ship: light (the default), **dark**, and **high-contrast**. Dark is
driven by a `dark` class on the root so it composes with Tailwind's `dark:`
variant and with a no-flash inline theme script. Two attribute forms are
accepted equally:

```html
<html data-ox-theme="dark">
  <html data-ox-theme="high-contrast">
    <html data-theme="dark"></html>
  </html>
</html>
```

Status colours are re-tuned per theme rather than reused — the light values do
not hold contrast on a dark surface, and critical must stay unmistakable.

## Density

```html
<body data-ox-density="clinical"></body>
```

| Mode       | For                                         |
| ---------- | ------------------------------------------- |
| `patient`  | Patient-facing screens                      |
| `standard` | General application UI                      |
| `clinical` | Dense clinical work — worklists, flowsheets |

Density changes spacing and type scale, and **nothing else**. It never changes
what is shown, only how much of it fits. It applies to any container, so a dense
table can sit inside a patient-facing page.

A page that never sets `data-ox-density` is still usable — there is a default.

---

## Brand

Override the **semantic** tokens, never the palette beneath them:

```css
:root {
  --ox-accent: var(--brand-600);
  --ox-accent-hover: var(--brand-500);
  --ox-surface: #fff;
  --ox-text: #111827;
}
```

A component reaching past `--ox-status-critical` to `--ox-red-600` ignores every
brand override — which is why it is a lint error in this repository
(`@oxygenui/no-primitive-token`), and why it is worth running
[the lint rules](lint-rules.md) in yours.

### What you should not re-brand

**Clinical status.** The five interpretation states — `normal`, `low`, `high`,
`critical`, `unknown` — and the record-level flags — `restricted`,
`provisional`, `deceased` — carry a validated contrast floor and 60° of hue
separation, so the direction of an abnormal result survives colour-vision
deficiency, greyscale, forced-colors mode, and print.

Every status token pair is checked to WCAG 2.2 AA in both themes, and the check
runs in CI: 21 token pairs × 3 themes × every brand. A palette edit that breaks
a floor does not build. If you override these, you are taking that gate off.

`unknown` is a real state with its own treatment, not a fallback to `normal`.

**Red only ever means critical.** Never a brand colour, never a destructive
button by default, and never carrying meaning alone — every coloured thing also
has a word or an icon.

---

## The token surface

Tokens are named for meaning rather than colour, so a theme can change the
palette without changing what a component asserts.

| Group           | Examples                                                                         |
| --------------- | -------------------------------------------------------------------------------- |
| Surface         | `--ox-bg`, `--ox-surface`, `--ox-surface-raised`, `--ox-border`                  |
| Text            | `--ox-text`, `--ox-text-muted`, `--ox-text-subtle`                               |
| Accent          | `--ox-accent`, `--ox-accent-hover`, `--ox-text-on-accent`                        |
| Clinical status | `--ox-status-critical`, `--ox-status-critical-bg`, `--ox-status-critical-border` |
| Record flags    | `--ox-flag-restricted`, `--ox-flag-provisional`, `--ox-flag-deceased`            |
| Density         | `--ox-density-pad-y`, `--ox-density-gap`, `--ox-density-target`                  |

These are the contract. See
[ADR 0012](../../content/decisions/0012-token-surface-is-a-contract.md).

---

## A full customer theme

For brand ramps generated from a seed colour, validated against the contrast
floors, and emitted as CSS, use `@oxygenui-design/theme` — the document model,
ramp generator, validation, and CSS emitter.

```bash
npm install @oxygenui-design/theme
```

## If your app is antd or MUI

Do not hand-write token overrides. Use the bridge, which reads that framework's
resolved theme and writes Oxygen's token surface:
[Ant Design](../setup/antd.md) · [Material UI](../setup/mui.md).

---

## Tailwind utilities from the tokens

```css
@import "@oxygenui-design/tokens/oxygen-tokens.css";
@import "@oxygenui-design/tokens/tailwind.css";
```

A generated `@theme` block turning every semantic token into a real utility —
`bg-ox-status-critical-bg`, `text-ox-status-critical`. Each entry points at the
custom property rather than a literal, so theme and density switching still
happens in CSS at runtime. See [Styles and Tailwind](styles-and-tailwind.md).

---

- Something not working? [Troubleshooting](troubleshooting.md)
- [`@oxygenui-design/tokens`](../../packages/tokens/README.md) — the package's own docs
