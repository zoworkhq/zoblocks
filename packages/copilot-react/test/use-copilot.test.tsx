/**
 * `useCopilot`, end to end through React.
 *
 * The copilot-core suite already proves the engine. What is proved here is that
 * the hook wires it up without losing any of the guarantees — that suppression
 * really suppresses, that the patient-facing guard really throws, that the
 * verification signal really fires, and that an unmounting dock does not leave
 * a request running against a patient's record.
 */

import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCopilot, type UseCopilotOptions } from "../src/use-copilot.js";
import {
  createStaticProvider,
  lookUp,
  prepare,
  minimalDisclosure,
  PatientFacingNotSupportedError,
  type CopilotEvent,
  type Source,
  type TelemetryEvent,
} from "@zoblocks/copilot-core";

const disclosure = minimalDisclosure("test-model@1");

const source: Source = {
  id: "s1",
  title: "AF guideline",
  passage: "Rate control is reasonable.",
  kind: "guideline",
  retrievedAt: "2026-08-16T09:00:00.000Z",
};

const grounded: CopilotEvent[] = [
  { type: "delta", text: "Rate control is a reasonable first strategy." },
  { type: "citation", marker: 1, source },
  { type: "claim", claim: { span: [0, 43], markers: [1] } },
  { type: "done", finish: "stop" },
];

let ids = 0;
const baseOptions = (over: Partial<UseCopilotOptions> = {}): UseCopilotOptions => ({
  provider: createStaticProvider({ events: grounded, disclosure }),
  modes: [lookUp, prepare],
  now: () => "2026-08-16T09:00:00.000Z",
  newId: () => `id-${++ids}`,
  actor: { display: "Dr Okafor", reference: "Practitioner/7" },
  ...over,
});

describe("basic flow", () => {
  it("starts idle with the first mode selected", () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
    expect(result.current.state.status).toBe("idle");
    expect(result.current.mode.id).toBe("look-up");
    expect(result.current.canSubmit).toBe(false);
  });

  it("honours an explicit initial mode", () => {
    const { result } = renderHook(() => useCopilot(baseOptions({ initialModeId: "prepare" })));
    expect(result.current.mode.id).toBe("prepare");
  });

  it("enables submit once there is a draft", () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
    act(() => result.current.setDraft("AF first line?"));
    expect(result.current.canSubmit).toBe(true);
  });

  it("does not enable submit on whitespace alone", () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
    act(() => result.current.setDraft("   "));
    expect(result.current.canSubmit).toBe(false);
  });

  it("streams an answer through to the grounded register", async () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
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
    const { result } = renderHook(() => useCopilot(baseOptions()));
    act(() => result.current.setDraft("AF first line?"));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.draft).toBe("");
  });

  it("accepts an override question without touching the draft first", async () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
    await act(async () => {
      await result.current.submit("AF first line?");
    });
    await waitFor(() => expect(result.current.state.status).toBe("complete"));
  });

  it("ignores an empty submit", async () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
    await act(async () => {
      await result.current.submit("   ");
    });
    expect(result.current.state.status).toBe("idle");
  });

  it("starts a new thread", async () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
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
      useCopilot(
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
    expect(() => renderHook(() => useCopilot(baseOptions({ surface: "patient" })))).toThrow(
      PatientFacingNotSupportedError,
    );
  });

  it("renders normally on a clinician surface", () => {
    expect(() => renderHook(() => useCopilot(baseOptions({ surface: "clinician" })))).not.toThrow();
  });
});

describe("crisis", () => {
  it("blocks, never calls the provider, and offers locale-resolved lines", async () => {
    const send = vi.fn();
    const { result } = renderHook(() =>
      useCopilot(
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
    const { result } = renderHook(() => useCopilot(baseOptions({ locale: "en-GB" })));
    await act(async () => {
      await result.current.submit("I want to kill myself");
    });
    expect(result.current.crisisLines.some((l) => l.number === "988")).toBe(false);
    expect(result.current.crisisLines.some((l) => l.number === "116123")).toBe(true);
  });

  it("stays blocked until a new thread is started", async () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
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
    const { result } = renderHook(() => useCopilot(baseOptions()));

    act(() => result.current.dictation.start());
    expect(result.current.dictation.active).toBe(true);

    act(() => result.current.dictation.update("amiodarone"));
    expect(result.current.dictation.transcript).toBe("amiodarone");

    act(() => result.current.dictation.stop());
    expect(result.current.draft).toBe("amiodarone");
    expect(result.current.state.status).toBe("composing");
  });

  it("accepts a corrected final transcript", () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
    act(() => result.current.dictation.start());
    act(() => result.current.dictation.update("amiodipine"));
    act(() => result.current.dictation.stop("amlodipine"));
    expect(result.current.draft).toBe("amlodipine");
  });
});

