/**
 * A ZoBlocks brand pushed into Material UI.
 *
 * Deliberately the mirror of the antd inverse, down to the prop names: a
 * customer moving between frameworks should change a provider and nothing
 * else, and two wrappers with different shapes would quietly make that false.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { resolvePatch, type ZoBlocksTokens } from "@zoblocks/bridge-core";
import { ZoBlocksAntdProvider } from "@zoblocks/bridge-antd";
import { NOT_PUSHED_TO_MUI, ZoBlocksMuiProvider, muiBridge, toMuiTheme } from "../src/index";

const BRAND: ZoBlocksTokens = {
  "--zb-accent": "#1d63c9",
  "--zb-accent-hover": "#1a53a8",
  "--zb-text": "#0f172a",
  "--zb-text-muted": "#475569",
  "--zb-surface": "#ffffff",
  "--zb-bg": "#f8fafc",
  "--zb-border": "#e2e8f0",
  "--zb-radius": "0.5rem",
  "--zb-font-sans": "Georgia, serif",
};

describe("toMuiTheme", () => {
  /**
   * The shades are meaningless without the colour they are shades of.
   *
   * `createTheme` runs `augmentColor` over any `primary` it receives and throws
   * if `main` is absent, so an object carrying only `dark` is not a partial
   * theme — it is one that takes the host's application down at import. A theme
   * with a hover accent and no accent is unusual and entirely reachable: it is
   * one override away.
   */
  it("omits primary entirely rather than emitting shades with no main", () => {
    const options = toMuiTheme({
      "--zb-accent-hover": "#1a53a8",
      "--zb-accent-subtle": "#eef4fd",
    });
    expect(options.palette?.primary).toBeUndefined();
  });

  it("keeps the rest of the palette when the accent is missing", () => {
    // The absence of one entry must not take the others with it.
    const options = toMuiTheme({ "--zb-text": "#16181d", "--zb-bg": "#ffffff" });
    expect(options.palette?.text?.primary).toBe("#16181d");
    expect(options.palette?.background?.default).toBe("#ffffff");
  });

  it("puts the ZoBlocks accent on MUI's primary", () => {
    const options = toMuiTheme(BRAND);
    expect(options.palette?.primary?.main).toBe("#1d63c9");
    expect(options.palette?.primary?.dark).toBe("#1a53a8");
  });

  it("maps text, surfaces and the divider", () => {
    const options = toMuiTheme(BRAND);
    expect(options.palette?.text?.primary).toBe("#0f172a");
    expect(options.palette?.background?.paper).toBe("#ffffff");
    expect(options.palette?.divider).toBe("#e2e8f0");
  });

  it("converts the radius to the number MUI expects", () => {
    expect(toMuiTheme(BRAND).shape?.borderRadius).toBe(8);
  });

  /**
   * `createTheme({ palette: { primary: {} } })` is not the same as leaving
   * `primary` alone: MUI treats a present-but-empty object as a deliberate
   * override and recomputes defaults from it, so an empty one changes the
   * theme rather than leaving it be.
   */
  it("omits an empty section rather than supplying a blank one", () => {
    const options = toMuiTheme({});
    expect(options.palette).toBeUndefined();
    expect(options.shape).toBeUndefined();
    expect(options.typography).toBeUndefined();
  });

  it("never pushes a clinical colour into MUI's semantics", () => {
    const serialised = JSON.stringify(toMuiTheme(BRAND));
    for (const forbidden of NOT_PUSHED_TO_MUI) {
      const leaf = forbidden.split(".").at(-1) as string;
      expect(serialised.includes(`"${leaf}"`), forbidden).toBe(false);
    }
  });
});

describe("the two directions agree", () => {
  it("round-trips the brand", () => {
    const back = resolvePatch(muiBridge, toMuiTheme(BRAND));
    for (const key of [
      "--zb-accent",
      "--zb-accent-hover",
      "--zb-text",
      "--zb-text-muted",
      "--zb-surface",
      "--zb-bg",
      "--zb-border",
      "--zb-font-sans",
    ] as const) {
      expect(back[key], key).toBe(BRAND[key]);
    }
  });

  it("round-trips the radius through pixels", () => {
    expect(resolvePatch(muiBridge, toMuiTheme(BRAND))["--zb-radius"]).toBe("8px");
  });
});

