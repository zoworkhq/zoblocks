import { PresenceChip } from "@/components/zoblocks/care-team-presence";
import { boateng, marsh, vance } from "./_shared/care-team";

export default function NotAGreenDot() {
  return (
    <div className="grid w-full max-w-[420px] gap-3.5">
      <PresenceChip presence={{ clinician: marsh, state: "in-session", until: "15:50" }} />

      <PresenceChip
        presence={{
          clinician: vance,
          state: "signed-out",
          coveredBy: boateng,
          until: "07:00",
        }}
      />
    </div>
  );
}
