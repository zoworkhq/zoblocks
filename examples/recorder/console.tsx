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

type EncounterMarker = {
  id: string;
  at: number;
  label: string;
  kind: "mark" | "strike";
};

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

export function FullEncounterExample() {
  const [signal, setSignal] = useState<SignalMode>("speech");
  const [paused, setPaused] = useState(false);
  const [markers, setMarkers] = useState<EncounterMarker[]>([]);

  const source =
    signal === "speech" ? DEMO_SOURCE : signal === "quiet" ? QUIET_SOURCE : SILENT_SOURCE;

  const track =
    signal === "muted" ? MUTED_TRACK : signal === "unplugged" ? ENDED_TRACK : LIVE_TRACK;

  const phase = signal === "unplugged" ? "held" : paused ? "paused" : "recording";

  const addMarker = (label: string, kind: EncounterMarker["kind"]) => {
    setMarkers((current) => [
      ...current,
      {
        id: `${kind}-${Date.now()}-${current.length}`,
        at: 30_000,
        label,
        kind,
      },
    ]);
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-muted px-3 py-1 font-medium">Consent 09:11</span>
          <span className="text-muted-foreground">42 CFR Part 2 · illustrative</span>
          <span className="text-muted-foreground">3 in room</span>
          <span className="text-muted-foreground">{DEMO_DEVICE.label}</span>
        </div>

        <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
          {signal === "unplugged"
            ? "Device disconnected · Audio held"
            : paused
              ? "Paused"
              : "Recording"}
        </span>
      </div>

      <div className="mb-4">
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
      </div>

      <Recorder
        variant="bars"
        phase={phase}
        source={source}
        device={DEMO_DEVICE}
        expectedDevice={DEMO_DEVICE}
        track={track}
        markers={markers}
        onMark={() => addMarker("Mark", "mark")}
        onStrike={() => addMarker("Struck 0:30", "strike")}
        onPause={() => setPaused(true)}
        onStop={() => setPaused(true)}
      />

      {markers.length > 0 ? (
        <div className="mt-4 border-t pt-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Take markers</p>

          <div className="flex flex-wrap gap-2">
            {markers.map((marker) => (
              <span key={marker.id} className="rounded-md border px-2.5 py-1 text-xs">
                {marker.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default FullEncounterExample;
