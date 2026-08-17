# @oxygenui-design/codemod

Migration codemods for Oxygen UI. They rewrite what they can prove and report
what they cannot, rather than guessing.

```bash
# See what would change. Nothing is written.
pnpm dlx @oxygenui-design/codemod antd-collapse "src/**/*.tsx"

# Apply it.
pnpm dlx @oxygenui-design/codemod antd-collapse "src/**/*.tsx" --write
```

Exits non-zero while any note still needs a human, so it composes into CI as a
"migration not finished" gate.

## `antd-collapse`

Ant Design `Collapse` → Oxygen `Accordion`. The two APIs are deliberately the
same shape, so most of this is an import rewrite and three v6 renames.

**Rewritten automatically**

| Before                            | After                                                |
| --------------------------------- | ---------------------------------------------------- |
| `import { Collapse } from "antd"` | `import { Accordion } from "@oxygenui-design/react"` |
| `<Collapse>` / `</Collapse>`      | `<Accordion>` / `</Accordion>`                       |
| `expandIconPosition`              | `expandIconPlacement`                                |
| `destroyOnClose`                  | `destroyOnHidden`                                    |
| `size="middle"`                   | `size="medium"`                                      |

Sibling antd imports are preserved — a file importing `Collapse` almost always
imports other antd components beside it, and deleting those would break the
build somewhere that looks unrelated.

**Reported, not rewritten**

- **`headingLevel`.** Oxygen wraps every trigger in a real heading, and the
  correct level depends on the surrounding document outline — which a transform
  cannot see. A wrong level produces valid markup, a quiet axe run, and a
  heading list that misrepresents the page to the one reader who navigates by
  it. So the codemod asks, once per call site.
- **`Collapse.Panel`.** Deprecated in antd too, and it has no Oxygen equivalent.
  The panels move into the `items` array: `header` becomes `label`, children
  become `children`.
- **An aliased import** (`Collapse as Foldy`). The import is rewritten; the
  local binding is left alone.

**Worth knowing, no change needed**

`accordion` keeps antd's meaning — one section open at a time. It no longer
changes the emitted roles: antd switches to `role="tablist"/"tab"/"tabpanel"`
when that prop is set, which swaps a disclosure pattern for a tab pattern as a
side effect of a state option. Oxygen stays a disclosure widget in every
configuration.

## Why there is no parser here

`ARCHITECTURE.md` §9 makes every new runtime dependency an architectural
decision. A full AST transform would pull in jscodeshift and a Babel toolchain
to do work that is textual. The trade is stated rather than hidden: this
operates on text, it is conservative, and every construct it cannot analyse
becomes a note instead of an edit.

The transform is also idempotent — running it twice changes nothing the second
time — which is what makes it safe to wire into a pre-commit hook.
