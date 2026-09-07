/**
 * Every knob combination the playground can produce, rendered.
 *
 * The playground is the only place in this repository that assembles props
 * nobody wrote by hand, and it is driven by metadata rather than by a author
 * who tried each setting. That combination shipped two crashes: `methods`
 * received the string `"draw"` for a prop the component maps over, and
 * `as="nav"` received items shaped for a view switch, so Tabs threw the whole
 * documentation page away — the props table, the examples and the
 * accessibility notes all gone because a reader moved one select.
 *
 * Neither was reachable by any existing suite. The unit tests render the
 * components with props a person chose; the story suite renders the states a
 * person declared. Nothing rendered the cartesian product, which is exactly
 * what a reader clicking through a playground produces.
 *
 * So this walks it. Every single-knob setting, and then every pair, because
 * both shipped bugs were interactions rather than individual values.
 */

import * as React from "react";
import { describe, expect, it, afterEach, beforeAll, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { CATALOG } from "@/lib/generated/catalog";
import { Playground } from "@/components/site/playground";
import { PLAYGROUND_COMPONENTS } from "@/components/site/playground-registry";
import type { Control } from "@zoblocks/component-meta";

/**
 * The invariant is not "nothing throws".
 *
 * Some combinations are genuinely illegal and Tabs is right to refuse them:
 * `overflow="wrap"` outside a radiogroup has no correct arrow-key behaviour,
 * because once a strip wraps, "the next tab" stops being a direction. A
 * playground that hid those would be documenting a smaller component than the
 * one that ships.
 *
 * What must never happen is the refusal taking the page with it. So every
 * combination has to leave the reader with one of two things: the component,
 * or an explanation of why not. A blank panel is the failure.
 */
let caught: string[] = [];

beforeAll(() => {
  // React logs the caught error through console.error before the boundary
  // sees it. That is the signal a component refused its props.
  const original = console.error;
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const text = args.map(String).join(" ");
    if (/configuration problem|is not a function|Cannot read|Minified React/.test(text)) {
      caught.push(text.slice(0, 300));
    }
    // antd's dev-only advisories are noise here, not failures.
    if (!/antd:|useForm|findDOMNode/.test(text)) original(...args);
  });
});

afterEach(() => {
  cleanup();
  caught = [];
});

const components = CATALOG.filter((c) => PLAYGROUND_COMPONENTS.has(c.name));

/** Every value a knob can be set to, including "left alone". */
function settings(control: Control): unknown[] {
  if (control.control === "switch") return [undefined, true, false];
  if (control.control === "slider") return [undefined, control.min ?? 0, control.max ?? 100];
  if (control.control === "text") return [undefined, "A short attestation."];
  if (control.options?.length) return [undefined, ...control.options];
  return [undefined];
}

/** What the reader is left looking at. */
function outcome(container: HTMLElement): "component" | "explained" | "blank" {
  if (container.querySelector("[data-zb-tab], [data-zb-signature], [role='radiogroup'], nav")) {
    return "component";
  }
  const status = container.querySelector("[role='status']");
  // An explanation has to actually explain. An empty status node is a blank
  // panel wearing a role.
  if (status && (status.textContent ?? "").trim().length > 40) return "explained";
  return "blank";
}

async function renderWith(
  name: string,
  controls: readonly Control[],
  applied: Record<string, unknown>,
) {
  // The playground owns its own state, so a combination is applied by seeding
  // each control's defaultValue rather than by driving the widgets — the same
  // props object the knobs would have built.
  const seeded = controls.map((control) =>
    control.prop in applied ? { ...control, defaultValue: applied[control.prop] } : control,
  );
  // `render` already establishes an act boundary. Wrapping it in another one
  // produced overlapping act() calls, and the leak showed up as a *later*
  // test rendering into a half-torn-down tree — which read as a playground
  // bug rather than a harness one.
  const view = render(<Playground name={name} controls={seeded} />);
  await act(async () => {
    // A real tick: the indicator measures on a frame, and the overflow fitter
    // batches through one.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return outcome(view.container);
}

describe.each(components.map((c) => [c.name, c] as const))("%s playground", (name, component) => {
  const controls = (component.controls ?? []).filter((c) => c.control !== "event");

  it("has knobs to exercise", () => {
    expect(controls.length).toBeGreaterThan(0);
  });

  it("renders the component with nothing set", async () => {
    // The untouched playground is what most readers see, so it is the one
    // state that has to be the component itself rather than an explanation.
    expect(await renderWith(name, controls, {})).toBe("component");
    expect(caught).toEqual([]);
  });

  /* --- every single setting ---------------------------------------- */

  const singles = controls.flatMap((control) =>
    settings(control)
      .filter((value) => value !== undefined)
      .map((value) => [`${control.prop}=${String(value)}`, control.prop, value] as const),
  );

  it.each(singles)("survives %s", async (label, prop, value) => {
    const result = await renderWith(name, controls, { [prop]: value });
    expect(result, `${name} left a blank panel with ${label}`).not.toBe("blank");
  });

  /* --- every pair --------------------------------------------------- */

  const pairs: Array<readonly [string, Record<string, unknown>]> = [];
  for (let i = 0; i < controls.length; i += 1) {
    for (let j = i + 1; j < controls.length; j += 1) {
      const a = controls[i]!;
      const b = controls[j]!;
      for (const va of settings(a)) {
        for (const vb of settings(b)) {
          if (va === undefined && vb === undefined) continue;
          const applied: Record<string, unknown> = {};
          if (va !== undefined) applied[a.prop] = va;
          if (vb !== undefined) applied[b.prop] = vb;
          pairs.push([
            Object.entries(applied)
              .map(([k, v]) => `${k}=${String(v)}`)
              .join(" "),
            applied,
          ]);
        }
      }
    }
  }

  it("has a pair space worth walking", () => {
    expect(pairs.length).toBeGreaterThan(20);
  });

  // Tallied by the walk below rather than re-rendered: the majority check
  // needs the same ~400 renders, and doing them twice put the suite over its
  // timeout for no extra coverage.
  const tally = { component: 0, explained: 0, blank: 0 };

  it.each(pairs)("survives %s", async (label, applied) => {
    const result = await renderWith(name, controls, applied);
    tally[result] += 1;
    expect(result, `${name} left a blank panel with ${label}`).not.toBe("blank");
  });

  /*
   * The refusals are supposed to be rare.
   *
   * The boundary is a safety net, not a design. If most of the pair space
   * lands on an explanation, the knobs are offering a component the reader
   * cannot actually assemble, and the fix is the renderer rather than a
   * bigger net.
   */
  it("shows the component for the overwhelming majority of the pair space", () => {
    const walked = tally.component + tally.explained + tally.blank;
    expect(walked, "the pair walk did not run before this check").toBe(pairs.length);
    expect(
      tally.component / walked,
      `${name}: only ${tally.component}/${walked} pairs render the component (${tally.explained} explained)`,
    ).toBeGreaterThan(0.9);
  });
});
