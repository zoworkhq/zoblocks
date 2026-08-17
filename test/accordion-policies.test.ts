/**
 * The open-set policies, tested without rendering anything.
 *
 * This is the payoff for making state a set and a policy rather than a mode.
 * Every combination the component supports is four pure functions over a Set,
 * so the behaviour can be enumerated exhaustively here and the component's own
 * tests can be about markup rather than about bookkeeping.
 */

import { describe, expect, it } from "vitest";
import {
  ACCORDION_POLICIES,
  accessOf,
  isGated,
  isInert,
  isWithheld,
  normalizeKeys,
  pinnedKeys,
  resolveOpenKeys,
  type AccordionItem,
  type AccordionPolicyName,
} from "../registry/oxygen/lib/accordion-core";

const POLICY_NAMES: AccordionPolicyName[] = ["multiple", "single", "exclusive", "atLeastOne"];

const item = (key: string, extra: Partial<AccordionItem> = {}): AccordionItem =>
  ({ key, label: key, ...extra }) as AccordionItem;

describe("policies", () => {
  describe("multiple", () => {
    const p = ACCORDION_POLICIES.multiple;

    it("opens a closed key", () => {
      expect([...p(new Set(), "a")]).toEqual(["a"]);
    });

    it("closes an open key", () => {
      expect([...p(new Set(["a"]), "a")]).toEqual([]);
    });

    it("leaves siblings alone", () => {
      expect([...p(new Set(["a"]), "b")].sort()).toEqual(["a", "b"]);
    });
  });

  describe("single", () => {
    const p = ACCORDION_POLICIES.single;

    it("closes every sibling when one opens", () => {
      expect([...p(new Set(["a", "b"]), "c")]).toEqual(["c"]);
    });

    it("still closes the open one — single is not exclusive", () => {
      expect([...p(new Set(["a"]), "a")]).toEqual([]);
    });
  });

  describe("exclusive", () => {
    const p = ACCORDION_POLICIES.exclusive;

    it("cannot be closed by activation", () => {
      // The difference from `single`, and the reason both exist: an exclusive
      // set always shows something.
      expect([...p(new Set(["a"]), "a")]).toEqual(["a"]);
    });

    it("replaces the open set", () => {
      expect([...p(new Set(["a", "b"]), "c")]).toEqual(["c"]);
    });
  });

  describe("atLeastOne", () => {
    const p = ACCORDION_POLICIES.atLeastOne;

    it("refuses to close the last open section", () => {
      expect([...p(new Set(["a"]), "a")]).toEqual(["a"]);
    });

    it("closes one of several", () => {
      expect([...p(new Set(["a", "b"]), "a")]).toEqual(["b"]);
    });

    it("opens normally", () => {
      expect([...p(new Set(["a"]), "b")].sort()).toEqual(["a", "b"]);
    });
  });

  it.each(POLICY_NAMES)("%s never mutates the set it was given", (name) => {
    // The reducer is called with the current state; mutating it would make
    // React's change detection miss the update in exactly the cases where the
    // result happens to be equal.
    const open = new Set(["a", "b"]);
    const snapshot = [...open];
    ACCORDION_POLICIES[name](open, "a");
    ACCORDION_POLICIES[name](open, "z");
    expect([...open]).toEqual(snapshot);
  });

  it.each(POLICY_NAMES)("%s returns a set, always", (name) => {
    expect(ACCORDION_POLICIES[name](new Set(), "a")).toBeInstanceOf(Set);
  });
});

describe("pinning", () => {
  const items = [item("a"), item("b", { pinned: true }), item("c")];

  it("collects pinned keys", () => {
    expect([...pinnedKeys(items)]).toEqual(["b"]);
  });

  it("re-adds a pinned key the policy removed", () => {
    // Pinning is a filter after the policy rather than a branch inside it, so
    // no policy has to know about it and none of them can get it wrong.
    const afterSingle = ACCORDION_POLICIES.single(new Set(["b"]), "a");
    expect(afterSingle.has("b")).toBe(false);
    expect([...resolveOpenKeys(afterSingle, items)].sort()).toEqual(["a", "b"]);
  });

  it.each(POLICY_NAMES)("keeps a pinned key open under %s, whatever is activated", (name) => {
    for (const key of ["a", "b", "c"]) {
      const next = resolveOpenKeys(ACCORDION_POLICIES[name](new Set(["b"]), key), items);
      expect(next.has("b"), `${name} closed a pinned section by activating ${key}`).toBe(true);
    }
  });

  it("leaves a plain set untouched when nothing is pinned", () => {
    expect([...resolveOpenKeys(new Set(["a"]), [item("a"), item("c")])]).toEqual(["a"]);
  });
});

describe("normalizeKeys", () => {
  it.each([
    [undefined, []],
    ["a", ["a"]],
    [1, [1]],
    [[], []],
    [
      ["a", "b"],
      ["a", "b"],
    ],
  ])("%s → %s", (input, expected) => {
    expect(normalizeKeys(input as never)).toEqual(expected);
  });

  it("copies rather than aliasing the caller's array", () => {
    const source = ["a"];
    const result = normalizeKeys(source);
    result.push("b");
    expect(source).toEqual(["a"]);
  });
});

describe("access predicates", () => {
  it("defaults to open", () => {
    expect(accessOf(item("a"))).toEqual({ kind: "open" });
  });

  it.each([
    ["open", false, false, false],
    ["advisory", false, true, false],
    ["reason", false, true, false],
    ["consent", false, true, false],
    ["withheld", true, false, true],
  ] as const)("%s → withheld=%s gated=%s inert=%s", (kind, withheld, gated, inert) => {
    const access =
      kind === "advisory"
        ? { kind, notice: "n" }
        : kind === "reason"
          ? { kind, reasons: [] }
          : kind === "consent"
            ? { kind, policy: "p", state: "granted" as const }
            : kind === "withheld"
              ? { kind, reason: "r" }
              : { kind };

    const subject = item("a", { access } as Partial<AccordionItem>);
    expect(isWithheld(subject)).toBe(withheld);
    expect(isGated(subject)).toBe(gated);
    expect(isInert(subject)).toBe(inert);
  });

  it("treats a pinned section as inert — it cannot be closed", () => {
    expect(isInert(item("a", { pinned: true }))).toBe(true);
  });

  it("treats collapsible=disabled as inert", () => {
    expect(isInert(item("a", { collapsible: "disabled" }))).toBe(true);
  });
});
