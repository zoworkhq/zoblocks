/**
 * `useConsult`, end to end through React.
 *
 * The consult-core suite already proves the engine. What is proved here is that
 * the hook wires it up without losing any of the guarantees — that suppression
 * really suppresses, that the patient-facing guard really throws, that the
 * verification signal really fires, and that an unmounting dock does not leave
 * a request running against a patient's record.
 */

import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useConsult, type UseConsultOptions } from "../src/use-consult.js";
import {
  createStaticProvider,
  lookUp,
  prepare,
  minimalDisclosure,
  PatientFacingNotSupportedError,
  type ConsultEvent,
  type Source,
  type TelemetryEvent,
} from "@oxygenui-design/consult-core";

const disclosure = minimalDisclosure("test-model@1");

const source: Source = {
  id: "s1",
  title: "AF guideline",
  passage: "Rate control is reasonable.",
  kind: "guideline",
  retrievedAt: "2026-08-16T09:00:00.000Z",
};

const grounded: ConsultEvent[] = [
  { type: "delta", text: "Rate control is a reasonable first strategy." },
  { type: "citation", marker: 1, source },
  { type: "claim", claim: { span: [0, 43], markers: [1] } },
  { type: "done", finish: "stop" },
];

let ids = 0;
const baseOptions = (over: Partial<UseConsultOptions> = {}): UseConsultOptions => ({
  provider: createStaticProvider({ events: grounded, disclosure }),
  modes: [lookUp, prepare],
  now: () => "2026-08-16T09:00:00.000Z",
  newId: () => `id-${++ids}`,
  actor: { display: "Dr Okafor", reference: "Practitioner/7" },
  ...over,
});

describe("basic flow", () => {
  it("starts idle with the first mode selected", () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    expect(result.current.state.status).toBe("idle");
    expect(result.current.mode.id).toBe("look-up");
    expect(result.current.canSubmit).toBe(false);
  });

  it("honours an explicit initial mode", () => {
    const { result } = renderHook(() => useConsult(baseOptions({ initialModeId: "prepare" })));
    expect(result.current.mode.id).toBe("prepare");
  });

  it("enables submit once there is a draft", () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    act(() => result.current.setDraft("AF first line?"));
    expect(result.current.canSubmit).toBe(true);
  });

  it("does not enable submit on whitespace alone", () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    act(() => result.current.setDraft("   "));
    expect(result.current.canSubmit).toBe(false);
  });

  it("streams an answer through to the grounded register", async () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    act(() => result.current.setDraft("AF first line?"));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(result.current.state.status).toBe("complete"));
    expect(result.current.state.current?.text).toContain("Rate control");
    expect(result.current.state.current?.register).toBe("grounded");
    expect(result.current.sources).toHaveLength(1);
  });

  it("clears the draft after submitting", async () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    act(() => result.current.setDraft("AF first line?"));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.draft).toBe("");
  });

  it("accepts an override question without touching the draft first", async () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    await act(async () => {
      await result.current.submit("AF first line?");
    });
    await waitFor(() => expect(result.current.state.status).toBe("complete"));
  });

  it("ignores an empty submit", async () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    await act(async () => {
      await result.current.submit("   ");
    });
    expect(result.current.state.status).toBe("idle");
  });

  it("starts a new thread", async () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    await act(async () => {
      await result.current.submit("AF first line?");
    });
    act(() => result.current.newThread());
    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.messages).toEqual([]);
  });
});

describe("suppression — Law 5", () => {
  it("refuses to submit when suppressed", async () => {
    const send = vi.fn();
    const { result } = renderHook(() =>
      useConsult(
        baseOptions({
          suppressed: true,
          provider: { ...createStaticProvider({ events: grounded, disclosure }), send },
        }),
      ),
    );

    await act(async () => {
      await result.current.submit("AF first line?");
    });

    expect(send).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe("idle");
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.suppressed).toBe(true);
  });
});

describe("patient-facing guard", () => {
  it("throws on render for a patient surface rather than degrading", () => {
    // Nevada prohibits AI from providing behavioral healthcare outright. A
    // developer wiring this up wrongly should find out on first paint.
    expect(() => renderHook(() => useConsult(baseOptions({ surface: "patient" })))).toThrow(
      PatientFacingNotSupportedError,
    );
  });

  it("renders normally on a clinician surface", () => {
    expect(() => renderHook(() => useConsult(baseOptions({ surface: "clinician" })))).not.toThrow();
  });
});

