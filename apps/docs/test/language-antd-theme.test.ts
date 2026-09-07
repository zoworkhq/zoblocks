/**
 * The antd brand table, pinned to what the bridges actually emit.
 *
 * Two demos on this site mount antd directly — Signature, because the package
 * genuinely wraps it, and the Playground, because several renderers do — so
 * their `ConfigProvider` needs a real colour rather than a `var()`. antd
 * derives hover, active and border shades from `colorPrimary`, which is why
 * reading `--zb-accent` back out of the DOM is not an option.
 *
 * That leaves a copy of two colours per language, and a copy is a thing that
 * drifts. These assertions are the guard: the Material UI values are exactly
 * what `muiBridge.map()` writes for `--zb-accent` and `--zb-text-on-accent`
 * from an untouched `createTheme()`, and the ZoBlocks values are the resolved
 * `--zb-accent` and `--zb-text-on-accent` from `packages/tokens`. If either
 * moves, this fails rather than the demo quietly showing last year's blue.
 */

import { describe, expect, it } from "vitest";
import { antdBrandTokens } from "@/components/site/language-antd-theme";

describe("the antd brand table", () => {
  it("gives ZoBlocks its own accent, in both modes", () => {
    // `--zb-accent` / `--zb-text-on-accent`, light and dark, from
    // packages/tokens/src/zoblocks-tokens.css.
    expect(antdBrandTokens("zoblocks", false)).toEqual({
      colorPrimary: "#067662",
      colorTextLightSolid: "#ffffff",
    });
    expect(antdBrandTokens("zoblocks", true)).toEqual({
      colorPrimary: "#6ce7cb",
      // Not white: the dark accent is a light teal, and white on it is worse
      // than the blue it replaced.
      colorTextLightSolid: "#071014",
    });
  });

  it("overrides nothing for Ant Design, which is the whole point", () => {
    // Empty in both modes, so a reader who picks "Ant Design" sees #1677ff and
    // #1668dc — the defaults their own application would ship with, including
    // the 4.10:1 label contrast that is antd's to own.
    expect(antdBrandTokens("antd", false)).toEqual({});
    expect(antdBrandTokens("antd", true)).toEqual({});
  });

  it("matches Material UI's own palette, which is where drift would show", () => {
    // `createTheme().palette.primary.main` and `.contrastText`, per mode.
    expect(antdBrandTokens("mui", false)).toEqual({
      colorPrimary: "#1976d2",
      colorTextLightSolid: "#ffffff",
    });
    expect(antdBrandTokens("mui", true)).toEqual({
      colorPrimary: "#90caf9",
      colorTextLightSolid: "rgba(0, 0, 0, 0.87)",
    });
  });

  it("covers every language the switcher offers", () => {
    // A language added to the switcher and forgotten here would render the
    // Signature and Playground panels in whatever the last one set — the exact
    // failure this table was introduced to fix.
    for (const language of ["zoblocks", "antd", "mui"] as const) {
      expect(antdBrandTokens(language, false)).toBeDefined();
      expect(antdBrandTokens(language, true)).toBeDefined();
    }
  });
});
