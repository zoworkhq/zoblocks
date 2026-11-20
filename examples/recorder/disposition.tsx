import { useState } from "react";
import { RecorderDispositionStrip } from "@/components/zoblocks/recorder";
import {
  FAILED_DISPOSITION,
  HELD_DISPOSITION,
  QUEUED_DISPOSITION,
  READY_DISPOSITION,
  TRANSCRIBING_DISPOSITION,
  UPLOADING_DISPOSITION,
} from "./_shared/recorder-fixtures";

const DISPOSITIONS = [
  {
    id: "held",
    title: "Held on this device",
    description: "Audio is retained locally. Nothing has been uploaded.",
    disposition: HELD_DISPOSITION,
  },
  {
    id: "uploading",
    title: "Uploading",
    description: "A portion of the audio has been sent.",
    disposition: UPLOADING_DISPOSITION,
  },
  {
    id: "queued",
    title: "Queued",
    description: "Upload is complete. The server is waiting to process it.",
    disposition: QUEUED_DISPOSITION,
  },
  {
    id: "transcribing",
    title: "Transcribing",
    description: "The audio is available while transcription is processed.",
    disposition: TRANSCRIBING_DISPOSITION,
  },
  {
    id: "ready",
    title: "Ready",
    description: "The transcript is ready and attached to the encounter.",
    disposition: READY_DISPOSITION,
  },
  {
    id: "failed",
    title: "Failed",
    description: "An upload or processing error needs host attention.",
    disposition: FAILED_DISPOSITION,
  },
] as const;

export function DispositionStatesExample() {
  const [selectedId, setSelectedId] = useState<(typeof DISPOSITIONS)[number]["id"]>("uploading");

  const selected = DISPOSITIONS.find((item) => item.id === selectedId)!;

  const retryUpload = () => {
    console.log("Retry upload requested");
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DISPOSITIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            aria-pressed={selectedId === item.id}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              selectedId === item.id
                ? "border-primary bg-primary/10 font-semibold"
                : "hover:bg-muted"
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <RecorderDispositionStrip
          disposition={selected.disposition}
          durationMs={252_000}
          onRetry={retryUpload}
        />
      </div>
    </section>
  );
}

export default DispositionStatesExample;
