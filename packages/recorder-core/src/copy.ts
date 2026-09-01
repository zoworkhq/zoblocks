/**
 * The sentences, as pure functions.
 *
 * §10 is the reason these are not inline JSX. A screen-reader user cannot see
 * a waveform, so the announcements *are* the component for them — and copy
 * that lives in a template is copy nobody can unit-test, translate, or read
 * without rendering a tree.
 *
 * What is here: the silence budget, the phase words, the transition
 * announcements and the 30-second heartbeat. What is deliberately not here:
 * anything about consent, lawful basis, disclosure or redaction. That copy is
 * blocked on a legal review that does not exist, and the host writes it.
 *
 * Names are prefixed because the npm barrel is flat and every core's helpers
 * collide on the obvious one. `describeElapsed` and `formatDuration` are both
 * already taken by other packages; these will not be the collisions that make
 * a build fail three minutes after the file was closed.
 */

import { DEFAULT_SILENCE_BUDGET_MS, QUIET_GRACE_MS } from "./motion";
import type { RecorderState } from "./types";

/* ------------------------------------------------------------------ clocks */

function pad(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

/**
 * `00:04:12` — the transport timer.
 *
 * Rendered into a `role="timer"`, which is implicitly `aria-live="off"`. It
 * is polled, never pushed: making the timer polite is the single commonest
 * audio-UI accessibility defect, and it produces a screen reader that says a
 * number every second for twenty minutes.
 */
export function recorderClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * `00:04:12:07` — hours, minutes, seconds and FRAMES.
 *
 * The frames field is what makes this a timecode rather than a clock, and it is
 * why Pulse uses it: a capture surface with a single control has nowhere else to
 * show that the machine is still advancing, so the last pair moving is the only
 * evidence on screen that anything is happening.
 *
 * 25 fps by default because that is what the two broadcast standards a European
 * clinic is likely to receive material in both use, and because a non-integer
 * rate (29.97) would need drop-frame arithmetic to stay honest over an hour —
 * which is a correctness problem nobody wants inside a recorder.
 *
 * The hours field is never dropped. A readout that grows a column mid-take
 * shifts every digit beside it, which is the thing tabular-nums exists to
 * prevent.
 */
export function recorderTimecode(ms: number, fps: number = 25): string {
  const safe = Math.max(0, ms);
  const total = Math.floor(safe / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const frames = Math.min(fps - 1, Math.floor(((safe % 1000) / 1000) * fps));
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/** `4:12`, or `1:04:12` past the hour. The inline form, for Strip and Duet. */
export function recorderClockShort(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

/** `3 minutes 30 seconds` — the spoken form, for announcements only. */
export function describeRecorderDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/* ----------------------------------------------------------------- silence */

/**
 * How far past the voice floor the room has gone.
 *
 * `voice` — above the floor. `quiet` — below it, but not for long enough to
 * mean anything. `silent` — below it long enough to be worth a number.
 * `budget` — past the budget, which is the failure this component exists to
 * prevent, so it is the one assertive announcement in the whole surface.
 */
export type SilenceLevel = "voice" | "quiet" | "silent" | "budget";

export interface SilenceReport {
  readonly level: SilenceLevel;
  /** Milliseconds continuously below the floor. */
  readonly ms: number;
  readonly budget: number;
  /** The sentence. Empty while voice is arriving — there is nothing to say. */
  readonly message: string;
  /**
   * Whether this belongs in `role="alert"` rather than `role="status"`.
   *
   * True only at `budget`. Crossing the budget is the failure the component
   * exists to prevent, so it interrupts; everything below it waits its turn.
   */
  readonly assertive: boolean;
}

export interface SilenceOptions {
  /** Milliseconds below the floor before escalating. `0` disables the budget. */
  readonly budget?: number;
  /**
   * Whether capture is actually running.
   *
   * A silent playback surface is silent audio, not a fault. The budget only
   * means something while something is supposed to be arriving.
   */
  readonly capturing?: boolean;
}

/**
 * The silence budget, as a sentence.
 *
 * The component knows how long it has been continuously below the voice floor
 * and says so, escalating from "quiet" to "no voice for 20 s — check the
 * microphone". The single most expensive failure in ambient documentation is
 * a long recording of a muted microphone, and it is entirely preventable by a
 * component that is already computing the number it needs.
 */
export function describeSilence(silentMs: number, options: SilenceOptions = {}): SilenceReport {
  const budget = options.budget ?? DEFAULT_SILENCE_BUDGET_MS;
  const capturing = options.capturing ?? true;
  const ms = Math.max(0, silentMs);

  if (!capturing || ms === 0) {
    return { level: "voice", ms, budget, message: "", assertive: false };
  }
  if (ms < QUIET_GRACE_MS) {
    return { level: "quiet", ms, budget, message: "Quiet", assertive: false };
  }

  const seconds = Math.floor(ms / 1000);
  // A budget of 0 disables the escalation. It stays a documented, deliberate
  // choice rather than a silent one: the component still counts and still
  // says how long, it simply never crosses.
  if (budget > 0 && ms >= budget) {
    return {
      level: "budget",
      ms,
      budget,
      message: `No voice for ${seconds} s — check the microphone`,
      assertive: true,
    };
  }
  return {
    level: "silent",
    ms,
    budget,
    message: `No voice for ${seconds} s`,
    assertive: false,
  };
}

/* ------------------------------------------------------------------- words */

const STATUS_WORDS: Readonly<Record<RecorderState, string>> = Object.freeze({
  idle: "Not recording",
  requesting: "Requesting the microphone",
  // Not "Ready". Armed means permission is granted and the device is chosen
  // and nothing is being captured, and "Ready" reads as "recording is about
  // to be fine" rather than "nothing has been captured yet".
  armed: "Armed",
  recording: "Recording",
  paused: "Paused",
  stopping: "Stopping",
  // The word the whole of rule three exists for. Not "Saved", not "Done":
  // the bytes are on this device and nowhere else.
  held: "Held on this device",
  uploading: "Uploading",
  queued: "Queued",
  transcribing: "Transcribing",
  ready: "Ready",
  denied: "Microphone blocked",
  unavailable: "Input device unavailable",
  failed: "Failed",
  discarded: "Discarded",
});

/** One short phrase per state, for the transport and the status region. */
export function recorderStatusWord(phase: RecorderState): string {
  return STATUS_WORDS[phase];
}

/**
 * The sentence a `role="status"` region announces on a phase change.
 *
 * One sentence each, and only on transitions — never on a level change. The
 * `from` matters in two places: resuming is not starting, and arriving at
 * `held` from `stopping` is the one announcement that has to say what did not
 * happen as well as what did.
 */
export function describeRecorderTransition(from: RecorderState, to: RecorderState): string {
  if (to === "recording") return from === "paused" ? "Recording resumed" : "Recording started";
  if (to === "held") return "Held on this device, not yet uploaded";
  if (to === "ready") return "Ready";
  if (to === "unavailable") return "Input device unavailable. Audio recorded so far is held";
  if (to === "denied") return "Microphone blocked. Nothing is being recorded";
  if (to === "failed") return `Failed while ${STATUS_WORDS[from].toLowerCase()}`;
  return STATUS_WORDS[to];
}

/**
 * The 30-second heartbeat.
 *
 * Long enough not to intrude, short enough that a muted microphone is caught
 * inside a minute — which is the entire point of announcing anything on a
 * schedule rather than only on transitions.
 */
export function describeRecorderHeartbeat(
  phase: RecorderState,
  elapsedMs: number,
  silence: SilenceReport,
): string {
  const word = STATUS_WORDS[phase];
  const duration = describeRecorderDuration(elapsedMs);
  if (silence.level === "voice") return `${word}, ${duration}, voice detected`;
  if (silence.level === "quiet") return `${word}, ${duration}, quiet`;
  return `${word}, ${duration}, ${silence.message.toLowerCase()}`;
}
