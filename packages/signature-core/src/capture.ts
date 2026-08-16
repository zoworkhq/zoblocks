/**
 * The capture state machine.
 *
 * Framework-free and DOM-free on purpose: it accepts plain samples, not
 * `PointerEvent`s. `packages/signature` does the event plumbing —
 * `setPointerCapture`, `touch-action: none`, coordinate mapping — and calls
 * `down` / `move` / `up` here. That split is what lets the whole engine be
 * driven by a synthetic sequence in a `node` test, with no jsdom and no
 * headless browser, and it is why the undo/redo and determinism properties can
 * be asserted rather than eyeballed.
 *
 * Time arrives as a relative offset supplied by the caller. There is no
 * `Date.now()` here — reading the clock would make identical input produce
 * different output, which is what makes visual-regression tests flaky, and on
 * a signature it would also put an unverifiable timestamp into a legal record.
 */

import type { Point, Stroke } from "./value";
import { DEFAULT_INK_THRESHOLD, assessInk, type InkThreshold, type InkVerdict } from "./strokes";

/** One sample from a pointing device. */
export interface Sample {
  x: number;
  y: number;
  /** Milliseconds since capture began. Monotonic, supplied by the caller. */
  t: number;
  /** 0–1. Devices that do not report pressure should send 0.5. */
  pressure?: number;
  pointerType?: Stroke["pointerType"];
  /** Stable per contact, so two fingers do not merge into one stroke. */
  pointerId?: number;
}

export interface CaptureOptions {
  threshold: InkThreshold;
  /**
   * Ignore touch input once a pen has been seen.
   *
   * The resting-palm problem: on a tablet, the hand holding the stylus lands on
   * the glass and draws a second stroke across the signature. Browsers do not
   * solve this — they report the palm as a legitimate touch pointer. The heuristic
   * is deliberately sticky rather than per-stroke: someone who has picked up a
   * stylus is not about to finish with a fingertip, and a palm often lands
   * *before* the nib does.
   */
  palmRejection: boolean;
  /** Cap on retained strokes, as a runaway guard. */
  maxStrokes: number;
}

export const DEFAULT_CAPTURE: CaptureOptions = {
  threshold: DEFAULT_INK_THRESHOLD,
  palmRejection: true,
  maxStrokes: 200,
};

export interface CaptureSnapshot {
  strokes: Stroke[];
  /** Finished strokes only — see `committedCount`. */
  committedCount: number;
  canUndo: boolean;
  canRedo: boolean;
  /** True when there is not enough ink to count as a signature. */
  isEmpty: boolean;
  verdict: InkVerdict;
}

/**
 * A signature in progress.
 *
 * Undo and redo are exact rather than approximate because the model is
 * retained: undo moves a whole stroke onto a redo stack and back. A pixel
 * implementation has to snapshot the bitmap per stroke to achieve the same
 * thing, and most simply do not, which is why "Back" so often means "start
 * again" in practice.
 */
export class SignatureCapture {
  readonly options: CaptureOptions;

  #strokes: Stroke[] = [];
  #redo: Stroke[] = [];
  #active: Stroke | null = null;
  #activePointerId: number | null = null;
  #penSeen = false;
  #firstT: number | null = null;
  #lastT = 0;

  constructor(options: Partial<CaptureOptions> = {}) {
    this.options = { ...DEFAULT_CAPTURE, ...options };
  }

  /* ---------------------------------------------------------------- */
  /* Input                                                             */
  /* ---------------------------------------------------------------- */

