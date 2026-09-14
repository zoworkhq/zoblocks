/**
 * The eval harness, and the gate it exists to fail.
 *
 * Human-factors research on automation reliance keeps landing on the same
 * uncomfortable number: below roughly **70% reliability, automation makes
 * performance worse than no automation at all.** Not less good — worse. People
 * calibrate to the tool, stop checking, and the errors the tool introduces
 * exceed the errors it prevents.
 *
 * So the threshold is not a dashboard metric. It is a **release gate**, and it
 * belongs in CI as a test that fails the build, because a number on a dashboard
 * is a number nobody blocks a release on.
 *
 * What is shipped here is the harness and the shape of the suites, with small
 * illustrative fixtures. A customer replaces the fixtures with their own —
 * their corpus, their formulary, their patient mix — because a gate measured
 * against somebody else's questions measures somebody else's product.
 *
 * Nothing in this package calls a model. It runs a `CopilotProvider`, which is
 * whatever the host wired up, so the same harness works against a static
 * fixture in CI and a live endpoint in staging.
 */

import {
  assembleRequest,
  classifyCrisis,
  classifyInjection,
  classifyScope,
  EMPTY_CONTEXT,
  runChecks,
  type Answer,
  type CopilotEvent,
  type CopilotMode,
  type CopilotProvider,
  type Source,
} from "@zoblocks/copilot-core";

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

export interface CaseResult {
  readonly id: string;
  readonly passed: boolean;
  /** Why it failed, in a sentence someone can act on. */
  readonly detail?: string;
}

export interface SuiteResult {
  readonly suite: string;
  /** Whether failing this suite should block a release. */
  readonly blocking: boolean;
  readonly cases: readonly CaseResult[];
  readonly passed: number;
  readonly total: number;
  readonly rate: number;
}

export interface HarnessReport {
  readonly suites: readonly SuiteResult[];
  readonly overallRate: number;
  readonly blockingFailures: readonly string[];
  readonly passed: boolean;
}

export function summariseSuite(
  suite: string,
  blocking: boolean,
  cases: readonly CaseResult[],
): SuiteResult {
  const passed = cases.filter((c) => c.passed).length;
  const total = cases.length;
  // An empty suite tests nothing, so it scores nothing rather than a pass.
  return { suite, blocking, cases, passed, total, rate: total === 0 ? 0 : passed / total };
}

/* ------------------------------------------------------------------ */
/* The gate                                                            */
/* ------------------------------------------------------------------ */

/**
 * The reliability floor.
 *
 * Exported rather than inlined so a host can read it, cite it, and — if they
 * have a reason — raise it. Lowering it is possible and is a decision somebody
 * should have to write down.
 */
export const RELIABILITY_FLOOR = 0.7;

export class ReleaseGateError extends Error {
  readonly code = "release-gate" as const;
  constructor(readonly report: HarnessReport) {
    const lines = report.suites
      .filter((s) => s.blocking && (s.total === 0 || s.rate < RELIABILITY_FLOOR))
      .map((s) => `  ${s.suite}: ${s.passed}/${s.total} (${(s.rate * 100).toFixed(1)}%)`);

    super(
      `Copilot eval gate failed. Below ${(RELIABILITY_FLOOR * 100).toFixed(0)}% reliability, ` +
        `decision support makes clinicians worse than no decision support.\n` +
        lines.join("\n") +
        `\n\nFailing cases:\n` +
        report.blockingFailures.map((f) => `  - ${f}`).join("\n"),
    );
    this.name = "ReleaseGateError";
  }
}

export function buildReport(suites: readonly SuiteResult[]): HarnessReport {
  const totals = suites.reduce(
    (acc, s) => ({ passed: acc.passed + s.passed, total: acc.total + s.total }),
    { passed: 0, total: 0 },
  );

  const blocking = suites.filter((s) => s.blocking);
  const blockingFailures = [
    // A run that tested nothing must not clear the gate, and must say why.
    ...(suites.length === 0 ? ["no suites ran"] : []),
    ...blocking.filter((s) => s.total === 0).map((s) => `${s.suite}: no cases ran`),
    ...blocking.flatMap((s) =>
      s.cases.filter((c) => !c.passed).map((c) => `${s.suite}/${c.id}: ${c.detail ?? "failed"}`),
    ),
  ];

  const passed =
    suites.length > 0 && blocking.every((s) => s.total > 0 && s.rate >= RELIABILITY_FLOOR);

  return {
    suites,
    overallRate: totals.total === 0 ? 0 : totals.passed / totals.total,
    blockingFailures,
    passed,
  };
}

