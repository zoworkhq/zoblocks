import DemoSection from "./_shared/DemoSection";
import DemoSpec from "./_shared/DemoSpec";
import { Switch } from "@/components/zoblocks/switch";

export default function TonesDemo() {
  return (
    <DemoSection>
      <DemoSpec code="affirmative" note="on is the safe direction">
        <Switch label="Allergy interaction checking" stateLabels="enabled-disabled" checked />
      </DemoSpec>
      <DemoSpec code="caution" note="on removes a safety net">
        <Switch
          label="Suppress duplicate-therapy alerts"
          tone="caution"
          stateLabels="in-effect"
          checked
        />
      </DemoSpec>
      <DemoSpec code="critical" note="on suppresses a clinical check">
        <Switch
          label="Bypass allergy check for this order"
          tone="critical"
          stateLabels="allowed-blocked"
          checked
        />
      </DemoSpec>
      <DemoSpec code="neutral" note="no clinical direction at all">
        <Switch label="Show archived encounters" tone="neutral" checked />
      </DemoSpec>
    </DemoSection>
  );
}
