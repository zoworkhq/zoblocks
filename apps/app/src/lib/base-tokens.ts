/**
 * The palette a customer theme is validated against.
 *
 * The app must judge a theme on the *same* palette its components render
 * on, or a theme can pass here and fail in the customer's application. Read
 * once per process from the package the components themselves ship, rather
 * than from a copy — a second copy is a second answer waiting to happen.
 */

import { cache } from "react";
import { loadTokenSource } from "../../../../scripts/gen/tokens/load";
import type { TokenSource } from "@oxygenui-design/tokens/validate";

export const baseTokens = cache(async (): Promise<TokenSource> => loadTokenSource());
