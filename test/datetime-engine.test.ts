/**
 * The temporal engine, tested over generated inputs rather than examples.
 *
 * Temporal components fail on dates nobody thought to type, so the weight here
 * is on properties and sweeps: every date for two centuries, every transition
 * in the platform's own IANA database, every month boundary. An example suite
 * for this module would pass and prove very little.
 *
 * Four claims the suite exists to hold:
 *
 *   1. Calendar arithmetic is exact at any distance and clamps rather than
 *      rolling over.
 *   2. Parsing rejects the ambiguous instead of guessing.
 *   3. The session triple derives one member and says which.
 *   4. Zone classification tells apart the three cases a wall clock has —
 *      once, twice, and never — which is the part an offset probe cannot do.
 */

import { describe, expect, it } from "vitest";
import {
  expandRule,
  keptOccurrences,
  toExDate,
  toRRule,
  type RecurrenceRule,
} from "@/lib/zoblocks-recurrence";
import {
  addBusinessDays,
  addCalendarDays,
  addCalendarMonths,
  ageOn,
  bandFor,
  buildMonthGrid,
  classifyLocalTime,
  compareDates,
  daysInMonth,
  describeAgeLabel,
  describeRelativeDay,
  describeZoneShift,
  formatClockTime,
  formatDuration,
  formatPlainDate,
  fromEpochDay,
  fromIsoDate,
  isBusinessDay,
  isLeapYear,
  isValidDate,
  minutesOfTime,
  parseClockTime,
  parseDateDigits,
  plainDate,
  plainTime,
  sessionFrom,
  timeFromMinutes,
  toEpochDay,
  toIsoDate,
  weekdayOf,
  withSessionDuration,
  withSessionEnd,
  withSessionStart,
  zoneOffsetMinutes,
  type ZbDate,
} from "../registry/zoblocks/lib/datetime";

/** Every date from 1900 to 2100 — about 73,000 of them. */
function* everyDate(fromYear = 1900, toYear = 2100): Generator<ZbDate> {
  for (let y = fromYear; y <= toYear; y += 1) {
    for (let m = 1; m <= 12; m += 1) {
      for (let d = 1, last = daysInMonth(y, m); d <= last; d += 1) yield plainDate(y, m, d);
    }
  }
}

describe("calendar arithmetic", () => {
  it("round-trips every date between 1900 and 2100 through the epoch", () => {
    let count = 0;
    for (const date of everyDate()) {
      const back = fromEpochDay(toEpochDay(date));
      if (back.y !== date.y || back.m !== date.m || back.d !== date.d) {
        throw new Error(`round trip failed at ${formatPlainDate(date, "iso")}`);
      }
      count += 1;
    }
    expect(count).toBeGreaterThan(73_000);
  });

  it("gives consecutive dates consecutive day numbers", () => {
    let previous = toEpochDay(plainDate(1900, 1, 1));
    for (const date of everyDate(1900, 2100)) {
      const current = toEpochDay(date);
      if (current !== previous && current !== previous + 1) {
        throw new Error(`gap before ${formatPlainDate(date, "iso")}`);
      }
      previous = current;
    }
  });

  it("applies the full Gregorian leap rule, not a modulo four", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2100)).toBe(false); // the one everybody gets wrong
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2400)).toBe(true);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(isValidDate(2100, 2, 29)).toBe(false);
    expect(isValidDate(2024, 2, 29)).toBe(true);
  });

  it("clamps a month step instead of rolling into the next month", () => {
    // Rolling over is how a monthly depot injection silently moves to the
    // wrong month and stays there for the rest of the series.
    for (const [from, expected] of [
      [plainDate(2026, 1, 31), "2026-02-28"],
      [plainDate(2024, 1, 31), "2024-02-29"],
      [plainDate(2026, 3, 31), "2026-04-30"],
      [plainDate(2026, 5, 31), "2026-06-30"],
    ] as const) {
      expect(formatPlainDate(addCalendarMonths(from, 1), "iso")).toBe(expected);
    }
  });

  it("never leaves a month step on an impossible day", () => {
    for (let m = 1; m <= 12; m += 1) {
      for (let step = -24; step <= 24; step += 1) {
        const result = addCalendarMonths(plainDate(2026, m, 31), step);
        expect(isValidDate(result.y, result.m, result.d)).toBe(true);
      }
    }
  });

  it("agrees with the platform on the weekday for every date it is asked", () => {
    for (const date of everyDate(2020, 2030)) {
      const native = new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay();
      expect(weekdayOf(date)).toBe(native);
    }
  });

  it("adds and subtracts days symmetrically", () => {
    const start = plainDate(2026, 8, 26);
    for (let n = -4000; n <= 4000; n += 37) {
      expect(compareDates(addCalendarDays(addCalendarDays(start, n), -n), start)).toBe(0);
    }
  });
});

