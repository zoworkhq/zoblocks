/**
 * The machine, and in particular the edge that has to be impossible to take
 * by accident.
 *
 * The illegal transitions matter more than the legal ones here: a machine
 * that accepts everything is a variable with extra steps, and the whole
 * reason `armed → recording` lives in this package rather than in a button
 * handler is that a guard in a click handler is a guard exactly one caller
 * honours.
 */

import { describe, expect, it, vi } from "vitest";
import {
  RECORDER_PHASES,
  RECORDER_TERMINALS,
  RECORDER_TRANSITIONS,
  createRecorderMachine,
  isTerminal,
} from "../src/index";
import type { RecorderConsent, RecorderEvent, RecorderState } from "../src/index";

const RESOLVED: RecorderConsent = {
  basis: "host-defined",
  recordedAt: "2026-08-31T09:11:00Z",
  recordedBy: "practitioner/okafor",
  coversAll: true,
};

/** Drive a machine to `target` by the shortest legal route the table allows. */
function driveTo(target: RecorderState, consent: RecorderConsent | null = RESOLVED) {
  const machine = createRecorderMachine({ consent });
  const routes: Partial<Record<RecorderState, RecorderEvent[]>> = {
    idle: [],
    requesting: ["request"],
    armed: ["request", "grant"],
    recording: ["request", "grant", "start"],
    paused: ["request", "grant", "start", "pause"],
    stopping: ["request", "grant", "start", "stop"],
    held: ["request", "grant", "start", "stop", "settle"],
    uploading: ["request", "grant", "start", "stop", "settle", "upload"],
    queued: ["request", "grant", "start", "stop", "settle", "upload", "queue"],
    transcribing: ["request", "grant", "start", "stop", "settle", "transcribe"],
    ready: ["request", "grant", "start", "stop", "settle", "transcribe", "complete"],
    denied: ["request", "deny"],
    unavailable: ["request", "grant", "start", "lose"],
    failed: ["request", "grant", "start", "stop", "settle", "upload", "fail"],
    discarded: ["request", "grant", "start", "stop", "settle", "discard"],
  };
  for (const event of routes[target] ?? []) {
    const result = machine.send(event);
    expect(result.ok, `${event} from ${result.from} on the way to ${target}`).toBe(true);
  }
  expect(machine.phase).toBe(target);
  return machine;
}

describe("the shape of the machine", () => {
  it("has eleven phases and four terminals", () => {
    expect(RECORDER_PHASES).toHaveLength(11);
    expect(RECORDER_TERMINALS).toHaveLength(4);
  });

  it("gives every state a row and every terminal an empty one", () => {
    for (const state of [...RECORDER_PHASES, ...RECORDER_TERMINALS]) {
      expect(RECORDER_TRANSITIONS[state]).toBeDefined();
    }
    for (const terminal of RECORDER_TERMINALS) {
      // Terminal is a property of the table, not a claim in a comment.
      expect(Object.keys(RECORDER_TRANSITIONS[terminal])).toHaveLength(0);
      expect(isTerminal(terminal)).toBe(true);
    }
    expect(isTerminal("recording")).toBe(false);
  });

  it("names only known states as destinations", () => {
    const known = new Set<string>([...RECORDER_PHASES, ...RECORDER_TERMINALS]);
    for (const row of Object.values(RECORDER_TRANSITIONS)) {
      for (const destination of Object.values(row)) {
        expect(known.has(destination as string)).toBe(true);
      }
    }
  });

  it("can reach every state from idle", () => {
    for (const state of [...RECORDER_PHASES, ...RECORDER_TERMINALS]) {
      expect(driveTo(state).phase).toBe(state);
    }
  });
});

describe("the consent edge", () => {
  it("blocks armed → recording when no basis has been recorded", () => {
    const machine = createRecorderMachine({ consent: null });
    machine.send("request");
    machine.send("grant");

    expect(machine.phase).toBe("armed");
    expect(machine.can("start")).toBe(false);

    const result = machine.send("start");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("consent-absent");
    // The refusal must not move the machine. A component that renders
    // "recording" for a frame before bouncing back has disclosed.
    expect(machine.phase).toBe("armed");
  });

  it("blocks on a basis that is missing a field", () => {
    const machine = createRecorderMachine({
      consent: { basis: "", recordedAt: "2026-08-31", recordedBy: "x", coversAll: true },
    });
    machine.send("request");
    machine.send("grant");
    expect(machine.send("start").reason).toBe("consent-incomplete");
  });

  it("blocks on a basis that does not cover everyone in the room", () => {
    const machine = createRecorderMachine({ consent: { ...RESOLVED, coversAll: false } });
    machine.send("request");
    machine.send("grant");
    expect(machine.send("start").reason).toBe("consent-not-all-parties");
  });

  it("opens once the host records a basis, without re-arming", () => {
    const machine = createRecorderMachine({ consent: null });
    machine.send("request");
    machine.send("grant");
    expect(machine.send("start").ok).toBe(false);

    machine.setConsent(RESOLVED);
    expect(machine.consentVerdict).toBe("resolved");
    expect(machine.send("start").ok).toBe(true);
    expect(machine.phase).toBe("recording");
  });

  it("opens when the host declares no basis is required, and says which it was", () => {
    const machine = createRecorderMachine({ consent: null, consentRequired: false });
    machine.send("request");
    machine.send("grant");
    // Distinct from "resolved" on purpose: one says a basis cleared the edge,
    // the other says the host declared none was needed.
    expect(machine.consentVerdict).toBe("not-required");
    expect(machine.send("start").ok).toBe(true);
  });

  it("guards only that edge — resume does not re-check", () => {
    const machine = driveTo("paused");
    machine.setConsent(null);
    // Consent was resolved when the recording began. Revoking the object
    // mid-recording is not the component's cue to refuse to resume; stopping
    // is the host's decision and there is a `stop` edge for it.
    expect(machine.send("resume").ok).toBe(true);
  });
});

