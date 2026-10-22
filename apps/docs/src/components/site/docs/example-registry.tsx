"use client";

/**
 * Live previews for documented examples, keyed by component and example id.
 *
 * An example's code lives in the component's metadata; what it looks like
 * running has to be written here, because the code is a string and this site
 * does not evaluate strings. An example with no entry renders as code alone —
 * the Preview tab is not drawn rather than drawn empty.
 *
 * Add one by mapping `examples[n].id` to a function that renders the same
 * thing the code does, with the same fixture.
 */

import type * as React from "react";

export const EXAMPLE_PREVIEWS: Readonly<
  Record<string, Readonly<Record<string, () => React.ReactNode>>>
> = {};

export function examplePreview(component: string, example: string) {
  return EXAMPLE_PREVIEWS[component]?.[example];
}
