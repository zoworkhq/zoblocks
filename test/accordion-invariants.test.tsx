/**
 * The invariants that span more than one component, plus what the two
 * distribution channels are obliged to contain.
 *
 * These are the checks that would not fail in any single component's own test
 * file, because each of them is about a relationship: between the registry and
 * the npm package, between a component and the stylesheet it needs, between
 * what the print path does and what the reader is allowed to have.
 */

import { render, cleanup, act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Accordion } from "../registry/oxygen/accordion/accordion";
import type { AccordionItem } from "../registry/oxygen/lib/accordion-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");
const json = (p: string) => JSON.parse(read(p));

afterEach(cleanup);

/* ------------------------------------------------------------------ */
/* Print                                                               */
/* ------------------------------------------------------------------ */

describe("printing", () => {
  const items: AccordionItem[] = [
    { key: "a", label: "Assessments", children: <p>PHQ-9 21</p> },
    { key: "b", label: "Medications", children: <p>Clozapine 300 mg</p> },
    { key: "w", label: "Psychotherapy notes", access: { kind: "withheld", reason: "Author only" } },
  ];

  const panels = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>(".ox-accordion__panel")];

  it("unhides permitted sections before the dialog opens", async () => {
    // content-visibility: hidden cannot be undone from a print stylesheet for a
    // subtree the UA has already skipped, so the attribute has to come off in
    // JavaScript. A printed record that is a table of contents is not a record.
    const view = render(<Accordion items={items} />);
    expect(panels(view.container).every((p) => p.hasAttribute("hidden"))).toBe(true);

    await act(async () => {
      window.dispatchEvent(new Event("beforeprint"));
    });

    const [a, b, w] = panels(view.container);
    expect(a?.hasAttribute("hidden")).toBe(false);
    expect(b?.hasAttribute("hidden")).toBe(false);
    // Never the withheld one. There is nothing behind it, and printing an empty
    // section would suggest otherwise.
    expect(w?.hasAttribute("hidden")).toBe(true);
  });

  it("puts them back afterwards", async () => {
    const view = render(<Accordion items={items} />);
    await act(async () => {
      window.dispatchEvent(new Event("beforeprint"));
      window.dispatchEvent(new Event("afterprint"));
    });
    for (const panel of panels(view.container)) {
      expect(panel.getAttribute("hidden")).toBe("until-found");
    }
  });

  it("leaves everything closed when printExpanded is off", async () => {
    const view = render(<Accordion items={items} printExpanded={false} />);
    await act(async () => {
      window.dispatchEvent(new Event("beforeprint"));
    });
    expect(panels(view.container).every((p) => p.hasAttribute("hidden"))).toBe(true);
  });

  it("never reveals gated content on the print path", async () => {
    // The print handler works on attributes, not on the disclosure state, so
    // this is the check that it cannot become a way around the gate.
    const view = render(
      <Accordion
        items={[
          {
            key: "g",
            label: "Substance use",
            access: { kind: "consent", policy: "42 CFR Part 2", state: "granted" },
            children: <p>SECRET</p>,
          },
        ]}
        defaultActiveKey={["g"]}
      />,
    );
    await act(async () => {
      window.dispatchEvent(new Event("beforeprint"));
    });
    expect(view.container.innerHTML).not.toContain("SECRET");
  });
});

/* ------------------------------------------------------------------ */
/* What the registry channel ships                                     */
/* ------------------------------------------------------------------ */

