/**
 * An Oxygen brand pushed into Ant Design.
 *
 * The forward bridge answers "make Oxygen look like our antd app". This
 * answers the one customers care about more: "we configured our brand — why do
 * our *own* buttons still look like antd's default blue?"
 *
 * Because it is the same correspondence read backwards, the round-trip test is
 * the one that keeps both honest: if `colorPrimary ↔ --ox-accent` is ever
 * wrong, it is wrong in both directions and this catches it.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { theme as antdTheme, ConfigProvider } from "antd";
import { resolvePatch, type OxygenTokens } from "@oxygenui-design/bridge-core";
import { NOT_PUSHED_TO_ANTD, OxygenAntdProvider, antdBridge, toAntdTheme } from "../src/index";

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
  "--ox-text-base": "0.875rem",
};

describe("toAntdTheme", () => {
  it("puts the Oxygen accent on antd's primary", () => {
    const { token } = toAntdTheme(BRAND);
    expect(token?.colorPrimary).toBe("#1d63c9");
    expect(token?.colorPrimaryHover).toBe("#1a53a8");
  });

  it("maps text and surfaces into antd's vocabulary", () => {
    const { token } = toAntdTheme(BRAND);
    expect(token?.colorText).toBe("#0f172a");
    expect(token?.colorTextSecondary).toBe("#475569");
    expect(token?.colorBgContainer).toBe("#ffffff");
    expect(token?.colorBgLayout).toBe("#f8fafc");
  });

  /** antd states radii and sizes as numbers of pixels; Oxygen uses rem. */
  it("converts rem to the pixel numbers antd expects", () => {
    const { token } = toAntdTheme(BRAND);
    expect(token?.borderRadius).toBe(8);
    expect(token?.fontSize).toBe(14);
  });

  it("writes nothing for a brand it does not have", () => {
    expect(toAntdTheme({})).toEqual({ token: {} });
  });

  it("omits a token rather than writing an empty string", () => {
    const { token } = toAntdTheme({ "--ox-accent": "" });
    expect("colorPrimary" in (token ?? {})).toBe(false);
  });

  /**
   * The mirror of the forward rule, and the more surprising direction. antd
   * applies `colorError` to a validation message and a delete button, so a
   * colour meaning *this result is dangerous* would come to mean *this field is
   * wrong*. The hex would survive; the meaning would not.
   */
  it("never pushes a clinical colour into a framework's semantics", () => {
    const { token } = toAntdTheme({
      ...BRAND,
      "--ox-accent": "#1d63c9",
    } as OxygenTokens);

    for (const forbidden of NOT_PUSHED_TO_ANTD) {
      expect(forbidden in (token ?? {}), forbidden).toBe(false);
    }
  });
});

describe("the two directions agree", () => {
  /**
   * Out and back. A brand pushed into antd and read straight back must be the
   * brand we started with — otherwise the app's export and the runtime
   * bridge disagree about what a customer's colour means.
   */
  it("round-trips the accent, text, surfaces and border", () => {
    const { token } = toAntdTheme(BRAND);
    const back = resolvePatch(antdBridge, token ?? {});

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

  it("round-trips a radius through pixels without drift", () => {
    const { token } = toAntdTheme(BRAND);
    const back = resolvePatch(antdBridge, token ?? {});
    // 0.5rem → 8px → "8px". The unit changes, the size does not.
    expect(back["--ox-radius"]).toBe("8px");
  });
});

describe("<OxygenAntdProvider>", () => {
  function Probe() {
    const { token } = antdTheme.useToken();
    return <span data-testid="primary">{token.colorPrimary}</span>;
  }

  it("themes the host's own antd components", async () => {
    document.documentElement.style.setProperty("--ox-accent", "#7c3aed");

    render(
      <OxygenAntdProvider>
        <Probe />
      </OxygenAntdProvider>,
    );

    expect(await screen.findByText("#7c3aed")).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });

  it("lets a host keep a deliberate exception", async () => {
    document.documentElement.style.setProperty("--ox-accent", "#7c3aed");

    render(
      <OxygenAntdProvider override={{ colorPrimary: "#b91c1c" }}>
        <Probe />
      </OxygenAntdProvider>,
    );

    expect(await screen.findByText("#b91c1c")).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });

  it("composes with an existing ConfigProvider rather than replacing it", async () => {
    function SizeProbe() {
      const { token } = antdTheme.useToken();
      return <span data-testid="both">{`${token.colorPrimary}|${token.borderRadius}`}</span>;
    }
    document.documentElement.style.setProperty("--ox-accent", "#7c3aed");

    render(
      <ConfigProvider theme={{ token: { borderRadius: 16 } }}>
        <OxygenAntdProvider>
          <SizeProbe />
        </OxygenAntdProvider>
      </ConfigProvider>,
    );

    // The outer radius survives because this bridge does not supply one when
    // Oxygen has not defined it.
    expect(await screen.findByText(/#7c3aed\|16/)).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });
});
