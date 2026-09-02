/**
 * The copy, as arithmetic.
 *
 * §10 is why these are functions rather than inline JSX: a screen-reader user
 * cannot see a waveform, so the announcements *are* the component for them.
 * Copy that lives in a template is copy nobody can unit-test, and the clocks
 * and the silence budget are the two places where a wrong sentence is a wrong
 * fact rather than a clumsy one.
 */

import { describe, expect, it } from "vitest";

import {
  describeRecorderDuration,
  describeRecorderHeartbeat,
  describeRecorderTransition,
  describeSilence,
  recorderClock,
  recorderClockShort,
  recorderStatusWord,
  recorderTimecode,
} from "../src/copy";
import { DEFAULT_SILENCE_BUDGET_MS, QUIET_GRACE_MS } from "../src/motion";
import { RECORDER_PHASES, RECORDER_TERMINALS } from "../src/types";
import type { RecorderState } from "../src/types";

describe("recorderClock", () => {
  it("keeps the hours field even at zero", () => {
    // A readout that grows a column mid-take shifts every digit beside it,
    // which is exactly what tabular-nums exists to prevent.
    expect(recorderClock(0)).toBe("00:00:00");
    expect(recorderClock(252_400)).toBe("00:04:12");
  });

  it("carries the hour", () => {
    expect(recorderClock(3_723_000)).toBe("01:02:03");
  });
});

describe("recorderClockShort", () => {
  it("drops the hour until there is one", () => {
    expect(recorderClockShort(252_400)).toBe("4:12");
    expect(recorderClockShort(3_723_000)).toBe("1:02:03");
  });
});

describe("recorderTimecode", () => {
  it("keeps every field, including hours at zero", () => {
    expect(recorderTimecode(0)).toBe("00:00:00:00");
    expect(recorderTimecode(252_400)).toBe("00:04:12:10");
  });

  it("counts frames rather than milliseconds", () => {
    // 25 fps: one frame is 40 ms, so 280 ms in is frame 07.
    expect(recorderTimecode(252_280)).toBe("00:04:12:07");
  });

  it("never reports a frame equal to the rate", () => {
    // 999 ms at 25 fps floors to 24. A 25th frame does not exist, and printing
    // one would make the seconds field appear to lag by a frame.
    expect(recorderTimecode(999)).toBe("00:00:00:24");
    expect(recorderTimecode(1000)).toBe("00:00:01:00");
  });

  it("carries the hour", () => {
    expect(recorderTimecode(3_723_000)).toBe("01:02:03:00");
  });

  it("floors a negative elapsed to zero rather than printing a minus", () => {
    expect(recorderTimecode(-5)).toBe("00:00:00:00");
  });

  it("takes another frame rate", () => {
    expect(recorderTimecode(500, 50)).toBe("00:00:00:25");
  });
});

describe("describeRecorderDuration", () => {
  it("speaks the duration rather than printing it", () => {
    // The spoken form, for announcements only. A screen reader reading
    // "00:03:30" says "zero zero colon zero three colon three zero".
    expect(describeRecorderDuration(210_000)).toBe("3 minutes 30 seconds");
    expect(describeRecorderDuration(3_661_000)).toBe("1 hour 1 minute 1 second");
  });

  it("singularises every field on its own", () => {
    expect(describeRecorderDuration(1_000)).toBe("1 second");
    expect(describeRecorderDuration(60_000)).toBe("1 minute");
    expect(describeRecorderDuration(3_600_000)).toBe("1 hour");
    expect(describeRecorderDuration(7_200_000)).toBe("2 hours");
  });

  it("drops the fields that are zero, but never says nothing", () => {
    // "1 minute", not "1 minute 0 seconds". And a zero duration is still a
    // duration: an empty string in a live region announces as silence, which
    // reads to a screen-reader user as the announcement having failed.
    expect(describeRecorderDuration(120_000)).toBe("2 minutes");
    expect(describeRecorderDuration(0)).toBe("0 seconds");
  });

  it("rounds to the nearest second rather than flooring", () => {
    // Unlike the clock. The clock is a transport readout that must not appear
    // to run ahead of the audio; this is a sentence, and "1 second" for 1.5 s
    // is the wrong half of the rounding.
    expect(describeRecorderDuration(1_499)).toBe("1 second");
    expect(describeRecorderDuration(1_500)).toBe("2 seconds");
  });

  it("floors a negative elapsed rather than speaking a minus", () => {
    expect(describeRecorderDuration(-5)).toBe("0 seconds");
  });
});

