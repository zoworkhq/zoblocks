import * as React from "react";
import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

export default function OfflineAndOvertakenDemo() {
  const [online, setOnline] = React.useState(false);
  const [fallsRisk, setFallsRisk] = React.useState(false);
  const [mine, setMine] = React.useState(true);
  const [theirs, setTheirs] = React.useState<boolean | undefined>(undefined);

  return (
    <DemoSection>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => setOnline((value) => !value)}
          className="w-fit rounded-md border border-[var(--zb-border)] px-3 py-1.5 text-sm text-[var(--zb-text)]"
        >
          {online ? "connected — tap to go offline" : "offline — tap to reconnect"}
        </button>
        <Switch
          label="Falls risk"
          description="Adds the bed sensor to the round list."
          stateLabels="in-effect"
          size="large"
          checked={fallsRisk}
          online={online}
          onCommit={setFallsRisk}
        />
      </div>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => setTheirs((value) => (value === undefined ? !mine : undefined))}
          className="w-fit rounded-md border border-[var(--zb-border)] px-3 py-1.5 text-sm text-[var(--zb-text)]"
        >
          {theirs === undefined ? "simulate: S. Mehta changes it too" : "clear the conflict"}
        </button>
        <Switch
          label="Contact precautions"
          description="Gown and gloves on entry."
          stateLabels="in-effect"
          tone="caution"
          size="large"
          checked={mine}
          serverValue={theirs}
          onCommit={setMine}
          onResolveConflict={(keep) => {
            if (keep === "theirs" && theirs !== undefined) setMine(theirs);
            setTheirs(undefined);
          }}
        />
      </div>
    </DemoSection>
  );
}
