/**
 * The claims this plugin makes about itself, checked against its own source.
 *
 * The plugin used to declare no network access at all, which was a strong claim
 * cheaply held. It now reaches one origin, so the claims worth checking have
 * changed shape: the domain list is narrow and exact, the *sandbox* still
 * cannot reach the network, the credential is never written into the document,
 * and no path leads to publishing — a library or a theme version.
 *
 * Each is asserted over the source rather than promised in a comment, because
 * these are the sentences that end up in a security review.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Set by `vitest.config.ts`, which is the one file that knows where it is. */
const root = process.env.PLUGIN_ROOT ?? "";
if (!root || !existsSync(join(root, "manifest.json"))) {
  throw new Error(`Expected the plugin manifest at PLUGIN_ROOT; got ${root || "nothing"}`);
}

const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8")) as {
  name: string;
  main: string;
  ui: string;
  networkAccess: { allowedDomains: string[]; devAllowedDomains?: string[]; reasoning?: string };
  permissions: string[];
};

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sources(path, out);
    else if (path.endsWith(".ts")) out.push(path);
  }
  return out;
}

/** Comments say `fetch` for good reasons; only code counts. */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const files = sources(join(root, "src"));

describe("the manifest", () => {
  it("reaches one origin in production, and it is the app", () => {
    // A wildcard would be the easy thing to write and the thing a reviewer
    // cannot check. One exact origin is a claim they can hold us to.
    expect(manifest.networkAccess.allowedDomains).toEqual(["https://app.zoblocks.design"]);
    expect(manifest.networkAccess.allowedDomains.every((d) => !d.includes("*"))).toBe(true);
  });

  it("keeps localhost in the development list only", () => {
    // In `allowedDomains` it would ship: a published plugin that may talk to
    // whatever is listening on a designer's own machine.
    expect(manifest.networkAccess.devAllowedDomains).toEqual(["http://localhost:6003"]);
    expect(manifest.networkAccess.allowedDomains).not.toContain("http://localhost:6003");
  });

  it("states why, in words a reviewer can check against the code", () => {
    const why = manifest.networkAccess.reasoning ?? "";
    expect(why).toContain("never publish");
    expect(why).toContain("clientStorage");
  });

  it("asks for no permissions", () => {
    expect(manifest.permissions).toEqual([]);
  });

  it("points at files the build actually produces", () => {
    expect(manifest.main).toBe("dist/code.js");
    expect(manifest.ui).toBe("dist/ui.html");
  });
});

describe("the code behind the declaration", () => {
  it("keeps `figma` inside the sandbox", () => {
    // The panel runs in an iframe that has no `figma` global. A reference to it
    // outside `src/sandbox` is a runtime error waiting for the one designer who
    // reaches that branch.
    for (const file of files.filter((f) => !f.includes("/sandbox/"))) {
      expect(code(file), file).not.toMatch(/\bfigma\./);
    }
  });

  it("keeps the DOM out of the sandbox", () => {
    // Symmetrically: the sandbox has no `document` and no `window`.
    for (const file of files.filter((f) => f.includes("/sandbox/"))) {
      expect(code(file), file).not.toMatch(/\bdocument\.|\bwindow\./);
    }
  });

  it("gives the sandbox no way to delete anything, or to publish", () => {
    /*
     * The pull direction writes, so "cannot write" is no longer the boundary.
     * What replaced it is narrower and still structural: `api.ts` declares no
     * removal call of any kind and nothing from Figma's library-publishing
     * surface, so both are compile errors rather than review findings.
     *
     * This is what lets the preview say "no longer in this theme" without that
     * being a threat, and what keeps a pull from changing what other files
     * inherit.
     */
    const api = code(join(root, "src/sandbox/api.ts"));
    for (const forbidden of [
      "remove(",
      "removeMode",
      "deleteAsync(key: string): Promise<void>;\n  remove",
      "publishAsync",
      "publish(",
    ]) {
      expect(api, forbidden).not.toContain(forbidden);
    }
  });

  it("cannot ask the app to publish either", () => {
    /*
     * The client is the only thing that can address the app, and every
     * address it can build is written literally in one file. A fourth endpoint
     * would have to be added here to be reachable at all.
     *
     * Matching on the URLs rather than on the word "publish": the payload has a
     * `status: "published" | "draft"` field, which is a thing being *read*, and
     * a grep that cannot tell those apart is a grep somebody will delete.
     */
    const client = code(join(root, "src/app.ts"));
    const paths = [...client.matchAll(/\/api\/v1\/[^`"'\s]*/g)].map((m) => m[0]);

    expect(paths).toHaveLength(3);
    for (const path of paths) expect(path).not.toContain("publish");

    // One write, and it is the draft. Everything else is a GET.
    const methods = [...client.matchAll(/method:\s*"([A-Z]+)"/g)].map((m) => m[1]);
    expect(methods).toEqual(["POST"]);
  });
});
