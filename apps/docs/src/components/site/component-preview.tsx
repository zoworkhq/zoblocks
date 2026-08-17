"use client";

/**
 * ComponentPreview — the live demo on a component detail page.
 *
 * Real components, real states, switchable. A screenshot can show a component
 * working; only this can show it not-working gracefully, which is the actual
 * claim the product makes.
 *
 * Each entry is keyed by the component's registry name, so a new component
 * picks up its preview by existing in the catalog. Components with no entry
 * here fall back to a stated "coming with the next release" rather than an
 * empty frame.
 */

import * as React from "react";
import { PageLoader, PulseLoader } from "@/registry/oxygen/pulse-loader/pulse-loader";
import { RhythmLoader } from "@/registry/oxygen/rhythm-loader/rhythm-loader";
import { BreathLoader } from "@/registry/oxygen/breath-loader/breath-loader";
import { HelixLoader } from "@/registry/oxygen/helix-loader/helix-loader";
import { InfusionLoader } from "@/registry/oxygen/infusion-loader/infusion-loader";
import { Accordion } from "@/registry/oxygen/accordion/accordion";
import {
  ChartAccordion,
  type ChartSection,
} from "@/registry/oxygen/chart-accordion/chart-accordion";
import { SafetyPlan } from "@/registry/oxygen/safety-plan/safety-plan";
import type { AccordionItem } from "@/registry/oxygen/lib/accordion-core";
import { Tabs } from "@oxygenui-design/tabs";
import { Consult } from "@/registry/oxygen/consult/consult";
import { ClinicalNote, ClinicalNoteReader } from "@/registry/oxygen/clinical-note/clinical-note";
import { mixed, noteDoc, noteSection, para } from "@/registry/oxygen/lib/clinical-note";
import {
  createStaticProvider,
  lookUp,
  minimalDisclosure,
  prepare,
  type ConsultEvent,
  type Source,
} from "@oxygenui-design/consult-core";
import { InstrumentGlow } from "@/components/site/interactions";
import { SignatureDemo } from "@/components/site/signature-demo";
import {
  IdentityAbsenceDemo,
  IdentityBannerDemo,
  IdentityDisclosureDemo,
  IdentityGuardDemo,
  IdentityStatesDemo,
  IdentityVerifyDemo,
  IdentityWorklistDemo,
} from "@/components/site/identity-demo";
import { cn } from "@/lib/utils";

type Density = "patient" | "standard" | "clinical";

interface Scenario {
  id: string;
  label: string;
  note: string;
  render: () => React.ReactNode;
}

/**
 * A stand-in for the application behind an overlay, so overlay and page modes
 * can be shown doing their actual job rather than floating on nothing.
 */
function AppBehind({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-panel-rule bg-panel/40">
      <div className="space-y-3 p-5" aria-hidden="true">
        <div className="h-2.5 w-2/5 rounded-full bg-panel-fg/10" />
        <div className="h-2.5 w-4/5 rounded-full bg-panel-fg/10" />
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="h-16 rounded-lg bg-panel-fg/8" />
          <div className="h-16 rounded-lg bg-panel-fg/8" />
          <div className="h-16 rounded-lg bg-panel-fg/8" />
        </div>
        <div className="h-2.5 w-3/5 rounded-full bg-panel-fg/10" />
      </div>
      {children}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[200px] items-center justify-center">{children}</div>;
}

/** A determinate loader that actually advances, so progress can be watched. */
function AdvancingInfusion() {
  const [progress, setProgress] = React.useState(8);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((current) => (current >= 100 ? 8 : current + 2));
    }, 220);
    return () => clearInterval(timer);
  }, []);

  return (
    <InfusionLoader
      progress={progress}
      label="Importing records"
      showLabel
      hint="1,284 of 3,000 records"
    />
  );
}

/**
 * Room around a composite demo, and deliberately no theme scope.
 *
 * `.instrument-demo` follows the page theme — globals.css states the rule
 * outright: "live component previews should never look dark on a light page."
 * The component tokens follow the same `.dark` class on the document, so the
 * two already agree and anything declared here could only disagree with both.
 * An earlier version of this pinned `[data-ox-theme="dark"]`, on the mistaken
 * reading that the panel was dark under both themes; on a light page that put
 * dark-theme tab colours — pale cyan on near-white — inside a white panel.
 */
