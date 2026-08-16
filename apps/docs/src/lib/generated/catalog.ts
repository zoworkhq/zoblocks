// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md

import type { ComponentDoc } from "@oxygenui-design/component-meta";

export const CATALOG: ComponentDoc[] = [
  {
    "name": "breath-loader",
    "title": "Breath Loader",
    "tier": "free",
    "status": "beta",
    "since": "0.2.0",
    "layer": "primitive",
    "distribution": "registry",
    "summary": "Three rings expanding and fading from a soft core, paced at a resting breath rather than a spinner's tempo.",
    "description": "Symbol-free loader cycling at roughly fifteen a minute, the rate of calm breathing. Carries no clinical imagery, so it suits any specialty, and its core accepts a customer's logo mark.",
    "rationale": "A spinner's tempo tells a reader the system is working hard; breathing tells them they can wait. On a patient-facing screen — a results page, a portal sign-in, a check-in kiosk — the second is almost always what the product means to say. It is also the one loader in the set with no clinical symbol at all, which is what makes it safe across specialties: nothing here reads as cardiac, oncological, or obstetric to someone who is about to receive news. That neutrality is a feature, not an absence of one.",
    "categories": [
      "Loaders",
      "Feedback"
    ],
    "fhir": [],
    "states": [
      "Indeterminate",
      "Delayed (not yet shown)",
      "Slow wait",
      "Reduced motion",
      "With a brand mark in the core"
    ],
    "props": [
      {
        "name": "actions",
        "type": "React.ReactNode",
        "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
        "required": false
      },
      {
        "name": "announce",
        "type": "LoaderAnnounce | undefined",
        "description": "Live-region politeness while indeterminate.",
        "required": false
      },
      {
        "name": "children",
        "type": "React.ReactNode",
        "description": "A brand mark rendered in place of the core. Decorative: it sits inside the aria-hidden art, so a logo never becomes a second announcement on a wait that already has a label.",
        "required": false
      },
      {
        "name": "delay",
        "type": "number | undefined",
        "description": "Wait this long before appearing, so a fast response never flashes a loader.",
        "required": false
      },
      {
        "name": "hint",
        "type": "string | undefined",
        "description": "A second line under the label. Never a substitute for it.",
        "required": false
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
        "required": false
      },
      {
        "name": "minDuration",
        "type": "number | undefined",
        "description": "Once visible, stay at least this long, so the loader never blinks out.",
        "required": false
      },
      {
        "name": "mode",
        "type": "LoaderMode | undefined",
        "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
        "required": false
      },
      {
        "name": "motion",
        "type": "LoaderMotion | undefined",
        "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void) | undefined",
        "description": "Fires once, when `slowAfter` elapses.",
        "required": false
      },
      {
        "name": "open",
        "type": "boolean | undefined",
        "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
        "required": false
      },
      {
        "name": "progress",
        "type": "number | undefined",
        "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
        "required": false
      },
      {
        "name": "scrim",
        "type": "boolean | undefined",
        "description": "Translucent backdrop behind `overlay` and `page`.",
        "required": false
      },
      {
        "name": "showLabel",
        "type": "boolean | undefined",
        "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
        "required": false
      },
      {
        "name": "size",
        "type": "number | LoaderSize | undefined",
        "description": "Named step or an explicit art width in pixels.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number | undefined",
        "description": "Announce a stall after this long. 0 disables.",
        "required": false
      },
      {
        "name": "slowHint",
        "type": "string | undefined",
        "description": "Replaces the default stall wording.",
        "required": false
      },
      {
        "name": "speed",
        "type": "number | undefined",
        "description": "Cadence multiplier, 0.5–2. Clamped.",
        "required": false,
        "default": "1"
      }
    ],
    "extendsType": "LoaderCommonProps",
    "exports": [
      {
        "name": "BreathLoader",
        "props": [
          {
            "name": "actions",
            "type": "React.ReactNode",
            "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
            "required": false
          },
          {
            "name": "announce",
            "type": "LoaderAnnounce | undefined",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "A brand mark rendered in place of the core. Decorative: it sits inside the aria-hidden art, so a logo never becomes a second announcement on a wait that already has a label.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number | undefined",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string | undefined",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number | undefined",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode | undefined",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false
          },
          {
            "name": "motion",
            "type": "LoaderMotion | undefined",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void) | undefined",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean | undefined",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number | undefined",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean | undefined",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean | undefined",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize | undefined",
            "description": "Named step or an explicit art width in pixels.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number | undefined",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string | undefined",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number | undefined",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false,
            "default": "1"
          }
        ],
        "extendsType": "LoaderCommonProps"
      }
    ],
    "usage": "import { BreathLoader } from \"@/components/oxygen/breath-loader\";\n\n// Patient-facing page wait\n<BreathLoader mode=\"page\" label=\"Loading your information\" />\n\n// Slower still, for a long wait\n<BreathLoader speed={0.7} label=\"Preparing your summary\" hint=\"This can take a few seconds.\" />",
    "guidance": {
      "use": [
        "Patient-facing surfaces: portals, results pages, check-in, onboarding.",
        "Long or open-ended waits, where a faster cadence would read as impatience.",
        "White-label products — it is the least branded of the five, and the core is a slot."
      ],
      "avoid": [
        "Dense clinical tables, where its size and slow cadence waste space. Use Rhythm Loader.",
        "As a progress indicator. Use Infusion Loader when the remaining time is known.",
        "Layouts you already know the shape of — a matching skeleton says more."
      ]
    },
    "accessibility": [
      {
        "label": "Announced once, in words",
        "detail": "role=status with aria-live=polite, and the label always present in the DOM so the wait is announced whether or not it is written on screen."
      },
      {
        "label": "Calm by construction",
        "detail": "One cycle every four seconds is 0.25Hz, an order of magnitude below WCAG 2.3.1's three-flash threshold, and the rings fade before they reach full size."
      },
      {
        "label": "Reduced motion is a designed state",
        "detail": "A single static ring and the core remain, breathing in opacity. No expansion, no travel."
      }
    ],
    "limitations": [
      "Not a progress source. The application supplies progress; this loader cannot show it.",
      "Requires styles/oxygen-loader.css, installed with loader-core.",
      "Needs about 40px to read as three distinct rings rather than one soft pulse."
    ],
    "related": [
      "pulse-loader",
      "rhythm-loader",
      "infusion-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/breath-loader.json"
  },
  {
    "name": "helix-loader",
    "title": "Helix Loader",
    "tier": "free",
    "status": "beta",
    "since": "0.2.0",
    "layer": "primitive",
    "distribution": "registry",
    "summary": "Two strands of dots turning on a slow sine. For the parts of a product that are laboratory rather than bedside.",
    "description": "Loader for genomics, pathology, and diagnostics surfaces. Depth comes from scale and opacity rather than a 3D transform, so the strands cross convincingly while staying cheap to composite.",
    "rationale": "The most specific loader in the set, and deliberately so. Sequencing, pathology, and diagnostics screens are waiting on analysis rather than on a person, and a cardiac mark says the wrong thing there — as does a generic ring, which says nothing at all. Depth is faked with scale and opacity rather than a 3D transform because a rotateY helix renders differently across browsers and costs a layer per dot; eighteen phase-offset dots on one keyframe read as a rotation and cost nothing.",
    "categories": [
      "Loaders",
      "Feedback"
    ],
    "fhir": [],
    "states": [
      "Indeterminate",
      "Delayed (not yet shown)",
      "Slow wait",
      "Reduced motion"
    ],
    "props": [
      {
        "name": "actions",
        "type": "React.ReactNode",
        "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
        "required": false
      },
      {
        "name": "announce",
        "type": "LoaderAnnounce | undefined",
        "description": "Live-region politeness while indeterminate.",
        "required": false
      },
      {
        "name": "delay",
        "type": "number | undefined",
        "description": "Wait this long before appearing, so a fast response never flashes a loader.",
        "required": false
      },
      {
        "name": "hint",
        "type": "string | undefined",
        "description": "A second line under the label. Never a substitute for it.",
        "required": false
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
        "required": false
      },
      {
        "name": "minDuration",
        "type": "number | undefined",
        "description": "Once visible, stay at least this long, so the loader never blinks out.",
        "required": false
      },
      {
        "name": "mode",
        "type": "LoaderMode | undefined",
        "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
        "required": false
      },
      {
        "name": "motion",
        "type": "LoaderMotion | undefined",
        "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void) | undefined",
        "description": "Fires once, when `slowAfter` elapses.",
        "required": false
      },
      {
        "name": "open",
        "type": "boolean | undefined",
        "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
        "required": false
      },
      {
        "name": "progress",
        "type": "number | undefined",
        "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
        "required": false
      },
      {
        "name": "scrim",
        "type": "boolean | undefined",
        "description": "Translucent backdrop behind `overlay` and `page`.",
        "required": false
      },
      {
        "name": "showLabel",
        "type": "boolean | undefined",
        "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
        "required": false
      },
      {
        "name": "size",
        "type": "number | LoaderSize | undefined",
        "description": "Named step or an explicit art width in pixels.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number | undefined",
        "description": "Announce a stall after this long. 0 disables.",
        "required": false
      },
      {
        "name": "slowHint",
        "type": "string | undefined",
        "description": "Replaces the default stall wording.",
        "required": false
      },
      {
        "name": "speed",
        "type": "number | undefined",
        "description": "Cadence multiplier, 0.5–2. Clamped.",
        "required": false,
        "default": "1"
      }
    ],
    "exports": [
      {
        "name": "HelixLoader",
        "props": [
          {
            "name": "actions",
            "type": "React.ReactNode",
            "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
            "required": false
          },
          {
            "name": "announce",
            "type": "LoaderAnnounce | undefined",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number | undefined",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string | undefined",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number | undefined",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode | undefined",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false
          },
          {
            "name": "motion",
            "type": "LoaderMotion | undefined",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void) | undefined",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean | undefined",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number | undefined",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean | undefined",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean | undefined",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize | undefined",
            "description": "Named step or an explicit art width in pixels.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number | undefined",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string | undefined",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number | undefined",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false,
            "default": "1"
          }
        ]
      }
    ],
    "usage": "import { HelixLoader } from \"@/components/oxygen/helix-loader\";\n\n<HelixLoader mode=\"overlay\" label=\"Running the panel\" delay={200} />",
    "guidance": {
      "use": [
        "Laboratory, genomics, pathology, and research surfaces where analysis is the thing being waited on.",
        "Wide containers — it is a landscape mark and wants at least 48px of width."
      ],
      "avoid": [
        "General application waits. It is domain-specific by design; Breath Loader is the neutral choice.",
        "Small or square containers — the strands collapse into a row of dots.",
        "Older tablets under load: eighteen animated nodes is the heaviest loader in the set."
      ]
    },
    "accessibility": [
      {
        "label": "Announced once, in words",
        "detail": "role=status with aria-live=polite, and the label always present in the DOM so the wait is announced whether or not it is written on screen."
      },
      {
        "label": "Motion stays under the threshold",
        "detail": "One turn every 2.6 seconds, with travel of twelve units and no luminance flash — well inside WCAG 2.3.1."
      },
      {
        "label": "Reduced motion is a designed state",
        "detail": "Both strands rest in place at full opacity and the mark breathes. Nothing travels."
      }
    ],
    "limitations": [
      "Not a progress source. Use Infusion Loader when the remaining time is known.",
      "Requires styles/oxygen-loader.css, installed with loader-core.",
      "Eighteen animated nodes — the heaviest of the five, though still compositor-only.",
      "Depicts no real sequence data. It is a mark, not a visualisation."
    ],
    "related": [
      "breath-loader",
      "rhythm-loader",
      "infusion-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/helix-loader.json"
  },
  {
    "name": "infusion-loader",
    "title": "Infusion Loader",
    "tier": "free",
    "status": "beta",
    "since": "0.2.0",
    "layer": "primitive",
    "distribution": "registry",
    "summary": "A capsule with a soft slug — the only loader in the set that can tell the truth about how much is left.",
    "description": "Determinate and indeterminate progress in one component. Pass progress for a real 0–100 measurement with role=progressbar; omit it and the slug drifts as an honest unknown.",
    "rationale": "Named for the one device in a hospital that displays a percentage and means it. The two modes are deliberately different animations rather than one animation with a value bolted on: a determinate bar that also drifts tells a reader a measurement is moving when it is not, and on an import, a batch upload, or a records transfer, movement is exactly the fact being watched. It is the only loader here that should ever carry a number, and only when the application genuinely knows it — a fabricated percentage parked at ninety is worse than a loader that never claimed to know.",
    "categories": [
      "Loaders",
      "Feedback"
    ],
    "fhir": [],
    "states": [
      "Indeterminate",
      "Determinate (0–100)",
      "Delayed (not yet shown)",
      "Slow wait",
      "Reduced motion"
    ],
    "props": [
      {
        "name": "actions",
        "type": "React.ReactNode",
        "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
        "required": false
      },
      {
        "name": "announce",
        "type": "LoaderAnnounce | undefined",
        "description": "Live-region politeness while indeterminate.",
        "required": false
      },
      {
        "name": "delay",
        "type": "number | undefined",
        "description": "Wait this long before appearing, so a fast response never flashes a loader.",
        "required": false
      },
      {
        "name": "hint",
        "type": "string | undefined",
        "description": "A second line under the label. Never a substitute for it.",
        "required": false
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
        "required": false
      },
      {
        "name": "minDuration",
        "type": "number | undefined",
        "description": "Once visible, stay at least this long, so the loader never blinks out.",
        "required": false
      },
      {
        "name": "mode",
        "type": "LoaderMode | undefined",
        "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
        "required": false
      },
      {
        "name": "motion",
        "type": "LoaderMotion | undefined",
        "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void) | undefined",
        "description": "Fires once, when `slowAfter` elapses.",
        "required": false
      },
      {
        "name": "open",
        "type": "boolean | undefined",
        "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
        "required": false
      },
      {
        "name": "progress",
        "type": "number | undefined",
        "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
        "required": false
      },
      {
        "name": "scrim",
        "type": "boolean | undefined",
        "description": "Translucent backdrop behind `overlay` and `page`.",
        "required": false
      },
      {
        "name": "showLabel",
        "type": "boolean | undefined",
        "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
        "required": false
      },
      {
        "name": "size",
        "type": "number | LoaderSize | undefined",
        "description": "Named step or an explicit art width in pixels.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number | undefined",
        "description": "Announce a stall after this long. 0 disables.",
        "required": false
      },
      {
        "name": "slowHint",
        "type": "string | undefined",
        "description": "Replaces the default stall wording.",
        "required": false
      },
      {
        "name": "speed",
        "type": "number | undefined",
        "description": "Cadence multiplier, 0.5–2. Clamped.",
        "required": false,
        "default": "1"
      }
    ],
    "exports": [
      {
        "name": "InfusionLoader",
        "props": [
          {
            "name": "actions",
            "type": "React.ReactNode",
            "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
            "required": false
          },
          {
            "name": "announce",
            "type": "LoaderAnnounce | undefined",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number | undefined",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string | undefined",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number | undefined",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode | undefined",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false
          },
          {
            "name": "motion",
            "type": "LoaderMotion | undefined",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void) | undefined",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean | undefined",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number | undefined",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean | undefined",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean | undefined",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize | undefined",
            "description": "Named step or an explicit art width in pixels.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number | undefined",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string | undefined",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number | undefined",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false,
            "default": "1"
          }
        ]
      }
    ],
    "usage": "import { InfusionLoader } from \"@/components/oxygen/infusion-loader\";\n\n// Determinate: the application knows how much is left\n<InfusionLoader progress={42} label=\"Importing records\" showLabel />\n\n// Indeterminate: it does not, and says so by drifting\n<InfusionLoader label=\"Preparing the export\" />",
    "guidance": {
      "use": [
        "Multi-step work whose progress is genuinely known: imports, uploads, record transfers, batch exports.",
        "Anywhere a reader needs to decide whether to keep waiting or come back later.",
        "Indeterminate, as a compact neutral loader in a wide container."
      ],
      "avoid": [
        "Invented percentages. If the number is a guess, leave progress off and let the slug drift.",
        "Narrow containers — the capsule needs about 64px of width to read.",
        "Clinical severity. This is a measurement of work, never of a patient."
      ]
    },
    "accessibility": [
      {
        "label": "Two roles, chosen by the data",
        "detail": "Indeterminate is role=status in a polite live region. Determinate is role=progressbar with aria-valuemin, aria-valuemax, aria-valuenow, and a spoken aria-valuetext."
      },
      {
        "label": "Named from the visible label",
        "detail": "In determinate mode the progressbar takes its accessible name from the same label element a sighted reader sees, so the two cannot disagree."
      },
      {
        "label": "Reduced motion is a designed state",
        "detail": "Determinate mode is already still and stays exact. Indeterminate mode stops drifting and breathes in opacity instead."
      }
    ],
    "limitations": [
      "Does not compute progress. The application supplies the number and owns its truthfulness.",
      "Requires styles/oxygen-loader.css, installed with loader-core.",
      "Percentage only. It shows no time estimate and no per-step breakdown."
    ],
    "related": [
      "pulse-loader",
      "rhythm-loader",
      "breath-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/infusion-loader.json"
  },
  {
    "name": "pulse-loader",
    "title": "Pulse Loader",
    "tier": "free",
    "status": "beta",
    "since": "0.2.0",
    "layer": "primitive",
    "distribution": "registry",
    "summary": "An open heart with a rhythm line running through it, beating at a resting sixty. The library's signature wait.",
    "description": "Page and region loader: an open heart that draws itself once, then beats at a resting 60bpm while a monitor sweep crosses the rhythm line. Renders as Rhythm Loader below 40px, where the heart's detail would collapse.",
    "rationale": "A page loader is the first thing a clinician or a patient sees, it plays while the system is at its most fragile, and it is judged in the first three hundred milliseconds. This one is built from measured cardiac timing rather than from a spinner's tempo: sixty beats a minute is a resting sinus rhythm, the beat scales by seven percent so it is noticed peripherally and never tracked, and the heart draws in once rather than once per loop so the animation has no seam. Every colour is a semantic token and the whole thing is SVG and CSS, which means it renders before any JavaScript bundle has loaded — the one requirement a page loader has that a component loader does not.",
    "categories": [
      "Loaders",
      "Feedback"
    ],
    "fhir": [],
    "states": [
      "Indeterminate",
      "Delayed (not yet shown)",
      "Slow wait",
      "Reduced motion",
      "Below 40px (renders as Rhythm Loader)"
    ],
    "props": [
      {
        "name": "actions",
        "type": "React.ReactNode",
        "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
        "required": false
      },
      {
        "name": "announce",
        "type": "LoaderAnnounce | undefined",
        "description": "Live-region politeness while indeterminate.",
        "required": false
      },
      {
        "name": "bpm",
        "type": "number | undefined",
        "description": "Beats per minute, 40–100. Clamped, because this is decoration on a healthcare screen and a loader beating at 180 would be read as a number by the only people qualified to read it.",
        "required": false
      },
      {
        "name": "delay",
        "type": "number | undefined",
        "description": "Wait this long before appearing, so a fast response never flashes a loader.",
        "required": false
      },
      {
        "name": "hint",
        "type": "string | undefined",
        "description": "A second line under the label. Never a substitute for it.",
        "required": false
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
        "required": false
      },
      {
        "name": "minDuration",
        "type": "number | undefined",
        "description": "Once visible, stay at least this long, so the loader never blinks out.",
        "required": false
      },
      {
        "name": "mode",
        "type": "LoaderMode | undefined",
        "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
        "required": false
      },
      {
        "name": "motion",
        "type": "LoaderMotion | undefined",
        "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void) | undefined",
        "description": "Fires once, when `slowAfter` elapses.",
        "required": false
      },
      {
        "name": "open",
        "type": "boolean | undefined",
        "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
        "required": false
      },
      {
        "name": "progress",
        "type": "number | undefined",
        "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
        "required": false
      },
      {
        "name": "scrim",
        "type": "boolean | undefined",
        "description": "Translucent backdrop behind `overlay` and `page`.",
        "required": false
      },
      {
        "name": "showLabel",
        "type": "boolean | undefined",
        "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
        "required": false
      },
      {
        "name": "size",
        "type": "number | LoaderSize | undefined",
        "description": "Named step or an explicit art width in pixels.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number | undefined",
        "description": "Announce a stall after this long. 0 disables.",
        "required": false
      },
      {
        "name": "slowHint",
        "type": "string | undefined",
        "description": "Replaces the default stall wording.",
        "required": false
      },
      {
        "name": "speed",
        "type": "number | undefined",
        "description": "Cadence multiplier, 0.5–2. Clamped.",
        "required": false,
        "default": "1"
      }
    ],
    "extendsType": "LoaderCommonProps",
    "exports": [
      {
        "name": "PulseLoader",
        "props": [
          {
            "name": "actions",
            "type": "React.ReactNode",
            "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
            "required": false
          },
          {
            "name": "announce",
            "type": "LoaderAnnounce | undefined",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "bpm",
            "type": "number | undefined",
            "description": "Beats per minute, 40–100. Clamped, because this is decoration on a healthcare screen and a loader beating at 180 would be read as a number by the only people qualified to read it.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number | undefined",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string | undefined",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number | undefined",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode | undefined",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false
          },
          {
            "name": "motion",
            "type": "LoaderMotion | undefined",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void) | undefined",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean | undefined",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number | undefined",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean | undefined",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean | undefined",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize | undefined",
            "description": "Named step or an explicit art width in pixels.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number | undefined",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string | undefined",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number | undefined",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false,
            "default": "1"
          }
        ],
        "extendsType": "LoaderCommonProps"
      },
      {
        "name": "PageLoader",
        "props": [
          {
            "name": "actions",
            "type": "React.ReactNode",
            "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
            "required": false
          },
          {
            "name": "announce",
            "type": "LoaderAnnounce | undefined",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "bpm",
            "type": "number | undefined",
            "description": "Beats per minute, 40–100. Clamped, because this is decoration on a healthcare screen and a loader beating at 180 would be read as a number by the only people qualified to read it.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number | undefined",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string | undefined",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number | undefined",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode | undefined",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false,
            "default": "\"page\""
          },
          {
            "name": "motion",
            "type": "LoaderMotion | undefined",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void) | undefined",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean | undefined",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number | undefined",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean | undefined",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean | undefined",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize | undefined",
            "description": "Named step or an explicit art width in pixels.",
            "required": false,
            "default": "\"xl\""
          },
          {
            "name": "slowAfter",
            "type": "number | undefined",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string | undefined",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number | undefined",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false
          }
        ],
        "extendsType": "LoaderCommonProps"
      }
    ],
    "usage": "import { PageLoader, PulseLoader } from \"@/components/oxygen/pulse-loader\";\n\n// Full-page wait, e.g. Next.js app/loading.tsx\n<PageLoader label=\"Loading your records\" />\n\n// Region overlay that never flashes and admits a stall\n<PulseLoader\n  mode=\"overlay\"\n  label=\"Loading results\"\n  delay={200}\n  slowAfter={8000}\n  onSlow={reportSlowWait}\n/>",
    "guidance": {
      "use": [
        "Application boot and full-page route changes, where the brand moment is worth the space.",
        "Waits of unknown length over about 300ms. Pair with delay so a fast response never flashes it.",
        "At 56px or larger. Below 40px it deliberately renders the rhythm line instead."
      ],
      "avoid": [
        "Resuscitation, cardiac arrest, oncology, and bereavement workflows — a beating heart reads as glib there. Use Rhythm Loader or Breath Loader.",
        "Layouts you already know the shape of. A skeleton that matches the content is better than a spinner over it.",
        "As a progress indicator. It never claims to know how long is left; use Infusion Loader when the answer is known."
      ]
    },
    "accessibility": [
      {
        "label": "Announced once, in words",
        "detail": "role=status with aria-live=polite. The label is always in the DOM — visually hidden when showLabel is false — because an empty live region announces nothing at all."
      },
      {
        "label": "Art is hidden from assistive technology",
        "detail": "The SVG is aria-hidden. A decorative mark that announces itself becomes a second, meaningless label on every wait in the product."
      },
      {
        "label": "Reduced motion is a designed state",
        "detail": "Under prefers-reduced-motion the heart completes, the track comes to full strength, and the mark breathes in opacity. Nothing scales and nothing travels. Pausing mid-sweep would look like a component that failed."
      },
      {
        "label": "Below the flash threshold",
        "detail": "Clamped to 40–100bpm, so the fastest cadence is 1.67Hz against WCAG 2.3.1's three-flash limit, and the beat changes scale by seven percent rather than luminance."
      }
    ],
    "limitations": [
      "Not a progress source. The application supplies progress; the loader only renders it.",
      "Requires styles/oxygen-loader.css, installed with loader-core. Without it the loader renders as a static mark rather than an animated one.",
      "One cardiac rhythm. It does not depict arrhythmia, and it must never be read as a patient's actual rate."
    ],
    "related": [
      "rhythm-loader",
      "breath-loader",
      "infusion-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/pulse-loader.json"
  },
  {
    "name": "rhythm-loader",
    "title": "Rhythm Loader",
    "tier": "free",
    "status": "beta",
    "since": "0.2.0",
    "layer": "primitive",
    "distribution": "registry",
    "summary": "One rhythm strip, swept like a monitor. The quietest way for an interface to say it is still there.",
    "description": "Loader drawn as a single PQRST complex on a baseline, swept once per beat by a bright head with a fading tail. Nothing scales and nothing grows, and it stays legible down to 20px.",
    "rationale": "The clinical default, and the loader to reach for when a beating heart would be the wrong thing to put in front of someone. It carries no symbol, only the artifact a clinician already reads all day: P wave, QRS complex, T wave, in those proportions rather than the decorative zig-zag that generic ECG graphics use. Because it never scales, it is also the only cardiac loader that survives at twenty pixels — so it is what Pulse Loader renders when it is asked to be small, and what belongs beside a button label or in a table row.",
    "categories": [
      "Loaders",
      "Feedback"
    ],
    "fhir": [],
    "states": [
      "Indeterminate",
      "Delayed (not yet shown)",
      "Slow wait",
      "Reduced motion",
      "Inline"
    ],
    "props": [
      {
        "name": "actions",
        "type": "React.ReactNode",
        "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
        "required": false
      },
      {
        "name": "announce",
        "type": "LoaderAnnounce | undefined",
        "description": "Live-region politeness while indeterminate.",
        "required": false
      },
      {
        "name": "bpm",
        "type": "number | undefined",
        "description": "Beats per minute, 40–100. Clamped to a resting range.",
        "required": false
      },
      {
        "name": "delay",
        "type": "number | undefined",
        "description": "Wait this long before appearing, so a fast response never flashes a loader.",
        "required": false
      },
      {
        "name": "hint",
        "type": "string | undefined",
        "description": "A second line under the label. Never a substitute for it.",
        "required": false
      },
      {
        "name": "label",
        "type": "string | undefined",
        "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
        "required": false
      },
      {
        "name": "minDuration",
        "type": "number | undefined",
        "description": "Once visible, stay at least this long, so the loader never blinks out.",
        "required": false
      },
      {
        "name": "mode",
        "type": "LoaderMode | undefined",
        "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
        "required": false
      },
      {
        "name": "motion",
        "type": "LoaderMotion | undefined",
        "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void) | undefined",
        "description": "Fires once, when `slowAfter` elapses.",
        "required": false
      },
      {
        "name": "open",
        "type": "boolean | undefined",
        "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
        "required": false
      },
      {
        "name": "progress",
        "type": "number | undefined",
        "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
        "required": false
      },
      {
        "name": "scrim",
        "type": "boolean | undefined",
        "description": "Translucent backdrop behind `overlay` and `page`.",
        "required": false
      },
      {
        "name": "showLabel",
        "type": "boolean | undefined",
        "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
        "required": false
      },
      {
        "name": "size",
        "type": "number | LoaderSize | undefined",
        "description": "Named step or an explicit art width in pixels.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number | undefined",
        "description": "Announce a stall after this long. 0 disables.",
        "required": false
      },
      {
        "name": "slowHint",
        "type": "string | undefined",
        "description": "Replaces the default stall wording.",
        "required": false
      },
      {
        "name": "speed",
        "type": "number | undefined",
        "description": "Cadence multiplier, 0.5–2. Clamped.",
        "required": false,
        "default": "1"
      }
    ],
    "extendsType": "LoaderCommonProps",
    "exports": [
      {
        "name": "RhythmLoader",
        "props": [
          {
            "name": "actions",
            "type": "React.ReactNode",
            "description": "Rendered under the hint — a Retry or Go back control while someone waits.",
            "required": false
          },
          {
            "name": "announce",
            "type": "LoaderAnnounce | undefined",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "bpm",
            "type": "number | undefined",
            "description": "Beats per minute, 40–100. Clamped to a resting range.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number | undefined",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string | undefined",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string | undefined",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number | undefined",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode | undefined",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false
          },
          {
            "name": "motion",
            "type": "LoaderMotion | undefined",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void) | undefined",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean | undefined",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number | undefined",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean | undefined",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean | undefined",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize | undefined",
            "description": "Named step or an explicit art width in pixels.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number | undefined",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string | undefined",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number | undefined",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false,
            "default": "1"
          }
        ],
        "extendsType": "LoaderCommonProps"
      }
    ],
    "usage": "import { RhythmLoader } from \"@/components/oxygen/rhythm-loader\";\n\n// Inline, beside a control\n<RhythmLoader size=\"sm\" label=\"Loading results\" />\n\n// Clinical dashboard panel, slower cadence\n<RhythmLoader mode=\"overlay\" bpm={52} label=\"Loading the worklist\" delay={200} />",
    "guidance": {
      "use": [
        "Clinical density: worklists, results tables, monitoring dashboards.",
        "Inline, beside a control or in a row, where a full loader would be too large.",
        "Anywhere Pulse Loader's heart would be the wrong tone — cardiac, resuscitation, bereavement."
      ],
      "avoid": [
        "As a live rhythm display. It is a fixed loop and shows no patient data whatsoever.",
        "On patient-facing screens where an ECG could be read as a result about them. Breath Loader is the calmer choice.",
        "Layouts you already know the shape of — a matching skeleton says more."
      ]
    },
    "accessibility": [
      {
        "label": "Announced once, in words",
        "detail": "role=status with aria-live=polite. The label is always in the DOM, visually hidden when showLabel is false, so the wait is announced even when it is not written."
      },
      {
        "label": "Legible at 20px",
        "detail": "Stroke width stops scaling below 28px, so the trace stays visible at inline sizes rather than thinning to nothing."
      },
      {
        "label": "Reduced motion is a designed state",
        "detail": "The full trace is shown at strength and breathes in opacity. No sweep, no travel, nothing frozen mid-path."
      }
    ],
    "limitations": [
      "Not a progress source. Use Infusion Loader when the remaining time is genuinely known.",
      "Requires styles/oxygen-loader.css, installed with loader-core.",
      "A single fixed complex. It does not vary, and it is not clinical data."
    ],
    "related": [
      "pulse-loader",
      "breath-loader",
      "infusion-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/rhythm-loader.json"
  },
  {
    "name": "switch",
    "title": "Switch",
    "tier": "free",
    "status": "experimental",
    "since": "0.3.0",
    "layer": "primitive",
    "distribution": "registry",
    "summary": "A binary control for a record that is shared, asynchronous, and often missing the fact you are asking it about.",
    "description": "Switch with three independent axes: the value the record holds, the phase of the write, and whether you may change it. Models the request and the outcome separately, so it never renders a state it cannot substantiate.",
    "rationale": "A switch promises something it usually cannot keep — that a thing is now true. In healthcare that promise gets made over a hospital network, about a fact that may never have been asked, on a record that may already be signed and that somebody else may be editing. Every one of those is a state a clinician acts on, and a conventional switch renders all of them as ordinary on or off. This one separates the request from the outcome: a write in flight is visible and still operable, a failed write animates back and interrupts rather than snapping back silently, an absent answer says which kind of absence it is, and a value someone else changed underneath you shows both readings and asks. The API matches Ant Design's exactly and takes no dependency on it, so an existing antd form migrates by changing an import.",
    "categories": [
      "Forms",
      "Primitives"
    ],
    "fhir": [],
    "states": [
      "On",
      "Off",
      "Unknown (absence, with a reason)",
      "Pending — the write is in flight",
      "Committed",
      "Reverted — the write failed",
      "Blocked — refused before trying",
      "Queued — offline",
      "Stale — changed by someone else",
      "Read-only, with a reason",
      "Disabled",
      "Time-boxed (until)",
      "Awaiting confirmation",
      "Segmented — both answers visible",
      "Chip — a filter bar",
      "Row — the whole row is the target"
    ],
    "props": [],
    "exports": [],
    "usage": "import { Switch, SwitchField, SwitchList } from \"@/components/oxygen/switch\";\n\n// The whole three-phase UX, including rollback and announcement.\n<Switch\n  label=\"Contact precautions\"\n  stateLabels=\"in-effect\"\n  tone=\"caution\"\n  checked={precautions}\n  onCommit={async (next) => {\n    await api.setPrecautions({ encounter, contact: next });\n    setPrecautions(next);\n  }}\n  now={serverTime}\n/>\n\n// An absence that says which kind it is.\n<Switch\n  label=\"Advance directive on file\"\n  checked=\"unknown\"\n  absentReason=\"not-collected\"\n  stateLabels=\"yes-no\"\n/>\n\n// A group, counting unknown separately from off.\n<SwitchList title=\"Isolation precautions\" counts={{ on: 2, total: 5, unknown: 1 }}>\n  <SwitchField label=\"Contact\" description=\"Gown and gloves on entry.\" checked />\n  <SwitchField label=\"Airborne\" readOnly lockedReason=\"No negative-pressure room on this unit.\" />\n</SwitchList>",
    "guidance": {
      "use": [
        "A single independent setting that takes effect immediately, has two states, and is worth seeing at a glance in a list of similar settings.",
        "Anything written over a network you do not control — pass onCommit a promise and the pending, revert and announcement behaviour comes with it.",
        "Clinical flags whose absence is meaningful: pass checked=\"unknown\" with an absentReason rather than defaulting to off.",
        "Suppressions and overrides — set tone=\"caution\" or \"critical\" so an on-state that removes a safety net does not read as brand-affirmative green.",
        "Consequential but routine actions on a ward tablet: confirm=\"hold\" prevents brush-taps without a second surface to hit."
      ],
      "avoid": [
        "A question with three real answers. Yes, No and Not asked are three equally selectable answers; reach for appearance=\"segmented\", which renders both answers as visible choices.",
        "A form that commits on submit. A switch means applied now — use a checkbox, or set commit=\"deferred\" and accept the unsaved-change marker.",
        "The only display of a safety state. A switch is a control and lives where you put it; a suppressed alarm also needs a persistent banner.",
        "Mutually exclusive options. Two switches where only one may be on is a radio group that has been taken apart.",
        "A group header meaning \"some children are on\". That is a checkbox with indeterminate — this component's third state means nobody was asked, which is a different fact."
      ]
    },
    "accessibility": [
      {
        "label": "A real switch, not a styled div",
        "detail": "A button with role=switch and aria-checked. Space and Enter both activate. The label is associated by aria-labelledby, and the state word, the locked reason and any error are wired through aria-describedby."
      },
      {
        "label": "The hit area never shrinks with the pill",
        "detail": "The target is a pseudo-element sized max(track, --ox-switch-target-min), which follows the density profile. A 26x14px micro switch in a clinical table still presents a 24px-or-larger target."
      },
      {
        "label": "State survives without colour",
        "detail": "Thumb position, a thumb glyph, and a text state word each carry the state alone. On-track and off-track sit within about 1.2:1 of each other in relative luminance, so colour cannot be the signal in monochrome or forced colours."
      },
      {
        "label": "Pending does not remove the control",
        "detail": "No disabled attribute and no aria-disabled while a write is in flight: focus is retained, the accessible name is unchanged, and aria-busy is set. antd's loading prop maps here rather than to a disabled state."
      },
      {
        "label": "A failed write interrupts",
        "detail": "Success is announced politely. A revert or a block is announced assertively and includes the word the value now holds, because a listener who hears only that it failed still does not know what is true."
      },
      {
        "label": "Read-only stays reachable",
        "detail": "aria-readonly=true, still in the tab order, with the reason exposed through aria-describedby. disabled removes a control from a screen-reader user's world entirely, which is why it is documented as the last resort."
      },
      {
        "label": "Segmented changes the ARIA role on purpose",
        "detail": "Two labelled cells that both look pressable are a radiogroup, not a switch. appearance=segmented renders role=radiogroup with two radios, so the semantics match what a reader sees."
      },
      {
        "label": "Holding is never the only path",
        "detail": "confirm=hold is a timed input, so SC 2.2.1 applies. The hold duration is a token a host can set to zero, and keyboard or assistive-technology activation opens the confirmation dialog instead of requiring a sustained press."
      },
      {
        "label": "Reduced motion is designed",
        "detail": "Thumb travel collapses to 1ms, the pending stripe holds a static diagonal rather than freezing mid-march, and a revert still ends at the record's value with its error visible."
      }
    ],
    "limitations": [
      "aria-checked=\"mixed\" on role=switch is spec-valid but unevenly supported. The state word is always in the accessible description so the announcement is correct either way, but the NVDA, JAWS and VoiceOver matrix must be recorded before this reaches stable.",
      "Diverges from antd in one place, deliberately: loading maps to phase=\"pending\" and does not disable the control.",
      "Does not write on expiry. until renders the window and fires onExpire; the application owns the write, because a client clock deciding to lift a clinical flag is a defect.",
      "confirm=\"countersign\" collects a second identity through the caller's verify callback. It does not authenticate anyone, and it is not a signature capture — compose it with @oxygenui-design/signature when evidence is required.",
      "audience selects the default label preset and size. Wiring it to separate clinician and patient intl catalogs is not done yet.",
      "Requires styles/oxygen-switch.css, installed with switch-core."
    ],
    "related": [],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/switch.json"
  },
  {
    "name": "signature",
    "title": "Signature",
    "tier": "free",
    "status": "beta",
    "since": "0.1.0",
    "layer": "clinical",
    "distribution": "package",
    "packageName": "@oxygenui-design/signature",
    "summary": "Signature capture that records the times nobody signed — declined, unable, verbal, on paper — not just the times they did.",
    "description": "Draw, type or upload a signature inside an Ant Design form, and record the outcomes a signature pad has no answer for. The value is a discriminated union over seven outcomes rather than a base64 string, so a refusal is a fact the record can hold.",
    "rationale": "Almost every signature component solves one problem: get ink from a pointer onto a canvas and hand back a PNG. That is about fifteen percent of what a healthcare product needs. The rest is everything the PNG does not say — who signed, in what capacity, what they were agreeing to, and, most often of all, what to record when nobody signed at all. A patient who refused and a form nobody opened are different facts with different consequences, and a component whose only states are empty and signed makes the difference unrecordable. That is the same argument AbsentValue makes one tier down, at a much higher stake.",
    "categories": [
      "Clinical",
      "Data Entry"
    ],
    "fhir": [],
    "states": [
      "Signed",
      "Declined to sign",
      "Unable to sign (witnessed)",
      "Consented verbally (witnessed)",
      "Signed on paper",
      "Awaiting countersignature",
      "Consent withdrawn",
      "Required and empty",
      "Locked / read-only"
    ],
    "props": [],
    "exports": [],
    "usage": "import { Form } from \"antd\";\nimport { Signature, signatureRequired } from \"@oxygenui-design/signature\";\nimport \"@oxygenui-design/signature/styles.css\";\n\n// signatureRequired() accepts a decline as an answer. A rule demanding\n// outcome === \"signed\" would make refusal impossible to submit.\n<Form.Item name=\"consent\" label=\"Patient signature\" rules={[signatureRequired()]}>\n  <Signature\n    now={serverTime}\n    meaning=\"consent\"\n    attestation=\"I have read the information about this procedure, I have had the chance to ask questions, and I agree to go ahead.\"\n    subject={{ display: \"Randall, Josh\", reference: \"Patient/4471902\" }}\n    recordedBy={{ name: \"A. Okafor\", credential: \"RN\" }}\n    outcomes={[\"declined\", \"unable\", \"verbal\", \"on-paper\"]}\n  />\n</Form.Item>;",
    "guidance": {
      "use": [
        "Consent forms, treatment authorisations, and anywhere a refusal must be recordable rather than left blank.",
        "Clinician attestation and countersignature, where the record must say who is accountable and in what capacity.",
        "Signing on behalf of someone — a parent for a minor, a proxy for an incapacitated adult — which the capacity field captures explicitly.",
        "Inside an Ant Design form: it satisfies the custom-control contract, so `Form.Item` wiring and validation status work with no adapter."
      ],
      "avoid": [
        "Controlled-substance prescribing. DEA EPCS is a separate and far stricter regime — identity proofing, two-factor, a certified application — and this does not satisfy it.",
        "Anywhere you need cryptographic non-repudiation from the component alone. A PNG of a mark carries no integrity guarantee; pair it with a detached JWS.",
        "As an identity check. It records the identity the host asserts and cannot verify it; 21 CFR 11.200's two-component rule lives in your auth layer.",
        "Draw-only configurations. `methods={[\"draw\"]}` is a WCAG Level A failure that renders perfectly and passes every other test."
      ]
    },
    "accessibility": [
      {
        "label": "Operable without a pointer",
        "detail": "Drawing is a path-dependent input technique, and WCAG 2.1.1 (Level A) requires the underlying function — recording assent — to be operable by keyboard. The typed path is that mechanism, not a fallback, and a test signs the form using only tab and keyboard events. Removing it is a lint error."
      },
      {
        "label": "The canvas is not the control",
        "detail": "A canvas has no implicit ARIA role, and role=img on a live capture surface would assert a non-interactive graphic. The widget is a labelled group with real DOM controls; the surface is aria-hidden and the operable path is native HTML."
      },
      {
        "label": "State is announced, because nothing else reports it",
        "detail": "SVG and canvas changes are invisible to assistive technology. A polite live region announces capture and clearing, counting finished strokes only so it does not speak while someone is mid-signature."
      },
      {
        "label": "A finished signature is named by whose it is",
        "detail": "The equivalent purpose of a signature image under SC 1.1.1 is whose it is and that it was given — never a description of the strokes. Alt text reads 'Signature of Josh Randall, signed 16 August 2026'."
      },
      {
        "label": "Legible under forced colors",
        "detail": "The ink is currentColor on real SVG elements rather than a script-painted canvas bitmap, so it is recoloured with everything else instead of vanishing against a forced background."
      },
      {
        "label": "Targets meet the 24px floor",
        "detail": "SC 2.5.8 exempts the canvas — a spatially-selected area counts as one target — so it is entirely a toolbar concern. Undo, redo and clear are all at least 24 by 24."
      }
    ],
    "limitations": [
      "Ant Design is a peer dependency. This is the only Oxygen component that is not distributed as copy-as-source, because copying antd's Modal and Form into a consumer's repository would be a fork rather than a component.",
      "Signature.data is a graphical signature only — an image of a mark. Deployments needing non-repudiation add a second Signature entry carrying a JWS.",
      "The timestamp is a required prop, not read from the clock. A browser clock is not evidence, and 42 CFR 482.24(c)(1) wants entries dated by whoever is accountable.",
      "Stroke biometrics are captured into the model but never emitted unless explicitly opted in, because whether stroke dynamics are a 'writing sample' is unsettled under BIPA and CUBI.",
      "Interpreter attestation, adopt-and-apply, and saved signatures are designed but not built."
    ],
    "related": [],
    "dependencies": [
      "antd",
      "@oxygenui-design/signature-core"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/signature.json"
  }
];

export const BY_NAME: ReadonlyMap<string, ComponentDoc> = new Map(
  CATALOG.map((component) => [component.name, component]),
);

export const ALL_CATEGORIES: readonly string[] = [
  ...new Set(CATALOG.flatMap((component) => component.categories)),
].sort();
