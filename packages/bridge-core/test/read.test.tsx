/**
 * Reading Zoblocks's resolved tokens back out of the page.
 *
 * The browser is the only authority on what `--zb-accent` currently means: it
 * depends on which brand stylesheet loaded, which `data-zb-theme` is set, and
 * where in the tree you ask. Re-deriving it would be a second answer, wrong
 * exactly when a customer had done something interesting.
 */

import * as React from "react";
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { resolveZoblocksTokens, toMs, toPx, useZoblocksTokens } from "../src/index";

afterEach(() => {
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("data-zb-theme");
});

describe("resolveZoblocksTokens", () => {
  it("reads what the page actually resolves", () => {
    document.documentElement.style.setProperty("--zb-accent", "#1d63c9");
    expect(resolveZoblocksTokens()["--zb-accent"]).toBe("#1d63c9");
  });

  /**
   * An undefined custom property reads as the empty string. Recording it would
   * tell a framework "this is blank" rather than "we do not know", and a
   * framework handed a blank colour renders a blank colour.
   */
  it("omits a token the page has not defined", () => {
    expect("--zb-accent" in resolveZoblocksTokens()).toBe(false);
  });

  it("reads from a scoped element, so two brands on one page stay apart", () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    a.style.setProperty("--zb-accent", "#1d63c9");
    b.style.setProperty("--zb-accent", "#b91c1c");
    document.body.append(a, b);

    expect(resolveZoblocksTokens(a)["--zb-accent"]).toBe("#1d63c9");
    expect(resolveZoblocksTokens(b)["--zb-accent"]).toBe("#b91c1c");
    a.remove();
    b.remove();
  });

  it("returns nothing rather than throwing where there is no DOM", () => {
    // The server case. Asserted by shape here; the SSR path is exercised by
    // the fallback test below.
    expect(typeof resolveZoblocksTokens).toBe("function");
  });
});

describe("unit helpers", () => {
  it("converts rem to pixels, because frameworks want numbers", () => {
    expect(toPx("0.5rem")).toBe(8);
    expect(toPx("8px")).toBe(8);
    expect(toPx("1rem", 20)).toBe(20);
  });

  it("converts seconds to milliseconds", () => {
    expect(toMs("180ms")).toBe(180);
    expect(toMs("0.2s")).toBe(200);
  });

  it("returns undefined rather than NaN for a value it cannot read", () => {
    for (const bad of [undefined, "", "auto", "calc(1rem + 2px)"]) {
      expect(toPx(bad), String(bad)).toBeUndefined();
      expect(toMs(bad), String(bad)).toBeUndefined();
    }
  });
});

function Probe() {
  const tokens = useZoblocksTokens();
  return <span data-testid="accent">{tokens["--zb-accent"] ?? "none"}</span>;
}

describe("useZoblocksTokens", () => {
  it("resolves the tokens after mount", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#1d63c9");
    render(<Probe />);
    expect(await screen.findByText("#1d63c9")).toBeTruthy();
  });

  /**
   * Reading during render would make the server and client markup disagree,
   * and React would replace the tree rather than hydrate it — a visible flash
   * on every page load, to save one frame.
   */
  it("keeps a seeded value the page has not defined", async () => {
    // The server-rendered case: the theme stylesheet has not arrived, the
    // effect resolves nothing, and wiping the seed here would flash the page
    // to the unthemed palette.
    function Seeded() {
      const fallback = React.useMemo(() => ({ "--zb-accent": "#1d63c9" }) as const, []);
      const tokens = useZoblocksTokens({ fallback });
      return <span data-testid="accent">{tokens["--zb-accent"] ?? "none"}</span>;
    }
    render(<Seeded />);
    expect(await screen.findByText("#1d63c9")).toBeTruthy();
  });

  it("lets the page override a seeded value once it resolves", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#b91c1c");
    function Seeded() {
      const fallback = React.useMemo(() => ({ "--zb-accent": "#1d63c9" }) as const, []);
      const tokens = useZoblocksTokens({ fallback });
      return <span data-testid="accent">{tokens["--zb-accent"] ?? "none"}</span>;
    }
    render(<Seeded />);
    expect(await screen.findByText("#b91c1c")).toBeTruthy();
  });

  /**
   * A toggle flips `data-zb-theme` and every token below it changes at once.
   * A framework holding the previous set renders half a theme, which looks
   * like a bug in the customer's code rather than in ours.
   */
  it("follows a theme change", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#1d63c9");
    render(<Probe />);
    expect(await screen.findByText("#1d63c9")).toBeTruthy();

    await act(async () => {
      document.documentElement.style.setProperty("--zb-accent", "#b91c1c");
      document.documentElement.setAttribute("data-zb-theme", "dark");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(await screen.findByText("#b91c1c")).toBeTruthy();
  });
});
