/**
 * The prop extractor, against every shape a component in this repository takes.
 *
 * This is the failure mode the file exists for: the extractor walked only
 * `export function` and `export class` declarations, so
 * `export const Switch = React.forwardRef(...)` produced no export and no
 * props at all. Nothing failed. `pnpm gen` reported success, the catalog held
 * `"props": []`, and the docs page rendered an empty table under a "Props"
 * heading — which reads as "this component takes none" rather than as a bug.
 * Switch and Tabs, the two largest APIs in the library, shipped that way.
 *
 * An empty prop table is indistinguishable from a correct one for a component
 * that genuinely has no props, which is why the shapes are enumerated here
 * rather than sampled. A future refactor of `extractProps` that drops one of
 * them fails on the shape, not on whichever component happened to use it.
 *
 * Fixtures rather than real components on purpose: this asserts the extractor's
 * behaviour, and a test that reads Switch would start failing the day someone
 * renames one of Switch's props for good reasons.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractProps, type ExtractedExport } from "../scripts/gen/props";
import type { LoadedComponent } from "../scripts/gen/load";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/*
 * Inside the repository, because `isOwnSource` treats anything outside it (or
 * inside node_modules) as inherited and drops its props — which is the correct
 * behaviour for `React.HTMLAttributes` and would silently empty these fixtures
 * if they were written to the system temp directory.
 */
const FIXTURES = path.join(ROOT, ".tmp-props-fixtures");

/** The header every fixture shares. Keeps each case to just its own shape. */
const PREAMBLE = `
import * as React from "react";
import { forwardRef, memo } from "react";

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  /** The label, as the reader's vocabulary spells it. */
  label: string;
  /** How loud it is. */
  tone?: "neutral" | "critical";
  count?: number;
}
`;

const CASES: Array<{ name: string; source: string; exportName: string }> = [
  {
    name: "function-declaration",
    exportName: "Widget",
    source: `export function Widget({ label, tone = "neutral", count }: Props) {
      return <div>{label}{tone}{count}</div>;
    }`,
  },
  {
    name: "forward-ref-named",
    exportName: "Widget",
    source: `export const Widget = React.forwardRef<HTMLDivElement, Props>(function Widget(
      { label, tone = "neutral", count },
      ref,
    ) {
      return <div ref={ref}>{label}{tone}{count}</div>;
    });`,
  },
  {
    name: "forward-ref-arrow",
    exportName: "Widget",
    source: `export const Widget = React.forwardRef<HTMLDivElement, Props>(
      ({ label, tone = "neutral", count }, ref) => <div ref={ref}>{label}{tone}{count}</div>,
    );`,
  },
  {
    name: "forward-ref-bare-import",
    exportName: "Widget",
    source: `export const Widget = forwardRef<HTMLDivElement, Props>(
      ({ label, tone = "neutral", count }, ref) => <div ref={ref}>{label}{tone}{count}</div>,
    );`,
  },
  {
    name: "memo-wrapping-forward-ref",
    exportName: "Widget",
    source: `export const Widget = memo(
      React.forwardRef<HTMLDivElement, Props>(({ label, tone = "neutral", count }, ref) => (
        <div ref={ref}>{label}{tone}{count}</div>
      )),
    );`,
  },
  {
    name: "plain-arrow",
    exportName: "Widget",
    source: `export const Widget = ({ label, tone = "neutral", count }: Props) => (
      <div>{label}{tone}{count}</div>
    );`,
  },
  {
    name: "class-component",
    exportName: "Widget",
    source: `export class Widget extends React.Component<Props> {
      render() {
        return <div>{this.props.label}</div>;
      }
    }`,
  },
];

function componentFor(name: string): LoadedComponent {
  const file = path.join(FIXTURES, `${name}.tsx`);
  return {
    meta: { name } as LoadedComponent["meta"],
    dir: FIXTURES,
    sourceFile: file,
    sourcePath: path.relative(ROOT, file),
    propsFile: file,
    extraPropsFiles: [],
    consumerSpecifier: `@/components/oxygen/${name}`,
    consumerTarget: `components/oxygen/${name}.tsx`,
    hasStory: false,
    hasTest: false,
    // The relationship graph is computed across the whole catalog; a fixture
    // that exists for one file has no neighbours to derive it from.
    derived: { builtWith: [], usedIn: [] },
  };
}