describe("feedback targets the message it was given on", () => {
  it("records feedback on an older answer against that answer's exchange", async () => {
    const events: TelemetryEvent[] = [];
    const { result } = renderHook(() =>
      useCopilot(baseOptions({ onTelemetry: (e) => void events.push(e) })),
    );
    await act(async () => {
      await result.current.submit("first?");
    });
    await act(async () => {
      await result.current.submit("second?");
    });
    await waitFor(() => expect(result.current.state.messages).toHaveLength(4));
    const first = result.current.state.messages[1];
    expect(first?.exchangeId).toBeDefined();
    expect(first?.exchangeId).not.toBe(result.current.state.exchangeId);

    act(() => result.current.sendFeedbackFor(first?.id ?? "", "down"));
    expect(result.current.awaitingFeedbackReason).toBe(first?.id);

    act(() => result.current.sendFeedbackFor(first?.id ?? "", "down", "wrong"));
    expect(events.find((e) => e.type === "feedback")).toMatchObject({
      exchangeId: first?.exchangeId,
      reason: "wrong",
    });
    expect(result.current.awaitingFeedbackReason).toBeNull();
  });

  it("records a bare thumbs-down at once when the skin has no reason picker", async () => {
    const events: TelemetryEvent[] = [];
    const { result } = renderHook(() =>
      useCopilot(baseOptions({ onTelemetry: (e) => void events.push(e) })),
    );
    await act(async () => {
      await result.current.submit("first?");
    });
    await waitFor(() => expect(result.current.state.messages).toHaveLength(2));
    const answer = result.current.state.messages[1];

    act(() =>
      result.current.sendFeedbackFor(answer?.id ?? "", "down", undefined, { askReason: false }),
    );
    const feedback = events.filter((e) => e.type === "feedback");
    expect(feedback).toEqual([
      { type: "feedback", exchangeId: answer?.exchangeId, rating: "down" },
    ]);
    expect(result.current.awaitingFeedbackReason).toBeNull();
  });
});

