import { Recorder } from "@/components/zoblocks/recorder";
import { DEMO_TURNS } from "./_shared/recorder-fixtures";

export default function TranscriptStalledExample() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <Recorder variant="stream" phase="recording" turns={DEMO_TURNS} transcriptLagMs={5000} />
    </section>
  );
}
