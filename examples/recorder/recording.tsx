import { useState } from "react";
import type { TimeDomainSource } from "@zoblocks/recorder-core";
import { Recorder } from "@/components/zoblocks/recorder";
import {
  DEMO_DEVICE,
  DEMO_SOURCE,
  SILENT_SOURCE,
  LIVE_TRACK,
  MUTED_TRACK,
  ENDED_TRACK,
} from "./_shared/recorder-fixtures";

type SignalMode = "speech" | "quiet" | "muted" | "unplugged";

const QUIET_SOURCE: TimeDomainSource = {
  fftSize: 2048,
  getFloatTimeDomainData(target) {
    for (let index = 0; index < target.length; index += 1) {
      target[index] = Math.sin(index * 0.19) * 0.012 + Math.sin(index * 0.047) * 0.008;
    }
  },
};

const signalOptions: { id: SignalMode; label: string }[] = [
  { id: "speech", label: "Speech" },
  { id: "quiet", label: "Quiet room" },
  { id: "muted", label: "Microphone muted" },
  { id: "unplugged", label: "Device unplugged" },
];

export function CaptureExample() {
  const [signal, setSignal] = useState<SignalMode>("speech");
  const [paused, setPaused] = useState(false);

  const source =
    signal === "speech" ? DEMO_SOURCE : signal === "quiet" ? QUIET_SOURCE : SILENT_SOURCE;

  const track =
    signal === "muted" ? MUTED_TRACK : signal === "unplugged" ? ENDED_TRACK : LIVE_TRACK;

  const phase = signal === "unplugged" ? "held" : paused ? "paused" : "recording";

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">Signal</p>
      <div className="flex flex-wrap gap-2">
        {signalOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setSignal(option.id);
              setPaused(false);
            }}
            aria-pressed={signal === option.id}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              signal === option.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Recorder
        variant="bars"
        phase={phase}
        source={source}
        device={DEMO_DEVICE}
        expectedDevice={DEMO_DEVICE}
        track={track}
        context="Encounter · Room 4"
        onPause={() => setPaused(true)}
        onStop={() => setPaused(true)}
      />
    </section>
  );
}

export default CaptureExample;
