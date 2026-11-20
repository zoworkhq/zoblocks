import { Recorder } from "@/components/zoblocks/recorder";
import { DEMO_SOURCE } from "./_shared/recorder-fixtures";

export function CompactControlExample() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <Recorder variant="pulse" phase="recording" source={DEMO_SOURCE} />
    </section>
  );
}

export default CompactControlExample;
