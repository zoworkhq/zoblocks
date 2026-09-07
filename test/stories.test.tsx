/**
 * The story-derived test layer.
 *
 * ADR 0007's premise is that a story is written once and consumed four ways.
 * This is three of those four: every story is rendered, audited with axe, and
 * has its play function executed. The fourth — visual regression — consumes the
 * same files from Playwright.
 *
 * It also enforces the contract that makes declared states honest: every state
 * in a component's `*.meta.ts` must have a story demonstrating it, and every
 * story state must be declared. A component that lists "Slow wait" and never
 * shows one is documentation nobody should trust — and that check has already
 * paid for itself, catching a loader that declared a brand-mark slot it could
 * not actually render.
 */

import { render, cleanup, act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import axe from "axe-core";
import { createElement, type ReactElement } from "react";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Meta, StoryObj } from "@zoblocks/component-meta";

/**
 * The one Vite API this file uses, declared locally.
 *
 * `/// <reference types="vite/client" />` would do it, but vite is a transitive
 * dependency of vitest and does not resolve from the root tsconfig — which
 * typechecks this file as well. Declaring the single signature we call keeps
 * both configs happy without adding a dependency for a type.
 */
declare global {
  interface ImportMeta {
    glob(pattern: string, options?: { eager?: boolean }): Record<string, unknown>;
  }
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPONENTS_DIR = path.join(ROOT, "registry", "zoblocks");

/** Colour rules need a layout engine jsdom lacks; `pnpm a11y` covers them in a browser. */
const AXE_OPTIONS: axe.RunOptions = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  rules: { "color-contrast": { enabled: false } },
};

type StoryModule = { default: Meta } & Record<string, StoryObj | Meta>;

const componentNames = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== "lib")
  .map((e) => e.name)
  .sort();

/**
 * Every story and metadata file, eagerly imported so the suite is static.
 *
 * Cast rather than typed through the generic: `import.meta.glob`'s overloads
 * resolve differently depending on whether Vite's client types are in scope,
 * and this file is typechecked by the root tsconfig as well as by Vitest.
 */
const storyModules = import.meta.glob("../registry/zoblocks/*/*.stories.tsx", {
  eager: true,
}) as Record<string, StoryModule>;

const metaModules = import.meta.glob("../registry/zoblocks/*/*.meta.ts", {
  eager: true,
}) as Record<string, { default: { name: string; states: string[]; categories: string[] } }>;

function nameFromPath(filePath: string): string {
  return path.basename(path.dirname(filePath));
}

interface Entry {
  component: string;
  exportName: string;
  story: StoryObj;
  meta: Meta;
}

const entries: Entry[] = [];
for (const [filePath, mod] of Object.entries(storyModules)) {
  const component = nameFromPath(filePath);
  const fileMeta = mod.default;
  for (const [exportName, value] of Object.entries(mod)) {
    if (exportName === "default" || !value || typeof value !== "object") continue;
    entries.push({ component, exportName, story: value as StoryObj, meta: fileMeta });
  }
}

const declaredStates = new Map<string, string[]>();
const declaredCategories = new Map<string, string[]>();
for (const [filePath, mod] of Object.entries(metaModules)) {
  declaredStates.set(nameFromPath(filePath), mod.default.states);
  declaredCategories.set(nameFromPath(filePath), mod.default.categories);
}

/**
 * Renders and lets any timer the story arms settle inside `act`.
 *
 * Several stories exist precisely to exercise a timer — the stall hint, the
 * delay. Rendering them and then awaiting something else lets the state update
 * land outside React's act boundary, which is a warning today and a source of
 * flakiness the moment the suite runs in parallel.
 */
async function settle(element: ReactElement) {
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(element);
    // A real tick, not a microtask: stories that arm a short timer (the stall
    // hint fires at 1ms) settle inside this boundary rather than during a later
    // await, where the state update would land outside act.
    await new Promise((resolve) => setTimeout(resolve, 8));
  });
  return view;
}

function renderStory({ story, meta }: Entry): ReactElement {
  const args = { ...(meta.args ?? {}), ...(story.args ?? {}) };
  return story.render ? story.render(args) : createElement(meta.component as never, args as never);
}

afterEach(cleanup);