describe("the registry item", () => {
  const core = json("apps/docs/public/r/accordion-core.json");
  const accordion = json("apps/docs/public/r/accordion.json");
  const chart = json("apps/docs/public/r/chart-accordion.json");
  const plan = json("apps/docs/public/r/safety-plan.json");

  it("ships the hook and the stylesheet together", () => {
    // A component installed without its CSS renders unstyled, which for this
    // one means every panel is permanently visible — the CSS is what asserts
    // the hiding that `display: grid` overrode.
    const targets = core.files.map((f: { target: string }) => f.target);
    expect(targets).toContain("lib/oxygen-accordion.tsx");
    expect(targets).toContain("styles/oxygen-accordion.css");
  });

  it("carries the real source, not a placeholder", () => {
    for (const file of core.files) {
      expect(file.content.length, file.target).toBeGreaterThan(500);
    }
    expect(core.files[0].content).toContain("useAccordion");
  });

  it("makes every component pull the core in", () => {
    for (const [name, item] of [
      ["accordion", accordion],
      ["chart-accordion", chart],
      ["safety-plan", plan],
    ] as const) {
      expect(
        item.registryDependencies.some((d: string) => d.endsWith("/accordion-core.json")),
        `${name} does not install accordion-core`,
      ).toBe(true);
    }
  });

  it("makes the compositions pull the primitive in", () => {
    for (const item of [chart, plan]) {
      expect(item.registryDependencies.some((d: string) => d.endsWith("/accordion.json"))).toBe(
        true,
      );
    }
  });

  it("declares only the dependencies the source actually imports", () => {
    // The core is deliberately dependency-free: it has no `cn`, no clsx, and no
    // tailwind-merge, because behaviour should not drag styling in.
    expect(core.dependencies ?? []).toEqual([]);
    expect(accordion.dependencies).toEqual(["clsx", "tailwind-merge"]);
  });

  it("stays out of the public catalog's Pro surface", () => {
    for (const item of [core, accordion, chart, plan]) {
      expect(JSON.stringify(item)).not.toContain('"tier":"pro"');
    }
  });
});

/* ------------------------------------------------------------------ */
/* What the npm channel ships                                          */
/* ------------------------------------------------------------------ */

describe("the npm package", () => {
  it("generates the accordion source from the registry, not by hand", () => {
    const generated = read("packages/react/src/components/accordion/accordion.tsx");
    expect(generated).toContain("GENERATED FILE — DO NOT EDIT");
    expect(generated).toContain("registry/oxygen/accordion/accordion.tsx");
  });

  it("keeps the client directive first, ahead of the banner", () => {
    // A directive that a bundler silently ignores turns a client component into
    // a server one, and it fails at the first useState — far from the cause.
    const generated = read("packages/react/src/components/accordion/accordion.tsx");
    expect(generated.startsWith('"use client"')).toBe(true);
  });

  it("rewrites consumer specifiers to package-relative ones", () => {
    const generated = read("packages/react/src/components/accordion/accordion.tsx");
    expect(generated).not.toContain("@/lib/oxygen-accordion");
    expect(generated).toContain('"../../lib/accordion-core"');
  });

  it("keeps the registry and the package byte-identical below the header", () => {
    // Two hand-written trees drift. The parity check is what makes "generated"
    // mean something.
    const source = read("registry/oxygen/accordion/accordion.tsx");
    const generated = read("packages/react/src/components/accordion/accordion.tsx");

    const normalise = (text: string) =>
      text
        .replace(/^"use client";\s*/, "")
        .replace(/\/\/ GENERATED FILE[\s\S]*?not this one\.\n/, "")
        .replace(/@\/lib\/oxygen-accordion/g, "../../lib/accordion-core")
        .replace(/@\/lib\/utils/g, "../../lib/utils")
        .replace(/@\/components\/oxygen\/([a-z0-9-]+)/g, "../../components/$1/$1")
        .trim();

    expect(normalise(generated)).toBe(normalise(source));
  });

  it("ships the stylesheet in both a combined bundle and a per-concern file", () => {
    // An application that installs only loaders should not ship accordion CSS
    // it never renders.
    expect(existsSync(path.join(ROOT, "packages/react/src/styles/accordion.css"))).toBe(true);
    expect(existsSync(path.join(ROOT, "packages/react/src/styles/loader.css"))).toBe(true);

    const bundle = read("packages/react/src/styles.css");
    expect(bundle).toContain(".ox-accordion__panel");
    expect(bundle).toContain(".ox-loader");
  });

  it("exports the behaviour layer from the barrel", () => {
    const barrel = read("packages/react/src/index.ts");
    expect(barrel).toContain('export * from "./lib/accordion-core";');
    expect(barrel).toContain('export * from "./components/accordion/accordion";');
  });
});

