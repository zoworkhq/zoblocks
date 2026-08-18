/**
 * Every registry stylesheet reaches the docs site.
 *
 * A component whose CSS is not imported renders perfectly and looks like
 * nothing. Axe passes — styling is not its subject. The unit suite passes —
 * jsdom applies no CSS at all. The build passes, the preview mounts, and the
 * page shows a chronology with no rail on it.
 *
 * That is not hypothetical: `timeline.css` was written, wired into the registry
 * item, concatenated into the published package, and never imported here, so
 * both timeline pages shipped unstyled for a full session. The only thing that
 * caught it was a browser test asserting a computed grid — which is a long way
 * to travel to discover a missing line in a config file.
 *
 * So the assertion is the wiring itself. A new stylesheet under
 * `registry/oxygen/lib/` now fails this test until the docs site loads it,
 * which is the moment the author is in a position to do something about it.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIB = path.join(ROOT, "registry", "oxygen", "lib");

const globals = readFileSync(path.join(ROOT, "apps/docs/src/app/globals.css"), "utf8");
const reactEmitter = readFileSync(path.join(ROOT, "scripts/gen/emit/react-package.ts"), "utf8");
const namespaces = readFileSync(path.join(ROOT, "test/css-namespace.test.ts"), "utf8");

const sheets = readdirSync(LIB)
  .filter((file) => file.endsWith(".css"))
  .sort();

describe("registry stylesheets are wired everywhere they have to be", () => {
  it("finds the stylesheets", () => {
    expect(sheets.length).toBeGreaterThan(0);
  });

  it.each(sheets)("%s is imported by the docs site", (sheet) => {
    // Imported from the registry rather than copied, so the previews render the
    // same file a customer installs.
    expect(
      globals,
      `add an @import for registry/oxygen/lib/${sheet} to apps/docs/src/app/globals.css`,
    ).toContain(`registry/oxygen/lib/${sheet}`);
  });

  it.each(sheets)("%s is emitted into the React package", (sheet) => {
    expect(
      reactEmitter,
      `add lib/${sheet} to the stylesheet list in scripts/gen/emit/react-package.ts, or a consumer installing from npm gets an unstyled component`,
    ).toContain(`lib/${sheet}`);
  });

  it.each(sheets)("%s has an owner in the namespace check", (sheet) => {
    // Two components must not claim the same class name, and a sheet nobody
    // owns is a sheet nobody checks.
    const owned = sheet.replace(/\.css$/, "");
    expect(
      namespaces,
      `add packages/react/src/styles/${owned}.css to SHEETS in test/css-namespace.test.ts`,
    ).toContain(`styles/${owned}.css`);
  });
});
