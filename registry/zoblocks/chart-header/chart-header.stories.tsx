/**
 * Stories for ChartHeader.
 *
 * `parameters.state` ties each to a state declared in `chart-header.meta.ts`,
 * and the build asserts the two agree in both directions.
 *
 * The pair worth reading together is Expanded and Collapsed: the strip is
 * identical in both, and that is the entire argument for collapsing to a
 * safety bar rather than to a name.
 */

import type { Meta, StoryObj } from "@zoblocks/component-meta";
import type { Patient } from "@zoblocks/fhir";
import { patientRoutine } from "@zoblocks/fixtures";
import { expect, userEvent, within } from "../../../test/story-kit";
import { ChartHeader, type EncounterOption, type SafetyInput } from "./chart-header";

const NOW = "2026-08-24T10:00:00Z";

/** The shared fixture, plus the second identifier a care action requires. */
const patient: Patient = {
  ...patientRoutine,
  identifier: [
    ...(patientRoutine.identifier ?? []),
    { use: "official", system: "https://fhir.nhs.uk/Id/nhs-number", value: "943 476 5919" },
  ],
};

const SPCU_EXT = "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse";

const withSpcu: Patient = {
  ...patient,
  extension: [
    {
      url: SPCU_EXT,
      extension: [
        { url: "value", valueCodeableConcept: { text: "female" } },
        { url: "comment", valueString: "for medication dosing" },
      ],
    },
  ],
};

const identifiers = [{ kind: "mrn" }, { kind: "nhs" }] as const;

const encounters: EncounterOption[] = [
  { id: "enc-1", label: "Inpatient — Ward 4B", type: "inpatient" },
  { id: "enc-2", label: "Outpatient — 24 Aug, 09:00", type: "ambulatory" },
  { id: "enc-3", label: "Telehealth — 24 Aug, 14:00", type: "virtual" },
];

const safety: SafetyInput = {
  allergies: { label: "Penicillin — anaphylaxis", tone: "critical", detail: "confirmed" },
  codeStatus: { label: "DNR" },
};

const meta: Meta<typeof ChartHeader> = {
  title: "Clinical/Chart Header",
  component: ChartHeader,
  args: { patient, identifiers, now: NOW, safety },
};

export default meta;
type Story = StoryObj<typeof ChartHeader>;

/* ------------------------------------------------------------------ */
/* The two heights — the argument                                      */
/* ------------------------------------------------------------------ */

export const Expanded: Story = {
  name: "Expanded",
  parameters: { state: "Expanded" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("banner")).toBeTruthy();
    expect(canvas.getByRole("button", { name: /collapse/i }).getAttribute("aria-expanded")).toBe(
      "true",
    );
  },
};

export const Collapsed: Story = {
  name: "Collapsed to the safety strip",
  parameters: { state: "Collapsed to the safety strip" },
  args: { collapsed: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const detail = canvasElement.querySelector(".zb-chart-header__detail");
    // Hidden, not unmounted: a screen-reader user is one disclosure away, and
    // so is a sighted one.
    expect(detail?.hasAttribute("hidden")).toBe(true);
    // The strip is unchanged. That is the whole point of collapsing here.
    expect(canvasElement.querySelector(".zb-chart-header__strip")?.textContent).toContain(
      "Penicillin",
    );
    expect(
      canvas.getByRole("button", { name: /show patient details/i }).getAttribute("aria-expanded"),
    ).toBe("false");
  },
};

/* ------------------------------------------------------------------ */
/* The encounter                                                       */
/* ------------------------------------------------------------------ */

export const NoEncounterOpen: Story = {
  name: "No encounter is open",
  parameters: { state: "No encounter is open" },
  args: { encounters: [], onSelectEncounter: () => {} },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("status").textContent).toContain("No encounter is open");
  },
};

export const ThreeEncountersOpen: Story = {
  name: "Three encounters open — choose one",
  parameters: { state: "Three encounters open — choose one" },
  args: { encounters, onSelectEncounter: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("combobox", { name: /documenting into/i });
    // Nothing is chosen for the user. A note filed into an encounter nobody
    // read is the most common misfiling in the building.
    expect(select.getAttribute("data-zb-encounter")).toBe("none");
    await userEvent.selectOptions(select, "enc-2");
  },
};

/* ------------------------------------------------------------------ */
/* The sex parameter                                                   */
/* ------------------------------------------------------------------ */

export const SexParameterWithContext: Story = {
  name: "Sex parameter, with its context",
  parameters: { state: "Sex parameter, with its context" },
  args: { patient: withSpcu, surface: "orders" },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent).toContain("for medication dosing");
    // The administrative gender is on the resource and never on the screen.
    expect(canvasElement.textContent).not.toMatch(/\bfemale\b(?!, for)/);
  },
};

