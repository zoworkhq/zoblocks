import { describe, expect, it } from "vitest";
import { MAX_COLLISION_PEERS, disambiguate, disambiguationNotice } from "../src/disambiguate.js";
import { policy, resolveIdentity } from "../src/resolve.js";
import type { Identity } from "../src/types.js";
import * as F from "./fixtures.js";

const P = policy({ now: F.NOW });

function id(
  key: string,
  given: string[],
  family: string | undefined,
  birthDate: string,
  mrn: string,
): Identity {
  return resolveIdentity(
    F.patient({
      id: key,
      name: family ? [{ use: "official", given, family }] : [{ use: "official", given }],
      birthDate,
      identifier: [{ system: F.MRN_SYSTEM, value: mrn, assigner: { display: "St Aidan's" } }],
    }),
    P,
  );
}

const amaraA = id("pat-4471", ["Amara", "Chinelo"], "Okonkwo", "1985-03-08", "123456789");
const amaraB = id("pat-9910", ["Amara", "Nkechi"], "Okonkwo", "1991-09-22", "998220106");
const ada = id("pat-2210", ["Ada"], "Lovelace", "1979-02-02", "402118776");
const anh = id("pat-1180", ["Anh"], "Nguyen", "1978-02-03", "445019220");
const anhAccent = id("pat-7734", ["Ánh"], "Nguyên", "1982-12-11", "703884561");
const twinA = id("pat-9001", ["Baby A"], "Ferreira", "2026-08-15", "880112003");
const twinB = id("pat-9002", ["Baby B"], "Ferreira", "2026-08-15", "880112004");

describe("disambiguate", () => {
  it("does nothing to a set of one", () => {
    const r = disambiguate([amaraA]);
    expect(r.escalated).toBe(0);
    expect(r.plan.size).toBe(0);
  });

  it("does nothing to a set with no collisions", () => {
    const r = disambiguate([ada, id("pat-3", ["Devraj"], "Iyer", "1990-11-19", "771004128")]);
    // These two may still share a swatch; if so that is the only reason and
    // the escalation is the mild one.
    for (const e of r.plan.values()) expect(e.reasons).toEqual(["same-swatch"]);
  });

  it("separates two people with the same family name using the full given name", () => {
    const r = disambiguate([amaraA, amaraB]);
    expect(r.escalated).toBe(2);
    const e = r.plan.get(amaraA.key);
    expect(e?.reason).toBe("same-family-name");
    expect(e?.add).toContain("given-full");
    expect(e?.with).toEqual([amaraB.key]);
    expect(e?.mark).toBe(true);
  });

  it("separates diacritic-only near-duplicates using the date of birth", () => {
    const r = disambiguate([anh, anhAccent]);
    expect(r.escalated).toBe(2);
    const e = r.plan.get(anh.key);
    // Folded, "Nguyen" and "Nguyên" ARE the same family name — which is the
    // honest answer, and a stronger reason than "similar". Either label is
    // acceptable to a renderer; what matters is that the date of birth is
    // added, because the given names fold to the same string too.
    expect(e?.reasons.some((x) => x === "same-family-name" || x === "similar-name")).toBe(true);
    expect(e?.add).toContain("dob");
  });

  it("escalates twins to the identifier — same surname and same date of birth", () => {
    const r = disambiguate([twinA, twinB]);
    const e = r.plan.get(twinA.key);
    expect(e?.reason).toBe("same-birth-date");
    // The given name differs, but with an identical DOB a reader still needs
    // something that cannot be misread, so the ladder keeps going.
    expect(e?.add).toContain("given-full");
    expect(e?.add).toContain("identifier");
  });

  it("leaves an uncolliding row untouched in a colliding set", () => {
    const r = disambiguate([amaraA, amaraB, ada]);
    const adaPlan = r.plan.get(ada.key);
    // Ada may share a swatch with someone; if she does, the only reason is
    // that, and the escalation never reaches the identifier.
    if (adaPlan) {
      expect(adaPlan.reasons).toEqual(["same-swatch"]);
      expect(adaPlan.add).not.toContain("identifier");
      expect(adaPlan.mark).toBe(false);
    }
  });

  it("flags a shared swatch without treating it as a name collision", () => {
    // Two unrelated people sharing a colour: escalate mildly, do not alarm.
    const set = [amaraA, ada, anh, anhAccent, twinA, twinB, amaraB];
    const r = disambiguate(set);
    const swatchOnly = [...r.plan.values()].filter(
      (e) => e.reasons.length === 1 && e.reasons[0] === "same-swatch",
    );
    for (const e of swatchOnly) {
      expect(e.mark).toBe(false);
      expect(e.add).toEqual(["given-full"]);
    }
  });

  it("merges reasons and keeps the strongest for a three-way collision", () => {
    const third = id("pat-5555", ["Amara", "Ifeoma"], "Okonkwo", "1985-03-08", "111222333");
    const r = disambiguate([amaraA, amaraB, third]);
    const e = r.plan.get(amaraA.key);
    expect(e?.reason).toBe("same-birth-date");
    expect(e?.with).toContain(amaraB.key);
    expect(e?.with).toContain(third.key);
  });

  it("is symmetric — both sides of a pair are escalated", () => {
    const r = disambiguate([amaraA, amaraB]);
    expect(r.plan.has(amaraA.key)).toBe(true);
    expect(r.plan.has(amaraB.key)).toBe(true);
  });

  it("ignores a duplicate of the same record", () => {
    const r = disambiguate([amaraA, amaraA]);
    expect(r.plan.size).toBe(0);
  });

  it("produces a notice that names the count and the action", () => {
    const r = disambiguate([amaraA, amaraB]);
    const notice = disambiguationNotice(r);
    expect(notice).toContain("2 of 2");
    expect(notice).toContain("Confirm date of birth");
    // CONTENT.md §4: never "are you sure?".
    expect(notice?.toLowerCase()).not.toContain("are you sure");
  });

  it("produces no notice when nothing escalated", () => {
    expect(disambiguationNotice(disambiguate([amaraA]))).toBeUndefined();
  });
});

