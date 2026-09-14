/**
 * The two guarantees this package exists for.
 *
 * 1. A missing translation never renders as a blank or a key-shaped string in
 *    the place a clinician expects a word.
 * 2. Register is a different catalog, not a different tone — and forgetting the
 *    patient wording is a type error, not a review note.
 */

import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import {
  EN,
  IntlProvider,
  format,
  isRtl,
  useMessage,
  useNumberFormat,
  useTerm,
} from "../src/index.js";

const wrapper =
  (props: React.ComponentProps<typeof IntlProvider> = {}) =>
  ({ children }: { children: React.ReactNode }) => (
    <IntlProvider {...props}>{children}</IntlProvider>
  );

describe("message resolution", () => {
  it("returns the English string by default", () => {
    const { result } = renderHook(() => useMessage("loader.label"), { wrapper: wrapper() });
    expect(result.current).toBe("Loading");
  });

  it("prefers the register-specific variant", () => {
    const { result } = renderHook(() => useMessage("loader.label"), {
      wrapper: wrapper({ register: "patient" }),
    });
    expect(result.current).toBe("Loading your information");
  });

  it("falls back to the base key when a register has no variant", () => {
    const { result } = renderHook(() => useMessage("loader.retry"), {
      wrapper: wrapper({ register: "patient" }),
    });
    expect(result.current).toBe("Try again");
  });

  it("lets an application override any message", () => {
    const { result } = renderHook(() => useMessage("loader.label"), {
      wrapper: wrapper({ messages: { "loader.label": "Fetching" } }),
    });
    expect(result.current).toBe("Fetching");
  });

  it("inherits English underneath a partial catalog", () => {
    // A half-translated locale must degrade to English words, never to holes.
    const { result } = renderHook(() => useMessage("loader.retry"), {
      wrapper: wrapper({ locale: "de", messages: { "loader.label": "Wird geladen" } }),
    });
    expect(result.current).toBe("Try again");
  });

  it("prefers a translated general string over the English register variant", () => {
    const { result } = renderHook(() => useMessage("loader.label"), {
      wrapper: wrapper({
        locale: "de",
        register: "patient",
        messages: { "loader.label": "Wird geladen" },
      }),
    });
    expect(result.current).toBe("Wird geladen");
  });

  it("prefers a translated register variant over a translated general string", () => {
    const { result } = renderHook(() => useMessage("loader.label"), {
      wrapper: wrapper({
        locale: "de",
        register: "patient",
        messages: {
          "loader.label": "Wird geladen",
          "loader.label.patient": "Ihre Daten werden geladen",
        },
      }),
    });
    expect(result.current).toBe("Ihre Daten werden geladen");
  });

  it("falls back to the English register variant when the locale has neither", () => {
    const { result } = renderHook(() => useMessage("loader.label"), {
      wrapper: wrapper({ locale: "de", register: "patient", messages: { other: "x" } }),
    });
    expect(result.current).toBe("Loading your information");
  });

  it("never renders blank for an unknown key, and reports it", () => {
    const onMissing = vi.fn();
    const { result } = renderHook(() => useMessage("loader.nonexistent"), {
      wrapper: wrapper({ onMissing }),
    });
    // A blank label on a loading state is indistinguishable from a component
    // that failed to render.
    expect(result.current).toBe("loader.nonexistent");
    expect(result.current.length).toBeGreaterThan(0);
    expect(onMissing).toHaveBeenCalledWith("loader.nonexistent", "en");
  });

  it("accepts an explicit fallback", () => {
    const { result } = renderHook(
      () => useMessage("loader.nonexistent", { fallback: "Please wait" }),
      { wrapper: wrapper() },
    );
    expect(result.current).toBe("Please wait");
  });
});

