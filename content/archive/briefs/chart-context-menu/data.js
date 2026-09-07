/* =====================================================================
   Fixtures. Six clinical nouns and the verbs that belong on each.

   These are the argument as much as the code is: a generic context menu
   has one action list, and a chart has one per resource type, per role,
   per state of the record. Everything here is synthetic — no real person,
   no real MRN.
   ===================================================================== */
(function (Ox) {
  "use strict";
  var D = {};
  Ox.data = D;

  function A(o) {
    return o;
  }

  /* ---------------------------------------------------------------- */
  /* MedicationRequest                                                 */
  /* ---------------------------------------------------------------- */
  D.medSubject = {
    resource: "MedicationRequest",
    id: "mr-4471",
    label: "Lisinopril 10 mg",
    detail: "Oral · daily · started 4 Mar 2026",
  };

  D.medActions = function () {
    return [
      A({ id: "open", label: "Open order", tier: "routine", icon: "open", shortcut: "↵" }),
      A({ id: "copy", label: "Copy as text", tier: "routine", icon: "copy", shortcut: "⌘C" }),
      A({ id: "hist", label: "Administration history", tier: "routine", icon: "clock" }),
      A({
        id: "mar",
        label: "Add a note to the MAR",
        tier: "documented",
        icon: "pen",
        applies: ["MedicationRequest"],
        records: "Writes a note on the medication record. Nursing sees it at the next round.",
      }),
      A({
        id: "pharm",
        label: "Flag for pharmacy review",
        tier: "documented",
        icon: "flag",
        applies: ["MedicationRequest"],
        records: "Creates a Task for pharmacy. It appears in their queue with your name on it.",
      }),
      A({
        id: "hold",
        label: "Hold until reviewed",
        tier: "clinical",
        icon: "stop",
        applies: ["MedicationRequest"],
        confirm: "Holds every remaining dose until a prescriber releases it.",
        confirmVerb: "Hold doses",
      }),
      A({
        id: "dc",
        label: "Discontinue",
        tier: "clinical",
        icon: "ban",
        applies: ["MedicationRequest"],
        confirm: "The next scheduled dose is 14:00 today. Discontinuing stops it.",
        confirmVerb: "Discontinue",
      }),
      A({
        id: "renew",
        label: "Renew for 90 days",
        tier: "clinical",
        icon: "undo",
        applies: ["MedicationRequest"],
        confirm: "Issues a new order in your name.",
        availability: {
          status: "unavailable",
          reason: "Prescriber role required — you are signed in as a registered nurse",
        },
      }),
      A({
        id: "delete",
        label: "Delete order",
        tier: "clinical",
        icon: "trash",
        confirm: "x",
        applies: ["MedicationRequest"],
        availability: { status: "withheld" },
      }),
    ];
  };

  /* ---------------------------------------------------------------- */
  /* Observation — a critical result, still preliminary                */
  /* ---------------------------------------------------------------- */
  D.obsSubject = {
    resource: "Observation",
    id: "obs-8812",
    label: "Potassium 6.8 mmol/L",
    detail: "Critical high · preliminary · 09:12 today",
  };

  D.obsActions = function () {
    return [
      A({ id: "open", label: "Open result", tier: "routine", icon: "open", shortcut: "↵" }),
      A({ id: "range", label: "Show reference range", tier: "routine", icon: "info" }),
      A({
        id: "trend",
        label: "Trend",
        tier: "routine",
        icon: "sort",
        submenu: [
          A({ id: "t7", label: "Last 7 days", tier: "routine" }),
          A({ id: "t30", label: "Last 30 days", tier: "routine" }),
          A({ id: "t365", label: "Last year", tier: "routine" }),
        ],
      }),
      A({
        id: "portal",
        label: "Release to patient portal",
        tier: "documented",
        icon: "share",
        applies: ["Observation"],
        records: "Publishes the value to the patient's portal immediately.",
        availability: {
          status: "unavailable",
          reason:
            "Preliminary results are not released. This one has not been verified by the lab.",
        },
      }),
      A({
        id: "annot",
        label: "Annotate result",
        tier: "documented",
        icon: "pen",
        applies: ["Observation"],
        records: "Attaches a comment to the result. Everyone who opens it sees it.",
      }),
      A({
        id: "ack",
        label: "Acknowledge critical result",
        tier: "clinical",
        icon: "check",
        applies: ["Observation"],
        confirm:
          "Acknowledgement is recorded against your name and stops the escalation page due at 09:42.",
        confirmVerb: "Acknowledge",
      }),
      A({
        id: "recheck",
        label: "Order a repeat now",
        tier: "clinical",
        icon: "flask",
        applies: ["Observation"],
        confirm: "Places a STAT potassium in your name.",
        confirmVerb: "Order STAT repeat",
        availability: { status: "unavailable", reason: "Prescriber role required" },
      }),
    ];
  };

  /* ---------------------------------------------------------------- */
  /* DocumentReference — a signed progress note                        */
  /* ---------------------------------------------------------------- */
  D.docSubject = {
    resource: "DocumentReference",
    id: "doc-2290",
    label: "Progress note — 28 Aug",
    detail: "Signed by K. Mbeki, LCSW · 42 CFR Part 2",
  };

  D.docActions = function () {
    return [
      A({ id: "open", label: "Open note", tier: "routine", icon: "open", shortcut: "↵" }),
      A({ id: "print", label: "Print", tier: "routine", icon: "print", shortcut: "⌘P" }),
      A({
        id: "adden",
        label: "Add an addendum",
        tier: "documented",
        icon: "pen",
        applies: ["DocumentReference"],
        records: "Appended and timestamped. The original text is never altered.",
      }),
      A({
        id: "amend",
        label: "Amend",
        tier: "clinical",
        icon: "note",
        applies: ["DocumentReference"],
        confirm: "An amendment supersedes the signed note. Both versions stay in the legal record.",
        confirmVerb: "Amend note",
      }),
      A({
        id: "retract",
        label: "Retract note",
        tier: "clinical",
        icon: "undo",
        applies: ["DocumentReference"],
        confirm:
          "A retracted note remains in the legal record with a retraction stamp. It is not deleted.",
        confirmVerb: "Retract",
      }),
      A({
        id: "part2",
        label: "Reveal Part 2 content",
        tier: "disclosive",
        icon: "key",
        applies: ["DocumentReference"],
        reasons: [
          "Treatment of this patient",
          "Medical emergency (42 CFR §2.51)",
          "Written patient consent on file",
          "Audit or evaluation",
        ],
      }),
      A({
        id: "share",
        label: "Send outside the organisation",
        tier: "disclosive",
        icon: "share",
        applies: ["DocumentReference"],
        reasons: ["Written patient consent on file", "Court order", "Medical emergency"],
        availability: {
          status: "unavailable",
          reason: "No consent on file for external disclosure",
        },
      }),
    ];
  };

  /* ---------------------------------------------------------------- */
  /* Patient — a worklist row                                          */
  /* ---------------------------------------------------------------- */
  D.patSubject = {
    resource: "Patient",
    id: "pt-3319",
    label: "Aluel Okonkwo",
    detail: "MRN 44-2871 · 34y · Intake 10:30",
    plural: "patients",
  };

  D.patActions = function (opts) {
    opts = opts || {};
    return [
      A({
        id: "open",
        label: "Open chart",
        tier: "routine",
        icon: "open",
        shortcut: "↵",
        bulk: "single",
      }),
      A({ id: "mrn", label: "Copy MRN", tier: "routine", icon: "copy", bulk: "allowed" }),
      A({ id: "call", label: "Call from the clinic line", tier: "routine", icon: "phone" }),
      A({
        id: "mine",
        label: "Add to my patients",
        tier: "documented",
        icon: "plus",
        applies: ["Patient"],
        bulk: "allowed",
        records: "Creates a treatment relationship. It is what scopes your searches.",
      }),
      A({
        id: "collateral",
        label: "Log a collateral contact",
        tier: "documented",
        icon: "users",
        applies: ["Patient"],
        records: "Recorded on the encounter and billable under the collateral code.",
      }),
      A({
        id: "msg",
        label: "Send a secure message",
        tier: "documented",
        icon: "bell",
        applies: ["Patient"],
        records: "Delivered to the portal inbox.",
        availability: opts.pending
          ? { status: "pending" }
          : {
              status: "unavailable",
              reason: "No portal account — enrolment was declined at intake",
            },
      }),
      A({
        id: "noshow",
        label: "Document a no-show",
        tier: "clinical",
        icon: "cal",
        applies: ["Patient"],
        confirm:
          "Records a missed appointment on today's encounter. Three of these trigger the discharge protocol.",
        confirmVerb: "Document no-show",
        bulk: opts.bulkNoShow ? "allowed" : "single",
        bulkConfirm:
          "This records a no-show on {n} patients. Each is written separately and each can fail separately.",
      }),
      A({
        id: "glass",
        label: "Break-glass open",
        tier: "disclosive",
        icon: "key",
        applies: ["Patient"],
        reasons: ["Medical emergency", "Covering clinician", "Patient explicitly asked me to look"],
      }),
    ];
  };

  /* ---------------------------------------------------------------- */
  /* AllergyIntolerance                                                */
  /* ---------------------------------------------------------------- */
  D.algSubject = {
    resource: "AllergyIntolerance",
    id: "alg-771",
    label: "Penicillin",
    detail: "Anaphylaxis · confirmed · reported by patient 2019",
  };

  D.algActions = function () {
    return [
      A({ id: "open", label: "Open allergy", tier: "routine", icon: "open" }),
      A({ id: "copy", label: "Copy", tier: "routine", icon: "copy" }),
      A({
        id: "detail",
        label: "Add reaction detail",
        tier: "documented",
        icon: "pen",
        applies: ["AllergyIntolerance"],
        records: "Appears on the allergy list and in every interaction check from now on.",
      }),
      A({
        id: "downgrade",
        label: "Downgrade to intolerance",
        tier: "clinical",
        icon: "sort",
        applies: ["AllergyIntolerance"],
        confirm: "An intolerance does not block a penicillin order. An anaphylaxis does.",
        confirmVerb: "Downgrade",
      }),
      A({
        id: "err",
        label: "Mark entered in error",
        tier: "clinical",
        icon: "ban",
        applies: ["AllergyIntolerance"],
        confirm: "Removes penicillin from interaction checking for every future order.",
        confirmVerb: "Mark in error",
      }),
    ];
  };

  /* ---------------------------------------------------------------- */
  /* View state — a checkbox / radio menu. Never above tier="routine".  */
  /* ---------------------------------------------------------------- */
  D.viewSubject = {
    resource: "Encounter",
    id: "col-vitals",
    label: "Vitals column",
    detail: "Flowsheet · 08:00–20:00",
  };

  D.viewActions = function () {
    return [
      A({
        id: "pin",
        label: "Pin this column",
        tier: "routine",
        icon: "flag",
        kind: "checkbox",
        checked: true,
      }),
      A({
        id: "abn",
        label: "Abnormal values only",
        tier: "routine",
        icon: "filter",
        kind: "checkbox",
        checked: false,
      }),
      A({
        id: "d-comfy",
        label: "Comfortable",
        tier: "routine",
        kind: "radio",
        radioGroup: "density",
        checked: true,
        group: "Density",
      }),
      A({
        id: "d-compact",
        label: "Compact",
        tier: "routine",
        kind: "radio",
        radioGroup: "density",
        checked: false,
        group: "Density",
      }),
      A({
        id: "d-tiny",
        label: "Dense",
        tier: "routine",
        kind: "radio",
        radioGroup: "density",
        checked: false,
        group: "Density",
      }),
      A({
        id: "export",
        label: "Export visible range",
        tier: "documented",
        icon: "share",
        applies: ["Encounter"],
        records: "Writes an export record naming you, the range and the row count.",
      }),
    ];
  };

  /* A deliberately wrong action list, for the validator figure. */
  D.badActions = [
    { id: "dc", label: "Discontinue", tier: "clinical" },
    {
      id: "reveal",
      label: "Reveal restricted note",
      tier: "disclosive",
      reasons: [],
      applies: ["DocumentReference"],
    },
    { id: "sign", label: "Sign and file", tier: "documented", applies: ["DocumentReference"] },
    {
      id: "dc",
      label: "Stop medication",
      tier: "clinical",
      confirm: "Stops it.",
      applies: ["MedicationRequest"],
    },
    {
      id: "bulkdc",
      label: "Discontinue all",
      tier: "clinical",
      confirm: "Stops them.",
      applies: ["MedicationRequest"],
      bulk: "allowed",
    },
    {
      id: "lock",
      label: "Lock the chart",
      tier: "clinical",
      kind: "checkbox",
      confirm: "Locks it.",
      applies: ["Patient"],
    },
  ];
})(window.Ox);
