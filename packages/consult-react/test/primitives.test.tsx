/**
 * The unstyled primitives.
 *
 * These carry the semantics a skin would otherwise reinvent and eventually get
 * wrong. The axe pass at the bottom is the backstop.
 */

import { describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import axe from "axe-core";
import {
  citationLabel,
  ConsultAnswerRegion,
  ConsultDockRegion,
  ConsultLiveRegion,
  ConsultRoot,
  segmentAnswer,
  useConsultContext,
  useFocusReturn,
  usePrefersReducedMotion,
  useRegisterLabel,
  useSummonShortcut,
} from "../src/primitives.js";
import { EMPTY_ANSWER, type Answer, type Source } from "@oxygenui-design/consult-core";
import type { ConsultApi } from "../src/use-consult.js";

const source: Source = {
  id: "s1",
  title: "2023 ACC/AHA AF Guideline",
  passage: "Rate control is reasonable.",
  kind: "guideline",
  version: "2023.1",
  retrievedAt: "2026-08-16T09:00:00.000Z",
};

const answer = (over: Partial<Answer> = {}): Answer => ({ ...EMPTY_ANSWER, ...over });

describe("ConsultLiveRegion", () => {
  it("is a polite status region, not an assertive alert", () => {
    // An answer arriving is not an emergency; assertive would interrupt
    // whatever the clinician was having read to them.
    render(<ConsultLiveRegion message="Answer complete." />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
    expect(region).toHaveTextContent("Answer complete.");
  });

  it("is visually hidden but present in the accessibility tree", () => {
    render(<ConsultLiveRegion message="Answering." />);
    const region = screen.getByRole("status");
    expect(region).toHaveStyle({ position: "absolute" });
    expect(region).not.toHaveAttribute("aria-hidden");
  });
});

describe("ConsultAnswerRegion", () => {
  it("is always aria-live off, so tokens are never announced", () => {
    const { container } = render(
      <ConsultAnswerRegion busy>Rate control is reasonable.</ConsultAnswerRegion>,
    );
    const region = container.firstElementChild;
    expect(region).toHaveAttribute("aria-live", "off");
    expect(region).toHaveAttribute("aria-busy", "true");
  });

  it("clears busy when the stream finishes", () => {
    const { container } = render(
      <ConsultAnswerRegion busy={false}>Done.</ConsultAnswerRegion>,
    );
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "false");
  });

  it("is programmatically focusable so the user can move to it deliberately", () => {
    const { container } = render(<ConsultAnswerRegion busy={false}>Done.</ConsultAnswerRegion>);
    expect(container.firstElementChild).toHaveAttribute("tabindex", "-1");
  });
});

describe("ConsultDockRegion", () => {
  it("is a named complementary landmark, not a bare floating div", () => {
    render(<ConsultDockRegion>dock</ConsultDockRegion>);
    expect(screen.getByRole("complementary", { name: "Clinical assistant" })).toBeInTheDocument();
  });

  it("accepts a custom label for localisation", () => {
    render(<ConsultDockRegion label="Assistant clinique">dock</ConsultDockRegion>);
    expect(screen.getByRole("complementary", { name: "Assistant clinique" })).toBeInTheDocument();
  });
});

describe("ConsultRoot", () => {
  const api = (over: Partial<ConsultApi> = {}) => ({ suppressed: false, ...over }) as ConsultApi;

  it("renders nothing at all when suppressed — Law 5", () => {
    const { container } = render(
      <ConsultRoot api={api({ suppressed: true })}>
        <div>dock</div>
      </ConsultRoot>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders children when not suppressed", () => {
    render(
      <ConsultRoot api={api()}>
        <div>dock</div>
      </ConsultRoot>,
    );
    expect(screen.getByText("dock")).toBeInTheDocument();
  });

  it("throws a useful error when the context is used outside the root", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Consumer = () => {
      useConsultContext();
      return null;
    };
    expect(() => render(<Consumer />)).toThrow(/inside <ConsultRoot>/);
    spy.mockRestore();
  });

  it("provides the api to descendants", () => {
    const Consumer = () => <span>{useConsultContext().suppressed ? "off" : "on"}</span>;
    render(
      <ConsultRoot api={api()}>
        <Consumer />
      </ConsultRoot>,
    );
    expect(screen.getByText("on")).toBeInTheDocument();
  });
});

describe("segmentAnswer", () => {
  it("returns nothing for an empty answer", () => {
    expect(segmentAnswer(answer())).toEqual([]);
  });

  it("marks a fully cited answer as cited throughout", () => {
    const segments = segmentAnswer(
      answer({ text: "Rate control works.", claims: [{ span: [0, 19], markers: [1] }] }),
    );
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ markers: [1], uncited: false });
  });

  it("splits at claim boundaries and marks the gap uncited", () => {
    const segments = segmentAnswer(
      answer({
        text: "Cited part. Invented part.",
        claims: [{ span: [0, 11], markers: [1] }],
      }),
    );
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ text: "Cited part.", uncited: false });
    expect(segments[1]).toMatchObject({ text: " Invented part.", uncited: true });
  });

  it("collects multiple markers on one span", () => {
    const segments = segmentAnswer(
      answer({
        text: "Well supported.",
        claims: [
          { span: [0, 15], markers: [1] },
          { span: [0, 15], markers: [2, 3] },
        ],
      }),
    );
    expect(segments[0]?.markers).toEqual([1, 2, 3]);
  });

  it("does not mark a punctuation-only gap as uncited", () => {
    const segments = segmentAnswer(
      answer({
        text: "One. Two.",
        claims: [
          { span: [0, 4], markers: [1] },
          { span: [5, 9], markers: [2] },
        ],
      }),
    );
    expect(segments.some((s) => s.uncited)).toBe(false);
  });

  it("clamps out-of-range spans rather than producing negative slices", () => {
    const segments = segmentAnswer(
      answer({ text: "Short.", claims: [{ span: [-5, 999], markers: [1] }] }),
    );
    expect(segments).toHaveLength(1);
    expect(segments[0]?.text).toBe("Short.");
  });
});

