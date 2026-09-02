/**
 * The ring, the reduction, and the sidecar contract.
 *
 * The sidecar is a format two codebases that do not share a language have to
 * agree on, so the round trip is asserted rather than assumed — including the
 * part where it is lossy, because a format that quietly quantises is a format
 * someone will one day try to reconstruct audio from.
 */

import { describe, expect, it } from "vitest";
import {
  BUCKET_HZ,
  DEFAULT_BUFFER_CAPACITY,
  PeakBuffer,
  SPEAKER_UNKNOWN,
  decodeBase64,
  encodeBase64,
  reducePeaks,
  reduceSpeakers,
} from "../src/index";

describe("PeakBuffer — the ring", () => {
  it("holds twenty minutes at 30 Hz by default", () => {
    expect(DEFAULT_BUFFER_CAPACITY).toBe(36_000);
    // 144 kB, which is the number the whole design rests on: it is small
    // enough to hold, post to a worker and serialise, against 58 million
    // samples for the same audio.
    expect(new Float32Array(DEFAULT_BUFFER_CAPACITY).byteLength).toBe(144_000);
  });

  it("takes that default when the host asks for no particular size", () => {
    // The common construction, and the one a host writes without thinking:
    // twenty minutes of buckets at the bucket rate, allocated up front so a
    // recorder never pauses to reallocate in the middle of a consultation.
    const buffer = new PeakBuffer();
    expect(buffer.capacity).toBe(DEFAULT_BUFFER_CAPACITY);
    expect(buffer.hz).toBe(BUCKET_HZ);
    expect(buffer.length).toBe(0);
    expect(buffer.written).toBe(0);
    expect(buffer.durationMs).toBe(0);
  });

  it("reads back what was written, oldest first", () => {
    const buffer = new PeakBuffer({ capacity: 8 });
    for (const value of [0.1, 0.2, 0.3]) buffer.push(value);
    expect(Array.from(buffer.toArray())).toEqual([
      Math.fround(0.1),
      Math.fround(0.2),
      Math.fround(0.3),
    ]);
    expect(buffer.length).toBe(3);
    expect(buffer.written).toBe(3);
  });

  it("drops the oldest bucket once it wraps, and still reads oldest first", () => {
    const buffer = new PeakBuffer({ capacity: 4 });
    for (const value of [1, 2, 3, 4, 5, 6]) buffer.push(value / 10);
    expect(buffer.length).toBe(4);
    expect(buffer.written).toBe(6);
    expect(Array.from(buffer.toArray()).map((v) => Math.round(v * 10))).toEqual([3, 4, 5, 6]);
  });

  it("clamps rather than throwing on a clipped bucket", () => {
    const buffer = new PeakBuffer({ capacity: 2 });
    buffer.push(1.4);
    buffer.push(Number.NaN);
    expect(buffer.at(0)).toBe(1);
    expect(buffer.at(1)).toBe(0);
  });

  it("reports zero outside its readable range rather than undefined", () => {
    const buffer = new PeakBuffer({ capacity: 4 });
    buffer.push(0.5);
    expect(buffer.at(-1)).toBe(0);
    expect(buffer.at(9)).toBe(0);
  });

  it("converts its length to a duration at its own rate", () => {
    const buffer = new PeakBuffer({ capacity: 100, hz: 30 });
    for (let i = 0; i < 60; i += 1) buffer.push(0.5);
    expect(buffer.durationMs).toBeCloseTo(2000, 6);
  });

  it("gives the newest N for a scrolling art", () => {
    const buffer = new PeakBuffer({ capacity: 16 });
    for (let i = 1; i <= 10; i += 1) buffer.push(i / 10);
    expect(Array.from(buffer.window(3)).map((v) => Math.round(v * 10))).toEqual([8, 9, 10]);
    expect(buffer.window(99)).toHaveLength(10);
    expect(buffer.window(0)).toHaveLength(0);
  });

  it("clears to empty", () => {
    const buffer = new PeakBuffer({ capacity: 4 });
    buffer.push(0.5);
    buffer.clear();
    expect(buffer.length).toBe(0);
    expect(buffer.written).toBe(0);
  });

  it("refuses a capacity that cannot hold anything", () => {
    expect(() => new PeakBuffer({ capacity: 0 })).toThrow(RangeError);
    expect(() => new PeakBuffer({ capacity: 1.5 })).toThrow(RangeError);
  });
});

