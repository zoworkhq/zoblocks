// @vitest-environment node

/**
 * The package must be importable on a server.
 *
 * `class ZbSwitchElement extends HTMLElement` was evaluated at module scope,
 * so `import "@zoblocks/elements"` threw `ReferenceError: HTMLElement is not
 * defined` in Node. The loaders package shipped the same defect and the same
 * guard; see `packages/loaders/test/ssr.test.ts`.
 *
 * Must stay in its own file: the main suite runs in jsdom, which supplies
 * `HTMLElement` and so cannot see this class of bug.
 */

import { describe, expect, it } from "vitest";

const ENTRY_POINTS = [
  ["barrel", "../src/index.js"],
  ["switch", "../src/switch.js"],
  ["vocabulary", "../src/vocabulary.js"],
  ["stylesheet", "../src/switch-css.js"],
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

  it("defines the element class without constructing or registering it", async () => {
    const { ZbSwitchElement, SWITCH_EVENTS } = await import("../src/index.js");
    expect(typeof ZbSwitchElement).toBe("function");
    expect(SWITCH_EVENTS).toContain("zb-switch-request");
    expect(typeof customElements).toBe("undefined");
  });

  it("still exports its pure vocabulary", async () => {
    const { nextValueFor, resolveStateLabels, wordFor } = await import("../src/index.js");
    expect(nextValueFor("off")).toBe("on");
    expect(wordFor("on", resolveStateLabels(null, null))).toBeTypeOf("string");
  });
});
