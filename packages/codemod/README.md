# @zoblocks/codemod

Migration codemods for ZoBlocks. They rewrite what they can prove and report
what they cannot, rather than guessing.

```bash
# See what would change. Nothing is written.
pnpm dlx @zoblocks/codemod antd-collapse "src/**/*.tsx"

# Apply it.
pnpm dlx @zoblocks/codemod antd-collapse "src/**/*.tsx" --write
```

Exits non-zero while any note still needs a human, so it composes into CI as a
"migration not finished" gate.

## `oxygen-to-zoblocks`

Oxygen UI → ZoBlocks. The project was renamed in September 2026, and everything
a consumer's tree can hold moved with it.

```bash
pnpm dlx @zoblocks/codemod oxygen-to-zoblocks "src/**/*.{ts,tsx,css}" --write
```

**Rewritten automatically**

| Before                                            | After                                                 |
| ------------------------------------------------- | ----------------------------------------------------- |
| `@oxygenui-design/react`, `@oxygenui/intl`        | `@zoblocks/react`, `@zoblocks/intl`                   |
| `@/components/oxygen/timeline`                    | `@/components/zoblocks/timeline`                      |
| `@/lib/oxygen-loader`, `styles/oxygen-switch.css` | `@/lib/zoblocks-loader`, `styles/zoblocks-switch.css` |
| `--ox-accent`, `--color-ox-surface`               | `--zb-accent`, `--color-zb-surface`                   |
| `data-ox-density`, `dataset.oxPhoto`              | `data-zb-density`, `dataset.zbPhoto`                  |
| `.ox-switch__track`, `className="ox-grid"`        | `.zb-switch__track`, `className="zb-grid"`            |
| `<ox-pulse-loader>`                               | `<zb-pulse-loader>`                                   |
| `@keyframes ox-fade`                              | `@keyframes zb-fade`                                  |
| `OXYGEN_TOKEN`, `oxy_live_…`                      | `ZOBLOCKS_TOKEN`, `zb_live_…`                         |

**Reported, not rewritten**

- **`oxygen.json`.** Rename it to `zoblocks.json` yourself. The CLI still reads
  the old name and warns once, so nothing breaks while it sits there.
- **Anything else still saying "oxygen".** Usually your own identifiers or
  prose, which are not ours to rewrite. If one of them names something of ours,
  it was missed and is worth reporting.

**Why the `ox-` rules look fussy.** `box-shadow`, `box-sizing` and
`checkbox-label` all contain `ox-`. Every rule anchors on the character to its
left, which is what stops a stylesheet becoming `bzb-shadow`. There is a test
for exactly that.

## `antd-collapse`

Ant Design `Collapse` → ZoBlocks `Accordion`. The two APIs are deliberately the
same shape, so most of this is an import rewrite and three v6 renames.

**Rewritten automatically**

| Before                            | After                                         |
| --------------------------------- | --------------------------------------------- |
| `import { Collapse } from "antd"` | `import { Accordion } from "@zoblocks/react"` |
| `<Collapse>` / `</Collapse>`      | `<Accordion>` / `</Accordion>`                |
| `expandIconPosition`              | `expandIconPlacement`                         |
| `destroyOnClose`                  | `destroyOnHidden`                             |
| `size="middle"`                   | `size="medium"`                               |

Sibling antd imports are preserved — a file importing `Collapse` almost always
imports other antd components beside it, and deleting those would break the
build somewhere that looks unrelated.

**Reported, not rewritten**

- **`headingLevel`.** ZoBlocks wraps every trigger in a real heading, and the
  correct level depends on the surrounding document outline — which a transform
  cannot see. A wrong level produces valid markup, a quiet axe run, and a
  heading list that misrepresents the page to the one reader who navigates by
  it. So the codemod asks, once per call site.
- **`Collapse.Panel`.** Deprecated in antd too, and it has no ZoBlocks equivalent.
  The panels move into the `items` array: `header` becomes `label`, children
  become `children`.
- **An aliased import** (`Collapse as Foldy`). The import is rewritten; the
  local binding is left alone.

**Worth knowing, no change needed**

`accordion` keeps antd's meaning — one section open at a time. It no longer
changes the emitted roles: antd switches to `role="tablist"/"tab"/"tabpanel"`
when that prop is set, which swaps a disclosure pattern for a tab pattern as a
side effect of a state option. ZoBlocks stays a disclosure widget in every
configuration.

## Why there is no parser here

`ARCHITECTURE.md` §9 makes every new runtime dependency an architectural
decision. A full AST transform would pull in jscodeshift and a Babel toolchain
to do work that is textual. The trade is stated rather than hidden: this
operates on text, it is conservative, and every construct it cannot analyse
becomes a note instead of an edit.

The transform is also idempotent — running it twice changes nothing the second
time — which is what makes it safe to wire into a pre-commit hook.
