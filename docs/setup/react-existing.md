# Adding Oxygen UI to an existing React project

Nothing is scaffolded, no shared file is rewritten, and no provider is required.
The work is three prerequisites, one config file, and one CSS import per
component.

← [How to start](../how-to-start.md)

---

## 1. Check three prerequisites

### An `@/` import alias

Look for a `paths` entry in your `tsconfig.json`:

```jsonc
"compilerOptions": {
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] }
}
```

Oxygen source imports itself through `@/` — `@/lib/utils`,
`@/components/oxygen/timeline`. Those specifiers are **inside the files**, so
the alias has to exist. If yours points at `app/` or `.` rather than `src/`,
that is fine; you will record it in step 2 rather than move your files.

If you have no alias at all, add one. Your bundler needs the matching entry too
(`resolve.alias` in Vite, `moduleNameMapper` in Jest, and so on).

### Tailwind v4 — for some components, not all

| Components                                                                          | Tailwind                                                        |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Result Value, Care Timeline, Clinical Status, the five loaders, Signature, Identity | not needed — styled entirely by their own installed stylesheets |
| Copilot, the app-shell surfaces                                                     | Tailwind v4                                                     |

If you are on Tailwind v3, either upgrade or stay on the first row. If you have
no Tailwind, the first row still works.

### React 18.2 or 19

Both are supported and tested. Node ≥ 20.11 for the CLI.

## 2. Initialise

```bash
npx @oxygenui-design/cli init
```

It writes `oxygen.json` and prints where it assumed `@/` points:

```jsonc
{
  "$schema": "https://oxygenui.design/schema/oxygen.json",
  "root": "src",
  "registries": {},
}
```

**If your alias points somewhere else, edit `root` to match.** Do not move the
files the CLI writes — a component's location is fixed by the source that
imports it, not by configuration. To put the files elsewhere, change the `@/*`
mapping in your `tsconfig.json` instead; the two settings then still agree.

Commit `oxygen.json`.

### Monorepos

Run it inside the package that will hold the components:

```bash
npx @oxygenui-design/cli init --cwd packages/chart
npx @oxygenui-design/cli add result-value --cwd packages/chart
```

`root` is then relative to that package.

## 3. Add components

Look before you leap:

```bash
npx @oxygenui-design/cli list                      # the whole public catalog
npx @oxygenui-design/cli add result-value --dry-run # the plan, nothing written
```

```
Dry run — nothing written.

  new     src/lib/utils.ts
  new     src/styles/oxygen-tokens.css
  new     src/lib/oxygen-result-value.ts
  new     src/styles/oxygen-result-value.css
  new     src/components/oxygen/clinical-status.tsx
  new     src/components/oxygen/result-value.tsx

  npm dependencies: clsx, tailwind-merge
```

Then for real:

```bash
npx @oxygenui-design/cli add result-value --yes
```

Two boundaries worth knowing on an existing codebase:

- **An existing file is never replaced** without `--overwrite`. If you already
  have a `src/lib/utils.ts`, the CLI prints `skip … already exists` and leaves
  it alone. Reconcile it by hand — Oxygen's is a `clsx` + `tailwind-merge`
  helper, and most projects' is the same one.
- **Your lockfile is not touched** without `--yes`, and only ever by your own
  package manager, detected from the lockfile and printed before it runs.

Every flag: [Installing components](../reference/installing-components.md).

## 4. Import the stylesheets

This is the step that is easy to skip and expensive to skip. A component with
its stylesheet missing does not error; it renders unstyled, which on a severity
chip deletes the severity signal and looks like a design choice.

In whichever stylesheet is loaded first in your application:

```css
/* Tokens first — before your own styles, so your overrides are deliberate. */
@import "./styles/oxygen-tokens.css";

/* Then one line per stylesheet the CLI wrote. */
@import "./styles/oxygen-result-value.css";
@import "./styles/oxygen-clinical-status.css";
```

If your build imports CSS from JavaScript instead, do it at the application
root, above your own:

```tsx
import "./styles/oxygen-tokens.css";
import "./styles/oxygen-result-value.css";
import "./styles/oxygen-clinical-status.css";
import "./app.css";
```

Adding a component later means adding its line. See
[Styles and Tailwind](../reference/styles-and-tailwind.md) for the full rules.

## 5. Render it

```tsx
import { ResultValue } from "@/components/oxygen/result-value";

<ResultValue observation={observation} />;
```

Clinical components take the FHIR resource directly — there is no adapter and no
bespoke prop shape. If your data is not FHIR-shaped, map it at the boundary
rather than reshaping the component; the prop type is the contract the safety
claims are written against.

---

## Living beside what you already have

### Your existing design system

Oxygen resolves everything through its own semantic tokens
(`--ox-status-critical`, `--ox-surface`, `--ox-text`), so it does not read or
write your variables and cannot collide with them. To make it speak your brand,
override the semantic tokens — never the palette beneath them. See
[Theming](../reference/theming.md).

If your app is built on **Ant Design** or **Material UI**, use the bridge
instead of overriding by hand: [Ant Design](antd.md) · [Material UI](mui.md).

### Your existing CSS reset

Oxygen components carry their own structure and do not depend on a reset. They
are scoped by `ox-` class names throughout, so a global `* { box-sizing }` or a
Tailwind preflight will not reach into them destructively.

### Your test suite

Assert the safety claim, not the render — the failures worth catching all look
fine on screen:

```tsx
it("shows an uninterpreted result as uninterpreted, never as normal", () => {
  render(<ResultValue observation={uninterpreted} />);
  expect(screen.getByText(/not interpreted/i)).toBeInTheDocument();
  expect(screen.queryByText(/^normal$/i)).not.toBeInTheDocument();
});
```

`@oxygenui-design/fixtures` gives you synthetic, non-PHI resources that
deliberately over-represent critical, uninterpreted, masked, refuted, and
expired.

### The lint rules

The invariants Oxygen is built around are enforced by lint rather than by
review, and they are worth having in your repository too — the source is yours
now. See [Lint rules](../reference/lint-rules.md).

---

- Something not working? [Troubleshooting](../reference/troubleshooting.md)
- Prefer semver over owning the source? Install
  [`@oxygenui-design/react`](../../packages/react/README.md) instead — same
  source, one build.
