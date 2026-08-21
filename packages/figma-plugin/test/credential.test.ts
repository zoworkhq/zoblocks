/**
 * Where the key lives, and what happens to a stored one that has gone stale.
 *
 * The important assertion is the one about the document: plugin data travels
 * with a file, so a token written there reaches every branch, every duplicate,
 * and every copy handed to an agency. `clientStorage` is per-user on one
 * machine, which is the only place a bearer credential belongs.
 */

import { describe, expect, it } from "vitest";
import { forgetCredential, loadCredential, saveCredential } from "../src/sandbox/credential";
import { FakeFigma } from "./fake-figma";

const credential = { origin: "https://console.example.test", token: "oxy_live_" + "a".repeat(30) };

describe("the credential store", () => {
  it("round-trips what was saved", async () => {
    const figma = new FakeFigma();
    await saveCredential(figma.clientStorage, credential);
    expect(await loadCredential(figma.clientStorage)).toEqual(credential);
  });

  it("returns nothing before anything is saved", async () => {
    expect(await loadCredential(new FakeFigma().clientStorage)).toBeUndefined();
  });

  it("forgets on request", async () => {
    const figma = new FakeFigma();
    await saveCredential(figma.clientStorage, credential);
    await forgetCredential(figma.clientStorage);
    expect(await loadCredential(figma.clientStorage)).toBeUndefined();
  });

  it("re-checks what it reads back rather than trusting it because we wrote it", async () => {
    const figma = new FakeFigma();

    // Shapes that could be there from an older version, or from a hand-edit.
    for (const stored of [
      null,
      "oxy_live_loose",
      { origin: "https://c.example" },
      { token: credential.token },
      { origin: "not-a-url", token: credential.token },
      { origin: "http://console.example.test", token: credential.token },
      { origin: credential.origin, token: "sk_live_wrong" },
    ]) {
      await figma.clientStorage.setAsync("ox.credential", stored);
      // Asking again beats sending it and reporting a 404 the designer cannot
      // interpret.
      expect(await loadCredential(figma.clientStorage), JSON.stringify(stored)).toBeUndefined();
    }
  });

  it("survives a storage read that throws", async () => {
    const storage = {
      getAsync: () => Promise.reject(new Error("quota")),
      setAsync: () => Promise.resolve(),
      deleteAsync: () => Promise.resolve(),
    };
    expect(await loadCredential(storage)).toBeUndefined();
  });

  it("never touches the document", async () => {
    const figma = new FakeFigma();
    await saveCredential(figma.clientStorage, credential);
    // `clientStorage` is not plugin data, and the counters prove no write
    // landed on the file.
    expect(figma.total).toBe(0);
  });
});
