/**
 * The session reducer.
 *
 * Two properties carry the safety argument and each has a test named after it:
 * `crisis` is terminal, and a mode cannot change mid-stream. Everything else
 * here is ordinary transition coverage, which matters mostly because the state
 * chart is the thing every skin renders from.
 */

import { describe, expect, it } from "vitest";
import {
  canCompose,
  claimsOf,
  initialState,
  isBusy,
  reduce,
  sourcesOf,
  toHistoryText,
  toTurns,
  type SessionAction,
  type SessionState,
} from "../src/session.js";
import { copilotError } from "../src/errors.js";
import type { CheckResult } from "../src/checks.js";
import type { Source } from "../src/provider.js";
import { SAFE_VERDICT } from "../src/safety/index.js";

const source: Source = {
  id: "s1",
  title: "AF guideline",
  passage: "Rate control is a reasonable initial approach.",
  kind: "guideline",
  retrievedAt: "2026-08-16T09:00:00.000Z",
};

const checks: CheckResult = { findings: [], register: "grounded", refused: false, stigma: [] };

const run = (state: SessionState, ...actions: SessionAction[]): SessionState =>
  actions.reduce(reduce, state);

const submitted = () =>
  run(
    initialState("look-up"),
    { type: "submit", exchangeId: "x1", messageId: "m1", question: "AF first line?" },
    { type: "stream-start" },
  );

describe("initial state", () => {
  it("starts idle with nothing in flight", () => {
    const state = initialState("look-up");
    expect(state).toMatchObject({
      status: "idle",
      modeId: "look-up",
      draft: "",
      messages: [],
      current: null,
      error: null,
    });
    expect(canCompose(state)).toBe(true);
    expect(isBusy(state)).toBe(false);
  });
});

describe("composing", () => {
  it("moves idle → composing on the first keystroke", () => {
    const state = reduce(initialState("look-up"), { type: "set-draft", draft: "a" });
    expect(state.status).toBe("composing");
    expect(state.draft).toBe("a");
  });

  it("clears a previous error when the clinician starts typing again", () => {
    const errored = reduce(initialState("look-up"), {
      type: "fail",
      error: copilotError("network", "down"),
    });
    expect(errored.status).toBe("error");
    expect(reduce(errored, { type: "set-draft", draft: "x" }).error).toBeNull();
  });

  it("returns to composing from complete, so a follow-up is one keystroke away", () => {
    const state = run(submitted(), { type: "complete", messageId: "m2", checks, finish: "stop" });
    expect(state.status).toBe("complete");
    expect(reduce(state, { type: "set-draft", draft: "and in pregnancy?" }).status).toBe(
      "composing",
    );
  });
});

describe("dictation", () => {
  it("collects a partial transcript separately from the draft", () => {
    const state = run(
      initialState("look-up"),
      { type: "set-draft", draft: "dose of" },
      { type: "dictation-start" },
      { type: "dictation-partial", transcript: "amiodarone" },
    );
    expect(state.status).toBe("dictating");
    expect(state.transcript).toBe("amiodarone");
    expect(state.draft).toBe("dose of");
  });

  it("appends the transcript to the draft on stop and never submits it", () => {
    const state = run(
      initialState("look-up"),
      { type: "set-draft", draft: "dose of" },
      { type: "dictation-start" },
      { type: "dictation-partial", transcript: "amiodarone" },
      { type: "dictation-stop" },
    );
    // A human sees the words before they are sent. Speech recognition errors in
    // drug names are the classic harm, and this is the whole mitigation.
    expect(state.status).toBe("composing");
    expect(state.draft).toBe("dose of amiodarone");
    expect(state.transcript).toBe("");
  });

  it("accepts a final transcript that supersedes the partial", () => {
    const state = run(
      initialState("look-up"),
      { type: "dictation-start" },
      { type: "dictation-partial", transcript: "amiodipine" },
      { type: "dictation-stop", transcript: "amlodipine" },
    );
    expect(state.draft).toBe("amlodipine");
  });

  it("ignores a partial that arrives when dictation is not running", () => {
    const state = reduce(initialState("look-up"), {
      type: "dictation-partial",
      transcript: "stray",
    });
    expect(state.transcript).toBe("");
  });
});

