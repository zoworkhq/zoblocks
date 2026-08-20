---
"@oxygenui-design/tokens": minor
"@oxygenui-design/tabs": patch
"@oxygenui-design/copilot": patch
"@oxygenui-design/identity": patch
---

The component token surface is now a generated, published contract, and the
token gate is a module rather than a build script.

Two new entry points on `@oxygenui-design/tokens`:

- **`/validate`** — the accessibility gate as pure functions. No `node:*`, no
  DOM, so the build, a browser preview and a server-side publish check run
  identical code. It had no direct tests; it now has 85.
- **`/surface`** — every `--ox-<component>-*` token a consumer may set or a
  theme bridge may write. 282 entries across 19 components, each carrying its
  semantic fallback, the host-framework variables already in its chain, whether
  it terminates in a literal, and whether a bridge is allowed near it.

Generating the surface found four live defects, all of the same silent shape —
valid CSS, correct pixels, and the component quietly not participating in the
theming system it appears to be part of:

- **Seven component tokens referenced tokens that do not exist.** `--ox-fg`,
  `--ox-fg-muted`, `--ox-fg-subtle` in `tabs`; `--ox-rule` and
  `--ox-status-accent` in `copilot`. Those colours never followed an Oxygen or
  customer brand — they fell through to antd's value or a literal. The docs
  site masked it by defining the invented names in its own stylesheet. Now
  corrected to `--ox-text*`, `--ox-border` and `--ox-accent`, and a dangling
  fallback fails the build.
- **`@oxygenui-design/identity` was documented as needing antd** and imports it
  nowhere. Its own metadata already said so. The README row is corrected and
  the unused `devDependency` removed; a test now holds every package's declared
  framework dependency against what it actually imports.

Also: clinical tokens are marked `bridgeable: false`, so a theme bridge cannot
map a host framework's `colorError` onto `status.critical` — ours carries a
validated contrast floor and a 60° hue separation from `status.low`, and a
brand red carries neither. Components declare their framework relationship in
metadata, and ADR 0010's requirement that a wrapping component _name_ the
behaviour it inherits is now enforced by the schema rather than by review.

See ADR 0012.
