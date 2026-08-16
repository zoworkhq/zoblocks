# Brands

**A new customer brand is a JSON file and a build.** That is the promise in
ADR 0005, and this directory is where it is kept.

## Adding one

Create `<brand>.json` beside this file. A brand overrides **primitive** tokens
only — never semantic ones:

```json
{
  "$description": "Northwind Health.",
  "ref": {
    "brand": {
      "$type": "color",
      "600": { "$value": "#0b6bcb" },
      "700": { "$value": "#0a5aa8" }
    }
  }
}
```

Then `pnpm gen`. The build emits `[data-ox-brand="northwind"]` blocks and the
brand is live:

```html
<html data-ox-brand="northwind"></html>
```

## Why primitives only

The tier discipline is what makes this work. Components reference semantic
tokens, semantic tokens reference primitives, and `@oxygenui/no-primitive-token`
makes a component reaching past that a lint error. So replacing the palette
reaches every component without any component knowing a brand exists.

Letting a brand override semantic tokens would let it redefine what _critical_
means. That is the one thing a clinical design system does not delegate.

## What is validated, per brand, in every theme

- **Key space** — a brand may only override keys the base palette defines. A
  typo is a build failure, not a silently ignored line.
- **Status contrast** — every status foreground against its background, at the
  same floor the base palette is held to.
- **Text and interface contrast** — every pair in the gate, including the focus
  ring and field borders.
- **Hue separation** — `status.high` and `status.low` must stay more than 60°
  apart so the direction of an abnormal result survives colour-vision
  deficiency.

A brand that cannot meet those does not build. Customers get their colours;
they do not get an unreadable clinical display.
