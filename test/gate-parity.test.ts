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

/*
 * Both halves of the pipeline, concatenated.
 *
 * The gate set moved into `verify.yml`, a reusable workflow, when `ci.yml` and
 * `release.yml` were found running nine of the same gates against the same
 * commit on two runners. `ci.yml` still holds the deploy and versioning steps,
 * so reading only one of the two files would leave half the pipeline
 * unchecked — and reading only `ci.yml`, as this did, would now check almost
 * nothing at all.
 *
 * `publish.yml` is deliberately absent: it calls `verify.yml` rather than
 * listing gates of its own, which is the whole point of the split. A gate there
 * would have to be added here first.
 */
const WORKFLOW = [".github/workflows/verify.yml", ".github/workflows/ci.yml"]
  .map((file) => readFileSync(path.join(ROOT, file), "utf8"))
  .join("\n");
const VERIFY = readFileSync(path.join(ROOT, "scripts/verify.sh"), "utf8");

/**
 * CI steps that are not gates, and why.
 *
 * Setup, artefact upload and deployment. A gate asserts something about the
 * code; these prepare for one or act on its result. Anything not listed here
 * and not mapped below fails the test.
 */
const NOT_A_GATE = new Set([
  // Checkout, pnpm, Node and the mongod/Turbo caches live in the
  // `.github/actions/setup` composite now, so they no longer appear here.
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
  // Same shape as hq's: it asserts a deployment, which is the one thing a
  // local run has no equivalent of. It also self-skips until the domain is
  // attached — `app.zoblocks.design` has no DNS record yet.
  "Verify the console is serving its catalogue",
  "Deploy preview",
  // Writes the deployment URL into the run summary.
  "Summarise",
  // Versioning: it edits manifests and changelogs and opens a pull request.
  // Nothing about the code is asserted, and publishing is `publish.yml`'s job.
  "Open or update the Version PR",
  "Push the Version branch when Actions may not open the PR",
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
  "Every package is publishable": "pnpm release:check",
  "Accessibility (WCAG 2.2 AA, both themes)": "scripts/verify-a11y.sh",
  "Browser accessibility and cross-framework smoke": "pnpm e2e:ci",
  "Bundle budgets": "pnpm size",
  "Architecture rules": "pnpm deps",
  "Scan for non-synthetic identifiers": "scripts/no-phi.sh",
  "Scan for the retired name": "scripts/retired-names.sh",
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

  it("runs the same gates on a draft pull request as `verify --fast`", () => {
    /*
     * A draft pull request gets `verify.yml`'s fast tier: every step without
     * `inputs.tier == 'full'` in its condition. The pre-push hook runs
     * `verify --fast`. If a static gate is in one list and not the other, a
     * draft can go green on something that pre-push would have stopped, or the
     * other way round.
     *
     * Compared by command, as above, on both sides of the `--fast` branch.
     */
    const verifyYml = readFileSync(path.join(ROOT, ".github/workflows/verify.yml"), "utf8");
    const chunks = verifyYml.split(/^ {6}- (?=name:|uses:)/m).slice(1);
    const fastTierCi = chunks
      .map((chunk) => ({
        name: /^name:\s+(.+?)\s*$/m.exec(chunk)?.[1],
        fullOnly: /^\s+if:.*inputs\.tier == 'full'/m.test(chunk),
      }))
      .filter((step) => step.name && !step.fullOnly && step.name in GATE_COMMANDS)
      .map((step) => GATE_COMMANDS[step.name as string]);

    const fastSection = VERIFY.slice(0, VERIFY.indexOf('if [ "$FAST" -eq 0 ]'));
    const fullOnlySection = VERIFY.slice(VERIFY.indexOf('if [ "$FAST" -eq 0 ]'));
    const localFast = Object.values(GATE_COMMANDS).filter(
      (command) => fastSection.includes(command) && !fullOnlySection.includes(command),
    );

    expect(fastTierCi.length).toBeGreaterThan(5);
    expect(new Set(fastTierCi)).toEqual(new Set(localFast));
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