function InstrumentStage({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl">{children}</div>;
}

const CHART_ITEMS: AccordionItem[] = [
  {
    key: "risk",
    label: "Risk & suicidality",
    severity: "critical",
    summary: "C-SSRS positive · 13 Aug",
    children: <p>Ideation 3 — active thoughts, no plan, no intent, no preparatory behaviour.</p>,
  },
  {
    key: "meds",
    label: "Medications",
    severity: "high",
    summary: "Clozapine ANC due 18 Aug",
    children: <p>Clozapine 300 mg nightly. Lithium carbonate 900 mg nightly.</p>,
  },
  {
    key: "plan",
    label: "Safety plan",
    severity: "normal",
    summary: "Current · revised 11 Aug",
    children: <p>Six steps complete. Means restriction reviewed on 11 August.</p>,
  },
];

const RECORD_SECTIONS: ChartSection[] = [
  {
    key: "risk",
    label: "Risk & suicidality",
    severity: "critical",
    status: "C-SSRS positive",
    updatedAt: "2026-08-13",
    children: <p>Ideation 3 — active thoughts, no plan, no intent, no preparatory behaviour.</p>,
  },
  {
    key: "assessments",
    label: "Assessments",
    severity: "high",
    status: "PHQ-9 21 · severe",
    updatedAt: "2026-08-03",
    children: <p>PHQ-9 21 of 27. GAD-7 16 of 21. Item 9 endorsed.</p>,
  },
  {
    key: "notes",
    label: "Progress notes",
    count: "142 encounters",
    updatedAt: "2026-08-13",
    children: <p>BIRP format.</p>,
  },
  {
    key: "audit",
    label: "AUDIT",
    severity: "unknown",
    status: "Not asked this visit",
    updatedAt: "2026-02-02",
    children: <p>Not administered on 3 August. Last score 14 on 2 February 2026.</p>,
  },
];

/*
 * Consult, driven by a scripted provider.
 *
 * `createStaticProvider` is exported by consult-core for exactly this — the
 * states worth showing are the ones a live model gives you only by luck, and
 * the two that matter most (an answer its sources support, and one they do not)
 * are not worth waiting on a model to produce.
 */
const CONSULT_DISCLOSURE = minimalDisclosure("demo-model@1", {
  developer: "Zowork",
  knowledgeCutoff: "2025-10",
});

const CONSULT_GUIDELINE: Source = {
  id: "acc-aha-af",
  title: "2023 ACC/AHA/HRS AF Guideline",
  passage:
    "In patients with atrial fibrillation and rapid ventricular response, rate control is a reasonable initial approach for those without severe symptoms.",
  highlight: [40, 106],
  kind: "guideline",
  version: "2023.1",
  retrievedAt: "2026-08-16T09:00:00.000Z",
  score: 0.91,
};

const GROUNDED_STREAM: ConsultEvent[] = [
  {
    type: "delta",
    text: "Rate control is a reasonable initial approach for most patients without severe symptoms.",
  },
  { type: "citation", marker: 1, source: CONSULT_GUIDELINE },
  { type: "claim", claim: { span: [0, 86], markers: [1] } },
  { type: "done", finish: "stop" },
];

const UNCITED_STREAM: ConsultEvent[] = [
  {
    type: "delta",
    text: "Rhythm control is often preferred in younger, more symptomatic patients.",
  },
  { type: "done", finish: "stop" },
];

function ConsultDemo({ events, delayMs = 90 }: { events: ConsultEvent[]; delayMs?: number }) {
  // Rebuilt per scenario so switching tabs restarts the stream rather than
  // replaying a session the previous scenario already finished.
  const provider = React.useMemo(
    () => createStaticProvider({ events, disclosure: CONSULT_DISCLOSURE, delayMs }),
    [events, delayMs],
  );

  return (
    <Consult
      provider={provider}
      modes={[lookUp, prepare]}
      anchor="inline"
      locale="en-GB"
      actor={{ display: "Dr Amara Okafor", credential: "MD", reference: "Practitioner/7" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Clinical Note fixtures                                              */
/* ------------------------------------------------------------------ */

/** Frozen, so the stale-value demo says the same thing every day. */
const NOTE_NOW = new Date("2026-08-16T14:38:00+05:30");

const NOTE_SUBJECT = {
  reference: "Patient/4471902",
  display: "RANDOL, Joshua",
  identifier: "4471902",
  birthDate: "12 Mar 1996",
  detail: "30y M · Bed 4E-12",
};

const NOTE_ATTESTATION =
  "I have reviewed this note in its entirety and attest that it accurately reflects the care I provided.";

/** Day four of an admission: mostly yesterday's note, with today's edits on top. */
function noteWithMixedOrigins() {
  return noteDoc(
    noteSection(
      { code: "10154-3", title: "Chief complaint" },
      para("Admitted for blood transfusion.", "typed"),
    ),
    noteSection(
      { code: "10164-2", title: "History of present illness", required: true },
      mixed(
        [
          "Mr. Randol is a 30-year-old man with type 2 diabetes mellitus who presented with six weeks of progressive fatigue and exertional dyspnea, now limiting him to one flight of stairs. ",
          "copied",
          { source: "DocumentReference/day-3" },
        ],
        ["Today he reports the lightheadedness has resolved since the first unit.", "typed"],
      ),
      mixed(
        [
          "He denies overt bleeding — no melena, hematochezia or epistaxis. ",
          "ai",
          { source: "scribe/v2", reviewed: false },
        ],
        [
          "Hemoglobin 7.1 g/dL",
          "pulled",
          { source: "Observation/cbc-1", at: "2026-08-16T06:12:00+05:30" },
        ],
        [", down from 11.8 g/dL in March.", "typed"],
      ),
    ),
    noteSection(
      { code: "10187-3", title: "Review of systems" },
      para(
        "Constitutional — positive for fatigue; denies fever, night sweats or weight loss. Cardiovascular — positive for exertional dyspnea; denies chest pain or edema.",
        "template",
        { source: "phrase/ros" },
      ),
    ),
    noteSection({ code: "51847-2", title: "Assessment and plan", required: true }),
  );
}

/** The same note, finished. Nothing blocking. */
function completeNote() {
  return noteDoc(
    noteSection(
      { code: "10154-3", title: "Chief complaint" },
      para("Admitted for blood transfusion.", "typed"),
    ),
    noteSection(
      { code: "10164-2", title: "History of present illness", required: true },
      para(
        "Six weeks of progressive fatigue and exertional dyspnea, worse over two weeks. Lightheadedness resolved after the first unit.",
        "typed",
      ),
    ),
    noteSection(
      { code: "51847-2", title: "Assessment and plan", required: true },
      para(
        "Symptomatic iron-deficiency anaemia. Transfuse a second unit, repeat CBC in six hours, iron studies sent, GI referral placed.",
        "typed",
      ),
    ),
  );
}

const SCENARIOS: Record<string, Scenario[]> = {
  identity: [
    {
      id: "banner",
      label: "The banner",
      note: 'The last surface a clinician reads before they act. Two identifiers because `context="action"` requires them at the type level; `08 Mar 1985` because `08/03/1985` is 3 August in Delhi and 8 March in Denver; SPCU rather than a bare “F”, because administrative gender is not a dosing fact and `Patient.gender` is not a renderable field at all.',
      render: () => (
        <InstrumentStage>
          <IdentityBannerDemo />
        </InstrumentStage>
      ),
    },
    {
      id: "worklist",
      label: "Two patients, one name",
      note: "The pass no other component library ships. It reads what is actually on screen and adds the minimum that separates each collided row — full given name, then date of birth, then identifier — stopping at the first rung that works. Toggle it off to see what a ward list looks like without it.",
      render: () => (
        <InstrumentStage>
          <IdentityWorklistDemo />
        </InstrumentStage>
      ),
    },
    {
      id: "states",
      label: "Four states, not one pill",
      note: "Deceased, inactive, merged and test come from four unrelated places in FHIR and mean four unrelated things. Collapsing them into one grey “Inactive” is how an automated appointment reminder reaches a bereaved family. The last row carries an NHS number that fails its check digit — a matching failure that has already happened, shown rather than hidden.",
      render: () => (
        <InstrumentStage>
          <IdentityStatesDemo />
        </InstrumentStage>
      ),
    },
    {
      id: "disclosure",
      label: "Who is looking",
      note: "One resource, four audiences. Sensitivity categories stay behind an audited reveal below full disclosure — and they are withheld from the accessible name too, because naming them there would hand a screen-reader user the thing the reveal exists to record.",
      render: () => (
        <InstrumentStage>
          <IdentityDisclosureDemo />
        </InstrumentStage>
      ),
    },
    {
      id: "guard",
      label: "Wrong patient",
      note: "The coupling that makes a banner a control rather than a heading. The form knows which patient it was opened for, the banner knows which chart is displayed, and the component refuses to let those disagree — silently or otherwise. Switch the chart and watch the order form withdraw.",
      render: () => (
        <InstrumentStage>
          <IdentityGuardDemo />
        </InstrumentStage>
      ),
    },
    {
      id: "verify",
      label: "Confirm before ordering",
      note: "Adelman et al., 901,776 ordering sessions: a dismissible alert cut wrong-patient orders with an odds ratio of 0.84, and making the clinician re-enter the initials cut them with an odds ratio of 0.60. Everyone builds the first. Type AO.",
      render: () => (
        <InstrumentStage>
          <IdentityVerifyDemo />
        </InstrumentStage>
      ),
    },
    {
      id: "absence",
      label: "Five kinds of missing",
      note: "Every design system collapses these into “show initials”. A photograph in the banner is associated with measurably fewer wrong-patient orders, so a silently missing one is a silently degraded safety control — and “no photo on record” and “we could not load the photo we have” are different facts.",
      render: () => (
        <InstrumentStage>
          <IdentityAbsenceDemo />
        </InstrumentStage>
      ),
    },
  ],

  consult: [
    {
      id: "rest",
      label: "At rest",
      note: "A dock, not a floating div: role=complementary with a name, so it is findable and skippable. The placeholder does not say “Ask anything” — a copilot that promises a scope it will refuse has already lied once before the first question. Type a question and press Enter.",
      render: () => (
        <InstrumentStage>
          <ConsultDemo events={GROUNDED_STREAM} />
        </InstrumentStage>
      ),
    },
    {
      id: "sourced",
      label: "A sourced answer",
      note: "Every claim the model makes is spanned and tied to the passage that supports it, and the passage is shown with the supporting sentence highlighted. The design goal is narrow and unusual: make checking the answer cheaper than accepting it.",
      render: () => (
        <InstrumentStage>
          <ConsultDemo events={GROUNDED_STREAM} delayMs={140} />
        </InstrumentStage>
      ),
    },
    {
      id: "uncited",
      label: "Unsupported",
      note: "The same component, given an answer with no citation behind it. It is not hidden and not silently rendered as though it were sourced — an unsupported claim is marked as unsupported, because the failure this component exists to prevent is a confident sentence that nothing stands behind.",
      render: () => (
        <InstrumentStage>
          <ConsultDemo events={UNCITED_STREAM} delayMs={140} />
        </InstrumentStage>
      ),
    },
  ],

  accordion: [
    {
      id: "chart",
      label: "A record",
      note: "Severity is never colour alone: the rail is paired with a summary that says the same thing in words, so a closed section still reports what is inside it. Click a header, or focus one and press ↑ / ↓ — the roving tab stop and the heading level are the same in every configuration.",
      render: () => (
        <InstrumentStage>
          <Accordion items={CHART_ITEMS} defaultActiveKey={["risk"]} headingLevel={3} />
        </InstrumentStage>
      ),
    },
    {
      id: "consent",
      label: "Consent gate",
      note: "Expanding a section and disclosing its content are separate events. The panel opens to explain what governs it — 42 CFR Part 2, named in the header so a closed section says it too — and the content stays behind the gate until consent is confirmed. An expiry is stated before it lapses, not after.",
      render: () => (
        <InstrumentStage>
          <Accordion
            headingLevel={3}
            defaultActiveKey={["sud"]}
            onDisclose={() => true}
            items={[
              {
                key: "sud",
                label: "Substance use treatment",
                summary: "42 CFR Part 2",
                access: {
                  kind: "consent",
                  policy: "42 CFR Part 2",
                  state: "granted",
                  expiresAt: "2027-02-02",
                },
                children: <p>Intensive outpatient programme, three sessions weekly.</p>,
              },
              {
                key: "notes",
                label: "Progress notes",
                summary: "142 encounters",
                children: <p>BIRP format.</p>,
              },
            ]}
          />
        </InstrumentStage>
      ),
    },
    {
      id: "withheld",
      label: "Withheld",
      note: "Content this reader cannot obtain still gets a row. Deleting it would claim the record is complete, and a clinician reading a chart with a silent hole in it makes a decision on evidence they do not know is missing. The row states the reason and is not expandable.",
      render: () => (
        <InstrumentStage>
          <Accordion
            headingLevel={3}
            items={[
              {
                key: "sealed",
                label: "Adolescent visit, 2019",
                access: {
                  kind: "withheld",
                  reason: "Sealed under state minor-consent law. Not releasable to this account.",
                },
              },
              {
                key: "meds",
                label: "Medications",
                severity: "high",
                summary: "Clozapine ANC due 18 Aug",
                children: <p>Clozapine 300 mg nightly.</p>,
              },
            ]}
          />
        </InstrumentStage>
      ),
    },
  ],

  "chart-accordion": [
    {
      id: "record",
      label: "The whole record",
      note: "The chart layer over Accordion: severity chips, counts and a last-updated time composed to the house rules, so a severity can never reach the screen without the words that explain it. Expand all and Collapse all are one control each, because the first thing anyone does with a record is open all of it.",
      render: () => (
        <InstrumentStage>
          <ChartAccordion
            sections={RECORD_SECTIONS}
            defaultOpenKeys={["risk"]}
            toolbarLabel="Okonkwo, A. · MRN 4471902"
            headingLevel={3}
          />
        </InstrumentStage>
      ),
    },
    {
      id: "quiet",
      label: "Without a toolbar",
      note: "Embedded inside a page that already has its own chrome, the toolbar is a second set of controls competing with the first. Turning it off leaves the sections, the severity rails and the summaries — the part that carries the information.",
      render: () => (
        <InstrumentStage>
          <ChartAccordion sections={RECORD_SECTIONS} toolbar={false} headingLevel={3} />
        </InstrumentStage>
      ),
    },
  ],

  "safety-plan": [
    {
      id: "complete",
      label: "Complete",
      note: "The six steps of the Stanley-Brown Safety Planning Intervention, in order. The crisis step is pinned open and cannot be closed: a person in crisis should not have to find the part of their own plan that holds the phone numbers.",
      render: () => (
        <InstrumentStage>
          <SafetyPlan
            revisedAt="2026-08-11"
            headingLevel={3}
            steps={{
              warningSigns: {
                entries: ["Sleeping less than four hours", "Not answering messages for two days"],
              },
              internalCoping: {
                entries: ["Walk to the end of the road and back", "Four in, six out, ten times"],
              },
              distractions: { entries: ["The cafe on Bell Street before 11am"] },
              supportContacts: {
                contacts: [{ name: "Priya", detail: "Sister", availability: "Any time" }],
              },
              professionals: {
                contacts: [
                  { name: "988", detail: "Suicide & Crisis Lifeline", availability: "24 hours" },
                  { name: "County crisis team", detail: "555 0148", availability: "24 hours" },
                ],
              },
              environment: { entries: ["Priya is holding the spare keys to the garage"] },
            }}
          />
        </InstrumentStage>
      ),
    },
    {
      id: "unfinished",
      label: "Unfinished",
      note: "A half-written plan is the normal case — it is filled in over several appointments. Empty steps say they are not filled in yet and who fills them in, rather than rendering blank; a blank row reads as a plan that has nothing in it rather than one still being written.",
      render: () => (
        <InstrumentStage>
          <SafetyPlan
            revisedAt="2026-08-11"
            headingLevel={3}
            steps={{
              warningSigns: { entries: ["Sleeping less than four hours"] },
              professionals: {
                contacts: [
                  { name: "988", detail: "Suicide & Crisis Lifeline", availability: "24 hours" },
                ],
              },
            }}
          />
        </InstrumentStage>
      ),
    },
  ],

  /*
   * Tabs also has a full gallery further down this page. These four are here
   * because the gallery is organised by skin, and the claim that actually
   * matters is the one a skin cannot show: the same silhouette compiles to four
   * different accessibility trees depending on what the tabs *are*.
   */
  tabs: [
    {
      id: "tablist",
      label: "View switch",
      note: 'as="tabs" — the default, and the only one of the four that owns panels. Arrow keys move selection, the panel follows, and the strip is a single tab stop. This is the one everybody builds; the other three are the ones everybody builds wrongly by reusing this.',
      render: () => (
        <InstrumentStage>
          <Tabs
            as="tabs"
            aria-label="Encounter"
            variant="underline"
            defaultValue="summary"
            items={[
              { value: "summary", label: "Summary", children: <p>Order #4471, placed 12 Aug.</p> },
              {
                value: "items",
                label: "Line items",
                count: 24,
                children: <p>24 items across 3 shipments.</p>,
              },
              { value: "shipping", label: "Shipping", children: <p>Collected 13 Aug.</p> },
            ]}
          />
        </InstrumentStage>
      ),
    },
    {
      id: "radiogroup",
      label: "Form value",
      note: 'as="radiogroup" — a filter that belongs in a Form.Item. It has a value, not a panel, so it announces "checked, 1 of 4" rather than pretending to be a tablist. Wrapping a radio group in role=tablist is the single most common tab defect in an audit.',
      render: () => (
        <InstrumentStage>
          <Tabs
            as="radiogroup"
            aria-label="Document type"
            variant="pill"
            defaultValue="all"
            items={[
              { value: "all", label: "Everything", count: 241 },
              { value: "referrals", label: "Referrals", count: 38 },
              { value: "labs", label: "Lab reports", count: 96 },
              { value: "consent", label: "Consent forms", count: 14 },
            ]}
          />
        </InstrumentStage>
      ),
    },
    {
      id: "nav",
      label: "Link list",
      note: 'as="nav" — a navigation menu, so every trigger is a real anchor with an href. Hijacking arrow keys here would destroy a keyboard user\'s focus the moment they pressed one, so it does not: Tab moves between links, exactly as it does everywhere else on the web.',
      render: () => (
        <InstrumentStage>
          <Tabs
            as="nav"
            aria-label="Chart sections"
            variant="ghost"
            defaultValue="overview"
            items={[
              { value: "overview", label: "Overview", href: "#overview" },
              { value: "meds", label: "Medications", href: "#meds" },
              { value: "labs", label: "Labs", href: "#labs" },
            ]}
          />
        </InstrumentStage>
      ),
    },
    {
      id: "steps",
      label: "Wizard",
      note: 'as="steps" — ordered and gated. Completed steps stay reachable, because locking them is the classic wizard mistake: it forces a restart to fix a typo. A step that is not yet earned is focusable and says why, rather than being invisible.',
      render: () => (
        <InstrumentStage>
          <Tabs
            as="steps"
            aria-label="Referral"
            variant="stepper"
            defaultValue="details"
            items={[
              { value: "patient", label: "Patient", state: "done" },
              { value: "details", label: "Details", state: "current" },
              {
                value: "review",
                label: "Review",
                state: "locked",
                disabledReason: "Complete the details step first.",
              },
            ]}
          />
        </InstrumentStage>
      ),
    },
  ],

  /**
   * Five demos, each showing a fact no other editor can tell you.
   *
   * `now` is frozen so the stale-value demo says the same thing every day —
   * and because the component takes the clock as a prop precisely so that a
   * demo, a test and a ward workstation can each supply their own.
   */
  "clinical-note": [
    {
      id: "provenance",
      label: "Who wrote every character",
      note: "Turn on Origins. Orange is copied forward from a note about a different admission, green is a passage a model drafted that nobody has read, blue dotted is a lab value that was true eight hours ago. Every origin carries an underline style as well as a hue, so the distinction survives greyscale, colour-blindness, forced colours and the ward printer. The copy-forward percentage in the strip is measured from the marks, not estimated.",
      render: () => (
        <ClinicalNote
          subject={NOTE_SUBJECT}
          author={{ display: "R. Menon, MD", role: "Resident", requiresCosign: true }}
          noteType="progress"
          now={NOTE_NOW}
          value={noteWithMixedOrigins()}
          attestation={NOTE_ATTESTATION}
          timestampLine="Created 16 Aug 2026, 14:02 IST (UTC+05:30) · edited 14:38 IST"
          saveState={{ kind: "saved", at: "14:38:02 IST" }}
        />
      ),
    },
    {
      id: "gate",
      label: "The signature it will not let you make",
      note: "Press Sign & file. The assessment is empty and a model's paragraph is unread — both block, and the button says why rather than greying out silently. The copy-forward ratio and the stale potassium only warn: a gate that blocks on everything gets routed around within a week, and one that blocks on nothing is decoration.",
      render: () => (
        <ClinicalNote
          subject={NOTE_SUBJECT}
          author={{ display: "R. Menon, MD", role: "Resident", requiresCosign: true }}
          noteType="progress"
          now={NOTE_NOW}
          value={noteWithMixedOrigins()}
          gateOptions={{ maxPullAgeMs: 4 * 60 * 60 * 1000 }}
          attestation={NOTE_ATTESTATION}
          timestampLine="Created 16 Aug 2026, 14:02 IST (UTC+05:30)"
        />
      ),
    },
    {
      id: "clear",
      label: "A note that is ready",
      note: "Every required section has content, nothing is unread, nothing is copied beyond the threshold. The gate reports its passes as well as its failures — a list that only shows problems reads as an accusation, and clinicians dismiss those on reflex. The attestation still has to be ticked, because its wording is a legal decision the deployment makes.",
      render: () => (
        <ClinicalNote
          subject={NOTE_SUBJECT}
          author={{ display: "A. Iyer, MD", role: "Attending" }}
          noteType="progress"
          now={NOTE_NOW}
          value={completeNote()}
          attestation={NOTE_ATTESTATION}
          timestampLine="Created 16 Aug 2026, 14:02 IST (UTC+05:30)"
          saveState={{ kind: "saved", at: "14:41:07 IST" }}
        />
      ),
    },
    {
      id: "offline",
      label: "Interrupted, and offline",
      note: "Four honest save states and never a silent spinner. A clinician pulled out of the room by a code needs to know whether the last twelve minutes exist anywhere — and a failed save announces assertively, because an unheard save failure is lost work rather than a cosmetic problem.",
      render: () => (
        <ClinicalNote
          subject={NOTE_SUBJECT}
          author={{ display: "R. Menon, MD", role: "Resident", requiresCosign: true }}
          noteType="progress"
          now={NOTE_NOW}
          value={noteWithMixedOrigins()}
          saveState={{ kind: "offline", pending: 42 }}
          timestampLine="Created 16 Aug 2026, 14:02 IST (UTC+05:30)"
        />
      ),
    },
    {
      id: "signed",
      label: "Signed, countersigned, and superseded",
      note: "The original is not shown as corrected — it is shown as superseded. Both statements stand, in order, with their own authors and times. That is the difference between a record and a document, and it is what a patient's right to amend under 45 CFR 164.526 actually requires. This path loads no editor at all: most people who open a note never edit one.",
      render: () => (
        <ClinicalNoteReader
          subject={NOTE_SUBJECT}
          title="Progress note"
          doc={completeNote()}
          attestations={[
            {
              who: "Rohit Menon, MD",
              role: "Resident, Internal Medicine",
              when: "16 Aug 2026, 14:41:07 IST (UTC+05:30)",
            },
            {
              who: "Anjali Iyer, MD",
              role: "Attending, Internal Medicine",
              when: "16 Aug 2026, 18:02:55 IST (UTC+05:30)",
              statement:
                "I have reviewed the note and the patient, and agree with the findings and plan.",
            },
          ]}
          addenda={[
            {
              author: "Anjali Iyer, MD",
              when: "19 Aug 2026, 09:14 IST",
              text: "Bone marrow biopsy performed 18 Aug returned consistent with iron deficiency; the assessment of anaemia of chronic disease documented above is superseded. Iron studies and GI referral ordered.",
            },
          ]}
        />
      ),
    },
  ],

  "pulse-loader": [
    {
      id: "page",
      label: "Page boot",
      note: "The signature wait. The heart draws itself once, then beats at a resting 60bpm while the sweep crosses the rhythm line — one pass per beat, over a faint static track that keeps the shape legible between them.",
      render: () => (
        <Centered>
          <PulseLoader label="Loading your records" showLabel />
        </Centered>
      ),
    },
    {
      id: "overlay",
      label: "Region overlay",
      note: "Covering one panel while it re-fetches. The rest of the record stays on screen and stays usable — a failure or a wait is contained to the section it belongs to.",
      render: () => (
        <AppBehind>
          <PulseLoader mode="overlay" size="lg" label="Loading results" />
        </AppBehind>
      ),
    },
    {
      id: "slow",
      label: "Slow wait",
      note: "After eight seconds the loader stops pretending everything is fine. It names the situation and says what is still possible — never “something went wrong”, and never silence.",
      render: () => (
        <Centered>
          <PulseLoader label="Loading your records" showLabel slowAfter={1200} />
        </Centered>
      ),
    },
    {
      id: "reduced",
      label: "Reduced motion",
      note: "Not paused — designed. The heart completes, the track comes to full strength, and the whole mark breathes in opacity. Nothing scales and nothing travels, and it still reads as working.",
      render: () => (
        <Centered>
          <PulseLoader label="Loading your records" showLabel motion="reduced" />
        </Centered>
      ),
    },
    {
      id: "small",
      label: "Below 40px",
      note: "Asked to be small, it renders the rhythm line instead. That is the correct drawing of this mark at this size: the heart's detail collapses into a smudge, and a smudge is not a brand.",
      render: () => (
        <Centered>
          <div className="flex items-center gap-6">
            <PulseLoader size={88} label="Loading" />
            <PulseLoader size={56} label="Loading" />
            <PulseLoader size={24} label="Loading" />
            <PulseLoader size={20} label="Loading" />
          </div>
        </Centered>
      ),
    },
    {
      id: "preset",
      label: "PageLoader preset",
      note: "The full-page settings a boot screen needs, without every application rediscovering them: viewport cover, extra-large art, label shown.",
      render: () => (
        <AppBehind>
          <PageLoader mode="overlay" label="Loading your records" />
        </AppBehind>
      ),
    },
  ],

  "rhythm-loader": [
    {
      id: "default",
      label: "Default",
      note: "One PQRST complex on a baseline, swept by a bright head with a fading tail. Nothing scales — which is what makes it usable in a table row and at twenty pixels.",
      render: () => (
        <Centered>
          <RhythmLoader label="Loading results" showLabel />
        </Centered>
      ),
    },
    {
      id: "inline",
      label: "Inline",
      note: "At 20px beside a control. The stroke stops thinning below 28px, so the trace stays visible rather than fading to a hairline.",
      render: () => (
        <Centered>
          <div className="flex flex-col items-start gap-4">
            <span className="inline-flex items-center gap-2.5 rounded-lg border border-panel-rule px-3 py-2 text-sm text-panel-fg">
              <RhythmLoader size="sm" label="Loading results" />
              Loading results…
            </span>
            <span className="inline-flex items-center gap-2.5 text-sm text-panel-muted">
              <RhythmLoader size="sm" label="Checking coverage" />
              Checking coverage
            </span>
          </div>
        </Centered>
      ),
    },
    {
      id: "bradycardia",
      label: "Slower cadence",
      note: "Clamped to 40–100bpm. The clamp is deliberate: this is decoration on a healthcare screen, and a loader beating at 180 would be read as a number by the only people qualified to read it.",
      render: () => (
        <Centered>
          <div className="flex items-center gap-10">
            <RhythmLoader bpm={48} label="48" showLabel />
            <RhythmLoader bpm={60} label="60" showLabel />
            <RhythmLoader bpm={100} label="100" showLabel />
          </div>
        </Centered>
      ),
    },
    {
      id: "reduced",
      label: "Reduced motion",
      note: "The full trace at strength, breathing in opacity. No sweep, and nothing frozen part-way along the path.",
      render: () => (
        <Centered>
          <RhythmLoader label="Loading results" showLabel motion="reduced" />
        </Centered>
      ),
    },
  ],

  "breath-loader": [
    {
      id: "default",
      label: "Default",
      note: "Three rings on a four-second cycle, a third apart, so the field never empties. Roughly fifteen a minute — the rate of calm breathing rather than a spinner's tempo.",
      render: () => (
        <Centered>
          <BreathLoader label="Loading your information" showLabel />
        </Centered>
      ),
    },
    {
      id: "page",
      label: "Patient-facing page",
      note: "The safe default across specialties: it carries no clinical symbol at all, so nothing here reads as cardiac or oncological to someone about to receive news.",
      render: () => (
        <AppBehind>
          <BreathLoader mode="overlay" label="Loading your information" hint="Almost there." />
        </AppBehind>
      ),
    },
    {
      id: "slow",
      label: "Long wait",
      note: "Slowed to 0.7×. For waits measured in seconds rather than milliseconds, a slower cycle reads as patience instead of impatience.",
      render: () => (
        <Centered>
          <BreathLoader
            speed={0.7}
            label="Preparing your summary"
            showLabel
            hint="This can take a few seconds."
          />
        </Centered>
      ),
    },
    {
      id: "reduced",
      label: "Reduced motion",
      note: "One ring rests at partial scale beside the core, and the mark breathes in opacity.",
      render: () => (
        <Centered>
          <BreathLoader label="Loading your information" showLabel motion="reduced" />
        </Centered>
      ),
    },
  ],

  "helix-loader": [
    {
      id: "default",
      label: "Default",
      note: "Eighteen dots, two strands, one keyframe. Depth is faked with scale and opacity rather than a 3D transform — so the strands cross convincingly and render identically in every browser.",
      render: () => (
        <Centered>
          <HelixLoader label="Running the panel" showLabel />
        </Centered>
      ),
    },
    {
      id: "overlay",
      label: "Analysis panel",
      note: "Says “analysis is running” the way the cardiac loaders say “a person is waiting”. The right mark for sequencing, pathology, and diagnostics.",
      render: () => (
        <AppBehind>
          <HelixLoader mode="overlay" label="Running the panel" hint="Sequencing 4 of 12 samples" />
        </AppBehind>
      ),
    },
    {
      id: "reduced",
      label: "Reduced motion",
      note: "Both strands rest in place at full opacity. Nothing travels.",
      render: () => (
        <Centered>
          <HelixLoader label="Running the panel" showLabel motion="reduced" />
        </Centered>
      ),
    },
  ],

  "infusion-loader": [
    {
      id: "determinate",
      label: "Determinate",
      note: "A real measurement: role=progressbar, a spoken value, and a slug that only moves when the number does. This is the only loader that should ever carry a percentage — and only when the application genuinely knows it.",
      render: () => (
        <Centered>
          <AdvancingInfusion />
        </Centered>
      ),
    },
    {
      id: "indeterminate",
      label: "Indeterminate",
      note: "The honest unknown. The slug drifts end to end and claims no value at all, because a fabricated percentage parked at ninety is worse than a loader that never claimed to know.",
      render: () => (
        <Centered>
          <InfusionLoader label="Preparing the export" showLabel />
        </Centered>
      ),
    },
    {
      id: "ends",
      label: "Zero and full",
      note: "Zero still looks like a bar someone is watching rather than a component that failed to render, and full stays inside the capsule.",
      render: () => (
        <Centered>
          <div className="grid w-full max-w-sm gap-6">
            <InfusionLoader progress={0} label="Starting" showLabel />
            <InfusionLoader progress={100} label="Complete" showLabel />
          </div>
        </Centered>
      ),
    },
    {
      id: "reduced",
      label: "Reduced motion",
      note: "Determinate mode is already still and stays exact. Indeterminate mode stops drifting and breathes instead.",
      render: () => (
        <Centered>
          <div className="grid w-full max-w-sm gap-6">
            <InfusionLoader progress={42} label="Importing records" showLabel motion="reduced" />
            <InfusionLoader label="Preparing the export" showLabel motion="reduced" />
          </div>
        </Centered>
      ),
    },
  ],
};

const DENSITIES: Density[] = ["patient", "standard", "clinical"];

export function ComponentPreview({ name }: { name: string }) {
  const scenarios = SCENARIOS[name];
  const [scenarioId, setScenarioId] = React.useState(scenarios?.[0]?.id ?? "");
  const [density, setDensity] = React.useState<Density>("standard");

  // Signature is the one component the site loads Ant Design for. Showing a
  // static mark instead would undercut its entire argument: the only way to
  // demonstrate that a decline is recordable is to let someone record one.
  if (name === "signature") return <SignatureDemo />;

  if (!scenarios?.length) {
    return (
      <div className="instrument instrument-demo flex items-center justify-center px-6 py-16">
        <p className="text-sm text-panel-muted">Live preview coming with the next release.</p>
      </div>
    );
  }

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]!;

  return (
    <div className="instrument instrument-demo">
      <InstrumentGlow />

      <div className="relative flex items-center justify-between gap-4 border-b border-panel-rule px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-trace shadow-[0_0_8px_var(--color-trace)]" />
          <span className="eyebrow text-panel-muted">Live · real component</span>
        </div>
        <div className="flex items-center gap-1">
          {DENSITIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDensity(item)}
              aria-pressed={density === item}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-[0.625rem] uppercase tracking-wider transition-colors duration-200",
                density === item
                  ? "bg-panel-fg/10 text-panel-fg"
                  : "text-panel-muted hover:text-panel-fg/80",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/*
        Keyed by scenario so switching tabs remounts the demo. Without it React
        reconciles two different scenarios as the same component and their state
        bleeds across — which for a loader means an advancing progress bar
        carrying its value into a scenario that never set one.
      */}
      <div key={scenario.id} data-ox-density={density} className="relative p-4 sm:p-6">
        {scenario.render()}
      </div>

      <div className="relative border-t border-panel-rule bg-panel/60 px-3 py-3 sm:px-4">
        <div role="tablist" aria-label="Component state" className="flex flex-wrap gap-1.5">
          {scenarios.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === scenario.id}
              onClick={() => setScenarioId(item.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-wider",
                "transition-all duration-200 ease-[var(--ease-out-expo)]",
                item.id === scenario.id
                  ? "bg-trace/12 text-trace ring-1 ring-trace/35"
                  : "text-panel-muted hover:bg-panel-fg/6 hover:text-panel-fg/85",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p
          key={scenario.id}
          className="animate-rail-settle mt-3 max-w-2xl text-[0.8125rem] leading-relaxed text-panel-muted"
        >
          {scenario.note}
        </p>
      </div>
    </div>
  );
}
