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
import { resolvePatch, verifyPatch } from "@oxygenui-design/bridge-core";
import { NOT_BRIDGEABLE } from "@oxygenui-design/tokens/surface";
import { antdBridge } from "@oxygenui-design/bridge-antd";
import { MuiBridge, muiBridge, useMuiTokens, type MuiTheme } from "../src/index";

const patch = (theme: MuiTheme) => resolvePatch(muiBridge, theme);

describe("identity of the mapping", () => {
  it("puts palette.primary.main on the accent", () => {
    const out = patch({ palette: { primary: { main: "#1976d2" } } });
    expect(out["--ox-accent"]).toBe("#1976d2");
    expect(out["--ox-focus-ring"]).toBe("#1976d2");
  });

  it("maps the text ramp in the right order of emphasis", () => {
    const out = patch({
      palette: { text: { primary: "#111111", secondary: "#555555", disabled: "#999999" } },
    });
    expect(out["--ox-text"]).toBe("#111111");
    expect(out["--ox-text-muted"]).toBe("#555555");
    expect(out["--ox-text-subtle"]).toBe("#999999");
  });

  it("distinguishes the paper surface from the page ground", () => {
    const out = patch({ palette: { background: { default: "#fafafa", paper: "#ffffff" } } });
    expect(out["--ox-bg"]).toBe("#fafafa");
    expect(out["--ox-surface"]).toBe("#ffffff");
  });

  it("converts MUI's numeric durations to milliseconds", () => {
    const out = patch({ transitions: { duration: { standard: 300, shorter: 200, complex: 375 } } });
    expect(out["--ox-duration"]).toBe("300ms");
    expect(out["--ox-duration-fast"]).toBe("200ms");
    expect(out["--ox-duration-slow"]).toBe("375ms");
  });

  /** MUI has 25 elevation steps and Oxygen has three. Sampled, not imported. */
  it("samples three steps from the elevation scale", () => {
    const shadows = Array.from({ length: 25 }, (_, i) => `shadow-${i}`);
    const out = patch({ shadows });
    expect(out["--ox-shadow-sm"]).toBe("shadow-1");
    expect(out["--ox-shadow"]).toBe("shadow-4");
    expect(out["--ox-shadow-lg"]).toBe("shadow-8");
  });

  it("treats elevation 0 as no shadow rather than a shadow called none", () => {
    expect(patch({ shadows: ["none", "none"] })["--ox-shadow-sm"]).toBeUndefined();
  });

  it("survives a theme with fewer elevation steps than MUI ships", () => {
    expect(patch({ shadows: ["none", "a"] })["--ox-shadow-lg"]).toBeUndefined();
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
    expect(muiBridge.unmapped).toContain("--ox-bg-subtle");
    expect(muiBridge.unmapped).toContain("--ox-bg-muted");
    const out = patch({ palette: { background: { default: "#fafafa", paper: "#fff" } } });
    expect(out["--ox-bg-subtle"]).toBeUndefined();
    expect(out["--ox-bg-muted"]).toBeUndefined();
  });

  it("maps only the base radius, because shape.borderRadius is one number", () => {
    const out = patch({ shape: { borderRadius: 8 } });
    expect(out["--ox-radius"]).toBe("8px");
    expect(out["--ox-radius-sm"]).toBeUndefined();
    expect(out["--ox-radius-lg"]).toBeUndefined();
  });

  it("leaves the hit target to Oxygen, since MUI sizes controls per component", () => {
    expect(muiBridge.unmapped).toContain("--ox-density-target");
    expect(patch({ shape: { borderRadius: 8 } })["--ox-density-target"]).toBeUndefined();
  });

  /**
   * The reverse: something MUI has that antd does not. MUI resolves a label
   * colour for a filled action against its own contrast threshold; antd
   * computes it per component and exposes no token.
   */
  it("maps contrastText, which antd has no equivalent for", () => {
    const out = patch({ palette: { primary: { main: "#1976d2", contrastText: "#ffffff" } } });
    expect(out["--ox-text-on-accent"]).toBe("#ffffff");
    expect(antdBridge.unmapped).toContain("--ox-text-on-accent");
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
      "--ox-accent",
      "--ox-accent-hover",
      "--ox-text",
      "--ox-text-muted",
      "--ox-bg",
      "--ox-surface",
      "--ox-border",
      "--ox-radius",
      "--ox-font-sans",
      "--ox-text-base",
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
    expect(mui["--ox-tabs-track-radius"]).toBe(antd["--ox-tabs-track-radius"]);
    expect(mui["--ox-tabs-thumb-radius"]).toBe(antd["--ox-tabs-thumb-radius"]);
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
    expect("--ox-text" in out).toBe(false);
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
      )["--ox-accent"],
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
    expect(dark["--ox-surface"]).not.toBe(light["--ox-surface"]);
    expect(dark["--ox-text"]).not.toBe(light["--ox-text"]);
  });

  it("writes no clinical token from a real theme that defines palette.error", () => {
    const theme = createTheme({ palette: { error: { main: "#d32f2f" } } });
    const tokens = read(
      <ThemeProvider theme={theme}>
        <Probe />
      </ThemeProvider>,
    );
    expect(Object.keys(tokens).some((k) => k.startsWith("--ox-status-"))).toBe(false);
  });

  it("puts the tokens on one element and marks it", () => {
    const { container } = render(
      <ThemeProvider theme={createTheme({ palette: { primary: { main: "#7c3aed" } } })}>
        <MuiBridge>
          <button type="button">Sign</button>
        </MuiBridge>
      </ThemeProvider>,
    );
    const wrapper = container.querySelector("[data-ox-bridge='mui']") as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.getPropertyValue("--ox-accent")).toBe("#7c3aed");
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
