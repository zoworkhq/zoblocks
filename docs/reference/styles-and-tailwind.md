# Styles and Tailwind

Which stylesheets to import, in what order, and the two Tailwind mistakes that
produce no CSS and no error.

← [How to start](../how-to-start.md)

---

## Why this page exists

A component whose stylesheet is missing **does not error**. It renders unstyled
— which on a severity chip silently deletes the severity signal, and looks like
a design choice rather than a broken import. Every rule below exists because
that failure is invisible.

---

## The registry channel

`oxygen add` writes two kinds of file you have to import:

| File                       | Written by                                      | What it carries                                                   |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `styles/oxygen-tokens.css` | the `tokens` item, pulled in by every component | Semantic status tokens, three densities, light/dark/high-contrast |
| `styles/oxygen-<name>.css` | each component's `*-core` item                  | That component's structure, glyphs, and forced-colors handling    |

Import them in your first-loaded stylesheet, **tokens first**, so your own
styles override deliberately rather than by accident:

```css
@import "tailwindcss";

@import "./styles/oxygen-tokens.css";

@import "./styles/oxygen-loader.css";
@import "./styles/oxygen-clinical-status.css";
@import "./styles/oxygen-result-value.css";
```

One line per stylesheet the CLI wrote. Adding a component later means adding its
line — the install output names every file, so the diff tells you what to add.

If your build imports CSS from JavaScript instead, do it at the application
root, above your own:

```tsx
import "./styles/oxygen-tokens.css";
import "./styles/oxygen-result-value.css";
import "./app.css";
```

### Which components bring which stylesheet

| Component                               | Stylesheet                     |
| --------------------------------------- | ------------------------------ |
| The five loaders                        | `oxygen-loader.css`            |
| Clinical Status                         | `oxygen-clinical-status.css`   |
| Result Value                            | `oxygen-result-value.css`      |
| Care Timeline, Timeline                 | `oxygen-timeline.css`          |
| Accordion, Chart Accordion, Safety Plan | `oxygen-accordion.css`         |
| Clinical Note                           | `oxygen-clinical-note.css`     |
| Allergy Chip                            | `oxygen-allergy.css`           |
| Risk Indicator                          | `oxygen-risk.css`              |
| Provenance Chip                         | `oxygen-provenance.css`        |
| Trend Indicator                         | `oxygen-trend.css`             |
| Care Team Presence                      | `oxygen-presence.css`          |
| Chart Header                            | `oxygen-chart-header.css`      |
| Chart Command Palette                   | `oxygen-palette.css`           |
| Switch                                  | `oxygen-switch.css`            |
| Recent Patient Stack                    | `oxygen-workspace.css`         |
| Copilot                                 | none — Tailwind utilities only |

You never have to memorise this: the file arrives in `styles/` when the
component is installed, and the install output names it.

---

## The npm channel

Three imports at the application root:

```tsx
import "@oxygenui-design/tokens/oxygen-tokens.css";
import "@oxygenui-design/react/styles.css";
import "./globals.css";
```

`styles.css` is the whole component layer in one file — the per-component split
is a registry concern, not an npm one.

---

## Tailwind

Tailwind is needed only by the components that use utility classes — Copilot and
the app-shell surfaces. The clinical components and the loaders are styled
entirely by the stylesheets above and work with no Tailwind at all.

### Optional: Oxygen tokens as Tailwind utilities

```css
@import "tailwindcss";
@import "@oxygenui-design/tokens/oxygen-tokens.css";
@import "@oxygenui-design/tokens/tailwind.css";
```

`tailwind.css` is a generated `@theme` block that turns every semantic token
into a real utility — `bg-ox-status-critical-bg`, `text-ox-status-critical` —
rather than an arbitrary value. Each entry points at the custom property rather
than a literal, so theme and density switching still happens in CSS at runtime.

Or declare only what you use:

```css
@theme {
  --color-critical: var(--ox-status-critical);
}
```

### The two silent failures

**1. A component outside Tailwind's scanned tree.** Tailwind v4 detects content
automatically, and registry components land inside `src/`, so this is usually
fine. If you installed into a directory outside the tree — a monorepo package,
say — declare it. A missing entry does not error; it renders the component
completely unstyled.

```css
@source "../../packages/chart/src/components/oxygen";
```

**2. A class name built from a variable.** Tailwind resolves classes by scanning
source text, so an interpolated class produces no CSS and the severity styling
vanishes without a warning:

```tsx
// Wrong — produces no CSS, fails silently
<span className={`text-${severity}`} />;

// Right — a literal lookup map
const TONE = {
  critical: "text-ox-status-critical",
  high: "text-ox-status-high",
  normal: "text-ox-status-normal",
} as const;

<span className={TONE[severity]} />;
```

This is a lint error in this repository — `@oxygenui/no-dynamic-class-name` — and
it is one of the reasons to run [the lint rules](lint-rules.md) in yours.

---

## Order matters, twice

1. **Tokens before component stylesheets.** Components resolve against the
   tokens; the reverse is meaningless.
2. **Oxygen before your own styles.** Not because of specificity — everything is
   scoped by `ox-` class names — but so that when you do override something, the
   override is deliberate and visible in one place.

---

- Theme, density, dark mode: [Theming](theming.md)
- Something not working? [Troubleshooting](troubleshooting.md)