/* ------------------------------------------------------------------ */

describe("story coverage", () => {
  it("finds a story file for every component", () => {
    const withStories = new Set(entries.map((e) => e.component));
    expect([...withStories].sort()).toEqual(componentNames);
  });

  it("finds at least one story per component", () => {
    for (const name of componentNames) {
      expect(entries.filter((e) => e.component === name).length, name).toBeGreaterThan(0);
    }
  });

  it.each(componentNames)("%s demonstrates every state it declares", (name) => {
    const declared = declaredStates.get(name) ?? [];
    const shown = new Set(
      entries.filter((e) => e.component === name).map((e) => e.story.parameters?.state),
    );

    const undemonstrated = declared.filter((state) => !shown.has(state));
    expect(
      undemonstrated,
      `${name} declares states with no story: a state nobody can see is a claim nobody can check`,
    ).toEqual([]);
  });

  it.each(componentNames)("%s declares every state it demonstrates", (name) => {
    const declared = new Set(declaredStates.get(name) ?? []);
    const undeclared = entries
      .filter((e) => e.component === name)
      .map((e) => e.story.parameters?.state)
      .filter((state): state is string => Boolean(state) && !declared.has(state as string));

    expect(undeclared, `${name} has stories for states missing from its meta.ts`).toEqual([]);
  });

  it("titles every story file under a category the component declares", () => {
    for (const entry of entries) {
      const category = String(entry.meta.title ?? "").split("/")[0];
      expect(
        declaredCategories.get(entry.component) ?? [],
        `${entry.component}: story title "${entry.meta.title}" names a category its meta.ts does not declare`,
      ).toContain(category);
    }
  });
});

/* ------------------------------------------------------------------ */

describe("every story renders", () => {
  it.each(entries.map((e) => [`${e.component} › ${e.exportName}`, e] as const))(
    "%s",
    async (_label, entry) => {
      const view = await settle(renderStory(entry));
      // A story that renders nothing is either a broken fixture or a state that
      // deliberately shows nothing — and the second must say so.
      if (entry.story.parameters?.skipVrt) return;
      const rooted = Array.from(view.container.querySelectorAll<HTMLElement>("*")).some((el) =>
        Array.from(el.attributes).some((attr) => attr.name.startsWith("data-zb-")),
      );
      expect(
        rooted,
        `${entry.component} › ${entry.exportName} rendered no element carrying a data-zb-* root marker`,
      ).toBe(true);
    },
  );
});

describe("every story is accessible", () => {
  const auditable = entries.filter((e) => !e.story.parameters?.skipA11y);

  it("accounts for every skipped audit with a reason", () => {
    for (const entry of entries.filter((e) => e.story.parameters?.skipA11y)) {
      expect(
        entry.story.parameters?.a11yReason,
        `${entry.component} › ${entry.exportName} skips axe without saying why`,
      ).toBeTruthy();
    }
  });

  it.each(auditable.map((e) => [`${e.component} › ${e.exportName}`, e] as const))(
    "%s",
    async (_label, entry) => {
      const view = await settle(renderStory(entry));
      const results = await axe.run(view.container, AXE_OPTIONS);
      const violations = results.violations.map(
        (v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes[0]?.html?.slice(0, 140)}`,
      );
      expect(violations).toEqual([]);
    },
  );
});

describe("every play function passes", () => {
  const withPlay = entries.filter((e) => typeof e.story.play === "function");

  it("has interaction coverage on more than half of the stories", () => {
    // Not a hard rule, a smell detector: a story set with almost no play
    // functions is a screenshot gallery, not a test layer.
    expect(withPlay.length * 2).toBeGreaterThanOrEqual(entries.length);
  });

  it.each(withPlay.map((e) => [`${e.component} › ${e.exportName}`, e] as const))(
    "%s",
    async (_label, entry) => {
      const view = await settle(renderStory(entry));
      // Deliberately NOT wrapped in `act`: a play function that waits for a
      // timer (the stall hint) needs the timer to advance while it polls, and
      // an enclosing act blocks exactly that. Testing Library's own findBy*
      // queries manage their act boundary internally.
      await entry.story.play?.({ canvasElement: view.container });
    },
  );
});
