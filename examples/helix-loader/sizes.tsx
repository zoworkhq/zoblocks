import DemoSection from "./_shared/DemoSection";
import { HelixLoader } from "@/components/zoblocks/helix-loader";

export default function FourSizesDemo() {
  return (
    <DemoSection>
      <div className="flex flex-wrap items-center justify-center gap-8">
        <HelixLoader size="sm" label="Running" />
        <HelixLoader size="md" label="Running" />
        <HelixLoader size="lg" label="Running" />
        <HelixLoader size="xl" label="Running" />
      </div>
    </DemoSection>
  );
}
