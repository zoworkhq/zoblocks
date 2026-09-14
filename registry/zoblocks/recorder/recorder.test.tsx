import { act, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RecorderFaultBanner,
  RecorderFrame,
  paintLane,
  useFaults,
  useRecorderSignal,
} from "@/lib/zoblocks-recorder";
import { Recorder, RecorderDispositionStrip, RECORDER_ARTS } from "./recorder";

const JABRA = { deviceId: "jabra", label: "Jabra Link 380" };
const BUILTIN = { deviceId: "builtin", label: "MacBook Pro Microphone" };

const root = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-zb-recorder]");

const PEAKS = Float32Array.from({ length: 60 }, (_, i) => (i % 7) / 7);
const SPEAKERS = Uint8Array.from({ length: 60 }, (_, i) => (i < 30 ? 0 : 1));

describe("Recorder — the frame", () => {
  it("renders every art under its own name, on the host", () => {
    for (const variant of RECORDER_ARTS) {
      const view = render(<Recorder variant={variant} phase="recording" />);
      // The art name is on the host rather than buried in the shadow of a
      // wrapper, so an application's own queries and tests can see it.
      expect(root(view.container)?.dataset.zbRecorder).toBe(variant);
      view.unmount();
    }
  });

  it("puts the elapsed timer in a polled region, never a pushed one", () => {
    const view = render(<Recorder variant="bars" phase="recording" />);
    const timer = view.container.querySelector('[role="timer"]');
    expect(timer).not.toBeNull();
    // role=timer is aria-live=off by default. Making it polite announces a
    // number every second for twenty minutes.
    expect(timer?.getAttribute("aria-live")).toBeNull();
  });
});

describe("Recorder — consent is a state, not a dialog", () => {
  it("refuses to present armed as ready when no basis is recorded", () => {
    const view = render(<Recorder variant="bars" phase="armed" consent={null} />);
    expect(view.getByRole("alert").textContent).toMatch(/Consent not recorded/i);
  });

  it("says nothing about consent once a basis is resolved", () => {
    const view = render(
      <Recorder
        variant="bars"
        phase="armed"
        consent={{
          basis: "verbal",
          recordedAt: "2026-08-14T09:11:00Z",
          recordedBy: "Dr A. Okafor",
          coversAll: true,
        }}
      />,
    );
    expect(view.queryByText(/Consent not recorded/i)).toBeNull();
  });
});

describe("Recorder — the device is rendered permanently", () => {
  it("names the input device in the capture art rather than in a panel", () => {
    // §11 row 7 is the one fault with no signal-level defence: room tone from
    // the laptop microphone is room tone, and every detector passes. The name
    // on screen is the only defence there is.
    const view = render(
      <Recorder variant="bars" phase="recording" device={JABRA} context="Encounter · Room 4" />,
    );
    // The name sits in one line with the context and the level, so match the
    // line rather than a lone text node.
    const line = view.container.querySelector(".zb-rec-meta");
    expect(line?.textContent).toContain(JABRA.label);
    expect(line?.textContent).toContain("Encounter · Room 4");
  });

  it("raises a fault when the device is not the one that was chosen", () => {
    const view = render(
      <Recorder variant="bars" phase="recording" device={BUILTIN} expectedDevice={JABRA} />,
    );
    const alert = view.getByRole("alert");
    expect(alert.textContent).toContain(BUILTIN.label);
    expect(alert.textContent).toContain(JABRA.label);
  });

  it("says nothing when the device is the one that was chosen", () => {
    const view = render(
      <Recorder variant="bars" phase="recording" device={JABRA} expectedDevice={JABRA} />,
    );
    expect(view.queryByRole("alert")).toBeNull();
  });
});

