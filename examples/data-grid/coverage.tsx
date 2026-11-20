import { CASELOAD, CASELOAD_COVERAGE, DemoGrid, Example } from "./_shared/shared";

export default function CoverageIsArithmetic() {
  return (
    <Example>
      <DemoGrid rows={CASELOAD} coverage={CASELOAD_COVERAGE} />
    </Example>
  );
}
