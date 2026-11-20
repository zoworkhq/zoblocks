import DemoSection from "./_shared/DemoSection";
import { InfusionLoader } from "@/components/zoblocks/infusion-loader";

export default function KnownProgressDemo() {
  return (
    <DemoSection>
      <InfusionLoader showLabel label="Importing records" progress={62} />
    </DemoSection>
  );
}
