// @vitest-environment node

/**
 * The package must be importable on a server.
 *
 * This suite exists because of a real defect: `class OxLoaderElement extends
 * HTMLElement` was evaluated at module scope, so importing the package in Node
 * threw `ReferenceError: HTMLElement is not defined` — breaking Nuxt, Angular
 * Universal, Astro, SvelteKit, and Next.js server components, every one of
 * which the README promised to support.
 *
 * It shipped because the only other suite runs in jsdom, which supplies
 * `HTMLElement`. A browser-environment test *cannot* catch this class of bug.
 * That is the whole reason this file declares `@vitest-environment node` at the
 * top, and why it must never be merged into `elements.test.ts`.
 */

import { describe, expect, it } from "vitest";

const ENTRY_POINTS = [
  ["barrel", "../src/index.js"],
  ["pulse", "../src/pulse.js"],
  ["rhythm", "../src/rhythm.js"],
  ["breath", "../src/breath.js"],
  ["helix", "../src/helix.js"],
  ["infusion", "../src/infusion.js"],
] as const;

describe("server rendering", () => {
  it("has no DOM available — the premise of every assertion here", () => {
    expect(typeof HTMLElement).toBe("undefined");
    expect(typeof customElements).toBe("undefined");
    expect(typeof document).toBe("undefined");
  });

  it.each(ENTRY_POINTS)("imports the %s entry point without throwing", async (_name, path) => {
    await expect(import(path)).resolves.toBeDefined();
  });

  it("registers nothing, because there is no registry to register into", async () => {
    // Importing must be inert on a server. If `define()` ever stops guarding on
    // `typeof customElements`, this is where it surfaces.
    await import("../src/index.js");
    expect(typeof customElements).toBe("undefined");
  });

  it("still exports its pure helpers, which have no DOM dependency", async () => {
    const { beatMs, clamp, cycleMs, strokePx, resolveSize } = await import("../src/base.js");

    expect(beatMs(60, 1)).toBe(1000);
    expect(beatMs(undefined, 2)).toBe(500);
    expect(clamp(420, 0, 100)).toBe(100);
    expect(cycleMs(4000, 2)).toBe(2000);
    expect(strokePx(20)).toBe(2);
    expect(resolveSize("lg", "md")).toBe(56);
  });

  it("exports the art and geometry a server-rendered snapshot would need", async () => {
    const { LOADER_ART, LOADER_VIEWBOX, PULSE_MIN_SIZE_PX } = await import("../src/art.js");

    expect(LOADER_ART.heartTop).toMatch(/^M/);
    expect(LOADER_VIEWBOX.pulse).toBe("-4 -4 168 136");
    expect(PULSE_MIN_SIZE_PX).toBe(40);
  });

  it("exports the stylesheet, so a server can inline it", async () => {
    const { LOADER_CSS } = await import("../src/css.js");
    expect(LOADER_CSS).toContain("@keyframes ox-loader-beat");
  });

  it("defines the element class without constructing it", async () => {
    // The class is declared over an inert stand-in base on the server. It must
    // exist as a value (so `export class` resolves) and must never be `new`ed.
    const { OxLoaderElement } = await import("../src/base.js");
    expect(typeof OxLoaderElement).toBe("function");
  });
});
