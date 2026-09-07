/**
 * The signal path: analyser → peak → envelope → 30 Hz buckets → subscribers.
 *
 * This is §07 and §08 of the brief, and it is the part with no opinions about
 * pixels. Four stages sit between the microphone and a bar height, and three
 * of them are where audio components usually go wrong — all three are
 * arithmetic rather than taste, which is why they live in a package that can
 * be asserted numerically without a browser.
 *
 * The loop is split deliberately. `step(dt)` takes its own delta and does all
 * the work; the requestAnimationFrame wrapper in the React layer only supplies
 * that delta. Output therefore does not depend on when it rendered, which is
 * the only reason a visual regression test can ever pin this component down —
 * and the reason `pump(n, dt)` can reproduce a real capture exactly.
 *
 * There is no timer here, and adding one would remove the point of the
 * package. If the source reports nothing, the frame reads zero and `silentMs`
 * grows. That is the whole claim.
 */

import {
  BUCKET_HZ,
  PEAK_HOLD_PER_FRAME,
  REFERENCE_FRAME_MS,
  RELEASE_MS,
  VISUAL_GAIN_EXPONENT,
  VOICE_FLOOR,
} from "./motion";
import type { SignalFrame, TimeDomainSource } from "./types";

/**
 * Below this the envelope snaps to exactly zero.
 *
 * An exponential decay never reaches zero, and "silence is drawn at true
 * zero" is a claim the component makes literally: a bar that touches the
 * centre hairline means the recogniser is receiving nothing. A residue of
 * 1e-12 renders identically and compares differently, so it is removed here
 * rather than papered over at every call site.
 */
const ZERO_EPSILON = 1e-6;
/** Absorbs the last-bit error in `elapsedMs` so a boundary landed on exactly
 * is counted as reached. Far below one bucket, far above float64 noise. */
const BUCKET_EPSILON = 1e-9;

/** dBFS reported for digital silence. Real silence is -Infinity; nobody can read that. */
export const DBFS_FLOOR = -100;

const NO_BUCKETS: readonly number[] = Object.freeze([]);

export interface SignalOptions {
  /**
   * The analyser. `AnalyserNode` satisfies this structurally.
   *
   * Nullable, because the surface exists before the stream does — and a
   * recorder whose meter is pinned at zero because there is no source yet is
   * telling the truth.
   */
  readonly source?: TimeDomainSource | null;
  /** Release time constant in ms. Defaults to the 180 ms of §08. */
  readonly release?: number;
  /** Voice floor, linear 0…1. Defaults to 0.085. */
  readonly floor?: number;
  /** Samples read per pass. 2048 matches a default `AnalyserNode.fftSize`. */
  readonly frameSize?: number;
  /**
   * The largest delta integrated in one step, in ms.
   *
   * A suspended tab can resume with a delta of minutes. Integrating it
   * literally would close thousands of buckets in one pass and serves nobody:
   * the hole is real, and reporting it is the gap detector's job, not the
   * envelope's. The raw delta is still available as `lastDeltaMs`.
   */
  readonly maxStepMs?: number;
}

export interface Signal {
  /** The most recent frame. Never null: a signal starts at rest, not undefined. */
  readonly frame: SignalFrame;
  /** The raw delta handed to the last `step`, before `maxStepMs` clamped it. */
  readonly lastDeltaMs: number;
  /** Advance by `dtMs` and return the frame it produced. */
  step(dtMs: number): SignalFrame;
  /** `n` steps of `dtMs`. The test hook, and the deterministic replay. */
  pump(n: number, dtMs: number): SignalFrame;
  /** Called with every frame. Returns the unsubscribe. */
  subscribe(listener: (frame: SignalFrame) => void): () => void;
  /** Swap the analyser — a device change mid-session, or the first stream arriving. */
  setSource(source: TimeDomainSource | null): void;
  /** Back to rest. Clears the envelope, the buckets and the silence budget. */
  reset(): void;
}

/**
 * `level` through the visual gain of §08.
 *
 * Ears are logarithmic. A linear bar spends most of its travel on the top few
 * dB and looks dead during ordinary speech, so the height a bar is drawn at
 * is the level raised to 0.62 — not the level.
 */
export function visualGain(level: number, exponent: number = VISUAL_GAIN_EXPONENT): number {
  if (!(level > 0)) return 0;
  return Math.min(1, level) ** exponent;
}

/** Linear amplitude as dBFS, floored so the readout stays a number. */
export function toDbfs(level: number): number {
  if (!(level > 0)) return DBFS_FLOOR;
  return Math.max(DBFS_FLOOR, 20 * Math.log10(Math.min(1, level)));
}

/**
 * A gate that opens `hz` times a second, fed the same deltas as the loop.
 *
 * This is how `zb-recorder-level` gets throttled to 10 Hz without a timer of
 * its own — the throttle is driven by the same clock as everything else, so a
 * paused loop emits nothing rather than continuing to fire.
 */
export function createRateGate(hz: number): (dtMs: number) => boolean {
  if (!(hz > 0)) throw new RangeError(`createRateGate: hz must be positive, got ${hz}`);
  const period = 1000 / hz;
  let accumulated = period; // Open on the first call: the first level is news.
  return (dtMs: number) => {
    accumulated += Math.max(0, dtMs);
    if (accumulated < period) return false;
    accumulated %= period;
    return true;
  };
}

