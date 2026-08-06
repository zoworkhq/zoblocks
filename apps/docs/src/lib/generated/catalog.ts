// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md

import type { ComponentDoc } from "@oxygenui/component-meta";

export const CATALOG: ComponentDoc[] = [
  {
    "name": "absent-value",
    "title": "Absent Value",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "summary": "Renders absence as a statement. Withheld, not asked, declined, and errored are different facts and never share a dash.",
    "description": "Renders the absence of a clinical value as a statement rather than a blank. Distinguishes not-asked, declined, masked, pending, and error — reasons that mean different things and must not share a dash.",
    "rationale": "The smallest component in the library and one of the most consequential. A blank cell is indistinguishable from a rendering failure, a dash flattens fifteen FHIR reasons into one, and a zero is a value — reading “not measured” as 0 is a clinical error. This renders the reason instead, and keeps “the system does not have this” separate from “you are not allowed to see this”, which look identical in most products and mean opposite things at the bedside.",
    "categories": [
      "Primitive",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "dataAbsentReason",
        "url": "https://terminology.hl7.org/CodeSystem-data-absent-reason.html"
      }
    ],
    "resource": "dataAbsentReason",
    "resourceUrl": "https://terminology.hl7.org/CodeSystem-data-absent-reason.html",
    "states": [
      "Not recorded (no reason given)",
      "Not asked",
      "Declined to answer",
      "Result pending",
      "Hidden — restricted",
      "Unavailable — system error",
      "Not applicable"
    ],
    "props": [
      {
        "name": "detail",
        "type": "string | undefined",
        "description": "Free-text explanation from the source system. Shown alongside the label. Ignored for restricted reasons: source text on a masked value can itself describe what was masked, which defeats the masking. Failing closed here costs a little detail and prevents a disclosure.",
        "required": false
      },
      {
        "name": "field",
        "type": "string | undefined",
        "description": "The field this absence belongs to, e.g. \"Potassium\". Rendered as a screen-reader-only prefix so the announcement is \"Potassium, not asked\" rather than a bare \"not asked\". Omit it when the absence already sits in a cell associated with a row or column header, or the field name will be announced twice.",
        "required": false
      },
      {
        "name": "hideIcon",
        "type": "boolean | undefined",
        "description": "Hide the icon. Only when an adjacent icon already carries the meaning.",
        "required": false,
        "default": "false"
      },
      {
        "name": "onRequestAccess",
        "type": "(() => void) | undefined",
        "description": "Offer a way to request access. Rendered only for restricted reasons, since there is nothing to request when the data genuinely does not exist.",
        "required": false
      },
      {
        "name": "reason",
        "type": "CodeableConcept | AbsentReason | undefined",
        "description": "The FHIR `dataAbsentReason`, or a normalized reason directly. Omit it entirely and the component renders \"Not recorded\" — absence with no stated reason is itself a state, not a case to fall through.",
        "required": false
      },
      {
        "name": "requestAccessLabel",
        "type": "string | undefined",
        "description": "",
        "required": false,
        "default": "\"Request access\""
      },
      {
        "name": "variant",
        "type": "'inline' | 'block' | undefined",
        "description": "inline — flows with body text and table cells (default) block — a bordered region for a whole empty section",
        "required": false,
        "default": "\"inline\""
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLSpanElement>, \"children\">",
    "exports": [
      {
        "name": "AbsentValue",
        "props": [
          {
            "name": "detail",
            "type": "string | undefined",
            "description": "Free-text explanation from the source system. Shown alongside the label. Ignored for restricted reasons: source text on a masked value can itself describe what was masked, which defeats the masking. Failing closed here costs a little detail and prevents a disclosure.",
            "required": false
          },
          {
            "name": "field",
            "type": "string | undefined",
            "description": "The field this absence belongs to, e.g. \"Potassium\". Rendered as a screen-reader-only prefix so the announcement is \"Potassium, not asked\" rather than a bare \"not asked\". Omit it when the absence already sits in a cell associated with a row or column header, or the field name will be announced twice.",
            "required": false
          },
          {
            "name": "hideIcon",
            "type": "boolean | undefined",
            "description": "Hide the icon. Only when an adjacent icon already carries the meaning.",
            "required": false,
            "default": "false"
          },
          {
            "name": "onRequestAccess",
            "type": "(() => void) | undefined",
            "description": "Offer a way to request access. Rendered only for restricted reasons, since there is nothing to request when the data genuinely does not exist.",
            "required": false
          },
          {
            "name": "reason",
            "type": "CodeableConcept | AbsentReason | undefined",
            "description": "The FHIR `dataAbsentReason`, or a normalized reason directly. Omit it entirely and the component renders \"Not recorded\" — absence with no stated reason is itself a state, not a case to fall through.",
            "required": false
          },
          {
            "name": "requestAccessLabel",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"Request access\""
          },
          {
            "name": "variant",
            "type": "'inline' | 'block' | undefined",
            "description": "inline — flows with body text and table cells (default) block — a bordered region for a whole empty section",
            "required": false,
            "default": "\"inline\""
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLSpanElement>, \"children\">"
      }
    ],
    "usage": "import { AbsentValue } from \"@/components/oxygen/absent-value\";\n\n// From a FHIR payload — the reason is read and categorised for you.\n<AbsentValue field=\"Potassium\" reason={observation.dataAbsentReason} />\n\n// Or state it directly.\n<AbsentValue reason=\"masked\" onRequestAccess={requestAccess} />\n\n// Absence with no stated reason still renders text, never a blank.\n<AbsentValue />",
    "guidance": {
      "use": [
        "Everywhere a clinical value could be missing — cells, fields, and whole sections.",
        "With field set when the absence sits somewhere with no associated label.",
        "In place of any “—”, “N/A”, or empty string standing in for a clinical value."
      ],
      "avoid": [
        "As a permission check. It renders an outcome; the application decides who may see what.",
        "For a zero or a genuinely negative result. Those are values and belong in the value slot.",
        "Passing source text through detail on masked content — the component ignores it by design."
      ]
    },
    "accessibility": [
      {
        "label": "Never silent",
        "detail": "Always renders text. A screen-reader user landing in the cell hears a reason rather than skipping an empty element."
      },
      {
        "label": "Field prefix",
        "detail": "field adds a screen-reader-only prefix so the announcement is “Potassium, not asked” rather than a context-free “not asked”."
      },
      {
        "label": "Not colour alone",
        "detail": "Every reason carries an icon and a full-sentence label. The three tones are reinforcement, and the wording survives grayscale and forced-colors."
      }
    ],
    "limitations": [
      "Presentational only. It does not evaluate consent, security labels, or role — pass it the resolved reason.",
      "Restricted reasons deliberately drop source text, so a genuinely safe explanation is lost along with an unsafe one.",
      "The request-access affordance emits a callback; the access workflow itself is yours to build."
    ],
    "related": [
      "vitals-panel",
      "status-badge"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/absent-value.json"
  },
  {
    "name": "action-gate",
    "title": "Action Gate",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "pattern",
    "summary": "Two-step confirmation that names the consequence and the patient, then emits an audit event.",
    "description": "Two-step confirmation for consequential clinical actions. States the specific consequence and names the patient, escalates friction for irreversible actions, and emits a structured audit event.",
    "rationale": "The copy rule is the whole component: it states what will happen, to whom, and what cannot be undone. “Are you sure?” is not a confirmation — it asks the reader to re-derive the consequence they were already unsure about, which is why consequence and patientName exist as props. Friction is calibrated rather than maximised: too little and wrong-patient actions happen, too much and clinicians route around the system, which is worse because it moves the work somewhere you cannot see.",
    "categories": [
      "Primitive",
      "System"
    ],
    "fhir": [
      {
        "name": "AuditEvent",
        "url": "https://hl7.org/fhir/R4/auditevent.html"
      }
    ],
    "resource": "AuditEvent",
    "resourceUrl": "https://hl7.org/fhir/R4/auditevent.html",
    "states": [
      "Reversible confirm",
      "Irreversible type-to-confirm",
      "Hold-to-confirm",
      "Reason required",
      "In flight",
      "Cancelled"
    ],
    "props": [
      {
        "name": "action",
        "type": "string",
        "description": "Imperative name of the action. The same word appears on the trigger, in the dialog, and in the result — an action keeps its name throughout.",
        "required": true
      },
      {
        "name": "consequence",
        "type": "string",
        "description": "What actually happens, in plain language. Never \"Are you sure?\".",
        "required": true
      },
      {
        "name": "onConfirm",
        "type": "(event: ActionAuditEvent) => void | Promise<void>",
        "description": "",
        "required": true
      },
      {
        "name": "children",
        "type": "React.ReactNode",
        "description": "Rendered as the trigger. Defaults to a button labelled with the action.",
        "required": false
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "confirmPhrase",
        "type": "string | undefined",
        "description": "Phrase the user must type in \"type\" mode. Defaults to the action name.",
        "required": false
      },
      {
        "name": "destructive",
        "type": "boolean | undefined",
        "description": "",
        "required": false,
        "default": "false"
      },
      {
        "name": "mode",
        "type": "'confirm' | 'type' | 'hold' | undefined",
        "description": "Escalate friction. Defaults to \"confirm\" when reversible, \"type\" when not.",
        "required": false
      },
      {
        "name": "patientName",
        "type": "string | undefined",
        "description": "The patient affected. Acting on the wrong chart is the error being prevented.",
        "required": false
      },
      {
        "name": "reasons",
        "type": "string[] | undefined",
        "description": "Require a reason before proceeding. Recorded on the audit event.",
        "required": false
      },
      {
        "name": "reversible",
        "type": "boolean | undefined",
        "description": "",
        "required": false,
        "default": "true"
      }
    ],
    "exports": [
      {
        "name": "ActionGate",
        "props": [
          {
            "name": "action",
            "type": "string",
            "description": "Imperative name of the action. The same word appears on the trigger, in the dialog, and in the result — an action keeps its name throughout.",
            "required": true
          },
          {
            "name": "consequence",
            "type": "string",
            "description": "What actually happens, in plain language. Never \"Are you sure?\".",
            "required": true
          },
          {
            "name": "onConfirm",
            "type": "(event: ActionAuditEvent) => void | Promise<void>",
            "description": "",
            "required": true
          },
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "Rendered as the trigger. Defaults to a button labelled with the action.",
            "required": false
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "confirmPhrase",
            "type": "string | undefined",
            "description": "Phrase the user must type in \"type\" mode. Defaults to the action name.",
            "required": false
          },
          {
            "name": "destructive",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "mode",
            "type": "'confirm' | 'type' | 'hold' | undefined",
            "description": "Escalate friction. Defaults to \"confirm\" when reversible, \"type\" when not.",
            "required": false
          },
          {
            "name": "patientName",
            "type": "string | undefined",
            "description": "The patient affected. Acting on the wrong chart is the error being prevented.",
            "required": false
          },
          {
            "name": "reasons",
            "type": "string[] | undefined",
            "description": "Require a reason before proceeding. Recorded on the audit event.",
            "required": false
          },
          {
            "name": "reversible",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "true"
          }
        ]
      }
    ],
    "usage": "import { ActionGate } from \"@/components/oxygen/action-gate\";\n\n<ActionGate\n  action=\"Discontinue\"\n  consequence=\"Lisinopril 10 mg will stop immediately and no further doses will be dispensed.\"\n  patientName=\"Marisol Reyes-Okonkwo\"\n  reversible={false}\n  reasons={[\"Adverse reaction\", \"No longer indicated\", \"Patient request\"]}\n  onConfirm={(event) => auditLog.record(event)}\n/>",
    "guidance": {
      "use": [
        "Anything that changes a clinical record, medication, schedule commitment, or consent state.",
        "With reversible={false} and mode=\\u201ctype\\u201d for genuinely irreversible actions.",
        "With mode=\\u201chold\\u201d on dense screens where a stray double-click could commit."
      ],
      "avoid": [
        "Generic consequence text. If it does not name the effect, it is not a confirmation.",
        "Gating routine, reversible actions \\u2014 friction everywhere teaches people to click through.",
        "Assuming the audit event is stored. It is emitted; you persist it."
      ]
    },
    "accessibility": [
      {
        "label": "Focus managed",
        "detail": "Focus moves into the dialog on open and returns to the trigger on dismiss. Escape always exits."
      },
      {
        "label": "Consequence in the description",
        "detail": "The dialog is an alertdialog whose accessible description carries the consequence and the patient name, not just visible text."
      },
      {
        "label": "Hold has a keyboard path",
        "detail": "Hold-to-confirm works with Space and Enter, so it is never pointer-only."
      }
    ],
    "limitations": [
      "Emits an audit event; it does not persist one or guarantee delivery.",
      "No re-authentication step \\u2014 compose one around it where policy requires.",
      "Focus is managed but not fully trapped; a portal-based dialog is the next step."
    ],
    "related": [
      "restricted-shield",
      "status-badge"
    ],
    "dependencies": [
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/action-gate.json"
  },
  {
    "name": "alert-banner",
    "title": "Alert Banner",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "pattern",
    "summary": "Severity tiers as an interruption budget. Only critical may take focus.",
    "description": "Severity tiers as an interruption budget. Only critical may take focus, the specific finding is stated rather than a category, and dismissal captures a reason so rules can be measured.",
    "rationale": "Interruption is a scarce resource and every alert spends it. The failure mode of clinical alerting is not missing alerts, it is too many — fire enough and clinicians dismiss everything, including the one that mattered. So the tiers here are a budget rather than a palette. The specific finding is stated rather than the category, because “Potassium 6.8 — critical high” earns its interruption and “Abnormal result” does not. Dismissing a critical alert captures a reason, because an alert everyone silently clears should be retired and you cannot know that without the reasons.",
    "categories": [
      "Primitive",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "DetectedIssue",
        "url": "https://hl7.org/fhir/R4/detectedissue.html"
      }
    ],
    "resource": "DetectedIssue",
    "resourceUrl": "https://hl7.org/fhir/R4/detectedissue.html",
    "states": [
      "Critical",
      "High",
      "Moderate",
      "Low",
      "Info",
      "Dismissal with reason"
    ],
    "props": [
      {
        "name": "finding",
        "type": "string",
        "description": "The specific finding. Never a category like \"Abnormal result\".",
        "required": true
      },
      {
        "name": "actions",
        "type": "React.ReactNode",
        "description": "Inline actions. Responding should not require navigating away.",
        "required": false
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "detail",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "dismissReasons",
        "type": "string[] | undefined",
        "description": "Reasons offered when dismissing a critical alert. Dismissal without a reason is what makes alert performance unmeasurable.",
        "required": false
      },
      {
        "name": "onDismiss",
        "type": "((dismissal: AlertDismissal) => void) | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "severity",
        "type": "AlertSeverity | undefined",
        "description": "",
        "required": false,
        "default": "\"info\""
      },
      {
        "name": "source",
        "type": "string | undefined",
        "description": "Where it came from, so a clinician can judge it.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "AlertBanner",
        "props": [
          {
            "name": "finding",
            "type": "string",
            "description": "The specific finding. Never a category like \"Abnormal result\".",
            "required": true
          },
          {
            "name": "actions",
            "type": "React.ReactNode",
            "description": "Inline actions. Responding should not require navigating away.",
            "required": false
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "detail",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "dismissReasons",
            "type": "string[] | undefined",
            "description": "Reasons offered when dismissing a critical alert. Dismissal without a reason is what makes alert performance unmeasurable.",
            "required": false
          },
          {
            "name": "onDismiss",
            "type": "((dismissal: AlertDismissal) => void) | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "severity",
            "type": "AlertSeverity | undefined",
            "description": "",
            "required": false,
            "default": "\"info\""
          },
          {
            "name": "source",
            "type": "string | undefined",
            "description": "Where it came from, so a clinician can judge it.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { AlertBanner } from \"@/components/oxygen/alert-banner\";\n\n<AlertBanner\n  severity=\"critical\"\n  finding=\"Potassium 6.8 mmol/L — critical high\"\n  detail=\"Repeat sample and review cardiac monitoring.\"\n  source=\"Chemistry · resulted 06:42\"\n  dismissReasons={[\"Already actioned\", \"Known for this patient\", \"Not clinically relevant\"]}\n  onDismiss={(d) => alertMetrics.record(d)}\n/>",
    "guidance": {
      "use": [
        "Anywhere a clinical finding must be seen before the user proceeds.",
        "With the specific value and interpretation in finding.",
        "With dismissReasons on critical alerts, so rule performance is measurable."
      ],
      "avoid": [
        "Declaring everything critical. The tier is a budget and it is finite.",
        "Category text like \\u201cAbnormal result\\u201d \\u2014 it teaches dismissal without reading.",
        "Dismissal with no reason on a critical alert; that is how bad rules survive."
      ]
    },
    "accessibility": [
      {
        "label": "Tiered live regions",
        "detail": "Only critical is assertive. Everything else is polite and waits its turn in the reading order."
      },
      {
        "label": "Severity as a word",
        "detail": "The tier is in the accessible name, so it survives greyscale and forced-colors."
      },
      {
        "label": "Named dismiss",
        "detail": "The dismiss control names the alert it closes rather than being a bare X."
      }
    ],
    "limitations": [
      "Does not deduplicate or rank multiple simultaneous alerts \\u2014 compose a stack.",
      "Suppression across encounters is application state, not component state.",
      "Emits dismissal reasons; storing and analysing them is yours."
    ],
    "related": [
      "status-badge",
      "action-gate",
      "empty-state"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/alert-banner.json"
  },
  {
    "name": "allergy-list",
    "title": "Allergy List",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "Criticality and verification status, with no-known-allergies as its own state.",
    "description": "Allergies and intolerances from FHIR AllergyIntolerance. Distinguishes a recorded no-known-allergies assertion from an empty list, because one means asked-and-answered and the other means nobody asked.",
    "rationale": "Renders known allergies and intolerances with criticality, reaction manifestations, and verification status. The decision that matters most is what an empty list means: “no allergies recorded” and “no known allergies” are different clinical facts. The first means nobody has asked; the second means someone asked and documented the answer. Rendering them identically tells a clinician the patient is safe when the truth is the question was never put — so noKnownAllergies must be passed explicitly and is never inferred.",
    "categories": [
      "Clinical data",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "AllergyIntolerance",
        "url": "https://hl7.org/fhir/R4/allergyintolerance.html"
      }
    ],
    "resource": "AllergyIntolerance",
    "resourceUrl": "https://hl7.org/fhir/R4/allergyintolerance.html",
    "states": [
      "High risk",
      "Severe / moderate / mild reaction",
      "Risk not assessed",
      "Unconfirmed",
      "Refuted",
      "Inactive",
      "No known allergies",
      "Not recorded"
    ],
    "props": [
      {
        "name": "allergies",
        "type": "AllergyIntolerance[] | undefined",
        "description": "",
        "required": true
      },
      {
        "name": "hideInactive",
        "type": "boolean | undefined",
        "description": "Hide entries whose clinical status is inactive or resolved.",
        "required": false,
        "default": "false"
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "",
        "required": false,
        "default": "\"Allergies and intolerances\""
      },
      {
        "name": "loading",
        "type": "boolean | undefined",
        "description": "",
        "required": false,
        "default": "false"
      },
      {
        "name": "noKnownAllergies",
        "type": "boolean | undefined",
        "description": "Pass `true` only when a no-known-allergies assertion is actually recorded. Leaving this undefined with an empty list renders \"not recorded\", which is the safe reading — never assume silence means none.",
        "required": false
      }
    ],
    "extendsType": "React.HTMLAttributes<HTMLDivElement>",
    "exports": [
      {
        "name": "AllergyList",
        "props": [
          {
            "name": "allergies",
            "type": "AllergyIntolerance[] | undefined",
            "description": "",
            "required": true
          },
          {
            "name": "hideInactive",
            "type": "boolean | undefined",
            "description": "Hide entries whose clinical status is inactive or resolved.",
            "required": false,
            "default": "false"
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"Allergies and intolerances\""
          },
          {
            "name": "loading",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "noKnownAllergies",
            "type": "boolean | undefined",
            "description": "Pass `true` only when a no-known-allergies assertion is actually recorded. Leaving this undefined with an empty list renders \"not recorded\", which is the safe reading — never assume silence means none.",
            "required": false
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDivElement>"
      }
    ],
    "usage": "import { AllergyList } from \"@/components/oxygen/allergy-list\";\n\n<AllergyList\n  allergies={allergies}\n  // only when an assertion is actually on file\n  noKnownAllergies={patientHasNkaAssertion}\n/>",
    "guidance": {
      "use": [
        "On a chart header, pre-procedure checklist, or prescribing screen.",
        "With noKnownAllergies only when your data genuinely carries that assertion.",
        "Showing refuted entries rather than deleting them — de-prescribing depends on knowing an allergy was ruled out."
      ],
      "avoid": [
        "Inferring noKnownAllergies from an empty array. That is the exact error this component exists to prevent.",
        "Using it as an allergy-checking gate. It displays; it does not screen orders.",
        "hideInactive on a prescribing surface, where a resolved allergy is still relevant history."
      ]
    },
    "accessibility": [
      {
        "label": "High-risk announcement",
        "detail": "A live region states the high-risk count before the list is read."
      },
      {
        "label": "Distinct empty states",
        "detail": "No-known-allergies and not-recorded differ in icon, wording, and tone — not color alone."
      },
      {
        "label": "Verification never dropped",
        "detail": "Unconfirmed and refuted entries carry an explicit badge so they cannot be mistaken for confirmed allergies."
      }
    ],
    "limitations": [
      "Reaction onset and the free-text description are not rendered.",
      "Criticality falls back to worst observed reaction severity when absent — documented, but an approximation.",
      "No grouping by category (food, medication, environment)."
    ],
    "related": [
      "medication-card",
      "condition-list"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/allergy-list.json"
  },
  {
    "name": "app-shell",
    "title": "App Shell",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "pattern",
    "summary": "Navigation composed from permissions, patient context as a landmark, and guarded context changes.",
    "description": "Outermost frame composed from the user's permissions rather than rendered-then-disabled. Patient context is a landmark, context changes are guarded, and session expiry warns before it acts.",
    "rationale": "A prescriber, a scheduler, and a billing analyst need genuinely different products out of one codebase, so navigation is derived from permissions rather than rendered-then-disabled — a greyed-out “Prescribe” teaches a nurse the system is broken and teaches an auditor nothing. Patient context is a landmark rather than a breadcrumb, because which chart is open is a safety fact. Session expiry warns before it acts, because expiring a session under a half-written note is how documentation is lost to a policy timer.",
    "categories": [
      "Navigation",
      "System"
    ],
    "fhir": [
      {
        "name": "PractitionerRole",
        "url": "https://hl7.org/fhir/R4/practitionerrole.html"
      }
    ],
    "resource": "PractitionerRole",
    "resourceUrl": "https://hl7.org/fhir/R4/practitionerrole.html",
    "states": [
      "Role with full access",
      "Role with limited access",
      "No features enabled",
      "Session expiring",
      "Break-glass active",
      "Mobile navigation"
    ],
    "props": [
      {
        "name": "children",
        "type": "React.ReactNode",
        "description": "",
        "required": true
      },
      {
        "name": "items",
        "type": "NavItem[]",
        "description": "",
        "required": true
      },
      {
        "name": "scopes",
        "type": "string[]",
        "description": "Scopes the signed-in user actually holds, as resolved by the server.",
        "required": true
      },
      {
        "name": "actions",
        "type": "React.ReactNode",
        "description": "",
        "required": false
      },
      {
        "name": "brand",
        "type": "React.ReactNode",
        "description": "",
        "required": false
      },
      {
        "name": "breakGlassActive",
        "type": "boolean | undefined",
        "description": "Emergency access is in force. Marked persistently, not once at entry.",
        "required": false,
        "default": "false"
      },
      {
        "name": "breakGlassLabel",
        "type": "string | undefined",
        "description": "",
        "required": false,
        "default": "\"Emergency access\""
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "currentId",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "onExtendSession",
        "type": "(() => void) | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "onNavigate",
        "type": "((item: NavItem) => Promise<boolean> | boolean) | undefined",
        "description": "Called before a destination change so unsaved work can veto it.",
        "required": false
      },
      {
        "name": "patientContext",
        "type": "React.ReactNode",
        "description": "Persistent patient context. Rendered as a landmark, never dropped.",
        "required": false
      },
      {
        "name": "sessionSecondsRemaining",
        "type": "number | undefined",
        "description": "Seconds remaining in the session. Under the warning threshold it shows.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "AppShell",
        "props": [
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "",
            "required": true
          },
          {
            "name": "items",
            "type": "NavItem[]",
            "description": "",
            "required": true
          },
          {
            "name": "scopes",
            "type": "string[]",
            "description": "Scopes the signed-in user actually holds, as resolved by the server.",
            "required": true
          },
          {
            "name": "actions",
            "type": "React.ReactNode",
            "description": "",
            "required": false
          },
          {
            "name": "brand",
            "type": "React.ReactNode",
            "description": "",
            "required": false
          },
          {
            "name": "breakGlassActive",
            "type": "boolean | undefined",
            "description": "Emergency access is in force. Marked persistently, not once at entry.",
            "required": false,
            "default": "false"
          },
          {
            "name": "breakGlassLabel",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"Emergency access\""
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "currentId",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "onExtendSession",
            "type": "(() => void) | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "onNavigate",
            "type": "((item: NavItem) => Promise<boolean> | boolean) | undefined",
            "description": "Called before a destination change so unsaved work can veto it.",
            "required": false
          },
          {
            "name": "patientContext",
            "type": "React.ReactNode",
            "description": "Persistent patient context. Rendered as a landmark, never dropped.",
            "required": false
          },
          {
            "name": "sessionSecondsRemaining",
            "type": "number | undefined",
            "description": "Seconds remaining in the session. Under the warning threshold it shows.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { AppShell } from \"@/components/oxygen/app-shell\";\n\n<AppShell\n  scopes={user.scopes}\n  items={navItems}\n  currentId=\"worklist\"\n  patientContext={<PatientBanner patient={patient} />}\n  onNavigate={(item) => confirmLeave(\"Moving to \" + item.label)}\n  sessionSecondsRemaining={secondsLeft}\n>\n  {children}\n</AppShell>",
    "guidance": {
      "use": [
        "As the single outermost frame of a clinical application.",
        "With onNavigate wired to the unsaved-work guard.",
        "With requires set on every destination that is permission-gated."
      ],
      "avoid": [
        "Treating hidden navigation as access control. The server remains the authority.",
        "Dropping patient context on narrow screens \\u2014 it compresses, never disappears.",
        "Rendering permitted-but-disabled items. Absent is clearer and more auditable."
      ]
    },
    "accessibility": [
      {
        "label": "Correct landmarks",
        "detail": "Primary navigation, patient context, and main content are separate labelled landmarks."
      },
      {
        "label": "Counts in the name",
        "detail": "Badge counts are part of each link's accessible name, with urgent distinguished from unread."
      },
      {
        "label": "Provisioning failure is visible",
        "detail": "A role with nothing permitted says so rather than rendering an empty product."
      }
    ],
    "limitations": [
      "Does not implement routing \\u2014 it renders links and delegates to onNavigate.",
      "Session countdown is driven by the prop; the timer itself is yours.",
      "Multi-patient tab management is a separate component."
    ],
    "related": [
      "unsaved-guard",
      "patient-banner",
      "restricted-shield"
    ],
    "dependencies": [
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/app-shell.json"
  },
  {
    "name": "appointment-card",
    "title": "Appointment Card",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "Booked, pending, cancelled, no-show. Time zone is a required prop, not a guess.",
    "description": "Scheduled appointment from a FHIR Appointment resource. Time zone is a required prop rather than inferred from the browser, and no-show is treated as distinct from cancelled.",
    "rationale": "Renders a scheduled appointment with participants, timing, and status. Time zone is a required prop rather than an optional one, because defaulting to the browser's zone is how a clinic in one region books a patient in another for the wrong hour — and it is invisible in testing, since the developer and the test runner usually sit in the same zone as the clinic. Making the caller state the zone turns a silent class of bug into a compile error.",
    "categories": [
      "Scheduling"
    ],
    "fhir": [
      {
        "name": "Appointment",
        "url": "https://hl7.org/fhir/R4/appointment.html"
      }
    ],
    "resource": "Appointment",
    "resourceUrl": "https://hl7.org/fhir/R4/appointment.html",
    "states": [
      "Booked",
      "Pending",
      "Arrived",
      "Checked in",
      "Completed",
      "Cancelled",
      "No-show",
      "Waitlisted",
      "Virtual",
      "In person"
    ],
    "props": [
      {
        "name": "appointment",
        "type": "Appointment | undefined",
        "description": "",
        "required": true
      },
      {
        "name": "timeZone",
        "type": "string",
        "description": "IANA time zone the appointment time should be read in, e.g. \"Asia/Kolkata\". Required — see the note at the top of this file.",
        "required": true
      },
      {
        "name": "loading",
        "type": "boolean | undefined",
        "description": "",
        "required": false,
        "default": "false"
      },
      {
        "name": "locale",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "onSelect",
        "type": "((appointment: Appointment) => void) | undefined",
        "description": "",
        "required": false
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"onSelect\">",
    "exports": [
      {
        "name": "AppointmentCard",
        "props": [
          {
            "name": "appointment",
            "type": "Appointment | undefined",
            "description": "",
            "required": true
          },
          {
            "name": "timeZone",
            "type": "string",
            "description": "IANA time zone the appointment time should be read in, e.g. \"Asia/Kolkata\". Required — see the note at the top of this file.",
            "required": true
          },
          {
            "name": "loading",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "locale",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "onSelect",
            "type": "((appointment: Appointment) => void) | undefined",
            "description": "",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"onSelect\">"
      }
    ],
    "usage": "import { AppointmentCard } from \"@/components/oxygen/appointment-card\";\n\n<AppointmentCard\n  appointment={appointment}\n  timeZone={clinic.timeZone}   // required — never inferred\n  locale=\"en-IN\"\n/>",
    "guidance": {
      "use": [
        "On patient portals, provider schedules, and check-in flows.",
        "With the clinic's time zone on staff-facing screens, and the patient's on patient-facing ones.",
        "Keeping no-show entries visible — follow-up usually depends on them."
      ],
      "avoid": [
        "Passing the browser's zone as a shortcut. If you do not know the correct zone, that is a data problem to fix, not to paper over.",
        "As a booking control. This renders an appointment; it does not schedule one.",
        "Treating no-show as a cancellation. They differ operationally and the component keeps them apart."
      ]
    },
    "accessibility": [
      {
        "label": "Zone always visible",
        "detail": "The time-zone label renders next to the time. A time without one is an assumption the reader cannot check."
      },
      {
        "label": "Modality is text",
        "detail": "Virtual and in-person are labelled, not signalled by icon alone."
      },
      {
        "label": "Invalid zones degrade",
        "detail": "An unrecognised IANA zone falls back to locale formatting rather than throwing and blanking the screen."
      }
    ],
    "limitations": [
      "Renders start time and duration; recurring appointment rules are not expanded.",
      "Shows the first practitioner participant only.",
      "Location is not resolved from the participant reference."
    ],
    "related": [
      "patient-banner",
      "coverage-card"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/appointment-card.json"
  },
  {
    "name": "care-team",
    "title": "Care Team Panel",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "Everyone involved, and who is actually reachable now.",
    "description": "Everyone involved and who is actually reachable now. Coverage sits beside the assignment rather than replacing it, and non-clinical members are first-class.",
    "rationale": "The gap this closes is that the person on the record is frequently not the person to contact. A panel listing the assigned consultant at 2am with no indication they are off call is worse than no panel — it produces a confident call to a phone nobody is holding. So coverage sits beside the assignment rather than replacing it. Past members are kept as history, and caregivers, peer supports, and community health workers render with the same weight as clinicians, because in behavioral health and complex care they frequently are the team.",
    "categories": [
      "Patient identity",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "CareTeam",
        "url": "https://hl7.org/fhir/R4/careteam.html"
      }
    ],
    "resource": "CareTeam",
    "resourceUrl": "https://hl7.org/fhir/R4/careteam.html",
    "states": [
      "Current team",
      "Covered member",
      "Past members",
      "Non-clinical members",
      "No team recorded",
      "Role not recorded"
    ],
    "props": [
      {
        "name": "asOf",
        "type": "Date | undefined",
        "description": "",
        "required": false,
        "default": "new Date()"
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "contacts",
        "type": "Record<string, { phone?: string; onMessage?: () => void; }> | undefined",
        "description": "Contact routes by member reference or name.",
        "required": false,
        "default": "{}"
      },
      {
        "name": "coverage",
        "type": "Record<string, CoverageInfo> | undefined",
        "description": "Coverage by member reference or name. The record is not the roster.",
        "required": false,
        "default": "{}"
      },
      {
        "name": "extraMembers",
        "type": "CareTeamMember[] | undefined",
        "description": "Members not modelled in the CareTeam resource, e.g. community supports.",
        "required": false,
        "default": "[]"
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "",
        "required": false,
        "default": "\"Care team\""
      },
      {
        "name": "responsibleRef",
        "type": "string | undefined",
        "description": "Responsible clinician, pinned first.",
        "required": false
      },
      {
        "name": "showPast",
        "type": "boolean | undefined",
        "description": "",
        "required": false,
        "default": "true"
      },
      {
        "name": "team",
        "type": "CareTeam | undefined",
        "description": "",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "CareTeamPanel",
        "props": [
          {
            "name": "asOf",
            "type": "Date | undefined",
            "description": "",
            "required": false,
            "default": "new Date()"
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "contacts",
            "type": "Record<string, { phone?: string; onMessage?: () => void; }> | undefined",
            "description": "Contact routes by member reference or name.",
            "required": false,
            "default": "{}"
          },
          {
            "name": "coverage",
            "type": "Record<string, CoverageInfo> | undefined",
            "description": "Coverage by member reference or name. The record is not the roster.",
            "required": false,
            "default": "{}"
          },
          {
            "name": "extraMembers",
            "type": "CareTeamMember[] | undefined",
            "description": "Members not modelled in the CareTeam resource, e.g. community supports.",
            "required": false,
            "default": "[]"
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"Care team\""
          },
          {
            "name": "responsibleRef",
            "type": "string | undefined",
            "description": "Responsible clinician, pinned first.",
            "required": false
          },
          {
            "name": "showPast",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "true"
          },
          {
            "name": "team",
            "type": "CareTeam | undefined",
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { CareTeamPanel } from \"@/components/oxygen/care-team\";\n\n<CareTeamPanel\n  team={careTeam}\n  responsibleRef=\"Practitioner/bensouda\"\n  coverage={{ \"Practitioner/bensouda\": { coveringName: \"P. Ramanathan\", until: \"07:00\" } }}\n  contacts={{ \"Practitioner/bensouda\": { phone: \"+15551234567\" } }}\n/>",
    "guidance": {
      "use": [
        "On any chart where someone might need to contact the team.",
        "With coverage supplied from the on-call schedule, not the assignment record.",
        "With community and caregiver members passed through extraMembers."
      ],
      "avoid": [
        "Replacing the assigned clinician with the covering one. Both facts are needed.",
        "Deleting past members \\u2014 reviews ask who was involved and when.",
        "Demoting non-clinical members to a footnote."
      ]
    },
    "accessibility": [
      {
        "label": "Named actions",
        "detail": "Contact buttons say the action and the person, not just an icon."
      },
      {
        "label": "Avatars decorative",
        "detail": "Initials are hidden from assistive technology; the name carries meaning."
      },
      {
        "label": "Coverage is text",
        "detail": "Off-call status is a sentence, not a colour or a dimmed row."
      }
    ],
    "limitations": [
      "Coverage is caller-supplied \\u2014 there is no on-call schedule resolution here.",
      "Participants without a display name are skipped rather than shown as unknown.",
      "Does not model team hierarchy; order is source order with the responsible clinician pinned."
    ],
    "related": [
      "identity-token",
      "patient-snapshot",
      "app-shell"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/care-team.json"
  },
  {
    "name": "clinical-skeleton",
    "title": "Clinical Skeleton",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "summary": "Loading shaped like layout, never like a value — plus progressive sections that keep partial failure visible.",
    "description": "Loading placeholders shaped like layout, never like a value, plus a progressive section that keeps partial failure and stale cache visible instead of silently omitting content.",
    "rationale": "A skeleton shaped like a lab result invites the reader to fill in the blank, so these are shaped like layout: neutral bars of varying width, never like a number. The more important export is ProgressiveSection. Six source systems behind one screen is normal in healthcare and partial failure is the normal case, so the dangerous outcome is a screen that renders five sections and silently omits the sixth. A section is always in exactly one of four honest states, and failed and stale are visible facts rather than the absence of a fact.",
    "categories": [
      "Primitive",
      "System"
    ],
    "fhir": [],
    "states": [
      "Loading",
      "Loaded",
      "Failed with retry",
      "Stale while revalidating",
      "Reduced motion"
    ],
    "props": [
      {
        "name": "rows",
        "type": "number | undefined",
        "description": "Number of placeholder rows.",
        "required": false,
        "default": "3"
      },
      {
        "name": "variant",
        "type": "'text' | 'row' | 'card' | undefined",
        "description": "Match the shape of the content being replaced, to avoid layout shift.",
        "required": false,
        "default": "\"text\""
      }
    ],
    "extendsType": "React.HTMLAttributes<HTMLDivElement>",
    "exports": [
      {
        "name": "ClinicalSkeleton",
        "props": [
          {
            "name": "rows",
            "type": "number | undefined",
            "description": "Number of placeholder rows.",
            "required": false,
            "default": "3"
          },
          {
            "name": "variant",
            "type": "'text' | 'row' | 'card' | undefined",
            "description": "Match the shape of the content being replaced, to avoid layout shift.",
            "required": false,
            "default": "\"text\""
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDivElement>"
      },
      {
        "name": "ProgressiveSection",
        "props": [
          {
            "name": "label",
            "type": "string",
            "description": "Section name, used in the failure message.",
            "required": true
          },
          {
            "name": "state",
            "type": "SectionState",
            "description": "",
            "required": true
          },
          {
            "name": "cachedAtLabel",
            "type": "string | undefined",
            "description": "When cached content is shown while revalidating.",
            "required": false
          },
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "Optional: a section that is loading or has failed has nothing to render, and requiring a child there would force callers to pass a placeholder — which is the empty-looking failure this component exists to prevent.",
            "required": false
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "failureDetail",
            "type": "string | undefined",
            "description": "Why the source failed, in terms a clinician can act on.",
            "required": false
          },
          {
            "name": "onRetry",
            "type": "(() => void) | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "skeletonRows",
            "type": "number | undefined",
            "description": "",
            "required": false,
            "default": "3"
          },
          {
            "name": "skeletonVariant",
            "type": "'text' | 'row' | 'card' | undefined",
            "description": "",
            "required": false,
            "default": "\"text\""
          }
        ]
      }
    ],
    "usage": "import { ClinicalSkeleton, ProgressiveSection } from \"@/components/oxygen/clinical-skeleton\";\n\n<ProgressiveSection\n  state={medications.state}\n  label=\"Medications\"\n  failureDetail=\"The pharmacy system did not respond.\"\n  onRetry={medications.refetch}\n>\n  <MedicationList requests={medications.data} />\n</ProgressiveSection>",
    "guidance": {
      "use": [
        "Around every independently-fetched section on a composed clinical screen.",
        "With one section per source system, so one slow service does not block the rest.",
        "With state=\\u201cstale\\u201d whenever cached content is shown during revalidation."
      ],
      "avoid": [
        "Skeletons shaped like specific values \\u2014 that is the failure this prevents.",
        "A single page-level spinner for a screen backed by several sources.",
        "Rendering a failed section as empty. That is the harm ProgressiveSection exists to stop."
      ]
    },
    "accessibility": [
      {
        "label": "Announced once",
        "detail": "The skeleton is marked busy and announces once, not on every frame."
      },
      {
        "label": "Failure is assertive",
        "detail": "A failed section uses role=alert, because it changes what the reader can conclude from the screen."
      },
      {
        "label": "Reduced motion respected",
        "detail": "Shimmer is motion-safe only; reduced-motion users get a static placeholder."
      }
    ],
    "limitations": [
      "Does not fetch or retry on its own \\u2014 it renders the state you pass.",
      "No automatic timeout detection; decide when slow becomes failed.",
      "Skeleton shapes approximate layout and will not perfectly prevent shift in every composition."
    ],
    "related": [
      "empty-state",
      "density-provider",
      "vitals-panel"
    ],
    "dependencies": [
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/clinical-skeleton.json"
  },
  {
    "name": "clinical-time",
    "title": "Clinical Time",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "summary": "A clinical instant with a required time zone, honouring FHIR partial-date precision.",
    "description": "A clinical instant with a required time zone. Preserves FHIR partial-date precision, keeps absolute time always available, and flags future timestamps as the data errors they usually are.",
    "rationale": "timeZone is a required prop with no default, because the browser's zone is the wrong answer often enough to be dangerous. Relative time is an addition, never a replacement — “two hours ago” is useless in a handover and wrong in a medication record. Partial precision is preserved: rendering a year-only value as 1 January invents a day nobody recorded.",
    "categories": [
      "Primitive",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "dateTime · instant",
        "url": "https://hl7.org/fhir/R4/datatypes.html#dateTime"
      }
    ],
    "resource": "dateTime · instant",
    "resourceUrl": "https://hl7.org/fhir/R4/datatypes.html#dateTime",
    "states": [
      "Full instant",
      "Day precision",
      "Month precision",
      "Year precision",
      "Future timestamp",
      "Event vs recorded time",
      "No date"
    ],
    "props": [
      {
        "name": "timeZone",
        "type": "string",
        "description": "IANA time zone the instant should be read in, e.g. \"America/New_York\". Required — there is no safe default.",
        "required": true
      },
      {
        "name": "asOf",
        "type": "Date | undefined",
        "description": "Evaluation date. Pass a fixed date to keep tests and stories deterministic.",
        "required": false,
        "default": "new Date()"
      },
      {
        "name": "display",
        "type": "'absolute' | 'relative' | 'both' | undefined",
        "description": "absolute — date and time (default) relative — \"2 h ago\", with the absolute form in the accessible name both — absolute, with the relative form appended",
        "required": false,
        "default": "\"absolute\""
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "locale",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "recorded",
        "type": "string | undefined",
        "description": "When the event was recorded, if that differs from when it happened. A dose given at 08:00 and charted at 11:20 is two facts, not one.",
        "required": false
      },
      {
        "name": "showZone",
        "type": "boolean | undefined",
        "description": "Show the zone label, e.g. \"GMT-4\". Recommended wherever zones can differ.",
        "required": false,
        "default": "false"
      },
      {
        "name": "value",
        "type": "string | undefined",
        "description": "FHIR date, dateTime, or instant. Partial precision is honoured.",
        "required": false
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLElement>, \"children\">",
    "exports": [
      {
        "name": "ClinicalTime",
        "props": [
          {
            "name": "timeZone",
            "type": "string",
            "description": "IANA time zone the instant should be read in, e.g. \"America/New_York\". Required — there is no safe default.",
            "required": true
          },
          {
            "name": "asOf",
            "type": "Date | undefined",
            "description": "Evaluation date. Pass a fixed date to keep tests and stories deterministic.",
            "required": false,
            "default": "new Date()"
          },
          {
            "name": "display",
            "type": "'absolute' | 'relative' | 'both' | undefined",
            "description": "absolute — date and time (default) relative — \"2 h ago\", with the absolute form in the accessible name both — absolute, with the relative form appended",
            "required": false,
            "default": "\"absolute\""
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "locale",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "recorded",
            "type": "string | undefined",
            "description": "When the event was recorded, if that differs from when it happened. A dose given at 08:00 and charted at 11:20 is two facts, not one.",
            "required": false
          },
          {
            "name": "showZone",
            "type": "boolean | undefined",
            "description": "Show the zone label, e.g. \"GMT-4\". Recommended wherever zones can differ.",
            "required": false,
            "default": "false"
          },
          {
            "name": "value",
            "type": "string | undefined",
            "description": "FHIR date, dateTime, or instant. Partial precision is honoured.",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLElement>, \"children\">"
      }
    ],
    "usage": "import { ClinicalTime } from \"@/components/oxygen/clinical-time\";\n\n<ClinicalTime value=\"2026-08-03T07:40:00Z\" timeZone=\"America/New_York\" showZone />\n<ClinicalTime value=\"2026\" timeZone=\"UTC\" />  {/* renders \"2026\", not 1 January */}\n<ClinicalTime value={given} recorded={charted} timeZone={facilityZone} />",
    "guidance": {
      "use": [
        "Every clinical timestamp, with the facility or patient zone passed explicitly.",
        "With recorded set wherever charting time can differ from event time.",
        "With showZone on any surface where participants can be in different zones."
      ],
      "avoid": [
        "Relying on the browser zone. There is no default here on purpose.",
        "display=\\u201crelative\\u201d in handovers or medication records, where the absolute time is the point.",
        "Passing a pre-formatted string \\u2014 pass the raw FHIR value so precision survives."
      ]
    },
    "accessibility": [
      {
        "label": "Absolute always announced",
        "detail": "The accessible name carries the absolute date, time, and zone even when the visible text is relative."
      },
      {
        "label": "Real time element",
        "detail": "Renders a <time> element with a machine-readable dateTime attribute."
      },
      {
        "label": "Future flagged in text",
        "detail": "A future timestamp is labelled in words, not by colour alone."
      }
    ],
    "limitations": [
      "Relative phrasing is coarse by design and stops at 30 days.",
      "Daylight-saving ambiguity is not resolved \\u2014 the zone is applied as given.",
      "Relative display is ignored for year and month precision, which have no instant."
    ],
    "related": [
      "appointment-card",
      "vitals-panel",
      "patient-banner"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/clinical-time.json"
  },
  {
    "name": "clinical-value",
    "title": "Clinical Value",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "summary": "One measured quantity, unit, and comparator as a single atomic element that cannot drift apart.",
    "description": "One measured quantity, unit, comparator, and interpretation as a single atomic element. Preserves reported precision and never lets a value drift apart from its unit.",
    "rationale": "The bug this prevents is mundane and everywhere: a value and its unit as separate nodes, which drift apart under truncation, wrapping, or translation. Here they are one element. Precision is never changed — a lab that reported 5.10 meant three significant figures. Comparators survive, because a result of <0.01 is not 0.01. Absence routes to AbsentValue; there is no path that renders an empty string.",
    "categories": [
      "Primitive",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "Quantity",
        "url": "https://hl7.org/fhir/R4/datatypes.html#Quantity"
      }
    ],
    "resource": "Quantity",
    "resourceUrl": "https://hl7.org/fhir/R4/datatypes.html#Quantity",
    "states": [
      "Numeric with unit",
      "Comparator (<0.01)",
      "Non-numeric result",
      "Absent with a reason",
      "Absent with no reason",
      "Unit missing"
    ],
    "props": [
      {
        "name": "absentReason",
        "type": "CodeableConcept | undefined",
        "description": "Why the value is absent, when it is. Passed straight to AbsentValue. Absence is rendered as a statement, never as a blank or a dash.",
        "required": false
      },
      {
        "name": "bold",
        "type": "boolean | undefined",
        "description": "Emphasise the number. Used for critical results.",
        "required": false,
        "default": "false"
      },
      {
        "name": "field",
        "type": "string | undefined",
        "description": "Field name, used for the accessible name of an absent value.",
        "required": false
      },
      {
        "name": "hideUnit",
        "type": "boolean | undefined",
        "description": "Hide the unit. Only when a column header already carries it.",
        "required": false,
        "default": "false"
      },
      {
        "name": "quantity",
        "type": "Quantity | undefined",
        "description": "The measured quantity.",
        "required": false
      },
      {
        "name": "size",
        "type": "'sm' | 'md' | 'lg' | 'hero' | undefined",
        "description": "",
        "required": false,
        "default": "\"md\""
      },
      {
        "name": "text",
        "type": "string | undefined",
        "description": "Non-numeric result — a titre, an organism, \"Nonreactive\".",
        "required": false
      },
      {
        "name": "tone",
        "type": "ValueTone | undefined",
        "description": "",
        "required": false,
        "default": "\"default\""
      }
    ],
    "extendsType": "Omit< React.HTMLAttributes<HTMLSpanElement>, \"children\" >",
    "exports": [
      {
        "name": "ClinicalValue",
        "props": [
          {
            "name": "absentReason",
            "type": "CodeableConcept | undefined",
            "description": "Why the value is absent, when it is. Passed straight to AbsentValue. Absence is rendered as a statement, never as a blank or a dash.",
            "required": false
          },
          {
            "name": "bold",
            "type": "boolean | undefined",
            "description": "Emphasise the number. Used for critical results.",
            "required": false,
            "default": "false"
          },
          {
            "name": "field",
            "type": "string | undefined",
            "description": "Field name, used for the accessible name of an absent value.",
            "required": false
          },
          {
            "name": "hideUnit",
            "type": "boolean | undefined",
            "description": "Hide the unit. Only when a column header already carries it.",
            "required": false,
            "default": "false"
          },
          {
            "name": "quantity",
            "type": "Quantity | undefined",
            "description": "The measured quantity.",
            "required": false
          },
          {
            "name": "size",
            "type": "'sm' | 'md' | 'lg' | 'hero' | undefined",
            "description": "",
            "required": false,
            "default": "\"md\""
          },
          {
            "name": "text",
            "type": "string | undefined",
            "description": "Non-numeric result — a titre, an organism, \"Nonreactive\".",
            "required": false
          },
          {
            "name": "tone",
            "type": "ValueTone | undefined",
            "description": "",
            "required": false,
            "default": "\"default\""
          }
        ],
        "extendsType": "Omit< React.HTMLAttributes<HTMLSpanElement>, \"children\" >"
      }
    ],
    "usage": "import { ClinicalValue } from \"@/components/oxygen/clinical-value\";\n\n<ClinicalValue quantity={{ value: 6.8, unit: \"mmol/L\" }} tone=\"critical\" bold />\n<ClinicalValue quantity={{ value: 0.01, comparator: \"<\", unit: \"ng/mL\" }} />\n<ClinicalValue field=\"Magnesium\" absentReason={observation.dataAbsentReason} />",
    "guidance": {
      "use": [
        "Any place a measured quantity is displayed, in tables and in patient apps.",
        "With tone set from a resolved interpretation, never from a raw colour.",
        "With field set so an absent value announces which field it belongs to."
      ],
      "avoid": [
        "Re-rounding a value before passing it. Precision came from the source.",
        "Splitting the unit into a sibling element — that is the failure this exists to prevent.",
        "Using tone to convey severity on its own; pair it with a badge."
      ]
    },
    "accessibility": [
      {
        "label": "One accessible name",
        "detail": "The comparator, number, and expanded unit are announced as a single phrase, so a screen reader never reads a bare number."
      },
      {
        "label": "Unit expansion",
        "detail": "Common units are spoken in full — mg/dL and mmol/L differ by a factor that matters. Unknown units are announced as written rather than guessed at."
      },
      {
        "label": "Tabular figures",
        "detail": "Decimal points align down a column, which is what makes a dense results table scannable."
      }
    ],
    "limitations": [
      "Unit conversion is not performed. Convert upstream and pass the value you want shown.",
      "The spoken-unit table covers common units only; an unlisted unit is read as written.",
      "Tone is presentational \\u2014 it does not derive severity from the value."
    ],
    "related": [
      "absent-value",
      "reference-range",
      "vitals-panel"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/clinical-value.json"
  },
  {
    "name": "code-status",
    "title": "Code Status",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "Resuscitation status and directives. Unknown is loud, never a silent default to full code.",
    "description": "Resuscitation status, advance directives, and healthcare proxy. Unknown is a loud state, never a silent default to full code, and conflicting directives are surfaced rather than resolved.",
    "rationale": "The highest-consequence display in the library. A DNR order that is not visible during a code is a catastrophic failure of information design, and the failure mode is never a crash — it is a directive on file, one click away, that nobody found in eleven seconds. So unknown is a loud state rather than a default to full code, verification age is part of the status, and conflicting directives are surfaced as a question rather than resolved by silently picking the newer one.",
    "categories": [
      "Patient identity",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "Consent",
        "url": "https://hl7.org/fhir/R4/consent.html"
      }
    ],
    "resource": "Consent",
    "resourceUrl": "https://hl7.org/fhir/R4/consent.html",
    "states": [
      "Full code",
      "DNR",
      "DNR / DNI",
      "Comfort measures",
      "Not on file",
      "Verification stale",
      "Conflicting directives"
    ],
    "props": [
      {
        "name": "timeZone",
        "type": "string",
        "description": "",
        "required": true
      },
      {
        "name": "asOf",
        "type": "Date | undefined",
        "description": "",
        "required": false,
        "default": "new Date()"
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "conflicting",
        "type": "boolean | undefined",
        "description": "More than one directive is on file and they do not agree. Surfaced as a question, never resolved by picking the newer one.",
        "required": false,
        "default": "false"
      },
      {
        "name": "documents",
        "type": "{ id: string; title: string; onOpen?: () => void; }[] | undefined",
        "description": "Directive documents on file. Linked, not merely referenced.",
        "required": false
      },
      {
        "name": "locale",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "proxy",
        "type": "RelatedPerson | undefined",
        "description": "Healthcare proxy, with a contact route that works during an arrest.",
        "required": false
      },
      {
        "name": "proxyPhone",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "staleAfterDays",
        "type": "number | undefined",
        "description": "Days after which verification is considered stale by local policy.",
        "required": false,
        "default": "30"
      },
      {
        "name": "status",
        "type": "ResuscitationStatus | undefined",
        "description": "",
        "required": false,
        "default": "\"unknown\""
      },
      {
        "name": "verifiedAt",
        "type": "string | undefined",
        "description": "When the status was last verified, and by whom.",
        "required": false
      },
      {
        "name": "verifiedBy",
        "type": "string | undefined",
        "description": "",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "CodeStatus",
        "props": [
          {
            "name": "timeZone",
            "type": "string",
            "description": "",
            "required": true
          },
          {
            "name": "asOf",
            "type": "Date | undefined",
            "description": "",
            "required": false,
            "default": "new Date()"
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "conflicting",
            "type": "boolean | undefined",
            "description": "More than one directive is on file and they do not agree. Surfaced as a question, never resolved by picking the newer one.",
            "required": false,
            "default": "false"
          },
          {
            "name": "documents",
            "type": "{ id: string; title: string; onOpen?: () => void; }[] | undefined",
            "description": "Directive documents on file. Linked, not merely referenced.",
            "required": false
          },
          {
            "name": "locale",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "proxy",
            "type": "RelatedPerson | undefined",
            "description": "Healthcare proxy, with a contact route that works during an arrest.",
            "required": false
          },
          {
            "name": "proxyPhone",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "staleAfterDays",
            "type": "number | undefined",
            "description": "Days after which verification is considered stale by local policy.",
            "required": false,
            "default": "30"
          },
          {
            "name": "status",
            "type": "ResuscitationStatus | undefined",
            "description": "",
            "required": false,
            "default": "\"unknown\""
          },
          {
            "name": "verifiedAt",
            "type": "string | undefined",
            "description": "When the status was last verified, and by whom.",
            "required": false
          },
          {
            "name": "verifiedBy",
            "type": "string | undefined",
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { CodeStatus } from \"@/components/oxygen/code-status\";\n\n<CodeStatus\n  status=\"dnr-dni\"\n  verifiedAt=\"2026-07-12T09:00:00Z\"\n  verifiedBy=\"A. Bensouda, MD\"\n  timeZone=\"America/New_York\"\n  proxy={proxy}\n  proxyPhone=\"+15551234567\"\n/>",
    "guidance": {
      "use": [
        "High in the reading order of any summary, admission, or emergency surface.",
        "With verifiedAt always supplied \\u2014 an unverified directive is a different claim.",
        "With conflicting set when more than one directive exists and they disagree."
      ],
      "avoid": [
        "Defaulting status to full-code when nothing is found. That is a clinical decision.",
        "Hiding it behind a tab or a disclosure.",
        "Resolving conflicting directives programmatically."
      ]
    },
    "accessibility": [
      {
        "label": "First in reading order",
        "detail": "A labelled section placed early, so it is reached before the content it governs."
      },
      {
        "label": "Never colour alone",
        "detail": "Status is a full phrase; the DNR states are spelled out rather than abbreviated to a badge."
      },
      {
        "label": "Reachable proxy",
        "detail": "The proxy phone is a tel: link, usable one-handed during an arrest."
      }
    ],
    "limitations": [
      "Does not resolve conflicts or rank directives \\u2014 it surfaces them.",
      "Does not verify document validity across organisations.",
      "Status vocabulary is a fixed set; jurisdictional variants need mapping upstream."
    ],
    "related": [
      "patient-banner",
      "precautions-bar",
      "patient-snapshot"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/code-status.json"
  },
  {
    "name": "concept-chip",
    "title": "Concept Chip",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "summary": "A coded concept with its coding one interaction away, and honest about what is missing.",
    "description": "A coded clinical concept with its coding one interaction away. Marks text-only concepts, unrecognised systems, and codes outside an expected value set.",
    "rationale": "Clinicians read display text; integrations and audits need the code. Hiding the coding makes data problems undiagnosable, showing it inline makes every list unreadable, so it lives behind a disclosure. The useful behaviour is the honesty: text with no coding is marked as such, an unrecognised system shows its raw URI rather than being dressed up as standard, and a concept outside an expected value set is flagged so bad mappings become visible instead of accumulating.",
    "categories": [
      "Primitive",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "CodeableConcept",
        "url": "https://hl7.org/fhir/R4/datatypes.html#CodeableConcept"
      }
    ],
    "resource": "CodeableConcept",
    "resourceUrl": "https://hl7.org/fhir/R4/datatypes.html#CodeableConcept",
    "states": [
      "Coded concept",
      "Text only, no coding",
      "Multiple codings",
      "Unrecognised system",
      "Outside expected value set",
      "No concept recorded"
    ],
    "props": [
      {
        "name": "concept",
        "type": "CodeableConcept | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "expectedCodes",
        "type": "string[] | undefined",
        "description": "Codes the concept is expected to carry, as \"system|code\" or bare \"code\". A concept outside this set is flagged rather than silently accepted.",
        "required": false
      },
      {
        "name": "field",
        "type": "string | undefined",
        "description": "Field name for the accessible name when the chip stands alone.",
        "required": false
      },
      {
        "name": "readOnly",
        "type": "boolean | undefined",
        "description": "Render as plain text with no disclosure. For dense grids.",
        "required": false,
        "default": "false"
      },
      {
        "name": "showSystem",
        "type": "boolean | undefined",
        "description": "Show the terminology name inline, e.g. \"SNOMED CT · Hypertension\".",
        "required": false,
        "default": "false"
      },
      {
        "name": "size",
        "type": "'sm' | 'md' | undefined",
        "description": "",
        "required": false,
        "default": "\"sm\""
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLElement>, \"children\">",
    "exports": [
      {
        "name": "ConceptChip",
        "props": [
          {
            "name": "concept",
            "type": "CodeableConcept | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "expectedCodes",
            "type": "string[] | undefined",
            "description": "Codes the concept is expected to carry, as \"system|code\" or bare \"code\". A concept outside this set is flagged rather than silently accepted.",
            "required": false
          },
          {
            "name": "field",
            "type": "string | undefined",
            "description": "Field name for the accessible name when the chip stands alone.",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean | undefined",
            "description": "Render as plain text with no disclosure. For dense grids.",
            "required": false,
            "default": "false"
          },
          {
            "name": "showSystem",
            "type": "boolean | undefined",
            "description": "Show the terminology name inline, e.g. \"SNOMED CT · Hypertension\".",
            "required": false,
            "default": "false"
          },
          {
            "name": "size",
            "type": "'sm' | 'md' | undefined",
            "description": "",
            "required": false,
            "default": "\"sm\""
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLElement>, \"children\">"
      }
    ],
    "usage": "import { ConceptChip } from \"@/components/oxygen/concept-chip\";\n\n<ConceptChip concept={condition.code} />\n<ConceptChip concept={observation.code} showSystem />\n<ConceptChip concept={concept} expectedCodes={[\"http://loinc.org|2823-3\"]} />",
    "guidance": {
      "use": [
        "Problem lists, order details, and anywhere a coded concept is shown to a clinician.",
        "With expectedCodes on surfaces where mapping quality matters.",
        "With readOnly in virtualised grids, where a popover per row is unusable."
      ],
      "avoid": [
        "Rendering the system URI as though it were a friendly name. Unrecognised means unrecognised.",
        "Using it for concepts you never intend a user to inspect \\u2014 readOnly text is cheaper.",
        "Assuming a coded concept is valid because it renders. The chip shows what is there."
      ]
    },
    "accessibility": [
      {
        "label": "Button, not hover",
        "detail": "The disclosure is a real button with an expanded state, dismissible with Escape. Nothing is hover-only."
      },
      {
        "label": "Code out of the name",
        "detail": "The accessible name carries the concept text and any warning; system and code live inside the disclosure rather than crowding it."
      },
      {
        "label": "Warnings in text",
        "detail": "Text-only and out-of-value-set are labelled in words, never by colour alone."
      }
    ],
    "limitations": [
      "No terminology server lookup \\u2014 it displays what the payload carries.",
      "Post-coordinated SNOMED expressions render as their raw code.",
      "The recognised-system list is finite; extend it as your integrations grow."
    ],
    "related": [
      "condition-list",
      "vitals-panel",
      "status-badge"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/concept-chip.json"
  },
  {
    "name": "condition-list",
    "title": "Condition List",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "Problem list that separates active from resolved and never promotes a provisional diagnosis.",
    "description": "Problem list from FHIR Condition resources. Separates active from resolved, preserves vague onset as recorded, and never presents a provisional diagnosis as confirmed.",
    "rationale": "Renders a problem list from Condition resources. A problem list is not a log — its value comes from the reader telling at a glance which problems are current, so resolved and inactive entries are grouped separately rather than merely sorted below. Onset renders exactly as recorded: FHIR permits onsetString (“in childhood”) alongside onsetDateTime, and coercing a vague onset into a false precise date is a common and quietly damaging bug.",
    "categories": [
      "Clinical data",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "Condition",
        "url": "https://hl7.org/fhir/R4/condition.html"
      }
    ],
    "resource": "Condition",
    "resourceUrl": "https://hl7.org/fhir/R4/condition.html",
    "states": [
      "Active",
      "Recurrence",
      "Remission",
      "Resolved",
      "Inactive",
      "Provisional",
      "Differential",
      "Vague onset",
      "Onset not recorded"
    ],
    "props": [
      {
        "name": "conditions",
        "type": "Condition[] | undefined",
        "description": "",
        "required": true
      },
      {
        "name": "emptyMessage",
        "type": "string | undefined",
        "description": "",
        "required": false,
        "default": "\"No problems recorded.\""
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "",
        "required": false,
        "default": "\"Problem list\""
      },
      {
        "name": "loading",
        "type": "boolean | undefined",
        "description": "",
        "required": false,
        "default": "false"
      },
      {
        "name": "separateInactive",
        "type": "boolean | undefined",
        "description": "Render resolved and inactive problems in a separate, collapsed group.",
        "required": false,
        "default": "true"
      }
    ],
    "extendsType": "React.HTMLAttributes<HTMLDivElement>",
    "exports": [
      {
        "name": "ConditionList",
        "props": [
          {
            "name": "conditions",
            "type": "Condition[] | undefined",
            "description": "",
            "required": true
          },
          {
            "name": "emptyMessage",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"No problems recorded.\""
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"Problem list\""
          },
          {
            "name": "loading",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "separateInactive",
            "type": "boolean | undefined",
            "description": "Render resolved and inactive problems in a separate, collapsed group.",
            "required": false,
            "default": "true"
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDivElement>"
      }
    ],
    "usage": "import { ConditionList } from \"@/components/oxygen/condition-list\";\n\n<ConditionList\n  conditions={problems}\n  separateInactive\n/>",
    "guidance": {
      "use": [
        "On chart summaries, visit preparation, and handoff screens.",
        "With separateInactive on any screen where current problems drive the next action.",
        "Preserving your own clinical sort order — the component does not reorder within a group."
      ],
      "avoid": [
        "As an encounter diagnosis list. Encounter diagnoses are scoped to a visit, not to the patient.",
        "Hiding provisional diagnoses. Carrying one forward as settled fact is the harm; hiding it is not the fix.",
        "separateInactive off on dense clinical screens, where the split is what makes the list scannable."
      ]
    },
    "accessibility": [
      {
        "label": "Native disclosure",
        "detail": "The inactive group uses details/summary, so it is keyboard operable and announced without custom ARIA."
      },
      {
        "label": "Provisional is labelled",
        "detail": "Provisional and differential diagnoses carry an explicit badge rather than a subtle style difference."
      },
      {
        "label": "Onset honesty",
        "detail": "A vague onset renders as its recorded text; a missing one renders as explicitly not recorded."
      }
    ],
    "limitations": [
      "Body site, stage, and evidence are not rendered.",
      "No grouping by category (problem list item vs encounter diagnosis).",
      "Severity is matched on display text; coded severity value sets are not yet mapped."
    ],
    "related": [
      "allergy-list",
      "medication-card"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/condition-list.json"
  },
  {
    "name": "coverage-card",
    "title": "Coverage Card",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "Effective state derived from status and period together — an active record past its end date reads as lapsed.",
    "description": "Insurance coverage from a FHIR Coverage resource. Effective state is derived from status and period together, so a coverage marked active but past its end date reads as lapsed.",
    "rationale": "Renders insurance coverage with payer, plan, member and group identifiers, and the active period. A status of active is not sufficient to say a coverage is usable: a record can carry an active status while its period has already ended, and acting on lapsed coverage produces a denied claim and a surprise bill for the patient. The effective state is therefore derived from status and period together.",
    "categories": [
      "Billing and coverage"
    ],
    "fhir": [
      {
        "name": "Coverage",
        "url": "https://hl7.org/fhir/R4/coverage.html"
      }
    ],
    "resource": "Coverage",
    "resourceUrl": "https://hl7.org/fhir/R4/coverage.html",
    "states": [
      "Active",
      "Lapsed",
      "Not yet effective",
      "Cancelled",
      "Status unknown",
      "Masked identifiers"
    ],
    "props": [
      {
        "name": "coverage",
        "type": "Coverage | undefined",
        "description": "",
        "required": true
      },
      {
        "name": "asOf",
        "type": "Date | undefined",
        "description": "Date used to evaluate the coverage period. Pass a fixed date for deterministic tests.",
        "required": false,
        "default": "new Date()"
      },
      {
        "name": "loading",
        "type": "boolean | undefined",
        "description": "",
        "required": false,
        "default": "false"
      },
      {
        "name": "maskIdentifiers",
        "type": "boolean | undefined",
        "description": "Mask all but the last four characters of member and group identifiers.",
        "required": false,
        "default": "false"
      }
    ],
    "extendsType": "React.HTMLAttributes<HTMLDivElement>",
    "exports": [
      {
        "name": "CoverageCard",
        "props": [
          {
            "name": "coverage",
            "type": "Coverage | undefined",
            "description": "",
            "required": true
          },
          {
            "name": "asOf",
            "type": "Date | undefined",
            "description": "Date used to evaluate the coverage period. Pass a fixed date for deterministic tests.",
            "required": false,
            "default": "new Date()"
          },
          {
            "name": "loading",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "maskIdentifiers",
            "type": "boolean | undefined",
            "description": "Mask all but the last four characters of member and group identifiers.",
            "required": false,
            "default": "false"
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDivElement>"
      }
    ],
    "usage": "import { CoverageCard } from \"@/components/oxygen/coverage-card\";\n\n<CoverageCard\n  coverage={coverage}\n  maskIdentifiers={isSharedWorkstation}\n/>",
    "guidance": {
      "use": [
        "On registration, check-in, and billing screens.",
        "With maskIdentifiers on front-desk and shared workstations.",
        "Rendering every coverage in order — secondary coverage matters for coordination of benefits."
      ],
      "avoid": [
        "As an eligibility check. A rendered card is not a real-time eligibility response from the payer.",
        "Showing only the primary coverage. Dropping secondary coverage causes downstream billing errors.",
        "Trusting status alone in your own code — use coverageState from @oxygenui/fhir."
      ]
    },
    "accessibility": [
      {
        "label": "Lapsed is explicit",
        "detail": "A lapsed coverage adds a written instruction to verify eligibility, not just a red border."
      },
      {
        "label": "Masked identifiers",
        "detail": "Screen readers receive the last four characters and a statement that the value is masked."
      },
      {
        "label": "Absent fields",
        "detail": "Every unpopulated field renders as explicitly not recorded rather than as an empty cell."
      }
    ],
    "limitations": [
      "Renders payor[0] only; multi-payer coverage shows the first.",
      "Cost-to-beneficiary (copay, deductible) is not rendered.",
      "No eligibility or benefits verification — display only."
    ],
    "related": [
      "patient-banner",
      "appointment-card"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/coverage-card.json"
  },
  {
    "name": "density-provider",
    "title": "Density Provider",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "pattern",
    "summary": "Sets the spacing and target-size contract for a subtree. Density changes spacing, never which facts appear.",
    "description": "Sets the spacing and target-size contract for a subtree. Three modes, nestable, and clamped to the WCAG 2.2 target-size floor so clinical density can never shrink a control below the accessible minimum.",
    "rationale": "Density is a contract, not a preference. The same component serves a patient reading on a phone and a nurse scanning ninety rows, and the difference is spacing and target size — never which clinical facts appear. Hiding a fact to save a row is a defect, not a density mode. The provider also clamps to the WCAG 2.2 target-size floor rather than trusting every component to remember, and nests so a patient-facing card inside a clinical worklist keeps its own density.",
    "categories": [
      "Primitive",
      "System"
    ],
    "fhir": [],
    "states": [
      "Patient density",
      "Standard density",
      "Clinical density",
      "Nested providers",
      "Target-size floor enforced"
    ],
    "props": [
      {
        "name": "children",
        "type": "React.ReactNode",
        "description": "",
        "required": true
      },
      {
        "name": "density",
        "type": "Density",
        "description": "",
        "required": true
      },
      {
        "name": "asChild",
        "type": "boolean | undefined",
        "description": "Render without a wrapping element by cloning the single child. Use inside table rows and other places where an extra div would break layout.",
        "required": false,
        "default": "false"
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "DensityProvider",
        "props": [
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "",
            "required": true
          },
          {
            "name": "density",
            "type": "Density",
            "description": "",
            "required": true
          },
          {
            "name": "asChild",
            "type": "boolean | undefined",
            "description": "Render without a wrapping element by cloning the single child. Use inside table rows and other places where an extra div would break layout.",
            "required": false,
            "default": "false"
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          }
        ]
      },
      {
        "name": "DensityTarget",
        "props": [
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "",
            "required": true
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { DensityProvider, useDensity } from \"@/components/oxygen/density-provider\";\n\n<DensityProvider density=\"clinical\">\n  <ObservationPanel observations={observations} />\n</DensityProvider>\n\n// Components can adapt behaviour, not just spacing.\nconst density = useDensity();",
    "guidance": {
      "use": [
        "At the root of a worklist, flowsheet, or patient-facing surface.",
        "Nested, when a patient-facing card sits inside a clinical screen.",
        "With asChild inside table rows and other layout-sensitive containers."
      ],
      "avoid": [
        "Deriving density from the viewport. Density and breakpoint are independent axes.",
        "Using clinical density to fit more facts by hiding some. That is a defect.",
        "Assuming the floor makes any spacing safe \\u2014 it clamps targets, not text size."
      ]
    },
    "accessibility": [
      {
        "label": "Target-size floor",
        "detail": "Clinical density cannot shrink an interactive target below the WCAG 2.2 minimum of 24 CSS pixels. DensityTarget enforces it around any control."
      },
      {
        "label": "Independent of zoom",
        "detail": "Density is an author decision; user text scaling and zoom apply on top and are not overridden."
      },
      {
        "label": "No content hidden",
        "detail": "Spacing changes only. Nothing that is visible at patient density disappears at clinical density."
      }
    ],
    "limitations": [
      "Does not read OS accessibility preferences \\u2014 wire those into the density you pass.",
      "The floor applies to controls wrapped in DensityTarget, not automatically to every descendant.",
      "Token values come from @oxygenui/tokens; this sets the attribute and context, not the spacing scale."
    ],
    "related": [
      "vitals-panel",
      "clinical-skeleton"
    ],
    "dependencies": [
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/density-provider.json"
  },
  {
    "name": "dose-input",
    "title": "Dose Input",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "Dose entry with ISMP formatting rules, plausibility separated from hard limits, and visible arithmetic.",
    "description": "Numeric entry for doses with ISMP formatting rules, plausibility warnings separated from hard maximums, and weight-based calculation that shows its arithmetic.",
    "rationale": "One of the highest-consequence inputs in healthcare software, and a free-text number field is not an acceptable control for it. Three defences in order of harm prevented: ISMP formatting rules, because “1.0 mg” read past the decimal point is 10 mg; plausibility warnings kept separate from hard maximums, because a dose can be unusual and correct and conflating the two teaches prescribers to click through both; and weight-based calculation that keeps its inputs on screen, because a calculator returning a bare number invites use with a stale weight.",
    "categories": [
      "Primitive",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "Dosage",
        "url": "https://hl7.org/fhir/R4/dosage.html"
      }
    ],
    "resource": "Dosage",
    "resourceUrl": "https://hl7.org/fhir/R4/dosage.html",
    "states": [
      "Well-formed dose",
      "Trailing zero",
      "Missing leading zero",
      "Above plausible range",
      "Above absolute maximum",
      "Weight-based calculation",
      "No weight on file"
    ],
    "props": [
      {
        "name": "onChange",
        "type": "(value: string) => void",
        "description": "",
        "required": true
      },
      {
        "name": "units",
        "type": "string[]",
        "description": "Units permitted for this drug and route. Never a free list.",
        "required": true
      },
      {
        "name": "value",
        "type": "string",
        "description": "",
        "required": true
      },
      {
        "name": "absoluteMax",
        "type": "number | undefined",
        "description": "Documented hard maximum. Crossing this blocks, and the interface says what the maximum is rather than only refusing.",
        "required": false
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "disabled",
        "type": "boolean | undefined",
        "description": "",
        "required": false,
        "default": "false"
      },
      {
        "name": "dosePerKg",
        "type": "number | undefined",
        "description": "Weight-based dosing. Omit the weight and no calculation is offered.",
        "required": false
      },
      {
        "name": "id",
        "type": "string | undefined",
        "description": "",
        "required": false,
        "default": "\"ox-dose\""
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "",
        "required": false,
        "default": "\"Dose\""
      },
      {
        "name": "onUnitChange",
        "type": "((unit: string) => void) | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "plausibleMax",
        "type": "number | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "plausibleMin",
        "type": "number | undefined",
        "description": "Soft floor and ceiling. Crossing these warns with a stated reason and does NOT block — a dose can be unusual and correct.",
        "required": false
      },
      {
        "name": "unit",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "weightKg",
        "type": "number | undefined",
        "description": "",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "DoseInput",
        "props": [
          {
            "name": "onChange",
            "type": "(value: string) => void",
            "description": "",
            "required": true
          },
          {
            "name": "units",
            "type": "string[]",
            "description": "Units permitted for this drug and route. Never a free list.",
            "required": true
          },
          {
            "name": "value",
            "type": "string",
            "description": "",
            "required": true
          },
          {
            "name": "absoluteMax",
            "type": "number | undefined",
            "description": "Documented hard maximum. Crossing this blocks, and the interface says what the maximum is rather than only refusing.",
            "required": false
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "dosePerKg",
            "type": "number | undefined",
            "description": "Weight-based dosing. Omit the weight and no calculation is offered.",
            "required": false
          },
          {
            "name": "id",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"ox-dose\""
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"Dose\""
          },
          {
            "name": "onUnitChange",
            "type": "((unit: string) => void) | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "plausibleMax",
            "type": "number | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "plausibleMin",
            "type": "number | undefined",
            "description": "Soft floor and ceiling. Crossing these warns with a stated reason and does NOT block — a dose can be unusual and correct.",
            "required": false
          },
          {
            "name": "unit",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "weightKg",
            "type": "number | undefined",
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { DoseInput } from \"@/components/oxygen/dose-input\";\n\n<DoseInput\n  value={dose}\n  onChange={setDose}\n  units={[\"mg\", \"mL\"]}\n  plausibleMax={40}\n  absoluteMax={80}\n  dosePerKg={0.5}\n  weightKg={patientWeightKg}\n/>",
    "guidance": {
      "use": [
        "Any dose, weight, rate, or volume entry.",
        "With absoluteMax set from the drug reference, not from a guess.",
        "With weightKg wired to a recorded weight and left undefined when there is none."
      ],
      "avoid": [
        "Silently rewriting a typed dose. The corrected form is offered, never applied.",
        "Using plausibleMax as a hard stop \\u2014 unusual doses are sometimes correct.",
        "Substituting an average weight when none is recorded."
      ]
    },
    "accessibility": [
      {
        "label": "Messages bound to the field",
        "detail": "Every warning is associated through aria-describedby and announced on the input, not discovered at submit."
      },
      {
        "label": "Blocking states are alerts",
        "detail": "Crossing the absolute maximum uses role=alert and sets aria-invalid."
      },
      {
        "label": "No spinner",
        "detail": "A numeric keypad without increment controls, so a stray scroll cannot change a prescription."
      }
    ],
    "limitations": [
      "Plausibility bounds are supplied by the caller \\u2014 there is no built-in drug reference.",
      "Unit lists are caller-supplied; the component does not know which units suit a formulation.",
      "Override workflow for exceeding the maximum is yours to build; this blocks and explains."
    ],
    "related": [
      "clinical-value",
      "action-gate",
      "medication-card"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/dose-input.json"
  },
  {
    "name": "empty-state",
    "title": "Empty State",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "summary": "Five reasons a section shows nothing. An unavailable section is never rendered as an empty one.",
    "description": "Distinguishes never-recorded, filtered-to-empty, source-unavailable, restricted, and pending. An unavailable section is never rendered as an empty one.",
    "rationale": "Most products render one empty state. Never-recorded, filtered-to-empty, source-unavailable, restricted, and pending mean entirely different things, and conflating them has caused documented harm. Unavailable is the dangerous one: a section that failed to load and renders as “no results” tells a clinician the patient has no allergies when the allergy service was simply down. title is required rather than defaulted, because the correct sentence for an empty allergy list is not the correct sentence for an empty problem list.",
    "categories": [
      "Primitive",
      "System"
    ],
    "fhir": [],
    "states": [
      "Never recorded",
      "Filtered to empty",
      "Source unavailable",
      "Restricted",
      "Pending",
      "Compact"
    ],
    "props": [
      {
        "name": "title",
        "type": "string",
        "description": "Required. There is no safe default: the correct sentence for an empty allergy list is not the correct sentence for an empty problem list, and getting it wrong asserts a clinical negative.",
        "required": true
      },
      {
        "name": "action",
        "type": "React.ReactNode",
        "description": "",
        "required": false
      },
      {
        "name": "compact",
        "type": "boolean | undefined",
        "description": "Single-line rendering for table cells and clinical density.",
        "required": false,
        "default": "false"
      },
      {
        "name": "description",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "lastCheckedLabel",
        "type": "string | undefined",
        "description": "When the source was last successfully read. An empty list without this is indistinguishable from a current one, and staleness is clinical.",
        "required": false
      },
      {
        "name": "reason",
        "type": "EmptyReason | undefined",
        "description": "",
        "required": false,
        "default": "\"never\""
      }
    ],
    "extendsType": "React.HTMLAttributes<HTMLDivElement>",
    "exports": [
      {
        "name": "EmptyState",
        "props": [
          {
            "name": "title",
            "type": "string",
            "description": "Required. There is no safe default: the correct sentence for an empty allergy list is not the correct sentence for an empty problem list, and getting it wrong asserts a clinical negative.",
            "required": true
          },
          {
            "name": "action",
            "type": "React.ReactNode",
            "description": "",
            "required": false
          },
          {
            "name": "compact",
            "type": "boolean | undefined",
            "description": "Single-line rendering for table cells and clinical density.",
            "required": false,
            "default": "false"
          },
          {
            "name": "description",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "lastCheckedLabel",
            "type": "string | undefined",
            "description": "When the source was last successfully read. An empty list without this is indistinguishable from a current one, and staleness is clinical.",
            "required": false
          },
          {
            "name": "reason",
            "type": "EmptyReason | undefined",
            "description": "",
            "required": false,
            "default": "\"never\""
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDivElement>"
      }
    ],
    "usage": "import { EmptyState } from \"@/components/oxygen/empty-state\";\n\n<EmptyState\n  reason=\"never\"\n  title=\"No allergy information recorded\"\n  description=\"This is not the same as no known allergies. Ask and record before prescribing.\"\n/>\n\n<EmptyState reason=\"unavailable\" title=\"Allergies could not be loaded\" lastCheckedLabel=\"Last read 08:41\" />",
    "guidance": {
      "use": [
        "Every list, table, and section that can render nothing.",
        "With reason=\\u201cunavailable\\u201d whenever a fetch failed, never \\u201cnever\\u201d.",
        "With lastCheckedLabel wherever staleness would change a clinical reading."
      ],
      "avoid": [
        "Asserting a clinical negative. \\u201cNo allergies recorded\\u201d is safe; \\u201cNo allergies\\u201d is a claim.",
        "Reusing one empty state for a failed fetch and a genuinely empty list.",
        "Illustration-led empty states on clinical surfaces \\u2014 the sentence is the content."
      ]
    },
    "accessibility": [
      {
        "label": "Filtered emptiness announced",
        "detail": "Emptiness that follows a user action uses a polite live region; emptiness that was always there does not, because it is not news."
      },
      {
        "label": "Icon decorative",
        "detail": "The glyph is hidden from assistive technology. The message carries the meaning."
      },
      {
        "label": "Reason exposed",
        "detail": "data-empty-reason is on the element for testing and for styling without re-deriving state."
      }
    ],
    "limitations": [
      "Copy is yours \\u2014 the component enforces the distinction, not the wording.",
      "No retry behaviour built in; pass an action.",
      "Does not detect its own reason; the caller knows why the section is empty."
    ],
    "related": [
      "absent-value",
      "clinical-skeleton",
      "restricted-shield"
    ],
    "dependencies": [
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/empty-state.json"
  },
  {
    "name": "error-boundary",
    "title": "Error Boundary",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "pattern",
    "summary": "Contains a failure to one section and never renders a partial record as a complete one.",
    "description": "Contains a failure to one section and never renders a partial record as a complete one. Reports without PHI, and marks boundaries whose failure invalidates the surrounding screen.",
    "rationale": "The dangerous case is not a blank screen but a chart rendering five of a patient's eight medications with nothing to indicate the other three failed. A blank screen is obviously broken; a partial render looks complete and gets acted on. Critical boundaries — a patient banner, a code-status display — are marked as such because their absence changes what the reader can safely conclude from everything around them. PHI never leaves in a report: React error messages routinely embed props, and props here are patient data.",
    "categories": [
      "Primitive",
      "System"
    ],
    "fhir": [
      {
        "name": "OperationOutcome",
        "url": "https://hl7.org/fhir/R4/operationoutcome.html"
      }
    ],
    "resource": "OperationOutcome",
    "resourceUrl": "https://hl7.org/fhir/R4/operationoutcome.html",
    "states": [
      "Healthy",
      "Section failed",
      "Critical boundary failed",
      "Retried"
    ],
    "props": [
      {
        "name": "children",
        "type": "React.ReactNode",
        "description": "",
        "required": true
      },
      {
        "name": "label",
        "type": "string",
        "description": "Section name, used in the message. \"Medications\", not \"MedListView\".",
        "required": true
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "critical",
        "type": "boolean | undefined",
        "description": "Marks a boundary whose failure invalidates the surrounding screen — the patient banner, code status, an allergy list. These say so loudly.",
        "required": false
      },
      {
        "name": "onError",
        "type": "((report: ErrorReport) => void) | undefined",
        "description": "Reported without PHI. React error messages routinely embed props, and props here are patient data, so only the reference and boundary are sent.",
        "required": false
      },
      {
        "name": "onRetry",
        "type": "(() => void) | undefined",
        "description": "",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "ClinicalErrorBoundary",
        "props": [
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "",
            "required": true
          },
          {
            "name": "label",
            "type": "string",
            "description": "Section name, used in the message. \"Medications\", not \"MedListView\".",
            "required": true
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "critical",
            "type": "boolean | undefined",
            "description": "Marks a boundary whose failure invalidates the surrounding screen — the patient banner, code status, an allergy list. These say so loudly.",
            "required": false
          },
          {
            "name": "onError",
            "type": "((report: ErrorReport) => void) | undefined",
            "description": "Reported without PHI. React error messages routinely embed props, and props here are patient data, so only the reference and boundary are sent.",
            "required": false
          },
          {
            "name": "onRetry",
            "type": "(() => void) | undefined",
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { ClinicalErrorBoundary } from \"@/components/oxygen/error-boundary\";\n\n<ClinicalErrorBoundary label=\"Medications\" onError={report}>\n  <MedicationList requests={medications} />\n</ClinicalErrorBoundary>\n\n<ClinicalErrorBoundary label=\"Patient banner\" critical>\n  <PatientBanner patient={patient} />\n</ClinicalErrorBoundary>",
    "guidance": {
      "use": [
        "Around every independently-rendered clinical section.",
        "With critical on identity, code status, and allergy surfaces.",
        "With onError wired to monitoring that you have confirmed scrubs PHI."
      ],
      "avoid": [
        "One boundary around the whole page \\u2014 that is the blank screen this avoids.",
        "Rendering null on error. There is deliberately no silent path.",
        "Passing the raw error to a logger without checking what it contains."
      ]
    },
    "accessibility": [
      {
        "label": "Assertive",
        "detail": "Failures use role=alert, because they change what the reader can conclude from the screen."
      },
      {
        "label": "Quotable reference",
        "detail": "A short reference id the user can read aloud to support, with no stack trace or PHI."
      },
      {
        "label": "Retry is a real control",
        "detail": "Recovery is a labelled button, not a page reload instruction."
      }
    ],
    "limitations": [
      "React error boundaries do not catch errors in event handlers or async code.",
      "PHI scrubbing covers what this sends; your monitoring pipeline is still yours to verify.",
      "Reset re-mounts children; it does not re-fetch unless onRetry does."
    ],
    "related": [
      "clinical-skeleton",
      "empty-state"
    ],
    "dependencies": [
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/error-boundary.json"
  },
  {
    "name": "identity-token",
    "title": "Identity Token",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "summary": "Compact, privacy-aware representation of a person, built around confirming rather than labelling.",
    "description": "Compact, privacy-aware representation of a person. Photos require asserted consent, deceased and restricted are text, and initials infer nothing demographic.",
    "rationale": "Wrong-patient error begins with an identity affordance that looked close enough. A photo renders only when consent is explicitly asserted — the component will not infer consent from a photo being present in the resource. A secondary identifier shows by default, because a name alone does not distinguish two people called J. Patel. Initials and colour derive from the characters of the name only; an avatar is not a classifier.",
    "categories": [
      "Primitive",
      "Patient identity"
    ],
    "fhir": [
      {
        "name": "Patient",
        "url": "https://hl7.org/fhir/R4/patient.html"
      }
    ],
    "resource": "Patient",
    "resourceUrl": "https://hl7.org/fhir/R4/patient.html",
    "states": [
      "Complete identity",
      "Name not recorded",
      "Restricted record",
      "Deceased",
      "Photo without consent",
      "Name-alike collision",
      "Masked identifiers"
    ],
    "props": [
      {
        "name": "asOf",
        "type": "Date | undefined",
        "description": "",
        "required": false,
        "default": "new Date()"
      },
      {
        "name": "avatarOnly",
        "type": "boolean | undefined",
        "description": "Avatar only. The name still reaches assistive technology.",
        "required": false,
        "default": "false"
      },
      {
        "name": "identifierLabel",
        "type": "string | undefined",
        "description": "",
        "required": false,
        "default": "\"MRN\""
      },
      {
        "name": "identifierSystem",
        "type": "string | undefined",
        "description": "Identifier system to display, e.g. your MRN system.",
        "required": false
      },
      {
        "name": "maskIdentifiers",
        "type": "boolean | undefined",
        "description": "Mask all but the last four characters. For shared and public screens.",
        "required": false,
        "default": "false"
      },
      {
        "name": "nameAlike",
        "type": "boolean | undefined",
        "description": "Another patient in the same view whose name is confusingly similar. Renders an explicit warning — name-alike collisions are a list-level fact that an item-level component cannot detect on its own.",
        "required": false,
        "default": "false"
      },
      {
        "name": "patient",
        "type": "Patient | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "photoConsent",
        "type": "boolean | undefined",
        "description": "Show the patient's photo. Requires an explicit assertion that the patient consented to it being displayed — the component will not infer consent from the photo simply being present in the resource.",
        "required": false,
        "default": "false"
      },
      {
        "name": "showDetail",
        "type": "boolean | undefined",
        "description": "Show age and secondary identifier under the name.",
        "required": false,
        "default": "true"
      },
      {
        "name": "size",
        "type": "'sm' | 'md' | 'lg' | undefined",
        "description": "",
        "required": false,
        "default": "\"md\""
      }
    ],
    "extendsType": "React.HTMLAttributes<HTMLDivElement>",
    "exports": [
      {
        "name": "IdentityToken",
        "props": [
          {
            "name": "asOf",
            "type": "Date | undefined",
            "description": "",
            "required": false,
            "default": "new Date()"
          },
          {
            "name": "avatarOnly",
            "type": "boolean | undefined",
            "description": "Avatar only. The name still reaches assistive technology.",
            "required": false,
            "default": "false"
          },
          {
            "name": "identifierLabel",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"MRN\""
          },
          {
            "name": "identifierSystem",
            "type": "string | undefined",
            "description": "Identifier system to display, e.g. your MRN system.",
            "required": false
          },
          {
            "name": "maskIdentifiers",
            "type": "boolean | undefined",
            "description": "Mask all but the last four characters. For shared and public screens.",
            "required": false,
            "default": "false"
          },
          {
            "name": "nameAlike",
            "type": "boolean | undefined",
            "description": "Another patient in the same view whose name is confusingly similar. Renders an explicit warning — name-alike collisions are a list-level fact that an item-level component cannot detect on its own.",
            "required": false,
            "default": "false"
          },
          {
            "name": "patient",
            "type": "Patient | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "photoConsent",
            "type": "boolean | undefined",
            "description": "Show the patient's photo. Requires an explicit assertion that the patient consented to it being displayed — the component will not infer consent from the photo simply being present in the resource.",
            "required": false,
            "default": "false"
          },
          {
            "name": "showDetail",
            "type": "boolean | undefined",
            "description": "Show age and secondary identifier under the name.",
            "required": false,
            "default": "true"
          },
          {
            "name": "size",
            "type": "'sm' | 'md' | 'lg' | undefined",
            "description": "",
            "required": false,
            "default": "\"md\""
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDivElement>"
      }
    ],
    "usage": "import { IdentityToken } from \"@/components/oxygen/identity-token\";\n\n<IdentityToken patient={patient} identifierSystem={MRN_SYSTEM} />\n<IdentityToken patient={patient} maskIdentifiers avatarOnly />\n<IdentityToken patient={patient} nameAlike />",
    "guidance": {
      "use": [
        "Worklists, care-team panels, search results, and anywhere a person is named.",
        "With nameAlike set by the list when two entries are confusable.",
        "With maskIdentifiers on shared workstations and public-facing screens."
      ],
      "avoid": [
        "Passing photoConsent as a constant true. It is an assertion about the patient, not a display preference.",
        "Using the avatar colour to mean anything. It is decorative and stable, nothing more.",
        "Omitting the identifier in a list where two patients could share a name."
      ]
    },
    "accessibility": [
      {
        "label": "Full name never truncated",
        "detail": "The visible name may truncate; the accessible name carries the whole identity, age, identifier, and flags as one phrase."
      },
      {
        "label": "Flags as text",
        "detail": "Restricted and deceased are words, not icons a reader has to know. Photos carry empty alt because the adjacent name is the label."
      },
      {
        "label": "Name-alike announced",
        "detail": "The collision warning is in the accessible name, not conveyed by styling alone."
      }
    ],
    "limitations": [
      "Name-alike detection is list-level; the component renders the warning but cannot detect the collision itself.",
      "Age precision uses birthDate only \\u2014 sub-day precision for neonates needs a birth time the resource rarely carries.",
      "Initial derivation is Latin-script-biased for multi-word names, though single tokens work in any script."
    ],
    "related": [
      "patient-banner",
      "absent-value",
      "restricted-shield"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/identity-token.json"
  },
  {
    "name": "medication-card",
    "title": "Medication Card",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "Dose, route, schedule, and status. Held, stopped, and expired are distinct — not one greyed-out style.",
    "description": "Medication order from a FHIR MedicationRequest. On-hold, stopped, completed, and expired each get their own label and tone rather than one greyed-out style, because they lead to opposite next actions.",
    "rationale": "Renders a medication order with its dosage instruction and status. The design problem is status: most implementations collapse on-hold, stopped, completed, and expired into a single muted treatment, which loses the difference between a drug a clinician deliberately paused and one that simply ran out of refills. Those lead to opposite next actions, so each gets its own label and tone. Expired is derived rather than stored — FHIR has no expired status, so an order still marked active past its dispense validity period is surfaced as expired instead of presented as current.",
    "categories": [
      "Medication",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "MedicationRequest",
        "url": "https://hl7.org/fhir/R4/medicationrequest.html"
      }
    ],
    "resource": "MedicationRequest",
    "resourceUrl": "https://hl7.org/fhir/R4/medicationrequest.html",
    "states": [
      "Active",
      "On hold",
      "Stopped",
      "Cancelled",
      "Completed",
      "Expired",
      "Draft",
      "Entered in error",
      "No dosage recorded"
    ],
    "props": [
      {
        "name": "request",
        "type": "MedicationRequest | undefined",
        "description": "FHIR R4 MedicationRequest.",
        "required": true
      },
      {
        "name": "asOf",
        "type": "Date | undefined",
        "description": "Date used to evaluate expiry. Pass a fixed date to keep tests deterministic.",
        "required": false,
        "default": "new Date()"
      },
      {
        "name": "loading",
        "type": "boolean | undefined",
        "description": "",
        "required": false,
        "default": "false"
      },
      {
        "name": "onSelect",
        "type": "((request: MedicationRequest) => void) | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "showProvenance",
        "type": "boolean | undefined",
        "description": "Show the prescriber and authored date.",
        "required": false,
        "default": "true"
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"onSelect\">",
    "exports": [
      {
        "name": "MedicationCard",
        "props": [
          {
            "name": "request",
            "type": "MedicationRequest | undefined",
            "description": "FHIR R4 MedicationRequest.",
            "required": true
          },
          {
            "name": "asOf",
            "type": "Date | undefined",
            "description": "Date used to evaluate expiry. Pass a fixed date to keep tests deterministic.",
            "required": false,
            "default": "new Date()"
          },
          {
            "name": "loading",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "onSelect",
            "type": "((request: MedicationRequest) => void) | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "showProvenance",
            "type": "boolean | undefined",
            "description": "Show the prescriber and authored date.",
            "required": false,
            "default": "true"
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"onSelect\">"
      },
      {
        "name": "MedicationList",
        "props": [
          {
            "name": "requests",
            "type": "MedicationRequest[] | undefined",
            "description": "",
            "required": true
          },
          {
            "name": "asOf",
            "type": "Date | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "emptyMessage",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"No medications recorded.\""
          }
        ]
      }
    ],
    "usage": "import { MedicationCard, MedicationList } from \"@/components/oxygen/medication-card\";\n\n<MedicationList requests={activeMedications} />\n\n// or a single order\n<MedicationCard\n  request={request}\n  onSelect={(r) => openOrder(r.id)}\n/>",
    "guidance": {
      "use": [
        "On a medication list, discharge summary, or reconciliation screen.",
        "With showProvenance on, wherever a clinician may need to contact the prescriber.",
        "Sorted with active medications first — the component preserves your order."
      ],
      "avoid": [
        "As a prescribing control. This renders an existing order; it does not create or modify one.",
        "For dispense or administration records. Those are MedicationDispense and MedicationAdministration.",
        "Hiding discontinued drugs entirely. Recently stopped medications matter clinically."
      ]
    },
    "accessibility": [
      {
        "label": "No strike-through",
        "detail": "Discontinued medications are never struck through — struck text is unreadable at small sizes and is not exposed as meaning by screen readers. The status badge carries the state."
      },
      {
        "label": "Status labels",
        "detail": "Every status has a text label, not just a tone. On hold, stopped, and expired are distinguishable in grayscale."
      },
      {
        "label": "Activation",
        "detail": "When onSelect is provided the card is focusable and responds to Enter and Space."
      }
    ],
    "limitations": [
      "Renders dosageInstruction[0] only. Tapered and split regimens with multiple instructions show the first.",
      "No interaction or contraindication checking. That is a clinical decision support concern, not a UI one.",
      "medicationReference renders the reference display text; it does not resolve the Medication resource."
    ],
    "related": [
      "allergy-list",
      "condition-list"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/medication-card.json"
  },
  {
    "name": "patient-banner",
    "title": "Patient Banner",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "Persistent identity header for a clinical screen, driven by a FHIR Patient resource.",
    "description": "Persistent patient identity header driven by a FHIR R4 Patient resource. Handles restricted records, deceased status, masked identifiers, and missing demographics.",
    "rationale": "Renders who the chart belongs to and keeps it reachable at any point on the screen. Wrong-patient error is one of the highest-consequence failures in clinical software, so this component never invents a name, never renders absence as blankness, and announces deceased and restricted status to assistive technology rather than conveying it through styling alone.",
    "categories": [
      "Patient identity",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "Patient",
        "url": "https://hl7.org/fhir/R4/patient.html"
      }
    ],
    "resource": "Patient",
    "resourceUrl": "https://hl7.org/fhir/R4/patient.html",
    "states": [
      "Complete demographics",
      "Name not recorded",
      "Restricted record",
      "Deceased",
      "Masked identifiers",
      "Loading"
    ],
    "props": [
      {
        "name": "patient",
        "type": "Patient | undefined",
        "description": "FHIR R4 Patient resource.",
        "required": true
      },
      {
        "name": "actions",
        "type": "React.ReactNode",
        "description": "Trailing slot for actions — encounter switcher, chart menu, alerts.",
        "required": false
      },
      {
        "name": "asOf",
        "type": "Date | undefined",
        "description": "Date used to compute age. Pass a fixed date to keep tests deterministic.",
        "required": false
      },
      {
        "name": "headingLevel",
        "type": "1 | 2 | 3 | 4 | 5 | 6 | undefined",
        "description": "Heading level for the patient name. Defaults to 2, which suits a banner at the top of a page. Set it when the banner is nested — several banners on one page at h2 each inject a sibling into the document outline, and screen-reader users navigate by that outline. Match the level to where the banner actually sits, not to how large you want the text.",
        "required": false,
        "default": "2"
      },
      {
        "name": "identifierLabel",
        "type": "string | undefined",
        "description": "Label shown before the identifier.",
        "required": false,
        "default": "\"MRN\""
      },
      {
        "name": "identifierSystem",
        "type": "string | undefined",
        "description": "Identifier system to display, e.g. your MRN system. Defaults to the official identifier.",
        "required": false
      },
      {
        "name": "loading",
        "type": "boolean | undefined",
        "description": "Renders the skeleton state.",
        "required": false,
        "default": "false"
      },
      {
        "name": "maskIdentifiers",
        "type": "boolean | undefined",
        "description": "Mask all but the last four characters. Use on shared or public screens.",
        "required": false,
        "default": "false"
      },
      {
        "name": "restricted",
        "type": "boolean | undefined",
        "description": "Force the restricted presentation. When omitted, derived from `meta.security` confidentiality labels on the resource.",
        "required": false
      }
    ],
    "extendsType": "React.HTMLAttributes<HTMLDivElement>",
    "exports": [
      {
        "name": "PatientBanner",
        "props": [
          {
            "name": "patient",
            "type": "Patient | undefined",
            "description": "FHIR R4 Patient resource.",
            "required": true
          },
          {
            "name": "actions",
            "type": "React.ReactNode",
            "description": "Trailing slot for actions — encounter switcher, chart menu, alerts.",
            "required": false
          },
          {
            "name": "asOf",
            "type": "Date | undefined",
            "description": "Date used to compute age. Pass a fixed date to keep tests deterministic.",
            "required": false
          },
          {
            "name": "headingLevel",
            "type": "1 | 2 | 3 | 4 | 5 | 6 | undefined",
            "description": "Heading level for the patient name. Defaults to 2, which suits a banner at the top of a page. Set it when the banner is nested — several banners on one page at h2 each inject a sibling into the document outline, and screen-reader users navigate by that outline. Match the level to where the banner actually sits, not to how large you want the text.",
            "required": false,
            "default": "2"
          },
          {
            "name": "identifierLabel",
            "type": "string | undefined",
            "description": "Label shown before the identifier.",
            "required": false,
            "default": "\"MRN\""
          },
          {
            "name": "identifierSystem",
            "type": "string | undefined",
            "description": "Identifier system to display, e.g. your MRN system. Defaults to the official identifier.",
            "required": false
          },
          {
            "name": "loading",
            "type": "boolean | undefined",
            "description": "Renders the skeleton state.",
            "required": false,
            "default": "false"
          },
          {
            "name": "maskIdentifiers",
            "type": "boolean | undefined",
            "description": "Mask all but the last four characters. Use on shared or public screens.",
            "required": false,
            "default": "false"
          },
          {
            "name": "restricted",
            "type": "boolean | undefined",
            "description": "Force the restricted presentation. When omitted, derived from `meta.security` confidentiality labels on the resource.",
            "required": false
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDivElement>"
      },
      {
        "name": "PatientBannerSkeleton",
        "props": []
      }
    ],
    "usage": "import { PatientBanner } from \"@/components/oxygen/patient-banner\";\n\nexport function ChartHeader({ patient }: { patient: Patient }) {\n  return (\n    <PatientBanner\n      patient={patient}\n      identifierSystem=\"http://your-org.example/fhir/sid/mrn\"\n      maskIdentifiers={isSharedWorkstation}\n    />\n  );\n}",
    "guidance": {
      "use": [
        "At the top of any screen showing a single patient's data.",
        "Anywhere a user could plausibly act on the wrong record.",
        "With maskIdentifiers on shared workstations, waiting-room displays, and screen shares."
      ],
      "avoid": [
        "As a list row — it is a page-level landmark, not a repeating item.",
        "As your only access control. The restricted flag changes what is displayed; it does not stop data reaching the browser.",
        "For patient selection. Use a search or worklist component instead."
      ]
    },
    "accessibility": [
      {
        "label": "Landmark",
        "detail": "Renders as a labelled region so the patient context is reachable from anywhere on the page."
      },
      {
        "label": "Status flags",
        "detail": "Deceased and restricted are text and icon, not color. Both are inside the region's accessible name."
      },
      {
        "label": "Masked identifiers",
        "detail": "Screen readers receive the last four characters and an explicit statement that the value is masked."
      },
      {
        "label": "Loading",
        "detail": "Skeleton carries aria-busy and an accessible label so the wait is announced."
      },
      {
        "label": "Heading level",
        "detail": "The patient name renders at a configurable heading level so a nested banner does not corrupt the page outline."
      }
    ],
    "limitations": [
      "Does not render address, telecom, or managing organization — compose those alongside it.",
      "Age is computed in whole years only. Neonatal and paediatric age display (days, weeks, months) is not yet handled.",
      "No built-in patient-photo slot."
    ],
    "related": [
      "vitals-panel"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/patient-banner.json"
  },
  {
    "name": "patient-snapshot",
    "title": "Patient Snapshot",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "block",
    "summary": "One-screen pre-encounter summary where every section carries its own recency and failure.",
    "description": "One-screen pre-encounter summary. Each section carries its own recency and failure, truncation is counted rather than silent, and changes since last review lead.",
    "rationale": "The single most requested and most misdesigned surface in clinical software. The design problem is not what to show but what to leave out, and the answer differs by specialty, setting, and patient. Six source systems back this screen and partial failure is normal, so a section that did not load says so rather than rendering empty. Truncation is counted rather than silent — showing three of eleven problems and stopping is a summary that reads as a complete list. Changes since the reader last looked lead, because covering clinicians need the delta rather than the chart.",
    "categories": [
      "Patient identity",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "Composition",
        "url": "https://hl7.org/fhir/R4/composition.html"
      }
    ],
    "resource": "Composition",
    "resourceUrl": "https://hl7.org/fhir/R4/composition.html",
    "states": [
      "All sections loaded",
      "Section failed",
      "Section stale",
      "Section empty",
      "Truncated with a count",
      "Changes since last review"
    ],
    "props": [
      {
        "name": "sections",
        "type": "SnapshotSection[]",
        "description": "",
        "required": true
      },
      {
        "name": "timeZone",
        "type": "string",
        "description": "",
        "required": true
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "columns",
        "type": "1 | 2 | undefined",
        "description": "Two columns on desktop, or a single prioritised stack.",
        "required": false,
        "default": "2"
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "",
        "required": false,
        "default": "\"Patient summary\""
      },
      {
        "name": "lastReviewedAt",
        "type": "string | undefined",
        "description": "When this reader last reviewed the chart, for the change summary.",
        "required": false
      },
      {
        "name": "locale",
        "type": "string | undefined",
        "description": "",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "PatientSnapshot",
        "props": [
          {
            "name": "sections",
            "type": "SnapshotSection[]",
            "description": "",
            "required": true
          },
          {
            "name": "timeZone",
            "type": "string",
            "description": "",
            "required": true
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "columns",
            "type": "1 | 2 | undefined",
            "description": "Two columns on desktop, or a single prioritised stack.",
            "required": false,
            "default": "2"
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "",
            "required": false,
            "default": "\"Patient summary\""
          },
          {
            "name": "lastReviewedAt",
            "type": "string | undefined",
            "description": "When this reader last reviewed the chart, for the change summary.",
            "required": false
          },
          {
            "name": "locale",
            "type": "string | undefined",
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { PatientSnapshot } from \"@/components/oxygen/patient-snapshot\";\n\n<PatientSnapshot\n  timeZone=\"America/New_York\"\n  lastReviewedAt={lastReviewed}\n  sections={[\n    {\n      id: \"problems\",\n      title: \"Problems\",\n      state: \"loaded\",\n      totalCount: 11,\n      shownCount: 3,\n      emptyTitle: \"No problems recorded\",\n      content: <ConditionList conditions={top3} />,\n    },\n  ]}\n/>",
    "guidance": {
      "use": [
        "Pre-visit and handover surfaces, where the reader has minutes rather than an hour.",
        "With one section per source system, so one slow service does not block the rest.",
        "With totalCount and shownCount whenever the section is truncated."
      ],
      "avoid": [
        "Rendering a failed section as empty. That is the harm this exists to prevent.",
        "Truncating without a count.",
        "Making it exhaustive. A summary that shows everything is not a summary."
      ]
    },
    "accessibility": [
      {
        "label": "Sections as regions",
        "detail": "Each section is a labelled article, so a screen-reader user navigates section by section."
      },
      {
        "label": "Failure summarised first",
        "detail": "Failed sections are announced at the top, before the reader forms a picture from the sections above them."
      },
      {
        "label": "Change counts in the name",
        "detail": "New-since-review counts are part of the heading, not a decorative badge."
      }
    ],
    "limitations": [
      "Does not decide what belongs in a summary \\u2014 sections and priority are yours.",
      "Specialty configuration is caller-supplied.",
      "Change detection compares counts you supply; it does not diff resources."
    ],
    "related": [
      "patient-banner",
      "code-status",
      "care-team",
      "clinical-skeleton"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/patient-snapshot.json"
  },
  {
    "name": "precautions-bar",
    "title": "Precautions Bar",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "What staff must do before entering the room, ordered by required action.",
    "description": "What staff must do before entering the room, ordered by required action. Lapsed precautions are dropped rather than greyed, and behavioral flags describe the approach, not the person.",
    "rationale": "This is read on the way through a door, so it is ordered by the action required rather than alphabetically, and required PPE is named rather than implied by a category — “contact precautions” is a label, “gown and gloves” is an instruction. Lapsed precautions are dropped rather than greyed, because a stale precaution on screen is how staff learn to ignore all of them. Behavioral flags describe the approach, not the person: “two staff for personal care” is actionable and carries no judgement.",
    "categories": [
      "Patient identity",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "Flag",
        "url": "https://hl7.org/fhir/R4/flag.html"
      }
    ],
    "resource": "Flag",
    "resourceUrl": "https://hl7.org/fhir/R4/flag.html",
    "states": [
      "Airborne",
      "Contact isolation",
      "Behavioral approach",
      "Fall risk",
      "Mobility",
      "No active precautions",
      "Lapsed and dropped"
    ],
    "props": [
      {
        "name": "actionFor",
        "type": "((flag: Flag) => string | undefined) | undefined",
        "description": "Maps a Flag to its required action. Without an entry, the precaution renders with its label alone rather than an invented instruction.",
        "required": false
      },
      {
        "name": "asOf",
        "type": "Date | undefined",
        "description": "",
        "required": false,
        "default": "new Date()"
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "flags",
        "type": "Flag[] | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "precautions",
        "type": "PrecautionDisplay[] | undefined",
        "description": "Explicit precautions, for callers not modelling these as FHIR Flags.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "PrecautionsBar",
        "props": [
          {
            "name": "actionFor",
            "type": "((flag: Flag) => string | undefined) | undefined",
            "description": "Maps a Flag to its required action. Without an entry, the precaution renders with its label alone rather than an invented instruction.",
            "required": false
          },
          {
            "name": "asOf",
            "type": "Date | undefined",
            "description": "",
            "required": false,
            "default": "new Date()"
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "flags",
            "type": "Flag[] | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "precautions",
            "type": "PrecautionDisplay[] | undefined",
            "description": "Explicit precautions, for callers not modelling these as FHIR Flags.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { PrecautionsBar } from \"@/components/oxygen/precautions-bar\";\n\n<PrecautionsBar\n  flags={flags}\n  actionFor={(flag) => PPE_BY_CODE[flag.code?.coding?.[0]?.code ?? \"\"]}\n/>",
    "guidance": {
      "use": [
        "At the top of any chart, room display, or transport handover.",
        "With actionFor supplying the specific PPE or approach required.",
        "On ward and corridor displays, where it is read at distance."
      ],
      "avoid": [
        "Rendering lapsed precautions greyed out rather than removing them.",
        "Behavioral labels that characterise a person rather than an approach.",
        "Relying on the icon alone \\u2014 these are read on poor displays at distance."
      ]
    },
    "accessibility": [
      {
        "label": "Icon, text, and colour",
        "detail": "All three, always. These are read at distance and often in monochrome."
      },
      {
        "label": "Ordered by action",
        "detail": "Reading order follows urgency of required action, not the source order of the flags."
      },
      {
        "label": "Empty is stated",
        "detail": "No active precautions renders as a sentence rather than an empty bar."
      }
    ],
    "limitations": [
      "PPE mapping is caller-supplied; there is no built-in infection-control catalogue.",
      "Category mapping covers common codes and falls back to a neutral kind.",
      "Does not model precaution ordering rules beyond urgency of action."
    ],
    "related": [
      "patient-banner",
      "code-status",
      "alert-banner"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/precautions-bar.json"
  },
  {
    "name": "provenance",
    "title": "Provenance Tag",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "summary": "Who recorded this, when, from where, and whether it has been amended.",
    "description": "Who recorded a datum, when, from what source, and whether it has been amended. Separates event time from charting time and states an absent source rather than guessing.",
    "rationale": "Clinicians discount data they cannot source, and an amended result that looks identical to the original is a known harm pathway — both are solved by the same disclosure. It refuses to flatten three distinctions: when something happened versus when it was written, who observed it versus what typed it, and present versus absent provenance. Amendment is surfaced on the trigger itself, because a correction nobody opens is a correction nobody saw.",
    "categories": [
      "Primitive",
      "System"
    ],
    "fhir": [
      {
        "name": "Provenance",
        "url": "https://hl7.org/fhir/R4/provenance.html"
      }
    ],
    "resource": "Provenance",
    "resourceUrl": "https://hl7.org/fhir/R4/provenance.html",
    "states": [
      "Clinician-entered",
      "Patient-reported",
      "Device-recorded",
      "Interface feed",
      "Amended",
      "Source not recorded",
      "Charted after the event"
    ],
    "props": [
      {
        "name": "timeZone",
        "type": "string",
        "description": "IANA zone. Required for the same reason it is on ClinicalTime.",
        "required": true
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "inline",
        "type": "boolean | undefined",
        "description": "Render the attribution inline as text instead of behind a disclosure.",
        "required": false,
        "default": "false"
      },
      {
        "name": "locale",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "provenance",
        "type": "Provenance | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "resource",
        "type": "Resource | undefined",
        "description": "The resource itself, read for meta.versionId and meta.lastUpdated.",
        "required": false
      },
      {
        "name": "subject",
        "type": "string | undefined",
        "description": "What this provenance describes, e.g. \"Potassium 6.8 mmol/L\".",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "ProvenanceTag",
        "props": [
          {
            "name": "timeZone",
            "type": "string",
            "description": "IANA zone. Required for the same reason it is on ClinicalTime.",
            "required": true
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "inline",
            "type": "boolean | undefined",
            "description": "Render the attribution inline as text instead of behind a disclosure.",
            "required": false,
            "default": "false"
          },
          {
            "name": "locale",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "provenance",
            "type": "Provenance | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "resource",
            "type": "Resource | undefined",
            "description": "The resource itself, read for meta.versionId and meta.lastUpdated.",
            "required": false
          },
          {
            "name": "subject",
            "type": "string | undefined",
            "description": "What this provenance describes, e.g. \"Potassium 6.8 mmol/L\".",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { ProvenanceTag } from \"@/components/oxygen/provenance\";\n\n<ProvenanceTag\n  provenance={provenance}\n  resource={observation}\n  timeZone=\"America/New_York\"\n  subject=\"Potassium 6.8 mmol/L\"\n/>",
    "guidance": {
      "use": [
        "Beside any value whose source a clinician might reasonably question.",
        "On results that can be amended \\u2014 the amended state shows on the trigger.",
        "With inline on dense surfaces where a popover per row is unusable."
      ],
      "avoid": [
        "Treating an absent provenance as clinician-entered. Unknown is rendered as unknown.",
        "Hiding amendment behind the disclosure only.",
        "Assuming meta.lastUpdated is the clinical event time. They are different facts."
      ]
    },
    "accessibility": [
      {
        "label": "Named trigger",
        "detail": "The button says what it reveals and about what, rather than being a bare icon."
      },
      {
        "label": "Dialog semantics",
        "detail": "Content is a labelled group, dismissible with Escape; nothing is hover-only."
      },
      {
        "label": "Amendment in the name",
        "detail": "The amended state is in the trigger's accessible name, not only in its colour."
      }
    ],
    "limitations": [
      "Reads one agent and one source entity; complex provenance chains are summarised.",
      "Does not fetch version history \\u2014 it reports what the payload and meta carry.",
      "Amendment detection uses versionId and revision entities; systems that populate neither will read as unamended."
    ],
    "related": [
      "clinical-time",
      "vitals-panel",
      "absent-value"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/provenance.json"
  },
  {
    "name": "reference-range",
    "title": "Reference Range",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "summary": "Positions a result against its own range, and refuses to draw when no bound was stated.",
    "description": "Positions a result against its own reference range. Refuses to draw when no numeric bound was stated, and marks off-scale and one-sided ranges rather than implying bounds nobody gave.",
    "rationale": "A badge tells you a potassium is high. It does not tell you whether it is 5.2 or 6.8, and those are different afternoons. The discipline is in refusing to draw: no numeric bound means no bar, because a drawn scale implies bounds nobody stated. An off-scale value is clamped with an explicit marker rather than silently pinned to the edge as though it were merely borderline.",
    "categories": [
      "Primitive",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "Observation.referenceRange",
        "url": "https://hl7.org/fhir/R4/observation.html#Observation.referenceRange"
      }
    ],
    "resource": "Observation.referenceRange",
    "resourceUrl": "https://hl7.org/fhir/R4/observation.html#Observation.referenceRange",
    "states": [
      "Bounded range",
      "One-sided range",
      "No range available",
      "Value off scale",
      "Text-only range",
      "No value"
    ],
    "props": [
      {
        "name": "interpretation",
        "type": "Interpretation | undefined",
        "description": "Drives the marker colour. Pass the interpretation already resolved.",
        "required": false,
        "default": "\"unknown\""
      },
      {
        "name": "noRangeLabel",
        "type": "string | undefined",
        "description": "Text shown when no range exists. This is the common case, not an error.",
        "required": false,
        "default": "\"No reference range\""
      },
      {
        "name": "range",
        "type": "ObservationReferenceRange | undefined",
        "description": "The range this observation carries. Never a global constant for the analyte.",
        "required": false
      },
      {
        "name": "showBounds",
        "type": "boolean | undefined",
        "description": "Show the numeric bounds beside the bar.",
        "required": false,
        "default": "true"
      },
      {
        "name": "value",
        "type": "number | undefined",
        "description": "The measured value.",
        "required": false
      }
    ],
    "extendsType": "React.HTMLAttributes<HTMLDivElement>",
    "exports": [
      {
        "name": "ReferenceRange",
        "props": [
          {
            "name": "interpretation",
            "type": "Interpretation | undefined",
            "description": "Drives the marker colour. Pass the interpretation already resolved.",
            "required": false,
            "default": "\"unknown\""
          },
          {
            "name": "noRangeLabel",
            "type": "string | undefined",
            "description": "Text shown when no range exists. This is the common case, not an error.",
            "required": false,
            "default": "\"No reference range\""
          },
          {
            "name": "range",
            "type": "ObservationReferenceRange | undefined",
            "description": "The range this observation carries. Never a global constant for the analyte.",
            "required": false
          },
          {
            "name": "showBounds",
            "type": "boolean | undefined",
            "description": "Show the numeric bounds beside the bar.",
            "required": false,
            "default": "true"
          },
          {
            "name": "value",
            "type": "number | undefined",
            "description": "The measured value.",
            "required": false
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDivElement>"
      }
    ],
    "usage": "import { ReferenceRange } from \"@/components/oxygen/reference-range\";\n\n<ReferenceRange\n  value={6.8}\n  range={observation.referenceRange?.[0]}\n  interpretation={getInterpretation(observation)}\n/>",
    "guidance": {
      "use": [
        "Beside a value in a results table, where \\u201chow far out\\u201d is the real question.",
        "In trend and detail views where the band gives a value its context."
      ],
      "avoid": [
        "Supplying a range from a lookup table rather than the observation. Ranges are age-, sex-, and assay-conditional.",
        "Treating it as the severity signal. It is always paired with a badge and text.",
        "Expecting a bar for a text-only range \\u2014 it renders the text instead, deliberately."
      ]
    },
    "accessibility": [
      {
        "label": "Decorative by design",
        "detail": "The bar is hidden from assistive technology. The value, bounds, and interpretation are announced by the surrounding row; a nameless graphic would add noise, not access."
      },
      {
        "label": "Off-scale survives greyscale",
        "detail": "An off-scale marker changes shape as well as position, and is labelled in text, so the fact survives monochrome printing."
      },
      {
        "label": "Bounds as text",
        "detail": "Numeric bounds render as text beside the bar rather than as axis labels inside it."
      }
    ],
    "limitations": [
      "Purely presentational \\u2014 it does not resolve which range applies to this patient.",
      "One-sided ranges infer the far end of the scale; it is marked, not hidden.",
      "Age- and sex-conditional range selection is the caller's job."
    ],
    "related": [
      "clinical-value",
      "vitals-panel",
      "status-badge"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/reference-range.json"
  },
  {
    "name": "restricted-shield",
    "title": "Restricted Shield",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "pattern",
    "summary": "Redacted by default. Discloses only with a stated reason, on a timer, and can conceal that content exists.",
    "description": "Wraps content restricted by sensitivity policy. Redacted by default, discloses only with a stated reason, re-hides on a timer, and can conceal that content exists at all.",
    "rationale": "Behavioral health, substance use under 42 CFR Part 2, reproductive care, HIV status, and minor confidentiality can each be restricted independently of the rest of the chart. The redacted state is the default render, not the fallback, and every path fails closed. The subtle requirement is the middle ground — stating that restricted content exists without revealing what it is — with a concealExistence variant for the narrower case where even that acknowledgement is not permitted.",
    "categories": [
      "Primitive",
      "System",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "Consent · meta.security",
        "url": "https://hl7.org/fhir/R4/consent.html"
      }
    ],
    "resource": "Consent · meta.security",
    "resourceUrl": "https://hl7.org/fhir/R4/consent.html",
    "states": [
      "Restricted, disclosure permitted",
      "Restricted, disclosure not permitted",
      "Existence concealed",
      "Disclosed with countdown",
      "Auto re-redacted",
      "Not restricted"
    ],
    "props": [
      {
        "name": "children",
        "type": "React.ReactNode",
        "description": "",
        "required": true
      },
      {
        "name": "category",
        "type": "string | undefined",
        "description": "Category shown to the reader, e.g. \"Substance use — 42 CFR Part 2\".",
        "required": false,
        "default": "\"Restricted record\""
      },
      {
        "name": "className",
        "type": "string | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "concealExistence",
        "type": "boolean | undefined",
        "description": "Do not acknowledge that content exists. For the narrow cases where the existence of a record is itself the sensitive fact.",
        "required": false,
        "default": "false"
      },
      {
        "name": "disclosurePermitted",
        "type": "boolean | undefined",
        "description": "Whether this viewer may break the glass. False renders the shield with no disclosure path and an explanation, which is different from being able to ask and choosing not to.",
        "required": false,
        "default": "true"
      },
      {
        "name": "durationSeconds",
        "type": "number | undefined",
        "description": "How long a disclosure lasts before the shield closes again.",
        "required": false,
        "default": "300"
      },
      {
        "name": "onDisclose",
        "type": "((event: DisclosureEvent) => void) | undefined",
        "description": "Emitted when content is disclosed. The application persists this — the component does not, and says so rather than implying an audit trail it cannot provide.",
        "required": false
      },
      {
        "name": "onRedact",
        "type": "(() => void) | undefined",
        "description": "",
        "required": false
      },
      {
        "name": "reasons",
        "type": "string[] | undefined",
        "description": "Reasons a viewer may choose from. Free text alone is not auditable.",
        "required": false,
        "default": "DEFAULT_REASONS"
      },
      {
        "name": "restricted",
        "type": "boolean | undefined",
        "description": "Whether the content is restricted at all. Decided by the application.",
        "required": false,
        "default": "false"
      }
    ],
    "exports": [
      {
        "name": "RestrictedShield",
        "props": [
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "",
            "required": true
          },
          {
            "name": "category",
            "type": "string | undefined",
            "description": "Category shown to the reader, e.g. \"Substance use — 42 CFR Part 2\".",
            "required": false,
            "default": "\"Restricted record\""
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "concealExistence",
            "type": "boolean | undefined",
            "description": "Do not acknowledge that content exists. For the narrow cases where the existence of a record is itself the sensitive fact.",
            "required": false,
            "default": "false"
          },
          {
            "name": "disclosurePermitted",
            "type": "boolean | undefined",
            "description": "Whether this viewer may break the glass. False renders the shield with no disclosure path and an explanation, which is different from being able to ask and choosing not to.",
            "required": false,
            "default": "true"
          },
          {
            "name": "durationSeconds",
            "type": "number | undefined",
            "description": "How long a disclosure lasts before the shield closes again.",
            "required": false,
            "default": "300"
          },
          {
            "name": "onDisclose",
            "type": "((event: DisclosureEvent) => void) | undefined",
            "description": "Emitted when content is disclosed. The application persists this — the component does not, and says so rather than implying an audit trail it cannot provide.",
            "required": false
          },
          {
            "name": "onRedact",
            "type": "(() => void) | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "reasons",
            "type": "string[] | undefined",
            "description": "Reasons a viewer may choose from. Free text alone is not auditable.",
            "required": false,
            "default": "DEFAULT_REASONS"
          },
          {
            "name": "restricted",
            "type": "boolean | undefined",
            "description": "Whether the content is restricted at all. Decided by the application.",
            "required": false,
            "default": "false"
          }
        ]
      }
    ],
    "usage": "import { RestrictedShield } from \"@/components/oxygen/restricted-shield\";\n\n<RestrictedShield\n  restricted={isPart2Protected}\n  category=\"Substance use — 42 CFR Part 2\"\n  onDisclose={(event) => auditLog.record(event)}\n>\n  <ObservationPanel observations={toxicology} />\n</RestrictedShield>",
    "guidance": {
      "use": [
        "Around any content subject to a sensitivity policy, at field, section, or record level.",
        "With onDisclose wired to your audit store \\u2014 the event is emitted, not saved.",
        "With concealExistence only where the existence of the record is itself sensitive."
      ],
      "avoid": [
        "Treating it as access control. Restricted data still reached the browser; enforce server-side.",
        "Long durationSeconds values. A disclosure that lasts until logout is not time-boxed.",
        "Putting the sensitive category name in a category string that itself reveals the content."
      ]
    },
    "accessibility": [
      {
        "label": "Announced as withheld",
        "detail": "The redacted state reads as restricted content with an available action, never as an empty section."
      },
      {
        "label": "Polite countdown",
        "detail": "The re-hide timer uses a polite live region. A countdown that interrupts every second is worse than the risk it mitigates."
      },
      {
        "label": "Real form controls",
        "detail": "The reason is a labelled select, not a free-text box, so the disclosure record is auditable."
      }
    ],
    "limitations": [
      "Renders policy outcomes; it does not evaluate consent, security labels, or role.",
      "The audit event is emitted only. Persistence, retention, and review are yours.",
      "Timer state is per-instance and resets on remount."
    ],
    "related": [
      "absent-value",
      "empty-state",
      "action-gate"
    ],
    "dependencies": [
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/restricted-shield.json"
  },
  {
    "name": "status-badge",
    "title": "Status Badge",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "summary": "The shared severity chip. Critical reads identically on a lab result, a medication, and an allergy.",
    "description": "Shared severity and status chip used by every Oxygen component, so critical reads identically on a lab result, a medication, and an allergy. Label is required — there is no icon-only variant.",
    "rationale": "The status chip every other Oxygen component uses, so that severity is consistent across the whole system. Two rules are enforced by the API itself: children is required, because an icon alone is not a label but a rebus; and tone maps to a semantic token rather than a raw color, so a caller passes “critical”, never “red”, and the token decides what that means in light, dark, and forced-colors modes.",
    "categories": [
      "Primitive"
    ],
    "fhir": [],
    "states": [
      "Critical",
      "High",
      "Low",
      "Normal",
      "Unknown",
      "Neutral"
    ],
    "props": [
      {
        "name": "children",
        "type": "React.ReactNode",
        "description": "The label. Required — a badge without text is not accessible.",
        "required": true
      },
      {
        "name": "icon",
        "type": "React.ComponentType<{ className?: string; }> | null | undefined",
        "description": "Replace the tone's default icon. Pass `null` only when an adjacent icon already carries the meaning.",
        "required": false
      },
      {
        "name": "size",
        "type": "'sm' | 'md' | undefined",
        "description": "",
        "required": false,
        "default": "\"sm\""
      },
      {
        "name": "tone",
        "type": "StatusTone | undefined",
        "description": "",
        "required": false,
        "default": "\"neutral\""
      }
    ],
    "extendsType": "React.HTMLAttributes<HTMLSpanElement>",
    "exports": [
      {
        "name": "StatusBadge",
        "props": [
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "The label. Required — a badge without text is not accessible.",
            "required": true
          },
          {
            "name": "icon",
            "type": "React.ComponentType<{ className?: string; }> | null | undefined",
            "description": "Replace the tone's default icon. Pass `null` only when an adjacent icon already carries the meaning.",
            "required": false
          },
          {
            "name": "size",
            "type": "'sm' | 'md' | undefined",
            "description": "",
            "required": false,
            "default": "\"sm\""
          },
          {
            "name": "tone",
            "type": "StatusTone | undefined",
            "description": "",
            "required": false,
            "default": "\"neutral\""
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLSpanElement>"
      }
    ],
    "usage": "import { StatusBadge } from \"@/components/oxygen/status-badge\";\n\n<StatusBadge tone=\"critical\">Critical high</StatusBadge>\n<StatusBadge tone=\"unknown\">Not interpreted</StatusBadge>",
    "guidance": {
      "use": [
        "Anywhere a state needs to be shown consistently with the rest of the system.",
        "With a label that names the state, not its severity — “Critical high”, not “Danger”."
      ],
      "avoid": [
        "As a button or a filter control. It is not interactive.",
        "With icon={null} unless a neighbouring icon already conveys the same meaning.",
        "Inventing a tone for a non-clinical concept. Use neutral."
      ]
    },
    "accessibility": [
      {
        "label": "Label required",
        "detail": "The API has no icon-only variant, so a badge can never ship without an accessible label."
      },
      {
        "label": "Token-driven",
        "detail": "Tones resolve through status tokens, keeping contrast correct in light, dark, and forced-colors modes."
      }
    ],
    "limitations": [
      "Not interactive — no button, link, or dismiss behavior.",
      "Six tones only. Additional semantics belong in a token, not a one-off color."
    ],
    "related": [
      "vitals-panel",
      "medication-card"
    ],
    "dependencies": [
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/status-badge.json"
  },
  {
    "name": "unsaved-guard",
    "title": "Unsaved Guard",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "pattern",
    "summary": "Stops clinical documentation being lost to a navigation, a patient switch, or a closed tab.",
    "description": "Central registry that stops clinical documentation being lost to a navigation, a patient switch, or a closed tab. Distinguishes recoverable drafts from work that exists only in this tab.",
    "rationale": "Lost notes are among the most reliably enraging failures in clinical software, and they are almost always a coordination failure rather than a bug in any one form. Dirtiness is registered centrally so every editor participates, and the guard blocks navigation, patient-context changes, and tab close. Two distinctions decide whether the prompt is honest: recoverable drafts versus work that exists only in this tab, and trivially recreatable state versus twenty minutes of documentation — so the registry takes a description and the prompt names what is at stake.",
    "categories": [
      "Primitive",
      "System"
    ],
    "fhir": [],
    "states": [
      "Clean",
      "Saving",
      "Saved",
      "Autosave failed",
      "Prompt on navigation",
      "Prompt on patient switch",
      "Browser close guard"
    ],
    "props": [
      {
        "name": "children",
        "type": "React.ReactNode",
        "description": "",
        "required": true
      }
    ],
    "exports": [
      {
        "name": "UnsavedGuardProvider",
        "props": [
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "",
            "required": true
          }
        ]
      },
      {
        "name": "SaveStatus",
        "props": [
          {
            "name": "state",
            "type": "SaveState",
            "description": "",
            "required": true
          },
          {
            "name": "className",
            "type": "string | undefined",
            "description": "",
            "required": false
          },
          {
            "name": "lastSavedLabel",
            "type": "string | undefined",
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import {\n  UnsavedGuardProvider,\n  useUnsavedWork,\n  useConfirmLeave,\n  SaveStatus,\n} from \"@/components/oxygen/unsaved-guard\";\n\nuseUnsavedWork({ id: \"note-42\", description: \"Progress note\", saveState });\n\nconst confirmLeave = useConfirmLeave();\nif (await confirmLeave(\"Switching to another patient.\")) switchPatient();",
    "guidance": {
      "use": [
        "Around the whole application, once, at the root.",
        "In every editing surface \\u2014 a guard only some forms use is a guard that does not work.",
        "Before any patient-context change, not just route changes."
      ],
      "avoid": [
        "Describing a surface as \\u201cform\\u201d or \\u201cchanges\\u201d. Name what would be lost.",
        "Treating a failed autosave as recoverable. That draft exists only in this tab.",
        "Relying on the browser prompt alone \\u2014 it cannot be styled or worded."
      ]
    },
    "accessibility": [
      {
        "label": "Managed focus",
        "detail": "The prompt is an alertdialog; focus moves in on open and Escape cancels the departure."
      },
      {
        "label": "Failure is assertive",
        "detail": "Autosave failure announces assertively. A silent failure lets someone write for twenty minutes believing their note is filed."
      },
      {
        "label": "Named stakes",
        "detail": "The dialog lists each dirty surface by description, so the consequence is legible rather than generic."
      }
    ],
    "limitations": [
      "The browser-level prompt cannot be styled or worded \\u2014 that is a platform limit.",
      "Does not persist drafts; it reports save state and blocks. Persistence is yours.",
      "Route interception depends on your router calling confirmLeave."
    ],
    "related": [
      "action-gate",
      "app-shell"
    ],
    "dependencies": [
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/unsaved-guard.json"
  },
  {
    "name": "vitals-panel",
    "title": "Observation Panel",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "summary": "Results table with reference ranges and interpretation. Uninterpreted results stay uninterpreted.",
    "description": "Results table for FHIR R4 Observation resources. Renders values, units, reference ranges, and interpretation — with uninterpreted results shown as uninterpreted, never as normal.",
    "rationale": "Renders a set of Observation resources as a results list: value, units, reference range, and interpretation. The interpretation logic is the entire point. An interpretation stated in the payload always wins; absent one, it is derived only by comparing the value to its own reference range; with neither, the result reads “Not interpreted” rather than “Normal”. Silently defaulting an uninterpreted result to normal is how a UI manufactures false reassurance.",
    "categories": [
      "Clinical data",
      "Clinical"
    ],
    "fhir": [
      {
        "name": "Observation[]",
        "url": "https://hl7.org/fhir/R4/observation.html"
      }
    ],
    "resource": "Observation[]",
    "resourceUrl": "https://hl7.org/fhir/R4/observation.html",
    "states": [
      "Multi-component (blood pressure)",
      "Critical high and low",
      "High and low",
      "Normal",
      "Not interpreted",
      "No value (dataAbsentReason)",
      "Preliminary",
      "Amended and corrected",
      "Empty",
      "Loading"
    ],
    "props": [
      {
        "name": "observations",
        "type": "Observation[] | undefined",
        "description": "FHIR R4 Observation resources, in the order they should be read.",
        "required": true
      },
      {
        "name": "emptyMessage",
        "type": "string | undefined",
        "description": "Shown when `observations` is an empty array.",
        "required": false,
        "default": "\"No results in this period.\""
      },
      {
        "name": "hideReferenceRange",
        "type": "boolean | undefined",
        "description": "Hide the reference-range column — useful in narrow or patient-facing layouts.",
        "required": false,
        "default": "false"
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "Accessible name for the results table.",
        "required": false,
        "default": "\"Observations\""
      },
      {
        "name": "loading",
        "type": "boolean | undefined",
        "description": "Renders the skeleton state.",
        "required": false,
        "default": "false"
      },
      {
        "name": "loadingRows",
        "type": "number | undefined",
        "description": "Number of skeleton rows while loading.",
        "required": false,
        "default": "4"
      },
      {
        "name": "onSelect",
        "type": "((observation: Observation) => void) | undefined",
        "description": "Called when a row is activated. Omit to render non-interactive rows.",
        "required": false
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"onSelect\">",
    "exports": [
      {
        "name": "ObservationPanel",
        "props": [
          {
            "name": "observations",
            "type": "Observation[] | undefined",
            "description": "FHIR R4 Observation resources, in the order they should be read.",
            "required": true
          },
          {
            "name": "emptyMessage",
            "type": "string | undefined",
            "description": "Shown when `observations` is an empty array.",
            "required": false,
            "default": "\"No results in this period.\""
          },
          {
            "name": "hideReferenceRange",
            "type": "boolean | undefined",
            "description": "Hide the reference-range column — useful in narrow or patient-facing layouts.",
            "required": false,
            "default": "false"
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "Accessible name for the results table.",
            "required": false,
            "default": "\"Observations\""
          },
          {
            "name": "loading",
            "type": "boolean | undefined",
            "description": "Renders the skeleton state.",
            "required": false,
            "default": "false"
          },
          {
            "name": "loadingRows",
            "type": "number | undefined",
            "description": "Number of skeleton rows while loading.",
            "required": false,
            "default": "4"
          },
          {
            "name": "onSelect",
            "type": "((observation: Observation) => void) | undefined",
            "description": "Called when a row is activated. Omit to render non-interactive rows.",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"onSelect\">"
      },
      {
        "name": "ObservationRow",
        "props": [
          {
            "name": "observation",
            "type": "Observation",
            "description": "",
            "required": true
          },
          {
            "name": "hideReferenceRange",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "onSelect",
            "type": "((observation: Observation) => void) | undefined",
            "description": "",
            "required": false
          }
        ]
      },
      {
        "name": "ObservationComponentRow",
        "props": [
          {
            "name": "component",
            "type": "ObservationComponent",
            "description": "",
            "required": true
          },
          {
            "name": "hideReferenceRange",
            "type": "boolean | undefined",
            "description": "",
            "required": false,
            "default": "false"
          }
        ]
      },
      {
        "name": "ObservationPanelSkeleton",
        "props": [
          {
            "name": "rows",
            "type": "number | undefined",
            "description": "",
            "required": false,
            "default": "4"
          }
        ]
      }
    ],
    "usage": "import { ObservationPanel } from \"@/components/oxygen/vitals-panel\";\n\nexport function Results({ bundle }: { bundle: Bundle<Observation> }) {\n  const observations =\n    bundle.entry?.map((entry) => entry.resource!) ?? [];\n\n  return (\n    <ObservationPanel\n      observations={observations}\n      label=\"Chemistry panel\"\n      onSelect={(observation) => openDetail(observation.id)}\n    />\n  );\n}",
    "guidance": {
      "use": [
        "For lab panels, vitals, and any grouped set of Observation resources.",
        "With hideReferenceRange on patient-facing surfaces where a range would confuse more than inform.",
        "Sorted with the most clinically urgent results first — the component preserves your order."
      ],
      "avoid": [
        "For a single headline value. Use a metric card so the value is not buried in a table.",
        "For trending over time. This is a point-in-time panel, not a chart.",
        "As a substitute for critical-result notification. A visible badge is not an alerting pathway."
      ]
    },
    "accessibility": [
      {
        "label": "Table semantics",
        "detail": "Real table markup with scoped column headers and an accessible caption."
      },
      {
        "label": "Critical announcement",
        "detail": "A live region states the critical count before the table is read, so severity is known up front rather than discovered on row seven."
      },
      {
        "label": "Never color alone",
        "detail": "Every interpretation carries an icon and a text label. Critical rows add an inset rule — a second structural cue that survives grayscale and forced colors."
      },
      {
        "label": "Row activation",
        "detail": "When onSelect is provided, rows are focusable and respond to Enter and Space with a visible focus ring."
      },
      {
        "label": "Multi-part results",
        "detail": "Blood pressure and other component-carried readings render each part as its own row, separately valued and separately flagged. The parent escalates to its worst component so a raised systolic is never hidden behind a silent panel."
      }
    ],
    "limitations": [
      "Renders referenceRange[0] only. Age- and sex-specific ranges are not yet selected by context.",
      "Component reference ranges are read from referenceRange[0], same as the parent.",
      "No built-in unit conversion. Values render in the units supplied."
    ],
    "related": [
      "patient-banner"
    ],
    "dependencies": [
      "@oxygenui/fhir",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/vitals-panel.json"
  }
];

export const BY_NAME: ReadonlyMap<string, ComponentDoc> = new Map(
  CATALOG.map((component) => [component.name, component]),
);

export const ALL_CATEGORIES: readonly string[] = [
  ...new Set(CATALOG.flatMap((component) => component.categories)),
].sort();
