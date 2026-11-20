import DemoSection from "./_shared/DemoSection";
import { HelixLoader } from "@/components/zoblocks/helix-loader";

export default function SlowWaitWayOutDemo() {
  return (
    <DemoSection>
      <div className="flex min-h-[200px] items-center justify-center">
        <HelixLoader
          showLabel
          label="Running the panel"
          slowAfter={3000}
          slowHint="The analyser is slower than usual. You can leave this page; the result will be filed."
          actions={
            <button
              type="button"
              className="rounded-md border border-[var(--zb-border)] px-3 py-1.5 text-sm text-[var(--zb-text)]"
            >
              Leave this page
            </button>
          }
        />
      </div>
    </DemoSection>
  );
}