describe("business days", () => {
  const closed = (date: ZbDate) => formatPlainDate(date, "iso") === "2026-09-07"; // Labor Day

  it("skips weekends", () => {
    // Friday plus one business day is Monday, not Saturday.
    expect(formatPlainDate(addBusinessDays(plainDate(2026, 8, 28), 1), "iso")).toBe("2026-08-31");
    expect(formatPlainDate(addBusinessDays(plainDate(2026, 8, 26), 3), "iso")).toBe("2026-08-31");
  });

  it("skips the organisation's own closures too", () => {
    // Friday 4 Sep + 1 business day would be Monday 7 Sep, which is closed.
    expect(formatPlainDate(addBusinessDays(plainDate(2026, 9, 4), 1, { closed }), "iso")).toBe(
      "2026-09-08",
    );
  });

  it("takes the working week as an argument", () => {
    // A programme running Saturday clinics has a different working week, and
    // "three business days" means something different in it.
    const saturdays = { workdays: [1, 2, 3, 4, 5, 6] };
    expect(formatPlainDate(addBusinessDays(plainDate(2026, 8, 28), 1, saturdays), "iso")).toBe(
      "2026-08-29",
    );
    expect(isBusinessDay(plainDate(2026, 8, 29), saturdays)).toBe(true);
    expect(isBusinessDay(plainDate(2026, 8, 29))).toBe(false);
  });

  it("terminates even when every day is closed", () => {
    const never = addBusinessDays(plainDate(2026, 1, 1), 5, { closed: () => true });
    expect(isValidDate(never.y, never.m, never.d)).toBe(true);
  });
});

describe("age", () => {
  const today = plainDate(2026, 8, 26);

  it("reads in years, months or days depending on how old the person is", () => {
    // A chart that says "0 years old" for a four-month-old has discarded the
    // only number that mattered.
    expect(describeAgeLabel(ageOn(plainDate(1986, 7, 18), today))).toBe("40 years old");
    expect(describeAgeLabel(ageOn(plainDate(2025, 4, 20), today))).toBe("16 months old");
    expect(describeAgeLabel(ageOn(plainDate(2026, 4, 20), today))).toBe("4 months old");
    expect(describeAgeLabel(ageOn(plainDate(2026, 8, 16), today))).toBe("10 days old");
    expect(describeAgeLabel(ageOn(plainDate(2026, 8, 25), today))).toBe("1 day old");
  });

  it("does not round a birthday up before it happens", () => {
    expect(ageOn(plainDate(1986, 8, 27), today).years).toBe(39);
    expect(ageOn(plainDate(1986, 8, 26), today).years).toBe(40);
  });

  it("handles a 29 February birthday in a non-leap year", () => {
    expect(ageOn(plainDate(2000, 2, 29), plainDate(2026, 2, 28)).years).toBe(25);
    expect(ageOn(plainDate(2000, 2, 29), plainDate(2026, 3, 1)).years).toBe(26);
  });

  it("reports a future date rather than a negative age", () => {
    const age = ageOn(plainDate(2027, 1, 1), today);
    expect(age.future).toBe(true);
    expect(describeAgeLabel(age)).toBe("Not yet born");
  });
});

