import { Recorder } from "@/components/zoblocks/recorder";
import { DEMO_MARKERS, DEMO_PEAKS, DEMO_SPEAKERS } from "./_shared/recorder-fixtures";

export function PlaybackWithSpeakersExample() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <Recorder
        variant="duet"
        phase="ready"
        peaks={DEMO_PEAKS}
        speakers={DEMO_SPEAKERS}
        position={0.44}
        durationMs={754_000}
        speakerLabels={["Dr Okafor", "Patient"]}
        title="Consultation — 14 Aug, 09:12"
        markers={DEMO_MARKERS}
      />
    </section>
  );
}

export default PlaybackWithSpeakersExample;
