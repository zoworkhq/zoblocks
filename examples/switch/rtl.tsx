import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

export default function RightToLeftDemo() {
  return (
    <DemoSection>
      <Switch label="Label at the end (default)" stateLabels="yes-no" checked />
      <Switch label="Label at the start" stateLabels="yes-no" labelPlacement="start" checked />
      <div dir="rtl" className="rounded-lg border border-[var(--zb-border)] p-3">
        <Switch label="مترجم مطلوب" stateLabels="yes-no" checked />
      </div>
    </DemoSection>
  );
}
