"use client";

/**
 * A theme applied inline, without a stylesheet.
 *
 *     <OxygenTheme tokens={{ "--ox-accent": "#1d63c9" }}>{app}</OxygenTheme>
 *
 * The third delivery mode. Most applications should link the published
 * stylesheet — version-pinned, CDN-cacheable, no JavaScript, and it survives
 * this component not rendering. This is for the two cases a stylesheet cannot
 * serve: a multi-tenant page rendering two customers' branding at once, where
 * a root-scoped payload would let the last one loaded win; and the console's
 * own preview, which has to show an unpublished draft.
 *
 * Structurally identical to a theme bridge, and deliberately so: both write
 * custom properties onto a wrapper, so a brand and a bridge compose by ordinary
 * cascade rules with no coordination code between them.
 */

import * as React from "react";

export interface OxygenThemeProps {
  children: React.ReactNode;
  /** Custom properties to apply. Keys must be `--` prefixed. */
  tokens: Record<string, string | number | undefined>;
  /** Sets `data-ox-brand`, so brand-scoped CSS applies to this subtree too. */
  brand?: string;
  theme?: "light" | "dark" | "high-contrast";
  density?: "patient" | "standard" | "clinical";
  className?: string;
  as?: "div" | "span";
}

export function OxygenTheme({
  children,
  tokens,
  brand,
  theme,
  density,
  className,
  as = "div",
}: OxygenThemeProps) {
  const style = React.useMemo(() => {
    const out: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(tokens)) {
      // An undefined value would still spread onto the element and blank the
      // property, which defeats the fallback chain the stylesheets rely on.
      if (value === undefined || value === "") continue;
      if (!key.startsWith("--")) continue;
      out[key] = value;
    }
    return out;
  }, [tokens]);

  return React.createElement(
    as,
    {
      className,
      style,
      ...(brand ? { "data-ox-brand": brand } : {}),
      ...(theme ? { "data-ox-theme": theme } : {}),
      ...(density ? { "data-ox-density": density } : {}),
    },
    children,
  );
}