describe("interpolation", () => {
  it("substitutes named placeholders", () => {
    expect(format("{value} percent", { value: 42 })).toBe("42 percent");
  });

  it("leaves an unmatched placeholder intact rather than blanking it", () => {
    expect(format("{a} and {b}", { a: "one" })).toBe("one and {b}");
  });

  it("inserts values as text, never as markup", () => {
    // A message is not an injection sink.
    expect(format("{v}", { v: "<img src=x onerror=alert(1)>" })).toBe(
      "<img src=x onerror=alert(1)>",
    );
  });

  it("formats progress through the catalog", () => {
    const { result } = renderHook(() => useMessage("loader.progress", { values: { value: 42 } }), {
      wrapper: wrapper(),
    });
    expect(result.current).toBe("42 percent");
  });
});

describe("register", () => {
  it("requires both sides of a term", () => {
    const { result } = renderHook(() => useTerm({ clinician: "K+", patient: "Potassium" }), {
      wrapper: wrapper({ register: "patient" }),
    });
    expect(result.current).toBe("Potassium");
  });

  it("defaults to the clinician register", () => {
    const { result } = renderHook(() => useTerm({ clinician: "K+", patient: "Potassium" }), {
      wrapper: wrapper(),
    });
    expect(result.current).toBe("K+");
  });

  it("changes words, never content — both registers say the same thing", () => {
    // CONTENT.md §7: register changes vocabulary, never facts. Both stall hints
    // must offer the same two options.
    expect(EN["loader.slowHint"]).toMatch(/keep waiting/);
    expect(EN["loader.slowHint.patient"]).toMatch(/keep waiting/);
    expect(EN["loader.slowHint"]).toMatch(/go back/);
    expect(EN["loader.slowHint.patient"]).toMatch(/go back/);
  });

  it("renders through a provider in a tree", () => {
    function Label() {
      return <span>{useMessage("loader.label")}</span>;
    }
    render(
      <IntlProvider register="patient">
        <Label />
      </IntlProvider>,
    );
    expect(screen.getByText("Loading your information")).toBeDefined();
  });
});

describe("locale", () => {
  it("formats numbers for the active locale", () => {
    const { result } = renderHook(() => useNumberFormat(), {
      wrapper: wrapper({ locale: "de-DE" }),
    });
    // A percentage with the wrong decimal separator reads as a different number.
    expect(result.current.format(1234.5)).toBe("1.234,5");
  });

  it.each([
    ["ar", true],
    ["he-IL", true],
    ["fa", true],
    ["en", false],
    ["en-GB", false],
    ["de", false],
    // Hausa is written in Latin script; "ks" is not a language.
    ["ha", false],
    ["ks", false],
    // Kurdish defaults to Latin script; Sorani is Arabic.
    ["ku", false],
    ["ckb", true],
    ["ur-PK", true],
    ["yi", true],
    // A script subtag overrides the language's usual direction.
    ["ha-Arab", true],
    ["pa-Arab-PK", true],
    ["ku-Arab", true],
    ["az-Arab", true],
    ["sd-Latn", false],
    ["ar-Latn", false],
    ["he_IL", true],
    // An extension that happens to be four letters is not a script.
    ["ar-u-nu-latn", true],
    ["en-u-nu-arab", false],
    ["", false],
  ])("detects direction for %s", (locale, rtl) => {
    expect(isRtl(locale)).toBe(rtl);
  });
});

describe("catalog integrity", () => {
  it("has no empty message", () => {
    for (const [key, value] of Object.entries(EN)) {
      expect(value.trim().length, `${key} is empty`).toBeGreaterThan(0);
    }
  });

  it("gives every patient variant a clinician base", () => {
    for (const key of Object.keys(EN)) {
      if (!key.endsWith(".patient")) continue;
      expect(EN[key.replace(/\.patient$/, "")], `${key} has no base key`).toBeDefined();
    }
  });

  it("follows CONTENT.md — no apology, no vagueness in the stall wording", () => {
    for (const key of ["loader.slowHint", "loader.slowHint.patient"]) {
      const value = EN[key] ?? "";
      expect(value).not.toMatch(/sorry|oops|something went wrong/i);
      expect(value.length).toBeGreaterThan(20);
    }
  });
});
