import { CoverageCard, coverageFromCareTeam } from "@/components/zoblocks/care-team-presence";
import { careTeamCoverageGap } from "./_shared/care-team";

const windows = coverageFromCareTeam(careTeamCoverageGap.participant ?? []);

export default function CoverageGap() {
  // 08:00 falls between the two windows.
  // → "Nobody is covering right now. Escalate to the on-call supervisor."
  return (
    <div className="w-full max-w-[320px]">
      <CoverageCard windows={windows} now="2026-08-24T08:00:00+05:30" />
    </div>
  );
}
