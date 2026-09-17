import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "care-team-presence",
  title: "Care Team Presence",
  technicalName: "CareTeamPresence",
  tier: "free",
  status: "stable",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "Presence with clinical semantics: in session, on call, signed out to whom — and who else is in this chart right now.",

  tagline: "Who is in session, on call, and signed out to whom.",
  description:
    "Nine states rather than a green dot, each drawn as a ring shape before it is a colour. Resolves a rota to the person responsible at this moment and returns a gap when nobody is. Routes an escalation to the covering clinician before it offers an override, and warns about a documentation conflict before you type rather than at save.",
  rationale:
    'A green dot meaning "online" is worse than useless on a ward, because the two states that matter most both look identical to it. A therapist who is in session is at their desk, is online, and must not be interrupted — interrupting a group session reaches eight patients rather than one. A hospitalist who is signed out is at their desk, is online, and is the wrong person to page; the right person is named in a handover the dot does not know about. The second half of the component answers the question a PDF on a shared drive answers today: who covers this patient at 02:00 on a Sunday, and until when. And the third — chart co-presence — is the only presence signal here that appears without being asked for, because the timing is the whole value: told at save, a second note in the same encounter is a merge problem with somebody else\'s unsigned draft; told before you type, it is a choice between three reasonable options.',

  categories: ["Clinical", "Data Display"],

  fhir: [
    {
      name: "CareTeam",
      url: "https://hl7.org/fhir/R4/careteam.html",
      note: "participant[].period becomes a coverage window; a participant with no period is on the team but is not the answer to who is responsible now, and is dropped.",
    },
  ],

  states: [
    "Available",
    "In session — do not disturb",
    "In group — eight patients, not one",
    "On crisis line",
    "On call",
    "Signed out, with the cover named",
    "Off shift, nobody covering",
    "Presence degraded, with its age",
    "Presence unknown",
    "Assigned therapist",
    "Compact — avatar only",
    "Coverage resolved",
    "Coverage gap",
    "Someone else is documenting",
    "Someone else is signing",
    "Four in the chart, viewing only",
  ],

  a11y: [
    {
      label: "The ring is a shape before it is a colour",
      detail:
        "Nine states will not fit in nine hues on a 28px avatar — three would be indistinguishable to a reader with a common colour deficiency and all nine at arm's length on a ward monitor. Solid, blocked, doubled, halved, dashed, dotted or absent carries the state; the hue repeats it.",
    },
    {
      label: "The whole presence is one spoken statement",
      detail:
        '"A. Vance, MD. Attending. Signed out. Covered by T. Boateng, MD, night attending." Name, role, state, redirect — a reader who stops after the third part has enough to decide whether to make contact, and one who hears the fourth knows where to go instead.',
    },
    {
      label: "The role is never omitted",
      detail:
        '"Dr Vance" is not actionable and "Attending, night coverage until 07:00" is. The difference is whether a reader knows they have found the right person, which is the entire job of this component.',
    },
    {
      label: "The conflict notice is polite and throttled",
      detail:
        "One announcement per ten seconds. A ward round where six people open the same chart would otherwise produce six interruptions in as many seconds, and a screen-reader user would lose their place each time — this component exists to prevent an interruption, not to become one.",
    },
    {
      label: "A rota gap is an alert, not an empty state",
      detail:
        'role="alert" with the escalation named in the accessible label. Every other state here is deliberately quiet; nobody being responsible for a patient at 02:00 is the one thing that should stop a reader.',
    },
    {
      label: "The one animation is a slow breath, and it respects the preference",
      detail:
        "The crisis-line ring fades over 2.4 seconds rather than flashing. A crisis line is staffed for a whole shift, and a blinking ring in somebody's peripheral vision for eight hours is an accessibility problem. prefers-reduced-motion stops it entirely.",
    },
  ],

  limitations: [
    "It carries no transport. Presence has to arrive from somewhere — a WebSocket, a poll, a presence service — and the host subscribes once and passes it down. That is deliberate: a component that opened its own socket would open one per avatar.",
    "It cannot tell a stale channel from a stationary person on its own. The degraded state has to be set by whatever knows the channel dropped; without it, a frozen dot looks live, which is the failure the state exists to name.",
    'Coverage resolves against one flat list of windows. Overlapping rotas — a service rota and a psychiatry back-up rota on the same patient — need the caller to pick which one answers "responsible", because the component has no basis for preferring one.',
    "Chart co-presence detects a conflict; it does not resolve one. Whether the right move is a handoff, a read-only look or a separate addendum depends on facts the component does not have, which is why none of the three actions is a highlighted default.",
    "An override is offered and logged by the host, not by the component. The escalation target says an override is required; recording who overrode a do-not-disturb is an audit concern that belongs where the page is actually sent.",
  ],

  related: ["identity", "clinical-status", "chart-header"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "presence-core"],

  usage: `import {
  CoverageCard,
  PresenceChip,
} from "@/components/zoblocks/care-team-presence";
import "@/styles/zoblocks-presence.css";

<PresenceChip
  presence={{
    clinician: { id: "pr-4", display: "A. Vance, MD", role: "Attending" },
    state: "signed-out",
    coveredBy: { id: "pr-1", display: "T. Boateng, MD", role: "Night attending" },
    until: "07:00",
  }}
  onContact={(target) => page(target)}
/>

<CoverageCard windows={rota} now={serverTime} onPage={page} />`,

  guidance: {
    use: [
      "Beside a clinician's name anywhere the reader might be about to contact them — a care team panel, a message composer, a chart header.",
      "With CoverageCard on any surface where somebody might need to escalate out of hours. That is the question the shared-drive PDF answers today.",
      "With ChartCoPresence above the editor rather than inside it, so the warning arrives before the first keystroke.",
      "Compact, inside a co-presence stack, where the count matters more than any one face.",
    ],
    avoid: [
      'As a productivity signal. "Who is online" is a management question and this is a clinical one; the states exist to route contact, not to report attendance.',
      "Without a role on the clinician. A name with no role is not actionable, and the component will render it but the reader still cannot use it.",
      "As the only escalation path. It names who to reach; the page itself, and the audit entry for an override, belong to the host.",
    ],
  },

  uxGuidelines: {
    do: [
      "Set coveredBy whenever the state is signed-out or off-shift. A redirect with no destination is a dead end at the moment somebody needs a person.",
      "Pass `now` from the server rather than the browser. A degraded state's age is the one number here that must not come from a clock the user can change.",
      "Mark the assigned therapist. In behavioral health that is the person a disclosure decision routes through, which is a different fact from care-team membership.",
      "Render the gap. A rota with a two-hour hole in it is a real state, and it is the one worth finding before 02:00 rather than at it.",
    ],
    dont: [
      "Do not distinguish the states by colour alone. Three of the nine are amber, and the ring geometry is what separates them.",
      "Do not put the redirect in a tooltip. A page sent to a signed-out clinician because the cover was one hover away is the defect this component was built against.",
      "Do not announce every arrival. The live region is throttled for a reason, and lowering it turns a ward round into a stream of interruptions.",
      "Do not default the co-presence conflict to one action. Highlighting one of the three is a recommendation the component cannot justify.",
    ],
  },

  tags: ["data-display", "themeable", "print-safe", "headless", "animated"],
  aliases: [
    "presence indicator",
    "on call",
    "coverage",
    "who is on call",
    "care team availability",
    "chart co-presence",
  ],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "Four of the nine states exist because behavioral health needs them and no generic presence system has them: in session, in group, on the crisis line, and assigned therapist. Interrupting a group reaches eight patients rather than one, and the assigned therapist is the person a disclosure decision routes through.",
    workflows: ["care-coordination", "documentation", "scheduling"],
    phi: {
      handles: false,
      notes:
        "Renders clinicians rather than patients. Chart co-presence implies which chart is open, so it should not be rendered outside the chart it describes.",
    },
    auditable: false,
    permissions: ["careteam.read"],
    terminology: ["FHIR"],
  },

  variants: [
    {
      id: "default",
      label: "Default",
      description: "Avatar, name, role and state, with the redirect on its own line.",
      args: { compact: false },
    },
    {
      id: "compact",
      label: "Compact",
      description:
        "Avatar only, for a co-presence stack. The name stays in the accessible label rather than disappearing.",
      args: { compact: true },
    },
  ],

  controls: [
    {
      prop: "compact",
      control: "switch",
      label: "Compact",
      defaultValue: false,
    },
    { prop: "onContact", control: "event", label: "onContact" },
  ],

  a11yChecks: [
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Every state has a ring geometry and a state word, and both reach the accessible name. A test asserts the nine states produce nine distinct ring shapes, so two states can never collapse into one hue.",
      evidence: "care-team-presence.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'role="group" carrying the composed statement, with the visual content aria-hidden so a screen reader gets one sentence rather than a scattering of fragments.',
      evidence: "care-team-presence.test.tsx",
    },
    {
      wcag: "4.1.3",
      name: "Status messages",
      status: "pass",
      how: 'The co-presence conflict is aria-live="polite" and throttled to one announcement per ten seconds; the rota gap is role="alert" because nobody being responsible is the one state here that should interrupt.',
      evidence: "care-team-presence.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size (minimum)",
      status: "pass",
      how: "Every button — contact, page, and the three conflict actions — has a 28px minimum block size, above the 24px floor.",
      evidence: "care-team-presence.test.tsx",
    },
    {
      wcag: "2.2.2",
      name: "Pause, stop, hide",
      status: "pass",
      how: "The crisis-line ring is the only animation, it is a 2.4s opacity breath rather than a flash, and prefers-reduced-motion removes it. Nothing else moves.",
      evidence: "care-team-presence.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Every affordance is a native button. The component manages no focus and traps none.",
      evidence: "care-team-presence.test.tsx",
    },
    {
      wcag: "1.4.11",
      name: "Non-text contrast",
      status: "pass",
      how: "The rings and the button borders draw from gated status tokens; the ring is also 2px or wider so the geometry survives at the contrast floor.",
      evidence: "contrast.gate",
    },
    {
      wcag: "1.3.1",
      name: "Info and relationships",
      status: "pass",
      how: "The redirect, the cover and the degraded age are text in the accessible name rather than position or colour, so a reader who cannot see the layout still gets the relationship.",
      evidence: "care-team-presence.test.tsx",
    },
  ],

  fixtures: ["careTeamNightCoverage", "careTeamCoverageGap", "practitionerSigner"],

  examples: [
    {
      id: "not-a-green-dot",
      title: "In session is not away, and signed out is not offline",
      description:
        "Both of these people are at a computer and both would be a green dot. One must not be interrupted; the other is simply the wrong person, and the right one is named on the next line.",
      fixture: "careTeamNightCoverage",
      code: `<PresenceChip presence={{ clinician: marsh, state: "in-session", until: "15:50" }} />

<PresenceChip
  presence={{
    clinician: vance,
    state: "signed-out",
    coveredBy: boateng,
    until: "07:00",
  }}
/>`,
    },
    {
      id: "coverage-gap",
      title: "A hole in the rota is drawn as a hole",
      description:
        "Nothing covers 07:00–09:00. The resolver returns null rather than the nearest window, because filling a gap with a plausible name is how a page goes to somebody who is asleep.",
      fixture: "careTeamCoverageGap",
      code: `const windows = coverageFromCareTeam(careTeamCoverageGap.participant ?? []);

// 08:00 falls between the two windows.
<CoverageCard windows={windows} now="2026-08-24T08:00:00+05:30" />
// → "Nobody is covering right now. Escalate to the on-call supervisor."`,
    },
    {
      id: "escalation",
      title: "Do not disturb is a redirect, not a locked door",
      description:
        "A clinician in a group session with cover offers the cover. The same clinician with nobody covering offers an override — a second, deliberate action the host logs. Interrupting a group reaches eight patients rather than one, and the default has to reflect that.",
      fixture: "practitionerSigner",
      code: `resolveEscalation({ clinician: marsh, state: "in-group", coveredBy: okafor });
// → { kind: "covering", clinician: okafor, instead: marsh, reason: "L. Marsh, LCSW is in group" }

resolveEscalation({ clinician: marsh, state: "in-group" });
// → { kind: "override-required", … }`,
    },
    {
      id: "co-presence",
      title: "Told before you type, not at save",
      description:
        "A second note in the same encounter is a merge problem once both exist. Announced before the first keystroke, it is a choice between three reasonable options — and none of them is highlighted, because which is right depends on facts the component does not have.",
      fixture: "careTeamNightCoverage",
      code: `<ChartCoPresence
  others={[
    { clinician: marsh, activity: "documenting", since: "2026-08-24T09:12:00+05:30",
      target: "Progress note", unsigned: true },
  ]}
  now={serverTime}
  onOpenTheirs={openReadOnly}
  onRequestHandoff={requestHandoff}
  onSeparateAddendum={startAddendum}
/>`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["care-coordination", "chart-review"],
    alternatives: [
      { ref: "identity", when: "the identity that needs to be unambiguous is the patient's" },
    ],
  },

  seo: {
    slug: "care-team-presence",
    title: "Care Team Presence — on-call and coverage UI",
    description:
      "React presence for clinical teams: in session, on call, signed out to whom — plus rota coverage with a real gap state and chart co-presence conflicts.",
    primaryKeyword: "react care team presence",
    secondaryKeywords: [
      "on call coverage component",
      "clinician availability ui",
      "chart co-presence conflict",
      "healthcare presence indicator",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});
