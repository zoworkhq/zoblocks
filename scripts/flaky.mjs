/**
 * Report tests that only passed on a retry.
 *
 * CI retries a failed browser test once, which is the right default: a
 * genuinely intermittent failure should not block a merge by itself. The cost
 * is that a flake becomes invisible — the job is green, the retry is buried in
 * a log nobody opens, and the test keeps decaying until it fails twice and
 * looks like a new bug.
 *
 * Three real flakes surfaced in one week here, and all three were found because
 * somebody happened to be reading the output. All three had the same cause: a
 * fixed `waitForTimeout` before an assertion, which asserts the speed of the
 * machine as much as the behaviour of the code. That class is worth catching
 * early, and it is only catchable if someone is told it happened.
 *
 * Reads Playwright's JSON report and writes any retried-but-passed test into
 * the job summary. Exits 0 always: a flake is a warning, not a failure — the
 * suite's own result already decided whether the build passes.
 */

import { readFileSync, appendFileSync, existsSync } from "node:fs";

const REPORT = process.argv[2] ?? "playwright-report/results.json";

if (!existsSync(REPORT)) {
  // The suite may not have run at all — a skipped job, or a failure before
  // Playwright started. Saying nothing is correct; failing here would report a
  // problem in the wrong place.
  process.exit(0);
}

/** Walk the suite tree; Playwright nests suites arbitrarily deep. */
function* eachTest(suite, trail = []) {
  const here = suite.title ? [...trail, suite.title] : trail;
  for (const child of suite.suites ?? []) yield* eachTest(child, here);
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      yield { title: [...here, spec.title].join(" › "), test };
    }
  }
}

let report;
try {
  report = JSON.parse(readFileSync(REPORT, "utf8"));
} catch (error) {
  console.log(`flaky: could not read ${REPORT} — ${error.message}`);
  process.exit(0);
}

const flaky = [];
for (const suite of report.suites ?? []) {
  for (const { title, test } of eachTest(suite)) {
    // Playwright marks a test "flaky" when an attempt failed and a later one
    // passed. Fall back to counting attempts, so this still works if that
    // status is ever absent.
    const attempts = test.results?.length ?? 0;
    const failedAttempts = (test.results ?? []).filter((r) => r.status === "failed").length;
    if (test.status === "flaky" || (attempts > 1 && failedAttempts > 0 && test.status !== "unexpected")) {
      flaky.push({
        title,
        project: test.projectName ?? "",
        attempts,
        error: (test.results ?? []).find((r) => r.status === "failed")?.error?.message ?? "",
      });
    }
  }
}

if (flaky.length === 0) {
  console.log("flaky: none — every test passed on its first attempt.");
  process.exit(0);
}

const lines = [
  `### ${flaky.length} flaky test${flaky.length === 1 ? "" : "s"}`,
  "",
  "These failed and then passed on a retry, so the build is green. They are",
  "still defects: a test that needs a second attempt is measuring the machine",
  "as much as the code, and it will eventually fail twice and look like a new bug.",
  "",
  "| Test | Project | Attempts |",
  "| --- | --- | --- |",
  ...flaky.map((f) => `| ${f.title.replace(/\|/g, "\\|")} | ${f.project} | ${f.attempts} |`),
  "",
  "The usual cause here is a fixed `waitForTimeout` before an assertion.",
  "Prefer `expect(...).toPass()`, an auto-retrying assertion, or an explicit",
  "signal from the component that it has settled.",
];

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) appendFileSync(summary, lines.join("\n") + "\n");

for (const f of flaky) {
  console.log(`::warning::Flaky: ${f.title} [${f.project}] passed after ${f.attempts} attempts`);
}
