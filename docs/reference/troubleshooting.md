# Troubleshooting

By symptom. Most of these are silent failures — that is deliberate on our part
nowhere, and it is why this page is longer than it should have to be.

← [How to start](../how-to-start.md)

---

## Nothing renders correctly

### The component is completely unstyled

`styles/oxygen-tokens.css` is not imported, or is imported after your own CSS.
It is pulled in by every component, lands in `<root>/styles/`, and has to be
imported by hand — the CLI writes files, it does not edit your stylesheet.

```css
@import "./styles/oxygen-tokens.css"; /* before everything else */
```

### The component has tokens but no structure

Its own stylesheet is missing. Every component brings one, named after its
engine — `oxygen-result-value.css`, `oxygen-timeline.css`. Add one `@import` per
stylesheet the install wrote. See
[Styles and Tailwind](styles-and-tailwind.md#which-components-bring-which-stylesheet).

### A loader renders as a static mark rather than an animated one

`styles/oxygen-loader.css` is not imported. All five loaders share it, and it
carries the keyframes.

### Severity colours are missing, with no error anywhere

One of two Tailwind failures:

1. The component sits outside Tailwind's scanned tree. Add
   `@source "path/to/components/oxygen";`
2. A class name is built by interpolation — `` `text-${severity}` `` produces no
   CSS. Use a literal lookup map.

Both are covered in [Styles and Tailwind](styles-and-tailwind.md#the-two-silent-failures).

### Reduced motion looks broken

It is not paused, it is a **designed still state**: the heart completes, the
track comes to full strength, and the mark breathes in opacity. Nothing scales
and nothing travels. A paused mid-sweep animation would look like a component
that failed, which is why it is not what happens.

---

## Imports and paths

### `Cannot find module '@/lib/utils'`

The `@/` alias is missing, or `root` in `oxygen.json` disagrees with the `paths`
entry in your `tsconfig.json`. Make the two agree — and do **not** move the files
the CLI wrote: their import specifiers are inside the source and are fixed by
it. Change the `@/*` mapping instead.

Your bundler needs the alias too (`resolve.alias` in Vite), and so does your test
runner (`moduleNameMapper` in Jest, `resolve.alias` in Vitest).

### `No oxygen.json in …`

Run `npx @oxygenui-design/cli init` first.

### The files landed in the wrong directory

`root` in `oxygen.json` is wrong. Fix it, delete what was written, and re-run
`add`. `init --force` rewrites the config if you would rather start over.

---

## Installing

### `skip  src/lib/utils.ts — already exists`

Working as intended: the CLI never replaces a file you own. If you already have
a `utils.ts`, reconcile by hand — Oxygen's is a `clsx` + `tailwind-merge` helper
and most projects' is the same one. Pass `--overwrite` only if you mean to lose
your version.

### The npm dependencies were not installed

Without `--yes` the CLI prints the command rather than running it. Paste it, or
re-run with `--yes`. An interactive prompt would hang in CI and in agent
harnesses, which is where a lot of these installs happen.

### `package.json is not valid JSON — skipping dependency install`

The component files were still written correctly. Only the dependency step was
skipped.

### A 401 adding a pro component

Three causes, in order of likelihood:

1. `OXYGEN_TOKEN` is not exported in the shell that ran the command.
2. The token has the **Figma** scope. A Figma-scoped token cannot install
   components, and says so rather than returning a bare 401.
3. The namespace in `oxygen.json` does not match the one the console printed.

### The CLI refused a token in `oxygen.json`

Correct behaviour. `oxygen.json` is meant to be committed, and a token in git
history is not something you can undo. Write `"Bearer ${OXYGEN_TOKEN}"` and keep
the value in the environment.

---

## Custom elements (Vue, Angular, Svelte, HTML)

### Vue warns `Failed to resolve component: ox-pulse-loader`

The `isCustomElement` compiler option is missing. It is a runtime **warning**
rather than a build error, so it ships if nobody is watching the console. See
[Vue](../setup/vue.md).

### Angular fails with NG0304

`schemas: [CUSTOM_ELEMENTS_SCHEMA]` is missing from the component or module.
That Angular fails the build here rather than warning is a good default. See
[Angular](../setup/angular.md).

### A bound value has no effect in Angular

Bind the attribute, not the property: `[attr.progress]`, not `[progress]`. The
elements read state back from attributes only. See
[Angular](../setup/angular.md).

### The element renders but has no colour

`@oxygenui-design/tokens/oxygen-tokens.css` is not loaded. Every colour falls
back to `currentColor` — a designed fallback rather than a failure, but not what
you want.

### The loader does not appear on a boot screen

The elements need their module, so they cannot render before any JavaScript. For
a true boot screen, copy the static markup and stylesheet from the
[loader documentation](https://oxygenui.design/components/pulse-loader).

---

## React

### `useState is not a function`, or a hooks error inside a component

The registry components are client components and carry `"use client"`. In the
Next.js App Router that is already correct. If you moved a component or
re-exported it through a server file, the directive no longer applies to the
module that renders it.

### Hydration mismatch on a timestamp

Pass server time in rather than reading the clock during render — Signature
takes `now` as a required prop for exactly this reason, and it is a required
prop rather than a default so the mismatch cannot happen quietly.

### TypeScript complains about a FHIR resource

Clinical components take the resource directly, and the prop type is the
contract the safety claims are written against. Map your data at the boundary
rather than widening the prop. `@oxygenui-design/fhir` has the R4 types and pure
read helpers.

---

## Still stuck

- [`SUPPORT.md`](../../SUPPORT.md) — where to ask
- [`SECURITY.md`](../../SECURITY.md) — security issues go here, never to a public issue
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — how it fits together, and why