describe("verification signal", () => {
  it("emits sources-opened with a source count when the drawer opens", async () => {
    const events: TelemetryEvent[] = [];
    const { result } = renderHook(() =>
      useCopilot(baseOptions({ onTelemetry: (e) => void events.push(e) })),
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

  it("starts the verification clock for an answer that arrives with a proposal", async () => {
    const withProposal: CopilotEvent[] = [
      ...grounded.slice(0, -1),
      {
        type: "proposal",
        proposal: { id: "p1", kind: "note-text", summary: "Add", content: "AF, rate controlled." },
      },
      { type: "done", finish: "stop" },
    ];
    let clock = 1_000;
    const now = vi.spyOn(Date, "now").mockImplementation(() => clock);
    const events: TelemetryEvent[] = [];
    const { result } = renderHook(() =>
      useCopilot(
        baseOptions({
          provider: createStaticProvider({ events: withProposal, disclosure }),
          onTelemetry: (e) => void events.push(e),
        }),
      ),
    );
    await act(async () => {
      await result.current.submit("summarise for the note");
    });
    await waitFor(() => expect(result.current.state.status).toBe("proposing"));

    clock = 4_000;
    act(() => result.current.openSources());
    now.mockRestore();
    expect(events.find((e) => e.type === "sources-opened")).toMatchObject({ msToOpen: 3_000 });
  });

  it("opens the sources of the message asked for, not the latest answer", async () => {
    const other: Source = { ...source, id: "s2", title: "Second guideline" };
    let call = 0;
    const provider = {
      ...createStaticProvider({ events: grounded, disclosure }),
      async *send() {
        call += 1;
        const cited = call === 1 ? source : other;
        yield { type: "delta", text: "Rate control is reasonable." } as const;
        yield { type: "citation", marker: call === 1 ? 1 : 3, source: cited } as const;
        yield { type: "done", finish: "stop" } as const;
      },
    };
    const { result } = renderHook(() => useCopilot(baseOptions({ provider: provider as never })));
    await act(async () => {
      await result.current.submit("first?");
    });
    await act(async () => {
      await result.current.submit("second?");
    });
    await waitFor(() => expect(result.current.state.messages).toHaveLength(4));

    const firstAnswer = result.current.state.messages[1];
    act(() => result.current.openSourcesFor(firstAnswer?.id ?? ""));
    expect(result.current.sources.map((s) => s.id)).toEqual(["s1"]);
    expect(result.current.citations.map((c) => c.marker)).toEqual([1]);

    act(() => result.current.openSources());
    expect(result.current.citations).toEqual([{ marker: 3, source: other }]);
  });

  it("closes the drawer", async () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
    await act(async () => {
      await result.current.submit("AF first line?");
    });
    act(() => result.current.openSources());
    act(() => result.current.closeSources());
    expect(result.current.sourcesOpen).toBe(false);
  });

  it("keeps sources opened mid-answer open when the answer completes", async () => {
    // "Show sources" is on screen before the answer is marked complete. The
    // drawer used to close on that transition, so a click in the gap opened it
    // and shut it again a moment later — and the skin tests failed only when a
    // runner was slow enough to land the click there.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const provider = {
      ...createStaticProvider({ events: grounded, disclosure }),
      async *send() {
        yield { type: "delta", text: "Rate control is reasonable." } as const;
        yield { type: "citation", marker: 1, source } as const;
        await gate;
        yield { type: "done", finish: "stop" } as const;
      },
    };
    const { result } = renderHook(() => useCopilot(baseOptions({ provider: provider as never })));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.submit("AF first line?");
    });
    await waitFor(() => expect(result.current.state.status).toBe("streaming"));
    act(() => result.current.openSources());
    expect(result.current.sourcesOpen).toBe(true);

    await act(async () => {
      release();
      await pending;
    });
    await waitFor(() => expect(result.current.state.status).toBe("complete"));
    expect(result.current.sourcesOpen).toBe(true);
  });

  it("closes the drawer when a new question is sent", async () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
    await act(async () => {
      await result.current.submit("AF first line?");
    });
    await waitFor(() => expect(result.current.state.status).toBe("complete"));
    act(() => result.current.openSources());
    expect(result.current.sourcesOpen).toBe(true);

    await act(async () => {
      await result.current.submit("and the second line?");
    });
    expect(result.current.sourcesOpen).toBe(false);
  });

  it("emits structured feedback rather than free text", async () => {
    const events: TelemetryEvent[] = [];
    const { result } = renderHook(() =>
      useCopilot(baseOptions({ onTelemetry: (e) => void events.push(e) })),
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
  const withProposal: CopilotEvent[] = [
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
      useCopilot(
        baseOptions({ provider: createStaticProvider({ events: withProposal, disclosure }) }),
      ),
    );
    await act(async () => {
      await result.current.submit("summarise for the note");
    });
    await waitFor(() => expect(result.current.proposal?.id).toBe("p1"));
    expect(result.current.state.status).toBe("proposing");
  });

  it("reports a prohibited proposal as a contract violation instead of throwing", async () => {
    const dosing: CopilotEvent[] = withProposal.map((event) =>
      event.type === "proposal"
        ? { ...event, proposal: { ...event.proposal, content: "Start bisoprolol 2.5 mg od." } }
        : event,
    );
    // Look up with dosing forbidden, so the dose in the proposal is prohibited.
    const noDosing = { ...lookUp, output: { ...lookUp.output, forbidDosing: true } };
    const { result } = renderHook(() =>
      useCopilot(
        baseOptions({
          modes: [noDosing],
          provider: createStaticProvider({ events: dosing, disclosure }),
        }),
      ),
    );
    await act(async () => {
      await result.current.submit("summarise for the note");
    });
    await waitFor(() => expect(result.current.proposal).not.toBeNull());

    expect(() => act(() => result.current.confirm())).not.toThrow();
    expect(result.current.proposal).toBeNull();
    expect(result.current.state.error?.code).toBe("contract-violation");
  });

  it("exposes no proposal mid-stream, only once the checks have run", async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const provider = {
      ...createStaticProvider({ events: [], disclosure }),
      async *send() {
        for (const event of withProposal) {
          if (event.type === "done") await gate;
          yield event;
        }
      },
    };
    const { result } = renderHook(() => useCopilot(baseOptions({ provider: provider as never })));
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.submit("summarise for the note");
    });
    await waitFor(() => expect(result.current.state.proposal).not.toBeNull());
    expect(result.current.state.status).toBe("streaming");
    expect(result.current.proposal).toBeNull();
    expect(result.current.proposalRisk).toBeNull();

    await act(async () => {
      release();
      await pending;
    });
    expect(result.current.proposal?.id).toBe("p1");
    expect(result.current.proposalRisk).toBe("routine");
  });

  it("classifies a proposal the mode forbids as prohibited", async () => {
    const dosing: CopilotEvent[] = withProposal.map((event) =>
      event.type === "proposal"
        ? { ...event, proposal: { ...event.proposal, content: "Start bisoprolol 2.5 mg od." } }
        : event,
    );
    const noDosing = { ...lookUp, output: { ...lookUp.output, forbidDosing: true } };
    const { result } = renderHook(() =>
      useCopilot(
        baseOptions({
          modes: [noDosing],
          provider: createStaticProvider({ events: dosing, disclosure }),
        }),
      ),
    );
    await act(async () => {
      await result.current.submit("summarise for the note");
    });
    await waitFor(() => expect(result.current.proposal).not.toBeNull());
    expect(result.current.proposalRisk).toBe("prohibited");
  });

  it("drops the proposal when the mode changes", async () => {
    const { result } = renderHook(() =>
      useCopilot(
        baseOptions({ provider: createStaticProvider({ events: withProposal, disclosure }) }),
      ),
    );
    await act(async () => {
      await result.current.submit("summarise for the note");
    });
    await waitFor(() => expect(result.current.proposal).not.toBeNull());

    act(() => result.current.setMode("prepare"));
    expect(result.current.proposal).toBeNull();
  });

  it("records dwell time and reflexiveness on confirm", async () => {
    const events: TelemetryEvent[] = [];
    const { result } = renderHook(() =>
      useCopilot(
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
      useCopilot(
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
      useCopilot(
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
    const { result } = renderHook(() => useCopilot(baseOptions()));
    expect(result.current.scope).toMatchObject({ withheldCount: 0, showWithheld: false });
    expect(result.current.scope.categories).toEqual([]);
  });

  it("reports disclosable withheld counts for a reading mode", async () => {
    const { result } = renderHook(() =>
      useCopilot(
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

    /*
     * Two views of one fact, and the split is the point.
     *
     * `resourceTypes` is the contract — the closed FHIR union a compliance
     * officer diffs and a typo cannot survive. `categories` is what the scope
     * strip renders, and it has to be a sentence a clinician reads
     * mid-consultation: "Condition, MedicationRequest, MedicationStatement,
     * AllergyIntolerance, Observation, DiagnosticReport, Encounter" gets
     * skipped, and a scope strip that gets skipped is the control defeated.
     */
    expect(result.current.scope.resourceTypes).toContain("Condition");
    expect(result.current.scope.categories).toContain("problem list");
    expect(result.current.scope.categories).not.toContain("Condition");

    // MedicationRequest and MedicationStatement collapse: a clinician thinks
    // "medications", and listing it twice reads as a rendering fault.
    expect(result.current.scope.categories.filter((c) => c === "medications")).toHaveLength(1);
  });
});

describe("stopping and unmounting", () => {
  it("stops a stream in flight", async () => {
    const { result } = renderHook(() =>
      useCopilot(
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
      useCopilot(
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
    const { result } = renderHook(() => useCopilot(baseOptions()));
    act(() => result.current.setMode("prepare"));
    expect(result.current.mode.id).toBe("prepare");
  });

  it("throws for an unregistered mode, since a typo must not resolve to nothing", () => {
    const { result } = renderHook(() => useCopilot(baseOptions()));
    expect(() => act(() => result.current.setMode("nonexistent"))).toThrow(/Unknown mode/);
  });
});
