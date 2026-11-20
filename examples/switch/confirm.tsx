import * as React from "react";
import DemoSection from "./_shared/DemoSection";
import DemoSpec from "./_shared/DemoSpec";
import { Switch } from "@/components/zoblocks/switch";

function LiveSwitch({ ...props }: React.ComponentProps<typeof Switch>) {
  const [value, setValue] = React.useState<boolean | "unknown">(
    (props.checked as boolean | "unknown" | undefined) ?? false,
  );
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

export default function ConfirmationsDemo() {
  return (
    <DemoSection>
      <DemoSpec code='confirm="hold"' note="600ms, gloves, one hand">
        <LiveSwitch
          label="Suspend fall-risk alarm"
          stateLabels="in-effect"
          tone="critical"
          confirm="hold"
        />
      </DemoSpec>
      <DemoSpec code='confirm="dialog"' note="names the patient and the consequence">
        <LiveSwitch
          label="Discharge to home"
          stateLabels="active-inactive"
          confirm="dialog"
          confirmCopy={{
            subject: "Ada Lovelace",
            consequence: "Closes the encounter and releases the bed. This cannot be undone.",
          }}
        />
      </DemoSpec>
      <DemoSpec code='confirm="attest"' note="the typed reason is the deliverable">
        <LiveSwitch
          label="Bypass allergy check for this order"
          stateLabels="allowed-blocked"
          tone="critical"
          confirm="attest"
        />
      </DemoSpec>
      <DemoSpec code='confirm="countersign"' note="a second person, not the requester">
        <LiveSwitch
          label="Release restraint order"
          stateLabels="active-inactive"
          tone="critical"
          confirm="countersign"
          countersign={{
            role: "registered-nurse",
            notSameAs: "s.mehta",
            requestedBy: "S. Mehta, RN",
            verify: () =>
              new Promise<string>((resolve) => setTimeout(() => resolve("j.adeyemi"), 600)),
          }}
        />
      </DemoSpec>
    </DemoSection>
  );
}