describe("parsing", () => {
  it("takes eight digits and rejects seven", () => {
    expect(parseDateDigits("08262026")).toEqual(plainDate(2026, 8, 26));
    // Seven digits is genuinely ambiguous, and a plausible wrong date in a
    // clinical field is worse than an empty one.
    expect(parseDateDigits("8262026")).toBeNull();
    expect(parseDateDigits("")).toBeNull();
    expect(parseDateDigits("not a date")).toBeNull();
  });

  it("refuses an impossible calendar date", () => {
    expect(parseDateDigits("02302026")).toBeNull();
    expect(parseDateDigits("02292100")).toBeNull();
    expect(parseDateDigits("02292024")).toEqual(plainDate(2024, 2, 29));
    expect(parseDateDigits("13012026")).toBeNull();
  });

  it("resolves a two-digit year against a stated pivot, never a sliding one", () => {
    expect(parseDateDigits("071862")?.y).toBe(1962);
    expect(parseDateDigits("071815")?.y).toBe(2015);
    expect(parseDateDigits("071862", { twoDigitYearPivot: 70 })?.y).toBe(2062);
  });

  it("honours the locale's segment order", () => {
    expect(parseDateDigits("26082026", { order: "DMY" })).toEqual(plainDate(2026, 8, 26));
    expect(parseDateDigits("20260826", { order: "YMD" })).toEqual(plainDate(2026, 8, 26));
  });

  it("accepts every shape a fast typist produces for a time", () => {
    expect(parseClockTime("930a")?.time).toEqual(plainTime(9, 30));
    expect(parseClockTime("9:30 pm")?.time).toEqual(plainTime(21, 30));
    expect(parseClockTime("0930", { hour24: true })?.time).toEqual(plainTime(9, 30));
    expect(parseClockTime("14:05")?.time).toEqual(plainTime(14, 5));
    expect(parseClockTime("12:00 am")?.time).toEqual(plainTime(0, 0));
    expect(parseClockTime("12:00 pm")?.time).toEqual(plainTime(12, 0));
    expect(parseClockTime("10:42:17", { hour24: true })?.time).toEqual(plainTime(10, 42, 17));
  });

  it("flags a bare hour as ambiguous rather than picking one", () => {
    // A picker that quietly resolves this will, on some ward, turn a 9 PM
    // discharge into a 9 AM one.
    const parsed = parseClockTime("9");
    expect(parsed?.ambiguous).toBe(true);
    expect(parseClockTime("9p")?.ambiguous).toBe(false);
    expect(parseClockTime("9", { hour24: true })?.ambiguous).toBe(false);
  });

  it("rejects a minute or second out of range", () => {
    expect(parseClockTime("9:60 am")).toBeNull();
    expect(parseClockTime("25:00", { hour24: true })).toBeNull();
  });

  it("round-trips formatted values back through the parser", () => {
    for (let minutes = 0; minutes < 1440; minutes += 1) {
      const time = timeFromMinutes(minutes).time;
      for (const hour24 of [true, false]) {
        const text = formatClockTime(time, { hour24 });
        const parsed = parseClockTime(text, { hour24 });
        expect(parsed, `${text} did not parse`).not.toBeNull();
        expect(minutesOfTime(parsed!.time)).toBe(minutes);
      }
    }
  });
});

