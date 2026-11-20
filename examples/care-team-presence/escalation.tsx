import {
  PresenceChip,
  resolveEscalation,
  type Presence,
} from "@/components/zoblocks/care-team-presence";
import { marsh, okafor } from "./_shared/care-team";

const withCover: Presence = { clinician: marsh, state: "in-group", coveredBy: okafor };
const withoutCover: Presence = { clinician: marsh, state: "in-group" };

export default function Escalation() {
  // → { kind: "covering", clinician: okafor, instead: marsh, reason: "L. Marsh, LCSW is in group" }
  const covered = resolveEscalation(withCover);
  // → { kind: "override-required", … }
  const uncovered = resolveEscalation(withoutCover);

  return (
    <div className="grid w-full max-w-[420px] gap-3.5">
      <div className="grid gap-1">
        <PresenceChip presence={withCover} />
        <span className="text-xs opacity-60">
          {covered.kind}: with cover named, the chip offers the cover.
        </span>
      </div>
      <div className="grid gap-1">
        <PresenceChip presence={withoutCover} />
        <span className="text-xs opacity-60">
          {uncovered.kind}: with nobody covering, it offers an override instead.
        </span>
      </div>
    </div>
  );
}
