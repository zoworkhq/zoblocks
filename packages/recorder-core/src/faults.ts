/**
 * The thirteen ways the audio dies — §11 of the brief, and the reason this
 * package is worth buying rather than writing.
 *
 * A recorder is easy. A recorder that tells the truth about thirteen distinct
 * failures, **four of which produce byte-identical output**, is not. Rows 3, 4,
 * 6 and 7 all deliver frames of near-silence on schedule, and no amount of
 * waveform design separates them: they are distinguished by *device state*,
 * never by signal. That is why this module takes observations about the device
 * and the document alongside the frame, and why a detector that only watched
 * the analyser would be a detector that cannot work.
 *
 * No DOM here, deliberately. `devicechange`, `visibilitychange`, `beforeunload`
 * and the track lifecycle are the binding layer's job; deciding what those
 * observations *mean* is this package's. That split is what lets the whole
 * catalogue be asserted numerically, in Node, without a browser — and it is why
 * the copy lives here rather than inline in JSX.
 */

import { DEFAULT_SILENCE_BUDGET_MS } from "./motion";
import type {
  RecorderDevice,
  RecorderDisposition,
  RecorderPhase,
  SignalFrame,
} from "./types";

/** The thirteen, in the order §11 lists them. */
export const RECORDER_FAULTS = [
  "permission-denied", //  1 — no stream at all
  "permission-dismissed", //  2 — no stream at all, but askable again
  "input-muted", //  3 — exact zero, forever
  "hardware-muted", //  4 — exact zero, forever; different fix
  "device-lost", //  5 — track ended
  "route-changed", //  6 — level drops, quality collapses
  "device-suspect", //  7 — plausible room tone; the undetectable one
  "capture-suspended", //  8 — frames stop arriving
  "unsent-on-unload", //  9 — everything stops
  "storage-full", // 10 — writes start failing
  "upload-failed", // 11 — audio fine
  "recogniser-stalled", // 12 — audio fine
  "gain-masked", // 13 — looks perfect, always
] as const;

export type RecorderFaultCode = (typeof RECORDER_FAULTS)[number];

/**
 * `critical` interrupts, `warn` is shown, `info` is available on request.
 *
 * A fault that stops the capture outright is not more severe than one that
 * lets it run while recording nothing — the second is worse, because the
 * clinician does not find out until sign-off.
 */
export type RecorderFaultSeverity = "info" | "warn" | "critical";

export interface RecorderFault {
  readonly code: RecorderFaultCode;
  readonly severity: RecorderFaultSeverity;
  /** Is audio still being captured right now? */
  readonly capturing: boolean;
  /**
   * Is what was already recorded still intact?
   *
   * Almost always true, and saying so is the point: the commonest way a
   * pipeline loses a consultation is throwing away the expensive artefact
   * because the cheap one broke.
   */
  readonly audioIntact: boolean;
  /** One sentence. States what happened, not how sorry we are. */
  readonly message: string;
  /** What to do about it. Absent when there is nothing the user can do. */
  readonly fix?: string;
}

export interface TrackObservation {
  /** `MediaStreamTrack.readyState`. */
  readonly readyState: "live" | "ended";
  /** `MediaStreamTrack.muted` — the source cannot currently provide data. */
  readonly muted: boolean;
}

export interface FaultObservation {
  readonly phase: RecorderPhase;
  readonly frame: SignalFrame;
  /** The result of the permission prompt, when one has been made. */
  readonly permission?: "granted" | "denied" | "dismissed" | "prompt";
  readonly track?: TrackObservation | null;
  /** The device actually delivering audio. */
  readonly device?: RecorderDevice | null;
  /** The device the user chose. A mismatch is row 7. */
  readonly expectedDevice?: RecorderDevice | null;
  /** Current sample rate, and the rate at the start of the capture. */
  readonly sampleRate?: number;
  readonly baselineSampleRate?: number;
  /** Whether the browser is applying automatic gain control. */
  readonly autoGainControl?: boolean;
  /** `document.hidden`, and how long since the loop last ran. */
  readonly documentHidden?: boolean;
  readonly msSinceFrame?: number;
  /** The page is unloading. */
  readonly unloading?: boolean;
  readonly disposition?: RecorderDisposition | null;
  /** How far the transcript trails the audio. */
  readonly transcriptLagMs?: number;
  /** A quota or write error from the local store. */
  readonly storageError?: string | null;
  readonly silenceBudgetMs?: number;
  /** How long a suspended capture must be to count as a hole. */
  readonly suspendGraceMs?: number;
  /** How far the recogniser may trail before it is stalled. */
  readonly transcriptGraceMs?: number;
}

const NONE: readonly RecorderFault[] = Object.freeze([]);