/**
 * Peak magnitude of a frame of samples.
 *
 * Peak, not RMS. RMS is the right measure for perceived loudness and the
 * wrong one for "is anything arriving": it smooths away exactly the
 * transients that prove the microphone is open, which is the one question
 * this component exists to answer.
 */
export function framePeak(samples: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const magnitude = Math.abs(samples[i] as number);
    if (magnitude > peak) peak = magnitude;
  }
  return peak > ZERO_EPSILON ? Math.min(1, peak) : 0;
}

const REST: SignalFrame = Object.freeze({
  peak: 0,
  level: 0,
  hold: 0,
  display: 0,
  dbfs: DBFS_FLOOR,
  quiet: true,
  silentMs: 0,
  elapsedMs: 0,
  buckets: 0,
  bucket: null,
  closed: NO_BUCKETS,
});

export function createSignal(options: SignalOptions = {}): Signal {
  const release = options.release ?? RELEASE_MS;
  const floor = options.floor ?? VOICE_FLOOR;
  const frameSize = options.frameSize ?? 2048;
  const maxStepMs = options.maxStepMs ?? 60_000;

  if (!(release > 0))
    throw new RangeError(`createSignal: release must be positive, got ${release}`);
  if (floor < 0 || floor >= 1) throw new RangeError(`createSignal: floor must be in [0, 1)`);

  let source: TimeDomainSource | null = options.source ?? null;
  const samples = new Float32Array(frameSize);

  let envelope = 0;
  let hold = 0;
  let silentMs = 0;
  let elapsedMs = 0;
  let buckets = 0;
  let bucketPeak = 0;
  let bucketIndex = 0;
  let lastDeltaMs = 0;
  let frame: SignalFrame = REST;

  const listeners = new Set<(frame: SignalFrame) => void>();

  function read(): number {
    if (source === null) return 0;
    source.getFloatTimeDomainData(samples);
    return framePeak(samples);
  }

  function step(dtMs: number): SignalFrame {
    lastDeltaMs = Number.isFinite(dtMs) ? dtMs : 0;
    const dt = Math.min(Math.max(0, lastDeltaMs), maxStepMs);

    const peak = read();

    // Attack is instant and release is exponential, and the asymmetry is the
    // whole effect. A new peak is taken whole; a fall decays toward the
    // current input with `release` as its time constant, so after one release
    // of digital silence the envelope stands at 1/e of where it started.
    if (peak >= envelope) {
      envelope = peak;
    } else {
      envelope = peak + (envelope - peak) * Math.exp(-dt / release);
      if (envelope < ZERO_EPSILON) envelope = 0;
    }

    // The peak hold is quoted per frame in §08 and applied per unit time here,
    // so the ceiling falls at the same rate on a 60 Hz laptop and a 120 Hz
    // tablet. Anything else makes the art depend on the display.
    hold = Math.max(envelope, hold * PEAK_HOLD_PER_FRAME ** (dt / REFERENCE_FRAME_MS));
    if (hold < ZERO_EPSILON) hold = 0;

    silentMs = envelope < floor ? silentMs + dt : 0;
    elapsedMs += dt;

    if (envelope > bucketPeak) bucketPeak = envelope;

    // Bucket boundaries come off the absolute elapsed time and the rate, never
    // off a running remainder against BUCKET_MS.
    //
    // `BUCKET_MS` is `1000 / 30`, which is not representable: it stores as
    // 33.333333333333336, a hair ABOVE the true value. Subtracting it from a
    // remainder therefore leaves a deficit, and at exact multiples that deficit
    // swallows a whole bucket — a single `step(BUCKET_MS * 3)` closed two
    // buckets rather than three, because 3 × BUCKET_MS rounds to 100.0 while
    // three subtractions need 100.00000000000001. The error also compounds, so
    // a long recording drifts off the grid it is supposed to define.
    //
    // Multiplying by the rate before dividing keeps the comparison on integers
    // and makes the count a pure function of elapsed time, which is what §07 of
    // the brief requires: the same buckets on a 60 Hz laptop and a 120 Hz
    // tablet, and the same buckets whatever the frame cadence in between.
    const nextBucket = Math.floor((elapsedMs * BUCKET_HZ) / 1000 + BUCKET_EPSILON);
    let closed: number[] | readonly number[] = NO_BUCKETS;
    while (bucketIndex < nextBucket) {
      bucketIndex += 1;
      if (closed === NO_BUCKETS) closed = [];
      (closed as number[]).push(bucketPeak);
      buckets += 1;
      // The next bucket starts where this one ended, not at zero: a bucket
      // boundary is not an event in the audio.
      bucketPeak = envelope;
    }

    frame = {
      peak,
      level: envelope,
      hold,
      display: visualGain(envelope),
      dbfs: toDbfs(envelope),
      quiet: envelope < floor,
      silentMs,
      elapsedMs,
      buckets,
      bucket: closed.length > 0 ? (closed[closed.length - 1] as number) : null,
      closed,
    };

    for (const listener of listeners) listener(frame);
    return frame;
  }

  function pump(n: number, dtMs: number): SignalFrame {
    for (let i = 0; i < n; i += 1) step(dtMs);
    return frame;
  }

  return {
    get frame() {
      return frame;
    },
    get lastDeltaMs() {
      return lastDeltaMs;
    },
    step,
    pump,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setSource(next) {
      source = next;
    },
    reset() {
      envelope = 0;
      hold = 0;
      silentMs = 0;
      elapsedMs = 0;
      buckets = 0;
      bucketPeak = 0;
      bucketIndex = 0;
      lastDeltaMs = 0;
      frame = REST;
    },
  };
}