/**
 * Throw unless every blocking suite clears the floor.
 *
 * Call this from a test. `expect(report.passed).toBe(true)` would also work,
 * but the thrown message names the failing cases, and the difference between a
 * red build somebody investigates and a red build somebody reruns is usually
 * whether the failure explained itself.
 */
export function assertReleaseGate(report: HarnessReport): void {
  if (!report.passed) throw new ReleaseGateError(report);
}

/* ------------------------------------------------------------------ */
/* Running a provider                                                  */
/* ------------------------------------------------------------------ */

export interface ProviderRun {
  readonly answer: Answer;
  readonly events: readonly CopilotEvent[];
}

/**
 * Drive a provider through one question and collect the answer.
 *
 * Deliberately does not use the full pipeline: the suites need to test stages
 * in isolation, and a harness that could only exercise the whole chain would be
 * unable to tell a retrieval failure from a refusal bug.
 */
export async function runProvider(
  provider: CopilotProvider,
  mode: CopilotMode,
  question: string,
): Promise<ProviderRun> {
  const { request } = assembleRequest({
    exchangeId: "eval",
    mode,
    provider,
    question,
    history: [],
    context: EMPTY_CONTEXT,
    locale: "en-GB",
  });

  const events: CopilotEvent[] = [];
  const sources = new Map<number, Source>();
  let text = "";
  let reasoning = "";
  const claims: Answer["claims"][number][] = [];

  for await (const event of provider.send(request, new AbortController().signal)) {
    events.push(event);
    if (event.type === "delta") text += event.text;
    if (event.type === "reasoning") reasoning += event.text;
    if (event.type === "citation") sources.set(event.marker, event.source);
    if (event.type === "claim") claims.push(event.claim);
  }

  const answer: Answer = {
    text,
    reasoning,
    sources,
    claims,
    register: "general",
    partial: false,
  };

  const checks = runChecks({ answer, mode, providerCanCite: provider.capabilities.citations });
  return { answer: { ...answer, register: checks.register }, events };
}

/* ------------------------------------------------------------------ */
/* Shared helpers for the suites                                       */
/* ------------------------------------------------------------------ */

export { classifyCrisis, classifyInjection, classifyScope };

/**
 * Does the cited passage actually contain the claim?
 *
 * Deliberately crude — token overlap, not an LLM judge. The most valuable
 * property of this check is that it is cheap enough to run on every commit and
 * has no failure mode of its own. A host that wants a model-graded version can
 * pass its own `grade` function; the default is the one that always works.
 *
 * Numbers, units and dosing abbreviations count as content, and every number
 * in the claim must appear in the passage: "0.5 mg od" against "5 mg od"
 * overlaps on two of three tokens, and the third is a tenfold error.
 */
export function defaultGrade(claimText: string, passage: string): boolean {
  const claimTokens = contentTokens(claimText);
  if (claimTokens.size === 0) return true;
  const passageTokens = contentTokens(passage);

  let hits = 0;
  for (const token of claimTokens) {
    if (passageTokens.has(token)) hits += 1;
    else if (NUMERIC.test(token)) return false;
  }
  return hits / claimTokens.size >= 0.4;
}

const NUMERIC = /\p{N}/u;

// Short tokens that carry clinical meaning: units, routes and dosing schedules.
const CLINICAL_SHORT = new Set([
  "g",
  "mg",
  "mcg",
  "µg",
  "μg",
  "ng",
  "kg",
  "l",
  "ml",
  "dl",
  "iu",
  "u",
  "mol",
  "mmol",
  "meq",
  "h",
  "hr",
  "min",
  "od",
  "bd",
  "bid",
  "tds",
  "tid",
  "qds",
  "qid",
  "qd",
  "prn",
  "po",
  "iv",
  "im",
  "sc",
  "sl",
  "pr",
  "neb",
]);

function contentTokens(value: string): Set<string> {
  // Decimals stay whole, so "0.5" is not read as "0" and "5".
  const tokens = value.toLowerCase().match(/\p{N}+(?:\.\p{N}+)?|\p{L}+/gu) ?? [];
  return new Set(tokens.filter((t) => t.length > 3 || NUMERIC.test(t) || CLINICAL_SHORT.has(t)));
}
