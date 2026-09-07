/**
 * Unstyled primitives.
 *
 * Each of these carries semantics a skin would otherwise have to reinvent, and
 * would eventually get wrong. They render a single element with no class names
 * and no styles, so a skin can pass whatever it likes.
 *
 * The rule for what belongs here: **anything where getting it wrong is an
 * accessibility defect rather than an ugly component.** The live region, the
 * landmark, the citation buttons, the reduced-motion hook. Layout is the skin's
 * problem; `aria-live="off"` on a streaming container is not.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Answer, Source } from "@zoblocks/copilot-core";
import type { CopilotApi } from "./use-copilot.js";

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

const CopilotContext = createContext<CopilotApi | null>(null);

export function CopilotRoot(props: { api: CopilotApi; children: ReactNode }): ReactNode {
  // Law 5. When the host says the clinician is mid-procedure, nothing renders:
  // no dock, no dictation indicator, no motion, no listener. The most valuable
  // thing this component does is disappear.
  if (props.api.suppressed) return null;
  return <CopilotContext.Provider value={props.api}>{props.children}</CopilotContext.Provider>;
}

export function useCopilotContext(): CopilotApi {
  const api = useContext(CopilotContext);
  if (!api) {
    throw new Error("useCopilotContext must be used inside <CopilotRoot>.");
  }
  return api;
}

/* ------------------------------------------------------------------ */
/* Live region                                                         */
/* ------------------------------------------------------------------ */

const VISUALLY_HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * The status region. Announces transitions, never tokens.
 *
 * `role="status"` rather than `aria-live="assertive"`: an answer arriving is
 * not an emergency, and assertive would interrupt whatever the clinician was
 * having read to them.
 */
export function CopilotLiveRegion(props: { message: string }): ReactNode {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={VISUALLY_HIDDEN}>
      {props.message}
    </div>
  );
}

/**
 * The streaming answer container.
 *
 * Always `aria-live="off"`, always `aria-busy` while streaming. Exposed as a
 * component rather than documented as a convention, because a convention is
 * something a skin can forget.
 */
export function CopilotAnswerRegion(props: {
  busy: boolean;
  children: ReactNode;
  id?: string;
  className?: string;
}): ReactNode {
  return (
    <div
      id={props.id}
      className={props.className}
      aria-live="off"
      aria-busy={props.busy}
      tabIndex={-1}
    >
      {props.children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Landmark                                                            */
/* ------------------------------------------------------------------ */

/**
 * The dock, as a landmark rather than a floating div.
 *
 * `complementary` with an accessible name, so a screen-reader user can find it
 * and — more importantly — skip it. A persistent floating element with no
 * landmark is something you have to tab through on every page.
 */
export function CopilotDockRegion(props: {
  label?: string;
  children: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <aside aria-label={props.label ?? "Clinical assistant"} className={props.className}>
      {props.children}
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Citations                                                           */
/* ------------------------------------------------------------------ */

export interface CitationSegment {
  readonly text: string;
  readonly markers: readonly number[];
  /** True when no claim covers this span. Rendered as an "unsupported" mark. */
  readonly uncited: boolean;
}

/**
 * Split an answer into segments carrying their citation markers.
 *
 * Done here rather than in a skin so both skins mark uncited spans the same
 * way. Silence about provenance is the failure mode: an answer where one
 * sentence is sourced and the next is invention must not look uniform.
 */
export function segmentAnswer(answer: Answer): readonly CitationSegment[] {
  if (answer.text.length === 0) return [];

  const boundaries = new Set<number>([0, answer.text.length]);
  for (const claim of answer.claims) {
    boundaries.add(Math.max(0, Math.min(answer.text.length, claim.span[0])));
    boundaries.add(Math.max(0, Math.min(answer.text.length, claim.span[1])));
  }

  const points = [...boundaries].sort((a, b) => a - b);
  const segments: CitationSegment[] = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i] ?? 0;
    const end = points[i + 1] ?? 0;
    if (end <= start) continue;
    const markers = answer.claims
      .filter((c) => c.span[0] <= start && c.span[1] >= end)
      .flatMap((c) => [...c.markers]);
    const text = answer.text.slice(start, end);
    segments.push({
      text,
      markers: [...new Set(markers)].sort((a, b) => a - b),
      uncited: markers.length === 0 && /\w/.test(text),
    });
  }

  return segments;
}

/**
 * Accessible name for a citation marker.
 *
 * "source 1, 2023 ACC AHA atrial fibrillation guideline" rather than "1".
 * A superscript numeral read aloud as a bare number tells a screen-reader user
 * nothing, and this is the sort of detail that separates a component that
 * claims accessibility from one that has it.
 */
export function citationLabel(marker: number, source: Source | undefined): string {
  if (!source) return `Source ${marker}`;
  const parts = [`Source ${marker}`, source.title];
  if (source.version) parts.push(`version ${source.version}`);
  return parts.join(", ");
}

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

/**
 * Whether the user asked for less motion.
 *
 * Used by the waveform and the streaming cursor. The rule both obey: reduced
 * motion may remove *animation*, never *information*. A clinician must still
 * be able to tell that a microphone in a consulting room is live, so the
 * waveform becomes a static level meter rather than disappearing.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return reduced;
}

/* ------------------------------------------------------------------ */
/* Keyboard summon                                                     */
/* ------------------------------------------------------------------ */

/**
 * Cmd/Ctrl+K to summon.
 *
 * Ignores the shortcut while the user is typing in another field, because
 * stealing focus mid-sentence from a clinician writing a note is exactly the
 * interruption Law 5 is about.
 */
export function useSummonShortcut(options: {
  onSummon: () => void;
  enabled?: boolean;
  key?: string;
}): void {
  const { onSummon, enabled = true, key = "k" } = options;

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key || !(event.metaKey || event.ctrlKey)) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      event.preventDefault();
      onSummon();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled, key, onSummon]);
}

/* ------------------------------------------------------------------ */
/* Focus return                                                        */
/* ------------------------------------------------------------------ */

/**
 * Remember where focus was, and put it back.
 *
 * The panel is *not* a dialog and must not trap focus — a clinician has to be
 * able to keep working in the chart with it open. But focus must still return
 * to the control that opened it on close, which is the half people skip once
 * they decide it is not a dialog.
 */
export function useFocusReturn(open: boolean): void {
  const [opener, setOpener] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      setOpener(document.activeElement as HTMLElement | null);
      return;
    }
    if (opener && document.contains(opener)) {
      opener.focus();
      setOpener(null);
    }
    // `opener` is intentionally omitted: including it would re-run on the
    // setState above and immediately clear what we just captured.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

/* ------------------------------------------------------------------ */
/* Register presentation                                               */
/* ------------------------------------------------------------------ */

/**
 * The words each register uses.
 *
 * Centralised so the two skins cannot drift. A clinician who learns what
 * "Grounded" means in one ZoBlocks product should not have to relearn it in
 * another.
 */
export function useRegisterLabel(answer: Answer | null): {
  label: string;
  detail: string;
} | null {
  return useMemo(() => {
    if (!answer) return null;
    switch (answer.register) {
      case "grounded":
        return {
          label: "Grounded",
          detail: `${answer.sources.size} ${answer.sources.size === 1 ? "source" : "sources"}`,
        };
      case "general":
        return {
          label: "General knowledge",
          detail: "Not tied to a retrieved source. Verify before acting.",
        };
      case "declined":
        return { label: "Declined", detail: "No clinical content was produced." };
    }
  }, [answer]);
}