export const SexParameterNotRecorded: Story = {
  name: "Sex parameter not recorded, on an order screen",
  parameters: { state: "Sex parameter not recorded, on an order screen" },
  args: { surface: "orders" },
  play: async ({ canvasElement }) => {
    // The absence is the finding. A blank space here is where somebody
    // reaches for Patient.gender.
    expect(canvasElement.textContent).toContain("Do not substitute the administrative gender");
  },
};

export const SexParameterWithheld: Story = {
  name: "Sex parameter withheld on an overview screen",
  parameters: { state: "Sex parameter withheld on an overview screen" },
  args: { patient: withSpcu, surface: "overview" },
  play: async ({ canvasElement }) => {
    // Out of context it is a demographic wearing a clinical name.
    expect(canvasElement.textContent).not.toContain("Sex parameter");
  },
};

/* ------------------------------------------------------------------ */
/* The strip                                                           */
/* ------------------------------------------------------------------ */

export const AllergiesNotAsked: Story = {
  name: "Allergies not asked",
  parameters: { state: "Allergies not asked" },
  args: { safety: { codeStatus: { label: "Full code", tone: "info" } } },
  play: async ({ canvasElement }) => {
    const fact = canvasElement.querySelector('[data-zb-kind="allergy"]');
    expect(fact?.getAttribute("data-zb-tone")).toBe("absent");
    expect(fact?.textContent).toContain("not asked");
  },
};

export const CodeStatusNotRecorded: Story = {
  name: "Code status not recorded",
  parameters: { state: "Code status not recorded" },
  args: { safety: { allergies: { label: "No known allergies", tone: "info" } } },
  play: async ({ canvasElement }) => {
    const fact = canvasElement.querySelector('[data-zb-kind="code-status"]');
    expect(fact?.getAttribute("data-zb-tone")).toBe("absent");
  },
};

export const IsolationAndFallRisk: Story = {
  name: "Isolation and fall risk",
  parameters: { state: "Isolation and fall risk" },
  args: {
    safety: {
      ...safety,
      isolation: { label: "Contact precautions", detail: "MRSA" },
      fallRisk: { label: "High falls risk" },
    },
  },
  play: async ({ canvasElement }) => {
    // Isolation is critical without being told, and the fixed order means a
    // reader finds it in the same place on every chart.
    const kinds = [...canvasElement.querySelectorAll("[data-zb-kind]")].map((el) =>
      el.getAttribute("data-zb-kind"),
    );
    expect(kinds).toEqual(["allergy", "code-status", "isolation", "fall-risk"]);
    expect(
      canvasElement.querySelector('[data-zb-kind="isolation"]')?.getAttribute("data-zb-tone"),
    ).toBe("critical");
  },
};

export const InvoluntaryHold: Story = {
  name: "Involuntary hold, with its expiry",
  parameters: { state: "Involuntary hold, with its expiry" },
  args: {
    safety: {
      ...safety,
      legalStatus: { label: "Involuntary hold", until: "2026-08-25T09:00:00Z" },
    },
  },
  play: async ({ canvasElement }) => {
    const fact = canvasElement.querySelector('[data-zb-kind="legal-status"]');
    expect(fact?.hasAttribute("data-zb-expired")).toBe(false);
    expect(fact?.textContent).toContain("until");
  },
};

export const HoldExpired: Story = {
  name: "Hold expired",
  parameters: { state: "Hold expired" },
  args: {
    safety: {
      ...safety,
      legalStatus: { label: "Involuntary hold", until: "2026-08-24T09:00:00Z" },
    },
  },
  play: async ({ canvasElement }) => {
    const fact = canvasElement.querySelector('[data-zb-kind="legal-status"]');
    // Shown as expired rather than removed. Its disappearance is not the same
    // signal as its lapse.
    expect(fact?.hasAttribute("data-zb-expired")).toBe(true);
    expect(fact?.textContent).toContain("expired");
  },
};

/* ------------------------------------------------------------------ */
/* Behavioral health, and the chrome                                   */
/* ------------------------------------------------------------------ */

export const ProgramAndWeek: Story = {
  name: "Program and week",
  parameters: { state: "Program and week" },
  args: { program: { name: "IOP", week: 3, of: 8 } },
  play: async ({ canvasElement }) => {
    // The field behavioral health needs in the header and a general clinical
    // library never puts there.
    expect(within(canvasElement).getByText("IOP · week 3 of 8")).toBeTruthy();
  },
};

export const WithActions: Story = {
  name: "With actions",
  parameters: { state: "With actions" },
  args: {
    actions: (
      <button type="button" data-testid="ch-print">
        Print chart
      </button>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Actions belong to the application; the header only makes room.
    await userEvent.click(canvas.getByRole("button", { name: "Print chart" }));
  },
};
