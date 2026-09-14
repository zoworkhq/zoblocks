# @zoblocks/cli

Installs ZoBlocks components into your repository. It writes the source, pulls
in anything those files import, and tells you what it touched.

```bash
# Once per project — say where your "@/" alias points.
npx @zoblocks/cli init

# Then add components by name.
npx @zoblocks/cli add pulse-loader
```

The public catalog needs no configuration, no namespace, and no account.

Components are **source you own**. Once a file lands in your repository it is
yours to read, audit, and change — and no release we publish will reach it. If
you want semver, patches, and deprecation warnings instead, install
[`@zoblocks/react`](../react/README.md); both channels are generated from
the same source, so they cannot behave differently.

## Commands

| Command                  | What it does                                 |
| ------------------------ | -------------------------------------------- |
| `zoblocks init`          | Write `zoblocks.json`                        |
| `zoblocks add <name...>` | Add components and everything they depend on |
| `zoblocks list`          | List the public catalog                      |

### Specifiers

```bash
zoblocks add vitals-panel                    # the public catalog
zoblocks add @zoblocks-pro/vitals-flowsheet    # a registry declared in zoblocks.json
zoblocks add https://…/item.json             # a registry item by URL
```

Dependencies come from the registry their component came from. A bare name
like `utils` in an item added by URL resolves beside that URL, so a mirror
stays self-contained. A dependency in another registry is written as a full URL.

### Options

| Flag          | Effect                                                     |
| ------------- | ---------------------------------------------------------- |
| `--cwd <dir>` | Run against another directory                              |
| `--overwrite` | Replace files that already exist                           |
| `--dry-run`   | Show what would be written, write nothing                  |
| `--no-deps`   | Do not touch `package.json` or the lockfile                |
| `--yes`       | Let this run your package manager for the npm dependencies |
| `--force`     | `init` only: overwrite an existing `zoblocks.json`         |

Without `--yes` the npm dependencies are printed as a command you can paste
rather than installed. An interactive prompt would need a TTY this cannot count
on — it runs in CI, in agent harnesses, and inside other people's install
scripts, and a prompt hangs in two of those three.

## `zoblocks.json`

```jsonc
{
  "$schema": "https://zoblocks.design/schema/zoblocks.json",
  "root": "src",
  "registries": {
    "@zoblocks-pro": {
      "url": "https://app.zoblocks.design/r/pro/{name}.json",
      "headers": { "Authorization": "Bearer ${ZOBLOCKS_TOKEN}" },
    },
  },
}
```

`root` is the directory your `@/` import alias resolves to. Everything else is
derived from it.

### Why there is one path setting and not four

ZoBlocks source is copied verbatim, and it imports itself through `@/` —
`@/lib/utils`, `@/components/zoblocks/timeline`. Those specifiers are **inside the
files**, so a component's location is fixed by the source rather than by
configuration. A setting that moved `utils.ts` to `src/shared/` while
`care-timeline.tsx` still imported `@/lib/utils` would write nine files and
compile none of them.

Honouring such a setting properly would mean rewriting import specifiers at
install time — real machinery, operating on source we hand to healthcare teams
precisely so they can audit it. So the registry states the path under `@/` and
this file states where `@/` points, which is the one degree of freedom that
actually exists. To put the files somewhere else, change the `@/*` mapping in
your `tsconfig.json`; the two settings then still agree.

## Paid components

Pro components come from an authenticated registry. Mint a token with the
`registry` scope in the console under **Marketplace → Access tokens**, then:

```bash
export ZOBLOCKS_TOKEN=zb_live_…
npx @zoblocks/cli add @zoblocks-pro/vitals-flowsheet
```

Credentials are written as `${ZOBLOCKS_TOKEN}` and expanded from the environment
at request time. **A token written literally into `zoblocks.json` is refused
rather than used** — that file is meant to be committed, and a token in git
history is not something you can undo later.

A Figma-scoped token cannot install components, and says so instead of
returning a bare `401`.

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

## Zero runtime dependencies

Deliberately. [ADR 0009](../../content/decisions/0009-supply-chain-and-component-constraints.md)
makes every runtime dependency an architectural decision, and an installer is
the worst place to spend that budget: it runs with write access to a customer's
repository, so its transitive tree is the first thing a vendor security review
opens. Node 20 supplies `fetch` and `parseArgs`; the registry client, the config
reader, and the writer are ours.

## Programmatic use

The same machinery is importable, for a build step that materialises components
into a generated app rather than shelling out and parsing output:

```ts
import { collectItems, planInstall, readConfig } from "@zoblocks/cli";

const config = await readConfig(process.cwd());
const items = await collectItems(["vitals-panel"], config);
const plan = await planInstall(items, config, process.cwd());
```

---

See [ADR 0016](../../content/decisions/0016-the-installer-is-ours.md) for why
this exists.
