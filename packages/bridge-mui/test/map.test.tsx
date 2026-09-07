/**
 * The Material UI bridge, and the contract it was built to test.
 *
 * Two jobs. The first is the ordinary one: assert the mapping is faithful. The
 * second matters more — this bridge exists to find out whether a token surface
 * derived from Ant Design is genuinely framework-independent or merely
 * antd-shaped, so the tests that count are the ones about what MUI *cannot*
 * express and what the two bridges must agree on.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { resolvePatch, verifyPatch } from "@zoblocks/bridge-core";
import { NOT_BRIDGEABLE } from "@zoblocks/tokens/surface";
import { antdBridge } from "@zoblocks/bridge-antd";
import { MuiBridge, muiBridge, useMuiTokens, type MuiTheme } from "../src/index";

const patch = (theme: MuiTheme) => resolvePatch(muiBridge, theme);

describe("identity of the mapping", () => {
  it("puts palette.primary.main on the accent", () => {
    const out = patch({ palette: { primary: { main: "#1976d2" } } });
    expect(out["--zb-accent"]).toBe("#1976d2");
    expect(out["--zb-focus-ring"]).toBe("#1976d2");
  });

  it("maps the text ramp in the right order of emphasis", () => {
    const out = patch({
      palette: { text: { primary: "#111111", secondary: "#555555", disabled: "#999999" } },
    });
    expect(out["--zb-text"]).toBe("#111111");
    expect(out["--zb-text-muted"]).toBe("#555555");
    expect(out["--zb-text-subtle"]).toBe("#999999");
  });

  it("distinguishes the paper surface from the page ground", () => {
    const out = patch({ palette: { background: { default: "#fafafa", paper: "#ffffff" } } });
    expect(out["--zb-bg"]).toBe("#fafafa");
    expect(out["--zb-surface"]).toBe("#ffffff");
  });

  it("converts MUI's numeric durations to milliseconds", () => {
    const out = patch({ transitions: { duration: { standard: 300, shorter: 200, complex: 375 } } });
    expect(out["--zb-duration"]).toBe("300ms");
    expect(out["--zb-duration-fast"]).toBe("200ms");
    expect(out["--zb-duration-slow"]).toBe("375ms");
  });

  /** MUI has 25 elevation steps and Zoblocks has three. Sampled, not imported. */
  it("samples three steps from the elevation scale", () => {
    const shadows = Array.from({ length: 25 }, (_, i) => `shadow-${i}`);
    const out = patch({ shadows });
    expect(out["--zb-shadow-sm"]).toBe("shadow-1");
    expect(out["--zb-shadow"]).toBe("shadow-4");
    expect(out["--zb-shadow-lg"]).toBe("shadow-8");
  });

  it("treats elevation 0 as no shadow rather than a shadow called none", () => {
    expect(patch({ shadows: ["none", "none"] })["--zb-shadow-sm"]).toBeUndefined();
  });

  it("survives a theme with fewer elevation steps than MUI ships", () => {
    expect(patch({ shadows: ["none", "a"] })["--zb-shadow-lg"]).toBeUndefined();
  });
});

describe("what MUI cannot express", () => {
  /**
   * The findings this bridge was written to produce. Each is a real gap in the
   * two systems' vocabularies, declared rather than approximated — a token
   * filled by guessing makes a component uniformly slightly wrong, which is
   * harder to diagnose than one that is partly unthemed.
   */
  it("declares the background scale it does not have", () => {
    expect(muiBridge.unmapped).toContain("--zb-bg-subtle");
    expect(muiBridge.unmapped).toContain("--zb-bg-muted");
    const out = patch({ palette: { background: { default: "#fafafa", paper: "#fff" } } });
    expect(out["--zb-bg-subtle"]).toBeUndefined();
    expect(out["--zb-bg-muted"]).toBeUndefined();
  });

  it("maps only the base radius, because shape.borderRadius is one number", () => {
    const out = patch({ shape: { borderRadius: 8 } });
    expect(out["--zb-radius"]).toBe("8px");
    expect(out["--zb-radius-sm"]).toBeUndefined();
    expect(out["--zb-radius-lg"]).toBeUndefined();
  });

  it("leaves the hit target to Zoblocks, since MUI sizes controls per component", () => {
    expect(muiBridge.unmapped).toContain("--zb-density-target");
    expect(patch({ shape: { borderRadius: 8 } })["--zb-density-target"]).toBeUndefined();
  });

  /**
   * Both bridges map the label colour, and they do not mean the same thing.
   *
   * MUI *derives* `contrastText` per palette entry, against its own contrast
   * threshold, so it moves when the brand does. antd's `colorTextLightSolid`
   * is one fixed value for every filled surface — white by default in both its
   * light and dark algorithms — and it is the caller's problem if their
   * primary is too pale for it.
   *
   * This assertion used to say antd had no equivalent at all. That was wrong,
   * and the error had a visible cost: with the token unmapped, Zoblocks's own
   * near-black dark label landed on antd's dark primary at 3.70:1, a button
   * antd would never render. Left here as a comparison rather than deleted,
   * because the difference between a derived value and a fixed one is the
   * thing a reader of these two bridges should take away.
   */
  it("derives the label colour, where antd supplies one fixed value", () => {
    const out = patch({ palette: { primary: { main: "#1976d2", contrastText: "#ffffff" } } });
    expect(out["--zb-text-on-accent"]).toBe("#ffffff");
    expect(muiBridge.unmapped).not.toContain("--zb-text-on-accent");
    expect(antdBridge.unmapped).not.toContain("--zb-text-on-accent");
  });
});

