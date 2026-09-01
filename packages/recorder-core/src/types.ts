/**
 * The shared vocabulary: phases, consent, devices, disposition and the frame
 * the signal loop produces.
 *
 * Nothing here names a DOM type. `AnalyserNode`, `MediaStream` and
 * `MediaDeviceInfo` are all matched structurally instead, so this package
 * compiles without `lib.dom`, runs in Node, and cannot quietly acquire a
 * browser dependency (ADR 0009, ENGINEERING.md §2.5). The React layer passes
 * the real browser objects and they satisfy these shapes as they are.
 */

/* ------------------------------------------------------------------ phases */

/**
 * The eleven phases of §06.
 *
 * `armed` is the one most implementations do not have. Permission is granted
 * and the device is chosen, but nothing is being captured and no basis is
 * recorded. Collapsing it into `idle` leaves nowhere for consent to live,
 * which is why the guard on `armed → recording` can exist at all.
 */
export const RECORDER_PHASES = [
  "idle",
  "requesting",
  "armed",
  "recording",
  "paused",
  "stopping",
  "held",
  "uploading",
  "queued",
  "transcribing",
  "ready",
] as const;

export type RecorderPhase = (typeof RECORDER_PHASES)[number];

/**
 * The four terminals of §06. The forward path ends at each of them: no
 * ordinary event leads onward.
 *
 * Two of them are recoverable, and the recovery is a separate, explicit call
 * rather than an edge — see `createRecorderMachine().recover()`. A failed
 * transcription is a failed transcription; the recording is intact. Modelling
 * that as an ordinary transition is how a pipeline throws away the expensive
 * artefact because the cheap one broke.
 */
export const RECORDER_TERMINALS = ["denied", "unavailable", "failed", "discarded"] as const;

export type RecorderTerminal = (typeof RECORDER_TERMINALS)[number];

/** Every state the machine can be in. */
export type RecorderState = RecorderPhase | RecorderTerminal;

/** The events the machine accepts. */
export const RECORDER_EVENTS = [
  "request",
  "grant",
  "deny",
  "dismiss",
  "lose",
  "start",
  "pause",
  "resume",
  "stop",
  "settle",
  "upload",
  "queue",
  "transcribe",
  "complete",
  "fail",
  "discard",
  "disarm",
] as const;

export type RecorderEvent = (typeof RECORDER_EVENTS)[number];

/* ----------------------------------------------------------------- consent */

/**
 * What the host asserts about the basis for recording.
 *
 * The component renders this and never authors it. Around a dozen US states
 * require all-party consent, several countries treat a clinical recording as
 * special-category data, and a behavioural-health session may be a 42 CFR
 * Part 2 record with disclosure rules of its own. Deciding what a lawful
 * basis is, is not an engineering decision — so `basis` is an opaque
 * host-supplied string and this package never inspects its value, only
 * whether it is present.
 */
export interface RecorderConsent {
  /** Whatever the host calls the basis. Never interpreted here. */
  readonly basis: string;
  /** ISO-8601. When the basis was recorded. */
  readonly recordedAt: string;
  /** Who recorded it. Provenance, not display. */
  readonly recordedBy: string;
  /** Whether the basis covers every participant in the room. */
  readonly coversAll: boolean;
}

/**
 * Why consent does or does not clear the `armed → recording` edge.
 *
 * A verdict, not a sentence. The copy that goes with each of these is blocked
 * on a legal review that does not exist, so the host writes it — see §18 and
 * the scope note in the build spec.
 */
export type ConsentVerdict =
  | "resolved"
  | "absent"
  | "incomplete"
  | "not-all-parties"
  | "not-required";

/** How much the recording discloses, which changes behaviour and not only a badge. */
export type RecorderSensitivity = "routine" | "confidential" | "restricted";

/** Somebody in the room. Provenance, and the input to `coversAll`. */
export interface RecorderParticipant {
  readonly id: string;
  readonly name: string;
  /** Optional role label. Rendered, never interpreted. */
  readonly role?: string;
  /** Whether this participant is covered by the recorded basis. */
  readonly consented?: boolean;
}

/* ----------------------------------------------------------------- devices */

/**
 * The input device, structurally compatible with `MediaDeviceInfo`.
 *
 * Rendered permanently in the header, never only in a settings panel. §11 row
 * 7 — a clinician wearing a headset while recording the laptop microphone
 * produces plausible room tone and passes every signal-level detector there
 * is. The device name is the only defence, and a name behind a hover is not
 * one.
 */
export interface RecorderDevice {
  readonly deviceId: string;
  readonly label: string;
  readonly kind?: string;
  readonly groupId?: string;
}

/* ------------------------------------------------------------- disposition */

/** Where the bytes are. The component renders this; it does not move them. */
export interface RecorderDisposition {
  readonly state: "held" | "uploading" | "queued" | "transcribing" | "ready" | "failed";
  readonly bytes: number;
  /** Bytes acknowledged by the far end. Drives the resumable progress readout. */
  readonly sent: number;
  readonly error?: string;
}

/* ---------------------------------------------------------------- the loop */

/**
 * An analyser, structurally.
 *
 * `AnalyserNode` satisfies this as it stands. Typed here rather than imported
 * so the package compiles without `lib.dom`, and so the whole envelope can be
 * driven from a fake in a test — which is what makes the numbers in §08
 * assertable at all.
 */
export interface TimeDomainSource {
  /** Fills `target` with time-domain samples in roughly [-1, 1]. */
  getFloatTimeDomainData(target: Float32Array): void;
}

/**
 * One pass of the loop.
 *
 * Every field is derived from the samples that arrived. There is no phase, no
 * counter and no clock: if the source reports nothing, `level`, `display` and
 * `bucket` are all zero and `silentMs` grows. That is the whole claim, and it
 * is why a frame carries `silentMs` at all.
 */
export interface SignalFrame {
  /** Peak magnitude of this pass, before the envelope. */
  readonly peak: number;
  /** The envelope: instant attack, exponential release. Linear, 0…1. */
  readonly level: number;
  /** The slow ceiling. Linear, 0…1, never below `level`. */
  readonly hold: number;
  /** `level` through the visual gain. What a bar's height should be. */
  readonly display: number;
  /** `level` in dBFS, floored at -100. Static text for the accessibility tree. */
  readonly dbfs: number;
  /** Whether `level` is below the voice floor right now. */
  readonly quiet: boolean;
  /** Milliseconds continuously below the voice floor. Zero the moment voice returns. */
  readonly silentMs: number;
  /** Total milliseconds this signal has been stepped. */
  readonly elapsedMs: number;
  /** Buckets completed since the signal was created. */
  readonly buckets: number;
  /**
   * The bucket that closed on this pass, or `null` if none did.
   *
   * Buckets close on the 30 Hz grid, not on frames, so this is `null` on most
   * passes at 60 Hz.
   */
  readonly bucket: number | null;
  /**
   * Every bucket that closed on this pass, oldest first.
   *
   * Usually empty or one long. A delta that spans several buckets closes
   * several, which is what keeps the 30 Hz grid true after a dropped frame —
   * and what leaves a visible hole in the buffer after a suspended tab rather
   * than silently joining the two halves.
   */
  readonly closed: readonly number[];
}
