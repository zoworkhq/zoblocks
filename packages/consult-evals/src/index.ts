/**
 * @oxygenui-design/consult-evals — the harness and the gate.
 *
 * Shipped as a package rather than described in a document, because the whole
 * argument of this component is that verification should be cheaper than
 * acceptance, and that has to apply to the component itself.
 *
 *     import { assertReleaseGate, buildReport, crisisResponse, CRISIS_CASES }
 *       from "@oxygenui-design/consult-evals";
 *
 *     it("clears the release gate", () => {
 *       const report = buildReport([crisisResponse({ cases: OUR_CASES })]);
 *       assertReleaseGate(report);
 *     });
 *
 * Replace the fixtures with your own before you rely on the result.
 */

export {
  assertReleaseGate,
  buildReport,
  defaultGrade,
  RELIABILITY_FLOOR,
  ReleaseGateError,
  runProvider,
  summariseSuite,
  type CaseResult,
  type HarnessReport,
  type ProviderRun,
  type SuiteResult,
} from "./harness.js";

export {
  citationFaithfulness,
  crisisResponse,
  injectionResistance,
  refusalCorrectness,
  retrievalAccuracy,
  type CrisisCase,
  type FaithfulnessCase,
  type InjectionCase,
  type RefusalCase,
  type RetrievalCase,
} from "./suites.js";

export { CRISIS_CASES, INJECTION_CASES, REFUSAL_CASES } from "./fixtures.js";
