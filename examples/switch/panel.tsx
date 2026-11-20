import DemoSection from "./_shared/DemoSection";
import { SwitchField, SwitchList } from "@/components/zoblocks/switch";

export default function PanelDemo() {
  return (
    <DemoSection>
      <SwitchList
        title="Isolation precautions"
        counts={{ on: 2, total: 4, unknown: 1 }}
        provenance={{ by: "S. Mehta", at: "2026-08-16T14:07:00.000Z" }}
      >
        <SwitchField
          label="Contact"
          description="Gown and gloves on entry."
          stateLabels="in-effect"
          tone="caution"
          checked
        />
        <SwitchField
          label="Droplet"
          description="Surgical mask within two metres."
          stateLabels="in-effect"
          tone="caution"
          checked
        />
        <SwitchField
          label="Airborne"
          description="Negative-pressure room and N95."
          stateLabels="in-effect"
          checked={false}
          readOnly
          lockedReason="No negative-pressure room available on this unit."
        />
        <SwitchField
          label="Enteric"
          description="Dedicated commode; soap and water, not alcohol gel."
          stateLabels="in-effect"
          checked="unknown"
          absentReason="not-collected"
        />
      </SwitchList>
    </DemoSection>
  );
}
