/**
 * The claims this plugin makes about itself, checked against its own source.
 *
 * "No network access" is the phase's selling point in a security review, and a
 * selling point held only by a manifest somebody remembered to write is not one
 * worth making. Both halves are asserted here: what the manifest declares, and
 * whether the code could reach the network even if the declaration allowed it.
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
  networkAccess: { allowedDomains: string[]; reasoning?: string };
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
  it("declares no network access", () => {
    expect(manifest.networkAccess.allowedDomains).toEqual(["none"]);
  });

  it("states why, in words a reviewer can check against the code", () => {
    expect(manifest.networkAccess.reasoning).toBeTruthy();
    expect(manifest.networkAccess.reasoning).toContain("locally");
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
  it("never reaches the network", () => {
    // The sandbox has no `fetch` at all; the iframe does. A declaration is a
    // promise, and this is the part that keeps it.
    for (const file of files) {
      expect(code(file), file).not.toMatch(/\bfetch\s*\(/);
      expect(code(file), file).not.toMatch(
        /XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/,
      );
      expect(code(file), file).not.toMatch(/import\s*\(/);
    }
  });

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

  it("gives the sandbox no way to write to a file", () => {
    /*
     * `api.ts` declares only the read calls, so a write is a compile error
     * rather than something a reviewer has to notice. Phase 4 is where this
     * plugin earns the right to write, and it earns it by previewing every
     * change first.
     */
    const api = code(join(root, "src/sandbox/api.ts"));
    for (const write of ["createVariable", "setValueForMode", "setPluginData", "remove("]) {
      expect(api, write).not.toContain(write);
    }
  });
});