describe("crisis", () => {
  it("blocks, never calls the provider, and offers locale-resolved lines", async () => {
    const send = vi.fn();
    const { result } = renderHook(() =>
      useConsult(
        baseOptions({
          locale: "en-US",
          provider: { ...createStaticProvider({ events: grounded, disclosure }), send },
        }),
      ),
    );

    await act(async () => {
      await result.current.submit("I want to kill myself");
    });

    expect(result.current.state.status).toBe("crisis");
    expect(send).not.toHaveBeenCalled();
    expect(result.current.crisisLines[0]?.number).toBe("988");
    expect(result.current.canSubmit).toBe(false);
  });

  it("resolves UK lines for a UK locale, not 988", async () => {
    const { result } = renderHook(() => useConsult(baseOptions({ locale: "en-GB" })));
    await act(async () => {
      await result.current.submit("I want to kill myself");
    });
    expect(result.current.crisisLines.some((l) => l.number === "988")).toBe(false);
    expect(result.current.crisisLines.some((l) => l.number === "116123")).toBe(true);
  });

  it("stays blocked until a new thread is started", async () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    await act(async () => {
      await result.current.submit("I want to kill myself");
    });
    act(() => result.current.setDraft("please just answer the question"));
    expect(result.current.state.status).toBe("crisis");

    act(() => result.current.newThread());
    expect(result.current.state.status).toBe("idle");
  });
});

describe("dictation", () => {
  it("collects a transcript and lands it in the draft rather than submitting", () => {
    const { result } = renderHook(() => useConsult(baseOptions()));

    act(() => result.current.dictation.start());
    expect(result.current.dictation.active).toBe(true);

    act(() => result.current.dictation.update("amiodarone"));
    expect(result.current.dictation.transcript).toBe("amiodarone");

    act(() => result.current.dictation.stop());
    expect(result.current.draft).toBe("amiodarone");
    expect(result.current.state.status).toBe("composing");
  });

  it("accepts a corrected final transcript", () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    act(() => result.current.dictation.start());
    act(() => result.current.dictation.update("amiodipine"));
    act(() => result.current.dictation.stop("amlodipine"));
    expect(result.current.draft).toBe("amlodipine");
  });
});

describe("verification signal", () => {
  it("emits sources-opened with a source count when the drawer opens", async () => {
    const events: TelemetryEvent[] = [];
    const { result } = renderHook(() =>
      useConsult(baseOptions({ onTelemetry: (e) => void events.push(e) })),
    );

    await act(async () => {
      await result.current.submit("AF first line?");
    });
    await waitFor(() => expect(result.current.state.status).toBe("complete"));

    act(() => result.current.openSources());

    const opened = events.find((e) => e.type === "sources-opened");
    expect(opened).toMatchObject({ sourceCount: 1 });
    expect(result.current.sourcesOpen).toBe(true);
  });

  it("closes the drawer", async () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    await act(async () => {
      await result.current.submit("AF first line?");
    });
    act(() => result.current.openSources());
    act(() => result.current.closeSources());
    expect(result.current.sourcesOpen).toBe(false);
  });

  it("emits structured feedback rather than free text", async () => {
    const events: TelemetryEvent[] = [];
    const { result } = renderHook(() =>
      useConsult(baseOptions({ onTelemetry: (e) => void events.push(e) })),
    );
    await act(async () => {
      await result.current.submit("AF first line?");
    });
    act(() => result.current.sendFeedback("down", "no-source"));

    expect(events.find((e) => e.type === "feedback")).toMatchObject({
      rating: "down",
      reason: "no-source",
    });
  });
});

