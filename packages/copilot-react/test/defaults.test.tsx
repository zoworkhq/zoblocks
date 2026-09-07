/**
 * The defaults, and the branches the wired-up tests never take.
 *
 * Everywhere else in this suite injects `now` and `newId` so the assertions are
 * deterministic. That is correct, and it means the real defaults — the ones
 * every consumer actually gets — go unexercised. These tests run without the
 * injections, so a broken default is caught here rather than in someone's app.
 */

import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCopilot } from "../src/use-copilot.js";
import { segmentAnswer, useRegisterLabel } from "../src/primitives.js";
import { useAnnouncer } from "../src/use-announcer.js";
import {
  createStaticProvider,
  EMPTY_ANSWER,
  lookUp,
  minimalDisclosure,
  type Answer,
  type CopilotEvent,
  type Source,
} from "@zoblocks/copilot-core";

const disclosure = minimalDisclosure("test-model@1");

const source: Source = {
  id: "s1",
  title: "Guideline",
  passage: "Rate control is reasonable.",
  kind: "guideline",
  retrievedAt: "2026-08-16T09:00:00.000Z",
};

const grounded: CopilotEvent[] = [
  { type: "delta", text: "Rate control is reasonable." },
  { type: "citation", marker: 1, source },
  { type: "claim", claim: { span: [0, 27], markers: [1] } },
  { type: "done", finish: "stop" },
];

describe("the real clock and id generator", () => {
  it("runs an exchange end to end with no injected now or newId", async () => {
    const audits: unknown[] = [];
    const { result } = renderHook(() =>
      useCopilot({
        provider: createStaticProvider({ events: grounded, disclosure }),
        modes: [lookUp],
        onAudit: (event) => void audits.push(event),
      }),
    );

    await act(async () => {
      await result.current.submit("AF first line?");
    });

    expect(result.current.state.status).toBe("complete");
    // The default `now` produced a real ISO timestamp for the audit record.
    expect(audits).toHaveLength(1);
    expect((audits[0] as { recorded: string }).recorded).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
    // The default `newId` produced distinct ids for the exchange and messages.
    const ids = result.current.state.messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.current.state.exchangeId).toBeTruthy();
  });

  it("falls back to a counter when crypto.randomUUID is unavailable", async () => {
    const original = globalThis.crypto;
    // Some edge runtimes and older jsdom builds have no randomUUID.
    vi.stubGlobal("crypto", {});
    try {
      const { result } = renderHook(() =>
        useCopilot({
          provider: createStaticProvider({ events: grounded, disclosure }),
          modes: [lookUp],
        }),
      );
      await act(async () => {
        await result.current.submit("AF first line?");
      });
      expect(result.current.state.exchangeId).toMatch(/^copilot-\d+$/);
    } finally {
      vi.stubGlobal("crypto", original);
    }
  });
});

describe("segmentAnswer — degenerate spans", () => {
  const answer = (over: Partial<Answer> = {}): Answer => ({ ...EMPTY_ANSWER, ...over });

  it("skips a zero-width claim rather than emitting an empty segment", () => {
    const segments = segmentAnswer(
      answer({
        text: "Rate control is reasonable.",
        claims: [
          { span: [5, 5], markers: [1] },
          { span: [0, 27], markers: [2] },
        ],
      }),
    );
    expect(segments.every((s) => s.text.length > 0)).toBe(true);
  });

  it("skips an inverted span", () => {
    const segments = segmentAnswer(
      answer({ text: "Rate control.", claims: [{ span: [10, 2], markers: [1] }] }),
    );
    expect(segments.every((s) => s.text.length > 0)).toBe(true);
  });
});

describe("useRegisterLabel — grounded plurals", () => {
  it("pluralises multiple sources", () => {
    const two = new Map([
      [1, source],
      [2, { ...source, id: "s2" }],
    ]);
    const { result } = renderHook(() =>
      useRegisterLabel({ ...EMPTY_ANSWER, register: "grounded", sources: two }),
    );
    expect(result.current).toEqual({ label: "Grounded", detail: "2 sources" });
  });
});

