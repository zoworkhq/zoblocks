/**
 * The glyphs the components draw, against the slots the console offers.
 *
 * These two lists live in different packages on purpose. `ICON_SLOTS` in the
 * theme package is what a customer is offered and what the schema will accept;
 * the `ox-icon--*` classes in `copilot-react` are what the browser actually
 * draws. Neither package depends on the other — a component asking the theme
 * package what it may render would be the dependency pointing the wrong way —
 * so nothing but this file would notice them drifting apart.
 *
 * The failure it catches is quiet and total: a slot the console offers with no
 * class behind it accepts an upload, stores it, serves it, and changes nothing
 * on screen. Everything reports success and the glyph never moves.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ICON_SLOTS, REPLACEABLE_SLOTS } from "@oxygenui-design/theme";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

const icons = readFileSync(path.join(root, "packages/copilot-react/src/icons.tsx"), "utf8");
const css = readFileSync(path.join(root, "packages/copilot-react/src/icons.css"), "utf8");

/** `icon("send")` — the one place a component names its slot. */
const drawn = [...icons.matchAll(/\bicon\("([a-z0-9-]+)"\)/g)].map((m) => m[1]!).sort();

describe("every offered slot is a glyph somebody can actually replace", () => {
  it("draws exactly the slots the registry says are replaceable", () => {
    expect(drawn).toEqual([...REPLACEABLE_SLOTS].sort());
  });

  it("has a mask rule for every slot it draws", () => {
    const missing = drawn.filter((slot) => !css.includes(`.ox-icon[data-icon="${slot}"] {`));
    expect(missing).toEqual([]);
  });

  /**
   * The override must be the *first* value in the chain, not the fallback.
   *
   * `var(--ox-icon-send, <built-in>)` takes the customer's glyph when set and
   * the shipped one otherwise. Written the other way round it would compile,
   * render correctly in every screenshot, and silently ignore every upload.
   */
  it("reads the customer property before the built-in, in every rule", () => {
    for (const slot of drawn) {
      // A literal rather than a regex: the thing being protected is the exact
      // order of two values, and a pattern loose enough to be readable here is
      // loose enough to match the broken form too.
      const expected = `mask-image: var(--ox-icon-${slot}, var(--ox-icon-${slot}--builtin));`;
      expect(css.includes(expected), slot).toBe(true);
    }
  });

  it("ships a built-in for every slot, so an un-themed host still has icons", () => {
    for (const slot of drawn) {
      expect(css.includes(`--ox-icon-${slot}--builtin: url("data:image/svg+xml,`), slot).toBe(true);
    }
  });

  /**
   * A data URI without `xmlns` is not decoded as an image at all — the mask
   * resolves to nothing and every glyph becomes a blank square. It is invisible
   * in code review and total at runtime.
   */
  it("declares the SVG namespace in every built-in", () => {
    const uris = [
      ...css.matchAll(/--ox-icon-[a-z0-9-]+--builtin: url\("data:image\/svg\+xml,([^"]+)"\)/g),
    ];
    expect(uris.length).toBe(drawn.length);
    for (const [, uri] of uris) {
      expect(uri).toContain("xmlns=");
    }
  });
});

describe("the locked marks are not offered", () => {
  /**
   * The switch's `unknown` mark is that component's entire clinical
   * contribution: a binary control cannot tell "no" from "nobody asked". These
   * appear in the registry so the console can show them refused with a reason
   * — showing nothing would make the list look arbitrary — but they must never
   * reach the schema's accepted set.
   */
  it("keeps every locked slot out of what a customer may set", () => {
    const locked = ICON_SLOTS.filter((s) => s.locked).map((s) => s.slot);
    expect(locked.length).toBeGreaterThan(0);
    for (const slot of locked) {
      expect(REPLACEABLE_SLOTS).not.toContain(slot);
    }
  });

  it("gives every locked slot a reason, because a lock without one is an oversight", () => {
    for (const slot of ICON_SLOTS.filter((s) => s.locked)) {
      expect(slot.locked!.length, slot.slot).toBeGreaterThan(40);
    }
  });
});
