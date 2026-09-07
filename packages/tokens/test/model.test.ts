/**
 * The model helpers: the naming rule, the reference syntax, and the DTCG
 * flattener.
 *
 * `flattenDtcg` is the part the theme app depends on most directly — it is
 * how a payload a customer uploaded becomes something the gate can judge — and
 * it was previously a private function inside a build script.
 */

import { describe, expect, it } from "vitest";
import { cssVar, flattenDtcg, referenceTarget, toCssValue } from "../src/validate";

describe("cssVar", () => {
  it("uses one rule for every tier", () => {
    expect(cssVar("status.critical")).toBe("--zb-status-critical");
    expect(cssVar("ref.brand.600")).toBe("--zb-ref-brand-600");
    expect(cssVar("badge.critical-bg")).toBe("--zb-badge-critical-bg");
  });

  it("leaves a single-segment path alone beyond the prefix", () => {
    expect(cssVar("accent")).toBe("--zb-accent");
  });
});

describe("referenceTarget", () => {
  it("reads a value that is exactly one reference", () => {
    expect(referenceTarget("{status.critical}")).toBe("status.critical");
    expect(referenceTarget("  {ref.brand.600}  ")).toBe("ref.brand.600");
  });

  it("returns undefined for a literal", () => {
    expect(referenceTarget("#b91c1c")).toBeUndefined();
  });

  /**
   * A composite like `1px solid {border}` is not a reference — it is a value
   * that happens to contain one, and resolving it as an alias would replace
   * the whole declaration with a colour.
   */
  it("returns undefined for a value that merely contains a reference", () => {
    expect(referenceTarget("1px solid {border}")).toBeUndefined();
    expect(referenceTarget("{a} {b}")).toBeUndefined();
  });
});

describe("toCssValue", () => {
  it("rewrites a reference to var(), which is what lets a brand override it", () => {
    expect(toCssValue("{status.critical}")).toBe("var(--zb-status-critical)");
  });

  it("rewrites every reference inside a composite value", () => {
    expect(toCssValue("1px solid {border}")).toBe("1px solid var(--zb-border)");
    expect(toCssValue("{a} {b}")).toBe("var(--zb-a) var(--zb-b)");
  });

  it("leaves a literal untouched", () => {
    expect(toCssValue("0.5rem")).toBe("0.5rem");
  });
});

describe("flattenDtcg", () => {
  it("flattens nested groups to dot paths", () => {
    const out = flattenDtcg(
      { status: { critical: { $value: "#b91c1c" }, high: { $value: "#b45309" } } },
      "semantic/light.json",
    );
    expect([...out.keys()]).toEqual(["status.critical", "status.high"]);
    expect(out.get("status.critical")?.value).toBe("#b91c1c");
  });

  it("inherits $type down the group tree", () => {
    const out = flattenDtcg({ status: { $type: "color", critical: { $value: "#b91c1c" } } }, "f");
    expect(out.get("status.critical")?.type).toBe("color");
  });

  it("lets a child override the inherited $type", () => {
    const out = flattenDtcg(
      {
        g: { $type: "color", a: { $value: "#000000" }, b: { $type: "dimension", $value: "1rem" } },
      },
      "f",
    );
    expect(out.get("g.a")?.type).toBe("color");
    expect(out.get("g.b")?.type).toBe("dimension");
  });

  it("treats $-prefixed keys as metadata, never as tokens", () => {
    const out = flattenDtcg(
      { $description: "a group", status: { $description: "d", critical: { $value: "#b91c1c" } } },
      "f",
    );
    expect([...out.keys()]).toEqual(["status.critical"]);
  });

  it("carries $description and the source file onto the token", () => {
    const out = flattenDtcg({ a: { $value: "#000000", $description: "why" } }, "primitive.json");
    expect(out.get("a")).toMatchObject({ description: "why", file: "primitive.json" });
  });

  it("coerces a non-string $value to string", () => {
    const out = flattenDtcg({ a: { $value: 400 } }, "f");
    expect(out.get("a")?.value).toBe("400");
  });

  it("ignores a null or non-object child rather than throwing", () => {
    const out = flattenDtcg({ a: null, b: "text", c: { $value: "#000000" } } as never, "f");
    expect([...out.keys()]).toEqual(["c"]);
  });

  /**
   * A duplicate is a silent overwrite otherwise, and the value that wins
   * depends on key order — which is not something a palette should depend on.
   */
  it("throws on a duplicate path, naming the file", () => {
    const out = flattenDtcg({ a: { $value: "#000000" } }, "first.json");
    expect(() => flattenDtcg({ a: { $value: "#ffffff" } }, "second.json", out)).toThrow(
      /duplicate token "a" \(second\.json\)/,
    );
  });

  it("accumulates into a caller-supplied map, so many documents make one source", () => {
    const out = flattenDtcg({ a: { $value: "#000000" } }, "one.json");
    flattenDtcg({ b: { $value: "#ffffff" } }, "two.json", out);
    expect([...out.keys()].sort()).toEqual(["a", "b"]);
  });
});
