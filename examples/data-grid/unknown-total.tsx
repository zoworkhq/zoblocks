import { CASELOAD, DemoGrid, Example } from "./_shared/shared";

export default function ATotalTheSourceWillNotGive() {
  return (
    <Example>
      <DemoGrid
        rows={CASELOAD}
        coverage={{ shown: CASELOAD.length, total: "unknown", noun: "clients" }}
      />
    </Example>
  );
}
