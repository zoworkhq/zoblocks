/**
 * The announced strings.
 *
 * A red badge is a colour signal, and colour is never the signal in Oxygen —
 * so the tone has to reach the accessible name as a word. These tests are the
 * enforcement of that rule.
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  describeAvailability,
  describeCount,
  describeDot,
  describeTrigger,
  interpolate,
  resolveLocale,
} from "../src/index.js";

describe("interpolate", () => {
  it("substitutes named placeholders", () => {
    expect(interpolate("{count} items", { count: 3 })).toBe("3 items");
    expect(interpolate("Close {label}", { label: "Labs" })).toBe("Close Labs");
  });

  it("leaves an unknown placeholder alone rather than printing undefined", () => {
    expect(interpolate("Hello {name}", {})).toBe("Hello {name}");
  });

  it("substitutes every occurrence", () => {
    expect(interpolate("{a}-{a}", { a: "x" })).toBe("x-x");
  });
});

describe("describeCount", () => {
  it("uses the plain form with no tone", () => {
    expect(describeCount(3, undefined)).toBe("3 items");
    expect(describeCount(3, "neutral")).toBe("3 items");
  });

  it('turns a red badge into the word "critical"', () => {
    expect(describeCount(2, "critical")).toBe("2 critical");
  });

  it("names the other tones too", () => {
    expect(describeCount(4, "high")).toBe("4 abnormal");
    expect(describeCount(4, "normal")).toBe("4 normal");
  });

  it("has singular forms, because “1 items” is what an unfinished product says", () => {
    expect(describeCount(1, undefined)).toBe("1 item");
    expect(describeCount(1, "critical")).toBe("1 critical");
    expect(describeCount(1, "high")).toBe("1 abnormal");
    expect(describeCount(1, "normal")).toBe("1 normal");
  });

  it("handles zero without pretending it is singular", () => {
    expect(describeCount(0, undefined)).toBe("0 items");
  });

  it("honours an override locale", () => {
    const locale = resolveLocale({ items: "{count} résultats", itemsOne: "1 résultat" });
    expect(describeCount(5, undefined, locale)).toBe("5 résultats");
    expect(describeCount(1, undefined, locale)).toBe("1 résultat");
  });
});

describe("describeAvailability and describeDot", () => {
  it("names stale and unavailable, and stays quiet for ready", () => {
    expect(describeAvailability("stale")).toBe(DEFAULT_LOCALE.stale);
    expect(describeAvailability("unavailable")).toBe(DEFAULT_LOCALE.unavailable);
    expect(describeAvailability("ready")).toBeUndefined();
    expect(describeAvailability(undefined)).toBeUndefined();
  });

  it("names the dirty and error dots", () => {
    expect(describeDot("dirty")).toBe(DEFAULT_LOCALE.unsaved);
    expect(describeDot("error")).toBe(DEFAULT_LOCALE.error);
  });

  it("says nothing for a bare decorative dot", () => {
    // `dot: true` is a marker the host has already explained in context;
    // inventing a word for it would put a meaningless noun in the name.
    expect(describeDot(true)).toBeUndefined();
    expect(describeDot(undefined)).toBeUndefined();
  });
});

describe("describeTrigger", () => {
  it("returns undefined when there is nothing to add", () => {
    expect(describeTrigger({})).toBeUndefined();
  });

  it("joins the parts in announcement order", () => {
    expect(
      describeTrigger({ count: 2, tone: "critical", dot: "dirty", availability: "stale" }),
    ).toBe("2 critical, unsaved changes, showing cached data");
  });

  it("includes a zero count", () => {
    expect(describeTrigger({ count: 0 })).toBe("0 items");
  });

  it("carries a lone availability", () => {
    expect(describeTrigger({ availability: "unavailable" })).toBe("unavailable");
  });
});

describe("resolveLocale", () => {
  it("returns the default untouched when there are no overrides", () => {
    expect(resolveLocale()).toBe(DEFAULT_LOCALE);
  });

  it("merges partial overrides over the default", () => {
    const locale = resolveLocale({ more: "Mehr" });
    expect(locale.more).toBe("Mehr");
    expect(locale.close).toBe(DEFAULT_LOCALE.close);
  });
});
