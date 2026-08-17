---
"@oxygenui-design/identity": minor
---

Put Patient identity in the catalog, and make its stylesheet actually themeable.

The components shipped without a `component.meta.ts`, which is what the
generator builds the catalog from — so they existed on npm and were invisible
on the docs site. Adds the metadata, seven live scenarios, and the card art the
docs-coverage gate requires.

Two real defects surfaced while wiring it up:

- **The stylesheet ignored the theme.** It declared `--ox-fg`, `--ox-bg` and
  `--ox-radius` locally — shadowing the semantic tier for everything nested
  inside a banner — and read three names that do not exist
  (`--ox-bg-container`, `--ox-text-secondary`, `--ox-fill-tertiary`). It looked
  correct on a white page and was light chrome on a dark app, with no response
  to a brand at all. Rewired to the repo's three-tier chain with
  `--ox-identity-*` as the documented override surface.

- **`antd` was a required peer that the package never imports.** Nothing under
  `src/` references it, so a non-antd consumer was being asked to install it
  for nothing. Removed.

`component-meta` gains an optional `propsSource` — unversioned here because it
is private and never publishes. The convention — extract props from `src/<Title>.tsx` — assumes a package has one
public component; identity's surface is three, and contorting the catalog title
into a filename would put the filename in front of the reader.
