/**
 * The documentation debt does not grow.
 *
 * 235 of 555 public props once shipped with no description. They are now all
 * written, so this file guards the result rather than a backlog: a prop added
 * without a description fails here, and the budget map below is empty.
 *
 * It is kept as a ratchet rather than a flat assertion because the honest way
 * to admit a genuinely undocumentable prop is to name it in the map with a
 * reason, which is visible in review — not to loosen the check.
 *
 * The rail assertions are not ratcheted, because they guard a shape rather than
 * a backlog: a state browser with half its states grouped renders an orphan
 * band, which is a bug rather than a gap.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG } from "../apps/docs/src/lib/generated/catalog";
import type { PropDoc } from "@oxygenui-design/component-meta";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Every prop the detail page renders, across every export, de-duplicated.
 *
 * The page draws one table per export, so a component's documented surface is
 * the union of them. Counting only the primary export understates the gap by
 * about a third — which is how 235 was once reported as 155.
 */
function renderedProps(component: (typeof CATALOG)[number]): PropDoc[] {
  const all: PropDoc[] = [...component.props];
  for (const exported of component.exports ?? []) all.push(...exported.props);

  const seen = new Set<string>();
  return all.filter((prop) => {
    const key = `${prop.name} ${prop.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const undocumented = new Map<string, number>();
for (const component of CATALOG) {
  const missing = renderedProps(component).filter(
    (prop) => !(prop.description ?? "").trim(),
  ).length;
  if (missing > 0) undocumented.set(component.name, missing);
}

/**
 * The backlog, per component.
 *
 * It is empty, and it should stay that way. Every one of the 555 props the
 * detail pages render now carries a description — the 235 that did not were
 * written in one pass, so there is no debt left to ratchet down.
 *
 * The map is kept rather than deleted because the three assertions below still
 * need something to compare against, and because the honest way to add a
 * genuinely undocumentable prop later is to put it here with a comment saying
 * why, not to weaken the test.
 */
const UNDOCUMENTED_BUDGET: Readonly<Record<string, number>> = {};

describe("prop documentation", () => {
  it("does not regress for any component", () => {
    const regressions: string[] = [];
    for (const [name, missing] of undocumented) {
      const budget = UNDOCUMENTED_BUDGET[name] ?? 0;
      if (missing > budget) {
        regressions.push(
          `${name}: ${missing} undocumented props against a budget of ${budget}. ` +
            "Describe the new prop rather than raising the budget.",
        );
      }
    }
    expect(regressions).toEqual([]);
  });

  it("keeps no budget a component has already paid off", () => {
    // A budget left behind after the text landed reads as debt that is not
    // there, and it hides the next regression behind the slack.
    const stale = Object.keys(UNDOCUMENTED_BUDGET)
      .filter((name) => (undocumented.get(name) ?? 0) < (UNDOCUMENTED_BUDGET[name] ?? 0))
      .map(
        (name) =>
          `${name}: budget ${UNDOCUMENTED_BUDGET[name]}, actual ${undocumented.get(name) ?? 0}`,
      );
    expect(stale, "lower these budgets to the new count").toEqual([]);
  });

  it("requires a component added after this gate to ship documented", () => {
    const newcomers = [...undocumented.keys()].filter((name) => !(name in UNDOCUMENTED_BUDGET));
    expect(newcomers).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* The state browser's rail                                           */
/* ------------------------------------------------------------------ */

const previewSource = readFileSync(
  path.join(ROOT, "apps/docs/src/components/site/component-preview.tsx"),
  "utf8",
);

interface RailEntry {
  component: string;
  id: string;
  group?: string;
}

/**
 * One entry per scenario, in source order.
 *
 * Read from source rather than imported, for the reason `docs-coverage` gives:
 * this module is a client component that pulls in the whole registry, and a
 * test that has to render React to find out whether a key exists is answering a
 * different question.
 */
function railEntries(): RailEntry[] {
  const body = previewSource.slice(previewSource.indexOf("const SCENARIOS"));
  const pattern = /^ {2}"?([a-z][a-z-]*)"?: \[|^ {6}id: "([^"]+)"|^ {6}group: "([^"]+)"/gm;

  const out: RailEntry[] = [];
  let component = "";
  let pending: RailEntry | null = null;

  for (const match of body.matchAll(pattern)) {
    if (match[1]) {
      if (pending) out.push(pending);
      pending = null;
      component = match[1];
    } else if (match[2]) {
      if (pending) out.push(pending);
      pending = { component, id: match[2] };
    } else if (match[3] && pending) {
      pending.group = match[3];
    }
  }
  if (pending) out.push(pending);
  return out;
}

describe("the state browser rail", () => {
  const entries = railEntries();

  const byComponent = new Map<string, RailEntry[]>();
  for (const entry of entries) {
    if (!byComponent.has(entry.component)) byComponent.set(entry.component, []);
    byComponent.get(entry.component)!.push(entry);
  }

  it("finds the scenarios", () => {
    // Guards the parser itself. If the map is renamed or reformatted this
    // number collapses and every assertion below passes vacuously.
    expect(entries.length).toBeGreaterThan(90);
    expect(byComponent.size).toBeGreaterThan(15);
  });

  it("groups a component's scenarios all-or-nothing", () => {
    // A rail with three named bands and four loose entries underneath reads as
    // a rendering fault rather than as a fourth band.
    const mixed: string[] = [];
    for (const [name, items] of byComponent) {
      const grouped = items.filter((item) => item.group).length;
      if (grouped !== 0 && grouped !== items.length) {
        mixed.push(`${name}: ${grouped} of ${items.length} scenarios carry a group`);
      }
    }
    expect(mixed).toEqual([]);
  });

  it("groups every component with more than six scenarios", () => {
    // Six is where a flat rail stops being scannable. Below it the single
    // "States" heading is the honest label; above it a reader needs bands.
    const ungrouped = [...byComponent]
      .filter(([, items]) => items.length > 6 && items.every((item) => !item.group))
      .map(([name, items]) => `${name} has ${items.length} scenarios and no groups`);
    expect(ungrouped).toEqual([]);
  });

  it("gives every scenario an id unique within its component", () => {
    // Ids become `?state=` values, so a duplicate makes a deep link ambiguous.
    const duplicates: string[] = [];
    for (const [name, items] of byComponent) {
      const seen = new Set<string>();
      for (const item of items) {
        if (seen.has(item.id)) duplicates.push(`${name}#${item.id}`);
        seen.add(item.id);
      }
    }
    expect(duplicates).toEqual([]);
  });
});
