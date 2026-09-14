/**
 * The streaming announcement strategy.
 *
 * The core assertion — the one the whole design rests on — is that **nothing is
 * announced while tokens arrive**. Every other test here is about the summary
 * being useful enough that a screen-reader user can decide whether to read the
 * answer at all.
 */

import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  countWords,
  lastCompleteSentenceEnd,
  useAnnouncer,
  DEFAULT_ANNOUNCER_MESSAGES,
} from "../src/use-announcer.js";
import { EMPTY_ANSWER, type Answer, type Source } from "@zoblocks/copilot-core";

const source: Source = {
  id: "s1",
  title: "Guideline",
  passage: "p",
  kind: "guideline",
  retrievedAt: "2026-08-16T09:00:00.000Z",
};

const answer = (over: Partial<Answer> = {}): Answer => ({
  ...EMPTY_ANSWER,
  text: "Rate control is a reasonable first strategy in most patients over sixty five.",
  sources: new Map([[1, source]]),
  ...over,
});

describe("useAnnouncer — silence during streaming", () => {
  it("says 'Answering' once when the stream starts and does not repeat", () => {
    const { result, rerender } = renderHook(
      (props: { text: string }) =>
        useAnnouncer({ status: "streaming", answer: answer({ text: props.text }) }),
      { initialProps: { text: "Rate" } },
    );

    expect(result.current.message).toBe(DEFAULT_ANNOUNCER_MESSAGES.answering);

    rerender({ text: "Rate control" });
    rerender({ text: "Rate control is" });
    rerender({ text: "Rate control is reasonable." });

    // Still the same string. No token stutter.
    expect(result.current.message).toBe(DEFAULT_ANNOUNCER_MESSAGES.answering);
  });

  it("reports the container as busy while streaming", () => {
    const { result } = renderHook(() => useAnnouncer({ status: "streaming", answer: answer() }));
    expect(result.current.busy).toBe(true);
  });

  it("reports the container as busy while submitting, before any token arrives", () => {
    const { result } = renderHook(() => useAnnouncer({ status: "submitting", answer: null }));
    expect(result.current.busy).toBe(true);
  });

  it("always reports liveness off, so a skin cannot get it wrong", () => {
    const { result } = renderHook(() => useAnnouncer({ status: "streaming", answer: answer() }));
    expect(result.current.liveness).toBe("off");
  });
});

describe("useAnnouncer — the completion summary", () => {
  it("reports word count and source count so the user can decide whether to read it", () => {
    const { result, rerender } = renderHook(
      (props: { status: "streaming" | "complete" }) =>
        useAnnouncer({ status: props.status, answer: answer() }),
      { initialProps: { status: "streaming" as const } },
    );

    rerender({ status: "complete" });
    expect(result.current.message).toBe("Answer complete. 13 words, 1 source.");
    expect(result.current.busy).toBe(false);
  });

  it("announces an answer that arrives with a proposal", () => {
    // Streaming goes straight to proposing when a proposal is pending.
    const { result, rerender } = renderHook(
      (props: { status: "streaming" | "proposing" }) =>
        useAnnouncer({ status: props.status, answer: answer() }),
      { initialProps: { status: "streaming" as const } },
    );
    rerender({ status: "proposing" });
    expect(result.current.message).toMatch(/^Answer complete\./);
  });

  it("pluralises correctly", () => {
    const two = new Map([
      [1, source],
      [2, { ...source, id: "s2" }],
    ]);
    const { result, rerender } = renderHook(
      (props: { status: "streaming" | "complete" }) =>
        useAnnouncer({
          status: props.status,
          answer: answer({ text: "One", sources: two }),
        }),
      { initialProps: { status: "streaming" as const } },
    );
    rerender({ status: "complete" });
    expect(result.current.message).toBe("Answer complete. 1 word, 2 sources.");
  });

  it("says the answer stopped early rather than pretending it is whole", () => {
    const { result, rerender } = renderHook(
      (props: { status: "streaming" | "complete" }) =>
        useAnnouncer({ status: props.status, answer: answer({ partial: true }) }),
      { initialProps: { status: "streaming" as const } },
    );
    rerender({ status: "complete" });
    expect(result.current.message).toMatch(/stopped early/);
  });

  it.each([
    ["refused", /outside what this assistant answers/],
    ["crisis", /needs a person/],
    ["error", /could not answer/],
    ["stopped", /stopped/],
  ] as const)("announces the %s state", (status, pattern) => {
    const { result, rerender } = renderHook(
      (props: { status: string }) => useAnnouncer({ status: props.status as never, answer: null }),
      { initialProps: { status: "streaming" } },
    );
    rerender({ status });
    expect(result.current.message).toMatch(pattern);
  });

  it("keeps the crisis announcement plain rather than warm", () => {
    // Warmth here reads as the machine continuing to play a role it must exit.
    expect(DEFAULT_ANNOUNCER_MESSAGES.crisis).not.toMatch(/sorry|understand|feel|here for you/i);
  });

  it("accepts localised messages", () => {
    const { result, rerender } = renderHook(
      (props: { status: "streaming" | "complete" }) =>
        useAnnouncer({
          status: props.status,
          answer: answer(),
          messages: { complete: () => "Réponse terminée." },
        }),
      { initialProps: { status: "streaming" as const } },
    );
    rerender({ status: "complete" });
    expect(result.current.message).toBe("Réponse terminée.");
  });
});