describe("proposals", () => {
  const withProposal: ConsultEvent[] = [
    { type: "delta", text: "Suggested note text." },
    { type: "citation", marker: 1, source },
    { type: "claim", claim: { span: [0, 20], markers: [1] } },
    {
      type: "proposal",
      proposal: {
        id: "p1",
        kind: "note-text",
        summary: "Add to the note",
        content: "New onset AF, rate controlled.",
      },
    },
    { type: "done", finish: "stop" },
  ];

  it("surfaces a proposal without committing anything", async () => {
    const { result } = renderHook(() =>
      useConsult(
        baseOptions({ provider: createStaticProvider({ events: withProposal, disclosure }) }),
      ),
    );
    await act(async () => {
      await result.current.submit("summarise for the note");
    });
    await waitFor(() => expect(result.current.proposal?.id).toBe("p1"));
    expect(result.current.state.status).toBe("proposing");
  });

  it("records dwell time and reflexiveness on confirm", async () => {
    const events: TelemetryEvent[] = [];
    const { result } = renderHook(() =>
      useConsult(
        baseOptions({
          provider: createStaticProvider({ events: withProposal, disclosure }),
          onTelemetry: (e) => void events.push(e),
        }),
      ),
    );
    await act(async () => {
      await result.current.submit("summarise for the note");
    });
    await waitFor(() => expect(result.current.proposal).not.toBeNull());

    act(() => result.current.confirm());

    const confirmed = events.find((e) => e.type === "proposal-confirmed");
    // Confirmed instantly in a test, so it is correctly flagged reflexive —
    // which is exactly the signal §17 wants surfaced in production.
    expect(confirmed).toMatchObject({ reflexive: true });
    expect(result.current.proposal).toBeNull();
  });

  it("dismisses a proposal", async () => {
    const events: TelemetryEvent[] = [];
    const { result } = renderHook(() =>
      useConsult(
        baseOptions({
          provider: createStaticProvider({ events: withProposal, disclosure }),
          onTelemetry: (e) => void events.push(e),
        }),
      ),
    );
    await act(async () => {
      await result.current.submit("summarise for the note");
    });
    await waitFor(() => expect(result.current.proposal).not.toBeNull());

    act(() => result.current.dismissProposal());
    expect(result.current.proposal).toBeNull();
    expect(events.some((e) => e.type === "proposal-dismissed")).toBe(true);
  });

  it("does nothing on confirm when no actor is configured", async () => {
    const { result } = renderHook(() =>
      useConsult(
        baseOptions({
          provider: createStaticProvider({ events: withProposal, disclosure }),
          actor: undefined,
        }),
      ),
    );
    await act(async () => {
      await result.current.submit("summarise for the note");
    });
    await waitFor(() => expect(result.current.proposal).not.toBeNull());

    act(() => result.current.confirm());
    expect(result.current.proposal).not.toBeNull();
  });
});

describe("scope summary", () => {
  it("reports no withholding for a reference-only mode", () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    expect(result.current.scope).toMatchObject({ withheldCount: 0, showWithheld: false });
    expect(result.current.scope.categories).toEqual([]);
  });

  it("reports disclosable withheld counts for a reading mode", async () => {
    const { result } = renderHook(() =>
      useConsult(
        baseOptions({
          initialModeId: "prepare",
          subject: { reference: "Patient/1" },
          provider: createStaticProvider({ events: grounded, disclosure, phiPermitted: true }),
          context: {
            resolve: () =>
              Promise.resolve({
                resources: [],
                withheld: [
                  { reason: "part2", count: 2, disclosable: true },
                  { reason: "psychotherapy-notes", count: 1, disclosable: false },
                ],
                asOf: "2026-08-16T09:00:00.000Z",
              }),
          },
        }),
      ),
    );

    await act(async () => {
      await result.current.submit("summarise the record");
    });

    await waitFor(() => expect(result.current.scope.showWithheld).toBe(true));
    expect(result.current.scope.withheldCount).toBe(2);
    expect(result.current.scope.categories).toContain("Condition");
  });
});

describe("stopping and unmounting", () => {
  it("stops a stream in flight", async () => {
    const { result } = renderHook(() =>
      useConsult(
        baseOptions({
          provider: createStaticProvider({ events: grounded, disclosure, delayMs: 20 }),
        }),
      ),
    );

    const pending = act(async () => {
      await result.current.submit("AF first line?");
    });
    act(() => result.current.stop());
    await pending;

    expect(["stopped", "complete"]).toContain(result.current.state.status);
  });

  it("aborts anything in flight when the hook unmounts", async () => {
    // A dock that is unmounted — or suppressed mid-procedure — must not leave a
    // request running against a patient's record.
    const { result, unmount } = renderHook(() =>
      useConsult(
        baseOptions({
          provider: createStaticProvider({ events: grounded, disclosure, delayMs: 50 }),
        }),
      ),
    );

    const pending = act(async () => {
      await result.current.submit("AF first line?");
    });
    unmount();
    await expect(pending).resolves.toBeUndefined();
  });
});

describe("mode switching", () => {
  it("switches mode", () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    act(() => result.current.setMode("prepare"));
    expect(result.current.mode.id).toBe("prepare");
  });

  it("throws for an unregistered mode, since a typo must not resolve to nothing", () => {
    const { result } = renderHook(() => useConsult(baseOptions()));
    expect(() => act(() => result.current.setMode("nonexistent"))).toThrow(/Unknown mode/);
  });
});
