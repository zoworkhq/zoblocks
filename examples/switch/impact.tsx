import * as React from "react";
import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

function LiveSwitch(props: React.ComponentProps<typeof Switch>) {
  const [value, setValue] = React.useState(false);

  return (
    <Switch
      {...props}
      checked={value}
      onCommit={async (next) => {
        await new Promise((resolve) => setTimeout(resolve, 700));
        setValue(next);
      }}
    />
  );
}

export default function ImpactDemo() {
  return (
    <DemoSection>
      <LiveSwitch
        label="Add to the deteriorating-patient list"
        stateLabels="in-effect"
        tone="caution"
        size="large"
        impact={[
          "page the outreach team on call now",
          "add a banner to the bed board, visible to visitors",
          "set hourly observations for 24 hours",
        ]}
        provenance={{ by: "J. Adeyemi", at: "2026-08-16T06:40:00.000Z", via: "ward round" }}
      />
    </DemoSection>
  );
}
