/**
 * `PeakBuffer` — the array both ends of the product read.
 *
 * A twenty-minute encounter is about 58 million samples at 48 kHz. It is
 * 36,000 buckets at 30 Hz: 144 kB as a `Float32Array`, which you can hold in
 * memory, post to a worker, serialise as a peaks sidecar, and downsample by
 * binary reduction for an overview without ever touching the audio again.
 *
 * That last point is what makes the Duet art possible at all. Computing peaks
 * in the browser means downloading the whole take first, so a twelve-minute
 * consultation shows a spinner before it shows a waveform. The sidecar this
 * file serialises is meant to be emitted at ingest, server side, from this
 * same reduction — the format is here so both ends share one definition
 * rather than two that agree until they do not.
 *
 * §02 of the brief is the reason there is one buffer and not two: record and
 * listen differ by which end of it you read. A player is a recorder whose
 * array stopped growing.
 */

import { BUCKET_HZ, DEFAULT_BUFFER_CAPACITY } from "./motion";

/**
 * A speaker byte per bucket: the second lane of the sidecar.
 *
 * 0 means unknown, and unknown is not a guess. Where diarisation is absent
 * the Duet art collapses to a single rail rather than attributing a rail
 * wrongly, because a wrongly attributed rail is worse than no attribution.
 */
export const SPEAKER_UNKNOWN = 0;

export interface PeakBufferOptions {
  /** Buckets held. Older ones fall off the front. Defaults to twenty minutes. */
  readonly capacity?: number;
  /** Buckets per second. Only used to convert indices to time. */
  readonly hz?: number;
  /** Allocate the speaker lane. Costs one byte per bucket. */
  readonly speakers?: boolean;
}

/**
 * The peaks sidecar.
 *
 * Deliberately boring: a version, a rate, and two base64 strings. It is a
 * contract between a browser and an ingest pipeline that will not share a
 * language, so it carries no binary framing and no assumptions about
 * endianness — peaks are quantised to a byte, which is four times smaller
 * than the `Float32Array` and indistinguishable at any width a screen has.
 */