const CAPTURING: ReadonlySet<RecorderPhase> = new Set<RecorderPhase>(["recording"]);
const HOLDS_AUDIO: ReadonlySet<RecorderPhase> = new Set<RecorderPhase>([
  "recording",
  "paused",
  "stopping",
  "held",
  "uploading",
  "queued",
]);

/** Frames stop arriving; beyond this the gap is a hole worth marking. */
const SUSPEND_GRACE_MS = 1_500;
/** The recogniser may trail the audio by this much before it is stalled. */
const TRANSCRIPT_GRACE_MS = 4_000;

/**
 * Every fault the observation supports, most severe first.
 *
 * Pure, total, and allocation-free in the common case: a healthy recorder
 * returns the same frozen empty array on every pass, so this can sit in the
 * render path without generating garbage sixty times a second.
 */
export function detectFaults(observation: FaultObservation): readonly RecorderFault[] {
  const {
    phase,
    frame,
    permission,
    track,
    device,
    expectedDevice,
    sampleRate,
    baselineSampleRate,
    autoGainControl,
    documentHidden,
    msSinceFrame,
    unloading,
    disposition,
    transcriptLagMs,
    storageError,
  } = observation;

  const budget = observation.silenceBudgetMs ?? DEFAULT_SILENCE_BUDGET_MS;
  const suspendGrace = observation.suspendGraceMs ?? SUSPEND_GRACE_MS;
  const transcriptGrace = observation.transcriptGraceMs ?? TRANSCRIPT_GRACE_MS;

  const capturing = CAPTURING.has(phase);
  const holdsAudio = HOLDS_AUDIO.has(phase);
  const found: RecorderFault[] = [];

  /* 1 — permission denied. A dead end, and the copy must not pretend otherwise. */
  if (permission === "denied") {
    found.push({
      code: "permission-denied",
      severity: "critical",
      capturing: false,
      audioIntact: holdsAudio,
      message: "Microphone access is blocked for this site.",
      // Deliberately not "try again": the prompt will not reappear, and a
      // retry button that silently does nothing is worse than no button.
      fix: "Allow the microphone in the browser's site settings, then reload.",
    });
  }

  /* 2 — permission dismissed. NOT the same as denied: this one can be asked
     again, and collapsing the two produces a dead end where there is none. */
  if (permission === "dismissed") {
    found.push({
      code: "permission-dismissed",
      severity: "warn",
      capturing: false,
      audioIntact: holdsAudio,
      message: "The microphone request was closed without an answer.",
      fix: "Start the recording again to be asked once more.",
    });
  }

  /* 5 — device gone. Checked before the mute pair: an ended track reports
     silence too, and "unplugged" is the more specific reading of it. */
  if (track?.readyState === "ended" && holdsAudio) {
    found.push({
      code: "device-lost",
      severity: "critical",
      capturing: false,
      // The whole point. Audio to this moment is intact and must be held.
      audioIntact: true,
      message: device?.label
        ? `${device.label} disconnected. Capture has stopped.`
        : "The input device disconnected. Capture has stopped.",
      fix: "What was recorded is held on this device and is not lost.",
    });
  } else if (capturing && frame.level === 0 && frame.silentMs >= budget) {
    /* 3 and 4 — exact zero, forever. These are byte-identical at the signal
       layer. `track.muted` separates them where the browser reports it; where
       it does not, the copy names both causes rather than guessing one. */
    const seconds = Math.floor(frame.silentMs / 1000);
    if (track?.muted === true) {
      found.push({
        code: "input-muted",
        severity: "critical",
        // Still capturing, and that is exactly the trap: the file is growing.
        capturing: true,
        audioIntact: true,
        message: `Microphone muted by the operating system. Nothing captured for ${seconds}s.`,
        fix: "Unmute the input. The recording is still running and the file is still growing.",
      });
    } else {
      found.push({
        code: "hardware-muted",
        severity: "critical",
        capturing: true,
        audioIntact: true,
        message: `No audio for ${seconds}s, and the signal is exactly zero.`,
        fix: "Check the mute switch on the headset and the system input — both produce this.",
      });
    }
  }

  /* 6 — the route changed underneath the capture. A2DP to HFP mid-session
     keeps the meter moving, so only the sample rate reveals it. */
  if (
    capturing &&
    typeof sampleRate === "number" &&
    typeof baselineSampleRate === "number" &&
    sampleRate !== baselineSampleRate
  ) {
    found.push({
      code: "route-changed",
      severity: "warn",
      capturing: true,
      audioIntact: true,
      message: device?.label
        ? `${device.label} switched profile mid-recording — ${baselineSampleRate} Hz to ${sampleRate} Hz.`
        : `The input switched profile mid-recording — ${baselineSampleRate} Hz to ${sampleRate} Hz.`,
      fix: "Audio from this point is lower quality. Transcription accuracy may drop.",
    });
  }

  /* 7 — the wrong microphone, sounding entirely plausible.
     There is no signal-level defence: room tone from the laptop is room tone.
     The only real defence is the device name rendered permanently, which is
     why `device` is a first-class value and not a settings-panel detail. */
  if (
    holdsAudio &&
    expectedDevice &&
    device &&
    device.deviceId !== expectedDevice.deviceId
  ) {
    found.push({
      code: "device-suspect",
      severity: "warn",
      capturing,
      audioIntact: true,
      message: `Recording from ${device.label}, not ${expectedDevice.label}.`,
      fix: "Every detector passes on this — the signal is plausible. Check the device before continuing.",
    });
  }

  /* 8 — frames stopped arriving. iOS Safari suspends capture on lock, and the
     two halves must not be joined silently: the hole is real and belongs on
     the timeline. */
  if (
    capturing &&
    documentHidden === true &&
    typeof msSinceFrame === "number" &&
    msSinceFrame >= suspendGrace
  ) {
    found.push({
      code: "capture-suspended",
      severity: "critical",
      capturing: false,
      audioIntact: true,
      message: `Capture suspended while the page was in the background — ${Math.round(msSinceFrame / 1000)}s missing.`,
      fix: "The gap is marked on the recording rather than closed over.",
    });
  }

  /* 9 — leaving with audio nobody else has. */
  if (unloading === true && holdsAudio) {
    found.push({
      code: "unsent-on-unload",
      severity: "critical",
      capturing,
      audioIntact: true,
      message: "This recording has not been uploaded yet.",
      fix: "Stay on the page until it finishes, or it stays on this device only.",
    });
  }

  /* 10 — the local store is full. Stop cleanly and hold what exists: a
     recorder that keeps capturing into a full disk produces a file nobody has. */
  if (storageError) {
    found.push({
      code: "storage-full",
      severity: "critical",
      capturing: false,
      audioIntact: true,
      message: "This device has run out of room to store the recording.",
      fix: "Recording stopped cleanly. Free some space, then upload what was captured.",
    });
  }

  /* 11 — the upload failed and the audio is fine. */
  if (disposition?.state === "failed") {
    const sent = disposition.sent;
    const total = disposition.bytes;
    const pct = total > 0 ? Math.floor((sent / total) * 100) : 0;
    found.push({
      code: "upload-failed",
      severity: "warn",
      capturing: false,
      audioIntact: true,
      message: disposition.error
        ? `Upload failed: ${disposition.error}`
        : "Upload failed.",
      // Resumable by byte range: a 14 MB re-upload on a clinic connection is
      // a minute nobody has.
      fix: `The recording is held on this device. Retrying resumes from ${pct}%.`,
    });
  }

  /* 12 — the recogniser is behind, and the recorder is not. The distinction is
     the entire content of this message. */
  if (
    typeof transcriptLagMs === "number" &&
    transcriptLagMs >= transcriptGrace &&
    (capturing || phase === "transcribing")
  ) {
    found.push({
      code: "recogniser-stalled",
      severity: "warn",
      capturing,
      audioIntact: true,
      message: `The transcript is ${Math.round(transcriptLagMs / 1000)}s behind the audio.`,
      fix: "The audio is still being recorded. The recogniser is behind, not the recorder.",
    });
  }

  /* 13 — automatic gain control, normalising the room away.
     `info`, not `warn`: nothing is broken. But a meter reading a normalised
     stream is reporting the browser's opinion of the room rather than the
     room, and it must say so rather than look perfect. */
  if (autoGainControl === true && capturing) {
    found.push({
      code: "gain-masked",
      severity: "info",
      capturing: true,
      audioIntact: true,
      message: "Automatic gain control is on, so the level meter reads a processed signal.",
      fix: "Turn AGC off if the meter needs to report the room.",
    });
  }

  if (found.length === 0) return NONE;
  found.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  return found;
}

const SEVERITY_RANK: Readonly<Record<RecorderFaultSeverity, number>> = {
  info: 0,
  warn: 1,
  critical: 2,
};

/**
 * The one fault worth interrupting for, or null.
 *
 * Rendering thirteen simultaneous banners is its own failure mode. A surface
 * shows the worst one and offers the rest.
 */
export function primaryFault(faults: readonly RecorderFault[]): RecorderFault | null {
  return faults.length > 0 ? (faults[0] as RecorderFault) : null;
}

/**
 * True when the recorder believes it is capturing and is in fact capturing
 * nothing.
 *
 * This is the condition the whole component exists to surface, and it is worth
 * one named predicate so a host cannot fail to ask the question.
 */
export function isCapturingNothing(faults: readonly RecorderFault[]): boolean {
  return faults.some((fault) => fault.capturing && CAPTURES_NOTHING.has(fault.code));
}

const CAPTURES_NOTHING: ReadonlySet<RecorderFaultCode> = new Set<RecorderFaultCode>([
  "input-muted",
  "hardware-muted",
  "device-suspect",
]);
