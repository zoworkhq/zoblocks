---
name: zoblocks
description: Build UI with ZoBlocks, a React component library for healthcare screens (lab results, clinical status, patient identity, signatures, timelines, loaders, a three-state switch). Use when a project has zoblocks.json, imports from @/components/zoblocks/ or @zoblocks/*, or the user asks for ZoBlocks or for clinical or FHIR-based UI. Covers finding the right component, its real props, installing it with the ZoBlocks CLI, styles, and matching an existing Ant Design or Material UI app.
license: MIT
compatibility: Works best with the ZoBlocks MCP server (https://zoblocks.design/mcp, or npx -y @zoblocks/mcp). Without it, use references/ and https://zoblocks.design/llms.txt.
---

# ZoBlocks

ZoBlocks is a catalog of React components for healthcare screens. Most are
copied into the project as source by the ZoBlocks CLI; a few are npm packages.
Outside React (Vue, Angular, Svelte, plain HTML) only the loaders and the
switch exist, as web components.

**The one rule:** never invent a ZoBlocks component, prop or import. Every
component, export and prop you use must come from the catalog — the MCP tools
below, or `references/components.md` when the server is not connected.

## Workflow

### 1. Read the project before choosing anything

| Look for                                                          | It tells you                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------- |
| `next` in package.json and an `app/` (or `src/app/`) directory    | framework `next-app`                                        |
| `next` and a `pages/` (or `src/pages/`) directory                 | framework `next-pages`                                      |
| `vite.config.*` with React                                        | framework `vite`                                            |
| `vue`, `@angular/core`, `svelte` in package.json, or no framework | `vue` / `angular` / `svelte` / `html` — web components only |
| `antd` or `@mui/material` in package.json                         | the app's UI style: `antd` or `mui` (otherwise `zoblocks`)  |
| `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `package-lock.json`    | the package manager                                         |
| `zoblocks.json`                                                   | ZoBlocks is set up; `init` already ran                      |
| files in `components/zoblocks/`                                   | components already installed — reuse them                   |

### 2. Find the component — do not build one

Call `search_components` with what the UI needs ("lab result", "status badge",
"toggle", "FHIR Observation"). If a result's `matched` shows a name or alias
match, use that component. If the answer carries a `note` saying nothing is
that thing, ZoBlocks does not ship it — use the app's own UI library.

To see everything, call `list_components` — with `framework` set outside React,
it lists only what exists there.

ZoBlocks ships no Button, Input, Select or Modal. Build those with the app's
existing library (Ant Design, Material UI, or plain elements) and put the
ZoBlocks component inside that page.

### 3. Get the real contract

Call `get_component` for every component you will use. Use only the exports
and props it returns — they are extracted from the TypeScript types, and no
others exist. Read `guidance.avoid` and `limitations` before choosing props.
Then call `get_component_examples` and start from that code.

### 4. Install with the CLI

Call `get_installation` with the components, the framework and the package
manager from step 1, and run the commands it returns, in order. Then:

- add its `cssLines` to the global stylesheet, directly under
  `@import "tailwindcss";` — tokens first, one `@import` per stylesheet, and
  the `@source` line;
- for npm-package components, add the `packageImports` once;
- for a new Vite app, set up the `@` alias first (`get_framework_rules`).

Do not copy component source by hand, and do not re-run `add` over files that
exist unless the user asked to update them (`--overwrite`, then review the diff).

### 5. Match the app's style

If the app uses Ant Design or Material UI, call `get_framework_rules` with that
`style` and apply its files exactly — they follow each library's own Next.js
guide and add the ZoBlocks bridge. Two lines matter most and are easy to drop:

- **Pages Router:** the `transpilePackages` line in `next.config.ts`. Without
  it, ZoBlocks renders with the library's default theme instead of the app's.
- **Material UI, App Router:** `"use client"` at the top of the theme file.

Clinical status colours are never themed by the bridge. Do not override them.

### 6. Server Components (Next.js App Router only)

A page can stay a Server Component. Components that need the browser declare
their own `"use client"`. But passing a function — `onOpenReport`, `onChange`,
any `on…` prop — needs a Client Component: put that usage in its own file that
starts with `"use client"`. `get_framework_rules` has the worked example.

### 7. Verify

Run the project's typecheck and build (`tsc --noEmit`, then `next build` or
`vite build`). Then check:

- every `@/components/zoblocks/...` import is a file that exists;
- every stylesheet the install wrote is imported;
- the page renders styled, not as bare markup (a missing `@import` or `@source`).

## Rules for the code you write

Call `get_conventions` for the full list. The ones that break clinical meaning:

- A missing value renders as explicitly missing. Never substitute `""`, `"—"`
  or `"N/A"`; use the component's absence states.
- An uninterpreted result reads "Not interpreted", never "Normal".
- Never convey status by colour alone. Keep the icon and the text label the
  component renders.
- Never build a Tailwind class name from a variable. Map values to complete
  class strings.
- Feed FHIR data through the component's own adapter where it has one
  (`fromObservation` for ResultValue — see its examples); never pre-format
  values into display strings yourself.
- Give every loader a `label` that says what is loading — it is what a
  screen-reader user hears — and keep the accessible names components render.

## New project

Create it, then follow the workflow from step 4:

- Next.js: `npx create-next-app@latest my-app --ts --tailwind --eslint --app --src-dir --import-alias "@/*"`
  (`--no-app` for the Pages Router). The alias is already set up.
- Vite: `npm create vite@latest my-app -- --template react-ts`, then add
  `tailwindcss @tailwindcss/vite` and the `@` alias from `get_framework_rules`.

For another package manager, `get_installation` renders the commands for it.

## Common mistakes

| Mistake                                                                         | Instead                                                                      |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Importing a ZoBlocks Button, Input or Modal                                     | Use the app's UI library; ZoBlocks has none                                  |
| Guessing props from the component's name                                        | `get_component`, then use only those props                                   |
| `add` without `--yes`                                                           | The npm dependencies are only printed, not installed                         |
| Installed, but the component is unstyled                                        | Missing `@import` for its stylesheet, or the `@source` line                  |
| A ZoBlocks component in Vue, Angular or Svelte other than the loaders or switch | Not available there; say so                                                  |
| Passing a handler from a Server Component                                       | Move that usage into a `"use client"` file                                   |
| Pages Router with antd or MUI, default colours                                  | Add the `transpilePackages` line                                             |
| `'React' is declared but never read` in a Vite `tsc` build                      | A known issue in a few components: delete that import line in the file named |

## When the MCP server is not connected

Everything above has a fallback in this skill's folder:

- `references/components.md` — every component, its import and install command;
- `references/frameworks.md` — setup per framework and style;
- `references/conventions.md` — the rules in full.

For props, read the installed source in `components/zoblocks/`, or fetch
`https://zoblocks.design/llms.txt`. Suggest connecting the server:
`https://zoblocks.design/docs`.