describe("describeSilence", () => {
  it("says nothing at all while voice is arriving", () => {
    const report = describeSilence(0);
    expect(report.level).toBe("voice");
    expect(report.message).toBe("");
    expect(report.assertive).toBe(false);
  });

  it("calls a short gap quiet, without putting a number on it", () => {
    // Below the grace this is a pause between sentences. A number here would
    // make the component announce every breath.
    const report = describeSilence(QUIET_GRACE_MS - 1);
    expect(report.level).toBe("quiet");
    expect(report.message).toBe("Quiet");
    expect(report.assertive).toBe(false);
  });

  it("puts a number on it once the gap is worth one", () => {
    const report = describeSilence(5_400);
    expect(report.level).toBe("silent");
    // Floored, not rounded: it must not claim more silence than has elapsed.
    expect(report.message).toBe("No voice for 5 s");
    expect(report.assertive).toBe(false);
  });

  it("escalates at the grace boundary, not one millisecond later", () => {
    expect(describeSilence(QUIET_GRACE_MS - 1).level).toBe("quiet");
    expect(describeSilence(QUIET_GRACE_MS).level).toBe("silent");
  });

  it("interrupts once the budget is crossed, and only then", () => {
    // The one assertive announcement in the whole surface. Crossing the budget
    // is the failure the component exists to prevent — a long recording of a
    // muted microphone — so it interrupts; everything below it waits its turn.
    expect(describeSilence(DEFAULT_SILENCE_BUDGET_MS - 1).assertive).toBe(false);

    const crossed = describeSilence(DEFAULT_SILENCE_BUDGET_MS + 5_000);
    expect(crossed.level).toBe("budget");
    expect(crossed.assertive).toBe(true);
    expect(crossed.message).toBe("No voice for 25 s — check the microphone");
  });

  it("takes the host's budget over the default", () => {
    const report = describeSilence(9_000, { budget: 8_000 });
    expect(report.level).toBe("budget");
    expect(report.budget).toBe(8_000);
  });

  it("keeps counting when a budget of zero disables the escalation", () => {
    // A documented, deliberate choice rather than a silent one: the component
    // still counts and still says how long, it simply never crosses.
    const report = describeSilence(25_000, { budget: 0 });
    expect(report.level).toBe("silent");
    expect(report.assertive).toBe(false);
    expect(report.message).toBe("No voice for 25 s");
  });

  it("does not call a silent playback a fault", () => {
    // Silent audio on a listening surface is silent audio. The budget only
    // means something while something is supposed to be arriving — but the
    // count is still reported, so a host can render it without asking twice.
    const report = describeSilence(25_000, { capturing: false });
    expect(report.level).toBe("voice");
    expect(report.message).toBe("");
    expect(report.ms).toBe(25_000);
  });

  it("floors a negative count rather than reporting one", () => {
    expect(describeSilence(-9).ms).toBe(0);
  });

  it("reports the budget it used, so a host need not recompute it", () => {
    expect(describeSilence(0).budget).toBe(DEFAULT_SILENCE_BUDGET_MS);
  });
});