describe("ISO interchange", () => {
  it("keeps a partial date partial", () => {
    // FHIR permits YYYY and YYYY-MM, and padding either to the first of the
    // month invents a fact that reads as precise forever after.
    expect(fromIsoDate("1962")).toEqual({ kind: "partial-date", y: 1962 });
    expect(fromIsoDate("1962-07")).toEqual({ kind: "partial-date", y: 1962, m: 7 });
    expect(fromIsoDate("1962-07-18")).toEqual(plainDate(1962, 7, 18));
    expect(fromIsoDate("1962-13")).toBeNull();
    expect(fromIsoDate("1962-02-30")).toBeNull();
  });

  it("round-trips every precision", () => {
    for (const iso of ["1962", "1962-07", "1962-07-18", "2026-08-26"]) {
      expect(toIsoDate(fromIsoDate(iso)!)).toBe(iso);
    }
  });
});

describe("the session triple", () => {
  const nine = plainTime(9, 0);

  it("derives the end from the duration, and says so", () => {
    const session = sessionFrom(nine, 53);
    expect(formatClockTime(session.end)).toBe("9:53 AM");
    expect(session.hold).toBe("duration");
  });

  it("slides when the duration is held and stretches when the end is", () => {
    // Both are correct; only one can be the default, which is exactly why the
    // component renders which one you got.
    const held = withSessionStart(sessionFrom(nine, 53), plainTime(10, 0));
    expect(held.durationMin).toBe(53);
    expect(formatClockTime(held.end)).toBe("10:53 AM");

    const stretched = withSessionStart(
      withSessionEnd(sessionFrom(nine, 53), plainTime(11, 30)),
      plainTime(10, 30),
    );
    expect(stretched.hold).toBe("end");
    expect(stretched.durationMin).toBe(60);
  });

  it("reads an end at or before the start as crossing midnight", () => {
    const shift = withSessionEnd(sessionFrom(plainTime(23, 30), 0), plainTime(0, 30));
    expect(shift.endDayOffset).toBe(1);
    expect(shift.durationMin).toBe(60);
    expect(formatDuration(shift.durationMin)).toBe("1 hr");
  });

  it("refuses midnight crossing when the workflow forbids it", () => {
    const same = withSessionEnd(sessionFrom(plainTime(23, 30), 0), plainTime(0, 30), {
      allowOvernight: false,
    });
    expect(same.endDayOffset).toBe(0);
    expect(same.durationMin).toBe(0);
  });

  it("reports an overrun instead of clamping it", () => {
    // A start dragged past a held end is the one way to reach an absurd
    // duration. Clamping would hide it; the component says so and offers a fix.
    const absurd = withSessionStart(
      withSessionEnd(sessionFrom(nine, 53), plainTime(10, 15)),
      plainTime(11, 30),
    );
    expect(absurd.exceedsMax).toBe(true);
    expect(absurd.durationMin).toBeGreaterThan(absurd.maxMin);
  });

  it("keeps the three members consistent under any sequence of edits", () => {
    let session = sessionFrom(nine, 60, { maxMin: 1440 });
    for (let step = 0; step < 200; step += 1) {
      const pick = step % 3;
      if (pick === 0) session = withSessionDuration(session, 15 + ((step * 7) % 180));
      else if (pick === 1)
        session = withSessionEnd(session, timeFromMinutes((step * 53) % 1440).time);
      else session = withSessionStart(session, timeFromMinutes((step * 31) % 1440).time);

      const start = minutesOfTime(session.start);
      const end = minutesOfTime(session.end) + session.endDayOffset * 1440;
      expect(end - start, `inconsistent after step ${step}`).toBe(session.durationMin);
      expect(session.durationMin).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("duration bands", () => {
  // The organisation's data, not ours. ADR 0009 forbids the component
  // deriving a coding recommendation, and the thresholds move by contract.
  const bands = [
    { minMinutes: 0, maxMinutes: 15, code: null, label: "Not billable" },
    { minMinutes: 16, maxMinutes: 37, code: "A", label: "Short" },
    { minMinutes: 38, maxMinutes: 52, code: "B", label: "Standard" },
    { minMinutes: 53, maxMinutes: 999, code: "C", label: "Extended" },
  ];

  it("reports the band a value lands in, and nothing else", () => {
    expect(bandFor(10, bands)?.code).toBeNull();
    expect(bandFor(30, bands)?.code).toBe("A");
    expect(bandFor(52, bands)?.code).toBe("B");
    expect(bandFor(53, bands)?.code).toBe("C");
    expect(bandFor(1200, bands)).toBeNull();
  });

  it("has no gaps or overlaps across the whole range it covers", () => {
    for (let minutes = 0; minutes <= 999; minutes += 1) {
      const matches = bands.filter((b) => minutes >= b.minMinutes && minutes <= b.maxMinutes);
      expect(matches, `${minutes} min matched ${matches.length} bands`).toHaveLength(1);
    }
  });
});

describe("the month grid", () => {
  it("is always six rows, in every month of a century", () => {
    // A grid that is five rows one month and six the next moves every control
    // below it, and a user reaching for a footer finds it somewhere else.
    for (let y = 2000; y <= 2100; y += 1) {
      for (let m = 1; m <= 12; m += 1) {
        for (const weekStart of [0, 1, 6]) {
          expect(buildMonthGrid({ y, m }, weekStart)).toHaveLength(42);
        }
      }
    }
  });

  it("starts on the locale's own first day of the week", () => {
    expect(weekdayOf(buildMonthGrid({ y: 2026, m: 9 }, 0)[0]!.date)).toBe(0);
    expect(weekdayOf(buildMonthGrid({ y: 2026, m: 9 }, 1)[0]!.date)).toBe(1);
    expect(weekdayOf(buildMonthGrid({ y: 2026, m: 9 }, 6)[0]!.date)).toBe(6);
  });

  it("contains every day of the month exactly once", () => {
    const cells = buildMonthGrid({ y: 2026, m: 2 });
    const inMonth = cells.filter((c) => c.inMonth).map((c) => c.date.d);
    expect(inMonth).toHaveLength(28);
    expect(new Set(inMonth).size).toBe(28);
  });

  it("runs contiguously across the month boundaries", () => {
    const cells = buildMonthGrid({ y: 2026, m: 3 });
    for (let i = 1; i < cells.length; i += 1) {
      expect(compareDates(cells[i]!.date, cells[i - 1]!.date)).toBe(1);
    }
  });
});

describe("relative language", () => {
  const today = plainDate(2026, 8, 26);

  it("names the near days and counts the rest", () => {
    expect(describeRelativeDay(today, today)).toBe("Today");
    expect(describeRelativeDay(addCalendarDays(today, 1), today)).toBe("Tomorrow");
    expect(describeRelativeDay(addCalendarDays(today, -1), today)).toBe("Yesterday");
    expect(describeRelativeDay(addCalendarDays(today, -5), today)).toBe("5 days ago");
    expect(describeRelativeDay(addCalendarDays(today, 3), today)).toBe("In 3 days");
    expect(describeRelativeDay(addCalendarDays(today, 21), today)).toBe("In 3 weeks");
  });

  it("never returns an empty or negative-looking label", () => {
    for (let n = -400; n <= 400; n += 1) {
      const label = describeRelativeDay(addCalendarDays(today, n), today);
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toContain("-");
      expect(label).not.toContain("NaN");
    }
  });
});

describe("zones", () => {
  const NY = "America/New_York";

  it("reads offsets from the platform's IANA data, in minutes", () => {
    expect(zoneOffsetMinutes(NY, plainDate(2026, 8, 26), plainTime(15, 0))).toBe(-240);
    expect(zoneOffsetMinutes(NY, plainDate(2026, 1, 26), plainTime(15, 0))).toBe(-300);
    // Not every zone is on an hour boundary, and every "offset in hours" API
    // eventually meets one that is not.
    expect(zoneOffsetMinutes("Asia/Kathmandu", plainDate(2026, 8, 26), plainTime(15, 0))).toBe(345);
    expect(zoneOffsetMinutes("Asia/Kolkata", plainDate(2026, 8, 26), plainTime(15, 0))).toBe(330);
  });

  it("tells apart the three things a wall clock can be", () => {
    // Once, twice, and never — and the third is the case an offset probe
    // cannot see, because asking "what is the offset at 2:30 AM" returns a
    // number for a time that never happened.
    expect(classifyLocalTime(NY, plainDate(2026, 8, 26), plainTime(2, 30)).kind).toBe("ok");
    expect(classifyLocalTime(NY, plainDate(2026, 3, 8), plainTime(2, 30)).kind).toBe("nonexistent");
    expect(classifyLocalTime(NY, plainDate(2026, 11, 1), plainTime(1, 30)).kind).toBe("ambiguous");
  });

  it("puts the spring-forward gap exactly where the tzdb does", () => {
    for (const [minutes, expected] of [
      [1 * 60 + 59, "ok"],
      [2 * 60, "nonexistent"],
      [2 * 60 + 59, "nonexistent"],
      [3 * 60, "ok"],
    ] as const) {
      const time = timeFromMinutes(minutes).time;
      expect(
        classifyLocalTime(NY, plainDate(2026, 3, 8), time).kind,
        `${formatClockTime(time)} on the spring-forward day`,
      ).toBe(expected);
    }
  });

  it("returns both offsets for a repeated local time", () => {
    const verdict = classifyLocalTime(NY, plainDate(2026, 11, 1), plainTime(1, 30));
    expect(verdict.kind).toBe("ambiguous");
    if (verdict.kind === "ambiguous") {
      // A medication given at 1:30 AM on this night is an hour of ambiguity
      // in a controlled-substance record unless somebody is asked which.
      expect(verdict.earlierOffset).toBe(-240);
      expect(verdict.laterOffset).toBe(-300);
    }
  });

  it("handles a half-hour DST shift in the southern hemisphere", () => {
    expect(
      classifyLocalTime("Australia/Lord_Howe", plainDate(2026, 10, 4), plainTime(2, 15)).kind,
    ).toBe("nonexistent");
  });

  it("says so rather than guessing when it does not know the zone", () => {
    expect(classifyLocalTime("Mars/Olympus", plainDate(2026, 8, 26), plainTime(9, 0)).kind).toBe(
      "unknown-zone",
    );
    expect(zoneOffsetMinutes("Mars/Olympus", plainDate(2026, 8, 26), plainTime(9, 0))).toBeNull();
  });

  it("converts through the instant, so the US/EU March desync is right", () => {
    // The US shifts on 8 March 2026 and the EU on 29 March. For three weeks
    // the two are out of step, and subtracting two offsets taken at the same
    // local fields gets it wrong by an hour.
    const march = describeZoneShift(
      { kind: "instant", date: plainDate(2026, 3, 15), time: plainTime(15, 0), zone: NY },
      "Europe/Berlin",
    );
    expect(march && formatClockTime(march.local)).toBe("8:00 PM");

    const april = describeZoneShift(
      { kind: "instant", date: plainDate(2026, 4, 15), time: plainTime(15, 0), zone: NY },
      "Europe/Berlin",
    );
    expect(april && formatClockTime(april.local)).toBe("9:00 PM");
  });

  it("carries the date across when a conversion crosses midnight", () => {
    const shifted = describeZoneShift(
      { kind: "instant", date: plainDate(2026, 8, 26), time: plainTime(23, 0), zone: NY },
      "Asia/Kolkata",
    );
    expect(shifted && formatPlainDate(shifted.date, "iso")).toBe("2026-08-27");
    expect(shifted && formatClockTime(shifted.local)).toBe("8:30 AM");
  });

  it("survives every transition the platform knows about for a decade", () => {
    // A sweep rather than a list: the transitions move, and a hardcoded set
    // goes stale the first time a government changes its mind.
    for (const zone of [
      "America/New_York",
      "Europe/London",
      "Australia/Sydney",
      "Pacific/Chatham",
    ]) {
      let previous = zoneOffsetMinutes(zone, plainDate(2020, 1, 1), plainTime(12, 0));
      let transitions = 0;
      for (let day = 0; day < 3650; day += 1) {
        const date = addCalendarDays(plainDate(2020, 1, 1), day);
        const offset = zoneOffsetMinutes(zone, date, plainTime(12, 0));
        expect(offset, `${zone} at ${formatPlainDate(date, "iso")}`).not.toBeNull();
        if (offset !== previous) transitions += 1;
        previous = offset;
      }
      // Every one of these zones observes DST, so a decade must contain some.
      expect(transitions, `${zone} reported no transitions in a decade`).toBeGreaterThan(0);
    }
  });
});

describe("formatting", () => {
  it("says durations the way a schedule does", () => {
    expect(formatDuration(53)).toBe("53 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
    expect(formatDuration(0)).toBe("0 min");
  });

  it("keeps midnight and noon distinct in twelve-hour form", () => {
    expect(formatClockTime(plainTime(0, 0))).toBe("12:00 AM");
    expect(formatClockTime(plainTime(12, 0))).toBe("12:00 PM");
    expect(formatClockTime(plainTime(0, 0), { hour24: true })).toBe("00:00");
  });

  it("never emits a placeholder or an empty string for a real date", () => {
    for (const date of everyDate(2024, 2028)) {
      for (const style of [
        "iso",
        "numeric",
        "short",
        "medium",
        "long",
        "full",
        "weekday",
      ] as const) {
        const text = formatPlainDate(date, style);
        expect(text.length).toBeGreaterThan(2);
        expect(text).not.toContain("undefined");
        expect(text).not.toContain("NaN");
      }
    }
  });
});

/* ------------------------------------------------------------------ */

describe("recurrence expansion", () => {
  const START = plainDate(2026, 9, 1); // a Tuesday

  it("bounds COUNT before removing exceptions, the way RFC 5545 does", () => {
    const rule: RecurrenceRule = {
      freq: "WEEKLY",
      interval: 1,
      count: 26,
      exceptions: [plainDate(2026, 11, 24), plainDate(2026, 12, 22), plainDate(2026, 12, 29)],
    };
    const occurrences = expandRule(rule, START, 200);
    const kept = keptOccurrences(occurrences);

    // 26 dates in range, three of them closures, 23 sessions. Counting only
    // kept dates toward COUNT would give 26 sessions and a series ending
    // three weeks later than the exported RRULE — which carries COUNT=26 and
    // the same three EXDATEs, and so expands to 23 in any conforming reader.
    expect(occurrences).toHaveLength(26);
    expect(occurrences.filter((o) => o.skippedReason)).toHaveLength(3);
    expect(kept).toHaveLength(23);

    expect(toRRule(rule)).toContain("COUNT=26");
    expect(toExDate(rule)).toContain("20261124");
  });

  it("numbers sessions without counting the dates it skipped", () => {
    const rule: RecurrenceRule = {
      freq: "WEEKLY",
      interval: 1,
      count: 4,
      exceptions: [plainDate(2026, 9, 8)],
    };
    const occurrences = expandRule(rule, START, 50);
    expect(occurrences.map((o) => [o.index, o.skippedReason ?? "kept"])).toEqual([
      [1, "kept"],
      [1, "excluded"],
      [2, "kept"],
      [3, "kept"],
    ]);
  });

  it("stops on UNTIL without letting an exception run past it", () => {
    const rule: RecurrenceRule = {
      freq: "WEEKLY",
      interval: 1,
      until: plainDate(2026, 9, 22),
      exceptions: [plainDate(2026, 9, 15)],
    };
    const occurrences = expandRule(rule, START, 50);
    expect(occurrences.map((o) => toIsoDate(o.date))).toEqual([
      "2026-09-01",
      "2026-09-08",
      "2026-09-15",
      "2026-09-22",
    ]);
    expect(keptOccurrences(occurrences)).toHaveLength(3);
  });
});