  /**
   * Begin a stroke. Returns false when the sample was rejected.
   *
   * Rejection is not an error — a rejected palm touch is the system working.
   */
  down(sample: Sample): boolean {
    const type = sample.pointerType ?? "unknown";
    if (type === "pen") this.#penSeen = true;
    if (this.#shouldReject(type)) return false;

    // A second contact while one is already down is a palm, a second finger, or
    // a stray mouse button. The first contact owns the stroke until it lifts.
    if (this.#active !== null) return false;
    if (this.#strokes.length >= this.options.maxStrokes) return false;

    this.#activePointerId = sample.pointerId ?? null;
    this.#active = { points: [this.#toPoint(sample)], pointerType: type };

    // Any new mark invalidates the redo stack, exactly as in a text editor:
    // redoing onto a diverged history would produce a signature the person
    // never drew.
    this.#redo = [];
    return true;
  }

  /** Extend the active stroke. Returns false when there is nothing to extend. */
  move(sample: Sample): boolean {
    if (!this.#active) return false;
    if (!this.#ownsPointer(sample)) return false;

    const point = this.#toPoint(sample);
    const last = this.#active.points[this.#active.points.length - 1];
    // Drop exact repeats. Pointer events fire on a timer as well as on motion,
    // so a held-still stylus otherwise accumulates hundreds of identical points.
    if (last && last.x === point.x && last.y === point.y) return false;

    this.#active.points.push(point);
    return true;
  }

  /** End the active stroke and commit it. */
  up(sample?: Sample): boolean {
    if (!this.#active) return false;
    if (sample && !this.#ownsPointer(sample)) return false;

    if (sample) {
      const point = this.#toPoint(sample);
      const last = this.#active.points[this.#active.points.length - 1];
      if (!last || last.x !== point.x || last.y !== point.y) this.#active.points.push(point);
    }

    this.#strokes.push(this.#active);
    this.#active = null;
    this.#activePointerId = null;
    return true;
  }

  /**
   * Abandon the active stroke without committing it.
   *
   * For `pointercancel`, which fires when the browser takes the gesture over —
   * a scroll starting, a system edge swipe, the tab being hidden. Committing a
   * half-drawn stroke there would leave a stray line the person did not intend
   * and cannot easily explain.
   */
  cancel(): boolean {
    if (!this.#active) return false;
    this.#active = null;
    this.#activePointerId = null;
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* History                                                           */
  /* ---------------------------------------------------------------- */

  undo(): boolean {
    if (this.#active) this.cancel();
    const stroke = this.#strokes.pop();
    if (!stroke) return false;
    this.#redo.push(stroke);
    return true;
  }

  redo(): boolean {
    const stroke = this.#redo.pop();
    if (!stroke) return false;
    this.#strokes.push(stroke);
    return true;
  }

  clear(): void {
    this.#active = null;
    this.#activePointerId = null;
    this.#strokes = [];
    this.#redo = [];
    this.#penSeen = false;
    this.#firstT = null;
    this.#lastT = 0;
  }

  /** Restore a previous model — for editing an existing signature. */
  load(strokes: readonly Stroke[]): void {
    this.clear();
    this.#strokes = strokes.map((s) => ({ ...s, points: [...s.points] }));
    this.#penSeen = this.#strokes.some((s) => s.pointerType === "pen");
  }

  /* ---------------------------------------------------------------- */
  /* Reading                                                           */
  /* ---------------------------------------------------------------- */

  /** Committed strokes, plus the one in progress. */
  get strokes(): Stroke[] {
    return this.#active ? [...this.#strokes, this.#active] : [...this.#strokes];
  }

  /**
   * Finished strokes, excluding one still being drawn.
   *
   * `strokes` deliberately includes the in-progress stroke so the ink renders
   * as the pen moves. Anything that reacts to a *completed* mark — a live
   * region announcement, an autosave — has to count this instead, or it fires
   * the instant the pen touches down and again on every sample.
   */
  get committedCount(): number {
    return this.#strokes.length;
  }

  get canUndo(): boolean {
    return this.#strokes.length > 0;
  }

  get canRedo(): boolean {
    return this.#redo.length > 0;
  }

  /** Below the ink threshold — nothing worth committing. */
  get isEmpty(): boolean {
    return !assessInk(this.strokes, this.options.threshold).ok;
  }

  /** Total time from first contact to the last sample, in ms. */
  get durationMs(): number {
    if (this.#firstT === null) return 0;
    return Math.max(0, this.#lastT - this.#firstT);
  }

  /** What actually drew this, for the capture context. */
  get pointerType(): Stroke["pointerType"] {
    const types = new Set(this.strokes.map((s) => s.pointerType));
    if (types.size === 0) return "unknown";
    const [only] = types;
    if (types.size === 1 && only) return only;
    // Mixed input: a pen anywhere in the signature is the most specific and
    // most evidential thing that touched it.
    return types.has("pen") ? "pen" : "mouse";
  }

  snapshot(): CaptureSnapshot {
    const strokes = this.strokes;
    const verdict = assessInk(strokes, this.options.threshold);
    return {
      strokes,
      committedCount: this.committedCount,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      isEmpty: !verdict.ok,
      verdict,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Internals                                                         */
  /* ---------------------------------------------------------------- */

  #shouldReject(type: Stroke["pointerType"]): boolean {
    return this.options.palmRejection && this.#penSeen && type === "touch";
  }

  #ownsPointer(sample: Sample): boolean {
    if (this.#activePointerId === null || sample.pointerId === undefined) return true;
    return sample.pointerId === this.#activePointerId;
  }

  #toPoint(sample: Sample): Point {
    if (this.#firstT === null) this.#firstT = sample.t;
    this.#lastT = Math.max(this.#lastT, sample.t);
    return {
      x: sample.x,
      y: sample.y,
      t: sample.t,
      // 0.5 is the neutral value a device without a pressure sensor reports,
      // and the value at which the width curve is unmodified.
      pressure: clamp01(sample.pressure ?? 0.5),
    };
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}