describe("submitting and streaming", () => {
  it("records the clinician's message and clears the draft", () => {
    const state = reduce(initialState("look-up"), {
      type: "submit",
      exchangeId: "x1",
      messageId: "m1",
      question: "AF first line?",
    });
    expect(state.status).toBe("submitting");
    expect(state.draft).toBe("");
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toMatchObject({ role: "clinician", text: "AF first line?" });
    expect(isBusy(state)).toBe(true);
    expect(canCompose(state)).toBe(false);
  });

  it("ignores a second submit while one is in flight", () => {
    const state = run(submitted(), {
      type: "submit",
      exchangeId: "x2",
      messageId: "m9",
      question: "again",
    });
    expect(state.messages).toHaveLength(1);
  });

  it("accumulates deltas into the answer text", () => {
    const state = run(
      submitted(),
      { type: "event", event: { type: "delta", text: "Rate " } },
      { type: "event", event: { type: "delta", text: "control." } },
    );
    expect(state.current?.text).toBe("Rate control.");
  });

  it("keeps reasoning in a separate channel from the answer", () => {
    const state = run(
      submitted(),
      { type: "event", event: { type: "reasoning", text: "checking guideline" } },
      { type: "event", event: { type: "delta", text: "Rate control." } },
    );
    expect(state.current?.reasoning).toBe("checking guideline");
    expect(state.current?.text).toBe("Rate control.");
  });

  it("collects citations and claims during the stream, not after", () => {
    const state = run(
      submitted(),
      { type: "event", event: { type: "delta", text: "Rate control is reasonable." } },
      { type: "event", event: { type: "citation", marker: 1, source } },
      { type: "event", event: { type: "claim", claim: { span: [0, 27], markers: [1] } } },
    );
    expect(sourcesOf(state)).toEqual([source]);
    expect(claimsOf(state)).toHaveLength(1);
  });

  it("ignores events that arrive outside the streaming state", () => {
    const state = reduce(initialState("look-up"), {
      type: "event",
      event: { type: "delta", text: "stray" },
    });
    expect(state.current).toBeNull();
  });

  it("stores a proposal without committing anything", () => {
    const state = run(submitted(), {
      type: "event",
      event: {
        type: "proposal",
        proposal: { id: "p1", kind: "note-text", summary: "Add to note", content: "AF noted." },
      },
    });
    expect(state.proposal?.id).toBe("p1");
  });

  it("moves to proposing rather than complete when a proposal is pending", () => {
    const state = run(
      submitted(),
      { type: "event", event: { type: "delta", text: "text" } },
      {
        type: "event",
        event: {
          type: "proposal",
          proposal: { id: "p1", kind: "note-text", summary: "s", content: "c" },
        },
      },
      { type: "complete", messageId: "m2", checks, finish: "stop" },
    );
    expect(state.status).toBe("proposing");
  });

  it("marks an aborted answer partial rather than hiding it", () => {
    const state = run(
      submitted(),
      { type: "event", event: { type: "delta", text: "Rate cont" } },
      { type: "complete", messageId: "m2", checks, finish: "aborted" },
    );
    expect(state.current?.partial).toBe(true);
    expect(state.messages.at(-1)?.text).toBe("Rate cont");
  });

  it("marks a length-truncated answer partial too", () => {
    const state = run(submitted(), { type: "complete", messageId: "m2", checks, finish: "length" });
    expect(state.current?.partial).toBe(true);
  });

  it("takes the register from the checks, not from the provider", () => {
    const state = run(submitted(), {
      type: "complete",
      messageId: "m2",
      checks: { ...checks, register: "general" },
      finish: "stop",
    });
    expect(state.current?.register).toBe("general");
  });

  it("stops cleanly", () => {
    expect(reduce(submitted(), { type: "stop" }).status).toBe("stopped");
  });

  it("ignores a stop when nothing is in flight", () => {
    expect(reduce(initialState("look-up"), { type: "stop" }).status).toBe("idle");
  });
});

describe("crisis is terminal", () => {
  const crisisState = () =>
    run(submitted(), {
      type: "crisis",
      safety: {
        crisis: {
          severity: "imminent",
          audience: "user",
          rules: ["ideation.kill-self"],
          blocking: true,
        },
        blocking: true,
      },
    });

  it("discards the answer in flight rather than annotating it", () => {
    const state = run(
      submitted(),
      { type: "event", event: { type: "delta", text: "Here is some advice" } },
      {
        type: "crisis",
        safety: {
          crisis: { severity: "ideation", audience: "user", rules: [], blocking: true },
          blocking: true,
        },
      },
    );
    expect(state.status).toBe("crisis");
    expect(state.current).toBeNull();
  });

  it.each<SessionAction>([
    { type: "event", event: { type: "delta", text: "more" } },
    { type: "stream-start" },
    { type: "complete", messageId: "m", checks, finish: "stop" },
    { type: "set-draft", draft: "please just answer" },
    { type: "submit", exchangeId: "x2", messageId: "m2", question: "again" },
    { type: "dictation-start" },
    { type: "set-mode", modeId: "prepare" },
    { type: "stop" },
  ])("ignores %o", (action) => {
    const before = crisisState();
    expect(reduce(before, action)).toBe(before);
  });

  it("ignores events already in flight from a request dispatched before classification", () => {
    // The realistic race: the classifier returns while the stream is open.
    const state = run(
      crisisState(),
      { type: "event", event: { type: "delta", text: "leaked" } },
      { type: "event", event: { type: "delta", text: "more leaked" } },
    );
    expect(state.current).toBeNull();
    expect(state.messages.every((m) => m.role === "clinician")).toBe(true);
  });

  it("can only be left by starting a new thread", () => {
    const state = reduce(crisisState(), { type: "new-thread" });
    expect(state.status).toBe("idle");
    expect(state.messages).toEqual([]);
    expect(state.safety).toEqual(SAFE_VERDICT);
  });

  it("escalates when the endpoint reports a blocking verdict mid-stream", () => {
    const state = run(submitted(), {
      type: "event",
      event: {
        type: "safety",
        verdict: {
          crisis: { severity: "imminent", audience: "user", rules: [], blocking: true },
          blocking: true,
        },
      },
    });
    expect(state.status).toBe("crisis");
    expect(state.current).toBeNull();
  });

  it("records a non-blocking safety verdict without stopping", () => {
    const state = run(submitted(), {
      type: "event",
      event: {
        type: "safety",
        verdict: {
          crisis: { severity: "none", audience: "user", rules: [], blocking: false },
          blocking: false,
        },
      },
    });
    expect(state.status).toBe("streaming");
  });
});

