import { CASELOAD, DemoGrid, Example } from "./_shared/shared";

export default function ARefusalNotANineSecondPaint() {
  return (
    <Example>
      <DemoGrid
        rows={CASELOAD}
        ceiling={4}
        coverage={{ shown: CASELOAD.length, total: 1438, noun: "patients" }}
      />
    </Example>
  );
}
