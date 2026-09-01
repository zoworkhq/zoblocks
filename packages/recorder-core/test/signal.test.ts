/**
 * The envelope, numerically.
 *
 * These are the assertions that stop a future change "improving" the meter
 * into a lava lamp. Attack is instant and release is a 180 ms time constant,
 * and both are checked against the arithmetic rather than against a snapshot
 * of how it looked on the day.
 */

import { describe, expect, it } from "vitest";
import {
  BUCKET_MS,
  DBFS_FLOOR,
  RELEASE_MS,
  VOICE_FLOOR,
  createRateGate,
  createSignal,
  framePeak,
  toDbfs,
  visualGain,
} from "../src/index";
import type { TimeDomainSource } from "../src/index";

/** An analyser that reports whatever the test last set. */
function fakeSource(initial = 0): TimeDomainSource & { level: number } {
  return {
    level: initial,
    getFloatTimeDomainData(target: Float32Array) {
      target.fill(0);
      // One sample at the amplitude, because peak detection reads the maximum
      // magnitude — if it were RMS this would be all but invisible, which is
      // the distinction the choice of peak exists to preserve.
      target[0] = this.level;
    },
  };
}

describe("framePeak", () => {
  it("takes the maximum magnitude, not the mean", () => {
    const samples = new Float32Array([0, 0, 0, 0, -0.8, 0, 0, 0]);
    // The literal is stored as Float32 and comes back as 0.800000011920929.
    // Asserting to 5e-11 would be asserting that Float32Array is lossless,
    // which no correct implementation can satisfy; 6 places is the ceiling
    // single precision actually offers.
    expect(framePeak(samples)).toBeCloseTo(0.8, 6);
  });

  it("reports exact zero for digital silence", () => {
    expect(framePeak(new Float32Array(64))).toBe(0);
  });

  it("clamps a clipped sample rather than reporting above full scale", () => {
    expect(framePeak(new Float32Array([1.4]))).toBe(1);
  });
});

describe("createSignal — attack", () => {
  it("takes a new peak whole, in one step, at any delta", () => {
    const source = fakeSource(0);
    const signal = createSignal({ source });

    signal.step(16);
    expect(signal.frame.level).toBe(0);

    source.level = 0.75;
    // One step, and the whole peak is there. A smoothed rise would report
    // something under 0.75 here, and would under-report every transient that
    // proves the microphone is open.
    expect(signal.step(1).level).toBeCloseTo(0.75, 10);
  });

  it("does not depend on the delta it was stepped with", () => {
    const source = fakeSource(0.5);
    const slow = createSignal({ source });
    const fast = createSignal({ source });

    expect(slow.step(33).level).toBeCloseTo(fast.step(4).level, 10);
  });
});

describe("createSignal — release", () => {
  it("falls to 1/e after exactly one release constant", () => {
    const source = fakeSource(1);
    const signal = createSignal({ source });
    signal.step(0);
    expect(signal.frame.level).toBe(1);

    source.level = 0;
    signal.step(RELEASE_MS);

    expect(signal.frame.level).toBeCloseTo(Math.exp(-1), 10);
  });

  it("reaches the same place in one step or in many", () => {
    const source = fakeSource(1);
    const once = createSignal({ source });
    const many = createSignal({ source });
    once.step(0);
    many.step(0);

    source.level = 0;
    once.step(RELEASE_MS);
    // 30 steps of 6 ms is the same 180 ms. An envelope that disagreed here
    // would render differently on a 60 Hz laptop and a 120 Hz tablet, and no
    // visual regression test could ever pin it down.
    many.pump(30, RELEASE_MS / 30);

    expect(many.frame.level).toBeCloseTo(once.frame.level, 9);
  });

  it("decays toward the current input, not toward zero", () => {
    const source = fakeSource(1);
    const signal = createSignal({ source });
    signal.step(0);

    source.level = 0.25;
    signal.step(RELEASE_MS);

    // 0.25 + (1 - 0.25) / e
    expect(signal.frame.level).toBeCloseTo(0.25 + 0.75 * Math.exp(-1), 10);
  });

  it("reaches true zero rather than an asymptotic residue", () => {
    const source = fakeSource(1);
    const signal = createSignal({ source });
    signal.step(0);

    source.level = 0;
    signal.pump(100, 100);

    // Silence is drawn at true zero. A bar that touches the centre hairline
    // means the recogniser is receiving nothing, and 1e-14 is not that.
    expect(signal.frame.level).toBe(0);
    expect(signal.frame.display).toBe(0);
    expect(signal.frame.dbfs).toBe(DBFS_FLOOR);
  });
});

describe("createSignal — the peak hold", () => {
  it("never sits below the live level", () => {
    const source = fakeSource(0.9);
    const signal = createSignal({ source });
    signal.step(16);
    expect(signal.frame.hold).toBeGreaterThanOrEqual(signal.frame.level);
  });

  it("falls at the same rate whatever the frame rate", () => {
    const source = fakeSource(1);
    const sixty = createSignal({ source });
    const oneTwenty = createSignal({ source });
    sixty.step(0);
    oneTwenty.step(0);

    source.level = 0;
    sixty.pump(60, 1000 / 60);
    oneTwenty.pump(120, 1000 / 120);

    expect(oneTwenty.frame.hold).toBeCloseTo(sixty.frame.hold, 9);
  });
});

