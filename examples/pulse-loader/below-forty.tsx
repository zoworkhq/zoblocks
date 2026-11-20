import DemoSection from "./_shared/DemoSection";
import { PulseLoader } from "@/components/zoblocks/pulse-loader";

export default function NamedSizeFallbackDemo() {
  return (
    <DemoSection>
      <div className="flex flex-wrap items-center justify-center gap-8">
        <PulseLoader size="sm" label="Loading" />
        <PulseLoader size="md" label="Loading" />
        <PulseLoader size="lg" label="Loading" />
        <PulseLoader size="xl" label="Loading" />
      </div>
    </DemoSection>
  );
}
