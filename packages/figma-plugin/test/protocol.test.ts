/**
 * The narrowing at the `postMessage` boundary.
 *
 * Everything crossing between the sandbox and the panel arrives as `unknown`,
 * from a channel that is not private: Figma delivers the plugin's own messages
 * on `window.onmessage`, and so does anything else that can reach that window.
 * These two functions are the whole of the check, which is why an untested
 * `default` here would be a panel that renders whatever it is handed.
 */

import { describe, expect, it } from "vitest";
import { readPluginMessage, readUiMessage } from "../src/protocol";

describe("readPluginMessage", () => {
  it("unwraps the envelope Figma puts messages in", () => {
    expect(readPluginMessage({ pluginMessage: { type: "ready" } })).toEqual({ type: "ready" });
  });

  it("accepts a bare message too, because tests and harnesses send one", () => {
    expect(readPluginMessage({ type: "ready" })).toEqual({ type: "ready" });
  });

  it("passes the three it knows", () => {
    const inspect = { type: "inspect", collection: "Oxygen / Semantic", mode: "light" };
    expect(readPluginMessage(inspect)).toEqual(inspect);
    expect(readPluginMessage({ type: "resize", width: 400, height: 600 })).toMatchObject({
      type: "resize",
    });
  });

  it("refuses anything else", () => {
    // A shared channel, so the list of accepted types is the whole check.
    for (const bad of [
      undefined,
      null,
      "ready",
      42,
      [],
      {},
      { type: "publish" },
      { type: 7 },
      { pluginMessage: null },
      { pluginMessage: "ready" },
      { pluginMessage: { type: "report" } },
    ]) {
      expect(readPluginMessage(bad), JSON.stringify(bad ?? null)).toBeUndefined();
    }
  });
});

describe("readUiMessage", () => {
  it("passes the three the sandbox sends", () => {
    expect(
      readUiMessage({ pluginMessage: { type: "collections", collections: [] } }),
    ).toMatchObject({ type: "collections" });
    expect(readUiMessage({ type: "error", message: "no" })).toMatchObject({ type: "error" });
    expect(readUiMessage({ type: "report", report: {} })).toMatchObject({ type: "report" });
  });

  it("refuses the sandbox's own inbound types", () => {
    // `ready` travels UI → sandbox. Accepting it here would let the panel be
    // driven by an echo of its own message.
    for (const bad of [{ type: "ready" }, { type: "inspect" }, null, undefined, {}]) {
      expect(readUiMessage(bad)).toBeUndefined();
    }
  });
});
