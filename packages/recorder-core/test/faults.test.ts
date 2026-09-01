/**
 * One test per fault in §11, plus the assertion the whole module exists for:
 * that the four byte-identical failures are told apart.
 */

import { describe, expect, it } from "vitest";

import {
  RECORDER_FAULTS,
  detectFaults,
  isCapturingNothing,
  primaryFault,
  type FaultObservation,
  type RecorderFaultCode,
} from "../src/faults";
import { DEFAULT_SILENCE_BUDGET_MS } from "../src/motion";
import type { SignalFrame } from "../src/types";

function frame(overrides: Partial<SignalFrame> = {}): SignalFrame {
  return {
    peak: 0.4,
    level: 0.4,
    hold: 0.5,
    display: 0.57,
    dbfs: -8,
    quiet: false,
    silentMs: 0,
    elapsedMs: 60_000,
    buckets: 1800,
    bucket: 0.4,
    closed: [],
    ...overrides,
  };
}

/** A healthy recording: capturing, hearing speech, nothing wrong. */
function healthy(overrides: Partial<FaultObservation> = {}): FaultObservation {
  return {
    phase: "recording",
    frame: frame(),
    permission: "granted",
    track: { readyState: "live", muted: false },
    ...overrides,
  };
}

/** Digital silence, past the budget: rows 3 and 4 both look like this. */
const SILENT = frame({
  peak: 0,
  level: 0,
  hold: 0,
  display: 0,
  dbfs: -100,
  quiet: true,
  silentMs: DEFAULT_SILENCE_BUDGET_MS + 5_000,
  bucket: 0,
});

function codes(observation: FaultObservation): RecorderFaultCode[] {
  return detectFaults(observation).map((fault) => fault.code);
}

describe("detectFaults — a healthy recorder", () => {
  it("reports nothing, and returns the same array every pass", () => {
    const a = detectFaults(healthy());
    const b = detectFaults(healthy());
    expect(a).toHaveLength(0);
    // Allocation-free in the common case: this sits in the render path.
    expect(a).toBe(b);
  });

  it("does not cry silence inside the budget", () => {
    const observation = healthy({
      frame: frame({ level: 0, silentMs: DEFAULT_SILENCE_BUDGET_MS - 1 }),
    });
    expect(codes(observation)).toHaveLength(0);
  });
});

describe("detectFaults — the four that are byte-identical at the signal layer", () => {
  // This is the claim in §11 and the reason the module takes device state at
  // all. Every observation below produces the same frame; only the device
  // facts differ, and each must resolve to a different fault.

  it("3 — an OS input mute is named as one when the track reports it", () => {
    const found = detectFaults(
      healthy({ frame: SILENT, track: { readyState: "live", muted: true } }),
    );
    expect(found[0]?.code).toBe("input-muted");
    // The trap: still capturing. The file is growing and holds silence.
    expect(found[0]?.capturing).toBe(true);
    expect(found[0]?.message).toMatch(/operating system/i);
  });

  it("4 — an unreported mute names both causes rather than guessing one", () => {
    const found = detectFaults(
      healthy({ frame: SILENT, track: { readyState: "live", muted: false } }),
    );
    expect(found[0]?.code).toBe("hardware-muted");
    expect(found[0]?.capturing).toBe(true);
    expect(found[0]?.fix).toMatch(/headset/i);
    expect(found[0]?.fix).toMatch(/system input/i);
  });

  it("6 — a profile switch is caught by the sample rate, not the level", () => {
    const found = detectFaults(
      healthy({ sampleRate: 16_000, baselineSampleRate: 48_000 }),
    );
    // The meter is still moving; nothing in `frame` betrays this.
    expect(found.map((f) => f.code)).toContain("route-changed");
    expect(found[0]?.audioIntact).toBe(true);
  });

  it("7 — the wrong device sounds entirely plausible and is caught by name", () => {
    const found = detectFaults(
      healthy({
        device: { deviceId: "builtin", label: "MacBook Pro Microphone" },
        expectedDevice: { deviceId: "jabra", label: "Jabra Link 380" },
      }),
    );
    expect(found[0]?.code).toBe("device-suspect");
    expect(found[0]?.message).toContain("MacBook Pro Microphone");
    expect(found[0]?.message).toContain("Jabra Link 380");
  });

  it("tells all four apart from one another", () => {
    const seen = new Set<RecorderFaultCode>([
      codes(healthy({ frame: SILENT, track: { readyState: "live", muted: true } }))[0]!,
      codes(healthy({ frame: SILENT, track: { readyState: "live", muted: false } }))[0]!,
      codes(healthy({ sampleRate: 16_000, baselineSampleRate: 48_000 }))[0]!,
      codes(
        healthy({
          device: { deviceId: "a", label: "A" },
          expectedDevice: { deviceId: "b", label: "B" },
        }),
      )[0]!,
    ]);
    expect(seen.size).toBe(4);
  });
});

