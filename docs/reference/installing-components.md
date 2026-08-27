# Installing components — the CLI

`@oxygenui-design/cli` writes component source into your repository, pulls in
anything those files import, and tells you what it touched. Zero runtime
dependencies.

← [How to start](../how-to-start.md)

---

## The three commands

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `oxygen init`          | Write `oxygen.json`                          |
| `oxygen add <name...>` | Add components and everything they depend on |
| `oxygen list`          | List the public catalog                      |

The public catalog needs no configuration, no namespace, and no account.

```bash
npx @oxygenui-design/cli init
npx @oxygenui-design/cli add pulse-loader
```

## Specifiers

```bash
oxygen add result-value                    # the public catalog
oxygen add @oxygen-pro/vitals-flowsheet    # a registry declared in oxygen.json
oxygen add https://…/item.json             # a registry item by URL
```

The URL form is what a mirror or a vendored copy of the catalog needs:

```bash
npx @oxygenui-design/cli add https://oxygenui.design/r/pulse-loader.json
```

## Options

| Flag          | Effect                                                     |
| ------------- | ---------------------------------------------------------- |
| `--cwd <dir>` | Run against another directory                              |
| `--dry-run`   | Show what would be written, write nothing                  |
| `--overwrite` | Replace files that already exist                           |
| `--no-deps`   | Do not touch `package.json` or the lockfile                |
| `--yes`       | Let this run your package manager for the npm dependencies |
| `--force`     | `init` only: overwrite an existing `oxygen.json`           |

Without `--yes` the npm dependencies are printed as a command you can paste
rather than installed. An interactive prompt would need a TTY this cannot count
on — it runs in CI, in agent harnesses, and inside other people's install
scripts, and a prompt hangs in two of those three.

---

## `oxygen.json`

```jsonc
{
  "$schema": "https://oxygenui.design/schema/oxygen.json",
  "root": "src",
  "registries": {
    "@oxygen-pro": {
      "url": "https://app.oxygenui.design/r/pro/{name}.json",
      "headers": { "Authorization": "Bearer ${OXYGEN_TOKEN}" },
    },
  },
}
```

`root` is the directory your `@/` import alias resolves to. Everything else is
derived from it. `init` guesses `src` if that directory exists and `.` otherwise,
and prints what it guessed rather than applying it silently.

Commit this file. The token is not in it — see [Paid components](#paid-components).

### Why there is one path setting and not four

Oxygen source is copied verbatim, and it imports itself through `@/` —
`@/lib/utils`, `@/components/oxygen/timeline`. Those specifiers are **inside the
files**, so a component's location is fixed by the source rather than by
configuration. A setting that moved `utils.ts` to `src/shared/` while
`care-timeline.tsx` still imported `@/lib/utils` would write nine files and
compile none of them.

Honouring such a setting properly would mean rewriting import specifiers at
install time — real machinery, operating on source we hand to healthcare teams
precisely so they can audit it. So the registry states the path under `@/` and
this file states where `@/` points, which is the one degree of freedom that
actually exists.

**To put the files somewhere else, change the `@/*` mapping in your
`tsconfig.json`**; the two settings then still agree.

---

## What an install looks like

```bash
npx @oxygenui-design/cli add result-value --dry-run
```

```
Resolved 5 items — 4 pulled in as dependencies: utils, tokens, result-value-core, clinical-status

Dry run — nothing written.

  new     src/lib/utils.ts
  new     src/styles/oxygen-tokens.css
  new     src/lib/oxygen-result-value.ts
  new     src/styles/oxygen-result-value.css
  new     src/components/oxygen/clinical-status.tsx
  new     src/components/oxygen/result-value.tsx

  npm dependencies: clsx, tailwind-merge
```

Three states appear in that column: `new`, `exists` (yours, and it will be left
alone), and `same` (identical to ours already).

Files land at the paths the source imports each other by:

| Under `root`         | Holds                           |
| -------------------- | ------------------------------- |
| `components/oxygen/` | the components                  |
| `lib/`               | shared engines and helpers      |
| `styles/`            | the stylesheets you must import |

Those stylesheets are not wired automatically. See
[Styles and Tailwind](styles-and-tailwind.md).

---

## What it will not do

It runs with write access to your repository, so the boundaries are worth
stating plainly.

- **Nothing is written outside the project.** A registry item asking for an
  absolute path, a `..` segment, or a Windows drive letter is refused before
  anything is opened.
- **An existing file is never replaced** without `--overwrite`. The source is
  yours once it lands; silently restoring our copy of a file you have since
  edited would make that false at the one moment it matters.
- **Your lockfile is not touched** without `--yes`, and only ever by your own
  package manager, detected from the lockfile and printed before it runs.
- **An item whose file arrived empty is a failure, not a no-op.** Writing it
  would leave you with a component that imports cleanly and renders nothing.

---

## Paid components

Pro components come from an authenticated registry. Mint a token with the
`registry` scope in the console under **Marketplace → Access tokens**, add the
namespace to `oxygen.json`, and keep the token in your environment:

```jsonc
// oxygen.json — committed; the token is not
"registries": {
  "@oxygen-pro": {
    "url": "https://app.oxygenui.design/r/pro/{name}.json",
    "headers": { "Authorization": "Bearer ${OXYGEN_TOKEN}" }
  }
}
```

```bash
export OXYGEN_TOKEN=oxy_live_…
npx @oxygenui-design/cli add @oxygen-pro/vitals-flowsheet
```

Credentials are written as `${OXYGEN_TOKEN}` and expanded from the environment at
request time. **A token written literally into `oxygen.json` is refused rather
than used** — that file is meant to be committed, and a token in git history is
not something you can undo later.

A Figma-scoped token cannot install components, and says so instead of returning
a bare `401`.

---

## Programmatic use

The same machinery is importable, for a build step that materialises components
into a generated app rather than shelling out and parsing output:

```ts
import { collectItems, planInstall, readConfig } from "@oxygenui-design/cli";

const config = await readConfig(process.cwd());
const items = await collectItems(["result-value"], config);
const plan = await planInstall(items, config, process.cwd());
```

---

## Registry or npm?

Installing from the registry means you have **forked, deliberately**: the source
is yours to read and change, and no release we publish will reach it. For semver
and patches, install [`@oxygenui-design/react`](../../packages/react/README.md)
instead. Both channels are generated from the same source, so they cannot behave
differently.

---

See [ADR 0016](../../content/decisions/0016-the-installer-is-ours.md) for why
this CLI exists at all, and
[`packages/cli/README.md`](../../packages/cli/README.md) for the package's own
documentation.
