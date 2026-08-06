/**
 * Emits the coverage manifest and enforces the quality gate.
 *
 * The gate is asserted against the catalog rather than against a pull request,
 * because nobody reviews 500 components by hand. A component marked `stable`
 * is making a semver promise to consumers; this is what makes that promise
 * cost something to make.
 *
 * See content/decisions/0007-story-derived-testing.md.
 */

import { banner, paths } from "../config";
import type { LoadedComponent } from "../load";
import type { ExtractedExport } from "../props";
import type { Emitter } from "../write";

export interface CoverageRow {
  name: string;
  tier: string;
  status: string;
  layer: string;
  hasStory: boolean;
  hasTest: boolean;
  documentedProps: number;
  states: number;
  a11yNotes: number;
  /** Unmet requirements for this component's declared stability tier. */
  gaps: string[];
}

/**
 * Requirements per stability tier.
 *
 * Experimental components are exempt: the point of the tier is that they can
 * ship before they are finished. Everything else is graduated.
 */
function gapsFor(component: LoadedComponent, propCount: number): string[] {
  const { meta } = component;
  const gaps: string[] = [];

  if (meta.status === "experimental") return gaps;

  if (!component.hasStory) gaps.push("no story file");
  if (meta.status === "stable" || meta.status === "beta") {
    if (!component.hasTest) gaps.push("no test file");
  }
  if (meta.status === "stable") {
    if (!meta.limitations.length) {
      gaps.push(
        "no limitations listed — every component has at least one, and an unstated one is a bug report",
      );
    }
    if (propCount === 0) {
      gaps.push("no props extracted — check the component's exported signature");
    }
  }

  return gaps;
}

export interface CoverageReport {
  rows: CoverageRow[];
  failures: string[];
}

export function buildCoverage(
  components: LoadedComponent[],
  propsByComponent: Map<string, ExtractedExport[]>,
): CoverageReport {
  const rows: CoverageRow[] = components.map((component) => {
    const propCount = propsByComponent.get(component.meta.name)?.[0]?.props.length ?? 0;
    return {
      name: component.meta.name,
      tier: component.meta.tier,
      status: component.meta.status,
      layer: component.meta.layer,
      hasStory: component.hasStory,
      hasTest: component.hasTest,
      documentedProps: propCount,
      states: component.meta.states.length,
      a11yNotes: component.meta.a11y.length,
      gaps: gapsFor(component, propCount),
    };
  });

  const failures = rows
    .filter((r) => r.gaps.length)
    .map((r) => `${r.name} (${r.status}): ${r.gaps.join("; ")}`);

  return { rows, failures };
}

export async function emitCoverage(report: CoverageReport, emitter: Emitter): Promise<void> {
  const byStatus = report.rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  await emitter.emit(
    paths.coverage,
    JSON.stringify(
      {
        _generated: banner("//")
          .split("\n")
          .map((l) => l.replace(/^\/\/ ?/, "")),
        total: report.rows.length,
        byStatus,
        withStory: report.rows.filter((r) => r.hasStory).length,
        withTest: report.rows.filter((r) => r.hasTest).length,
        components: report.rows,
      },
      null,
      2,
    ),
  );
}
