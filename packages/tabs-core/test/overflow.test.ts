/**
 * Overflow arithmetic.
 *
 * The oscillation bug this design exists to prevent — hide with CSS, measure
 * zero, un-hide, repeat — is not reachable from here by construction, because
 * `fitTabs` never reads the DOM. What these tests protect is the promotion
 * rule: the selected tab must survive every fit, or a user loses their place
 * the moment the window narrows.
 */

import { describe, expect, it } from "vitest";
import { fitTabs, nudgeDistance, scrollEdges, shouldCollapse } from "../src/index.js";

describe("fitTabs", () => {
  it("keeps everything when it fits, and reserves nothing", () => {
    const result = fitTabs({ widths: [100, 100, 100], available: 400, gap: 8 });
    expect(result.visible).toEqual([0, 1, 2]);
    expect(result.overflow).toEqual([]);
  });

  it("counts the gaps, not just the widths", () => {
    // 3×100 = 300 fits in 310 on width alone, but 2 gaps of 20 push it over.
    const result = fitTabs({ widths: [100, 100, 100], available: 310, gap: 20 });
    expect(result.overflow.length).toBeGreaterThan(0);
  });

  it("moves the tail into the menu", () => {
    const result = fitTabs({ widths: [100, 100, 100, 100], available: 260, gap: 0, reserve: 60 });
    expect(result.visible).toEqual([0, 1]);
    expect(result.overflow).toEqual([2, 3]);
  });

  it("keeps the pinned tab visible even when it is last", () => {
    const result = fitTabs({
      widths: [100, 100, 100, 100],
      available: 260,
      gap: 0,
      reserve: 60,
      pinned: 3,
    });
    expect(result.visible).toContain(3);
    expect(result.overflow).not.toContain(3);
  });

  it("keeps the visible set in document order after promoting", () => {
    const result = fitTabs({
      widths: [100, 100, 100, 100],
      available: 260,
      gap: 0,
      reserve: 60,
      pinned: 3,
    });
    // Membership changes; order never does. A strip that reshuffles is worse
    // than one that hides.
    expect([...result.visible].sort((a, b) => a - b)).toEqual(result.visible);
  });

  it("handles an empty list", () => {
    expect(fitTabs({ widths: [], available: 500 })).toEqual({ visible: [], overflow: [] });
  });

  it("hides everything but the pinned tab when there is almost no room", () => {
    const result = fitTabs({ widths: [200, 200, 200], available: 120, reserve: 60, pinned: 1 });
    expect(result.visible).toEqual([1]);
    expect(result.overflow).toEqual([0, 2]);
  });

  it("survives a pinned index that is out of range", () => {
    const result = fitTabs({ widths: [100, 100], available: 120, reserve: 40, pinned: 99 });
    expect(result.visible.concat(result.overflow).sort()).toEqual([0, 1]);
  });

  it("partitions completely — every index appears exactly once", () => {
    const widths = [80, 120, 60, 200, 90, 140];
    const result = fitTabs({ widths, available: 300, gap: 8, reserve: 70, pinned: 4 });
    const all = [...result.visible, ...result.overflow].sort((a, b) => a - b);
    expect(all).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("scrollEdges", () => {
  it("reports both edges when there is nothing to scroll", () => {
    expect(scrollEdges(0, 300, 300)).toEqual({ atStart: true, atEnd: true });
  });

  it("reports the start edge at rest", () => {
    expect(scrollEdges(0, 900, 300)).toEqual({ atStart: true, atEnd: false });
  });

  it("reports the end edge when fully scrolled", () => {
    expect(scrollEdges(600, 900, 300)).toEqual({ atStart: false, atEnd: true });
  });

  it("reports neither in the middle", () => {
    expect(scrollEdges(300, 900, 300)).toEqual({ atStart: false, atEnd: false });
  });

  it("treats RTL's negative scrollLeft as a distance", () => {
    // Chrome and Firefox both report a negative offset in RTL. Taking it as a
    // coordinate would leave the fade permanently stuck on.
    expect(scrollEdges(-600, 900, 300)).toEqual({ atStart: false, atEnd: true });
    expect(scrollEdges(-300, 900, 300)).toEqual({ atStart: false, atEnd: false });
  });

  it("absorbs sub-pixel slack at both ends", () => {
    expect(scrollEdges(0.4, 900, 300).atStart).toBe(true);
    expect(scrollEdges(599.6, 900, 300).atEnd).toBe(true);
  });
});

describe("nudgeDistance", () => {
  it("moves most of a page, keeping the edge tab as an anchor", () => {
    expect(nudgeDistance(300, 1)).toBeCloseTo(210);
    expect(nudgeDistance(300, -1)).toBeCloseTo(-210);
  });

  it("inverts in RTL", () => {
    expect(nudgeDistance(300, 1, true)).toBeCloseTo(-210);
  });
});

describe("shouldCollapse", () => {
  it("collapses a narrow container", () => {
    expect(shouldCollapse(320, 6)).toBe(true);
  });

  it("leaves a wide container alone", () => {
    expect(shouldCollapse(900, 6)).toBe(false);
  });

  it("never collapses two tabs — a two-up switch fits anywhere", () => {
    expect(shouldCollapse(320, 2)).toBe(false);
  });

  it("ignores an unmeasured container rather than guessing", () => {
    expect(shouldCollapse(0, 6)).toBe(false);
  });

  it("takes a custom threshold", () => {
    expect(shouldCollapse(500, 6, 600)).toBe(true);
  });
});

describe("fitTabs with an incomplete width map", () => {
  // The cache is invalidated when the tab set changes, so there is a window
  // where it is shorter than the list. Treating a missing width as zero keeps
  // the strip usable instead of throwing arithmetic at NaN.
  it("treats a missing width as zero rather than producing NaN", () => {
    const widths = new Array<number>(4);
    widths[0] = 100;
    const result = fitTabs({ widths, available: 260, gap: 0, reserve: 60 });
    expect(result.visible.concat(result.overflow).sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it("keeps an unmeasured tab in the partition when the strip overflows", () => {
    const widths = new Array<number>(4);
    widths[0] = 200;
    widths[1] = 200;
    widths[3] = 200;
    const result = fitTabs({ widths, available: 220, gap: 0, reserve: 60 });
    // Index 2 has no measured width. It must land in one set or the other —
    // a tab that is in neither has silently stopped existing.
    expect(result.visible.concat(result.overflow).sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it("survives a pinned index with no measured width", () => {
    const widths = new Array<number>(3);
    widths[0] = 400;
    widths[1] = 400;
    const result = fitTabs({ widths, available: 200, reserve: 40, pinned: 2 });
    expect(result.visible).toContain(2);
  });
});
