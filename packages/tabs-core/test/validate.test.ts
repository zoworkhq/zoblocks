/**
 * Configuration validation.
 *
 * Every case here renders perfectly and passes every automated checker. That
 * is what makes them worth a test each: nothing else in the pipeline will
 * catch them.
 */

import { describe, expect, it } from "vitest";
import { formatProblems, validateTabsConfig, type TabItem } from "../src/index.js";

const ok: TabItem[] = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];

const codes = (input: Parameters<typeof validateTabsConfig>[0]) =>
  validateTabsConfig(input).map((problem) => problem.code);

describe("the mode is required", () => {
  it("reports a missing mode", () => {
    expect(codes({ mode: undefined, items: ok })).toEqual(["missing-mode"]);
  });

  it("stops after a missing mode, because everything else depends on it", () => {
    const problems = validateTabsConfig({ mode: undefined, items: [{ value: "", label: "x" }] });
    expect(problems).toHaveLength(1);
  });

  it("accepts a well-formed configuration silently", () => {
    expect(validateTabsConfig({ mode: "tabs", items: ok })).toEqual([]);
  });
});

describe("links and modes", () => {
  it("rejects hrefs on a tablist — the defect the whole design exists to prevent", () => {
    const items: TabItem[] = [{ value: "a", label: "A", href: "/a" }];
    expect(codes({ mode: "tabs", items })).toContain("href-without-nav");
  });

  it("rejects hrefs in a radiogroup and in steps too", () => {
    const items: TabItem[] = [{ value: "a", label: "A", href: "/a" }];
    expect(codes({ mode: "radiogroup", items })).toContain("href-without-nav");
    expect(codes({ mode: "steps", items })).toContain("href-without-nav");
  });

  it("accepts hrefs under nav", () => {
    const items: TabItem[] = [{ value: "a", label: "A", href: "/a" }];
    expect(validateTabsConfig({ mode: "nav", items })).toEqual([]);
  });

  it("rejects nav items with no href, which are neither focusable nor clickable", () => {
    expect(codes({ mode: "nav", items: ok })).toContain("nav-without-href");
  });

  it("says nothing about an empty nav", () => {
    expect(validateTabsConfig({ mode: "nav", items: [] })).toEqual([]);
  });

  it("ignores an empty-string href rather than treating it as a link", () => {
    const items: TabItem[] = [{ value: "a", label: "A", href: "" }];
    expect(codes({ mode: "tabs", items })).not.toContain("href-without-nav");
  });
});

describe("panels", () => {
  it("rejects panels in modes that do not own them", () => {
    expect(codes({ mode: "nav", items: [{ value: "a", href: "/a" }], hasPanels: true })).toContain(
      "panels-without-owner",
    );
    expect(codes({ mode: "radiogroup", items: ok, hasPanels: true })).toContain(
      "panels-without-owner",
    );
  });

  it("accepts panels in tabs and steps", () => {
    expect(codes({ mode: "tabs", items: ok, hasPanels: true })).toEqual([]);
    expect(codes({ mode: "steps", items: ok, hasPanels: true })).toEqual([]);
  });
});

describe("overflow", () => {
  it('rejects wrap outside a radiogroup — "the next tab" stops being a direction', () => {
    expect(codes({ mode: "tabs", items: ok, overflow: "wrap" })).toContain(
      "wrap-outside-radiogroup",
    );
  });

  it("accepts wrap in a horizontal radiogroup", () => {
    expect(validateTabsConfig({ mode: "radiogroup", items: ok, overflow: "wrap" })).toEqual([]);
  });

  it("rejects wrap in a vertical orientation, where there is nothing to wrap onto", () => {
    expect(
      codes({ mode: "radiogroup", items: ok, overflow: "wrap", orientation: "vertical" }),
    ).toContain("vertical-wrap");
  });

  it("says nothing about the other strategies", () => {
    for (const overflow of ["scroll", "menu", "collapse", "none"] as const) {
      expect(validateTabsConfig({ mode: "tabs", items: ok, overflow })).toEqual([]);
    }
  });
});

describe("items", () => {
  it("rejects an empty value", () => {
    expect(codes({ mode: "tabs", items: [{ value: "", label: "A" }] })).toContain("empty-value");
  });

  it("rejects duplicates, which would select two tabs at once", () => {
    const items: TabItem[] = [
      { value: "a", label: "A" },
      { value: "a", label: "Also A" },
    ];
    expect(codes({ mode: "tabs", items })).toContain("duplicate-value");
  });

  it("requires a reason on a disabled item", () => {
    const items: TabItem[] = [{ value: "a", label: "A", disabled: true }];
    expect(codes({ mode: "tabs", items })).toContain("disabled-without-reason");
  });

  it("accepts a disabled item that explains itself", () => {
    const items: TabItem[] = [
      { value: "a", label: "A", disabled: true, disabledReason: "Restricted — request access" },
    ];
    expect(validateTabsConfig({ mode: "tabs", items })).toEqual([]);
  });

  it("requires textLabel when the label is not a string", () => {
    const items: TabItem[] = [{ value: "a", label: { nodeType: 1 } }];
    expect(codes({ mode: "tabs", items })).toContain("non-string-label-without-text");
  });

  it("accepts a rich label that supplies text", () => {
    const items: TabItem[] = [{ value: "a", label: { nodeType: 1 }, textLabel: "Imaging" }];
    expect(validateTabsConfig({ mode: "tabs", items })).toEqual([]);
  });

  it("rejects a closable item with nothing to close it", () => {
    const items: TabItem[] = [{ value: "a", label: "A", closable: true }];
    expect(codes({ mode: "tabs", items })).toContain("closable-without-handler");
    expect(validateTabsConfig({ mode: "tabs", items, hasCloseHandler: true })).toEqual([]);
  });
});

describe("controlled state", () => {
  it("rejects both value and defaultValue", () => {
    expect(codes({ mode: "tabs", items: ok, value: "a", defaultValue: "b" })).toContain(
      "controlled-and-uncontrolled",
    );
  });

  it("rejects a selected value that is not in the list", () => {
    expect(codes({ mode: "tabs", items: ok, value: "nope" })).toContain("value-not-in-items");
    expect(codes({ mode: "tabs", items: ok, defaultValue: "nope" })).toContain(
      "value-not-in-items",
    );
  });

  it("says nothing when the list is still empty — triggers register after mount", () => {
    expect(validateTabsConfig({ mode: "tabs", items: [], value: "a" })).toEqual([]);
  });
});

describe("formatProblems", () => {
  it("returns an empty string for no problems", () => {
    expect(formatProblems([])).toBe("");
  });

  it("names every code and counts them", () => {
    const problems = validateTabsConfig({
      mode: "tabs",
      items: [{ value: "a", label: "A", href: "/a" }],
      overflow: "wrap",
    });
    const text = formatProblems(problems);
    expect(text).toContain(`${problems.length} configuration problem`);
    expect(text).toContain("[href-without-nav]");
    expect(text).toContain("[wrap-outside-radiogroup]");
  });
});
