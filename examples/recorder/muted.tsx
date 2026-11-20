import { useState } from "react";
import { Recorder } from "@/components/zoblocks/recorder";
import {
  DEMO_SOURCE,
  SILENT_SOURCE,
  LIVE_TRACK,
  MUTED_TRACK,
  ENDED_TRACK,
} from "./_shared/recorder-fixtures";

type SignalMode = "speech" | "quiet" | "muted" | "unplugged";

const signalOptions: { id: SignalMode; label: string }[] = [
  { id: "speech", label: "Speech" },
  { id: "quiet", label: "Quiet room" },
  { id: "muted", label: "Microphone muted" },
  { id: "unplugged", label: "Device unplugged" },
];

export function MicrophoneMutedExample() {
  const [signal, setSignal] = useState<SignalMode>("muted");

  const report = (code: string) => {
    console.warn("Recorder fault reported:", code);
  };

  const source = signal === "speech" ? DEMO_SOURCE : SILENT_SOURCE;

  const track =
    signal === "muted" ? MUTED_TRACK : signal === "unplugged" ? ENDED_TRACK : LIVE_TRACK;

  const phase = signal === "unplugged" ? "held" : "recording";

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">Signal</p>

      <div className="flex flex-wrap gap-2">
        {signalOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSignal(option.id)}
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
        track={track}
        silenceBudgetMs={20_000}
        onFault={(fault) => fault && report(fault.code)}
      />
    </section>
  );
}

export default MicrophoneMutedExample;
