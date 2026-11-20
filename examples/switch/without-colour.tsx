import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

export default function WithoutColourDemo() {
  return (
    <DemoSection>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 grayscale">
        <Switch label="Off" checked={false} />
        <Switch label="On" checked />
        <Switch label="Advance directive" checked="unknown" absentReason="not-collected" />
        <Switch label="Contact precautions" checked readOnly />
      </div>
    </DemoSection>
  );
}
