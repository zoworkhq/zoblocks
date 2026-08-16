/**
 * Accessibility, checked by axe rather than asserted by hand.
 *
 * The docs site already runs axe against whole pages in CI. This runs it
 * against each loader in each of its states, which is the level the ADR calls
 * for and the level that catches a regression in one variant rather than one
 * page.
 *
 * jsdom has no layout engine, so colour-contrast cannot be evaluated here — it
 * is checked in the browser by `pnpm a11y`, and the token build checks the
 * palette itself. Everything structural is checked here: roles, names,
 * live-region semantics, and the ARIA value set on a progressbar.
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import type { ReactElement } from "react";

import { PageLoader, PulseLoader } from "../registry/oxygen/pulse-loader/pulse-loader";
import { RhythmLoader } from "../registry/oxygen/rhythm-loader/rhythm-loader";
import { BreathLoader } from "../registry/oxygen/breath-loader/breath-loader";
import { HelixLoader } from "../registry/oxygen/helix-loader/helix-loader";
import { InfusionLoader } from "../registry/oxygen/infusion-loader/infusion-loader";

/**
 * Colour rules need a layout engine jsdom does not have; running them here
 * produces "incomplete" results rather than useful ones. Everything else in
 * the WCAG 2.2 A/AA rule set stays on.
 */
const AXE_OPTIONS: axe.RunOptions = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  rules: { "color-contrast": { enabled: false } },
};

async function expectNoViolations(element: ReactElement): Promise<void> {
  const view = render(element);
  const results = await axe.run(view.container, AXE_OPTIONS);

  const summary = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n    ${violation.nodes[0]?.html?.slice(0, 160)}`,
  );

  expect(summary, `axe found ${results.violations.length} violation(s)`).toEqual([]);
  view.unmount();
}

const LOADERS = [
  ["PulseLoader", PulseLoader],
  ["RhythmLoader", RhythmLoader],
  ["BreathLoader", BreathLoader],
  ["HelixLoader", HelixLoader],
  ["InfusionLoader", InfusionLoader],
] as const;

describe("axe — every loader, every state", () => {
  it.each(LOADERS)("%s: inline, label hidden", async (_name, Loader) => {
    await expectNoViolations(<Loader label="Loading results" />);
  });

  it.each(LOADERS)("%s: inline, label shown", async (_name, Loader) => {
    await expectNoViolations(<Loader label="Loading results" showLabel />);
  });

  it.each(LOADERS)("%s: overlay with a hint", async (_name, Loader) => {
    await expectNoViolations(
      <Loader mode="overlay" label="Loading results" hint="This can take a few seconds." />,
    );
  });

  it.each(LOADERS)("%s: page mode", async (_name, Loader) => {
    await expectNoViolations(<Loader mode="page" label="Loading your records" />);
  });

  it.each(LOADERS)("%s: reduced motion", async (_name, Loader) => {
    await expectNoViolations(<Loader motion="reduced" label="Loading results" showLabel />);
  });

  it.each(LOADERS)("%s: assertive announcement", async (_name, Loader) => {
    await expectNoViolations(<Loader announce="assertive" label="Loading results" />);
  });

  it.each(LOADERS)("%s: with an action for someone who has waited", async (_name, Loader) => {
    await expectNoViolations(
      <Loader label="Loading results" showLabel actions={<button type="button">Go back</button>} />,
    );
  });

  it("PageLoader preset", async () => {
    await expectNoViolations(<PageLoader label="Loading your records" />);
  });

  it("InfusionLoader: determinate progressbar", async () => {
    await expectNoViolations(<InfusionLoader progress={42} label="Importing records" showLabel />);
  });

  it("InfusionLoader: determinate at both ends of the range", async () => {
    await expectNoViolations(<InfusionLoader progress={0} label="Importing records" />);
    await expectNoViolations(<InfusionLoader progress={100} label="Importing records" />);
  });

  it("several loaders on one page", async () => {
    // Duplicate ids are the classic failure when a component generates its own
    // label id and more than one instance is mounted.
    await expectNoViolations(
      <div>
        <PulseLoader label="Loading results" showLabel />
        <RhythmLoader label="Loading medications" showLabel />
        <InfusionLoader progress={30} label="Importing records" showLabel />
      </div>,
    );
  });
});

describe("names and roles, stated explicitly", () => {
  it("gives each mounted loader a unique label id", () => {
    const view = render(
      <div>
        <InfusionLoader progress={10} label="First" />
        <InfusionLoader progress={20} label="Second" />
      </div>,
    );
    const ids = [...view.container.querySelectorAll("[aria-labelledby]")].map((element) =>
      element.getAttribute("aria-labelledby"),
    );
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("resolves a determinate loader's name to the visible label", () => {
    const view = render(<InfusionLoader progress={42} label="Importing records" showLabel />);
    const bar = view.container.querySelector("[role='progressbar']");
    const labelId = bar?.getAttribute("aria-labelledby") ?? "";
    expect(view.container.querySelector(`#${CSS.escape(labelId)}`)?.textContent).toBe(
      "Importing records",
    );
  });

  it("never leaves an interactive element unnamed", () => {
    const view = render(
      <PulseLoader label="Loading" showLabel actions={<button type="button">Retry</button>} />,
    );
    for (const element of view.container.querySelectorAll("button, a[href]")) {
      expect((element.textContent ?? "").trim().length).toBeGreaterThan(0);
    }
  });
});
