/**
 * Every gate CI runs must be runnable locally.
 *
 * `scripts/verify.sh` opens by asking whoever adds a CI step to add it here
 * too. That instruction held for a while and then stopped: CI grew a bundle
 * budget, a dependency audit, a synthetic-data scan, an accessibility audit and
 * a three-engine browser suite, and `verify` had four of the five missing. Each
 * gap was found the same way — a red pull request, fifteen minutes after a push,
 * for something that takes seconds to check on a laptop.
 *
 * A comment cannot enforce that. This can: it reads the workflow, reads the
 * script, and fails when a CI step is neither mapped to a local gate nor
 * explicitly declared as setup. Adding a step to `ci.yml` therefore forces a
 * decision rather than allowing an omission.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW = readFileSync(path.join(ROOT, ".github/workflows/ci.yml"), "utf8");
const VERIFY = readFileSync(path.join(ROOT, "scripts/verify.sh"), "utf8");

/**
 * CI steps that are not gates, and why.
 *
 * Setup, artefact upload and deployment. A gate asserts something about the
 * code; these prepare for one or act on its result. Anything not listed here
 * and not mapped below fails the test.
 */
const NOT_A_GATE = new Set([
  "Cache mongod binary",
  "Cache Turbo",
  "Install",
  "Resolve the Playwright version",
  "Cache Playwright browsers",
  "Install Playwright browsers",
  "Install Playwright system dependencies",
  "Upload the Playwright report on failure",
  // Reports on the run that just happened; it asserts nothing itself.
  "Report flaky tests",
  // Deployment jobs: they run after the gates, and act rather than assert.
  "Deploy",
  "Verify the deployed registry",
  "Verify hq is serving hq",
  "Deploy preview",
]);

/**
 * CI step name → the command `verify.sh` must invoke for it.
 *
 * Matched on the command rather than on the gate's display label, because the
 * label is prose and the command is the contract.
 */
const GATE_COMMANDS: Record<string, string> = {
  "Generate and enforce the catalog quality gate": "pnpm gen:check",
  "No stale generated files": "pnpm gen:check",
  "Audit dependencies": "pnpm audit --audit-level=high",
  Lint: "pnpm lint",
  Format: "pnpm format:check",
  Typecheck: "pnpm typecheck",
  "Coverage thresholds": "pnpm test:coverage",
  Build: "pnpm build",
  "Accessibility (WCAG 2.2 AA, both themes)": "scripts/verify-a11y.sh",
  "Browser accessibility and cross-framework smoke": "pnpm e2e:ci",
  "Bundle budgets": "pnpm size",
  "Architecture rules": "pnpm deps",
  "Scan for non-synthetic identifiers": "scripts/no-phi.sh",
};

/** Every `- name:` in the workflow, which is every step that has one. */
function workflowStepNames(): string[] {
  return [...WORKFLOW.matchAll(/^\s+- name:\s+(.+?)\s*$/gm)].map((m) => m[1] ?? "");
}

describe("local verification covers what CI enforces", () => {
  const steps = workflowStepNames();

  it("finds the workflow steps at all", () => {
    // Guards the parser: a formatting change in the workflow must not make
    // every assertion below pass against an empty list.
    expect(steps.length).toBeGreaterThan(10);
    expect(steps).toContain("Typecheck");
  });

  it("has every CI step either mapped to a local gate or declared as setup", () => {
    const unaccounted = steps.filter((name) => !NOT_A_GATE.has(name) && !(name in GATE_COMMANDS));

    expect(
      unaccounted,
      `These CI steps are neither a known gate nor declared setup:\n` +
        unaccounted.map((n) => `  · ${n}`).join("\n") +
        `\n\nAdd the equivalent to scripts/verify.sh and map it in GATE_COMMANDS, ` +
        `or add it to NOT_A_GATE with a reason.`,
    ).toEqual([]);
  });

  it("runs each mapped gate's command in verify.sh", () => {
    const missing = Object.entries(GATE_COMMANDS)
      .filter(([, command]) => !VERIFY.includes(command))
      .map(([step, command]) => `${step} → verify.sh never runs \`${command}\``);

    expect(missing, missing.join("\n")).toEqual([]);
  });

  it("keeps the audit and the synthetic-data scan in the fast tier", () => {
    /*
     * Both are nearly free — the audit took one second in CI and the scan is a
     * pair of greps — and both can fail a build. A gate that cheap belongs
     * where it costs a developer one second rather than one push.
     *
     * Asserted by position: everything before the `--fast` branch runs in every
     * tier.
     */
    const fastSection = VERIFY.slice(0, VERIFY.indexOf('if [ "$FAST" -eq 0 ]'));
    expect(fastSection).toContain("pnpm audit --audit-level=high");
    expect(fastSection).toContain("scripts/no-phi.sh");
  });

  it("offers a tier that runs the browser gates", () => {
    // The gap that cost three red builds in a week. `--ci` is what makes the
    // browser suite runnable before a push rather than after one.
    expect(VERIFY).toContain("--ci");
    const ciSection = VERIFY.slice(VERIFY.indexOf('if [ "$FULL_CI" -eq 1 ]'));
    expect(ciSection).toContain("pnpm e2e:ci");
    expect(ciSection).toContain("scripts/verify-a11y.sh");
  });
});