export interface PeaksSidecar {
  readonly version: 1;
  /** Buckets per second the peaks were written at. */
  readonly hz: number;
  /** Quantisation. Only 8 exists today; the field is here so a 16 can arrive. */
  readonly bits: 8;
  /** Buckets encoded. */
  readonly length: number;
  /** Base64 of one unsigned byte per bucket: `round(peak * 255)`. */
  readonly peaks: string;
  /** Base64 of one speaker byte per bucket, when diarisation was available. */
  readonly speakers?: string;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Base64, hand-rolled.
 *
 * `btoa` is a browser global and `Buffer` is a Node one. This package has
 * neither as a dependency and runs in both, so twenty lines here is cheaper
 * than an environment check that will be wrong in a worker.
 */
export function encodeBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] as number;
    const b = i + 1 < bytes.length ? (bytes[i + 1] as number) : 0;
    const c = i + 2 < bytes.length ? (bytes[i + 2] as number) : 0;
    out += B64[a >> 2];
    out += B64[((a & 0b11) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? B64[((b & 0b1111) << 2) | (c >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[c & 0b111111] : "=";
  }
  return out;
}

export function decodeBase64(text: string): Uint8Array {
  const clean = text.replace(/[^A-Za-z0-9+/]/g, "");
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let out = 0;
  let bits = 0;
  let accumulator = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const value = B64.indexOf(clean[i] as string);
    if (value < 0) continue;
    accumulator = (accumulator << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[out] = (accumulator >> bits) & 0xff;
      out += 1;
    }
  }
  return bytes.subarray(0, out);
}

/**
 * A ring of per-bucket peaks, with the speaker lane beside it.
 *
 * Fixed allocation: a recorder that grows an array for twenty minutes is a
 * recorder that pauses to reallocate in the middle of a consultation.
 */
export class PeakBuffer {
  readonly capacity: number;
  readonly hz: number;

  private readonly peaks: Float32Array;
  private readonly speakerLane: Uint8Array | null;
  /** Total buckets ever pushed, including any that have fallen off the front. */
  private total = 0;

  constructor(options: PeakBufferOptions = {}) {
    const capacity = options.capacity ?? DEFAULT_BUFFER_CAPACITY;
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError(`PeakBuffer: capacity must be a positive integer, got ${capacity}`);
    }
    this.capacity = capacity;
    this.hz = options.hz ?? BUCKET_HZ;
    this.peaks = new Float32Array(capacity);
    this.speakerLane = options.speakers === true ? new Uint8Array(capacity) : null;
  }

  /** Buckets currently readable. */
  get length(): number {
    return Math.min(this.total, this.capacity);
  }

  /** Buckets ever written, including those the ring has dropped. */
  get written(): number {
    return this.total;
  }

  /** Whether a speaker lane was allocated. */
  get hasSpeakers(): boolean {
    return this.speakerLane !== null;
  }

  /** Duration of everything ever written, in ms. */
  get durationMs(): number {
    return (this.total / this.hz) * 1000;
  }

  /**
   * Append one bucket.
   *
   * Peaks are clamped rather than rejected. A source that hands back 1.4
   * because it clipped is reporting something true, and throwing on it would
   * end a recording over a number that renders as a full-height bar either
   * way.
   */
  push(peak: number, speaker: number = SPEAKER_UNKNOWN): void {
    const slot = this.total % this.capacity;
    this.peaks[slot] = Number.isFinite(peak) ? Math.min(1, Math.max(0, peak)) : 0;
    if (this.speakerLane !== null) {
      const id = Math.trunc(speaker);
      this.speakerLane[slot] = Number.isFinite(id) ? Math.min(255, Math.max(0, id)) : SPEAKER_UNKNOWN;
    }
    this.total += 1;
  }

  /** Peak at `index`, counted from the oldest readable bucket. */
  at(index: number): number {
    if (index < 0 || index >= this.length) return 0;
    return this.peaks[(this.start + index) % this.capacity] as number;
  }

  /** Speaker at `index`. `SPEAKER_UNKNOWN` when no lane was allocated. */
  speakerAt(index: number): number {
    if (this.speakerLane === null || index < 0 || index >= this.length) return SPEAKER_UNKNOWN;
    return this.speakerLane[(this.start + index) % this.capacity] as number;
  }

  private get start(): number {
    return this.total <= this.capacity ? 0 : this.total % this.capacity;
  }

  /** Everything readable, oldest first, as a contiguous copy. */
  toArray(): Float32Array {
    const out = new Float32Array(this.length);
    for (let i = 0; i < out.length; i += 1) out[i] = this.at(i);
    return out;
  }

  /** The speaker lane, oldest first. Empty when no lane was allocated. */
  toSpeakers(): Uint8Array {
    if (this.speakerLane === null) return new Uint8Array(0);
    const out = new Uint8Array(this.length);
    for (let i = 0; i < out.length; i += 1) out[i] = this.speakerAt(i);
    return out;
  }

  /**
   * The newest `count` buckets, oldest first.
   *
   * What every scrolling art reads: the right edge is the newest bucket, and
   * older buckets fall off a masked left edge.
   */
  window(count: number): Float32Array {
    const take = Math.min(Math.max(0, Math.trunc(count)), this.length);
    const out = new Float32Array(take);
    const from = this.length - take;
    for (let i = 0; i < take; i += 1) out[i] = this.at(from + i);
    return out;
  }

  /**
   * Downsample to at most `width` buckets by binary reduction.
   *
   * Repeated max-of-pairs while the run is at least twice the target, then one
   * max-bin pass for the remainder. Max rather than mean throughout: an
   * overview that averages loses the transient, and the transient is the part
   * that proves the microphone was open.
   */
  reduce(width: number): Float32Array {
    return reducePeaks(this.toArray(), width);
  }

  /** Drop everything. A new encounter, not a rewind. */
  clear(): void {
    this.peaks.fill(0);
    this.speakerLane?.fill(0);
    this.total = 0;
  }

  /** Serialise for the sidecar contract in §07. */
  serialise(): PeaksSidecar {
    const peaks = this.toArray();
    const quantised = new Uint8Array(peaks.length);
    for (let i = 0; i < peaks.length; i += 1) {
      quantised[i] = Math.round((peaks[i] as number) * 255);
    }
    const sidecar: PeaksSidecar = {
      version: 1,
      hz: this.hz,
      bits: 8,
      length: peaks.length,
      peaks: encodeBase64(quantised),
    };
    if (this.speakerLane === null) return sidecar;
    return { ...sidecar, speakers: encodeBase64(this.toSpeakers()) };
  }

  /**
   * Rebuild from a sidecar.
   *
   * The lossy half of a round trip: peaks come back quantised to a byte. That
   * is deliberate and it is what the format promises — an overview, not the
   * audio.
   */
  static parse(sidecar: PeaksSidecar): PeakBuffer {
    if (sidecar.version !== 1) {
      throw new RangeError(`PeakBuffer.parse: unsupported sidecar version ${sidecar.version}`);
    }
    const peaks = decodeBase64(sidecar.peaks);
    const speakers = sidecar.speakers === undefined ? null : decodeBase64(sidecar.speakers);
    const length = Math.min(sidecar.length, peaks.length);
    const buffer = new PeakBuffer({
      capacity: Math.max(1, length),
      hz: sidecar.hz,
      speakers: speakers !== null,
    });
    for (let i = 0; i < length; i += 1) {
      buffer.push((peaks[i] as number) / 255, speakers?.[i] ?? SPEAKER_UNKNOWN);
    }
    return buffer;
  }
}

