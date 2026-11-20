import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

export default function DeferredFormDemo() {
  return (
    <DemoSection>
      <Switch
        label="Text me when my results are ready"
        description="Saved when you submit the form."
        stateLabels="enabled-disabled"
        commit="deferred"
        defaultChecked={false}
        size="large"
      />
      <Switch
        label="Share my records with my GP"
        stateLabels="given-declined"
        commit="deferred"
        defaultChecked={false}
        size="large"
      />
    </DemoSection>
  );
}
