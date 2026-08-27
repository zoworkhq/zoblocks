# Oxygen UI in a new Vite + React app

Roughly ten minutes. At the end you will have a Vite app rendering a real
Oxygen component, with tokens, styles, and the `@/` alias wired.

← [How to start](../how-to-start.md)

---

## 1. Create the app

```bash
npm create vite@latest my-chart -- --template react-ts
cd my-chart
npm install
npm install -D tailwindcss @tailwindcss/vite
```

## 2. Add Tailwind and the `@/` alias

Oxygen source imports itself through `@/` — `@/lib/utils`,
`@/components/oxygen/timeline`. Those specifiers are inside the files, so the
alias has to exist in both the bundler and the type checker.

```ts
// vite.config.ts
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

```jsonc
// tsconfig.app.json
"compilerOptions": {
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] }
}
```

## 3. Point the CLI at your alias

```bash
npx @oxygenui-design/cli init
```

It writes `oxygen.json` with `"root": "src"` — which matches the alias you just
set. Commit the file.

## 4. Add a component

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

## 5. Import the stylesheets

This is the step that is easy to skip and expensive to skip. A component with
its stylesheet missing does not error; it renders unstyled, which on a severity
chip deletes the severity signal and looks like a design choice.

```css
/* src/index.css */
@import "tailwindcss";

/* Tokens first, so your own styles override deliberately rather than by
   accident. Every Oxygen component resolves against these. */
@import "./styles/oxygen-tokens.css";

/* Then one line per stylesheet the CLI wrote. */
@import "./styles/oxygen-loader.css";
```

Adding a component later means adding its line here. See
[Styles and Tailwind](../reference/styles-and-tailwind.md) for the full rules,
including the Tailwind mistakes that produce no CSS and no error.

## 6. Render it

```tsx
// src/App.tsx
import { PulseLoader } from "@/components/oxygen/pulse-loader";

export default function App() {
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

### Theme and density

```html
<html class="dark">
  <body data-ox-density="clinical"></body>
</html>
```

Dark is a `dark` class on the root (`data-ox-theme="dark"` works too), so it
composes with Tailwind's `dark:` variant. Density is `patient`, `standard`, or
`clinical` — spacing and type scale only, never what is shown. See
[Theming](../reference/theming.md).

### A clinical component

Clinical components take the FHIR resource directly, with no adapter:

```bash
npx @oxygenui-design/cli add result-value --yes
```

```tsx
import { ResultValue } from "@/components/oxygen/result-value";

<ResultValue observation={observation} />;
```

Add `@import "./styles/oxygen-result-value.css";` and
`@import "./styles/oxygen-clinical-status.css";` to `index.css`.

For realistic local data, use the synthetic fixtures — they over-represent the
states that break things and contain no PHI:

```bash
npm i -D @oxygenui-design/fixtures
```

### The lint rules

Worth having in your own repository: the defects they catch all render
perfectly. See [Lint rules](../reference/lint-rules.md).

---

- Something not working? [Troubleshooting](../reference/troubleshooting.md)
- Every CLI flag: [Installing components](../reference/installing-components.md)