/**
 * Binary reduction, as a free function so an overview can be computed from a
 * sidecar without constructing a ring.
 */
export function reducePeaks(peaks: Float32Array, width: number): Float32Array {
  const target = Math.max(1, Math.trunc(width));
  if (peaks.length <= target) return Float32Array.from(peaks);

  let run = peaks;
  while (run.length >= target * 2) {
    const half = new Float32Array(Math.ceil(run.length / 2));
    for (let i = 0; i < half.length; i += 1) {
      const a = run[i * 2] as number;
      const b = i * 2 + 1 < run.length ? (run[i * 2 + 1] as number) : a;
      half[i] = Math.max(a, b);
    }
    run = half;
  }

  if (run.length === target) return run;

  const out = new Float32Array(target);
  for (let i = 0; i < target; i += 1) {
    const from = Math.floor((i * run.length) / target);
    const to = Math.max(from + 1, Math.floor(((i + 1) * run.length) / target));
    let peak = 0;
    for (let j = from; j < to && j < run.length; j += 1) {
      const value = run[j] as number;
      if (value > peak) peak = value;
    }
    out[i] = peak;
  }
  return out;
}

/**
 * Reduce the speaker lane alongside the peaks.
 *
 * The speaker of a reduced bucket is the speaker that held the floor for most
 * of it, and `SPEAKER_UNKNOWN` wins ties — because collapsing a contested bin
 * onto whichever id sorts first is exactly the wrongly attributed rail the
 * Duet art refuses to draw.
 */
export function reduceSpeakers(speakers: Uint8Array, width: number): Uint8Array {
  const target = Math.max(1, Math.trunc(width));
  if (speakers.length <= target) return Uint8Array.from(speakers);

  const out = new Uint8Array(target);
  for (let i = 0; i < target; i += 1) {
    const from = Math.floor((i * speakers.length) / target);
    const to = Math.max(from + 1, Math.floor(((i + 1) * speakers.length) / target));
    const tally = new Map<number, number>();
    for (let j = from; j < to && j < speakers.length; j += 1) {
      const id = speakers[j] as number;
      tally.set(id, (tally.get(id) ?? 0) + 1);
    }
    let winner = SPEAKER_UNKNOWN;
    let best = 0;
    for (const [id, count] of tally) {
      if (count > best) {
        winner = id;
        best = count;
      } else if (count === best && id !== winner) {
        winner = SPEAKER_UNKNOWN;
      }
    }
    out[i] = winner;
  }
  return out;
}