describe("createSignal — buckets", () => {
  it("closes one bucket per 1/30 s regardless of the frame rate", () => {
    const source = fakeSource(0.5);
    const signal = createSignal({ source });

    // Exactly one second at 60 fps.
    signal.pump(60, 1000 / 60);
    expect(signal.frame.buckets).toBe(30);

    const fast = createSignal({ source });
    fast.pump(120, 1000 / 120);
    expect(fast.frame.buckets).toBe(30);
  });

  it("reports the buckets that closed on the pass that closed them", () => {
    const source = fakeSource(0.4);
    const signal = createSignal({ source });

    const frame = signal.step(BUCKET_MS * 3);
    expect(frame.closed).toHaveLength(3);
    expect(frame.bucket).toBeCloseTo(0.4, 6);
  });

  it("leaves no bucket closed on a pass shorter than the grid", () => {
    const signal = createSignal({ source: fakeSource(0.4) });
    const frame = signal.step(1);
    expect(frame.closed).toHaveLength(0);
    expect(frame.bucket).toBeNull();
  });

  it("holds the peak inside a bucket rather than the last frame of it", () => {
    const source = fakeSource(0);
    const signal = createSignal({ source });

    source.level = 0.9;
    signal.step(1);
    source.level = 0;
    // A short shout early in the bucket must survive to the bucket, or the
    // waveform loses exactly the events that prove the microphone is open.
    const frame = signal.step(BUCKET_MS);
    expect(frame.bucket).toBeCloseTo(0.9, 6);
  });
});

describe("createSignal — the silence budget", () => {
  it("counts continuously below the floor and resets the moment voice returns", () => {
    const source = fakeSource(0);
    const signal = createSignal({ source });

    signal.pump(10, 100);
    expect(signal.frame.silentMs).toBe(1000);
    expect(signal.frame.quiet).toBe(true);

    source.level = 0.5;
    signal.step(16);
    expect(signal.frame.silentMs).toBe(0);
    expect(signal.frame.quiet).toBe(false);
  });

  it("treats the floor as the boundary it is documented to be", () => {
    const source = fakeSource(VOICE_FLOOR + 0.001);
    const signal = createSignal({ source });
    expect(signal.step(16).quiet).toBe(false);

    source.level = VOICE_FLOOR - 0.001;
    // The release keeps the envelope up for a moment, so silence is asserted
    // after the tail rather than on the first frame under the floor.
    signal.pump(20, 50);
    expect(signal.frame.quiet).toBe(true);
  });
});

describe("createSignal — no source", () => {
  it("is at rest, and says so, rather than pretending", () => {
    const signal = createSignal();
    signal.pump(60, 16);
    expect(signal.frame.level).toBe(0);
    expect(signal.frame.quiet).toBe(true);
    expect(signal.frame.silentMs).toBeGreaterThan(900);
  });

  it("picks up a source that arrives later", () => {
    const signal = createSignal();
    signal.step(16);
    signal.setSource(fakeSource(0.6));
    // Same Float32 round-trip as above; 6 places is the honest ceiling.
    expect(signal.step(16).level).toBeCloseTo(0.6, 6);
  });
});

describe("createSignal — housekeeping", () => {
  it("notifies subscribers with every frame and stops on unsubscribe", () => {
    const signal = createSignal({ source: fakeSource(0.3) });
    const seen: number[] = [];
    const off = signal.subscribe((frame) => seen.push(frame.level));

    signal.pump(3, 16);
    expect(seen).toHaveLength(3);

    off();
    signal.step(16);
    expect(seen).toHaveLength(3);
  });

  it("returns to rest on reset", () => {
    const signal = createSignal({ source: fakeSource(0.8) });
    signal.pump(60, 16);
    signal.reset();
    expect(signal.frame.level).toBe(0);
    expect(signal.frame.buckets).toBe(0);
    expect(signal.frame.elapsedMs).toBe(0);
  });

  it("clamps an absurd delta but keeps the raw one for the gap detector", () => {
    const signal = createSignal({ source: fakeSource(0), maxStepMs: 1000 });
    signal.step(600_000);
    expect(signal.frame.elapsedMs).toBe(1000);
    expect(signal.lastDeltaMs).toBe(600_000);
  });

  it("ignores a delta that is not a number", () => {
    const signal = createSignal({ source: fakeSource(0.5) });
    signal.step(Number.NaN);
    expect(signal.frame.elapsedMs).toBe(0);
  });

  it("refuses a release or floor that cannot mean anything", () => {
    expect(() => createSignal({ release: 0 })).toThrow(RangeError);
    expect(() => createSignal({ floor: 1 })).toThrow(RangeError);
  });
});

describe("visualGain and toDbfs", () => {
  it("lifts ordinary speech off the floor", () => {
    // The point of the 0.62 exponent: a linear bar spends most of its travel
    // on the top few dB and looks dead during ordinary speech.
    expect(visualGain(0.1)).toBeGreaterThan(0.1);
    expect(visualGain(1)).toBe(1);
    expect(visualGain(0)).toBe(0);
    expect(visualGain(-1)).toBe(0);
  });

  it("floors dBFS at a number a reader can use", () => {
    expect(toDbfs(0)).toBe(DBFS_FLOOR);
    expect(toDbfs(1)).toBeCloseTo(0, 10);
    expect(toDbfs(0.5)).toBeCloseTo(-6.0206, 3);
  });
});

describe("createRateGate", () => {
  it("opens at the requested rate off the same clock as the loop", () => {
    const gate = createRateGate(10);
    // Open immediately: the first level is news.
    expect(gate(0)).toBe(true);
    expect(gate(50)).toBe(false);
    expect(gate(50)).toBe(true);
    expect(gate(16)).toBe(false);
  });

  it("emits once for a delta that spans several periods", () => {
    const gate = createRateGate(10);
    gate(0);
    expect(gate(1000)).toBe(true);
    expect(gate(0)).toBe(false);
  });

  it("refuses a rate that cannot mean anything", () => {
    expect(() => createRateGate(0)).toThrow(RangeError);
  });
});