describe("the two bridges agree where it matters", () => {
  /**
   * The architectural claim, checked. If the surface were antd-shaped, the MUI
   * bridge would be unable to write the tokens components actually read, and
   * this overlap would be thin.
   */
  it("both write the tokens every component depends on", () => {
    const mui = patch({
      palette: {
        primary: { main: "#1976d2", dark: "#115293" },
        text: { primary: "#000", secondary: "#555" },
        background: { default: "#fafafa", paper: "#fff" },
        divider: "#e0e0e0",
      },
      shape: { borderRadius: 4 },
      typography: { fontFamily: "Roboto", fontSize: 14 },
    });
    const antd = resolvePatch(antdBridge, {
      colorPrimary: "#1677ff",
      colorPrimaryHover: "#4096ff",
      colorText: "#000",
      colorTextSecondary: "#555",
      colorBgLayout: "#fafafa",
      colorBgContainer: "#fff",
      colorBorder: "#e0e0e0",
      borderRadius: 4,
      fontFamily: "Roboto",
      fontSize: 14,
    });

    const core = [
      "--zb-accent",
      "--zb-accent-hover",
      "--zb-text",
      "--zb-text-muted",
      "--zb-bg",
      "--zb-surface",
      "--zb-border",
      "--zb-radius",
      "--zb-font-sans",
      "--zb-text-base",
    ];
    for (const token of core) {
      expect(Object.keys(mui), `mui: ${token}`).toContain(token);
      expect(Object.keys(antd), `antd: ${token}`).toContain(token);
    }
  });

  it("both refuse every clinical token", () => {
    const forbidden = new Set<string>(NOT_BRIDGEABLE);
    for (const [name, out] of [
      ["mui", patch({ palette: { primary: { main: "#1976d2" } } })],
      ["antd", resolvePatch(antdBridge, { colorPrimary: "#1677ff" })],
    ] as const) {
      expect(
        Object.keys(out).filter((k) => forbidden.has(k)),
        name,
      ).toEqual([]);
    }
  });

  it("both derive the same concentric geometry from the same radius", () => {
    const mui = patch({ shape: { borderRadius: 12 } });
    const antd = resolvePatch(antdBridge, { borderRadiusLG: 12 });
    expect(mui["--zb-tabs-track-radius"]).toBe(antd["--zb-tabs-track-radius"]);
    expect(mui["--zb-tabs-thumb-radius"]).toBe(antd["--zb-tabs-thumb-radius"]);
  });

  it("expose the same wrapper API, so switching is one import", () => {
    expect(muiBridge.id).not.toBe(antdBridge.id);
    expect(Object.keys(muiBridge).sort()).toEqual(Object.keys(antdBridge).sort());
  });
});

describe("the partial-mapping rule", () => {
  it("writes nothing at all for an empty theme", () => {
    expect(patch({})).toEqual({});
  });

  it("omits keys entirely rather than writing undefined", () => {
    const out = patch({ palette: { primary: { main: "#1976d2" } } });
    expect("--zb-text" in out).toBe(false);
  });

  it("passes bridge-core's own verification", () => {
    const result = verifyPatch(
      patch({
        palette: {
          primary: { main: "#1976d2", contrastText: "#ffffff" },
          text: { primary: "#000000" },
          background: { paper: "#ffffff" },
        },
        shape: { borderRadius: 4 },
      }),
    );
    expect(result.clinical).toEqual([]);
    expect(result.unknown).toEqual([]);
    expect(result.ok).toBe(true);
  });
});

/* ---- driven through a real MUI ThemeProvider ------------------------- */

function Probe() {
  return <span data-testid="tokens">{JSON.stringify(useMuiTokens())}</span>;
}

function read(ui: React.ReactElement): Record<string, string> {
  const { unmount } = render(ui);
  const tokens = JSON.parse(screen.getByTestId("tokens").textContent ?? "{}");
  unmount();
  return tokens;
}

describe("driven through a real MUI theme", () => {
  it("reads the host's configured primary colour", () => {
    const theme = createTheme({ palette: { primary: { main: "#7c3aed" } } });
    expect(
      read(
        <ThemeProvider theme={theme}>
          <Probe />
        </ThemeProvider>,
      )["--zb-accent"],
    ).toBe("#7c3aed");
  });

  it("follows a dark palette without the bridge knowing about it", () => {
    const light = read(
      <ThemeProvider theme={createTheme({ palette: { mode: "light" } })}>
        <Probe />
      </ThemeProvider>,
    );
    const dark = read(
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <Probe />
      </ThemeProvider>,
    );
    expect(dark["--zb-surface"]).not.toBe(light["--zb-surface"]);
    expect(dark["--zb-text"]).not.toBe(light["--zb-text"]);
  });

  it("writes no clinical token from a real theme that defines palette.error", () => {
    const theme = createTheme({ palette: { error: { main: "#d32f2f" } } });
    const tokens = read(
      <ThemeProvider theme={theme}>
        <Probe />
      </ThemeProvider>,
    );
    expect(Object.keys(tokens).some((k) => k.startsWith("--zb-status-"))).toBe(false);
  });

  it("puts the tokens on one element and marks it", () => {
    const { container } = render(
      <ThemeProvider theme={createTheme({ palette: { primary: { main: "#7c3aed" } } })}>
        <MuiBridge>
          <button type="button">Sign</button>
        </MuiBridge>
      </ThemeProvider>,
    );
    const wrapper = container.querySelector("[data-zb-bridge='mui']") as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.getPropertyValue("--zb-accent")).toBe("#7c3aed");
  });

  it("adds nothing to the accessibility tree", () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <MuiBridge>
          <button type="button">Sign</button>
        </MuiBridge>
      </ThemeProvider>,
    );
    const wrapper = screen.getByRole("button", { name: "Sign" }).parentElement as HTMLElement;
    expect(wrapper.getAttribute("role")).toBeNull();
  });
});
