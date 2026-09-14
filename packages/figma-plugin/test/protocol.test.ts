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
import { readPluginMessage, readUiEvent, readUiMessage } from "../src/protocol";

describe("readPluginMessage", () => {
  it("unwraps the envelope Figma puts messages in", () => {
    expect(readPluginMessage({ pluginMessage: { type: "ready" } })).toEqual({ type: "ready" });
  });

  it("accepts a bare message too, because tests and harnesses send one", () => {
    expect(readPluginMessage({ type: "ready" })).toEqual({ type: "ready" });
  });

  it("passes the three it knows", () => {
    const inspect = { type: "inspect", collection: "ZoBlocks / Semantic", mode: "light" };
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

  /** `Math.max(380, NaN)` is NaN, and Figma is then asked for a NaN-wide panel. */
  it("refuses a resize that is not two finite numbers", () => {
    for (const bad of [
      { type: "resize" },
      { type: "resize", width: "400", height: 600 },
      { type: "resize", width: 400, height: Number.NaN },
      { type: "resize", width: Number.POSITIVE_INFINITY, height: 600 },
    ]) {
      expect(readPluginMessage(bad), String(bad.width)).toBeUndefined();
    }
  });

  it("refuses a connect whose credential is not two strings", () => {
    const token = "zb_live_" + "a".repeat(30);
    expect(
      readPluginMessage({ type: "connect", credential: { origin: "https://a.test", token } }),
    ).toMatchObject({ type: "connect" });
    for (const bad of [
      { type: "connect" },
      { type: "connect", credential: null },
      { type: "connect", credential: { origin: "https://a.test" } },
      { type: "connect", credential: { origin: 7, token } },
    ]) {
      expect(readPluginMessage(bad), JSON.stringify(bad)).toBeUndefined();
    }
  });
});

describe("readUiMessage", () => {
  it("passes the three the sandbox sends", () => {
    expect(
      readUiMessage({ pluginMessage: { type: "collections", collections: [] } }),
    ).toMatchObject({ type: "collections" });
    expect(readUiMessage({ pluginMessage: { type: "error", message: "no" } })).toMatchObject({
      type: "error",
    });
    expect(readUiMessage({ pluginMessage: { type: "report", report: {} } })).toMatchObject({
      type: "report",
    });
  });

  it("refuses the sandbox's own inbound types", () => {
    // `ready` travels UI → sandbox. Accepting it here would let the panel be
    // driven by an echo of its own message.
    for (const bad of [{ type: "ready" }, { type: "inspect" }, null, undefined, {}]) {
      expect(readUiMessage(bad)).toBeUndefined();
    }
  });

  /**
   * Figma always wraps what the sandbox posts. A bare `{ type: "standing" }`
   * came from something else, and it carries a credential the panel spends.
   */
  it("refuses a bare message without the envelope", () => {
    expect(readUiMessage({ type: "standing", standing: {} })).toBeUndefined();
    expect(readUiMessage({ type: "error", message: "no" })).toBeUndefined();
  });
});

describe("readUiEvent", () => {
  const host = {};
  const standing = { pluginMessage: { type: "standing", standing: {} } };

  it("accepts a wrapped message from the host window", () => {
    expect(readUiEvent({ source: host, data: standing }, host)).toMatchObject({
      type: "standing",
    });
  });

  it("refuses the same message from any other frame", () => {
    expect(readUiEvent({ source: {}, data: standing }, host)).toBeUndefined();
    expect(readUiEvent({ source: null, data: standing }, host)).toBeUndefined();
  });
});