describe("PeakBuffer — the speaker lane", () => {
  it("is absent unless asked for, and reports unknown rather than guessing", () => {
    const buffer = new PeakBuffer({ capacity: 4 });
    buffer.push(0.5, 2);
    expect(buffer.hasSpeakers).toBe(false);
    expect(buffer.speakerAt(0)).toBe(SPEAKER_UNKNOWN);
    expect(buffer.toSpeakers()).toHaveLength(0);
  });

  it("carries one byte per bucket when allocated", () => {
    const buffer = new PeakBuffer({ capacity: 4, speakers: true });
    buffer.push(0.5, 1);
    buffer.push(0.5, 2);
    buffer.push(0.5);
    expect(Array.from(buffer.toSpeakers())).toEqual([1, 2, SPEAKER_UNKNOWN]);
  });

  it("collapses a speaker id that is not a finite number to unknown", () => {
    // Diarisation that hands back NaN is diarisation with no opinion, and
    // `Uint8Array` would coerce it to 0 anyway — but silently, and 0 is a
    // meaning here rather than a fallback. Infinity is not clamped to 255
    // either: it is not an id, and unknown is not a guess.
    const buffer = new PeakBuffer({ capacity: 4, speakers: true });
    buffer.push(0.5, Number.NaN);
    buffer.push(0.5, Number.POSITIVE_INFINITY);
    expect(Array.from(buffer.toSpeakers())).toEqual([SPEAKER_UNKNOWN, SPEAKER_UNKNOWN]);
  });

  it("clamps a speaker id to the byte the lane can hold", () => {
    const buffer = new PeakBuffer({ capacity: 4, speakers: true });
    buffer.push(0.5, 900);
    buffer.push(0.5, -3);
    buffer.push(0.5, 2.7);
    expect(Array.from(buffer.toSpeakers())).toEqual([255, SPEAKER_UNKNOWN, 2]);
  });
});

describe("reducePeaks", () => {
  it("returns the input untouched when it already fits", () => {
    const peaks = new Float32Array([0.1, 0.2, 0.3]);
    expect(Array.from(reducePeaks(peaks, 8))).toEqual(Array.from(peaks));
  });

  it("preserves the transient rather than averaging it away", () => {
    const peaks = new Float32Array(64);
    peaks[37] = 1;
    const reduced = reducePeaks(peaks, 8);
    expect(reduced).toHaveLength(8);
    // A mean reduction would report 1/8 here and the shout would vanish from
    // the overview. Max is the whole point.
    expect(Math.max(...Array.from(reduced))).toBe(1);
  });

  it("reduces to exactly the requested width", () => {
    const peaks = new Float32Array(1000).fill(0.5);
    for (const width of [1, 7, 100, 333]) {
      expect(reducePeaks(peaks, width)).toHaveLength(width);
    }
  });

  it("handles an odd run without dropping its last bucket", () => {
    const peaks = new Float32Array([0, 0, 0, 0, 0, 1, 0]);
    expect(Math.max(...Array.from(reducePeaks(peaks, 2)))).toBe(1);
  });

  it("treats a nonsense width as one bucket", () => {
    expect(reducePeaks(new Float32Array(10).fill(0.5), 0)).toHaveLength(1);
  });
});

