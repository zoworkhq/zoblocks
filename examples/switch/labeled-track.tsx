import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

export default function LabeledTrackDemo() {
  return (
    <DemoSection>
      <Switch
        label="Interpreter required"
        appearance="labeled"
        stateLabels="active-inactive"
        defaultChecked
        size="large"
      />
      <Switch
        label="Interpreter required"
        appearance="labeled"
        stateLabels="active-inactive"
        defaultChecked={false}
        size="large"
      />
    </DemoSection>
  );
}
