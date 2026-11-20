import { CASELOAD, DemoGrid, Example } from "./_shared/shared";

export default function EverythingWithNothingHidden() {
  return (
    <Example>
      <DemoGrid
        rows={CASELOAD}
        coverage={{ shown: CASELOAD.length, total: CASELOAD.length, noun: "referrals" }}
      />
    </Example>
  );
}
