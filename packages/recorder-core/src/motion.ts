/**
 * The six numbers that decide whether the meter reads as an instrument.
 *
 * ZoBlocks's motion layer has four durations and two curves and no springs. A
 * level meter needs one thing that layer does not have — an asymmetric
 * envelope — and it needs it to be exact, so these live here rather than in
 * the token set. Every one of them is quoted from §08 of the brief.
 *
 * A meter that rises and falls at the same rate reads as jelly. A meter that
 * rises instantly and falls slowly reads as an instrument, because that is
 * what every peak-programme meter, VU meter and DAW fader has done for sixty
 * years. Symmetric smoothing is the single commonest defect in audio UI. If a
 * future change makes ATTACK_MS non-zero to "smooth things out", it has
 * removed the effect this package exists to produce.
 */

/**
 * Instant. A peak meter that smooths its rise under-reports the transient it
 * exists to catch, and the transient is the evidence the microphone is open.
 */
export const ATTACK_MS = 0;

/**
 * Exponential decay time constant, in milliseconds.
 *
 * Slow enough to read at a glance, fast enough to follow a consonant. Below
 * ~120 ms it flickers; above ~250 ms it lags the voice and looks pre-recorded.
 * It is a time constant, so after one RELEASE_MS of silence the envelope has
 * fallen to 1/e — that is the numeric assertion in the test suite.
 */
export const RELEASE_MS = 180;

/**
 * The slow outer ring in the Pulse art: a ceiling the eye can compare the
 * live level against, which is what makes a drop in level legible rather than
 * merely visible.
 *
 * Quoted per frame in the brief. Applied here per REFERENCE_FRAME_MS so the
 * hold falls at the same rate on a 60 Hz laptop and a 120 Hz tablet.
 */
export const PEAK_HOLD_PER_FRAME = 0.985;

/** The frame the per-frame constants above were quoted against. */
export const REFERENCE_FRAME_MS = 1000 / 60;

/**
 * Above room tone, below a quiet word. Drives the silence budget and the
 * transcript's turn detection. A tunable, and the tunable that will need
 * field data.
 */
export const VOICE_FLOOR = 0.085;

/**
 * Ears are logarithmic. A linear bar spends most of its travel on the top few
 * dB and looks dead during ordinary speech.
 */
export const VISUAL_GAIN_EXPONENT = 0.62;

/**
 * The record dot, and the only element on the surface permitted to loop. Slow
 * enough to read as a state rather than an alarm.
 */
export const REC_BREATHE_MS = 2000;

/**
 * Peak buckets per second.
 *
 * Independent of frame rate, so the waveform is identical on a 60 Hz laptop
 * and a 120 Hz tablet — which also makes it screenshot-stable, and therefore
 * testable.
 */
export const BUCKET_HZ = 30;

/** One bucket, in milliseconds. */
export const BUCKET_MS = 1000 / BUCKET_HZ;

/**
 * Milliseconds continuously below the voice floor before the component
 * escalates from "quiet" to "no voice — check the microphone".
 */
export const DEFAULT_SILENCE_BUDGET_MS = 20_000;

/**
 * Below the floor but under this, the room is merely quiet. Above it and
 * below the budget, the component says how long it has been silent — which is
 * the number that catches a muted microphone before minute twenty.
 */
export const QUIET_GRACE_MS = 3_000;

/**
 * The level event is throttled to this. Nobody wants sixty React renders a
 * second, and a host binding state to it at frame rate is the commonest way a
 * recorder makes the rest of a chart janky.
 */
export const LEVEL_EVENT_HZ = 10;

/**
 * Twenty minutes of buckets. 36,000 × 4 bytes = 144 kB as a `Float32Array`,
 * which is small enough to hold in memory, post to a worker and serialise as
 * a sidecar — against roughly 58 million samples for the same audio at 48 kHz.
 */
export const DEFAULT_BUFFER_CAPACITY = 20 * 60 * BUCKET_HZ;

/**
 * Above roughly this many bars, the arts switch from one DOM element per
 * bucket to a single canvas. Not a preference: 220 elements each taking a
 * style write per frame is already measurable on the mid-range Android tablet
 * a community nurse actually carries.
 */
export const DOM_BAR_CEILING = 200;

/**
 * Below this width the `bars` art reports itself as `strip` — the same
 * self-demotion `pulse-loader` already does below 40 px.
 */
export const BARS_MIN_WIDTH_PX = 280;

/** Every number above, as one frozen record, for the docs table and the tests. */
export const RECORDER_MOTION = Object.freeze({
  attackMs: ATTACK_MS,
  releaseMs: RELEASE_MS,
  peakHoldPerFrame: PEAK_HOLD_PER_FRAME,
  voiceFloor: VOICE_FLOOR,
  visualGain: VISUAL_GAIN_EXPONENT,
  recBreatheMs: REC_BREATHE_MS,
});