describe("<ZoBlocksMuiProvider>", () => {
  function Probe() {
    const theme = useTheme();
    return <span data-testid="primary">{theme.palette.primary.main}</span>;
  }

  it("themes the host's own MUI components", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#7c3aed");
    render(
      <ThemeProvider theme={createTheme()}>
        <ZoBlocksMuiProvider>
          <Probe />
        </ZoBlocksMuiProvider>
      </ThemeProvider>,
    );
    expect(await screen.findByText("#7c3aed")).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });

  it("reads the brand from `scope` rather than the document", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#7c3aed");

    function Branded() {
      const ref = React.useRef<HTMLDivElement>(null);
      return (
        <div ref={ref} style={{ "--zb-accent": "#0f766e" } as React.CSSProperties}>
          <ZoBlocksMuiProvider scope={ref}>
            <Probe />
          </ZoBlocksMuiProvider>
        </div>
      );
    }
    render(
      <ThemeProvider theme={createTheme()}>
        <Branded />
      </ThemeProvider>,
    );

    expect(await screen.findByText("#0f766e")).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });

  /**
   * Extends rather than replaces. A customer who set spacing or a breakpoint
   * keeps them — only the palette and shape this derives are supplied.
   */
  it("keeps the host's unrelated theme settings", async () => {
    function SpacingProbe() {
      const theme = useTheme();
      return <span data-testid="both">{`${theme.palette.primary.main}|${theme.spacing(1)}`}</span>;
    }
    document.documentElement.style.setProperty("--zb-accent", "#7c3aed");

    render(
      <ThemeProvider theme={createTheme({ spacing: 10 })}>
        <ZoBlocksMuiProvider>
          <SpacingProbe />
        </ZoBlocksMuiProvider>
      </ThemeProvider>,
    );

    expect(await screen.findByText(/#7c3aed\|10px/)).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });

  it("lets a host keep a deliberate exception", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#7c3aed");
    render(
      <ThemeProvider theme={createTheme()}>
        <ZoBlocksMuiProvider override={{ palette: { primary: { main: "#b91c1c" } } }}>
          <Probe />
        </ZoBlocksMuiProvider>
      </ThemeProvider>,
    );
    expect(await screen.findByText("#b91c1c")).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });

  /*
   * `createTheme(a, b, c)` deep-merges b and c raw, after the palette and the
   * type scale are built. A brand passed that way kept MUI's blue `dark` and
   * Roboto on every variant.
   */
  function DerivedProbe() {
    const { palette, typography } = useTheme();
    return (
      <span data-testid="derived">
        {[
          palette.primary.main,
          palette.primary.dark,
          palette.primary.contrastText,
          typography.body1.fontFamily,
          typography.button.fontFamily,
        ].join("|")}
      </span>
    );
  }

  const expected = (main: string, font: string) => {
    const reference = createTheme({ palette: { primary: { main } } }).palette.primary;
    return [main, reference.dark, reference.contrastText, font, font].join("|");
  };

  it("derives the primary shades and contrast text from the brand", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#7c3aed");
    document.documentElement.style.setProperty("--zb-font-sans", "Georgia, serif");
    render(
      <ThemeProvider theme={createTheme()}>
        <ZoBlocksMuiProvider>
          <DerivedProbe />
        </ZoBlocksMuiProvider>
      </ThemeProvider>,
    );
    const text = expected("#7c3aed", "Georgia, serif");
    expect(await screen.findByText(text)).toBeTruthy();
    // Not the host's default blue.
    expect(text).not.toContain(createTheme().palette.primary.dark);
    document.documentElement.removeAttribute("style");
  });

  it("derives shades from an override's colour, not the brand's", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#7c3aed");
    document.documentElement.style.setProperty("--zb-font-sans", "Georgia, serif");
    render(
      <ThemeProvider theme={createTheme()}>
        <ZoBlocksMuiProvider override={{ palette: { primary: { main: "#b91c1c" } } }}>
          <DerivedProbe />
        </ZoBlocksMuiProvider>
      </ThemeProvider>,
    );
    expect(await screen.findByText(expected("#b91c1c", "Georgia, serif"))).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });

  it("keeps a host's deliberate variant settings while taking the brand font", async () => {
    function VariantProbe() {
      const { typography } = useTheme();
      return (
        <span data-testid="variant">
          {`${String(typography.h1.fontWeight)}|${typography.h2.fontFamily}|${typography.h1.fontFamily}`}
        </span>
      );
    }
    document.documentElement.style.setProperty("--zb-font-sans", "Georgia, serif");
    render(
      <ThemeProvider
        theme={createTheme({
          typography: { h1: { fontWeight: 900 }, h2: { fontFamily: "Courier, monospace" } },
        })}
      >
        <ZoBlocksMuiProvider>
          <VariantProbe />
        </ZoBlocksMuiProvider>
      </ThemeProvider>,
    );
    expect(await screen.findByText("900|Courier, monospace|Georgia, serif")).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });
});

describe("the two inverse bridges are the same shape", () => {
  /**
   * The architectural claim at the provider level: switching framework is
   * changing one import, and two providers with different prop names would
   * quietly make that false.
   */
  it("take the same props", () => {
    const antdProps = ZoBlocksAntdProvider.length;
    const muiProps = ZoBlocksMuiProvider.length;
    expect(antdProps).toBe(muiProps);
  });
});
