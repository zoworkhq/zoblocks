/**
 * The app client, and what it makes of a refusal.
 *
 * The happy path is three lines of `fetch`. What earns tests is the other side:
 * a designer inside Figma cannot open devtools, read a status code, or tell an
 * expired key from a laptop on a train. Every one of those has to arrive as a
 * different sentence, or all of them arrive as "something went wrong" and none
 * of them gets fixed.
 */

import { describe, expect, it } from "vitest";
import { appApi, readOrigin, readToken, type Fetcher } from "../src/app";

const credential = { origin: "https://app.example.test", token: "oxy_live_" + "x".repeat(30) };

function stub(
  responses: { status: number; body?: unknown; text?: string }[],
  seen: { url: string; init?: RequestInit }[] = [],
): { fetcher: Fetcher; seen: typeof seen } {
  let i = 0;
  const fetcher: Fetcher = (url, init) => {
    seen.push({ url, ...(init ? { init } : {}) });
    const next = responses[Math.min(i++, responses.length - 1)]!;
    return Promise.resolve({
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      json: () =>
        next.text !== undefined
          ? Promise.reject(new SyntaxError("not json"))
          : Promise.resolve(next.body),
    } as Response);
  };
  return { fetcher, seen };
}

describe("what it sends", () => {
  it("carries the key on every call and never in the URL", async () => {
    const { fetcher, seen } = stub([{ status: 200, body: { themes: [] } }]);
    await appApi(fetcher, credential).themes();

    expect(seen[0]!.url).toBe("https://app.example.test/api/v1/themes");
    expect(seen[0]!.url).not.toContain("oxy_live_");
    expect((seen[0]!.init?.headers as Record<string, string>).authorization).toBe(
      `Bearer ${credential.token}`,
    );
  });

  it("escapes a slug rather than pasting it into a path", async () => {
    const { fetcher, seen } = stub([{ status: 404, body: {} }]);
    await appApi(fetcher, credential).resolved("../../admin");
    expect(seen[0]!.url).toContain("%2F");
    expect(seen[0]!.url).not.toContain("/../");
  });

  it("asks for a version only when there is one", async () => {
    const { fetcher, seen } = stub([{ status: 200, body: {} }]);
    const api = appApi(fetcher, credential);
    await api.resolved("clinical");
    await api.resolved("clinical", 6);
    expect(seen[0]!.url).not.toContain("version");
    expect(seen[1]!.url).toContain("version=6");
  });

  it("sends one colour to propose, and calls POST", async () => {
    const { fetcher, seen } = stub([{ status: 201, body: { slug: "a", steps: 11, url: "u" } }]);
    await appApi(fetcher, credential).propose("clinical", "#1d63c9");

    expect(seen[0]!.init?.method).toBe("POST");
    expect(seen[0]!.init?.body).toBe(JSON.stringify({ anchor: "#1d63c9" }));
  });
});

describe("what it makes of a refusal", () => {
  it("passes the app's own words through when there are any", async () => {
    const { fetcher } = stub([
      { status: 422, body: { error: "1 problem(s) with that ramp.", detail: ["2.98:1"] } },
    ]);
    const result = await appApi(fetcher, credential).propose("clinical", "#0f766e");

    expect(result).toMatchObject({
      ok: false,
      status: 422,
      error: "1 problem(s) with that ramp.",
      detail: ["2.98:1"],
    });
  });

  it("says what to do about a 401 rather than repeating the number", async () => {
    const { fetcher } = stub([{ status: 401, body: {} }]);
    const result = await appApi(fetcher, credential).themes();
    expect(result.ok).toBe(false);
    // A designer inside Figma cannot see a status code.
    if (!result.ok) expect(result.error).toContain("Paste a Figma key");
  });

  it("does not promise a 404 means the theme is gone", async () => {
    const { fetcher } = stub([{ status: 404, body: {} }]);
    const result = await appApi(fetcher, credential).resolved("clinical");
    // It could equally be a key that does not reach it, and guessing wrong
    // sends somebody hunting for a theme that is right there.
    if (!result.ok) expect(result.error).toContain("does not reach");
  });

  it("survives a proxy that answers with HTML", async () => {
    const { fetcher } = stub([{ status: 502, text: "<html>Bad gateway" }]);
    const result = await appApi(fetcher, credential).themes();
    if (!result.ok) expect(result.error).toContain("502");
  });

  it("names the address when the network is the problem", async () => {
    const fetcher: Fetcher = () => Promise.reject(new TypeError("Failed to fetch"));
    const result = await appApi(fetcher, credential).themes();
    // The manifest allows one domain, so the two causes are an offline laptop
    // and an app origin that is not the allowed one. Both need the address.
    if (!result.ok) expect(result.error).toContain("https://app.example.test");
  });

  it("reports a 200 that is not JSON as such", async () => {
    const { fetcher } = stub([{ status: 200, text: "<html>" }]);
    const result = await appApi(fetcher, credential).themes();
    if (!result.ok) expect(result.error).toContain("not JSON");
  });
});

describe("what a designer may type", () => {
  it("accepts an origin and drops what is not one", () => {
    expect(readOrigin("https://app.oxygenui.design")).toBe("https://app.oxygenui.design");
    expect(readOrigin("  https://app.oxygenui.design/  ")).toBe("https://app.oxygenui.design");
    expect(readOrigin("http://localhost:6003")).toBe("http://localhost:6003");
  });

  it("refuses a path, so a pasted deep link is a correction not a 404", () => {
    expect(readOrigin("https://app.oxygenui.design/themes/clinical")).toBeUndefined();
  });

  it("refuses plaintext http anywhere but localhost", () => {
    // A bearer token over http is the token given away.
    expect(readOrigin("http://app.oxygenui.design")).toBeUndefined();
  });

  it("refuses nonsense", () => {
    for (const bad of ["", "   ", "app.oxygenui.design", "javascript:alert(1)"]) {
      expect(readOrigin(bad), bad).toBeUndefined();
    }
  });

  it("checks the token's prefix before spending a round trip on it", () => {
    expect(readToken(` ${credential.token} `)).toBe(credential.token);
    for (const bad of [
      "",
      "oxy_live_short",
      "sk_live_" + "x".repeat(30),
      credential.token + " x",
    ]) {
      expect(readToken(bad), bad).toBeUndefined();
    }
  });
});