describe("mode changes", () => {
  it("changes mode while composing", () => {
    const state = reduce(initialState("look-up"), { type: "set-mode", modeId: "prepare" });
    expect(state.modeId).toBe("prepare");
  });

  it("refuses to change mode mid-stream", () => {
    // Otherwise the answer would be governed by one output contract and
    // rendered under another.
    const state = reduce(submitted(), { type: "set-mode", modeId: "prepare" });
    expect(state.modeId).toBe("look-up");
  });

  it("refuses to change mode while submitting", () => {
    const submitting = reduce(initialState("look-up"), {
      type: "submit",
      exchangeId: "x",
      messageId: "m",
      question: "q",
    });
    expect(reduce(submitting, { type: "set-mode", modeId: "prepare" }).modeId).toBe("look-up");
  });
});

describe("errors and refusals", () => {
  it("records a refusal with its error", () => {
    const error = copilotError("out-of-scope", "not clinical", { retryable: false });
    const state = reduce(submitted(), { type: "refuse", error });
    expect(state.status).toBe("refused");
    expect(state.error).toBe(error);
    expect(state.current).toBeNull();
  });

  it("records an error event from the stream", () => {
    const state = run(submitted(), {
      type: "event",
      event: { type: "error", error: copilotError("provider", "500") },
    });
    expect(state.status).toBe("error");
  });

  it("ignores usage, tool-call and done events — the pipeline owns those", () => {
    const before = submitted();
    const after = run(
      before,
      { type: "event", event: { type: "usage", input: 10, output: 20 } },
      {
        type: "event",
        event: { type: "tool-call", call: { id: "t", name: "search", arguments: {} } },
      },
      { type: "event", event: { type: "done", finish: "stop" } },
    );
    expect(after.current).toEqual(before.current);
    expect(after.status).toBe("streaming");
  });
});

describe("proposals", () => {
  it("clears the proposal and returns to composing on confirm", () => {
    const state = run(
      submitted(),
      {
        type: "event",
        event: {
          type: "proposal",
          proposal: { id: "p1", kind: "note-text", summary: "s", content: "c" },
        },
      },
      {
        type: "confirm",
        confirmed: {
          proposal: { id: "p1", kind: "note-text", summary: "s", content: "c" },
          actor: { display: "Dr Okafor" },
          confirmedAt: "2026-08-16T09:00:00.000Z",
          dwellMs: 4200,
          __confirmed: true,
        },
      },
    );
    expect(state.proposal).toBeNull();
    expect(state.status).toBe("composing");
  });

  it("dismisses a proposal back to complete", () => {
    const state = run(
      submitted(),
      {
        type: "event",
        event: {
          type: "proposal",
          proposal: { id: "p1", kind: "note-text", summary: "s", content: "c" },
        },
      },
      { type: "dismiss-proposal" },
    );
    expect(state.status).toBe("complete");
    expect(state.proposal).toBeNull();
  });
});

describe("selectors", () => {
  it("projects messages into provider turns", () => {
    const state = run(
      submitted(),
      { type: "event", event: { type: "delta", text: "Answer." } },
      { type: "complete", messageId: "m2", checks, finish: "stop" },
    );
    expect(toTurns(state)).toEqual([
      { role: "clinician", text: "AF first line?" },
      { role: "assistant", text: "Answer." },
    ]);
    expect(toHistoryText(state)).toEqual(["AF first line?", "Answer."]);
  });

  it("reports no sources or claims before a stream starts", () => {
    expect(sourcesOf(initialState("look-up"))).toEqual([]);
    expect(claimsOf(initialState("look-up"))).toEqual([]);
  });
});

describe("new thread", () => {
  it("preserves the mode and provider capability but drops everything else", () => {
    const state = run(
      initialState("prepare", false),
      { type: "submit", exchangeId: "x", messageId: "m", question: "q" },
      { type: "new-thread" },
    );
    expect(state.modeId).toBe("prepare");
    expect(state.providerCanCite).toBe(false);
    expect(state.messages).toEqual([]);
    expect(state.context).toBeNull();
  });
});