/* ------------------------------------------------------------------ */
/* Stylesheet obligations                                              */
/* ------------------------------------------------------------------ */

describe("the stylesheet", () => {
  const css = read("registry/oxygen/lib/accordion.css");
  /**
   * Declarations only.
   *
   * The comments in this file name the techniques they exist to rule out, so
   * asserting against the raw text checks the prose rather than the CSS.
   */
  const declarations = css.replace(/\/\*[\s\S]*?\*\//g, "");

  it("re-asserts hiding for [hidden], because display:grid overrides the UA rule", () => {
    // Without this the panel is visible in every browser without
    // hidden=until-found support — the single highest-consequence line in the
    // file.
    expect(css).toMatch(/\.ox-accordion__panel\[hidden\]\s*\{[^}]*content-visibility:\s*hidden/);
  });

  it("animates without measuring anything", () => {
    expect(declarations).toContain("grid-template-rows: 0fr");
    expect(declarations).toContain("grid-template-rows: 1fr");
    expect(declarations).not.toContain("scrollHeight");
    expect(declarations).not.toContain("ResizeObserver");
  });

  it("references no primitive palette token", () => {
    // A component that reaches past the semantic tier silently ignores a brand
    // override, and on a severity rail that means rendering someone else's
    // critical colour.
    expect(declarations).not.toMatch(/--ox-ref-/);
  });

  it("uses logical properties throughout", () => {
    // Physical properties do not flip in right-to-left locales, and the bug is
    // invisible until someone opens the interface in Arabic.
    for (const physical of [
      /padding-left:/,
      /padding-right:/,
      /margin-left:/,
      /margin-right:/,
      /border-left:/,
      /border-right:/,
      /\bwidth:\s*100%/,
    ]) {
      expect(declarations, `${physical} is physical`).not.toMatch(physical);
    }
  });

  it("keeps the target above the WCAG 2.2 floor whatever the density", () => {
    expect(css).toContain("max(var(--ox-accordion-target), var(--ox-density-target-floor))");
  });

  it("designs the reduced-motion and forced-colors states rather than ignoring them", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (forced-colors: active)");
    expect(css).toContain("@media print");
  });
});

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

describe("tokens", () => {
  const emitted = read("packages/tokens/src/oxygen-tokens.css");

  it("emits a rail for every severity plus restricted", () => {
    for (const key of ["critical", "high", "low", "normal", "unknown", "restricted"]) {
      expect(emitted, key).toContain(`--ox-accordion-rail-${key}:`);
    }
  });

  it("routes severity rails through the status scale, and restricted through flags", () => {
    // Restricted describes the record's legal standing, not a measurement. The
    // same distinction PatientBanner already makes.
    expect(emitted).toContain("--ox-accordion-rail-critical: var(--ox-status-critical)");
    expect(emitted).toContain("--ox-accordion-rail-restricted: var(--ox-flag-restricted)");
  });

  it("gives every density profile a duration", () => {
    const profiles = ["patient", "standard", "clinical"];
    for (const profile of profiles) {
      const block = emitted.split(`[data-ox-density="${profile}"]`)[1]?.split("}")[0] ?? "";
      expect(block, profile).toContain("--ox-density-duration");
    }
  });

  it("makes the accordion read its duration from density", () => {
    // Motion belongs to density for the same reason spacing does: the same
    // component serves a nurse scanning ninety rows and a patient reading one.
    expect(emitted).toContain("--ox-accordion-duration: var(--ox-density-duration)");
  });
});
