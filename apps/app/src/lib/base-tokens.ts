/**
 * The palette a customer theme is validated against.
 *
 * The app must judge a theme on the *same* palette its components render on, or
 * a theme can pass here and fail in the customer's application. One assembly,
 * shared with the generator, so there is only ever one answer to what that
 * palette is.
 *
 * Imported rather than read from disk, and that is the load-bearing part. The
 * generator calls `loadTokenSource()`, which reads `packages/tokens/tokens/` at
 * run time — correct for a script standing in the repository, and fatal inside
 * a serverless function, where those files do not exist. Next traces what a
 * bundle imports; it cannot trace a path assembled from `import.meta.url` at
 * run time, so the theme screens shipped with 358 traced files and none of the
 * tokens they need. They crashed in production while passing every test
 * locally, where the repository is simply there.
 *
 * Static imports are what make the files part of the bundle.
 *
 * No brands. `loadBrands()` enumerates a directory, which a bundle cannot do,
 * and it would be the wrong input anyway: a brand is a customer's own palette,
 * and the customer palette being judged here arrives on the theme itself as
 * `ref.brand`. The base is what it is measured against.
 */

import { cache } from "react";
import { tokenSourceFrom } from "../../../../scripts/gen/tokens/load";
import type { TokenSource } from "@zoblocks/tokens/validate";

import primitive from "@zoblocks/tokens/tokens/primitive.json";
import shared from "@zoblocks/tokens/tokens/semantic/shared.json";
import light from "@zoblocks/tokens/tokens/semantic/light.json";
import dark from "@zoblocks/tokens/tokens/semantic/dark.json";
import highContrast from "@zoblocks/tokens/tokens/semantic/high-contrast.json";
import density from "@zoblocks/tokens/tokens/density.json";
import component from "@zoblocks/tokens/tokens/component.json";

export const baseTokens = cache(async (): Promise<TokenSource> =>
  tokenSourceFrom({ primitive, shared, light, dark, highContrast, density, component }),
);
