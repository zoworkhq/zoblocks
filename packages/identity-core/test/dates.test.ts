import { describe, expect, it } from "vitest";
import { isFuture, precise, resolveAge, yearsBetween } from "../src/dates.js";

const NOW = new Date("2026-08-16T09:00:00Z");

describe("precise", () => {
  it("never renders an all-numeric date", () => {
    // The whole point. 08/03/1985 is 3 August in Delhi and 8 March in Denver.
    const d = precise("1985-03-08");
    expect(d?.text).toBe("08 Mar 1985");
    expect(d?.text).not.toMatch(/^\d{2}\/\d{2}/);
  });

  it("spells the month out for speech", () => {
    expect(precise("1985-03-08")?.spoken).toBe("8 March 1985");
    expect(precise("1985-03")?.spoken).toBe("March 1985");
  });

  it("keeps the precision that was recorded", () => {
    expect(precise("1985")).toMatchObject({ precision: "year", text: "1985" });
    expect(precise("1985-03")).toMatchObject({ precision: "month", text: "Mar 1985" });
    expect(precise("1985-03-08")).toMatchObject({ precision: "day", text: "08 Mar 1985" });
    expect(precise("1985-03-08T14:30:00Z")?.precision).toBe("time");
  });

  it("pads the day to two digits so a column aligns", () => {
    expect(precise("1985-03-01")?.text).toBe("01 Mar 1985");
  });

  it("returns undefined rather than guessing at malformed input", () => {
    expect(precise(undefined)).toBeUndefined();
    expect(precise("")).toBeUndefined();
    expect(precise("not-a-date")).toBeUndefined();
    expect(precise("85-03-08")).toBeUndefined();
  });

  it("rejects an impossible month rather than rendering it", () => {
    expect(precise("1985-13-08")).toBeUndefined();
    expect(precise("1985-00-08")).toBeUndefined();
  });

  it("preserves the original value untouched", () => {
    expect(precise("1985-03-08T14:30:00+05:30")?.value).toBe("1985-03-08T14:30:00+05:30");
  });
});

describe("yearsBetween", () => {
  it("floors to whole years", () => {
    expect(yearsBetween("1985-03-08", NOW)).toBe(41);
  });

  it("does not count a birthday that has not happened yet", () => {
    expect(yearsBetween("1985-08-17", NOW)).toBe(40);
    expect(yearsBetween("1985-08-16", NOW)).toBe(41);
  });

  it("handles a year-only date", () => {
    // The fewest years 1985 allows on 16 Aug 2026; a birthday after today is 40.
    expect(yearsBetween("1985", NOW)).toBe(40);
  });

  it("returns undefined for a future date", () => {
    expect(yearsBetween("2030-01-01", NOW)).toBeUndefined();
  });

  it("returns undefined for unparseable input", () => {
    expect(yearsBetween(undefined, NOW)).toBeUndefined();
    expect(yearsBetween("rubbish", NOW)).toBeUndefined();
  });
});

describe("resolveAge", () => {
  it("uses days for a neonate", () => {
    // "0 y" on a two-week-old is a dosing hazard, and it is what every naive
    // implementation renders.
    expect(resolveAge("2026-08-10", NOW)?.text).toBe("6 d");
    expect(resolveAge("2026-08-16", NOW)?.text).toBe("0 d");
  });

  it("uses weeks between four weeks and three months", () => {
    expect(resolveAge("2026-07-01", NOW)?.text).toBe("6 wk");
  });

  it("uses months between three months and two years", () => {
    expect(resolveAge("2025-11-16", NOW)?.text).toBe("9 mo");
  });

  it("uses years from two years", () => {
    expect(resolveAge("1985-03-08", NOW)?.text).toBe("41 y");
  });

  it("freezes at age-at-death for a deceased patient", () => {
    const age = resolveAge("1961-01-04", NOW, "2024-03-12");
    expect(age?.text).toBe("63 y");
    expect(age?.atDeath).toBe(true);
  });

  it("still advances for a living patient", () => {
    expect(resolveAge("1961-01-04", NOW)?.atDeath).toBe(false);
    expect(resolveAge("1961-01-04", NOW)?.text).toBe("65 y");
  });

  it("carries the moment it was computed", () => {
    // A printed banner with no as-of date is a stale-record hazard.
    expect(resolveAge("1985-03-08", NOW)?.asOf).toBe(NOW.toISOString());
  });

  it("returns undefined without a birth date", () => {
    expect(resolveAge(undefined, NOW)).toBeUndefined();
  });

  it("returns undefined for an unparseable death date", () => {
    expect(resolveAge("1961-01-04", NOW, "nonsense")).toBeUndefined();
  });
});

