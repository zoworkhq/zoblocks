# Oxygen UI in a new Next.js app

Roughly ten minutes. At the end you will have a Next.js app rendering a real
Oxygen component, with tokens, styles, and dark mode wired.

← [How to start](../how-to-start.md)

---

## 1. Create the app

```bash
npx create-next-app@latest my-chart --typescript --tailwind --app --src-dir --import-alias "@/*"
cd my-chart
```

Three of those flags matter to Oxygen:

- `--src-dir` — the CLI's default install root
- `--import-alias "@/*"` — Oxygen source imports itself through `@/`, so the
  alias has to exist
- `--tailwind` — v4, needed only by the components that use utility classes, but
  cheaper to have from the start than to add later

## 2. Point the CLI at your alias

```bash
npx @oxygenui-design/cli init
```

It writes `oxygen.json` and prints what it assumed:

```jsonc
{
  "$schema": "https://oxygenui.design/schema/oxygen.json",
  "root": "src",
  "registries": {},
}
```

`root` is the directory `@/` resolves to. With the flags above it is `src` and
correct. Commit the file.

## 3. Add a component

```bash
npx @oxygenui-design/cli add pulse-loader --yes
```

`--yes` lets it run the `npm install clsx tailwind-merge` it would otherwise
just print. Everything the component depends on comes with it:

```
Resolved 5 items — 4 pulled in as dependencies: utils, tokens, loader-core, rhythm-loader

  write  src/lib/utils.ts
  write  src/styles/oxygen-tokens.css
  write  src/lib/oxygen-loader.tsx
  write  src/styles/oxygen-loader.css
  write  src/components/oxygen/rhythm-loader.tsx
  write  src/components/oxygen/pulse-loader.tsx
```

Note the two files under `src/styles/` — step 4 is about those.

## 4. Import the stylesheets

This is the step that is easy to skip and expensive to skip. A component with
its stylesheet missing does not error; it renders unstyled, which on a severity
chip deletes the severity signal and looks like a design choice.

```css
/* src/app/globals.css */
@import "tailwindcss";

/* Tokens first, so your own styles override deliberately rather than by
   accident. Every Oxygen component resolves against these. */
@import "../styles/oxygen-tokens.css";

/* Then one line per stylesheet the CLI wrote. */
@import "../styles/oxygen-loader.css";
```

Adding a component later means adding its line here. See
[Styles and Tailwind](../reference/styles-and-tailwind.md) for the full rules,
including the Tailwind mistakes that produce no CSS and no error.

## 5. Render it

```tsx
// src/app/page.tsx
import { PulseLoader } from "@/components/oxygen/pulse-loader";

export default function Page() {
  return <PulseLoader label="Loading your records" showLabel />;
}
```

```bash
npm run dev
```

**A beating heart, drawn once then pulsing at 60bpm.** If you get a static teal
mark, `oxygen-loader.css` is not imported. If you get unstyled text,
`oxygen-tokens.css` is not.

---

## Next steps

### Dark mode without a flash

Tokens read a `dark` class on the root, so they compose with Tailwind's `dark:`
variant and with an inline boot script:

```tsx
// src/app/layout.tsx
<html lang="en" suppressHydrationWarning>
  <body data-ox-density="clinical">{children}</body>
</html>
```

`data-ox-density` is `patient`, `standard`, or `clinical` — spacing and type
scale only, never what is shown. See [Theming](../reference/theming.md).

### A clinical component

Clinical components take the FHIR resource directly. There is no adapter and no
bespoke prop shape:

```bash
npx @oxygenui-design/cli add result-value --yes
```

```tsx
import { ResultValue } from "@/components/oxygen/result-value";

<ResultValue observation={observation} />;
```

Remember to add `@import "../styles/oxygen-result-value.css";` and
`@import "../styles/oxygen-clinical-status.css";` to `globals.css`.

For realistic local data, use the synthetic fixtures rather than inventing your
own — they over-represent the states that break things (critical, uninterpreted,
masked, refuted, expired) and contain no PHI:

```bash
npm i -D @oxygenui-design/fixtures
```

### Server components

The registry components are client components — they carry `"use client"` at the
top of the file, which is already correct for the App Router. Fetch on the
server, render on the client, as usual.

### The lint rules

Worth having in your own repository: the defects they catch all render
perfectly. See [Lint rules](../reference/lint-rules.md).

---

- Something not working? [Troubleshooting](../reference/troubleshooting.md)
- Every CLI flag: [Installing components](../reference/installing-components.md)