describe("recorderStatusWord", () => {
  it("has a word for every state, and no empty ones", () => {
    for (const state of [...RECORDER_PHASES, ...RECORDER_TERMINALS]) {
      expect(recorderStatusWord(state).length).toBeGreaterThan(0);
    }
  });

  it("does not call held saved", () => {
    // The word the whole of rule three exists for. Not "Saved", not "Done":
    // the bytes are on this device and nowhere else, and a tick beside a legal
    // record that is still only in IndexedDB is a lie to a clinician.
    expect(recorderStatusWord("held")).toBe("Held on this device");
    expect(recorderStatusWord("held")).not.toMatch(/saved|done|complete/i);
  });

  it("does not call armed ready", () => {
    // "Ready" reads as "recording is about to be fine" rather than "nothing has
    // been captured yet", which is the fact `armed` exists to carry.
    expect(recorderStatusWord("armed")).toBe("Armed");
    expect(recorderStatusWord("idle")).toBe("Not recording");
  });
});

describe("describeRecorderTransition", () => {
  it("tells resuming apart from starting", () => {
    // The `from` is load-bearing here: a screen-reader user who paused to step
    // out of the room needs to hear that the same recording is running again,
    // not that a new one began.
    expect(describeRecorderTransition("armed", "recording")).toBe("Recording started");
    expect(describeRecorderTransition("paused", "recording")).toBe("Recording resumed");
  });

  it("says what did not happen when the capture lands at held", () => {
    // The one announcement that has to carry the negative. "Held" alone reads
    // as filed.
    expect(describeRecorderTransition("stopping", "held")).toBe(
      "Held on this device, not yet uploaded",
    );
  });

  it("says the audio survived a device that did not", () => {
    expect(describeRecorderTransition("recording", "unavailable")).toBe(
      "Input device unavailable. Audio recorded so far is held",
    );
  });

  it("says nothing was captured when permission was refused", () => {
    // The opposite reassurance to the one above, and it matters that they are
    // different sentences: one recording exists and one does not.
    expect(describeRecorderTransition("requesting", "denied")).toBe(
      "Microphone blocked. Nothing is being recorded",
    );
  });

  it("names the step that failed, because failed alone is not actionable", () => {
    // A failed upload and a failed transcription leave the same word on screen
    // and call for different actions.
    expect(describeRecorderTransition("uploading", "failed")).toBe("Failed while uploading");
    expect(describeRecorderTransition("transcribing", "failed")).toBe("Failed while transcribing");
  });

  it("falls back to the status word for the transitions with nothing extra to say", () => {
    expect(describeRecorderTransition("recording", "paused")).toBe("Paused");
    expect(describeRecorderTransition("held", "discarded")).toBe("Discarded");
    expect(describeRecorderTransition("transcribing", "ready")).toBe("Ready");
  });

  it("produces a non-empty sentence for every edge in the table", () => {
    // A live region handed an empty string announces nothing, and a transition
    // that announces nothing is a transition a screen-reader user did not see.
    const states = [...RECORDER_PHASES, ...RECORDER_TERMINALS] as readonly RecorderState[];
    for (const from of states) {
      for (const to of states) {
        expect(describeRecorderTransition(from, to).length).toBeGreaterThan(0);
      }
    }
  });
});

describe("describeRecorderHeartbeat", () => {
  const at = (silentMs: number) =>
    describeRecorderHeartbeat("recording", 210_000, describeSilence(silentMs));

  it("carries the phase, the duration and the room in one sentence", () => {
    // Every thirty seconds, which is long enough not to intrude and short
    // enough that a muted microphone is caught inside a minute.
    expect(at(0)).toBe("Recording, 3 minutes 30 seconds, voice detected");
  });

  it("says the room is quiet without a number while it is only quiet", () => {
    expect(at(900)).toBe("Recording, 3 minutes 30 seconds, quiet");
  });

  it("folds the silence sentence in once there is one", () => {
    expect(at(5_400)).toBe("Recording, 3 minutes 30 seconds, no voice for 5 s");
    expect(at(25_000)).toBe(
      "Recording, 3 minutes 30 seconds, no voice for 25 s — check the microphone",
    );
  });

  it("uses the phase word it was given rather than assuming a recording", () => {
    // The heartbeat is the only announcement that fires without a transition,
    // so it is the one place a stale phase word would go unnoticed.
    expect(describeRecorderHeartbeat("paused", 60_000, describeSilence(900))).toBe(
      "Paused, 1 minute, quiet",
    );
  });
});
