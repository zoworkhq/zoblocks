"use client";

/**
 * The antd `ConfigProvider` tokens for the selected design language.
 *
 * Two demos on this site mount antd themselves rather than through
 * `host-react`: the Signature demo, because `@zoblocks/signature`
 * genuinely wraps antd and cannot be rendered any other way, and the
 * Playground, because several of its renderers do. Both used to hardcode
 * Zoblocks's accent, which was right when Zoblocks was the only design language
 * and became wrong the moment the switcher existed — the framework changed
 * everywhere on the page except inside those two panels.
 *
 * antd derives hover, active and border shades from `colorPrimary`, so it
 * needs a real colour rather than a `var()`. That rules out reading
 * `--zb-accent` back out of the DOM, which would also mean a computed-style
 * round trip on every theme flip. The table below is explicit instead, and
 * `language-antd-theme.test.ts` pins every value to what the bridges actually
 * emit, so it cannot drift from them silently.
 */

import type { DesignLanguage } from "@/lib/design-language";
import { useDesignLanguage } from "@/lib/design-language";
import { useSiteTheme } from "./use-site-theme";

/** Only the tokens a demo needs to look like it belongs to its language. */
export interface AntdBrandTokens {
  colorPrimary?: string;
  colorTextLightSolid?: string;
}

/**
 * Ant Design's entry is deliberately empty.
 *
 * Overriding nothing is what makes "Ant Design" mean Ant Design: the reader
 * sees `#1677ff` and `#1668dc`, the defaults their own application would ship
 * with, rather than our idea of them.
 */
const BRAND: Record<DesignLanguage, { light: AntdBrandTokens; dark: AntdBrandTokens }> = {
  zoblocks: {
    // `colorTextLightSolid` moves with the accent because Zoblocks's dark accent
    // is a light teal, and white on it is worse than the blue it replaced.
    light: { colorPrimary: "#067662", colorTextLightSolid: "#ffffff" },
    dark: { colorPrimary: "#6ce7cb", colorTextLightSolid: "#071014" },
  },
  antd: { light: {}, dark: {} },
  mui: {
    // `palette.primary.main` and `primary.contrastText` from an untouched
    // `createTheme()`, in each mode — the same two values `muiBridge.map()`
    // writes to `--zb-accent` and `--zb-text-on-accent`.
    light: { colorPrimary: "#1976d2", colorTextLightSolid: "#ffffff" },
    dark: { colorPrimary: "#90caf9", colorTextLightSolid: "rgba(0, 0, 0, 0.87)" },
  },
};

export function antdBrandTokens(language: DesignLanguage, dark: boolean): AntdBrandTokens {
  return BRAND[language][dark ? "dark" : "light"];
}

/**
 * The tokens for the language and colour mode currently in effect.
 *
 * `dark` is taken as an argument rather than read here, because the Signature
 * demo has its own light/dark override that starts from the site's value and
 * then diverges — it needs to pass the mode it is actually rendering.
 */
export function useAntdBrandTokens(dark?: boolean): AntdBrandTokens {
  const language = useDesignLanguage();
  const siteDark = useSiteTheme();
  return antdBrandTokens(language, dark ?? siteDark);
}