describe("detectFaults — permission", () => {
  it("1 — denied is a dead end and does not offer a retry", () => {
    const found = detectFaults(healthy({ phase: "idle", permission: "denied" }));
    expect(found[0]?.code).toBe("permission-denied");
    expect(found[0]?.fix).not.toMatch(/try again/i);
    expect(found[0]?.fix).toMatch(/site settings/i);
  });

  it("2 — dismissed is distinct from denied, and can be asked again", () => {
    const found = detectFaults(healthy({ phase: "idle", permission: "dismissed" }));
    expect(found[0]?.code).toBe("permission-dismissed");
    expect(found[0]?.fix).toMatch(/again/i);
  });
});

describe("detectFaults — the device and the document", () => {
  it("5 — an ended track holds the audio rather than discarding it", () => {
    const found = detectFaults(
      healthy({
        track: { readyState: "ended", muted: false },
        device: { deviceId: "jabra", label: "Jabra Link 380" },
      }),
    );
    expect(found[0]?.code).toBe("device-lost");
    expect(found[0]?.capturing).toBe(false);
    expect(found[0]?.audioIntact).toBe(true);
    expect(found[0]?.message).toContain("Jabra Link 380");
  });

  it("5 — an ended track is read as unplugged, not as a mute", () => {
    // Both produce silence. The more specific reading must win.
    const found = detectFaults(
      healthy({ frame: SILENT, track: { readyState: "ended", muted: true } }),
    );
    expect(found.map((f) => f.code)).toContain("device-lost");
    expect(found.map((f) => f.code)).not.toContain("input-muted");
  });

  it("8 — a suspended capture reports the hole rather than closing over it", () => {
    const found = detectFaults(healthy({ documentHidden: true, msSinceFrame: 9_000 }));
    expect(found[0]?.code).toBe("capture-suspended");
    expect(found[0]?.message).toMatch(/9s missing/);
  });

  it("8 — a brief background moment is not a hole", () => {
    expect(codes(healthy({ documentHidden: true, msSinceFrame: 200 }))).toHaveLength(0);
  });

  it("9 — leaving with unsent audio is critical", () => {
    const found = detectFaults(healthy({ phase: "held", unloading: true }));
    expect(found[0]?.code).toBe("unsent-on-unload");
    expect(found[0]?.severity).toBe("critical");
  });

  it("9 — leaving with nothing held is not a fault", () => {
    expect(codes(healthy({ phase: "ready", unloading: true }))).toHaveLength(0);
  });
});

describe("detectFaults — after the capture", () => {
  it("10 — a full disk stops cleanly and keeps what exists", () => {
    const found = detectFaults(
      healthy({ phase: "held", storageError: "QuotaExceededError" }),
    );
    expect(found[0]?.code).toBe("storage-full");
    expect(found[0]?.audioIntact).toBe(true);
  });

  it("11 — a failed upload resumes by byte range", () => {
    const found = detectFaults(
      healthy({
        phase: "held",
        disposition: { state: "failed", bytes: 14_200_000, sent: 8_900_000, error: "network" },
      }),
    );
    expect(found[0]?.code).toBe("upload-failed");
    expect(found[0]?.audioIntact).toBe(true);
    expect(found[0]?.fix).toMatch(/62%/);
  });

  it("12 — a stalled recogniser says the recorder is fine", () => {
    const found = detectFaults(healthy({ transcriptLagMs: 12_000 }));
    const stall = found.find((f) => f.code === "recogniser-stalled");
    expect(stall?.audioIntact).toBe(true);
    expect(stall?.fix).toMatch(/recogniser is behind, not the recorder/i);
  });

  it("12 — a recogniser a beat behind is not stalled", () => {
    expect(codes(healthy({ transcriptLagMs: 900 }))).toHaveLength(0);
  });

  it("13 — AGC is declared rather than allowed to look perfect", () => {
    const found = detectFaults(healthy({ autoGainControl: true }));
    expect(found[0]?.code).toBe("gain-masked");
    // Nothing is broken, so this must not shout.
    expect(found[0]?.severity).toBe("info");
  });
});

describe("detectFaults — ordering and helpers", () => {
  it("sorts the worst fault first", () => {
    const found = detectFaults(
      healthy({
        autoGainControl: true, //   info
        sampleRate: 16_000, //      warn
        baselineSampleRate: 48_000,
        track: { readyState: "ended", muted: false }, // critical
      }),
    );
    expect(found[0]?.severity).toBe("critical");
    expect(found.at(-1)?.severity).toBe("info");
    expect(primaryFault(found)?.code).toBe("device-lost");
  });

  it("primaryFault is null when nothing is wrong", () => {
    expect(primaryFault(detectFaults(healthy()))).toBeNull();
  });

  it("isCapturingNothing is true exactly when it believes it is recording and is not", () => {
    expect(isCapturingNothing(detectFaults(healthy()))).toBe(false);
    expect(
      isCapturingNothing(
        detectFaults(healthy({ frame: SILENT, track: { readyState: "live", muted: true } })),
      ),
    ).toBe(true);
    // Device lost is a fault, but it is not capturing-nothing: it has stopped.
    expect(
      isCapturingNothing(
        detectFaults(healthy({ track: { readyState: "ended", muted: false } })),
      ),
    ).toBe(false);
  });

  it("covers all thirteen codes", () => {
    expect(RECORDER_FAULTS).toHaveLength(13);
    expect(new Set(RECORDER_FAULTS).size).toBe(13);
  });
});
