import { Recorder } from "@/components/zoblocks/recorder";
import { BUILTIN_DEVICE, DEMO_DEVICE, DEMO_SOURCE } from "./_shared/recorder-fixtures";

export function WrongMicrophoneExample() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <Recorder
        variant="bars"
        phase="recording"
        source={DEMO_SOURCE}
        device={BUILTIN_DEVICE}
        expectedDevice={DEMO_DEVICE}
      />
    </section>
  );
}

export default WrongMicrophoneExample;
