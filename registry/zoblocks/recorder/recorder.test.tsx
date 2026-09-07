import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
