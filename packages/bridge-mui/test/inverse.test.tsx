/**
 * An Oxygen brand pushed into Material UI.
 *
 * Deliberately the mirror of the antd inverse, down to the prop names: a
 * customer moving between frameworks should change a provider and nothing
 * else, and two wrappers with different shapes would quietly make that false.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { resolvePatch, type OxygenTokens } from "@oxygenui-design/bridge-core";
import { OxygenAntdProvider } from "@oxygenui-design/bridge-antd";
import { NOT_PUSHED_TO_MUI, OxygenMuiProvider, muiBridge, toMuiTheme } from "../src/index";

const BRAND: OxygenTokens = {
  "--ox-accent": "#1d63c9",
  "--ox-accent-hover": "#1a53a8",
  "--ox-text": "#0f172a",
  "--ox-text-muted": "#475569",
  "--ox-surface": "#ffffff",
  "--ox-bg": "#f8fafc",
  "--ox-border": "#e2e8f0",
  "--ox-radius": "0.5rem",
  "--ox-font-sans": "Georgia, serif",
};

describe("toMuiTheme", () => {
  it("puts the Oxygen accent on MUI's primary", () => {
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
      "--ox-accent",
      "--ox-accent-hover",
      "--ox-text",
      "--ox-text-muted",
      "--ox-surface",
      "--ox-bg",
      "--ox-border",
      "--ox-font-sans",
    ] as const) {
      expect(back[key], key).toBe(BRAND[key]);
    }
  });

  it("round-trips the radius through pixels", () => {
    expect(resolvePatch(muiBridge, toMuiTheme(BRAND))["--ox-radius"]).toBe("8px");
  });
});

describe("<OxygenMuiProvider>", () => {
  function Probe() {
    const theme = useTheme();
    return <span data-testid="primary">{theme.palette.primary.main}</span>;
  }

  it("themes the host's own MUI components", async () => {
    document.documentElement.style.setProperty("--ox-accent", "#7c3aed");
    render(
      <ThemeProvider theme={createTheme()}>
        <OxygenMuiProvider>
          <Probe />
        </OxygenMuiProvider>
      </ThemeProvider>,
    );
    expect(await screen.findByText("#7c3aed")).toBeTruthy();
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
    document.documentElement.style.setProperty("--ox-accent", "#7c3aed");

    render(
      <ThemeProvider theme={createTheme({ spacing: 10 })}>
        <OxygenMuiProvider>
          <SpacingProbe />
        </OxygenMuiProvider>
      </ThemeProvider>,
    );

    expect(await screen.findByText(/#7c3aed\|10px/)).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });

  it("lets a host keep a deliberate exception", async () => {
    document.documentElement.style.setProperty("--ox-accent", "#7c3aed");
    render(
      <ThemeProvider theme={createTheme()}>
        <OxygenMuiProvider override={{ palette: { primary: { main: "#b91c1c" } } }}>
          <Probe />
        </OxygenMuiProvider>
      </ThemeProvider>,
    );
    expect(await screen.findByText("#b91c1c")).toBeTruthy();
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
    const antdProps = OxygenAntdProvider.length;
    const muiProps = OxygenMuiProvider.length;
    expect(antdProps).toBe(muiProps);
  });
});
