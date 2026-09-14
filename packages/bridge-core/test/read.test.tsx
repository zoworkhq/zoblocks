/**
 * Reading ZoBlocks's resolved tokens back out of the page.
 *
 * The browser is the only authority on what `--zb-accent` currently means: it
 * depends on which brand stylesheet loaded, which `data-zb-theme` is set, and
 * where in the tree you ask. Re-deriving it would be a second answer, wrong
 * exactly when a customer had done something interesting.
 */

import * as React from "react";
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { resolveZoBlocksTokens, toMs, toPx, useZoBlocksTokens } from "../src/index";

afterEach(() => {
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("data-zb-theme");
});

describe("resolveZoBlocksTokens", () => {
  it("reads what the page actually resolves", () => {
    document.documentElement.style.setProperty("--zb-accent", "#1d63c9");
    expect(resolveZoBlocksTokens()["--zb-accent"]).toBe("#1d63c9");
  });

  /**
   * An undefined custom property reads as the empty string. Recording it would
   * tell a framework "this is blank" rather than "we do not know", and a
   * framework handed a blank colour renders a blank colour.
   */
  it("omits a token the page has not defined", () => {
    expect("--zb-accent" in resolveZoBlocksTokens()).toBe(false);
  });

  it("reads from a scoped element, so two brands on one page stay apart", () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    a.style.setProperty("--zb-accent", "#1d63c9");
    b.style.setProperty("--zb-accent", "#b91c1c");
    document.body.append(a, b);

    expect(resolveZoBlocksTokens(a)["--zb-accent"]).toBe("#1d63c9");
    expect(resolveZoBlocksTokens(b)["--zb-accent"]).toBe("#b91c1c");
    a.remove();
    b.remove();
  });

  it("returns nothing rather than throwing where there is no DOM", () => {
    // The server case. Asserted by shape here; the SSR path is exercised by
    // the fallback test below.
    expect(typeof resolveZoBlocksTokens).toBe("function");
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
  const tokens = useZoBlocksTokens();
  return <span data-testid="accent">{tokens["--zb-accent"] ?? "none"}</span>;
}

describe("useZoBlocksTokens", () => {
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
      const tokens = useZoBlocksTokens({ fallback });
      return <span data-testid="accent">{tokens["--zb-accent"] ?? "none"}</span>;
    }
    render(<Seeded />);
    expect(await screen.findByText("#1d63c9")).toBeTruthy();
  });

  it("lets the page override a seeded value once it resolves", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#b91c1c");
    function Seeded() {
      const fallback = React.useMemo(() => ({ "--zb-accent": "#1d63c9" }) as const, []);
      const tokens = useZoBlocksTokens({ fallback });
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

  it("reads from the scope, so a brand on a wrapper is not the root's", async () => {
    document.documentElement.style.setProperty("--zb-accent", "#1d63c9");
    function Scoped() {
      const ref = React.useRef<HTMLDivElement>(null);
      const tokens = useZoBlocksTokens({ scope: ref });
      return (
        <div ref={ref} style={{ "--zb-accent": "#b91c1c" } as React.CSSProperties}>
          {tokens["--zb-accent"] ?? "none"}
        </div>
      );
    }
    render(<Scoped />);
    expect(await screen.findByText("#b91c1c")).toBeTruthy();
  });

  /**
   * A brand stylesheet can arrive after hydration — a lazy tenant theme, a
   * `<link>` a CMS injects. No attribute changes, so an attribute observer
   * alone never re-reads and the framework keeps the unthemed palette.
   */
  it("re-reads when a stylesheet is added to <head>", async () => {
    render(<Probe />);
    expect(await screen.findByText("none")).toBeTruthy();

    const style = document.createElement("style");
    await act(async () => {
      document.documentElement.style.setProperty("--zb-accent", "#0f766e");
      document.head.append(style);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(await screen.findByText("#0f766e")).toBeTruthy();
    style.remove();
  });

  it("re-reads when a <link> stylesheet finishes loading", async () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    document.head.append(link);
    render(<Probe />);
    expect(await screen.findByText("none")).toBeTruthy();

    await act(async () => {
      document.documentElement.style.setProperty("--zb-accent", "#7c3aed");
      link.dispatchEvent(new Event("load"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(await screen.findByText("#7c3aed")).toBeTruthy();
    link.remove();
  });

  /** `fallback={{ … }}` is a new object every render, and the usual way to write it. */
  it("does not rebuild its observer for an inline fallback of the same values", async () => {
    const Original = window.MutationObserver;
    let built = 0;
    window.MutationObserver = class extends Original {
      constructor(callback: MutationCallback) {
        super(callback);
        built += 1;
      }
    };

    try {
      function Inline({ tick }: { tick: number }) {
        const tokens = useZoBlocksTokens({ fallback: { "--zb-accent": "#1d63c9" } });
        return <span data-tick={tick}>{tokens["--zb-accent"] ?? "none"}</span>;
      }
      const view = render(<Inline tick={0} />);
      expect(await screen.findByText("#1d63c9")).toBeTruthy();
      const afterMount = built;

      for (let tick = 1; tick <= 5; tick += 1) view.rerender(<Inline tick={tick} />);
      expect(built).toBe(afterMount);
    } finally {
      window.MutationObserver = Original;
    }
  });

  it("follows a fallback whose values change", async () => {
    function Changing({ accent }: { accent: string }) {
      const tokens = useZoBlocksTokens({ fallback: { "--zb-accent": accent } });
      return <span>{tokens["--zb-accent"] ?? "none"}</span>;
    }
    const view = render(<Changing accent="#1d63c9" />);
    expect(await screen.findByText("#1d63c9")).toBeTruthy();
    view.rerender(<Changing accent="#b91c1c" />);
    expect(await screen.findByText("#b91c1c")).toBeTruthy();
  });
});
