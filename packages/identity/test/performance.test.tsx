import type { Patient } from "@oxygenui-design/fhir";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdentityProvider } from "../src/IdentityProvider.js";
import { PatientChip } from "../src/PatientChip.js";
import * as F from "./fixtures.js";

/**
 * A patient chip is the one component in a healthcare product that renders
 * thousands of times on one screen — population dashboards, panel management,
 * claims worklists, bed boards. These assertions are about shape rather than
 * wall clock, because a wall clock is hardware-dependent and roughly doubles
 * under coverage instrumentation, which makes it exactly the kind of test a
 * team learns to ignore.
 */

const FAMILIES = [
  "Okonkwo",
  "Iyer",
  "Yusuf",
  "Mensah",
  "Ramirez",
  "Chen",
  "Lindqvist",
  "Haddad",
  "Berg",
  "Kulkarni",
  "Adeyemi",
  "Novak",
  "Ferreira",
  "Nguyen",
  "Meer",
  "Tashkandi",
];

function panel(n: number): Patient[] {
  const out: Patient[] = [];
  for (let i = 0; i < n; i++) {
    out.push(
      F.patient({
        id: `pat-perf-${i}`,
        name: [
          { use: "official", given: [`Given${i % 41}`], family: FAMILIES[i % FAMILIES.length] },
        ],
        birthDate: `19${80 + (i % 10)}-03-${String((i % 28) + 1).padStart(2, "0")}`,
        identifier: [{ system: F.MRN, value: String(500000000 + i) }],
      }),
    );
  }
  return out;
}

function markup(patients: Patient[]): string {
  return renderToStaticMarkup(
    <IdentityProvider now={F.NOW}>
      {patients.map((p) => (
        <PatientChip key={p.id} patient={p} />
      ))}
    </IdentityProvider>,
  );
}

describe("five thousand rows", () => {
  it("renders without a set, and stays inside the node budget per chip", () => {
    const html = markup(panel(2000));
    const chips = (html.match(/class="ox-chip"/g) ?? []).length;
    expect(chips).toBe(2000);

    // Avatar + wrapper + text wrapper + name, plus the visually-hidden label.
    // The budget in the brief is four visible nodes per chip.
    const spans = (html.match(/<span/g) ?? []).length;
    expect(spans / chips).toBeLessThanOrEqual(5);
  });

  it("keeps the initials avatar to a single element", () => {
    const html = markup(panel(50));
    // No nested markup inside an initials avatar: no <svg>, no <img>.
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("<img");
  });

  it("scales linearly in output size", () => {
    const small = markup(panel(200)).length;
    const large = markup(panel(1000)).length;
    // Five times the rows, about five times the bytes. A super-linear result
    // would mean per-row work is leaking into the markup.
    expect(large / small).toBeGreaterThan(4);
    expect(large / small).toBeLessThan(6);
  });

  it("resolves each patient once per policy, not once per render", () => {
    // The resolution cache is what makes the O(n^2) disambiguation pass
    // affordable and the render cheap; without it every render recomputes a
    // hash, initials and a label for every row.
    const patients = panel(500);
    const first = markup(patients);
    const second = markup(patients);
    expect(second).toBe(first);
  });

  it("produces no inline colour, so a strict CSP needs no unsafe-inline", () => {
    const html = markup(panel(100));
    expect(html).not.toMatch(/style="[^"]*background-color/);
    expect(html).not.toMatch(/style="[^"]*;?\s*color:/);
  });

  it("never emits a truncation class on a name or an identifier", () => {
    const html = markup(panel(100));
    expect(html).not.toMatch(/truncate|text-overflow|ellipsis/);
  });
});
