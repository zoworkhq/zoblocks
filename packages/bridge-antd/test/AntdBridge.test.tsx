/**
 * The wrapper, driven through a real `ConfigProvider`.
 *
 * The mapping is unit-tested with literals; this asserts the other half — that
 * a host's actual antd theme reaches the element as custom properties, and
 * that the bridge stays one inert element with no accessibility footprint.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfigProvider, theme } from "antd";
import { AntdBridge, useAntdTokens } from "../src/index";

function Probe() {
  const tokens = useAntdTokens();
  return <span data-testid="tokens">{JSON.stringify(tokens)}</span>;
}

function read(ui: React.ReactElement): Record<string, string> {
  const { unmount } = render(ui);
  const tokens = JSON.parse(screen.getByTestId("tokens").textContent ?? "{}");
  unmount();
  return tokens;
}

describe("useAntdTokens", () => {
  it("reads the host's configured primary colour", () => {
    const tokens = read(
      <ConfigProvider theme={{ token: { colorPrimary: "#7c3aed" } }}>
        <Probe />
      </ConfigProvider>,
    );
    expect(tokens["--ox-accent"]).toBe("#7c3aed");
  });

  it("follows the dark algorithm without the bridge knowing about it", () => {
    const light = read(
      <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
        <Probe />
      </ConfigProvider>,
    );
    const dark = read(
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <Probe />
      </ConfigProvider>,
    );
    // The bridge reads resolved values, so a dark algorithm needs no
    // special-casing — it simply arrives already resolved.
    expect(dark["--ox-surface"]).not.toBe(light["--ox-surface"]);
    expect(dark["--ox-text"]).not.toBe(light["--ox-text"]);
  });

  it("keeps the concentric radius relationship from a real theme", () => {
    const tokens = read(
      <ConfigProvider theme={{ token: { borderRadiusLG: 12 } }}>
        <Probe />
      </ConfigProvider>,
    );
    expect(tokens["--ox-tabs-thumb-radius"]).toBe("12px");
    expect(tokens["--ox-tabs-track-radius"]).toBe("16px");
  });

  it("writes no clinical token even though a real antd theme defines colorError", () => {
    const tokens = read(
      <ConfigProvider theme={{ token: { colorError: "#ff0000" } }}>
        <Probe />
      </ConfigProvider>,
    );
    expect(Object.keys(tokens).some((k) => k.startsWith("--ox-status-"))).toBe(false);
    expect(Object.keys(tokens).some((k) => k.startsWith("--ox-flag-"))).toBe(false);
  });
});

describe("<AntdBridge>", () => {
  it("puts the tokens on one element and marks it", () => {
    const { container } = render(
      <ConfigProvider theme={{ token: { colorPrimary: "#7c3aed" } }}>
        <AntdBridge>
          <button type="button">Sign</button>
        </AntdBridge>
      </ConfigProvider>,
    );

    const wrapper = container.querySelector("[data-ox-bridge='antd']") as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.getPropertyValue("--ox-accent")).toBe("#7c3aed");
    expect(wrapper.tagName).toBe("DIV");
  });

  /**
   * A bridge that altered the accessibility tree would be a bridge that
   * changed the component, which is the one thing this architecture promises
   * it does not do.
   */
  it("adds nothing to the accessibility tree", () => {
    render(
      <ConfigProvider>
        <AntdBridge>
          <button type="button">Sign</button>
        </AntdBridge>
      </ConfigProvider>,
    );
    const button = screen.getByRole("button", { name: "Sign" });
    expect(button).toBeTruthy();
    // The wrapper itself is not a landmark, a group, or anything else a
    // screen reader announces.
    const wrapper = button.parentElement as HTMLElement;
    expect(wrapper.getAttribute("role")).toBeNull();
    expect(wrapper.getAttribute("aria-label")).toBeNull();
  });

  it("renders as a span when a block element would break the layout", () => {
    const { container } = render(
      <ConfigProvider>
        <AntdBridge as="span">text</AntdBridge>
      </ConfigProvider>,
    );
    expect(container.querySelector("[data-ox-bridge]")?.tagName).toBe("SPAN");
  });

  it("passes a className through, so a host can position it", () => {
    const { container } = render(
      <ConfigProvider>
        <AntdBridge className="fill">x</AntdBridge>
      </ConfigProvider>,
    );
    expect(container.querySelector("[data-ox-bridge]")?.className).toBe("fill");
  });
});
