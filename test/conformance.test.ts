/**
 * No stable component regresses below the standard.
 *
 * `scripts/conformance.ts` is the report a human reads; this is the gate. They
 * share the script so the number in the report and the number CI enforces
 * cannot drift — two implementations of "conformance" is how a dashboard ends
 * up greener than the build.
 *
 * Only stable components fail the build. A beta component missing its SEO
 * block is a component that has not been promoted yet, which is the system
 * working; a stable one missing it is a claim the library made and did not
 * keep.
 */

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

interface Report {
  checks: Array<{ id: string; group: string; requiredAt: string }>;
  rows: Array<{
    name: string;
    status: string;
    passed: number;
    applicable: number;
    failures: string[];
  }>;
}

const report: Report = JSON.parse(
  execFileSync("npx", ["tsx", "scripts/conformance.ts", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  }),
);

describe("the component standard", () => {
  it("has checks in every group", () => {
    const groups = new Set(report.checks.map((c) => c.group));
    expect([...groups].sort()).toEqual(["content", "evidence", "metadata", "regions"]);
    expect(report.checks.length).toBeGreaterThanOrEqual(30);
  });

  it("measures every catalogued component", () => {
    expect(report.rows.length).toBeGreaterThan(15);
  });

  const stable = report.rows.filter((r) => r.status === "stable");

  it("has stable components to check", () => {
    expect(stable.length).toBeGreaterThan(0);
  });

  it.each(stable.map((r) => [r.name, r] as const))(
    "%s meets the standard in full",
    (_name, row) => {
      expect(row.failures).toEqual([]);
    },
  );

  /*
   * Every tier is held to the checks that apply to it, not only stable.
   *
   * A beta component with no live preview is still a component nobody can see,
   * and the reason the first audit found six of them was that nothing outside
   * the promotion gate was ever measured.
   */
  it.each(report.rows.map((r) => [r.name, r] as const))(
    "%s meets every check that applies at its tier",
    (_name, row) => {
      expect(row.failures).toEqual([]);
    },
  );
});
