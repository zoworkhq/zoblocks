/**
 * Exactly one rail item is ever the current page.
 *
 * `startsWith` alone lit every ancestor: on `/market/tokens`, both Catalogue
 * (`/market`) and Access tokens claimed to be current. Two highlighted entries
 * read the same as none — the reader stops trusting the highlight rather than
 * puzzling out which is right.
 *
 * `/themes` carried a hand-written exception for exactly this, which is the
 * shape of a rule that wants stating once rather than per section.
 */

import { describe, expect, it } from "vitest";
import { currentHref } from "@/components/Rail";
import { ALL_CAPABILITIES, capabilitiesFor } from "@/lib/roles";

const RAIL = [
  "/themes",
  "/themes/clinical/brand",
  "/themes/clinical/tokens",
  "/playground",
  "/market",
  "/market/purchases",
  "/market/tokens",
  "/frameworks",
  "/members",
  "/settings",
];

describe("which rail item is current", () => {
  it("picks the deepest match, never an ancestor as well", () => {
    expect(currentHref("/market/tokens", RAIL)).toBe("/market/tokens");
    expect(currentHref("/market/purchases", RAIL)).toBe("/market/purchases");
    expect(currentHref("/themes/clinical/brand", RAIL)).toBe("/themes/clinical/brand");
  });

  it("marks a section root current only on the root itself", () => {
    expect(currentHref("/market", RAIL)).toBe("/market");
    // The old special case for `/themes`, now falling out of the general rule.
    expect(currentHref("/themes", RAIL)).toBe("/themes");
  });

  it("falls back to the nearest ancestor for a screen with no rail entry", () => {
    // `/market/empty-state-system` is a catalogue item; Catalogue is where the
    // reader came from and where the highlight belongs.
    expect(currentHref("/market/empty-state-system", RAIL)).toBe("/market");
    expect(currentHref("/themes/clinical/history", RAIL)).toBe("/themes");
  });

  it("marks nothing current off the rail entirely", () => {
    expect(currentHref("/account", RAIL)).toBeUndefined();
    expect(currentHref("/", RAIL)).toBeUndefined();
  });

  it("never matches a sibling that merely shares a prefix", () => {
    // `/market-analytics` is not inside `/market`, and a bare `startsWith`
    // would have said it was.
    expect(currentHref("/market-analytics", RAIL)).toBeUndefined();
  });

  it("returns exactly one answer for every path a rail item names", () => {
    for (const href of RAIL) expect(currentHref(href, RAIL), href).toBe(href);
  });
});

describe("the capability fraction on the members table", () => {
  it("counts against every capability there is, not a number somebody typed", () => {
    // The screen read "13 of 8" because the denominator was written in when
    // there were eight, and capabilities kept being added.
    expect(ALL_CAPABILITIES.length).toBeGreaterThanOrEqual(capabilitiesFor("admin").length);
    expect(capabilitiesFor("admin").length).toBe(ALL_CAPABILITIES.length);
  });

  it("gives every role a fraction that is a fraction", () => {
    for (const role of ["admin", "designer", "developer", "viewer"] as const) {
      expect(capabilitiesFor(role).length, role).toBeLessThanOrEqual(ALL_CAPABILITIES.length);
    }
  });

  it("has no duplicates, so the denominator is a count of distinct things", () => {
    expect(new Set(ALL_CAPABILITIES).size).toBe(ALL_CAPABILITIES.length);
  });
});