describe("reduceSpeakers", () => {
  it("gives a reduced bucket to whoever held the floor for most of it", () => {
    const speakers = new Uint8Array([1, 1, 1, 2, 2, 2, 2, 2]);
    expect(Array.from(reduceSpeakers(speakers, 2))).toEqual([1, 2]);
  });

  it("returns unknown for a contested bucket rather than picking one", () => {
    // A wrongly attributed rail is worse than no attribution, so a tie
    // collapses to unknown and the art draws a single rail.
    const speakers = new Uint8Array([1, 2]);
    expect(Array.from(reduceSpeakers(speakers, 1))).toEqual([SPEAKER_UNKNOWN]);
  });

  it("returns the input untouched when it already fits", () => {
    const speakers = new Uint8Array([1, 2, 1]);
    expect(Array.from(reduceSpeakers(speakers, 8))).toEqual([1, 2, 1]);
  });
});

describe("base64", () => {
  it("round-trips every byte value", () => {
    const bytes = new Uint8Array(256);
    for (let i = 0; i < 256; i += 1) bytes[i] = i;
    expect(Array.from(decodeBase64(encodeBase64(bytes)))).toEqual(Array.from(bytes));
  });

  it("pads the two ragged lengths correctly", () => {
    expect(encodeBase64(new Uint8Array([77]))).toBe("TQ==");
    expect(encodeBase64(new Uint8Array([77, 97]))).toBe("TWE=");
    expect(encodeBase64(new Uint8Array([77, 97, 110]))).toBe("TWFu");
    expect(Array.from(decodeBase64("TQ=="))).toEqual([77]);
    expect(Array.from(decodeBase64("TWE="))).toEqual([77, 97]);
  });

  it("encodes nothing as nothing", () => {
    expect(encodeBase64(new Uint8Array(0))).toBe("");
    expect(decodeBase64("")).toHaveLength(0);
  });

  it("ignores whitespace a transport may have wrapped in", () => {
    expect(Array.from(decodeBase64("TWFu\n"))).toEqual([77, 97, 110]);
  });
});

describe("the peaks sidecar", () => {
  it("round-trips the shape, the rate and the length", () => {
    const buffer = new PeakBuffer({ capacity: 128, hz: 30 });
    for (let i = 0; i < 100; i += 1) buffer.push(i / 100);

    const sidecar = buffer.serialise();
    expect(sidecar).toMatchObject({ version: 1, hz: 30, bits: 8, length: 100 });
    expect(sidecar.speakers).toBeUndefined();

    const parsed = PeakBuffer.parse(sidecar);
    expect(parsed.length).toBe(100);
    expect(parsed.hz).toBe(30);
    for (let i = 0; i < 100; i += 1) {
      // Lossy by design: one byte per bucket, which is four times smaller than
      // the Float32Array and indistinguishable at any width a screen has.
      expect(parsed.at(i)).toBeCloseTo(i / 100, 2);
    }
  });

  it("carries the speaker lane when there is one", () => {
    const buffer = new PeakBuffer({ capacity: 8, speakers: true });
    buffer.push(0.5, 1);
    buffer.push(0.5, 2);

    const sidecar = buffer.serialise();
    expect(sidecar.speakers).toBeTypeOf("string");

    const parsed = PeakBuffer.parse(sidecar);
    expect(parsed.hasSpeakers).toBe(true);
    expect(Array.from(parsed.toSpeakers())).toEqual([1, 2]);
  });

  it("refuses a version it does not know", () => {
    const buffer = new PeakBuffer({ capacity: 4 });
    buffer.push(0.5);
    const sidecar = { ...buffer.serialise(), version: 2 as unknown as 1 };
    expect(() => PeakBuffer.parse(sidecar)).toThrow(RangeError);
  });

  it("parses an empty sidecar without allocating a zero-length ring", () => {
    const parsed = PeakBuffer.parse({ version: 1, hz: 30, bits: 8, length: 0, peaks: "" });
    expect(parsed.length).toBe(0);
  });

  it("computes an overview from a parsed sidecar without touching audio", () => {
    const buffer = new PeakBuffer({ capacity: 512 });
    for (let i = 0; i < 500; i += 1) buffer.push(i === 250 ? 1 : 0.1);
    const overview = PeakBuffer.parse(buffer.serialise()).reduce(40);
    expect(overview).toHaveLength(40);
    expect(Math.max(...Array.from(overview))).toBe(1);
  });
});