describe("disambiguate — the property that matters", () => {
  /**
   * After the pass, every escalated identity must be separable from the ones it
   * collided with by the fields the plan asked for. This is a property test
   * rather than an example test because the interesting inputs are the ones
   * nobody thought of.
   */
  function fieldsOf(i: Identity, add: string[]): string {
    const parts = [i.name.family ?? i.name.text];
    if (add.includes("given-full")) parts.push(i.name.given.join(" "));
    if (add.includes("dob")) parts.push(i.birthDate?.value ?? "");
    if (add.includes("identifier")) parts.push(i.identifiers[0]?.raw ?? "");
    return parts.join("|");
  }

  const GIVENS = ["Amara", "Amara", "Anh", "Ánh", "Baby A", "Baby B", "Devraj", "Ada"];
  const FAMILIES = [
    "Okonkwo",
    "Okonjo",
    "Nguyen",
    "Nguyên",
    "Ferreira",
    "Ferreira",
    "Iyer",
    "Lovelace",
  ];
  const DOBS = [
    "1985-03-08",
    "1985-03-08",
    "1978-02-03",
    "1982-12-11",
    "2026-08-15",
    "2026-08-15",
    "1990-11-19",
    "1979-02-02",
  ];

  it("makes every collided pair distinguishable, for sets of 2 to 8", () => {
    for (let size = 2; size <= 8; size++) {
      for (let offset = 0; offset < 8; offset++) {
        const set: Identity[] = [];
        for (let k = 0; k < size; k++) {
          const i = (offset + k) % 8;
          set.push(
            id(
              `pat-p${offset}-${k}`,
              [GIVENS[i] ?? "X"],
              FAMILIES[i],
              DOBS[i] ?? "1980-01-01",
              String(100000000 + offset * 1000 + k),
            ),
          );
        }
        const r = disambiguate(set);
        for (const [key, plan] of r.plan) {
          const self = set.find((s) => s.key === key);
          expect(self).toBeDefined();
          if (!self) continue;
          for (const otherKey of plan.with) {
            const other = set.find((s) => s.key === otherKey);
            if (!other) continue;
            const otherPlan = r.plan.get(otherKey);
            const combined = [...new Set([...plan.add, ...(otherPlan?.add ?? [])])];
            expect(
              fieldsOf(self, combined),
              `set ${size}/${offset}: ${key} vs ${otherKey} still identical after ${combined.join(",")}`,
            ).not.toBe(fieldsOf(other, combined));
          }
        }
      }
    }
  });

  it("terminates and never asks for a field twice", () => {
    const big: Identity[] = [];
    for (let i = 0; i < 30; i++) {
      big.push(id(`pat-b${i}`, ["Amara"], "Okonkwo", "1985-03-08", String(200000000 + i)));
    }
    const r = disambiguate(big);
    expect(r.escalated).toBe(30);
    for (const plan of r.plan.values()) {
      expect(new Set(plan.add).size).toBe(plan.add.length);
      expect(plan.add).toContain("identifier");
    }
  });

  /**
   * A scaling assertion rather than a wall clock.
   *
   * A wall clock is hardware-dependent and roughly doubles under coverage
   * instrumentation, which makes it exactly the kind of test a team learns to
   * ignore — the failure mode ARCHITECTURE §7 warns about for visual
   * regression, applied to performance. What actually matters is the shape of
   * the curve: the pair loop is O(n^2), so tripling the input should cost
   * about nine times as much. If someone reintroduces per-pair folding or an
   * array-concat merge, the inner term stops being constant and this ratio
   * blows out regardless of how fast the machine is.
   */
  function timeDisambiguate(n: number): number {
    const fam = [
      "Okonkwo",
      "Iyer",
      "Yusuf",
      "Mensah",
      "Ramirez",
      "Chen",
      "Lindqvist",
      "Haddad",
      "Berg",
      "Kulkarni",
      "Adeyemi",
      "Novak",
      "Ferreira",
      "Nguyen",
      "Meer",
      "Tashkandi",
    ];
    const set: Identity[] = [];
    for (let i = 0; i < n; i++) {
      set.push(
        id(
          `pat-t${n}-${i}`,
          [`Given${i % 37}`],
          fam[i % fam.length],
          `19${80 + (i % 10)}-03-${String((i % 28) + 1).padStart(2, "0")}`,
          String(300000000 + i),
        ),
      );
    }
    disambiguate(set); // warm up, so JIT state is not part of the measurement
    // Median of three. A single sample at these sizes is dominated by whatever
    // else the machine was doing, and a flaky performance test is worse than no
    // performance test — the team stops reading it.
    const runs: number[] = [];
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      disambiguate(set);
      runs.push(performance.now() - t0);
    }
    runs.sort((a, b) => a - b);
    return runs[1] as number;
  }

  it("scales quadratically, not worse — the inner comparison stays constant", () => {
    // 150 and 450 rather than 100 and 300: at a hundred rows the whole pass is
    // under a millisecond, and a ratio computed from sub-millisecond samples
    // measures the clock rather than the algorithm.
    const small = Math.max(timeDisambiguate(150), 0.5);
    const large = timeDisambiguate(450);
    // 3x the rows is 9x the pairs. Allow 3x headroom for noise; a regression
    // that puts real work back inside the loop lands far above it.
    expect(large / small).toBeLessThan(27);
  });

  it("survives a degenerate set where everything collides", () => {
    // A paediatric ward where forty children share a surname, or any list long
    // enough that every swatch collides. Quadratic pair comparison is fine;
    // quadratic *merging* on top of it is what this guards against.
    const set: Identity[] = [];
    for (let i = 0; i < 300; i++) {
      set.push(id(`pat-d${i}`, ["Amara"], "Okonkwo", "1985-03-08", String(400000000 + i)));
    }
    const t0 = performance.now();
    const r = disambiguate(set);
    expect(performance.now() - t0).toBeLessThan(400);
    expect(r.escalated).toBe(300);
    for (const plan of r.plan.values()) {
      expect(plan.add).toContain("identifier");
      // Peer lists are bounded rather than growing to the whole clique.
      expect(plan.with.length).toBeLessThanOrEqual(MAX_COLLISION_PEERS);
    }
  });
});
