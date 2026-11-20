import { Recorder } from "@/components/zoblocks/recorder";
import { DEMO_SOURCE } from "./_shared/recorder-fixtures";

export function InlineDictationExample() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <Recorder
        variant="strip"
        phase="recording"
        source={DEMO_SOURCE}
        context="History of presenting complaint"
        onSend={() => {}}
      />
    </section>
  );
}

export default InlineDictationExample;
