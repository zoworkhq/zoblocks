---
"@oxygenui-design/theme": minor
---

The logo checker moves to `@oxygenui-design/theme/logo`

`checkLogo`, `checkBrandAsset`, `logoContentType`, `logoHeaders`,
`MAX_LOGO_BYTES`, `LOGO_VARIANTS` and `imageSize` are no longer exported from
the package barrel. They are at `@oxygenui-design/theme/logo`.

**Breaking for anyone importing them from the barrel**, which is the point.
`checkLogo` hashes uploaded bytes with `node:crypto`, so any consumer that
bundled `@oxygenui-design/theme` for a browser was carrying an unresolvable
import — and `imageSize` is 6 kB of PNG, JPEG, WebP and SVG header parsing that
only makes sense when you are holding an upload. Both are server work, and the
subpath says so.

```diff
-import { checkLogo, MAX_LOGO_BYTES } from "@oxygenui-design/theme";
+import { checkLogo, MAX_LOGO_BYTES } from "@oxygenui-design/theme/logo";
```

The `LogoFormat` and `Dimensions` _types_ stay on the barrel. They describe an
image rather than read one, and a caller naming a format should not have to
import a server module to do it.

`LogoFormat` is now declared in `assets.ts`, beside the roles that enumerate
which formats each accepts. It was a type-only cycle between the two files —
harmless at runtime, and refused by the architecture rules, correctly: the next
edge added to that cycle may not be type-only.