describe("partial birth dates", () => {
  const at = (iso: string) => new Date(`${iso}T09:00:00Z`);

  it("does not age a month-precision date before that month begins", () => {
    // "1985-03" was read as January, so staff saw 41 in February.
    expect(yearsBetween("1985-03", at("2026-02-10"))).toBe(40);
    expect(resolveAge("1985-03", at("2026-02-10"))?.text).toBe("40 y");
  });

  it("gives a range during the birth month, and the lower bound as a number", () => {
    expect(yearsBetween("1985-03", at("2026-03-15"))).toBe(40);
    expect(resolveAge("1985-03", at("2026-03-15"))?.text).toBe("40–41 y");
    expect(resolveAge("1985-03", at("2026-04-01"))?.text).toBe("41 y");
  });

  it("gives a range for a year-only date until the year has passed", () => {
    expect(yearsBetween("1985", NOW)).toBe(40);
    expect(resolveAge("1985", NOW)?.text).toBe("40–41 y");
    expect(resolveAge("1985", at("2026-12-31"))?.text).toBe("41 y");
  });

  it("keeps a year-only child under two in months, as a range", () => {
    // Was "24320 mo": the year-only branch had no year at all.
    expect(resolveAge("2025", NOW)?.text).toBe("7–19 mo");
    expect(resolveAge("2026", NOW)?.text).toBe("0–7 mo");
  });

  it("uses months when the child might still be under two", () => {
    expect(resolveAge("2024", NOW)?.text).toBe("19–31 mo");
  });

  it("never claims a single month for a month-precision infant", () => {
    expect(resolveAge("2025-11", NOW)?.text).toBe("8–9 mo");
    expect(resolveAge("2025-11", at("2026-08-30"))?.text).toBe("9 mo");
  });

  it("uses days and weeks as ranges for a month-precision neonate", () => {
    expect(resolveAge("2026-08", NOW)?.text).toBe("0–15 d");
    expect(resolveAge("2026-07", NOW)?.text).toBe("2–6 wk");
    expect(resolveAge("2026-06", NOW)?.text).toBe("6–10 wk");
  });

  it("handles the short months", () => {
    // February 2024 has 29 days, so on 28 Feb 2026 the child may not be two.
    expect(resolveAge("2024-02", at("2026-02-28"))?.text).toBe("23–24 mo");
    expect(resolveAge("2024-02", at("2026-03-01"))?.text).toBe("2 y");
    // February 2025 has 28, so by the 28th every possible birthday has passed.
    expect(resolveAge("2025-02", at("2026-02-28"))?.text).toBe("12 mo");
  });

  it("freezes a partial date's range at death", () => {
    const age = resolveAge("1961", NOW, "2024-03-12");
    expect(age).toMatchObject({ text: "62–63 y", atDeath: true });
  });

  it("returns undefined for a partial date wholly in the future", () => {
    expect(yearsBetween("2026-09", NOW)).toBeUndefined();
    expect(resolveAge("2027", NOW)).toBeUndefined();
  });

  it("returns undefined for an impossible month rather than guessing", () => {
    expect(yearsBetween("1985-13", NOW)).toBeUndefined();
    expect(resolveAge("1985-00", NOW)).toBeUndefined();
  });
});

describe("isFuture", () => {
  it("recognises a future date", () => {
    expect(isFuture("2030-01-01", NOW)).toBe(true);
  });
  it("recognises a past date", () => {
    expect(isFuture("1985-03-08", NOW)).toBe(false);
  });
  it("is false for missing or malformed input", () => {
    expect(isFuture(undefined, NOW)).toBe(false);
    expect(isFuture("rubbish", NOW)).toBe(false);
  });
});
