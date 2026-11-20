import { Recorder } from "@/components/zoblocks/recorder";
import { DEMO_PEAKS } from "./_shared/recorder-fixtures";

export function PlaybackWithoutDiarisationExample() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <Recorder
        variant="duet"
        phase="ready"
        peaks={DEMO_PEAKS}
        speakers={null}
        durationMs={754_000}
      />
    </section>
  );
}

export default PlaybackWithoutDiarisationExample;