describe("useAnnouncer — no answer at all", () => {
  it("reports zero words and zero sources rather than crashing", () => {
    const { result, rerender } = renderHook(
      (props: { status: "streaming" | "complete" }) =>
        useAnnouncer({ status: props.status, answer: null }),
      { initialProps: { status: "streaming" as const } },
    );
    rerender({ status: "complete" });
    expect(result.current.message).toBe("Answer complete. 0 words, 0 sources.");
  });

  it("clears the message on an idle transition", () => {
    const { result, rerender } = renderHook(
      (props: { status: "complete" | "idle" }) =>
        useAnnouncer({ status: props.status, answer: null }),
      { initialProps: { status: "complete" as const } },
    );
    rerender({ status: "idle" });
    expect(result.current.message).toBe("");
  });

  it("stays quiet in progressive mode when there is no answer object", () => {
    const { result, rerender } = renderHook(
      (props: { text: string | null }) =>
        useAnnouncer({
          status: "streaming",
          answer: props.text === null ? null : { ...EMPTY_ANSWER, text: props.text },
          mode: "progressive",
        }),
      { initialProps: { text: null as string | null } },
    );
    rerender({ text: null });
    expect(result.current.message).toBe("Answering.");
  });
});

describe("useCopilot — remaining option branches", () => {
  it("falls back to a default mode id when the modes array is empty", () => {
    // Throws from requireMode rather than rendering an assistant with no scope
    // contract, which is the failure the mode design exists to prevent.
    expect(() =>
      renderHook(() =>
        useCopilot({
          provider: createStaticProvider({ events: [], disclosure }),
          modes: [],
        }),
      ),
    ).toThrow(/Unknown mode "look-up"/);
  });

  it("reports canRetry false before anything has been asked", () => {
    const { result } = renderHook(() =>
      useCopilot({
        provider: createStaticProvider({ events: grounded, disclosure }),
        modes: [lookUp],
      }),
    );
    expect(result.current.canRetry).toBe(false);
  });

  it("does nothing on retry when there is no prior question", async () => {
    const send = vi.fn();
    const { result } = renderHook(() =>
      useCopilot({
        provider: { ...createStaticProvider({ events: [], disclosure }), send },
        modes: [lookUp],
      }),
    );
    await act(async () => {
      await result.current.retry();
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("re-sends the last question on retry, not the cleared draft", async () => {
    const asked: string[] = [];
    const { result } = renderHook(() =>
      useCopilot({
        provider: {
          ...createStaticProvider({ events: grounded, disclosure }),
          async *send(request: { question: string }) {
            asked.push(request.question);
            yield { type: "delta", text: "ok" } as const;
            yield { type: "done", finish: "stop" } as const;
          },
        } as never,
        modes: [lookUp],
      }),
    );

    await act(async () => {
      await result.current.submit("AF first line?");
    });
    await act(async () => {
      await result.current.retry();
    });

    expect(asked).toEqual(["AF first line?", "AF first line?"]);
  });

  it("exposes the provider's disclosure without handing over the provider", () => {
    const { result } = renderHook(() =>
      useCopilot({
        provider: createStaticProvider({ events: [], disclosure }),
        modes: [lookUp],
      }),
    );
    expect(result.current.disclosure.modelId).toBe("test-model@1");
    expect(result.current).not.toHaveProperty("provider");
  });

  it("ignores a second submit while one is already in flight", async () => {
    const send = vi.fn(async function* () {
      yield { type: "delta", text: "one" } as const;
      yield { type: "done", finish: "stop" } as const;
    });
    const { result } = renderHook(() =>
      useCopilot({
        provider: { ...createStaticProvider({ events: [], disclosure }), send } as never,
        modes: [lookUp],
      }),
    );

    await act(async () => {
      await Promise.all([result.current.submit("first"), result.current.submit("second")]);
    });

    expect(send).toHaveBeenCalledTimes(1);
  });
});