describe("illegal transitions", () => {
  it("refuses to start recording without passing through armed", () => {
    const machine = createRecorderMachine({ consent: RESOLVED });
    const result = machine.send("start");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no-such-edge");
    expect(machine.phase).toBe("idle");
  });

  it("refuses every event from a terminal", () => {
    for (const terminal of RECORDER_TERMINALS) {
      const machine = driveTo(terminal);
      for (const event of Object.keys(RECORDER_TRANSITIONS.idle) as RecorderEvent[]) {
        expect(machine.send(event).ok).toBe(false);
      }
      expect(machine.phase).toBe(terminal);
    }
  });

  it("keeps dismissed distinct from denied", () => {
    const dismissed = createRecorderMachine();
    dismissed.send("request");
    dismissed.send("dismiss");
    // The prompt can be raised again after a dismissal.
    expect(dismissed.phase).toBe("idle");
    expect(dismissed.can("request")).toBe(true);

    const denied = createRecorderMachine();
    denied.send("request");
    denied.send("deny");
    // And cannot after a denial. A retry button here would re-prompt and
    // silently fail, which is the dead end §11 row 1 names.
    expect(denied.phase).toBe("denied");
    expect(denied.can("request")).toBe(false);
  });

  it("does not let a recording be discarded without stopping first", () => {
    const machine = driveTo("recording");
    expect(machine.send("discard").ok).toBe(false);
  });

  it("does not let held skip straight back to recording", () => {
    const machine = driveTo("held");
    expect(machine.send("start").ok).toBe(false);
    expect(machine.send("resume").ok).toBe(false);
  });
});

describe("recovery", () => {
  it("returns a failed upload to held, because the recording is intact", () => {
    const machine = driveTo("failed");
    const result = machine.recover();
    expect(result.ok).toBe(true);
    expect(machine.phase).toBe("held");
    // And the retry is then an ordinary edge.
    expect(machine.send("upload").ok).toBe(true);
  });

  it("holds the audio when the device disappears mid-recording", () => {
    const machine = driveTo("recording");
    machine.send("lose");
    expect(machine.phase).toBe("unavailable");
    machine.recover();
    // Audio to this point is intact and must be held, not discarded.
    expect(machine.phase).toBe("held");
  });

  it("returns to idle when the device disappeared before anything was captured", () => {
    const machine = createRecorderMachine({ consent: RESOLVED });
    machine.send("request");
    machine.send("grant");
    machine.send("lose");
    machine.recover();
    expect(machine.phase).toBe("idle");
  });

  it("does not recover a denial or a discard", () => {
    expect(driveTo("denied").recover().ok).toBe(false);
    expect(driveTo("discarded").recover().ok).toBe(false);
  });

  it("does not recover from a phase that is not terminal", () => {
    expect(driveTo("recording").recover().ok).toBe(false);
  });
});

describe("observation", () => {
  it("notifies subscribers on accepted transitions only", () => {
    const machine = createRecorderMachine({ consent: null });
    const seen = vi.fn();
    const off = machine.subscribe(seen);

    machine.send("request");
    machine.send("grant");
    machine.send("start"); // refused: no basis
    expect(seen).toHaveBeenCalledTimes(2);

    off();
    machine.setConsent(RESOLVED);
    machine.send("start");
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it("calls the constructor hook too", () => {
    const onTransition = vi.fn();
    const machine = createRecorderMachine({ onTransition });
    machine.send("request");
    expect(onTransition).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, from: "idle", phase: "requesting" }),
    );
  });

  it("reports the refusal without moving, so a host can explain it", () => {
    const machine = createRecorderMachine({ consent: null });
    machine.send("request");
    machine.send("grant");
    expect(machine.refusal("start")).toBe("consent-absent");
    expect(machine.refusal("pause")).toBe("no-such-edge");
    expect(machine.refusal("disarm")).toBeNull();
  });

  it("holds the basis it was given, and hands the same object back", () => {
    // The machine never authors consent, only holds it — and a host renders
    // its provenance line ("recorded by X at Y") straight off this. Returning
    // a copy would quietly break an identity check in a memoised component.
    const machine = createRecorderMachine({ consent: RESOLVED });
    expect(machine.consent).toBe(RESOLVED);

    const later: RecorderConsent = { ...RESOLVED, recordedBy: "practitioner/bell" };
    machine.setConsent(later);
    expect(machine.consent).toBe(later);

    machine.setConsent(null);
    expect(machine.consent).toBeNull();
    expect(machine.consentVerdict).toBe("absent");
  });

  it("starts wherever the host says, for the controlled form", () => {
    const machine = createRecorderMachine({ phase: "held" });
    expect(machine.phase).toBe("held");
    expect(machine.send("upload").ok).toBe(true);
  });

  it("resets to idle and forgets the terminal history", () => {
    const machine = driveTo("failed");
    machine.reset();
    expect(machine.phase).toBe("idle");
    expect(machine.failedFrom).toBeNull();
  });
});
