/**
 * @oxygenui-design/recorder-core — the engine behind Oxygen's Recorder.
 *
 * No React, no Ant Design, no DOM, no dependencies. It accepts an analyser
 * and a delta and returns a level, a bucket and a phase — including every
 * case where the microphone is open and nothing is arriving.
 *
 *     import { createSignal, PeakBuffer, createRecorderMachine } from "@oxygenui-design/recorder-core";
 *
 *     const signal = createSignal({ source: analyser });
 *     const peaks = new PeakBuffer();
 *
 *     signal.subscribe((frame) => {
 *       for (const bucket of frame.closed) peaks.push(bucket);
 *     });
 *
 *     // The requestAnimationFrame wrapper supplies the delta and nothing else.
 *     signal.step(16.7);
 *
 * The one claim this package exists to make: **the art is a pure function of
 * the signal.** There is no timer here, no phase and no clock. If the
 * analyser reports nothing, `frame.level` is zero and `frame.silentMs` grows
 * — because a perfectly flat waveform and a quiet room look identical, and
 * only one of them is a fault.
 *
 * The React surface, the five arts and the stylesheet live in the Oxygen
 * registry. This package is what stays the same whichever way that goes.
 */

export {
  ATTACK_MS,
  BARS_MIN_WIDTH_PX,
  BUCKET_HZ,
  BUCKET_MS,
  DEFAULT_BUFFER_CAPACITY,
  DEFAULT_SILENCE_BUDGET_MS,
  DOM_BAR_CEILING,
  LEVEL_EVENT_HZ,
  PEAK_HOLD_PER_FRAME,
  QUIET_GRACE_MS,
  REC_BREATHE_MS,
  REFERENCE_FRAME_MS,
  RECORDER_MOTION,
  RELEASE_MS,
  VISUAL_GAIN_EXPONENT,
  VOICE_FLOOR,
} from "./motion";

export {
  RECORDER_EVENTS,
  RECORDER_PHASES,
  RECORDER_TERMINALS,
  type ConsentVerdict,
  type RecorderConsent,
  type RecorderDevice,
  type RecorderDisposition,
  type RecorderEvent,
  type RecorderParticipant,
  type RecorderPhase,
  type RecorderSensitivity,
  type RecorderState,
  type RecorderTerminal,
  type SignalFrame,
  type TimeDomainSource,
} from "./types";

export {
  DBFS_FLOOR,
  createRateGate,
  createSignal,
  framePeak,
  toDbfs,
  visualGain,
  type Signal,
  type SignalOptions,
} from "./signal";

export {
  PeakBuffer,
  SPEAKER_UNKNOWN,
  decodeBase64,
  encodeBase64,
  reducePeaks,
  reduceSpeakers,
  type PeakBufferOptions,
  type PeaksSidecar,
} from "./buffer";

export {
  RECORDER_TRANSITIONS,
  createRecorderMachine,
  isTerminal,
  type RecorderMachine,
  type RecorderMachineOptions,
  type RefusalReason,
  type TransitionResult,
} from "./machine";

export {
  RECORDER_FAULTS,
  detectFaults,
  isCapturingNothing,
  primaryFault,
  type FaultObservation,
  type RecorderFault,
  type RecorderFaultCode,
  type RecorderFaultSeverity,
  type TrackObservation,
} from "./faults";

export {
  isConsentResolved,
  resolveConsent,
  uncoveredParticipants,
  type ResolveConsentOptions,
} from "./consent";

export {
  describeRecorderDuration,
  describeRecorderHeartbeat,
  describeRecorderTransition,
  describeSilence,
  recorderClock,
  recorderClockShort,
  recorderStatusWord,
  type SilenceLevel,
  type SilenceOptions,
  type SilenceReport,
} from "./copy";
