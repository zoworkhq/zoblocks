import DemoSection from "./_shared/DemoSection";
import { InfusionLoader } from "@/components/zoblocks/infusion-loader";

export default function BeforeTotalKnownDemo() {
  return (
    <DemoSection>
      <InfusionLoader showLabel label="Preparing the export" />
    </DemoSection>
  );
}
