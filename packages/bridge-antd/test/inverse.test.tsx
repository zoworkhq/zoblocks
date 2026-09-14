/**
 * A ZoBlocks brand pushed into Ant Design.
 *
 * The forward bridge answers "make ZoBlocks look like our antd app". This
 * answers the one customers care about more: "we configured our brand — why do
 * our *own* buttons still look like antd's default blue?"
 *
 * Because it is the same correspondence read backwards, the round-trip test is
 * the one that keeps both honest: if `colorPrimary ↔ --zb-accent` is ever
 * wrong, it is wrong in both directions and this catches it.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { theme as antdTheme, ConfigProvider } from "antd";
import { resolvePatch, type ZoBlocksTokens } from "@zoblocks/bridge-core";
import { NOT_PUSHED_TO_ANTD, ZoBlocksAntdProvider, antdBridge, toAntdTheme } from "../src/index";

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
  "--zb-text-base": "0.875rem",
};

describe("toAntdTheme", () => {
  it("puts the ZoBlocks accent on antd's primary", () => {
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

  /** antd states radii and sizes as numbers of pixels; ZoBlocks uses rem. */
  it("converts rem to the pixel numbers antd expects", () => {
    const { token } = toAntdTheme(BRAND);
    expect(token?.borderRadius).toBe(8);
    expect(token?.fontSize).toBe(14);
  });

  it("writes nothing for a brand it does not have", () => {
    expect(toAntdTheme({})).toEqual({ token: {} });
  });

  it("omits a token rather than writing an empty string", () => {
    const { token } = toAntdTheme({ "--zb-accent": "" });
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
      "--zb-accent": "#1d63c9",
    } as ZoBlocksTokens);

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

  it("round-trips a radius through pixels without drift", () => {
    const { token } = toAntdTheme(BRAND);
    const back = resolvePatch(antdBridge, token ?? {});
    // 0.5rem → 8px → "8px". The unit changes, the size does not.
    expect(back["--zb-radius"]).toBe("8px");
  });
});

describe("<ZoBlocksAntdProvider>", () => {
  function Probe() {
    const { token } = antdTheme.useToken();
    return <span data-testid="primary">{token.colorPrimary}</span>;
  }

  it("themes the host's own antd components", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#7c3aed");

    render(
      <ZoBlocksAntdProvider>
        <Probe />
      </ZoBlocksAntdProvider>,
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
          <ZoBlocksAntdProvider scope={ref}>
            <Probe />
          </ZoBlocksAntdProvider>
        </div>
      );
    }
    render(<Branded />);

    expect(await screen.findByText("#0f766e")).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });

  it("lets a host keep a deliberate exception", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#7c3aed");

    render(
      <ZoBlocksAntdProvider override={{ colorPrimary: "#b91c1c" }}>
        <Probe />
      </ZoBlocksAntdProvider>,
    );

    expect(await screen.findByText("#b91c1c")).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });

  it("composes with an existing ConfigProvider rather than replacing it", async () => {
    function SizeProbe() {
      const { token } = antdTheme.useToken();
      return <span data-testid="both">{`${token.colorPrimary}|${token.borderRadius}`}</span>;
    }
    document.documentElement.style.setProperty("--zb-accent", "#7c3aed");

    render(
      <ConfigProvider theme={{ token: { borderRadius: 16 } }}>
        <ZoBlocksAntdProvider>
          <SizeProbe />
        </ZoBlocksAntdProvider>
      </ConfigProvider>,
    );

    // The outer radius survives because this bridge does not supply one when
    // ZoBlocks has not defined it.
    expect(await screen.findByText(/#7c3aed\|16/)).toBeTruthy();
    document.documentElement.removeAttribute("style");
  });
});
