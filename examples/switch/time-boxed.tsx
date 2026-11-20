import * as React from "react";
import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

function TimeBoxedSwitch() {
  const START = "2026-08-16T13:00:00.000Z";
  const UNTIL = "2026-08-16T13:00:12.000Z";
  const [now, setNow] = React.useState(START);
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    if (!on) return;
    const id = window.setInterval(
      () => setNow((current) => new Date(Date.parse(current) + 2000).toISOString()),
      1000,
    );
    return () => window.clearInterval(id);
  }, [on]);

  return (
    <Switch
      label="Nil by mouth"
      description="Set for theatre. Shows on the bed board, the diet list and the handover."
      stateLabels="in-effect"
      tone="caution"
      size="large"
      checked={on}
      now={now}
      until={UNTIL}
      untilWarnMs={6000}
      onCommit={(next) => {
        setOn(next);
        if (next) setNow(START);
      }}
      onExpire={() => {}}
    />
  );
}

export default function TimeBoxedDemo() {
  return (
    <DemoSection>
      <TimeBoxedSwitch />
    </DemoSection>
  );
}
