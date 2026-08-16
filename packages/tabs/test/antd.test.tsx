/**
 * The Ant Design bridge.
 *
 * It exists for one case: a host on antd's *default* theme, where the design
 * tokens live only in JavaScript. A host with `cssVar` enabled needs none of
 * this, because `styles.css` already falls through to `--ant-*`.
 *
 * What is worth asserting is the mapping itself — that `colorPrimary` becomes
 * the indicator and not something adjacent, and that the concentric radius
 * relationship survives, because getting that wrong looks subtly broken at
 * every size and is invisible in a snapshot.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfigProvider, theme } from "antd";
import { AntdTabsBridge, useAntdTabsTokens } from "../src/antd.js";
import { Tabs } from "../src/index.js";

function Probe() {
  const tokens = useAntdTabsTokens();
  return <span data-testid="tokens">{JSON.stringify(tokens)}</span>;
}

/** Renders, reads, and tears down — so a test may sample two themes. */
function readTokens(ui: React.ReactElement): Record<string, string | number> {
  const { unmount } = render(ui);
  const tokens = JSON.parse(screen.getByTestId("tokens").textContent ?? "{}");
  unmount();
  return tokens;
}

describe("useAntdTabsTokens", () => {
  it("maps colorPrimary onto the accent and the indicator", () => {
    const tokens = readTokens(
      <ConfigProvider theme={{ token: { colorPrimary: "#7c3aed" } }}>
        <Probe />
      </ConfigProvider>,
    );
    expect(tokens["--ox-tabs-accent"]).toBe("#7c3aed");
    expect(tokens["--ox-tabs-focus"]).toBe("#7c3aed");
  });

  it("keeps the track and thumb radii concentric", () => {
    const tokens = readTokens(
      <ConfigProvider theme={{ token: { borderRadiusLG: 12 } }}>
        <Probe />
      </ConfigProvider>,
    );
    // outer = inner + inset. A thumb that simply reuses the track radius looks
    // subtly wrong at every size, which is why this is arithmetic and not two
    // independent tokens.
    const pad = Number.parseFloat(String(tokens["--ox-tabs-track-pad"]));
    const inner = Number.parseFloat(String(tokens["--ox-tabs-thumb-radius"]));
    const outer = Number.parseFloat(String(tokens["--ox-tabs-track-radius"]));
    expect(inner).toBe(12);
    expect(outer).toBe(inner + pad);
  });

  it("takes the hit target from controlHeight", () => {
    const tokens = readTokens(
      <ConfigProvider theme={{ token: { controlHeight: 40 } }}>
        <Probe />
      </ConfigProvider>,
    );
    expect(tokens["--ox-tabs-min-h"]).toBe("40px");
  });

  it("follows the dark algorithm", () => {
    const light = readTokens(
      <ConfigProvider>
        <Probe />
      </ConfigProvider>,
    );
    const dark = readTokens(
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <Probe />
      </ConfigProvider>,
    );
    // A bridge that ignored the algorithm would produce a light strip on a
    // dark host, which is the whole failure it exists to prevent.
    expect(dark["--ox-tabs-fg-selected"]).not.toBe(light["--ox-tabs-fg-selected"]);
  });

  it("maps the status colours antd already has", () => {
    const tokens = readTokens(
      <ConfigProvider theme={{ token: { colorError: "#dc2626", colorWarning: "#d97706" } }}>
        <Probe />
      </ConfigProvider>,
    );
    expect(tokens["--ox-tabs-critical"]).toBe("#dc2626");
    expect(tokens["--ox-tabs-high"]).toBe("#d97706");
  });
});

describe("AntdTabsBridge", () => {
  it("wraps its children in one element carrying the tokens", () => {
    const { container } = render(
      <ConfigProvider theme={{ token: { colorPrimary: "#0ea5e9" } }}>
        <AntdTabsBridge className="host">
          <span>inside</span>
        </AntdTabsBridge>
      </ConfigProvider>,
    );
    const bridge = container.querySelector("[data-ox-antd-bridge]") as HTMLElement;
    expect(bridge).toBeInTheDocument();
    expect(bridge).toHaveClass("host");
    expect(bridge.style.getPropertyValue("--ox-tabs-accent")).toBe("#0ea5e9");
    expect(bridge).toHaveTextContent("inside");
  });

  it("does not disturb a tab strip rendered inside it", () => {
    render(
      <ConfigProvider theme={{ token: { colorPrimary: "#0ea5e9" } }}>
        <AntdTabsBridge>
          <Tabs
            as="tabs"
            aria-label="Chart"
            defaultValue="a"
            items={[
              { value: "a", label: "Alpha" },
              { value: "b", label: "Bravo" },
            ]}
          />
        </AntdTabsBridge>
      </ConfigProvider>,
    );
    // The bridge is presentation only: it must not appear in the
    // accessibility tree between the strip and its container.
    expect(screen.getByRole("tablist", { name: "Chart" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });
});
