/**
 * The streaming announcement strategy.
 *
 * This is the hardest accessibility problem in the component, and the naive
 * implementation is genuinely unusable.
 *
 * Putting `aria-live="polite"` on a streaming container produces a screen
 * reader that either reads every partial token — an unusable stutter — or
 * coalesces and reads something arbitrary. Both ship in real products.
 *
 * The working pattern has four parts:
 *
 *   1. The streaming region is `aria-live="off"` with `aria-busy="true"` while
 *      text arrives. **Nothing is announced during the stream.**
 *   2. A separate visually-hidden status region announces state transitions
 *      only: "Answering…", then "Answer complete. 240 words, 3 sources."
 *   3. On completion `aria-busy` flips to false and the answer becomes
 *      navigable — the user moves to it deliberately rather than being dragged.
 *   4. A preference exists for progressive announcement at *sentence*
 *      boundaries, for users who want it. Off by default, because the majority
 *      preference is the summary.
 *
 * The summary is the interesting design decision. "Answer complete" alone tells
 * a screen-reader user nothing about whether it is worth reading. Word count
 * and source count let them decide, and the source count is the one that
 * matters: an answer with three sources and an answer with none are different
 * propositions, and a sighted user can see that difference at a glance from the
 * register badge.
 */

import { useEffect, useRef, useState } from "react";
import type { Answer, ConsultStatus } from "@oxygenui-design/consult-core";

export type AnnouncementMode = "summary" | "progressive";

export interface UseAnnouncerOptions {
  readonly status: ConsultStatus;
  readonly answer: Answer | null;
  readonly mode?: AnnouncementMode;
  /** Strings, so a host can localise. */
  readonly messages?: Partial<AnnouncerMessages>;
}

export interface AnnouncerMessages {
  answering: string;
  /** Receives word count and source count. */
  complete: (words: number, sources: number) => string;
  partial: (words: number) => string;
  refused: string;
  crisis: string;
  error: string;
  stopped: string;
}

export const DEFAULT_ANNOUNCER_MESSAGES: AnnouncerMessages = {
  answering: "Answering.",
  complete: (words, sources) =>
    `Answer complete. ${words} ${words === 1 ? "word" : "words"}, ` +
    `${sources} ${sources === 1 ? "source" : "sources"}.`,
  partial: (words) => `Answer stopped early. ${words} ${words === 1 ? "word" : "words"} so far.`,
  refused: "That question is outside what this assistant answers.",
  // Deliberately plain. Warmth here reads as the machine continuing to play a
  // role it must exit.
  crisis: "This needs a person. Escalation options are shown.",
  error: "The assistant could not answer. Details are shown.",
  stopped: "Answer stopped.",
};

export interface Announcer {
  /** Text for the visually-hidden live region. Changes only on transitions. */
  readonly message: string;
  /** For `aria-busy` on the streaming container. */
  readonly busy: boolean;
  /**
   * For `aria-live` on the streaming container — always "off". Exposed as a
   * value rather than left to the skin so a skin cannot get it wrong.
   */
  readonly liveness: "off";
}

export function useAnnouncer(options: UseAnnouncerOptions): Announcer {
  const { status, answer, mode = "summary" } = options;
  const messages = { ...DEFAULT_ANNOUNCER_MESSAGES, ...options.messages };

  const [message, setMessage] = useState("");
  const lastStatus = useRef<ConsultStatus | null>(null);
  const lastSentence = useRef(0);

  useEffect(() => {
    const changed = lastStatus.current !== status;
    lastStatus.current = status;

    const words = answer ? countWords(answer.text) : 0;
    const sources = answer ? answer.sources.size : 0;

    if (changed) {
      switch (status) {
        case "submitting":
        case "streaming":
          lastSentence.current = 0;
          setMessage(messages.answering);
          return;
        case "complete":
          setMessage(answer?.partial ? messages.partial(words) : messages.complete(words, sources));
          return;
        case "refused":
          setMessage(messages.refused);
          return;
        case "crisis":
          setMessage(messages.crisis);
          return;
        case "error":
          setMessage(messages.error);
          return;
        case "stopped":
          setMessage(messages.stopped);
          return;
        default:
          setMessage("");
          return;
      }
    }

    // Progressive mode: announce completed sentences, never partial tokens.
    if (mode === "progressive" && status === "streaming" && answer) {
      const boundary = lastCompleteSentenceEnd(answer.text);
      if (boundary > lastSentence.current) {
        const sentence = answer.text.slice(lastSentence.current, boundary).trim();
        lastSentence.current = boundary;
        if (sentence) setMessage(sentence);
      }
    }
    // `messages` is rebuilt each render from props; depending on it would fire
    // this effect every render and re-announce. The status/answer pair is what
    // actually decides the announcement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, answer, mode]);

  return {
    message,
    busy: status === "streaming" || status === "submitting",
    liveness: "off",
  };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/**
 * End offset of the last sentence that is definitely finished.
 *
 * "Definitely" is doing work: a full stop followed by whitespace is a boundary,
 * a full stop at the very end of the buffer is not, because the next token may
 * be "5 mg" and the sentence may not be over. Announcing half a dose is worse
 * than announcing nothing.
 */
export function lastCompleteSentenceEnd(text: string): number {
  const matches = [...text.matchAll(/[.!?]["')\]]?\s/g)];
  const last = matches.at(-1);
  return last ? last.index + last[0].length : 0;
}