let extracted: Map<string, ExtractedExport[]>;

beforeAll(() => {
  mkdirSync(FIXTURES, { recursive: true });
  for (const testCase of CASES) {
    writeFileSync(
      path.join(FIXTURES, `${testCase.name}.tsx`),
      `${PREAMBLE}\n${testCase.source}\n`,
      "utf8",
    );
  }
  // One program over all of them, exactly as a real run builds one program over
  // every component.
  extracted = extractProps(CASES.map((testCase) => componentFor(testCase.name)));
});

afterAll(() => {
  rmSync(FIXTURES, { recursive: true, force: true });
});

describe("every component shape yields its props", () => {
  it.each(CASES.map((c) => [c.name, c.exportName] as const))(
    "%s exports %s",
    (name, exportName) => {
      const exports = extracted.get(name);
      expect(exports, `${name} produced no entry at all`).toBeDefined();
      expect(exports!.map((e) => e.exportName)).toContain(exportName);
    },
  );

  it.each(CASES.map((c) => c.name))("%s reports all three own props", (name) => {
    const widget = extracted.get(name)!.find((e) => e.exportName === "Widget")!;
    expect(widget.props.map((p) => p.name).sort()).toEqual(["count", "label", "tone"]);
  });

  it.each(CASES.map((c) => c.name))("%s marks label required and the rest optional", (name) => {
    const widget = extracted.get(name)!.find((e) => e.exportName === "Widget")!;
    const required = Object.fromEntries(widget.props.map((p) => [p.name, p.required]));
    expect(required).toEqual({ label: true, tone: false, count: false });
  });

  it.each(CASES.map((c) => c.name))("%s renders the union type verbatim", (name) => {
    const widget = extracted.get(name)!.find((e) => e.exportName === "Widget")!;
    const tone = widget.props.find((p) => p.name === "tone")!;
    expect(tone.type).toBe(`'neutral' | 'critical'`);
  });

  it.each(CASES.map((c) => c.name))("%s carries the doc comment", (name) => {
    const widget = extracted.get(name)!.find((e) => e.exportName === "Widget")!;
    const label = widget.props.find((p) => p.name === "label")!;
    expect(label.description).toBe("The label, as the reader's vocabulary spells it.");
  });

  /*
   * The inherited surface is summarised, never listed. `React.HTMLAttributes`
   * resolves to roughly 280 properties, none of them this component's design,
   * and burying three real props under them is how a props table stops being
   * read at all.
   */
  it.each(CASES.map((c) => c.name))("%s summarises what it extends", (name) => {
    const widget = extracted.get(name)!.find((e) => e.exportName === "Widget")!;
    expect(widget.props.map((p) => p.name)).not.toContain("onClick");
    expect(widget.props.length).toBe(3);
  });
});

describe("defaults are read from the source rather than restated", () => {
  /*
   * A class component has no destructuring pattern to read, so it is excluded
   * here rather than asserted to be wrong — this is about where the value comes
   * from, and for a class the answer is `defaultProps`, which nothing in this
   * repository uses.
   */
  const withDestructuring = CASES.filter((c) => c.name !== "class-component").map((c) => c.name);

  it.each(withDestructuring)("%s reads tone's default off the pattern", (name) => {
    const widget = extracted.get(name)!.find((e) => e.exportName === "Widget")!;
    expect(widget.props.find((p) => p.name === "tone")!.default).toBe(`"neutral"`);
  });

  it.each(withDestructuring)("%s leaves an undefaulted prop with no default", (name) => {
    const widget = extracted.get(name)!.find((e) => e.exportName === "Widget")!;
    expect(widget.props.find((p) => p.name === "count")!.default).toBeUndefined();
  });
});

describe("what is deliberately not a component", () => {
  const EXTRAS = "extras";

  beforeAll(() => {
    writeFileSync(
      path.join(FIXTURES, `${EXTRAS}.tsx`),
      `${PREAMBLE}
      /** A hook, not a component: lowercase, so it is not part of the visual API. */
      export const useWidget = (options: Props) => options;
      export function helper(options: Props) { return options; }
      const Unexported = React.forwardRef<HTMLDivElement, Props>((_, ref) => <div ref={ref} />);
      export const Widget = React.forwardRef<HTMLDivElement, Props>(({ label }, ref) => (
        <div ref={ref}>{label}{String(Unexported)}</div>
      ));
      `,
      "utf8",
    );
    extracted = new Map([...extracted, ...extractProps([componentFor(EXTRAS)])]);
  });

  it("skips hooks and helpers, which are named lowercase for exactly this reason", () => {
    const names = extracted.get(EXTRAS)!.map((e) => e.exportName);
    expect(names).toEqual(["Widget"]);
  });

  it("skips a component that is never exported", () => {
    const names = extracted.get(EXTRAS)!.map((e) => e.exportName);
    expect(names).not.toContain("Unexported");
  });
});

