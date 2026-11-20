import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

export default function LockedDemo() {
  return (
    <DemoSection>
      <Switch
        label="Contact precautions"
        stateLabels="in-effect"
        checked
        readOnly
        lockedReason="Encounter signed 14:32 by Dr Okafor."
      />
      <Switch
        label="Change diet order"
        stateLabels="allowed-blocked"
        checked={false}
        readOnly
        lockedReason="Your role cannot change this."
      />
      <Switch
        label="Airborne precautions"
        stateLabels="in-effect"
        checked={false}
        readOnly
        lockedReason="Requires a negative-pressure room, and none is free on this unit."
      />
      <Switch label="Notify by SMS" stateLabels="enabled-disabled" checked disabled />
    </DemoSection>
  );
}