describe("Recorder — the transport", () => {
  it("hides a control it has no handler for rather than disabling it", () => {
    const bare = render(<Recorder variant="bars" phase="recording" />);
    expect(bare.queryByRole("button", { name: /pause/i })).toBeNull();
    bare.unmount();

    const wired = render(
      <Recorder variant="bars" phase="recording" onPause={() => {}} onStop={() => {}} />,
    );
    expect(wired.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(wired.getByRole("button", { name: /stop & attach/i })).toBeInTheDocument();
  });

  it("gives Strip a microphone and a send control", () => {
    const view = render(
      <Recorder
        variant="strip"
        phase="recording"
        context="History of presenting complaint"
        onSend={() => {}}
      />,
    );
    expect(view.container.querySelector(".zb-rec-mic")).not.toBeNull();
    expect(view.getByRole("button", { name: /stop and insert/i })).toBeInTheDocument();
    expect(view.getByText(/History of presenting complaint/)).toBeInTheDocument();
  });

  it("shows a full timecode on Pulse, frames included", () => {
    // With one control and no lane, the frames field is the only thing on
    // screen still moving.
    const view = render(<Recorder variant="pulse" phase="recording" />);
    expect(view.container.querySelector(".zb-rec-clock")?.textContent).toMatch(
      /^\d{2}:\d{2}:\d{2}:\d{2}$/,
    );
  });
});

describe("Recorder — markers", () => {
  it("draws a struck span on BOTH rails, not just one", () => {
    // Hatching one side only would read as one person having been edited out
    // of the conversation.
    const view = render(
      <Recorder
        variant="duet"
        peaks={PEAKS}
        speakers={SPEAKERS}
        position={1}
        durationMs={60_000}
        markers={[{ id: "s", at: 0.5, label: "Struck 0:22", struck: true, span: 0.1 }]}
      />,
    );
    const up = view.container.querySelectorAll('[data-rail="a"] > i[data-struck="true"]');
    const down = view.container.querySelectorAll('[data-rail="b"] > i[data-struck="true"]');
    expect(up.length).toBeGreaterThan(0);
    expect(up.length).toBe(down.length);
  });

  it("labels a struck marker differently from an ordinary one", () => {
    const view = render(
      <Recorder
        variant="duet"
        peaks={PEAKS}
        speakers={SPEAKERS}
        position={0.5}
        durationMs={60_000}
        markers={[
          { id: "e", at: 0.31, label: "Exam" },
          { id: "s", at: 0.79, label: "Struck 0:22", struck: true },
        ]}
      />,
    );
    const marks = [...view.container.querySelectorAll(".zb-rec-mark")];
    expect(marks).toHaveLength(2);
    expect(marks.filter((m) => (m as HTMLElement).dataset.struck === "true")).toHaveLength(1);
  });

  it("renders no marker lane when there are no markers", () => {
    const view = render(
      <Recorder
        variant="duet"
        peaks={PEAKS}
        speakers={SPEAKERS}
        position={0.5}
        durationMs={60_000}
      />,
    );
    expect(view.container.querySelector(".zb-rec-markbar")).toBeNull();
  });
});

describe("Recorder — disposition", () => {
  it("reports a failed upload as resumable rather than as lost", () => {
    const view = render(
      <Recorder
        variant="bars"
        phase="held"
        disposition={{ state: "failed", bytes: 14_200_000, sent: 8_900_000, error: "network" }}
      />,
    );
    const alert = view.getByRole("alert");
    expect(alert.textContent).toMatch(/62%/);
    // The audio is intact; only the transfer failed. Conflating the two is how
    // a pipeline throws away the expensive artefact because the cheap one broke.
    expect(alert.textContent).toMatch(/held on this device/i);
  });
});

describe("Recorder — Duet folds the speaker onto the axis", () => {
  it("draws two rails when diarisation is present", () => {
    const view = render(
      <Recorder
        variant="duet"
        peaks={PEAKS}
        speakers={SPEAKERS}
        position={0.5}
        durationMs={60_000}
      />,
    );
    expect(view.container.querySelectorAll("[data-rail]")).toHaveLength(4); // 2 rails + 2 keys
    expect(view.container.querySelector('[data-rail="b"]')).not.toBeNull();
  });

  it("collapses to one rail rather than guessing when diarisation is absent", () => {
    // A wrongly attributed rail is worse than no attribution at all.
    const view = render(
      <Recorder variant="duet" peaks={PEAKS} speakers={null} position={0.5} durationMs={60_000} />,
    );
    expect(view.container.querySelector('[data-rail="b"]')).toBeNull();
    expect(view.getByText(/no diarisation/i)).toBeInTheDocument();
  });

  it("marks the played region by area, not only by bar colour", () => {
    // Played and unplayed cannot both be 3:1 against each other and against
    // the pane on one ramp, so the boundary is a wash plus the playhead.
    const view = render(
      <Recorder
        variant="duet"
        peaks={PEAKS}
        speakers={SPEAKERS}
        position={0.25}
        durationMs={60_000}
      />,
    );
    const wash = view.container.querySelector<HTMLElement>(".zb-rec-played");
    const head = view.container.querySelector<HTMLElement>(".zb-rec-head");
    expect(wash?.style.width).toBe("25%");
    expect(head?.style.left).toBe("25%");
  });

  it("reports talk-time balance, because the diarisation is already there", () => {
    const view = render(
      <Recorder
        variant="duet"
        peaks={PEAKS}
        speakers={SPEAKERS}
        position={1}
        durationMs={60_000}
      />,
    );
    expect(view.getByText(/\d+% \/ \d+%/)).toBeInTheDocument();
  });
});

describe("Recorder — the transcript is the accessible waveform", () => {
  it("draws an interim token as a guess rather than as a commitment", () => {
    const view = render(
      <Recorder
        variant="stream"
        phase="recording"
        turns={[
          {
            id: "1",
            speaker: "Patient",
            words: "I have to stop halfway which I",
            interim: "never",
          },
        ]}
      />,
    );
    const interim = view.container.querySelector(".zb-rec-interim");
    expect(interim?.textContent?.trim()).toBe("never");
  });
});

describe("Recorder — a transcript that falls behind", () => {
  const TURN = [{ id: "1", speaker: "Patient", words: "It started on Tuesday." }];

  it("says the transcript stalled, once, as a status", () => {
    const onFault = vi.fn();
    const view = render(
      <Recorder
        variant="stream"
        phase="recording"
        turns={TURN}
        transcriptLagMs={6_000}
        onFault={onFault}
      />,
    );
    const status = view.getByRole("status");
    expect(status.textContent).toContain("Transcript stalled.");
    // On the frame, where `.zb-rec-stream[data-stalled]` can see it.
    expect(root(view.container)?.dataset.stalled).toBe("true");
    // The stream says it in place; a second, assertive copy would talk over it.
    expect(view.queryByRole("alert")).toBeNull();
    expect(onFault).toHaveBeenCalledWith(expect.objectContaining({ code: "recogniser-stalled" }));
  });

  it("stays quiet inside the grace, and while the audio is not being captured", () => {
    const within = render(
      <Recorder variant="stream" phase="recording" turns={TURN} transcriptLagMs={1_000} />,
    );
    expect(within.queryByRole("status")).toBeNull();
    within.unmount();
    const paused = render(
      <Recorder variant="stream" phase="paused" turns={TURN} transcriptLagMs={9_000} />,
    );
    expect(paused.queryByRole("status")).toBeNull();
  });

  it("still shows the stall when a worse fault holds the banner", () => {
    const view = render(
      <Recorder
        variant="stream"
        phase="recording"
        turns={TURN}
        transcriptLagMs={6_000}
        disposition={{ state: "failed", bytes: 100, sent: 0 }}
        track={{ readyState: "ended", muted: false }}
      />,
    );
    expect(view.getByRole("alert").textContent).toContain("disconnected");
    expect(view.getByRole("status").textContent).toContain("Transcript stalled.");
  });

  it("reports the stall in the banner on an art with no transcript", () => {
    const view = render(<Recorder variant="bars" phase="recording" transcriptLagMs={6_000} />);
    expect(view.getByRole("alert").textContent).toContain("6s behind the audio");
    // The audio is fine, so the frame does not grey out as if it were not.
    expect(root(view.container)?.dataset.signal).toBe("live");
  });
});

describe("Recorder — a committed turn", () => {
  it("draws a turn the recogniser has finished revising without a guess", () => {
    const view = render(
      <Recorder
        variant="stream"
        phase="recording"
        turns={[{ id: "1", speaker: "Clinician", words: "Any chest pain on the stairs?" }]}
      />,
    );
    expect(view.getByText("Any chest pain on the stairs?")).toBeInTheDocument();
    expect(view.container.querySelector(".zb-rec-interim")).toBeNull();
  });
});

describe("Recorder — motion", () => {
  it("carries the motion choice on the host, so it is a mechanism and not only a query", () => {
    // WCAG 2.2.2 wants a mechanism, and the essential exception does not apply
    // once a conforming alternative exists — the still state is that alternative.
    const view = render(<Recorder variant="bars" phase="recording" motion="reduced" />);
    expect(root(view.container)?.dataset.motion).toBe("reduced");
  });
});

describe("RecorderDispositionStrip — the companion", () => {
  const BYTES = 14_200_000;

  it("draws no progress while held, because nothing is moving", () => {
    // A bar creeping forward here would be inventing progress that does not
    // exist. Held is a resting state that can last for days.
    const view = render(
      <RecorderDispositionStrip disposition={{ state: "held", bytes: BYTES, sent: 0 }} />,
    );
    const track = view.container.querySelector(".zb-rec-track");
    expect(track?.getAttribute("data-indeterminate")).toBe("true");
    expect(view.getByText(/not yet uploaded/i)).toBeInTheDocument();
  });

  it("reports upload progress against the real byte count", () => {
    const view = render(
      <RecorderDispositionStrip
        disposition={{ state: "uploading", bytes: BYTES, sent: 8_900_000 }}
      />,
    );
    expect(view.getByText(/8\.9 MB of 14\.2 MB/)).toBeInTheDocument();
    expect(view.getByText(/Resumes if the connection drops/i)).toBeInTheDocument();
  });

  it("says the audio is safe while the recogniser works", () => {
    // The distinction that stops a pipeline discarding the expensive artefact
    // because the cheap one broke.
    const view = render(
      <RecorderDispositionStrip
        disposition={{ state: "transcribing", bytes: BYTES, sent: BYTES }}
      />,
    );
    expect(view.getByText(/audio is safe/i)).toBeInTheDocument();
  });

  it("offers a retry only when there is something to retry, and resumes by byte", () => {
    const bare = render(
      <RecorderDispositionStrip
        disposition={{ state: "held", bytes: BYTES, sent: 0 }}
        onRetry={() => {}}
      />,
    );
    expect(bare.queryByRole("button", { name: /retry/i })).toBeNull();
    bare.unmount();

    const failed = render(
      <RecorderDispositionStrip
        disposition={{ state: "failed", bytes: BYTES, sent: 8_900_000, error: "Network dropped." }}
        onRetry={() => {}}
      />,
    );
    // 8.9 of 14.2 is 62%: a retry that restarts at zero costs a minute nobody
    // has on a clinic connection.
    expect(failed.getByRole("button", { name: /Retry from 62%/i })).toBeInTheDocument();
    expect(failed.getByRole("alert").textContent).toContain("Network dropped.");
  });

  it("marks the failed step rather than only colouring the bar", () => {
    const view = render(
      <RecorderDispositionStrip disposition={{ state: "failed", bytes: BYTES, sent: 100 }} />,
    );
    expect(view.container.querySelectorAll('[data-failed="true"]')).toHaveLength(1);
  });
});

describe("Recorder — mid-session redaction", () => {
  it("offers strike and mark only when the host can act on them", () => {
    const bare = render(<Recorder variant="bars" phase="recording" />);
    expect(bare.queryByRole("button", { name: /strike/i })).toBeNull();
    bare.unmount();

    const wired = render(
      <Recorder variant="bars" phase="recording" onMark={() => {}} onStrike={() => {}} />,
    );
    expect(wired.getByRole("button", { name: /mark/i })).toBeInTheDocument();
    // The window is named on the control, so nobody has to guess how much goes.
    expect(wired.getByRole("button", { name: /strike 30/i })).toBeInTheDocument();
  });

  it("names the configured strike window", () => {
    const view = render(
      <Recorder variant="bars" phase="recording" onStrike={() => {}} strikeWindowMs={15_000} />,
    );
    expect(view.getByRole("button", { name: /strike 15/i })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* The loop                                                            */
/* ------------------------------------------------------------------ */

/**
 * A hand-cranked requestAnimationFrame.
 *
 * The component's claim is that it owns no clock: frames arrive, or nothing
 * moves. Cranking the loop by hand is the only way to assert both halves of
 * that without a real display.
 */
function crankFrames() {
  const queue: FrameRequestCallback[] = [];
  const request = vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((callback: FrameRequestCallback) => {
      queue.push(callback);
      return queue.length;
    });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  let now = 1000;
  return {
    request,
    frames(count: number, dt = 34) {
      for (let i = 0; i < count; i += 1) {
        const callback = queue.shift();
        now += dt;
        act(() => callback?.(now));
      }
    },
  };
}

/** An analyser that always reports the same amplitude. */
const steady = (amplitude: number) => ({
  getFloatTimeDomainData(target: Float32Array) {
    target.fill(amplitude);
  },
});

describe("Recorder — the art is a function of the signal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the level off the analyser, and reports it at a tenth of the frame rate", () => {
    const loop = crankFrames();
    const onLevel = vi.fn();
    const view = render(
      <Recorder variant="bars" phase="recording" source={steady(0.5)} onLevel={onLevel} />,
    );
    const meta = view.container.querySelector(".zb-rec-meta");

    // Five frames is not yet a report: a level announced every frame is a
    // re-render sixty times a second.
    loop.frames(5);
    expect(onLevel).not.toHaveBeenCalled();
    expect(meta?.textContent).toContain("no input");

    loop.frames(1);
    expect(onLevel).toHaveBeenCalledTimes(1);
    expect(meta?.textContent).toContain("-6 dBFS");
  });

  it("fills the lane from the newest bar backwards, and leaves the history it has not got flat", () => {
    const loop = crankFrames();
    const view = render(<Recorder variant="bars" phase="recording" source={steady(0.5)} />);
    loop.frames(4);

    const bars = [...view.container.querySelectorAll<HTMLElement>(".zb-rec-lane > i")];
    const newest = bars.at(-1)!;
    const oldest = bars[0]!;
    expect(Number(newest.style.getPropertyValue("--_h"))).toBeGreaterThan(0.5);
    // The floor, not zero: a bar with no history is still drawn as a bar.
    expect(oldest.style.getPropertyValue("--_h")).toBe("0.020");
  });

  it("says a silent room is silent rather than inventing a level", () => {
    const loop = crankFrames();
    const onLevel = vi.fn();
    const view = render(
      <Recorder variant="pulse" phase="recording" source={steady(0)} onLevel={onLevel} />,
    );
    loop.frames(6);
    expect(onLevel).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector(".zb-rec-meta")?.textContent).toBe("no input");
  });

  it("still delivers frames to a host that has not attached the element yet", () => {
    const loop = crankFrames();
    const onFrame = vi.fn();
    renderHook(() => useRecorderSignal({ source: steady(0.5), onFrame }));
    loop.frames(2);
    expect(onFrame).toHaveBeenCalledTimes(2);
    expect(onFrame.mock.calls[1]![0].level).toBeCloseTo(0.5);
  });

  it("does not run the loop at all when nothing is being captured", () => {
    const loop = crankFrames();
    render(<Recorder variant="bars" phase="held" source={steady(0.5)} />);
    expect(loop.request).not.toHaveBeenCalled();
  });

  it("stands still, rather than faking motion, where there is no animation frame", () => {
    const original = window.requestAnimationFrame;
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    try {
      const view = render(<Recorder variant="bars" phase="recording" source={steady(0.5)} />);
      expect(view.getByRole("timer").textContent).toBe("00:00:00");
      expect(view.container.querySelector(".zb-rec-meta")?.textContent).toContain("no input");
    } finally {
      Object.defineProperty(window, "requestAnimationFrame", {
        configurable: true,
        writable: true,
        value: original,
      });
    }
  });
});

describe("Recorder — the lane is measured, not assumed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("draws as many bars as the lane has room for, and re-counts when it resizes", () => {
    let width = 398;
    const observers: Array<() => void> = [];
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains("zb-rec-lane") ? width : 0;
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          observers.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );

    try {
      const view = render(<Recorder variant="bars" phase="held" />);
      const count = () => view.container.querySelectorAll(".zb-rec-lane > i").length;
      // 3px bars on a 2px gap: (398 + 2) / 5.
      expect(count()).toBe(80);

      // A resize that changes nothing keeps the same bars.
      act(() => observers.forEach((notify) => notify()));
      expect(count()).toBe(80);

      width = 198;
      act(() => observers.forEach((notify) => notify()));
      expect(count()).toBe(40);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("Recorder — Pulse before capture", () => {
  it("offers to start rather than to stop, and shows no record tell", () => {
    const view = render(
      <Recorder
        variant="pulse"
        phase="armed"
        consent={{
          basis: "verbal",
          recordedAt: "2026-08-14T09:11:00Z",
          recordedBy: "Dr A. Okafor",
          coversAll: true,
        }}
      />,
    );
    expect(view.getByRole("button", { name: "Start recording" })).toBeInTheDocument();
    expect(view.queryByText("Rec")).toBeNull();
  });
});

describe("Recorder — Duet readouts", () => {
  it("reports no talk-time balance when nobody spoke", () => {
    // 0% / 100% over a silent take would be a claim about who talked.
    const view = render(
      <Recorder
        variant="duet"
        peaks={new Float32Array(60)}
        speakers={SPEAKERS}
        position={0.5}
        durationMs={60_000}
      />,
    );
    expect(view.queryByText(/\d+% \/ \d+%/)).toBeNull();
  });

  it("keeps the hours on a take that runs past the hour", () => {
    const view = render(
      <Recorder
        variant="duet"
        peaks={PEAKS}
        speakers={SPEAKERS}
        position={0}
        durationMs={3_723_000}
        title="Consultation"
      />,
    );
    expect(view.container.querySelector(".zb-rec-clock")?.textContent).toBe("00:00 / 01:02:03");
  });
});

describe("RecorderDispositionStrip — every state after stop", () => {
  const BYTES = 14_200_000;

  it("says the audio is on the server once it is queued", () => {
    const view = render(
      <RecorderDispositionStrip disposition={{ state: "queued", bytes: BYTES, sent: BYTES }} />,
    );
    expect(view.getByText(/on the server and waiting its turn/i)).toBeInTheDocument();
    expect(view.getByText("100%")).toBeInTheDocument();
  });

  it("fills the track and says where the transcript went once ready", () => {
    const view = render(
      <RecorderDispositionStrip
        disposition={{ state: "ready", bytes: BYTES, sent: BYTES }}
        durationMs={125_000}
        attachedTo="encounter note"
      />,
    );
    expect(view.getByText(/Transcript attached to the encounter note/)).toBeInTheDocument();
    expect(view.getByText("done")).toBeInTheDocument();
    expect(view.container.querySelector<HTMLElement>(".zb-rec-track-fill")?.style.width).toBe(
      "100%",
    );
    // The captured step carries the take's length beside its size.
    expect(view.getByText(/· 14\.2 MB$/)).toBeInTheDocument();
    expect(view.queryByRole("alert")).toBeNull();
  });

  it("reports nothing sent, not a divide-by-zero, for an empty take", () => {
    const view = render(
      <RecorderDispositionStrip
        disposition={{ state: "failed", bytes: 0, sent: 0 }}
        onRetry={() => {}}
      />,
    );
    expect(view.getByRole("alert").textContent).toBe("Upload failed.");
    expect(view.getByRole("button", { name: "Retry from 0%" })).toBeInTheDocument();
  });
});

describe("the recorder chrome", () => {
  it("hands the host element to a callback ref as well as to its own", () => {
    const seen: Array<HTMLDivElement | null> = [];
    const view = render(<RecorderFrame art="strip" ref={(node) => void seen.push(node)} />);
    expect(seen[0]).toBe(view.container.querySelector('[data-zb-recorder="strip"]'));
  });

  it("shows a fault's message alone when it has no fix to offer", () => {
    const view = render(
      <RecorderFaultBanner
        fault={{
          code: "gain-masked",
          severity: "info",
          capturing: true,
          audioIntact: true,
          message: "Automatic gain control is on.",
        }}
      />,
    );
    expect(view.getByRole("alert").textContent).toBe("Automatic gain control is on.");
  });

  it("puts the worst fault first when a host reads them itself", () => {
    const { result } = renderHook(() =>
      useFaults({
        phase: "recording",
        frame: {
          peak: 0.4,
          level: 0.4,
          hold: 0.4,
          display: 0.5,
          dbfs: -8,
          quiet: false,
          silentMs: 0,
          elapsedMs: 1000,
          buckets: 30,
          bucket: null,
          closed: [],
        },
        autoGainControl: true,
        device: BUILTIN,
        expectedDevice: JABRA,
      }),
    );
    expect(result.current.faults.map((fault) => fault.code)).toEqual([
      "device-suspect",
      "gain-masked",
    ]);
    expect(result.current.primary?.code).toBe("device-suspect");
  });

  it("paints nothing into a lane that is not mounted", () => {
    const read = vi.fn(() => 1);
    paintLane(null, read);
    expect(read).not.toHaveBeenCalled();
  });

  it("skips a bar that left the lane while it was being painted", () => {
    // The lane is a live collection. A reader that reflows it mid-paint must
    // not turn into a crash on the render path.
    const lane = document.createElement("div");
    lane.append(document.createElement("i"), document.createElement("i"));
    const survivor = lane.firstElementChild as HTMLElement;
    paintLane(lane, (index) => {
      if (index === 0) lane.lastElementChild?.remove();
      return 0.5;
    });
    expect(lane.children).toHaveLength(1);
    expect(survivor.style.getPropertyValue("--_h")).not.toBe("");
  });
});
