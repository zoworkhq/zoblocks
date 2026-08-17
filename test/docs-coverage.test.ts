/**
 * Every catalog component is documented, and documented live.
 *
 * The docs site degrades quietly. A component with no entry in `SCENARIOS`
 * renders "Live preview coming with the next release." A component with no
 * entry in `PREVIEW` renders four state chips in the space a component should
 * occupy. A component whose props the generator could not read renders an empty
 * props table. None of the three is an error, none fails a build, and all three
 * look like a decision somebody made.
 *
 * They were not decisions. At the point this file was written six of twelve
 * components had no live preview, six had no card art, and two — Switch and
 * Tabs, the two largest APIs in the library — documented zero props, because
 * the extractor only understood `export function` and both are
 * `export const X = forwardRef(...)`. The catalog said everything was fine.
 *
 * So the assertion is coverage itself. Adding a component to the catalog now
 * fails this test until it is actually documented, which is the moment the
 * author is in a position to do it.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG } from "../apps/docs/src/lib/generated/catalog";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const read = (relative: string) => readFileSync(path.join(ROOT, relative), "utf8");

/**
 * The keys of a `Record<string, ...>` literal, read from source.
 *
 * Reading the source rather than importing the module keeps this a Node test:
 * both files are client components that pull in the whole registry, and a test
 * that has to render React to find out whether a key exists would be answering
 * a different question anyway.
 */
function recordKeys(source: string, declaration: string, open: "[" | "("): Set<string> {
  const body = source.slice(source.indexOf(declaration));
  expect(body, `${declaration} not found — has it been renamed?`).not.toHaveLength(0);

  const keys = new Set<string>();
  const pattern = new RegExp(`^ {2}"?([a-z][a-z-]*)"?: \\${open}`, "gm");
  for (const match of body.matchAll(pattern)) keys.add(match[1]!);
  return keys;
}

const previewSource = read("apps/docs/src/components/site/component-preview.tsx");
const cardSource = read("apps/docs/src/components/site/component-card.tsx");

const scenarios = recordKeys(previewSource, "const SCENARIOS", "[");
const cardArt = recordKeys(cardSource, "const PREVIEW", "(");

/**
 * Signature is the one component whose detail preview is a bespoke component
 * rather than a scenario list: it is the only page that loads Ant Design, and
 * the only way to show that a decline is recordable is to let someone record
 * one. `ComponentPreview` special-cases it by name.
 */
const CUSTOM_DETAIL_PREVIEW = new Set(["signature"]);

/**
 * Components whose detail preview is a gallery the page mounts directly,
 * rather than a scenario list inside `ComponentPreview`.
 *
 * A scenario switcher shows one state at a time, which suits a component whose
 * states are alternatives. It is the wrong shape for one whose argument is that
 * several axes are independent: those are a set, and a set shown one card at a
 * time reads as unrelated screenshots. Switch's absence reasons only make their
 * point side by side, where the word changes and the colour does not.
 *
 * Still asserted rather than exempted — the page has to actually mount the
 * gallery, or this is a component with no preview at all.
 */
const PAGE_MOUNTED_GALLERY = new Map([["switch", "SwitchGallery"]]);

const detailPageSource = read("apps/docs/src/app/components/[name]/page.tsx");

describe("every catalog component is live on the docs site", () => {
  it.each(CATALOG.map((component) => component.name))("%s has a detail preview", (name) => {
    if (CUSTOM_DETAIL_PREVIEW.has(name)) {
      expect(previewSource).toContain(`name === "${name}"`);
      return;
    }

    const gallery = PAGE_MOUNTED_GALLERY.get(name);
    if (gallery) {
      expect(detailPageSource).toContain(`component.name === "${name}"`);
      expect(detailPageSource).toContain(`<${gallery} />`);
      return;
    }

    expect(scenarios).toContain(name);
  });

  it.each(CATALOG.map((component) => component.name))("%s has card art", (name) => {
    expect(cardArt).toContain(name);
  });

  it("has no preview keyed to a component that no longer exists", () => {
    const known = new Set(CATALOG.map((component) => component.name));
    for (const name of [...scenarios, ...cardArt]) {
      expect(known, `${name} has a preview but is not in the catalog`).toContain(name);
    }
  });
});

describe("every catalog component documents its API", () => {
  /*
   * Zero props is never right for a component in this library, and it is the
   * exact shape of the extractor failure: not an error, just an empty table
   * where the contract should be. `safety-plan` is the floor at six.
   */
  it.each(CATALOG.map((component) => component.name))("%s extracted props", (name) => {
    const component = CATALOG.find((entry) => entry.name === name)!;
    expect(component.props.length).toBeGreaterThan(0);
    expect(component.exports.length).toBeGreaterThan(0);
  });

  it.each(CATALOG.map((component) => component.name))("%s has usage and guidance", (name) => {
    const component = CATALOG.find((entry) => entry.name === name)!;
    expect(component.usage.length).toBeGreaterThan(0);
    expect(component.guidance.use.length).toBeGreaterThan(0);
    expect(component.guidance.avoid.length).toBeGreaterThan(0);
  });
});
