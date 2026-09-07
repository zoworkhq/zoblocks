/**
 * The component token surface is a public contract.
 *
 * Customers style against these names and a theme bridge writes them, so the
 * manifest is committed and a change to it is a reviewable diff. These tests
 * hold the two properties the rest of the architecture depends on:
 *
 *   every clinical token is marked unbridgeable, and
 *   every declaration terminates somewhere real.
 *
 * The first is what stops a host framework's `colorError` — an arbitrary brand
 * colour that has passed no contrast gate and carries no hue-separation
 * guarantee — from replacing `status.critical`.
 */

import { describe, expect, it } from "vitest";
import {
  BRIDGEABLE,
  NOT_BRIDGEABLE,
  SURFACE_COMPONENTS,
  TOKEN_SURFACE,
  surfaceEntry,
  surfaceFor,
} from "@zoblocks/tokens/surface";

describe("shape", () => {
  it("covers every component that has an override surface", () => {
    expect(SURFACE_COMPONENTS.length).toBeGreaterThan(15);
    for (const expected of ["tabs", "switch", "badge", "avatar", "care-timeline", "patient-chip"]) {
      expect(SURFACE_COMPONENTS, expected).toContain(expected);
    }
  });

  it("names no component after a fragment of a longer name", () => {
    // `--zb-care-timeline-divider` grouped as "care" and `--zb-av-size` as "av"
    // when the component was derived from the token name rather than the
    // selector it is declared in. Both are real tokens; neither is a component.
    for (const bad of ["care", "av", "sw", "patient"]) {
      expect(SURFACE_COMPONENTS, bad).not.toContain(bad);
    }
  });

  it("gives every entry a component, a source and a kind", () => {
    for (const e of TOKEN_SURFACE) {
      expect(e.name, e.name).toMatch(/^--zb-[a-z0-9-]+$/);
      expect(e.component, e.name).toBeTruthy();
      expect(e.source, e.name).toBeTruthy();
      expect(e.kind, e.name).toBeTruthy();
    }
  });

  it("has no duplicate names — one declaration is the surface", () => {
    const names = TOKEN_SURFACE.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("partitions cleanly into bridgeable and not", () => {
    expect(BRIDGEABLE.length + NOT_BRIDGEABLE.length).toBe(TOKEN_SURFACE.length);
    expect(BRIDGEABLE.filter((n) => NOT_BRIDGEABLE.includes(n))).toEqual([]);
  });
});

describe("clinical tokens are not bridgeable", () => {
  it("marks every token resolving to status or a flag", () => {
    const leaked = TOKEN_SURFACE.filter(
      (e) => e.bridgeable && e.semantic && /^--zb-(status|flag)-/.test(e.semantic),
    );
    expect(leaked.map((e) => `${e.name} → ${e.semantic}`)).toEqual([]);
  });

  it("finds the ones that matter by name", () => {
    for (const name of ["--zb-badge-critical-bg", "--zb-tabs-critical", "--zb-alert-critical-fg"]) {
      const entry = surfaceEntry(name);
      expect(entry, name).toBeDefined();
      expect(entry?.bridgeable, name).toBe(false);
    }
  });

  it("does not over-reach — brand chrome stays bridgeable", () => {
    for (const name of ["--zb-tabs-accent", "--zb-tabs-surface", "--zb-copilot-accent"]) {
      const entry = surfaceEntry(name);
      expect(entry, name).toBeDefined();
      expect(entry?.bridgeable, name).toBe(true);
    }
  });

  it("leaves a meaningful number of tokens on each side", () => {
    // A rule that marked everything, or nothing, would pass the checks above
    // and be useless.
    expect(NOT_BRIDGEABLE.length).toBeGreaterThan(20);
    expect(BRIDGEABLE.length).toBeGreaterThan(100);
  });
});

describe("declarations terminate in a literal", () => {
  /**
   * `fallback` means the strongest thing it can mean: the chain reaches a
   * literal without the Zoblocks stylesheet being loaded at all. Resolution is
   * transitive, so `--zb-tabs-indicator: var(--zb-tabs-accent)` counts — the
   * accent it points at ends in `#059478`.
   *
   * Seven timeline tokens failed this when the check was introduced. Each
   * chained to a semantic token that is real and always defined *when the
   * token stylesheet is present*, and resolved to nothing when it was not, so
   * a component dropped into a bare page lost its rails and node borders.
   * All seven now carry the light-theme literal they already resolved to.
   */
  it("every component token reaches a literal", () => {
    const orphans = TOKEN_SURFACE.filter((e) => !e.fallback).map((e) => `${e.name} (${e.source})`);
    expect(orphans).toEqual([]);
  });
});

describe("framework fallbacks", () => {
  it("records the host variables already present in a chain", () => {
    const accent = surfaceEntry("--zb-tabs-accent");
    expect(accent?.frameworks).toContain("--ant-color-primary");
  });

  /**
   * A standing question rather than a failure. These tokens are unbridgeable —
   * a JavaScript bridge may not write them — yet their CSS chain already falls
   * through to antd's semantic colours when no Zoblocks token is present.
   *
   * That is defensible for a tab badge and wrong as a general rule, and it is
   * the open decision in §3.5 of the architecture report. The test pins the
   * current count so the number cannot grow silently while the decision is
   * outstanding.
   */
  it("pins how many clinical tokens still fall through to a framework colour", () => {
    const conflicted = TOKEN_SURFACE.filter((e) => !e.bridgeable && e.frameworks.length > 0);
    expect(conflicted.length).toBe(17);
  });
});

describe("lookup helpers", () => {
  it("finds an entry by name", () => {
    expect(surfaceEntry("--zb-tabs-accent")?.component).toBe("tabs");
    expect(surfaceEntry("--zb-nope")).toBeUndefined();
  });

  it("returns every token for one component", () => {
    const tabs = surfaceFor("tabs");
    expect(tabs.length).toBeGreaterThan(30);
    expect(tabs.every((e) => e.name.startsWith("--zb-tabs-"))).toBe(true);
  });
});
