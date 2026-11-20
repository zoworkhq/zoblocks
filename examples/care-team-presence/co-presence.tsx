import { useState } from "react";
import { ChartCoPresence } from "@/components/zoblocks/care-team-presence";
import { marsh, serverTime } from "./_shared/care-team";

export default function CoPresence() {
  const [last, setLast] = useState<string | null>(null);

  const openReadOnly = () => setLast("Opened their draft, read-only.");
  const requestHandoff = () => setLast("Requested a handoff.");
  const startAddendum = () => setLast("Started a separate addendum.");

  return (
    <div className="grid w-full max-w-[420px] gap-2.5">
      <ChartCoPresence
        others={[
          {
            clinician: marsh,
            activity: "documenting",
            since: "2026-08-24T09:12:00+05:30",
            target: "Progress note",
            unsigned: true,
          },
        ]}
        now={serverTime}
        onOpenTheirs={openReadOnly}
        onRequestHandoff={requestHandoff}
        onSeparateAddendum={startAddendum}
      />
      <span className="text-xs opacity-60">
        {last ??
          "Pick one — none is highlighted, because which is right depends on facts this component does not have."}
      </span>
    </div>
  );
}
