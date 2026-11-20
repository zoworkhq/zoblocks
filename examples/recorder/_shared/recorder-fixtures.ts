import type {
  RecorderDevice,
  RecorderDisposition,
  TimeDomainSource,
  TrackObservation,
} from "@zoblocks/recorder-core";

import type { RecorderMarker, RecorderTurn } from "@/components/zoblocks/recorder";

/** Synthetic waveform for documentation examples only. */
export const DEMO_PEAKS = Float32Array.from({ length: 180 }, (_, index) =>
  Math.max(0.025, Math.abs(Math.sin(index * 0.31) * 0.42 + Math.sin(index * 0.073) * 0.24)),
);

/** Two-speaker sample; each byte identifies a speaker rail. */
export const DEMO_SPEAKERS = Uint8Array.from({ length: 180 }, (_, index) => (index < 88 ? 0 : 1));

export const DEMO_DEVICE: RecorderDevice = {
  deviceId: "demo-jabra-380",
  label: "Jabra Link 380",
  kind: "audioinput",
};

export const BUILTIN_DEVICE: RecorderDevice = {
  deviceId: "demo-macbook-mic",
  label: "MacBook Pro Microphone",
  kind: "audioinput",
};

export const LIVE_TRACK: TrackObservation = {
  readyState: "live",
  muted: false,
};

export const MUTED_TRACK: TrackObservation = {
  readyState: "live",
  muted: true,
};

export const ENDED_TRACK: TrackObservation = {
  readyState: "ended",
  muted: false,
};

/** Stable, deterministic analyser source for visual demonstrations. */
export const DEMO_SOURCE: TimeDomainSource = {
  fftSize: 2048,
  getFloatTimeDomainData(target) {
    for (let index = 0; index < target.length; index += 1) {
      target[index] = Math.sin(index * 0.19) * 0.19 + Math.sin(index * 0.047) * 0.11;
    }
  },
};

/** Exact digital silence for the muted-input example. */
export const SILENT_SOURCE: TimeDomainSource = {
  fftSize: 2048,
  getFloatTimeDomainData(target) {
    target.fill(0);
  },
};

export const DEMO_MARKERS: readonly RecorderMarker[] = [
  { id: "opening", at: 0.12, label: "Opening" },
  { id: "review", at: 0.46, label: "Review" },
  {
    id: "struck",
    at: 0.68,
    label: "Requested removal",
    struck: true,
    span: 0.08,
  },
];

export const DEMO_TURNS: readonly RecorderTurn[] = [
  {
    id: "turn-1",
    speaker: "Clinician",
    words: "What brought you in today?",
  },
  {
    id: "turn-2",
    speaker: "Patient",
    words: "I've been experiencing a persistent headache.",
  },
  {
    id: "turn-3",
    speaker: "Clinician",
    words: "When did you first notice it?",
    interim: "notice it?",
  },
];

export const HELD_DISPOSITION: RecorderDisposition = {
  state: "held",
  bytes: 14_200_000,
  sent: 0,
};

export const UPLOADING_DISPOSITION: RecorderDisposition = {
  state: "uploading",
  bytes: 14_200_000,
  sent: 8_900_000,
};

export const QUEUED_DISPOSITION: RecorderDisposition = {
  state: "queued",
  bytes: 14_200_000,
  sent: 14_200_000,
};

export const TRANSCRIBING_DISPOSITION: RecorderDisposition = {
  state: "transcribing",
  bytes: 14_200_000,
  sent: 14_200_000,
};

export const READY_DISPOSITION: RecorderDisposition = {
  state: "ready",
  bytes: 14_200_000,
  sent: 14_200_000,
};

export const FAILED_DISPOSITION: RecorderDisposition = {
  state: "failed",
  bytes: 14_200_000,
  sent: 8_900_000,
  error: "Network connection interrupted.",
};