describe("useAnnouncer — progressive mode", () => {
  it("announces completed sentences, never partial ones", () => {
    const { result, rerender } = renderHook(
      (props: { text: string }) =>
        useAnnouncer({
          status: "streaming",
          answer: answer({ text: props.text }),
          mode: "progressive",
        }),
      { initialProps: { text: "Rate control is reasonable" } },
    );

    // No boundary yet — nothing new announced.
    expect(result.current.message).toBe(DEFAULT_ANNOUNCER_MESSAGES.answering);

    rerender({ text: "Rate control is reasonable. Rhythm" });
    expect(result.current.message).toBe("Rate control is reasonable.");

    rerender({ text: "Rate control is reasonable. Rhythm control is too. And" });
    expect(result.current.message).toBe("Rhythm control is too.");
  });

  it("does not announce a full stop at the very end of the buffer", () => {
    // The next token might be "5 mg" and the sentence might not be over.
    // Announcing half a dose is worse than announcing nothing.
    const { result } = renderHook(() =>
      useAnnouncer({
        status: "streaming",
        answer: answer({ text: "Give 2." }),
        mode: "progressive",
      }),
    );
    expect(result.current.message).toBe(DEFAULT_ANNOUNCER_MESSAGES.answering);
  });
});

describe("countWords", () => {
  it.each([
    ["", 0],
    ["   ", 0],
    ["one", 1],
    ["one two three", 3],
    ["  spaced   out  words ", 3],
    ["line\nbreaks\tcount", 3],
  ])("counts %j as %i", (text, expected) => {
    expect(countWords(text)).toBe(expected);
  });
});

describe("lastCompleteSentenceEnd", () => {
  it("is zero when no sentence has finished", () => {
    expect(lastCompleteSentenceEnd("no boundary yet")).toBe(0);
  });

  it("is zero for a terminator at the very end", () => {
    expect(lastCompleteSentenceEnd("Give 2.")).toBe(0);
  });

  it("finds a boundary followed by whitespace", () => {
    expect(lastCompleteSentenceEnd("One. Two")).toBe(5);
  });

  it("takes the last of several", () => {
    expect(lastCompleteSentenceEnd("One. Two. Three")).toBe(10);
  });

  it.each(["!", "?"])("handles %s as a terminator", (mark) => {
    expect(lastCompleteSentenceEnd(`Really${mark} Next`)).toBeGreaterThan(0);
  });

  it("handles a closing quote after the terminator", () => {
    expect(lastCompleteSentenceEnd('He said "stop." Then')).toBeGreaterThan(0);
  });
});