describe("citationLabel", () => {
  it("names the source rather than reading a bare number", () => {
    expect(citationLabel(1, source)).toBe(
      "Source 1, 2023 ACC/AHA AF Guideline, version 2023.1",
    );
  });

  it("omits the version when there is none", () => {
    expect(citationLabel(2, { ...source, version: undefined })).toBe(
      "Source 2, 2023 ACC/AHA AF Guideline",
    );
  });

  it("degrades to a plain label when the source is missing", () => {
    expect(citationLabel(3, undefined)).toBe("Source 3");
  });
});

describe("useRegisterLabel", () => {
  it("is null with no answer", () => {
    const { result } = renderHook(() => useRegisterLabel(null));
    expect(result.current).toBeNull();
  });

  it("labels a grounded answer with its source count", () => {
    const { result } = renderHook(() =>
      useRegisterLabel(answer({ register: "grounded", sources: new Map([[1, source]]) })),
    );
    expect(result.current).toEqual({ label: "Grounded", detail: "1 source" });
  });

  it("tells the reader to verify a general answer", () => {
    const { result } = renderHook(() => useRegisterLabel(answer({ register: "general" })));
    expect(result.current?.detail).toMatch(/verify before acting/i);
  });

  it("labels a declined answer", () => {
    const { result } = renderHook(() => useRegisterLabel(answer({ register: "declined" })));
    expect(result.current?.label).toBe("Declined");
  });
});

describe("usePrefersReducedMotion", () => {
  it("reads the media query and responds to changes", () => {
    let listener: ((e: MediaQueryListEvent) => void) | null = null;
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => {
          listener = l;
        },
        removeEventListener: vi.fn(),
      }),
    );

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);

    act(() => listener?.({ matches: false } as MediaQueryListEvent));
    expect(result.current).toBe(false);

    vi.unstubAllGlobals();
  });

  it("defaults to false when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe("useSummonShortcut", () => {
  it("fires on Cmd+K", () => {
    const onSummon = vi.fn();
    renderHook(() => useSummonShortcut({ onSummon }));
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    });
    expect(onSummon).toHaveBeenCalled();
  });

  it("fires on Ctrl+K", () => {
    const onSummon = vi.fn();
    renderHook(() => useSummonShortcut({ onSummon }));
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "K", ctrlKey: true }));
    });
    expect(onSummon).toHaveBeenCalled();
  });

  it("does not fire on the bare key", () => {
    const onSummon = vi.fn();
    renderHook(() => useSummonShortcut({ onSummon }));
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    });
    expect(onSummon).not.toHaveBeenCalled();
  });

  it("does not steal focus from a clinician typing in another field", () => {
    // Interrupting someone mid-sentence in a note is exactly the interruption
    // Law 5 exists to prevent.
    const onSummon = vi.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);
    renderHook(() => useSummonShortcut({ onSummon }));

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
      );
    });
    expect(onSummon).not.toHaveBeenCalled();
    input.remove();
  });

  it("can be disabled", () => {
    const onSummon = vi.fn();
    renderHook(() => useSummonShortcut({ onSummon, enabled: false }));
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    });
    expect(onSummon).not.toHaveBeenCalled();
  });

  it("removes its listener on unmount", () => {
    const onSummon = vi.fn();
    const { unmount } = renderHook(() => useSummonShortcut({ onSummon }));
    unmount();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    });
    expect(onSummon).not.toHaveBeenCalled();
  });
});

describe("useFocusReturn", () => {
  it("returns focus to the opener on close", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();
    expect(document.activeElement).toBe(button);

    const { rerender } = renderHook((props: { open: boolean }) => useFocusReturn(props.open), {
      initialProps: { open: false },
    });

    rerender({ open: true });
    const other = document.createElement("input");
    document.body.appendChild(other);
    other.focus();

    rerender({ open: false });
    expect(document.activeElement).toBe(button);

    button.remove();
    other.remove();
  });

  it("does nothing when the opener has left the document", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    const { rerender } = renderHook((props: { open: boolean }) => useFocusReturn(props.open), {
      initialProps: { open: false },
    });
    rerender({ open: true });
    button.remove();
    expect(() => rerender({ open: false })).not.toThrow();
  });
});

describe("accessibility", () => {
  it("has no axe violations across the primitives together", async () => {
    const { container } = render(
      <ConsultDockRegion>
        <ConsultLiveRegion message="Answer complete. 12 words, 3 sources." />
        <ConsultAnswerRegion busy={false}>
          <p>Rate control is a reasonable first strategy.</p>
        </ConsultAnswerRegion>
        <button type="button">Show sources</button>
      </ConsultDockRegion>,
    );

    const results = await axe.run(container, {
      // jsdom has no canvas, so axe cannot compute contrast ratios here. Colour
      // is the skin's concern and is covered by the Playwright VRT pass; this
      // run is about roles, names and relationships.
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
