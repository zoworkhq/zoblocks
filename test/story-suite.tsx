/**
 * The per-component half of the story-derived test layer.
 *
 * ADR 0007's premise is that a story is written once and consumed four ways.
 * Three of them live here — render, axe, play — plus the contract that keeps
 * declared states honest in both directions.
 *
 * It exists as a function rather than a file because the registry and the
 * published packages are tested by different Vitest projects. The root config
 * excludes `packages/**` (they run their own suites through turbo), so a story
 * in `packages/tabs/src` would otherwise be a file the coverage report counts
 * and nothing ever executes — which is a worse signal than having no story at
 * all, because the gate reports it as covered.
 */

import { render, cleanup, act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import axe from "axe-core";
import { createElement, type ReactElement } from "react";
import type { Meta, StoryObj } from "@zoblocks/component-meta";

export type StoryModule = { default: Meta } & Record<string, StoryObj | Meta>;

export interface Entry {
  component: string;
  exportName: string;
  story: StoryObj;
  meta: Meta;
}

/** Colour rules need a layout engine jsdom lacks; `pnpm a11y` covers them in a browser. */
const AXE_OPTIONS: axe.RunOptions = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  rules: { "color-contrast": { enabled: false } },
};

/** Flattens a story module into one entry per exported story. */
export function entriesFrom(component: string, mod: StoryModule): Entry[] {
  const out: Entry[] = [];
  for (const [exportName, value] of Object.entries(mod)) {
    if (exportName === "default" || !value || typeof value !== "object") continue;
    out.push({ component, exportName, story: value as StoryObj, meta: mod.default });
  }
  return out;
}

/**
 * Renders and lets any timer the story arms settle inside `act`.
 *
 * Several stories exist precisely to exercise a timer. Rendering them and then
 * awaiting something else lets the state update land outside React's act
 * boundary, which is a warning today and a source of flakiness the moment the
 * suite runs in parallel.
 */
export async function settle(element: ReactElement) {
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(element);
    await new Promise((resolve) => setTimeout(resolve, 8));
  });
  return view;
}

export function renderStory({ story, meta }: Entry): ReactElement {
  const args = { ...(meta.args ?? {}), ...(story.args ?? {}) };
  return story.render ? story.render(args) : createElement(meta.component as never, args as never);
}

export interface StorySuiteOptions {
  /** The component's metadata name — the directory, the slug, the registry item. */
  component: string;
  /** `states` from the component's metadata. */
  states: readonly string[];
  /** `categories` from the component's metadata, which the story title must name. */
  categories: readonly string[];
  entries: Entry[];
}

/**
 * The four contracts, run against one component's stories.
 *
 * Callers own discovery: the registry globs a directory, a package imports its
 * own story file directly. Both then get identical enforcement.
 */
export function describeStories({ component, states, categories, entries }: StorySuiteOptions) {
  afterEach(cleanup);

  describe(`${component} — story coverage`, () => {
    it("has at least one story", () => {
      expect(entries.length, `${component} has no stories`).toBeGreaterThan(0);
    });

    it("demonstrates every state it declares", () => {
      const shown = new Set(entries.map((e) => e.story.parameters?.state));
      expect(
        states.filter((state) => !shown.has(state)),
        `${component} declares states with no story: a state nobody can see is a claim nobody can check`,
      ).toEqual([]);
    });

    it("declares every state it demonstrates", () => {
      const declared = new Set(states);
      const undeclared = entries
        .map((e) => e.story.parameters?.state)
        .filter((state): state is string => Boolean(state) && !declared.has(state as string));
      expect(undeclared, `${component} has stories for states missing from its metadata`).toEqual(
        [],
      );
    });

    it("is titled under a category it declares", () => {
      for (const entry of entries) {
        const category = String(entry.meta.title ?? "").split("/")[0];
        expect(
          categories,
          `${component}: story title "${entry.meta.title}" names a category its metadata does not declare`,
        ).toContain(category);
      }
    });
  });

  describe(`${component} — every story renders`, () => {
    it.each(entries.map((e) => [e.exportName, e] as const))("%s", async (_label, entry) => {
      const view = await settle(renderStory(entry));
      if (entry.story.parameters?.skipVrt) return;
      // A story that renders nothing is either a broken fixture or a state that
      // deliberately shows nothing — and the second must say so.
      const rooted = Array.from(view.container.querySelectorAll<HTMLElement>("*")).some((el) =>
        Array.from(el.attributes).some((attr) => attr.name.startsWith("data-zb-")),
      );
      expect(
        rooted,
        `${component} › ${entry.exportName} rendered no element carrying a data-zb-* root marker`,
      ).toBe(true);
    });
  });

  describe(`${component} — every story is accessible`, () => {
    it("accounts for every skipped audit with a reason", () => {
      for (const entry of entries.filter((e) => e.story.parameters?.skipA11y)) {
        expect(
          entry.story.parameters?.a11yReason,
          `${component} › ${entry.exportName} skips axe without saying why`,
        ).toBeTruthy();
      }
    });

    const auditable = entries.filter((e) => !e.story.parameters?.skipA11y);
    it.each(auditable.map((e) => [e.exportName, e] as const))("%s", async (_label, entry) => {
      const view = await settle(renderStory(entry));
      const results = await axe.run(view.container, AXE_OPTIONS);
      expect(
        results.violations.map(
          (v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes[0]?.html?.slice(0, 140)}`,
        ),
      ).toEqual([]);
    });
  });

  describe(`${component} — every play function passes`, () => {
    const withPlay = entries.filter((e) => typeof e.story.play === "function");

    it("has interaction coverage on more than half of the stories", () => {
      // Not a hard rule, a smell detector: a story set with almost no play
      // functions is a screenshot gallery, not a test layer.
      expect(withPlay.length * 2).toBeGreaterThanOrEqual(entries.length);
    });

    it.each(withPlay.map((e) => [e.exportName, e] as const))("%s", async (_label, entry) => {
      const view = await settle(renderStory(entry));
      // Deliberately NOT wrapped in `act`: a play function that waits for a
      // timer needs the timer to advance while it polls, and an enclosing act
      // blocks exactly that.
      await entry.story.play?.({ canvasElement: view.container });
    });
  });
}