/*
 * The regression that started this file, asserted against the committed
 * catalog rather than a fixture.
 *
 * The unit cases above prove the extractor understands `forwardRef`. This
 * proves the two components that were actually broken are actually fixed, and
 * that a future change to how they are declared cannot quietly empty them
 * again — the number is a floor, not a fixed count, so adding props is free and
 * losing all of them is not.
 */
describe("the components that shipped with empty prop tables", () => {
  it.each([
    ["switch", 30, ["Switch", "SwitchField", "SwitchList"]],
    ["tabs", 20, ["Tabs"]],
  ] as const)("%s documents its API", async (name, floor, expectedExports) => {
    const { CATALOG } = await import("../apps/docs/src/lib/generated/catalog");
    const component = CATALOG.find((entry) => entry.name === name)!;

    expect(component.props.length).toBeGreaterThanOrEqual(floor);
    for (const exportName of expectedExports) {
      expect(component.exports.map((e) => e.name)).toContain(exportName);
    }
  });

  it("switch documents the widened value that is its whole argument", async () => {
    // `checked` accepting "unknown" is the reason this component exists, and it
    // reaches the table as the alias rather than the expanded union — which is
    // the right call for a props table, and the reason the assertion is on the
    // name: `SwitchValue` is a term the guidance defines, `boolean | "unknown"`
    // is a shape the reader has to interpret.
    const { CATALOG } = await import("../apps/docs/src/lib/generated/catalog");
    const component = CATALOG.find((entry) => entry.name === "switch")!;
    const checked = component.props.find((p) => p.name === "checked");

    expect(checked).toBeDefined();
    expect(checked!.type).toBe("SwitchValue");
    // And no absolute path leaked in with it — see generated.test.ts.
    expect(checked!.type).not.toContain("import(");
  });

  it("documents every part of a variant component, not the union's intersection", async () => {
    const { CATALOG } = await import("../apps/docs/src/lib/generated/catalog");
    const component = CATALOG.find((entry) => entry.name === "date-picker")!;
    const byName = new Map(component.exports.map((entry) => [entry.name, entry.props]));

    // The dispatch leads, because it is the front door and `variant` is the
    // prop a reader needs first.
    expect(component.exports[0]!.name).toBe("DatePicker");
    expect(component.props.map((p) => p.name)).toContain("variant");

    // And every part it dispatches to is documented in its own right. A
    // union's intersection is three props; extracting only that leaves the
    // whole API off the component's own page.
    for (const part of [
      "DateField",
      "Calendar",
      "TimeField",
      "SessionTimeField",
      "BirthDateField",
      "ClinicalDateTime",
      "TimeSlotGrid",
      "RecurrenceField",
      "AppointmentScheduler",
      "RecurringSeriesScheduler",
      "GroupSeriesScheduler",
    ]) {
      expect(byName.get(part)?.length ?? 0, `${part} has no props`).toBeGreaterThan(5);
    }

    // Spot-check props that exist on exactly one variant — these are the ones
    // that vanish when only the intersection is read.
    expect(byName.get("TimeSlotGrid")!.map((p) => p.name)).toContain("set");
    expect(byName.get("AppointmentScheduler")!.map((p) => p.name)).toContain("providers");
    expect(byName.get("SessionTimeField")!.map((p) => p.name)).toContain("durationPresets");
  });

  it("tabs documents `as`, which it requires and gives no default", async () => {
    const { CATALOG } = await import("../apps/docs/src/lib/generated/catalog");
    const component = CATALOG.find((entry) => entry.name === "tabs")!;
    const as = component.props.find((p) => p.name === "as");

    expect(as).toBeDefined();
    // No default is the design, not an omission: four accessibility trees share
    // this silhouette and there is no safe one to pick.
    expect(as!.default).toBeUndefined();
  });
});
