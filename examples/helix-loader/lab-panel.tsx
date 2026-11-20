import DemoSection from "./_shared/DemoSection";
import { HelixLoader } from "@/components/zoblocks/helix-loader";

export default function WhilePanelRunsDemo() {
  return (
    <DemoSection>
      <div className="flex min-h-[200px] items-center justify-center">
        <HelixLoader
          showLabel
          label="Running the panel"
          hint="Results usually arrive within a minute."
        />
      </div>
    </DemoSection>
  );
}
