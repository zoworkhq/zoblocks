import { describe, expect, it } from "vitest";

import { recorderClock, recorderClockShort, recorderTimecode } from "../src/copy";

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
