/**
 * Server rendering, and the leak it is the only place to catch.
 *
 * A gate implemented in an effect is not a gate. If the content is present in
 * the server-rendered HTML and merely hidden by JavaScript afterwards, then it
 * has already been sent to the browser, it is in the page source, it is in the
 * CDN cache, and it is in the reader's view-source — for a section the reader
 * was supposed to need a consent to see.
 *
 * Client-side tests cannot detect that: by the time they observe the DOM, the
 * effects have run. Only a server render shows what actually went over the
 * wire, which is why this file exists separately from the component's own tests.
 *
 * It also pins the other half of the `hidden` design. React serialises
 * `hidden="until-found"` as `hidden=""`, so the component renders the boolean
 * and upgrades the attribute after commit. The server output must therefore be
 * *hidden* — just not yet findable — because a panel that only became hidden
 * after hydration would flash an entire expanded record on first paint.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Accordion } from "../registry/zoblocks/accordion/accordion";
import { ChartAccordion } from "../registry/zoblocks/chart-accordion/chart-accordion";
import { SafetyPlan } from "../registry/zoblocks/safety-plan/safety-plan";
import type { AccordionItem } from "../registry/zoblocks/lib/accordion-core";

const SECRET = "INTENSIVE_OUTPATIENT_PROGRAMME";

const GOVERNED: AccordionItem[] = [
  { key: "open", label: "Progress notes", children: <p>BIRP format.</p> },
  {
    key: "advisory",
    label: "Session summary",
    access: { kind: "advisory", notice: "Talks about self-harm" },
    children: <p>{SECRET}</p>,
  },
  {
    key: "reason",
    label: "External records",
    access: { kind: "reason", reasons: [{ code: "emergency", label: "Emergency" }] },
    children: <p>{SECRET}</p>,
  },
  {
    key: "consent",
    label: "Substance use treatment",
    access: { kind: "consent", policy: "42 CFR Part 2", state: "granted" },
    children: <p>{SECRET}</p>,
  },
  {
    key: "withheld",
    label: "Psychotherapy notes",
    access: { kind: "withheld", reason: "Kept separately by the author" },
  },
];

describe("server rendering", () => {
  it("renders without touching the DOM", () => {
    // No window, no document, no layout effect in the critical path.
    expect(() => renderToString(<Accordion items={GOVERNED} />)).not.toThrow();
  });

  it("never puts gated content on the wire", () => {
    // The assertion this file exists for.
    const html = renderToString(
      <Accordion
        items={GOVERNED}
        defaultActiveKey={["advisory", "reason", "consent", "withheld"]}
      />,
    );
    expect(html).not.toContain(SECRET);
  });

  it("never puts gated content on the wire through ChartAccordion either", () => {
    const html = renderToString(
      <ChartAccordion
        sections={[
          {
            key: "sud",
            label: "Substance use treatment",
            severity: "unknown",
            status: "42 CFR Part 2",
            access: { kind: "consent", policy: "42 CFR Part 2", state: "granted" },
            children: <p>{SECRET}</p>,
          },
        ]}
        defaultOpenKeys={["sud"]}
      />,
    );
    expect(html).not.toContain(SECRET);
  });

  it("still says a withheld section exists, and why", () => {
    // Silence would claim the record is complete.
    const html = renderToString(<Accordion items={GOVERNED} />);
    expect(html).toContain("Psychotherapy notes");
    expect(html).toContain("Restricted — not shown");
    expect(html).toContain("Kept separately by the author");
  });

  it("hides closed panels in the server output", () => {
    // Not yet findable — that is the post-commit upgrade — but hidden, so the
    // first paint is not an expanded record.
    const html = renderToString(<Accordion items={GOVERNED} />);
    const panels = html.match(/class="zb-accordion__panel"/g) ?? [];
    const hidden = html.match(/hidden=""/g) ?? [];
    expect(panels.length).toBe(GOVERNED.length);
    expect(hidden.length).toBe(GOVERNED.length);
  });

  it("leaves an open panel unhidden", () => {
    const html = renderToString(<Accordion items={GOVERNED} defaultActiveKey={["open"]} />);
    expect((html.match(/hidden=""/g) ?? []).length).toBe(GOVERNED.length - 1);
    expect(html).toContain("BIRP format");
  });

  it("emits the heading level it was given, on the server", () => {
    const html = renderToString(<Accordion items={GOVERNED} headingLevel={2} />);
    expect(html).toContain("<h2");
    expect(html).not.toContain("<h3");
  });

  it("emits no tab pattern, on the server", () => {
    const html = renderToString(<Accordion items={GOVERNED} accordion />);
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('role="tab"');
    expect(html).not.toContain('role="tabpanel"');
  });

  it("wires aria-controls to an id that exists in the same output", () => {
    const html = renderToString(<Accordion items={GOVERNED} />);
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
    expect(controls.length).toBe(GOVERNED.length);
    for (const id of controls) {
      expect(html, `aria-controls="${id}" points at nothing`).toContain(`id="${id}"`);
    }
  });

  it("renders a safety plan with its crisis step already open", () => {
    // The one section that must be reachable without JavaScript running at all.
    const html = renderToString(
      <SafetyPlan
        steps={{
          professionals: {
            contacts: [
              { name: "988", detail: "Suicide & Crisis Lifeline", availability: "24 hours" },
            ],
          },
        }}
      />,
    );
    expect(html).toContain("988");
    expect(html).toContain("Suicide &amp; Crisis Lifeline");
    expect(html).toContain('aria-disabled="true"');
  });

  it("produces identical markup for the same input", () => {
    // Ids come from React's useId, which is stable for a given tree shape.
    // Unstable ids would mean a hydration mismatch on every request.
    const once = renderToString(<Accordion items={GOVERNED} />);
    const twice = renderToString(<Accordion items={GOVERNED} />);
    expect(once).toBe(twice);
  });
});
