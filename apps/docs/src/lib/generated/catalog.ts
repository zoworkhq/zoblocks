// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md

import type { ComponentDoc } from "@zoblocks/component-meta";

export const CATALOG: ComponentDoc[] = [
  {
    "name": "accordion",
    "title": "Accordion",
    "tier": "free",
    "status": "beta",
    "since": "0.3.0",
    "layer": "primitive",
    "distribution": "registry",
    "summary": "A disclosure widget whose headers can be read while closed, with a per-section access model for content a reader may not simply be shown.",
    "tagline": "Headers readable while closed, with per-section access control.",
    "description": "Collapsible sections with a summary slot in the header, clinical severity on the leading edge, sections that cannot be closed, and four kinds of gate between a reader and content that is governed rather than merely hidden. Ant Design's Collapse API, with the accordion mode's accessibility defects fixed.",
    "rationale": "Every accordion assumes hidden means unneeded. In a behavioral health record it does not: what is collapsed may be a suicide-risk item, a safety plan someone needs in ninety seconds, a note the patient has a legal right to read but may not be ready to, or a substance-use record governed by a different federal rule than the chart around it. Three consequences follow, and together they are the component. Collapsed is not absent, so the header carries a summary and a severity rail. Disclosure is an event rather than a state change, so opening a governed section can require a consent, a reason code, or nothing but the reader's own choice. And content this reader cannot obtain still gets a row that says so, because deleting it claims the record is complete — which is CONTENT.md's governing rule applied to the one component whose entire job is omitting facts on purpose.",
    "categories": [
      "Disclosure",
      "Layout"
    ],
    "fhir": [],
    "states": [
      "Closed",
      "Open",
      "Summary in the header",
      "Severity on the leading edge",
      "Pinned — cannot be closed",
      "Advisory gate",
      "Reason gate",
      "Consent gate",
      "Consent refused",
      "Withheld",
      "Single open at a time",
      "Nested, with heading levels"
    ],
    "props": [
      {
        "name": "items",
        "type": "readonly AccordionItem[]",
        "description": "The sections. Extends Ant Design's `ItemType` with `summary`, `severity`, `pinned` and `access`.",
        "required": true
      },
      {
        "name": "accordion",
        "type": "boolean",
        "description": "One section open at a time. Ant Design's name, kept for familiarity. Unlike antd it changes only the state policy; the roles, heading and region wiring are identical either way.",
        "required": false,
        "default": "false"
      },
      {
        "name": "activeKey",
        "type": "React.Key | readonly React.Key[]",
        "description": "Open sections, controlled.",
        "required": false
      },
      {
        "name": "bordered",
        "type": "boolean",
        "description": "Draw the container border.",
        "required": false,
        "default": "true"
      },
      {
        "name": "classNames",
        "type": "Partial<Record<AccordionSlot, string>>",
        "description": "Per-slot class names, matching Ant Design v6's semantic DOM.",
        "required": false
      },
      {
        "name": "collapsible",
        "type": "'header' | 'icon' | 'disabled'",
        "description": "Which part of the header activates the section.",
        "required": false
      },
      {
        "name": "defaultActiveKey",
        "type": "React.Key | readonly React.Key[]",
        "description": "Open sections on first render, uncontrolled.",
        "required": false
      },
      {
        "name": "density",
        "type": "AccordionDensity",
        "description": "Overrides any inherited `data-zb-density`.",
        "required": false
      },
      {
        "name": "destroyOnHidden",
        "type": "boolean",
        "description": "Unmount a section's content when it closes. Ant Design v6 naming.",
        "required": false,
        "default": "false"
      },
      {
        "name": "expandIcon",
        "type": "((props: { item: AccordionItem; isOpen: boolean; }) => React.ReactNode)",
        "description": "Replace the chevron. Receives the item and whether it is open.",
        "required": false
      },
      {
        "name": "expandIconPlacement",
        "type": "'start' | 'end'",
        "description": "Ant Design v6 naming — `expandIconPosition` was renamed in v6.",
        "required": false,
        "default": "\"start\""
      },
      {
        "name": "findable",
        "type": "boolean",
        "description": "Make collapsed content reachable by find-in-page and fragment navigation. On by default. Turning it off is a decision to make Ctrl+F miss content the record contains.",
        "required": false,
        "default": "true"
      },
      {
        "name": "ghost",
        "type": "boolean",
        "description": "Transparent, borderless, no header fill.",
        "required": false,
        "default": "false"
      },
      {
        "name": "headingLevel",
        "type": "AccordionHeadingLevel",
        "description": "Heading level for every trigger. Required at a nesting boundary and not knowable by the component. For a screen-reader user the heading list is the chart's table of contents, and a nested accordion that hardcodes its level flattens it silently.",
        "required": false,
        "default": "3"
      },
      {
        "name": "locale",
        "type": "Partial<AccordionLocale>",
        "description": "Replaces the built-in wording. Patient and clinician catalogs are separate.",
        "required": false
      },
      {
        "name": "now",
        "type": "(() => string)",
        "description": "Injectable clock for the disclosure timestamp. Defaults to now, ISO 8601.",
        "required": false
      },
      {
        "name": "onChange",
        "type": "((keys: React.Key[]) => void)",
        "description": "Fires with every open key, always as an array — including in single mode.",
        "required": false
      },
      {
        "name": "onDisclose",
        "type": "((event: DisclosureEvent) => boolean | Promise<boolean>)",
        "description": "Called when a reader asks to see gated content. Resolve false to refuse.",
        "required": false
      },
      {
        "name": "panelRole",
        "type": "AccordionPanelRole",
        "description": "`region` landmarks on panels. `auto` follows APG: the landmark up to six simultaneously-openable sections, omitted above that, where a landmark list stops being navigation.",
        "required": false,
        "default": "\"auto\""
      },
      {
        "name": "printExpanded",
        "type": "boolean",
        "description": "Expand every permitted section for printing. Never a withheld one.",
        "required": false,
        "default": "true"
      },
      {
        "name": "size",
        "type": "AccordionSize",
        "description": "Ant Design v6 naming — `middle` was renamed in v6.",
        "required": false,
        "default": "\"medium\""
      },
      {
        "name": "styles",
        "type": "Partial<Record<AccordionSlot, React.CSSProperties>>",
        "description": "Per-slot inline styles, matching Ant Design v6's semantic DOM.",
        "required": false
      },
      {
        "name": "variant",
        "type": "AccordionVariant",
        "description": "Container shape. `separate` gives each section its own card.",
        "required": false
      }
    ],
    "extendsType": "Omit< React.HTMLAttributes<HTMLDivElement>, \"onChange\" | \"children\" | \"defaultValue\" >",
    "exports": [
      {
        "name": "Accordion",
        "props": [
          {
            "name": "items",
            "type": "readonly AccordionItem[]",
            "description": "The sections. Extends Ant Design's `ItemType` with `summary`, `severity`, `pinned` and `access`.",
            "required": true
          },
          {
            "name": "accordion",
            "type": "boolean",
            "description": "One section open at a time. Ant Design's name, kept for familiarity. Unlike antd it changes only the state policy; the roles, heading and region wiring are identical either way.",
            "required": false,
            "default": "false"
          },
          {
            "name": "activeKey",
            "type": "React.Key | readonly React.Key[]",
            "description": "Open sections, controlled.",
            "required": false
          },
          {
            "name": "bordered",
            "type": "boolean",
            "description": "Draw the container border.",
            "required": false,
            "default": "true"
          },
          {
            "name": "classNames",
            "type": "Partial<Record<AccordionSlot, string>>",
            "description": "Per-slot class names, matching Ant Design v6's semantic DOM.",
            "required": false
          },
          {
            "name": "collapsible",
            "type": "'header' | 'icon' | 'disabled'",
            "description": "Which part of the header activates the section.",
            "required": false
          },
          {
            "name": "defaultActiveKey",
            "type": "React.Key | readonly React.Key[]",
            "description": "Open sections on first render, uncontrolled.",
            "required": false
          },
          {
            "name": "density",
            "type": "AccordionDensity",
            "description": "Overrides any inherited `data-zb-density`.",
            "required": false
          },
          {
            "name": "destroyOnHidden",
            "type": "boolean",
            "description": "Unmount a section's content when it closes. Ant Design v6 naming.",
            "required": false,
            "default": "false"
          },
          {
            "name": "expandIcon",
            "type": "((props: { item: AccordionItem; isOpen: boolean; }) => React.ReactNode)",
            "description": "Replace the chevron. Receives the item and whether it is open.",
            "required": false
          },
          {
            "name": "expandIconPlacement",
            "type": "'start' | 'end'",
            "description": "Ant Design v6 naming — `expandIconPosition` was renamed in v6.",
            "required": false,
            "default": "\"start\""
          },
          {
            "name": "findable",
            "type": "boolean",
            "description": "Make collapsed content reachable by find-in-page and fragment navigation. On by default. Turning it off is a decision to make Ctrl+F miss content the record contains.",
            "required": false,
            "default": "true"
          },
          {
            "name": "ghost",
            "type": "boolean",
            "description": "Transparent, borderless, no header fill.",
            "required": false,
            "default": "false"
          },
          {
            "name": "headingLevel",
            "type": "AccordionHeadingLevel",
            "description": "Heading level for every trigger. Required at a nesting boundary and not knowable by the component. For a screen-reader user the heading list is the chart's table of contents, and a nested accordion that hardcodes its level flattens it silently.",
            "required": false,
            "default": "3"
          },
          {
            "name": "locale",
            "type": "Partial<AccordionLocale>",
            "description": "Replaces the built-in wording. Patient and clinician catalogs are separate.",
            "required": false
          },
          {
            "name": "now",
            "type": "(() => string)",
            "description": "Injectable clock for the disclosure timestamp. Defaults to now, ISO 8601.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((keys: React.Key[]) => void)",
            "description": "Fires with every open key, always as an array — including in single mode.",
            "required": false
          },
          {
            "name": "onDisclose",
            "type": "((event: DisclosureEvent) => boolean | Promise<boolean>)",
            "description": "Called when a reader asks to see gated content. Resolve false to refuse.",
            "required": false
          },
          {
            "name": "panelRole",
            "type": "AccordionPanelRole",
            "description": "`region` landmarks on panels. `auto` follows APG: the landmark up to six simultaneously-openable sections, omitted above that, where a landmark list stops being navigation.",
            "required": false,
            "default": "\"auto\""
          },
          {
            "name": "printExpanded",
            "type": "boolean",
            "description": "Expand every permitted section for printing. Never a withheld one.",
            "required": false,
            "default": "true"
          },
          {
            "name": "size",
            "type": "AccordionSize",
            "description": "Ant Design v6 naming — `middle` was renamed in v6.",
            "required": false,
            "default": "\"medium\""
          },
          {
            "name": "styles",
            "type": "Partial<Record<AccordionSlot, React.CSSProperties>>",
            "description": "Per-slot inline styles, matching Ant Design v6's semantic DOM.",
            "required": false
          },
          {
            "name": "variant",
            "type": "AccordionVariant",
            "description": "Container shape. `separate` gives each section its own card.",
            "required": false
          }
        ],
        "extendsType": "Omit< React.HTMLAttributes<HTMLDivElement>, \"onChange\" | \"children\" | \"defaultValue\" >"
      },
      {
        "name": "Disclosure",
        "props": [
          {
            "name": "item",
            "type": "AccordionItem",
            "description": "The section. Same shape as an accordion item.",
            "required": true
          },
          {
            "name": "activeKey",
            "type": "React.Key | readonly React.Key[]",
            "description": "Open sections, controlled.",
            "required": false
          },
          {
            "name": "bordered",
            "type": "boolean",
            "description": "Draw the container border.",
            "required": false
          },
          {
            "name": "classNames",
            "type": "Partial<Record<AccordionSlot, string>>",
            "description": "Per-slot class names, matching Ant Design v6's semantic DOM.",
            "required": false
          },
          {
            "name": "collapsible",
            "type": "'header' | 'icon' | 'disabled'",
            "description": "Which part of the header activates the section.",
            "required": false
          },
          {
            "name": "defaultActiveKey",
            "type": "React.Key | readonly React.Key[]",
            "description": "Open sections on first render, uncontrolled.",
            "required": false
          },
          {
            "name": "defaultOpen",
            "type": "boolean",
            "description": "Open on first render, uncontrolled.",
            "required": false
          },
          {
            "name": "density",
            "type": "AccordionDensity",
            "description": "Overrides any inherited `data-zb-density`.",
            "required": false
          },
          {
            "name": "destroyOnHidden",
            "type": "boolean",
            "description": "Unmount a section's content when it closes. Ant Design v6 naming.",
            "required": false
          },
          {
            "name": "expandIcon",
            "type": "((props: { item: AccordionItem; isOpen: boolean; }) => React.ReactNode)",
            "description": "Replace the chevron. Receives the item and whether it is open.",
            "required": false
          },
          {
            "name": "expandIconPlacement",
            "type": "'start' | 'end'",
            "description": "Ant Design v6 naming — `expandIconPosition` was renamed in v6.",
            "required": false
          },
          {
            "name": "findable",
            "type": "boolean",
            "description": "Make collapsed content reachable by find-in-page and fragment navigation. On by default. Turning it off is a decision to make Ctrl+F miss content the record contains.",
            "required": false
          },
          {
            "name": "ghost",
            "type": "boolean",
            "description": "Transparent, borderless, no header fill.",
            "required": false
          },
          {
            "name": "headingLevel",
            "type": "AccordionHeadingLevel",
            "description": "Heading level for every trigger. Required at a nesting boundary and not knowable by the component. For a screen-reader user the heading list is the chart's table of contents, and a nested accordion that hardcodes its level flattens it silently.",
            "required": false
          },
          {
            "name": "locale",
            "type": "Partial<AccordionLocale>",
            "description": "Replaces the built-in wording. Patient and clinician catalogs are separate.",
            "required": false
          },
          {
            "name": "now",
            "type": "(() => string)",
            "description": "Injectable clock for the disclosure timestamp. Defaults to now, ISO 8601.",
            "required": false
          },
          {
            "name": "onDisclose",
            "type": "((event: DisclosureEvent) => boolean | Promise<boolean>)",
            "description": "Called when a reader asks to see gated content. Resolve false to refuse.",
            "required": false
          },
          {
            "name": "onOpenChange",
            "type": "((open: boolean) => void)",
            "description": "Fired when the section opens or closes, with the new state. For a gated section it fires only after the gate is satisfied — opening is an event, not a state change.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean",
            "description": "Open, controlled.",
            "required": false
          },
          {
            "name": "panelRole",
            "type": "AccordionPanelRole",
            "description": "`region` landmarks on panels. `auto` follows APG: the landmark up to six simultaneously-openable sections, omitted above that, where a landmark list stops being navigation.",
            "required": false
          },
          {
            "name": "printExpanded",
            "type": "boolean",
            "description": "Expand every permitted section for printing. Never a withheld one.",
            "required": false
          },
          {
            "name": "size",
            "type": "AccordionSize",
            "description": "Ant Design v6 naming — `middle` was renamed in v6.",
            "required": false
          },
          {
            "name": "styles",
            "type": "Partial<Record<AccordionSlot, React.CSSProperties>>",
            "description": "Per-slot inline styles, matching Ant Design v6's semantic DOM.",
            "required": false
          },
          {
            "name": "variant",
            "type": "AccordionVariant",
            "description": "Container shape. `separate` gives each section its own card.",
            "required": false
          }
        ],
        "extendsType": "Omit<AccordionProps, \"items\" | \"accordion\" | \"onChange\">"
      }
    ],
    "usage": "import { Accordion } from \"@/components/zoblocks/accordion\";\n\n<Accordion\n  headingLevel={2}\n  density=\"clinical\"\n  onDisclose={async (event) => {\n    await audit.record({ section: event.key, reason: event.reasonCode, at: event.at });\n    return true;\n  }}\n  items={[\n    {\n      key: \"risk\",\n      label: \"Risk & suicidality\",\n      severity: \"critical\",\n      summary: \"C-SSRS positive · 13 Aug\",\n      children: <RiskPanel {...risk} />,\n    },\n    {\n      key: \"sud\",\n      label: \"Substance use treatment\",\n      access: { kind: \"consent\", policy: \"42 CFR Part 2\", state: \"granted\" },\n      children: <SudPanel {...sud} />,\n    },\n    {\n      key: \"psychotherapy\",\n      label: \"Psychotherapy notes\",\n      access: { kind: \"withheld\", reason: \"Kept separately by the author\" },\n    },\n  ]}\n/>",
    "guidance": {
      "use": [
        "Long records where most sections are not needed on most visits — charts, treatment plans, note histories.",
        "Anywhere a section is governed differently from the rest of the screen: 42 CFR Part 2, a Cures Act exception, a break-the-glass access.",
        "Patient-facing surfaces where the reader should choose when to see something, rather than meeting it on arrival.",
        "Ordered procedures with one step that must stay visible — a safety plan's crisis contacts."
      ],
      "avoid": [
        "Alternative views of the same region. That is a tab set, and the two patterns announce themselves differently.",
        "Content that is short enough to show in full. An accordion over four lines costs an interaction and saves nothing.",
        "Hiding a fact to save a row. Density is spacing, never which clinical facts appear.",
        "As an access control. The gate is an interface affordance for a policy the application owns and enforces elsewhere."
      ]
    },
    "accessibility": [
      {
        "label": "Every trigger is a real button inside a real heading",
        "detail": "The trigger is a <button> wrapped in an h1–h6 chosen by headingLevel, so Enter and Space both activate it and every section appears in a screen reader's heading list. Ant Design renders a div with role=button that handles Enter only — which means Space scrolls the page instead of opening the section — and no heading element at all, so a fourteen-section chart offers no outline."
      },
      {
        "label": "One pattern in every configuration",
        "detail": "The accordion prop changes the state policy and nothing else. There is no role=tablist, tab, or tabpanel in any configuration, and aria-controls, the panel id, and aria-labelledby are wired identically whether one section opens at a time or several."
      },
      {
        "label": "Region landmarks, but only up to six",
        "detail": "panelRole=auto follows APG: role=region with aria-labelledby up to six simultaneously-openable sections, omitted above that, where a landmark list stops being navigation and becomes noise. A withheld panel is never a region — an empty landmark is a dead end in the rotor."
      },
      {
        "label": "Collapsed content is still findable",
        "detail": "Closed panels carry hidden=\"until-found\", so Ctrl+F and fragment navigation reveal them. A clinician searching a chart for a drug name and getting no match concludes the record does not mention it."
      },
      {
        "label": "Disabled triggers still take focus",
        "detail": "Pinned and withheld sections set aria-disabled rather than disabled, so a keyboard user lands on them and hears the label instead of tabbing past a row that appears not to exist."
      },
      {
        "label": "Arrow keys navigate, and never activate",
        "detail": "Up, Down, Home and End move focus between headers and wrap. They never toggle a section, so a keyboard user cannot open a governed one by scrolling through the list."
      }
    ],
    "limitations": [
      "Not an access control. onDisclose reports that a reader asked; refusing to render is not the same as refusing to serve, and the application still owns authorisation and audit.",
      "Severity is supplied, never derived. The component will not score an instrument or decide what is urgent — that would make it clinical decision support.",
      "React cannot express hidden=\"until-found\": React 19 serialises it as hidden=\"\", so the attribute is upgraded after commit. Between commit and effect a closed panel is hidden but not yet findable.",
      "Requires styles/zoblocks-accordion.css, installed with accordion-core.",
      "Above roughly 200 sections, render your own windowed list over useAccordion. Virtualising breaks find-in-page, so the component does not do it silently.",
      "persistKey is not implemented. Remembering which sections a reader opened is per-product storage, and storing it for a gated section would defeat the gate."
    ],
    "related": [
      "chart-accordion",
      "safety-plan",
      "care-timeline",
      "tabs",
      "timeline"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add accordion",
    "relationships": {
      "builtWith": [],
      "usedIn": [
        "chart-accordion",
        "safety-plan"
      ],
      "patterns": [],
      "alternatives": []
    }
  },
  {
    "name": "allergy-chip",
    "title": "Allergy Chip",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "The chip that refuses to conflate how bad the last reaction was with how bad the next one could be.",
    "tagline": "Past reaction severity and future risk, never conflated.",
    "description": "Substance first at full weight, criticality as the primary signal, the worst past reaction as secondary text, and verification as a hairline affix. AllergyList carries the other half: a no-known-allergies assertion and an unasked question look nothing alike, and an assertion missing its author degrades to the second.",
    "rationale": "AllergyIntolerance carries two severity-shaped fields that mean opposite things. `criticality` is a clinician's judgement of the risk of a future life-threatening reaction; `reaction.severity` describes how bad a past one was. A patient whose only documented reaction was mild urticaria can still be criticality high — that is the entire reason the field exists — and nearly every implementation renders one and drops the other, keeping the past. The second failure is subtler and more common: no known allergies and nobody asked are shown the same way, and an empty allergy list beside a prescribing button is an assertion the software has not earned. Both failures are structural rather than cosmetic, so both get shapes: the two fields render as different kinds of thing, and the two empty states are different components that look nothing alike.",
    "categories": [
      "Clinical",
      "Data Display"
    ],
    "fhir": [
      {
        "name": "AllergyIntolerance",
        "url": "https://hl7.org/fhir/R4/allergyintolerance.html",
        "note": "type, category, criticality, verificationStatus, reaction[].manifestation and severity, onset, lastOccurrence and asserter. The no-known-allergy SNOMED codes are read as a positive assertion with provenance rather than as an allergy to nothing."
      }
    ],
    "resource": "AllergyIntolerance",
    "resourceUrl": "https://hl7.org/fhir/R4/allergyintolerance.html",
    "states": [
      "High criticality, mild past reaction",
      "Low criticality, same manifestation",
      "Intolerance, not an allergy",
      "Refuted after a rechallenge",
      "Entered in error",
      "Unconfirmed — reported at intake",
      "Unable to assess",
      "No reaction recorded",
      "Substance class expansion",
      "Contraindication",
      "No known allergies — asserted",
      "Allergy status not recorded",
      "An assertion with no author degrades",
      "Compact, in a banner",
      "Interactive — opens the history"
    ],
    "props": [
      {
        "name": "record",
        "type": "AllergyRecord",
        "description": "The AllergyIntolerance, already adapted. Carries `criticality` and `reaction.severity` separately, because they mean opposite things and merging them is the defect this component exists to prevent.",
        "required": true
      },
      {
        "name": "density",
        "type": "'compact' | 'default'",
        "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
        "required": false,
        "default": "\"default\""
      },
      {
        "name": "expandClass",
        "type": "ClassExpander",
        "description": "Expands a substance into the class it implicates. Injected, never bundled.",
        "required": false
      },
      {
        "name": "onOpenDetail",
        "type": "((record: AllergyRecord) => void)",
        "description": "Opens the reaction history, asserter and source.",
        "required": false
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"children\">",
    "exports": [
      {
        "name": "AllergyChip",
        "props": [
          {
            "name": "record",
            "type": "AllergyRecord",
            "description": "The AllergyIntolerance, already adapted. Carries `criticality` and `reaction.severity` separately, because they mean opposite things and merging them is the defect this component exists to prevent.",
            "required": true
          },
          {
            "name": "density",
            "type": "'compact' | 'default'",
            "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
            "required": false,
            "default": "\"default\""
          },
          {
            "name": "expandClass",
            "type": "ClassExpander",
            "description": "Expands a substance into the class it implicates. Injected, never bundled.",
            "required": false
          },
          {
            "name": "onOpenDetail",
            "type": "((record: AllergyRecord) => void)",
            "description": "Opens the reaction history, asserter and source.",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"children\">"
      },
      {
        "name": "AllergyList",
        "props": [
          {
            "name": "askLabel",
            "type": "string",
            "description": "What to render when nobody has asked. \"No known allergies\" is a clinical assertion somebody made; an empty list is not, and the two must not look alike.",
            "required": false,
            "default": "\"Ask and record\""
          },
          {
            "name": "density",
            "type": "'compact' | 'default'",
            "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
            "required": false,
            "default": "\"default\""
          },
          {
            "name": "expandClass",
            "type": "ClassExpander",
            "description": "",
            "required": false
          },
          {
            "name": "noneKnown",
            "type": "Partial<NoKnownAllergies>",
            "description": "A no-known-allergies assertion. Requires both an asserter and a date. Supplying one without the other renders not-asked, because an unattributed assertion of absence is not an assertion — and it is the one that gets prescribed against.",
            "required": false
          },
          {
            "name": "onAsk",
            "type": "(() => void)",
            "description": "Rendered inside the not-asked state. \"Ask and record\", typically.",
            "required": false
          },
          {
            "name": "onOpenDetail",
            "type": "((record: AllergyRecord) => void)",
            "description": "",
            "required": false
          },
          {
            "name": "records",
            "type": "readonly AllergyRecord[]",
            "description": "The allergies, in the order they should be read. An empty array and a `null` mean different things — see `askLabel`.",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"children\">"
      }
    ],
    "usage": "import { AllergyChip, AllergyList, fromAllergyIntolerance } from \"@/components/zoblocks/allergy-chip\";\nimport \"@/styles/zoblocks-allergy.css\";\n\n<AllergyList\n  records={records}\n  noneKnown={{ asserter: \"R. Okafor, RN\", assertedAt: \"14 Aug 2026\" }}\n  onAsk={openIntake}\n/>",
    "guidance": {
      "use": [
        "In an allergy banner, a pre-prescribe check, a medication administration screen and intake reconciliation — the four places the criticality field decides what happens next.",
        "Through AllergyList rather than mapping AllergyChip yourself, so the two empty states are handled rather than falling through to a blank.",
        "With onAsk wired on any screen that can prescribe, so the unrecorded state is a gate rather than a note.",
        "For psychotropic histories, where intolerance rather than allergy dominates — akathisia on aripiprazole, sedation on quetiapine — and where those entries are the ones most often lost."
      ],
      "avoid": [
        "As a way to change a criticality. It is a documented clinical act with an author, not a click on a chip.",
        "With criticality omitted when the record has one. Rendering only the past reaction is the exact failure the component was built to stop.",
        "For a deduplicated view of several source systems. Three penicillin entries that disagree should look like three entries that disagree."
      ]
    },
    "accessibility": [
      {
        "label": "The name reads kind, substance, criticality, verification — in that order",
        "detail": "Criticality before verification because it decides whether to prescribe; verification last because it decides how much to trust the rest. The past reaction comes after both, since leading with it is the mistake the component exists to correct."
      },
      {
        "label": "Criticality carries a shape",
        "detail": "It routes through ClinicalStatus, so high criticality is a filled triangle as well as a red chip. A red chip is never the only cue, and this is the one component where a missed cue is a prescription."
      },
      {
        "label": "The two empty states differ in shape, not only in colour",
        "detail": "The asserted state is a solid green panel; the unrecorded state is a dashed amber one. A reader scanning a chart has to tell them apart without reading either, and the dash survives greyscale, forced colours and the ward printer."
      },
      {
        "label": "A refuted entry stays readable",
        "detail": "Struck through and dimmed rather than removed. A refuted allergy that vanishes gets re-reported at the next intake, and the rechallenge that disproved it is the most useful thing in the record — so it is dimmed to 0.75 rather than to the point of illegibility."
      },
      {
        "label": "Inert unless there is a history to open",
        "detail": "role=\"group\" with a label by default. The chip is never where a criticality is changed — that is a documented clinical act, not a click — so the only interaction it offers is reading more."
      }
    ],
    "limitations": [
      "Class expansion is an injected function. No RxNorm or SNOMED bundle ships here, so a deployment without a terminology service sees substances without their classes rather than a wrong class.",
      "FHIR R4 offers only allergy and intolerance for `type`. The other two kinds have to be set directly; the adapter will not guess, and an untyped resource becomes adverse-reaction rather than the stronger claim.",
      "The component renders one record. Deduplicating three penicillin entries from three source systems is a reconciliation problem, and solving it here would hide the fact that they disagree."
    ],
    "related": [
      "clinical-status",
      "result-value",
      "chart-header"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add allergy-chip",
    "technicalName": "AllergyChip",
    "aliases": [
      "allergy badge",
      "allergy banner",
      "adverse reaction chip",
      "intolerance display",
      "nkda"
    ],
    "tags": [
      "data-display",
      "themeable",
      "print-safe",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Pass both fields whenever the record has both. They answer different questions and the pairing is what teaches the reader that.",
        "Keep the asserter and the date on a no-known assertion. Without them the component renders not-asked, which is the honest answer.",
        "Let refuted entries stay in the list. The rechallenge that disproved an allergy is worth more than the absence of a row."
      ],
      "dont": [
        "Do not colour the card by criticality. The chip carries it with a shape; a red card behind it makes the manifestation — a different fact — harder to read.",
        "Do not label every row with its kind. Labelling the common case teaches that an intolerance is a weak allergy, which is what the four kinds exist to prevent.",
        "Do not truncate a substance mid-word to fit. Truncate at the ingredient boundary or widen the column."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "The allergy banner and the pre-prescribe check. Also the reconciliation surface at intake, which is where a no-known assertion gets its author and date — and where, without them, a prescriber later reads an empty list as a cleared one.",
      "workflows": [
        "intake",
        "medication",
        "documentation",
        "care-coordination"
      ],
      "phi": {
        "handles": true,
        "notes": "Renders substances, reactions and the clinician who asserted them. The unrecorded state is deliberately loud rather than discreet: an absence here is a safety signal, not a privacy one."
      },
      "auditable": false,
      "permissions": [
        "allergy.read"
      ],
      "terminology": [
        "SNOMED CT",
        "RxNorm",
        "FHIR"
      ]
    },
    "variants": [
      {
        "id": "default",
        "label": "Default",
        "description": "Substance, criticality, verification and the worst past reaction.",
        "args": {
          "density": "default"
        }
      },
      {
        "id": "compact",
        "label": "Compact",
        "description": "For an allergy banner across the top of a chart, where vertical space is the constraint.",
        "args": {
          "density": "compact"
        }
      }
    ],
    "controls": [
      {
        "prop": "density",
        "control": "segmented",
        "label": "Density",
        "options": [
          "compact",
          "default"
        ],
        "defaultValue": "default"
      },
      {
        "prop": "record",
        "control": "fixture",
        "label": "Record",
        "options": [
          "allergyHighRisk",
          "allergyModerate",
          "allergyUnconfirmed",
          "allergyRefuted"
        ]
      },
      {
        "prop": "onOpenDetail",
        "control": "event",
        "label": "onOpenDetail"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "1.3.1",
        "name": "Info and relationships",
        "status": "pass",
        "how": "One labelled group per record, with the four facts composed into a single name in a fixed order. The relationship between the two severity-shaped fields is in the sentence rather than in visual adjacency.",
        "evidence": "allergy-chip.test.tsx"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "Criticality routes through ClinicalStatus so it carries a shape and a word. The two empty states differ by border style as well as hue, and a test asserts the dash survives.",
        "evidence": "allergy-chip.test.tsx"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "role=\"group\" with a composed label; a real button only when onOpenDetail is supplied. The ask affordance in the unrecorded state is a native button.",
        "evidence": "allergy-chip.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Both affordances — open detail and ask — are native buttons, reached and activated by keyboard with no handler of the component's own.",
        "evidence": "allergy-chip.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size",
        "status": "pass",
        "how": "The chip and the ask button both hold a 24px minimum at both densities.",
        "evidence": "allergy-chip.test.tsx"
      },
      {
        "wcag": "1.4.10",
        "name": "Reflow",
        "status": "pass",
        "how": "The substance wraps at word boundaries rather than truncating mid-word, and the class expansion takes its own line below 480px.",
        "evidence": "allergy-chip.test.tsx"
      },
      {
        "wcag": "1.4.12",
        "name": "Text spacing",
        "status": "pass",
        "how": "A three-row grid with no fixed heights; increased line-height and letter-spacing grow the card rather than clipping it.",
        "evidence": "allergy-chip.test.tsx"
      },
      {
        "wcag": "2.2.1",
        "name": "Timing adjustable",
        "status": "not-applicable",
        "how": "No timing of any kind."
      }
    ],
    "examples": [
      {
        "id": "criticality-is-not-severity",
        "title": "Two rows, one manifestation, opposite consequences",
        "description": "Both patients reacted with mild urticaria. Only the criticality field separates them, and it is the field most implementations drop — so the two rows render as identical warnings and a prescriber treats them the same.",
        "fixture": "allergyHighRisk",
        "code": "<AllergyChip record={{\n  id: \"1\", substance: \"Penicillin G\", kind: \"allergy\",\n  criticality: \"high\", verification: \"confirmed\",\n  reactions: [{ manifestation: \"Urticaria\", severity: \"mild\", onset: \"1998\", note: \"age 6\" }],\n}} />\n\n<AllergyChip record={{\n  id: \"2\", substance: \"Amoxicillin\", kind: \"allergy\",\n  criticality: \"low\", verification: \"unconfirmed\",\n  reactions: [{ manifestation: \"Urticaria\", severity: \"mild\", onset: \"2019\" }],\n}} />"
      },
      {
        "id": "two-empty-states",
        "title": "The two absences that are not the same fact",
        "description": "A no-known assertion is a positive clinical finding with an author and a date, and it is safe to prescribe against. An unrecorded status is neither. Supply an assertion without its author and the component renders the second, because that is what an unattributed assertion is worth.",
        "fixture": "allergyList",
        "code": "// Safe to prescribe against.\n<AllergyList noneKnown={{ asserter: \"R. Okafor, RN\", assertedAt: \"14 Aug 2026\",\n                          context: \"reconciled at intake\" }} />\n\n// Degrades to \"Allergy status not recorded\": no author, no assertion.\n<AllergyList noneKnown={{ assertedAt: \"14 Aug 2026\" }} onAsk={openIntake} />"
      },
      {
        "id": "intolerance",
        "title": "An intolerance is not a weak allergy",
        "description": "Akathisia on aripiprazole and sedation on quetiapine dominate psychotropic histories and are the entries most often lost, because somebody decided they were not real allergies. The kind is rendered as its own class.",
        "fixture": "allergyModerate",
        "code": "<AllergyChip record={{\n  id: \"3\", substance: \"Lithium carbonate\", kind: \"intolerance\",\n  criticality: \"unable-to-assess\", verification: \"confirmed\",\n  reactions: [{ manifestation: \"Tremor, polyuria\", severity: \"moderate\",\n                note: \"ongoing at therapeutic level\" }],\n}} />"
      },
      {
        "id": "refuted",
        "title": "A refuted entry stays in the record",
        "description": "Struck through and dimmed rather than deleted. A refuted allergy that vanishes gets re-reported at the next intake, and the rechallenge that disproved it is the most useful thing in the chart.",
        "fixture": "allergyRefuted",
        "code": "<AllergyChip record={{\n  id: \"4\", substance: \"Sulfa drugs\", kind: \"allergy\",\n  verification: \"refuted\",\n  note: \"Rechallenged 2024 · tolerated · refuted by allergist\",\n}} />"
      }
    ],
    "fixtures": [
      "allergyHighRisk",
      "allergyModerate",
      "allergyUnconfirmed",
      "allergyRefuted",
      "allergyList"
    ],
    "seo": {
      "slug": "allergy-chip",
      "title": "Allergy Chip — React allergy display component",
      "description": "A React allergy component that separates criticality from reaction severity, and distinguishes no known allergies from an allergy history nobody took.",
      "primaryKeyword": "react allergy component",
      "secondaryKeywords": [
        "fhir allergyintolerance react",
        "allergy banner component",
        "nkda display",
        "medication allergy ui"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [
        "clinical-status"
      ],
      "usedIn": [],
      "patterns": [
        "patient-intake",
        "medication-safety"
      ],
      "alternatives": [
        {
          "ref": "clinical-status",
          "when": "the thing being rendered is a bare state with no substance or reaction behind it"
        }
      ]
    }
  },
  {
    "name": "breath-loader",
    "title": "Breath Loader",
    "tier": "free",
    "status": "beta",
    "since": "0.2.0",
    "layer": "primitive",
    "distribution": "registry",
    "summary": "Three rings expanding and fading from a soft core, paced at a resting breath rather than a spinner's tempo.",
    "tagline": "Three rings at a resting breath, not a spinner's tempo.",
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
        "type": "LoaderAnnounce",
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
        "type": "number",
        "description": "Wait this long before appearing, so a fast response never flashes a loader.",
        "required": false
      },
      {
        "name": "hint",
        "type": "string",
        "description": "A second line under the label. Never a substitute for it.",
        "required": false
      },
      {
        "name": "label",
        "type": "string",
        "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
        "required": false
      },
      {
        "name": "minDuration",
        "type": "number",
        "description": "Once visible, stay at least this long, so the loader never blinks out.",
        "required": false
      },
      {
        "name": "mode",
        "type": "LoaderMode",
        "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
        "required": false
      },
      {
        "name": "motion",
        "type": "LoaderMotion",
        "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void)",
        "description": "Fires once, when `slowAfter` elapses.",
        "required": false
      },
      {
        "name": "open",
        "type": "boolean",
        "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
        "required": false
      },
      {
        "name": "progress",
        "type": "number",
        "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
        "required": false
      },
      {
        "name": "scrim",
        "type": "boolean",
        "description": "Translucent backdrop behind `overlay` and `page`.",
        "required": false
      },
      {
        "name": "showLabel",
        "type": "boolean",
        "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
        "required": false
      },
      {
        "name": "size",
        "type": "number | LoaderSize",
        "description": "Named step or an explicit art width in pixels.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number",
        "description": "Announce a stall after this long. 0 disables.",
        "required": false
      },
      {
        "name": "slowHint",
        "type": "string",
        "description": "Replaces the default stall wording.",
        "required": false
      },
      {
        "name": "speed",
        "type": "number",
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
            "type": "LoaderAnnounce",
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
            "type": "number",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false
          },
          {
            "name": "motion",
            "type": "LoaderMotion",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void)",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize",
            "description": "Named step or an explicit art width in pixels.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false,
            "default": "1"
          }
        ],
        "extendsType": "LoaderCommonProps"
      }
    ],
    "usage": "import { BreathLoader } from \"@/components/zoblocks/breath-loader\";\n\n// Patient-facing page wait\n<BreathLoader mode=\"page\" label=\"Loading your information\" />\n\n// Slower still, for a long wait\n<BreathLoader speed={0.7} label=\"Preparing your summary\" hint=\"This can take a few seconds.\" />",
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
      "Requires styles/zoblocks-loader.css, installed with loader-core.",
      "Needs about 40px to read as three distinct rings rather than one soft pulse."
    ],
    "related": [
      "pulse-loader",
      "rhythm-loader",
      "infusion-loader",
      "helix-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add breath-loader"
  },
  {
    "name": "care-team-presence",
    "title": "Care Team Presence",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "Presence with clinical semantics: in session, on call, signed out to whom — and who else is in this chart right now.",
    "tagline": "Who is in session, on call, and signed out to whom.",
    "description": "Nine states rather than a green dot, each drawn as a ring shape before it is a colour. Resolves a rota to the person responsible at this moment and returns a gap when nobody is. Routes an escalation to the covering clinician before it offers an override, and warns about a documentation conflict before you type rather than at save.",
    "rationale": "A green dot meaning \"online\" is worse than useless on a ward, because the two states that matter most both look identical to it. A therapist who is in session is at their desk, is online, and must not be interrupted — interrupting a group session reaches eight patients rather than one. A hospitalist who is signed out is at their desk, is online, and is the wrong person to page; the right person is named in a handover the dot does not know about. The second half of the component answers the question a PDF on a shared drive answers today: who covers this patient at 02:00 on a Sunday, and until when. And the third — chart co-presence — is the only presence signal here that appears without being asked for, because the timing is the whole value: told at save, a second note in the same encounter is a merge problem with somebody else's unsigned draft; told before you type, it is a choice between three reasonable options.",
    "categories": [
      "Clinical",
      "Data Display"
    ],
    "fhir": [
      {
        "name": "CareTeam",
        "url": "https://hl7.org/fhir/R4/careteam.html",
        "note": "participant[].period becomes a coverage window; a participant with no period is on the team but is not the answer to who is responsible now, and is dropped."
      }
    ],
    "resource": "CareTeam",
    "resourceUrl": "https://hl7.org/fhir/R4/careteam.html",
    "states": [
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
      "Four in the chart, viewing only"
    ],
    "props": [
      {
        "name": "presence",
        "type": "Presence",
        "description": "The person and their current state — available, in session, signed out, off shift — with whoever is covering for them.",
        "required": true
      },
      {
        "name": "compact",
        "type": "boolean",
        "description": "Avatar only, for a co-presence stack. The name stays in the label.",
        "required": false,
        "default": "false"
      },
      {
        "name": "now",
        "type": "string",
        "description": "ISO 8601, supplied by the host. Needed for the degraded state's age.",
        "required": false
      },
      {
        "name": "onContact",
        "type": "((target: EscalationTarget) => void)",
        "description": "Contact this person. Routed through `resolveEscalation`, so a do-not-disturb clinician offers their cover instead and an override is a second, deliberate action.",
        "required": false
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"children\">",
    "exports": [
      {
        "name": "PresenceChip",
        "props": [
          {
            "name": "presence",
            "type": "Presence",
            "description": "The person and their current state — available, in session, signed out, off shift — with whoever is covering for them.",
            "required": true
          },
          {
            "name": "compact",
            "type": "boolean",
            "description": "Avatar only, for a co-presence stack. The name stays in the label.",
            "required": false,
            "default": "false"
          },
          {
            "name": "now",
            "type": "string",
            "description": "ISO 8601, supplied by the host. Needed for the degraded state's age.",
            "required": false
          },
          {
            "name": "onContact",
            "type": "((target: EscalationTarget) => void)",
            "description": "Contact this person. Routed through `resolveEscalation`, so a do-not-disturb clinician offers their cover instead and an override is a second, deliberate action.",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"children\">"
      },
      {
        "name": "CoverageCard",
        "props": [
          {
            "name": "now",
            "type": "string",
            "description": "",
            "required": true
          },
          {
            "name": "windows",
            "type": "readonly CoverageWindow[]",
            "description": "Who is covering, and when. Overlaps and gaps are both drawn: a gap in coverage is the fact a reader is looking for.",
            "required": true
          },
          {
            "name": "backup",
            "type": "Clinician",
            "description": "Who to reach when the primary does not answer. Rendered before it is needed rather than found during an escalation.",
            "required": false
          },
          {
            "name": "onPage",
            "type": "((clinician: Clinician) => void)",
            "description": "Fired when the reader pages somebody. The component never contacts anyone itself.",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"children\">"
      },
      {
        "name": "ChartCoPresence",
        "props": [
          {
            "name": "others",
            "type": "readonly ChartPresence[]",
            "description": "Who else has this chart open right now. Two people writing the same note is a merge nobody wins.",
            "required": true
          },
          {
            "name": "now",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "onOpenTheirs",
            "type": "((other: ChartPresence) => void)",
            "description": "Opens the other person's draft, read-only.",
            "required": false
          },
          {
            "name": "onRequestHandoff",
            "type": "((other: ChartPresence) => void)",
            "description": "Fired when the reader asks the current editor to hand over.",
            "required": false
          },
          {
            "name": "onSeparateAddendum",
            "type": "((other: ChartPresence) => void)",
            "description": "Fired when the reader chooses to write their own addendum instead of waiting. The honest alternative to a silent overwrite.",
            "required": false
          }
        ],
        "extendsType": "Omit< React.HTMLAttributes<HTMLDivElement>, \"children\" >"
      }
    ],
    "usage": "import {\n  CoverageCard,\n  PresenceChip,\n} from \"@/components/zoblocks/care-team-presence\";\nimport \"@/styles/zoblocks-presence.css\";\n\n<PresenceChip\n  presence={{\n    clinician: { id: \"pr-4\", display: \"A. Vance, MD\", role: \"Attending\" },\n    state: \"signed-out\",\n    coveredBy: { id: \"pr-1\", display: \"T. Boateng, MD\", role: \"Night attending\" },\n    until: \"07:00\",\n  }}\n  onContact={(target) => page(target)}\n/>\n\n<CoverageCard windows={rota} now={serverTime} onPage={page} />",
    "guidance": {
      "use": [
        "Beside a clinician's name anywhere the reader might be about to contact them — a care team panel, a message composer, a chart header.",
        "With CoverageCard on any surface where somebody might need to escalate out of hours. That is the question the shared-drive PDF answers today.",
        "With ChartCoPresence above the editor rather than inside it, so the warning arrives before the first keystroke.",
        "Compact, inside a co-presence stack, where the count matters more than any one face."
      ],
      "avoid": [
        "As a productivity signal. \"Who is online\" is a management question and this is a clinical one; the states exist to route contact, not to report attendance.",
        "Without a role on the clinician. A name with no role is not actionable, and the component will render it but the reader still cannot use it.",
        "As the only escalation path. It names who to reach; the page itself, and the audit entry for an override, belong to the host."
      ]
    },
    "accessibility": [
      {
        "label": "The ring is a shape before it is a colour",
        "detail": "Nine states will not fit in nine hues on a 28px avatar — three would be indistinguishable to a reader with a common colour deficiency and all nine at arm's length on a ward monitor. Solid, blocked, doubled, halved, dashed, dotted or absent carries the state; the hue repeats it."
      },
      {
        "label": "The whole presence is one spoken statement",
        "detail": "\"A. Vance, MD. Attending. Signed out. Covered by T. Boateng, MD, night attending.\" Name, role, state, redirect — a reader who stops after the third part has enough to decide whether to make contact, and one who hears the fourth knows where to go instead."
      },
      {
        "label": "The role is never omitted",
        "detail": "\"Dr Vance\" is not actionable and \"Attending, night coverage until 07:00\" is. The difference is whether a reader knows they have found the right person, which is the entire job of this component."
      },
      {
        "label": "The conflict notice is polite and throttled",
        "detail": "One announcement per ten seconds. A ward round where six people open the same chart would otherwise produce six interruptions in as many seconds, and a screen-reader user would lose their place each time — this component exists to prevent an interruption, not to become one."
      },
      {
        "label": "A rota gap is an alert, not an empty state",
        "detail": "role=\"alert\" with the escalation named in the accessible label. Every other state here is deliberately quiet; nobody being responsible for a patient at 02:00 is the one thing that should stop a reader."
      },
      {
        "label": "The one animation is a slow breath, and it respects the preference",
        "detail": "The crisis-line ring fades over 2.4 seconds rather than flashing. A crisis line is staffed for a whole shift, and a blinking ring in somebody's peripheral vision for eight hours is an accessibility problem. prefers-reduced-motion stops it entirely."
      }
    ],
    "limitations": [
      "It carries no transport. Presence has to arrive from somewhere — a WebSocket, a poll, a presence service — and the host subscribes once and passes it down. That is deliberate: a component that opened its own socket would open one per avatar.",
      "It cannot tell a stale channel from a stationary person on its own. The degraded state has to be set by whatever knows the channel dropped; without it, a frozen dot looks live, which is the failure the state exists to name.",
      "Coverage resolves against one flat list of windows. Overlapping rotas — a service rota and a psychiatry back-up rota on the same patient — need the caller to pick which one answers \"responsible\", because the component has no basis for preferring one.",
      "Chart co-presence detects a conflict; it does not resolve one. Whether the right move is a handoff, a read-only look or a separate addendum depends on facts the component does not have, which is why none of the three actions is a highlighted default.",
      "An override is offered and logged by the host, not by the component. The escalation target says an override is required; recording who overrode a do-not-disturb is an audit concern that belongs where the page is actually sent."
    ],
    "related": [
      "identity",
      "clinical-status",
      "chart-header"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add care-team-presence",
    "technicalName": "CareTeamPresence",
    "aliases": [
      "presence indicator",
      "on call",
      "coverage",
      "who is on call",
      "care team availability",
      "chart co-presence"
    ],
    "tags": [
      "data-display",
      "themeable",
      "print-safe",
      "headless",
      "animated"
    ],
    "uxGuidelines": {
      "do": [
        "Set coveredBy whenever the state is signed-out or off-shift. A redirect with no destination is a dead end at the moment somebody needs a person.",
        "Pass `now` from the server rather than the browser. A degraded state's age is the one number here that must not come from a clock the user can change.",
        "Mark the assigned therapist. In behavioral health that is the person a disclosure decision routes through, which is a different fact from care-team membership.",
        "Render the gap. A rota with a two-hour hole in it is a real state, and it is the one worth finding before 02:00 rather than at it."
      ],
      "dont": [
        "Do not distinguish the states by colour alone. Three of the nine are amber, and the ring geometry is what separates them.",
        "Do not put the redirect in a tooltip. A page sent to a signed-out clinician because the cover was one hover away is the defect this component was built against.",
        "Do not announce every arrival. The live region is throttled for a reason, and lowering it turns a ward round into a stream of interruptions.",
        "Do not default the co-presence conflict to one action. Highlighting one of the three is a recommendation the component cannot justify."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "Four of the nine states exist because behavioral health needs them and no generic presence system has them: in session, in group, on the crisis line, and assigned therapist. Interrupting a group reaches eight patients rather than one, and the assigned therapist is the person a disclosure decision routes through.",
      "workflows": [
        "care-coordination",
        "documentation",
        "scheduling"
      ],
      "phi": {
        "handles": false,
        "notes": "Renders clinicians rather than patients. Chart co-presence implies which chart is open, so it should not be rendered outside the chart it describes."
      },
      "auditable": false,
      "permissions": [
        "careteam.read"
      ],
      "terminology": [
        "FHIR"
      ]
    },
    "variants": [
      {
        "id": "default",
        "label": "Default",
        "description": "Avatar, name, role and state, with the redirect on its own line.",
        "args": {
          "compact": false
        }
      },
      {
        "id": "compact",
        "label": "Compact",
        "description": "Avatar only, for a co-presence stack. The name stays in the accessible label rather than disappearing.",
        "args": {
          "compact": true
        }
      }
    ],
    "controls": [
      {
        "prop": "compact",
        "control": "switch",
        "label": "Compact",
        "defaultValue": false
      },
      {
        "prop": "onContact",
        "control": "event",
        "label": "onContact"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "Every state has a ring geometry and a state word, and both reach the accessible name. A test asserts the nine states produce nine distinct ring shapes, so two states can never collapse into one hue.",
        "evidence": "care-team-presence.test.tsx"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "role=\"group\" carrying the composed statement, with the visual content aria-hidden so a screen reader gets one sentence rather than a scattering of fragments.",
        "evidence": "care-team-presence.test.tsx"
      },
      {
        "wcag": "4.1.3",
        "name": "Status messages",
        "status": "pass",
        "how": "The co-presence conflict is aria-live=\"polite\" and throttled to one announcement per ten seconds; the rota gap is role=\"alert\" because nobody being responsible is the one state here that should interrupt.",
        "evidence": "care-team-presence.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size (minimum)",
        "status": "pass",
        "how": "Every button — contact, page, and the three conflict actions — has a 28px minimum block size, above the 24px floor.",
        "evidence": "care-team-presence.test.tsx"
      },
      {
        "wcag": "2.2.2",
        "name": "Pause, stop, hide",
        "status": "pass",
        "how": "The crisis-line ring is the only animation, it is a 2.4s opacity breath rather than a flash, and prefers-reduced-motion removes it. Nothing else moves.",
        "evidence": "care-team-presence.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Every affordance is a native button. The component manages no focus and traps none.",
        "evidence": "care-team-presence.test.tsx"
      },
      {
        "wcag": "1.4.11",
        "name": "Non-text contrast",
        "status": "pass",
        "how": "The rings and the button borders draw from gated status tokens; the ring is also 2px or wider so the geometry survives at the contrast floor.",
        "evidence": "contrast.gate"
      },
      {
        "wcag": "1.3.1",
        "name": "Info and relationships",
        "status": "pass",
        "how": "The redirect, the cover and the degraded age are text in the accessible name rather than position or colour, so a reader who cannot see the layout still gets the relationship.",
        "evidence": "care-team-presence.test.tsx"
      }
    ],
    "examples": [
      {
        "id": "not-a-green-dot",
        "title": "In session is not away, and signed out is not offline",
        "description": "Both of these people are at a computer and both would be a green dot. One must not be interrupted; the other is simply the wrong person, and the right one is named on the next line.",
        "fixture": "careTeamNightCoverage",
        "code": "<PresenceChip presence={{ clinician: marsh, state: \"in-session\", until: \"15:50\" }} />\n\n<PresenceChip\n  presence={{\n    clinician: vance,\n    state: \"signed-out\",\n    coveredBy: boateng,\n    until: \"07:00\",\n  }}\n/>"
      },
      {
        "id": "coverage-gap",
        "title": "A hole in the rota is drawn as a hole",
        "description": "Nothing covers 07:00–09:00. The resolver returns null rather than the nearest window, because filling a gap with a plausible name is how a page goes to somebody who is asleep.",
        "fixture": "careTeamCoverageGap",
        "code": "const windows = coverageFromCareTeam(careTeamCoverageGap.participant ?? []);\n\n// 08:00 falls between the two windows.\n<CoverageCard windows={windows} now=\"2026-08-24T08:00:00+05:30\" />\n// → \"Nobody is covering right now. Escalate to the on-call supervisor.\""
      },
      {
        "id": "escalation",
        "title": "Do not disturb is a redirect, not a locked door",
        "description": "A clinician in a group session with cover offers the cover. The same clinician with nobody covering offers an override — a second, deliberate action the host logs. Interrupting a group reaches eight patients rather than one, and the default has to reflect that.",
        "fixture": "practitionerSigner",
        "code": "resolveEscalation({ clinician: marsh, state: \"in-group\", coveredBy: okafor });\n// → { kind: \"covering\", clinician: okafor, instead: marsh, reason: \"L. Marsh, LCSW is in group\" }\n\nresolveEscalation({ clinician: marsh, state: \"in-group\" });\n// → { kind: \"override-required\", … }"
      },
      {
        "id": "co-presence",
        "title": "Told before you type, not at save",
        "description": "A second note in the same encounter is a merge problem once both exist. Announced before the first keystroke, it is a choice between three reasonable options — and none of them is highlighted, because which is right depends on facts the component does not have.",
        "fixture": "careTeamNightCoverage",
        "code": "<ChartCoPresence\n  others={[\n    { clinician: marsh, activity: \"documenting\", since: \"2026-08-24T09:12:00+05:30\",\n      target: \"Progress note\", unsigned: true },\n  ]}\n  now={serverTime}\n  onOpenTheirs={openReadOnly}\n  onRequestHandoff={requestHandoff}\n  onSeparateAddendum={startAddendum}\n/>"
      }
    ],
    "fixtures": [
      "careTeamNightCoverage",
      "careTeamCoverageGap",
      "practitionerSigner"
    ],
    "seo": {
      "slug": "care-team-presence",
      "title": "Care Team Presence — React on-call and coverage UI",
      "description": "React presence for clinical teams: in session, on call, signed out to whom — plus rota coverage with a real gap state and chart co-presence conflicts.",
      "primaryKeyword": "react care team presence",
      "secondaryKeywords": [
        "on call coverage component",
        "clinician availability ui",
        "chart co-presence conflict",
        "healthcare presence indicator"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "care-coordination",
        "chart-review"
      ],
      "alternatives": [
        {
          "ref": "identity",
          "when": "the identity that needs to be unambiguous is the patient's"
        }
      ]
    }
  },
  {
    "name": "care-timeline",
    "title": "Care Timeline",
    "tier": "free",
    "status": "experimental",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A patient's chronology that cannot be rendered without saying what it is a view of — the window, the sources, the filters and the order.",
    "tagline": "A chronology that states its window, sources, filters and order.",
    "description": "A timeline over clinical, administrative, communication and patient-reported events, with coverage as a required prop. Separates planned from happened, keeps an entry recorded in error visible and marked, and refuses to collapse anything a reader would act on.",
    "rationale": "A table is read as rows and a chart as a shape, but a timeline is read as an account — and an account is understood to be continuous, so a gap in it becomes a fact. Meanwhile the timeline on screen is nearly always a slice: paginated to five, filtered to one register, assembled from sources that fail independently. Every one of those renders as the same tidy, confident, continuous list. A clinician reads a timeline with no imaging on it and orders a CT; the study was done eleven weeks ago at another hospital and the exchange query timed out four seconds earlier. Nothing was wrong on screen. So coverage is required in the type, with no default, because every plausible default is a claim the caller did not make — and the sentence it produces is rendered in a fixed place and printed. Two consequences follow: planned is not happened, so a future event sits above a now marker and a planned event whose time has passed with nothing against it is lapsed rather than silent; and clinical events are not administrative ones, so registers are typed rather than mixed at one weight.",
    "categories": [
      "Clinical",
      "Data Display"
    ],
    "fhir": [
      {
        "name": "Encounter",
        "url": "https://hl7.org/fhir/R4/encounter.html"
      },
      {
        "name": "Appointment",
        "url": "https://hl7.org/fhir/R4/appointment.html"
      },
      {
        "name": "Communication",
        "url": "https://hl7.org/fhir/R4/communication.html"
      },
      {
        "name": "Observation",
        "url": "https://hl7.org/fhir/R4/observation.html"
      },
      {
        "name": "DiagnosticReport",
        "url": "https://hl7.org/fhir/R4/diagnosticreport.html"
      },
      {
        "name": "Procedure",
        "url": "https://hl7.org/fhir/R4/procedure.html"
      },
      {
        "name": "MedicationRequest",
        "url": "https://hl7.org/fhir/R4/medicationrequest.html"
      },
      {
        "name": "Immunization",
        "url": "https://hl7.org/fhir/R4/immunization.html"
      },
      {
        "name": "DocumentReference",
        "url": "https://hl7.org/fhir/R4/documentreference.html"
      },
      {
        "name": "QuestionnaireResponse",
        "url": "https://hl7.org/fhir/R4/questionnaireresponse.html"
      },
      {
        "name": "Consent",
        "url": "https://hl7.org/fhir/R4/consent.html"
      },
      {
        "name": "Provenance",
        "url": "https://hl7.org/fhir/R4/provenance.html"
      }
    ],
    "resource": "Encounter",
    "resourceUrl": "https://hl7.org/fhir/R4/encounter.html",
    "states": [
      "Newest first, grouped by month",
      "Planned, above the now marker",
      "Lapsed — planned, and nothing recorded against it",
      "Cancelled",
      "Attempted and did not connect",
      "Amended, with what changed",
      "Entered in error, retained and struck",
      "Restricted — it exists and you may not read it",
      "Consent-gated",
      "A thread with its own steps",
      "A cluster, and a critical event promoted out of one",
      "A stated gap in coverage",
      "A source that could not be reached",
      "Filtered, with the hidden count stated",
      "New since last reviewed",
      "An imprecise date, kept imprecise",
      "No record · none in this window · none you may see",
      "Patient-facing, with a result not yet reviewed"
    ],
    "props": [
      {
        "name": "coverage",
        "type": "TimelineCoverage",
        "description": "What this timeline is a view of. Required, with no default. The one prop that makes the component worth using. Four honest lines is the floor: `{ sources: [{ id, label, status: \"ok\" }], order }`.",
        "required": true
      },
      {
        "name": "events",
        "type": "readonly TypedTimelineEvent[]",
        "description": "The events. `TypedTimelineEvent` rather than `TimelineEvent`: `kind: \"other\"` requires a `typeLabel`, so an unlabelled unknown is a build error at the call site instead of a blank chip in a chart.",
        "required": true
      },
      {
        "name": "now",
        "type": "string",
        "description": "Now, supplied by the caller. Reading the clock here would make the `now` marker, the lapsed state and every relative time undoable by a visual-regression baseline, and this repository lints against it for that reason.",
        "required": true
      },
      {
        "name": "audience",
        "type": "CareTimelineAudience",
        "description": "Selects the string catalog. Different words, not a softer tone.",
        "required": false,
        "default": "\"clinician\""
      },
      {
        "name": "cluster",
        "type": "false | ClusterOptions",
        "description": "When to collapse a run of similar events into one row, or `false` never to. Twelve vitals recorded in one hour are one event to a reader and twelve to a renderer.",
        "required": false,
        "default": "false"
      },
      {
        "name": "defaultRegisters",
        "type": "readonly TimelineRegister[]",
        "description": "Which registers are shown on first render — labs, medications, notes, encounters. The reader can change them; this is only where they start.",
        "required": false
      },
      {
        "name": "filters",
        "type": "boolean",
        "description": "Show the register filter. Off for `layout=\"card\"`, which has no room.",
        "required": false,
        "default": "layout !== \"card\""
      },
      {
        "name": "group",
        "type": "GroupBy",
        "description": "What events are grouped by: day, encounter, or source. Ungrouped, a busy chart reads as a list of timestamps.",
        "required": false,
        "default": "\"auto\""
      },
      {
        "name": "headingLevel",
        "type": "CareTimelineHeadingLevel",
        "description": "Heading level for the group headers. Omitted by default. A timeline nested in a tab panel inside a chart page can sit four levels deep, and a component that hardcodes its level produces an outline worse than no headings at all — so with no level given the groups are labelled regions rather than headings.",
        "required": false
      },
      {
        "name": "icons",
        "type": "Partial<Record<string, React.ReactNode>>",
        "description": "Per-kind node marks. Decoration: the kind is always rendered as text too.",
        "required": false
      },
      {
        "name": "jump",
        "type": "boolean",
        "description": "Show the jump control. Moves the reader to a period and announces where it landed; it never changes what is rendered, because a control that filtered and navigated at once would make the coverage sentence ambiguous.",
        "required": false,
        "default": "false"
      },
      {
        "name": "kinds",
        "type": "readonly TimelineKind[]",
        "description": "Kinds to show, controlled. No built-in UI: twenty-one toggles is not a filter bar, it is a form. The cost still reaches the coverage sentence.",
        "required": false
      },
      {
        "name": "lateEntryAfter",
        "type": "string",
        "description": "ISO 8601. A recording gap at least this long is stated on the event.",
        "required": false
      },
      {
        "name": "layout",
        "type": "CareTimelineLayout",
        "description": "How the chronology is laid out — a single rail, or split by source. Changes the reading order, so it is a content decision rather than a visual one.",
        "required": false,
        "default": "\"default\""
      },
      {
        "name": "limit",
        "type": "number",
        "description": "Render at most this many events. The remainder is reported, never dropped.",
        "required": false
      },
      {
        "name": "locale",
        "type": "Partial<TimelineLocale>",
        "description": "Replace individual strings. Merged over the audience's catalog.",
        "required": false
      },
      {
        "name": "localeTag",
        "type": "string",
        "description": "BCP 47. Passed to `Intl` for dates.",
        "required": false
      },
      {
        "name": "onLoadOlder",
        "type": "(() => void)",
        "description": "Fired when the reader reaches the start of the loaded window. The component states how many events lie beyond the page rather than pretending the window is the record.",
        "required": false
      },
      {
        "name": "onRead",
        "type": "((coverage: TimelineCoverage) => void)",
        "description": "Fires once per rendered coverage claim. For the host's audit record. The component does not write one itself — a component that writes audit records is infrastructure.",
        "required": false
      },
      {
        "name": "onRegistersChange",
        "type": "((registers: TimelineRegister[]) => void)",
        "description": "Fired when the reader shows or hides a register. Worth persisting: a clinician's register selection is a working preference, not a one-off.",
        "required": false
      },
      {
        "name": "onSelect",
        "type": "((event: TimelineEvent) => void)",
        "description": "Fired with the chosen event. Without it the timeline is a read-only account, which is a legitimate way to use it.",
        "required": false
      },
      {
        "name": "ref",
        "type": "React.Ref<HTMLElement>",
        "description": "The scrolling region. Useful for restoring a reader's position when they return to a chart.",
        "required": false
      },
      {
        "name": "registers",
        "type": "readonly TimelineRegister[]",
        "description": "Registers to show, controlled. Hidden events are counted in the sentence.",
        "required": false
      },
      {
        "name": "seenThrough",
        "type": "string",
        "description": "What the reader had already seen. Never computed here.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "CareTimeline",
        "props": [
          {
            "name": "coverage",
            "type": "TimelineCoverage",
            "description": "What this timeline is a view of. Required, with no default. The one prop that makes the component worth using. Four honest lines is the floor: `{ sources: [{ id, label, status: \"ok\" }], order }`.",
            "required": true
          },
          {
            "name": "events",
            "type": "readonly TypedTimelineEvent[]",
            "description": "The events. `TypedTimelineEvent` rather than `TimelineEvent`: `kind: \"other\"` requires a `typeLabel`, so an unlabelled unknown is a build error at the call site instead of a blank chip in a chart.",
            "required": true
          },
          {
            "name": "now",
            "type": "string",
            "description": "Now, supplied by the caller. Reading the clock here would make the `now` marker, the lapsed state and every relative time undoable by a visual-regression baseline, and this repository lints against it for that reason.",
            "required": true
          },
          {
            "name": "audience",
            "type": "CareTimelineAudience",
            "description": "Selects the string catalog. Different words, not a softer tone.",
            "required": false,
            "default": "\"clinician\""
          },
          {
            "name": "cluster",
            "type": "false | ClusterOptions",
            "description": "When to collapse a run of similar events into one row, or `false` never to. Twelve vitals recorded in one hour are one event to a reader and twelve to a renderer.",
            "required": false,
            "default": "false"
          },
          {
            "name": "defaultRegisters",
            "type": "readonly TimelineRegister[]",
            "description": "Which registers are shown on first render — labs, medications, notes, encounters. The reader can change them; this is only where they start.",
            "required": false
          },
          {
            "name": "filters",
            "type": "boolean",
            "description": "Show the register filter. Off for `layout=\"card\"`, which has no room.",
            "required": false,
            "default": "layout !== \"card\""
          },
          {
            "name": "group",
            "type": "GroupBy",
            "description": "What events are grouped by: day, encounter, or source. Ungrouped, a busy chart reads as a list of timestamps.",
            "required": false,
            "default": "\"auto\""
          },
          {
            "name": "headingLevel",
            "type": "CareTimelineHeadingLevel",
            "description": "Heading level for the group headers. Omitted by default. A timeline nested in a tab panel inside a chart page can sit four levels deep, and a component that hardcodes its level produces an outline worse than no headings at all — so with no level given the groups are labelled regions rather than headings.",
            "required": false
          },
          {
            "name": "icons",
            "type": "Partial<Record<string, React.ReactNode>>",
            "description": "Per-kind node marks. Decoration: the kind is always rendered as text too.",
            "required": false
          },
          {
            "name": "jump",
            "type": "boolean",
            "description": "Show the jump control. Moves the reader to a period and announces where it landed; it never changes what is rendered, because a control that filtered and navigated at once would make the coverage sentence ambiguous.",
            "required": false,
            "default": "false"
          },
          {
            "name": "kinds",
            "type": "readonly TimelineKind[]",
            "description": "Kinds to show, controlled. No built-in UI: twenty-one toggles is not a filter bar, it is a form. The cost still reaches the coverage sentence.",
            "required": false
          },
          {
            "name": "lateEntryAfter",
            "type": "string",
            "description": "ISO 8601. A recording gap at least this long is stated on the event.",
            "required": false
          },
          {
            "name": "layout",
            "type": "CareTimelineLayout",
            "description": "How the chronology is laid out — a single rail, or split by source. Changes the reading order, so it is a content decision rather than a visual one.",
            "required": false,
            "default": "\"default\""
          },
          {
            "name": "limit",
            "type": "number",
            "description": "Render at most this many events. The remainder is reported, never dropped.",
            "required": false
          },
          {
            "name": "locale",
            "type": "Partial<TimelineLocale>",
            "description": "Replace individual strings. Merged over the audience's catalog.",
            "required": false
          },
          {
            "name": "localeTag",
            "type": "string",
            "description": "BCP 47. Passed to `Intl` for dates.",
            "required": false
          },
          {
            "name": "onLoadOlder",
            "type": "(() => void)",
            "description": "Fired when the reader reaches the start of the loaded window. The component states how many events lie beyond the page rather than pretending the window is the record.",
            "required": false
          },
          {
            "name": "onRead",
            "type": "((coverage: TimelineCoverage) => void)",
            "description": "Fires once per rendered coverage claim. For the host's audit record. The component does not write one itself — a component that writes audit records is infrastructure.",
            "required": false
          },
          {
            "name": "onRegistersChange",
            "type": "((registers: TimelineRegister[]) => void)",
            "description": "Fired when the reader shows or hides a register. Worth persisting: a clinician's register selection is a working preference, not a one-off.",
            "required": false
          },
          {
            "name": "onSelect",
            "type": "((event: TimelineEvent) => void)",
            "description": "Fired with the chosen event. Without it the timeline is a read-only account, which is a legitimate way to use it.",
            "required": false
          },
          {
            "name": "ref",
            "type": "React.Ref<HTMLElement>",
            "description": "The scrolling region. Useful for restoring a reader's position when they return to a chart.",
            "required": false
          },
          {
            "name": "registers",
            "type": "readonly TimelineRegister[]",
            "description": "Registers to show, controlled. Hidden events are counted in the sentence.",
            "required": false
          },
          {
            "name": "seenThrough",
            "type": "string",
            "description": "What the reader had already seen. Never computed here.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { CareTimeline } from \"@/components/zoblocks/care-timeline\";\n\n<CareTimeline\n  aria-label=\"Care timeline for Ada Lovelace\"\n  events={events}\n  now={serverTime}\n  coverage={{\n    window: { from: \"2025-07-01\" },\n    order: \"newest-first\",\n    total: 43,\n    hidden: [{ reason: \"access\", count: 2 }],\n    sources: [\n      { id: \"ehr\", label: \"Northside EHR\", status: \"ok\" },\n      {\n        id: \"hie\",\n        label: \"Northside Regional Exchange\",\n        status: \"unavailable\",\n        detail: \"Timed out after 8s.\",\n      },\n    ],\n  }}\n  group=\"auto\"\n  cluster={{ kinds: [\"observation\"], within: \"P3D\", min: 3 }}\n  seenThrough=\"2026-08-12T14:02:00+05:30\"\n  lateEntryAfter=\"P2D\"\n  onLoadOlder={() => fetchOlder()}\n/>",
    "guidance": {
      "use": [
        "The chart's own timeline view, where a clinician is asking what has been happening to this person.",
        "Any surface where not finding an event is itself an answer — 'has she had this before' is the read this component exists for.",
        "A dashboard card, with layout=\"card\" and limit, where the compressed coverage sentence still fits.",
        "A patient portal, with audience=\"patient\", where a result may arrive before anyone has called."
      ],
      "avoid": [
        "As the only view of a record. It is a chronology, not an index — a reader who needs the current medication list should not have to scroll a year of events to build one.",
        "For one resource's own version history. That is a version list and it wants a different component.",
        "Anywhere the coverage genuinely cannot be described. If you do not know what you searched, the honest render is an error state, not a timeline."
      ]
    },
    "accessibility": [
      {
        "label": "Each group is its own named list",
        "detail": "One <ol role=\"list\"> per group, each with an accessible name built from the timeline's own label and the group heading, so a rotor can move between periods. The since-you-last-looked divider splits a group into two named lists rather than floating a rule inside one."
      },
      {
        "label": "The relative time is never the only time",
        "detail": "Every event renders an absolute time inside <time datetime> at the record's precision. The relative form beside it is aria-hidden: spoken aloud it doubles the length of every item and adds nothing the date has not said."
      },
      {
        "label": "Every state carries words, not only a shape",
        "detail": "Planned is a dashed node and a Planned chip; a coverage gap is a dashed rail and a sentence; entered-in-error is a strike, a chip and a paragraph. Forced-colors mode, a monochrome print and a red-green deficiency each keep the meaning."
      },
      {
        "label": "A failed source interrupts",
        "detail": "An unavailable source renders a role=\"alert\" banner above the list rather than a grey footnote, because the reader is about to convert an absence into a clinical fact."
      }
    ],
    "limitations": [
      "coverage reports what this query reached, not what exists. A source that answers with an incomplete record is reported as reached, and that limit is the reason the component is not a completeness guarantee.",
      "Coverage gaps are declared by the caller, never inferred. A component that turned eleven quiet weeks into 'records may be missing' would be inventing a claim; the application is what knows a source timed out.",
      "No swimlane layout. One lane per source is the right answer for a medico-legal chronology and it needs horizontal scroll, its own keyboard model and a legend.",
      "Duration events render at their start. A period is not a point, and bands are not in this version.",
      "role=\"feed\" is not used. It is the APG's own pattern for an infinitely scrolling list and its example carries a note that it has not reached task-force consensus; load-older is a real button instead.",
      "Dates are formatted by Intl at the record's precision, and a stamp with an offset renders in the record's zone rather than the reader's. Pass localeTag to control the language; there is no per-field format override yet.",
      "The commonest way to defeat the coverage claim is upstream: catching a source's failure in the data layer and returning a shorter array. See content/guides/populating-coverage.md — the component cannot detect what never reached it."
    ],
    "related": [
      "timeline",
      "chart-accordion",
      "clinical-note",
      "accordion",
      "result-value",
      "date-picker",
      "chart-context-menu"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add care-timeline",
    "relationships": {
      "builtWith": [
        "timeline"
      ],
      "usedIn": [],
      "patterns": [],
      "alternatives": []
    }
  },
  {
    "name": "chart-accordion",
    "title": "Chart Accordion",
    "tier": "free",
    "status": "beta",
    "since": "0.3.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A record's sections with their headers composed to the house rules, so a severity can never reach the screen without the words that explain it.",
    "tagline": "Chart sections whose severity always arrives with its words.",
    "description": "Accordion with a clinical summary vocabulary: a status paired with its severity, a count, and a timestamp at the precision the record holds. Adds an expand-all control that never opens a section the reader may not have.",
    "rationale": "Accordion will happily let a product build a header that says nothing, and at fourteen sections that produces a chart nobody reads. This component closes that gap by composing the summary itself from a small, closed vocabulary. The type does the enforcing: passing severity without status is a build error, because a coloured rail with no words beside it is a signal that forced-colors mode discards, monochrome printing discards, and roughly one in twelve men cannot resolve. The expand-all control is here rather than on the primitive because expanding a whole record is a chart-shaped action — it is what makes the record searchable and printable in one press — and it has to know not to touch a withheld section.",
    "categories": [
      "Disclosure",
      "Clinical"
    ],
    "fhir": [],
    "states": [
      "Closed, with summaries",
      "Expanded",
      "Severity across the scale",
      "Consent gate",
      "Withheld section",
      "Section that failed to load",
      "No sections"
    ],
    "props": [
      {
        "name": "sections",
        "type": "readonly ChartSection[]",
        "description": "The record's sections, in the order the house reads them. Each carries its own summary, severity and access rules.",
        "required": true
      },
      {
        "name": "bordered",
        "type": "boolean",
        "description": "Draw the container border.",
        "required": false
      },
      {
        "name": "classNames",
        "type": "Partial<Record<AccordionSlot, string>>",
        "description": "Per-slot class names, matching Ant Design v6's semantic DOM.",
        "required": false
      },
      {
        "name": "collapsible",
        "type": "'header' | 'icon' | 'disabled'",
        "description": "Which part of the header activates the section.",
        "required": false
      },
      {
        "name": "defaultOpenKeys",
        "type": "readonly React.Key[]",
        "description": "Open on first render.",
        "required": false
      },
      {
        "name": "density",
        "type": "AccordionDensity",
        "description": "Overrides any inherited `data-zb-density`.",
        "required": false,
        "default": "\"clinical\""
      },
      {
        "name": "destroyOnHidden",
        "type": "boolean",
        "description": "Unmount a section's content when it closes. Ant Design v6 naming.",
        "required": false
      },
      {
        "name": "expandIcon",
        "type": "((props: { item: AccordionItem; isOpen: boolean; }) => React.ReactNode)",
        "description": "Replace the chevron. Receives the item and whether it is open.",
        "required": false
      },
      {
        "name": "expandIconPlacement",
        "type": "'start' | 'end'",
        "description": "Ant Design v6 naming — `expandIconPosition` was renamed in v6.",
        "required": false
      },
      {
        "name": "findable",
        "type": "boolean",
        "description": "Make collapsed content reachable by find-in-page and fragment navigation. On by default. Turning it off is a decision to make Ctrl+F miss content the record contains.",
        "required": false
      },
      {
        "name": "ghost",
        "type": "boolean",
        "description": "Transparent, borderless, no header fill.",
        "required": false
      },
      {
        "name": "headingLevel",
        "type": "AccordionHeadingLevel",
        "description": "Heading level for every trigger. Required at a nesting boundary and not knowable by the component. For a screen-reader user the heading list is the chart's table of contents, and a nested accordion that hardcodes its level flattens it silently.",
        "required": false,
        "default": "3"
      },
      {
        "name": "locale",
        "type": "Partial<AccordionLocale>",
        "description": "Replaces the built-in wording. Patient and clinician catalogs are separate.",
        "required": false
      },
      {
        "name": "now",
        "type": "(() => string)",
        "description": "Injectable clock for the disclosure timestamp. Defaults to now, ISO 8601.",
        "required": false
      },
      {
        "name": "onChange",
        "type": "((keys: React.Key[]) => void)",
        "description": "Fired with the open sections whenever they change.",
        "required": false
      },
      {
        "name": "onDisclose",
        "type": "((event: DisclosureEvent) => boolean | Promise<boolean>)",
        "description": "Called when a reader asks to see gated content. Resolve false to refuse.",
        "required": false
      },
      {
        "name": "panelRole",
        "type": "AccordionPanelRole",
        "description": "`region` landmarks on panels. `auto` follows APG: the landmark up to six simultaneously-openable sections, omitted above that, where a landmark list stops being navigation.",
        "required": false
      },
      {
        "name": "printExpanded",
        "type": "boolean",
        "description": "Expand every permitted section for printing. Never a withheld one.",
        "required": false
      },
      {
        "name": "size",
        "type": "AccordionSize",
        "description": "Ant Design v6 naming — `middle` was renamed in v6.",
        "required": false
      },
      {
        "name": "styles",
        "type": "Partial<Record<AccordionSlot, React.CSSProperties>>",
        "description": "Per-slot inline styles, matching Ant Design v6's semantic DOM.",
        "required": false
      },
      {
        "name": "toolbar",
        "type": "boolean",
        "description": "Show \"Expand all\" and \"Collapse all\". On by default.",
        "required": false,
        "default": "true"
      },
      {
        "name": "toolbarLabel",
        "type": "React.ReactNode",
        "description": "Leading content in the toolbar — usually who the record belongs to.",
        "required": false
      },
      {
        "name": "variant",
        "type": "AccordionVariant",
        "description": "Container shape. `separate` gives each section its own card.",
        "required": false
      }
    ],
    "extendsType": "Omit< AccordionProps, \"items\" | \"activeKey\" | \"defaultActiveKey\" | \"accordion\" | \"onChange\" >",
    "exports": [
      {
        "name": "ChartAccordion",
        "props": [
          {
            "name": "sections",
            "type": "readonly ChartSection[]",
            "description": "The record's sections, in the order the house reads them. Each carries its own summary, severity and access rules.",
            "required": true
          },
          {
            "name": "bordered",
            "type": "boolean",
            "description": "Draw the container border.",
            "required": false
          },
          {
            "name": "classNames",
            "type": "Partial<Record<AccordionSlot, string>>",
            "description": "Per-slot class names, matching Ant Design v6's semantic DOM.",
            "required": false
          },
          {
            "name": "collapsible",
            "type": "'header' | 'icon' | 'disabled'",
            "description": "Which part of the header activates the section.",
            "required": false
          },
          {
            "name": "defaultOpenKeys",
            "type": "readonly React.Key[]",
            "description": "Open on first render.",
            "required": false
          },
          {
            "name": "density",
            "type": "AccordionDensity",
            "description": "Overrides any inherited `data-zb-density`.",
            "required": false,
            "default": "\"clinical\""
          },
          {
            "name": "destroyOnHidden",
            "type": "boolean",
            "description": "Unmount a section's content when it closes. Ant Design v6 naming.",
            "required": false
          },
          {
            "name": "expandIcon",
            "type": "((props: { item: AccordionItem; isOpen: boolean; }) => React.ReactNode)",
            "description": "Replace the chevron. Receives the item and whether it is open.",
            "required": false
          },
          {
            "name": "expandIconPlacement",
            "type": "'start' | 'end'",
            "description": "Ant Design v6 naming — `expandIconPosition` was renamed in v6.",
            "required": false
          },
          {
            "name": "findable",
            "type": "boolean",
            "description": "Make collapsed content reachable by find-in-page and fragment navigation. On by default. Turning it off is a decision to make Ctrl+F miss content the record contains.",
            "required": false
          },
          {
            "name": "ghost",
            "type": "boolean",
            "description": "Transparent, borderless, no header fill.",
            "required": false
          },
          {
            "name": "headingLevel",
            "type": "AccordionHeadingLevel",
            "description": "Heading level for every trigger. Required at a nesting boundary and not knowable by the component. For a screen-reader user the heading list is the chart's table of contents, and a nested accordion that hardcodes its level flattens it silently.",
            "required": false,
            "default": "3"
          },
          {
            "name": "locale",
            "type": "Partial<AccordionLocale>",
            "description": "Replaces the built-in wording. Patient and clinician catalogs are separate.",
            "required": false
          },
          {
            "name": "now",
            "type": "(() => string)",
            "description": "Injectable clock for the disclosure timestamp. Defaults to now, ISO 8601.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((keys: React.Key[]) => void)",
            "description": "Fired with the open sections whenever they change.",
            "required": false
          },
          {
            "name": "onDisclose",
            "type": "((event: DisclosureEvent) => boolean | Promise<boolean>)",
            "description": "Called when a reader asks to see gated content. Resolve false to refuse.",
            "required": false
          },
          {
            "name": "panelRole",
            "type": "AccordionPanelRole",
            "description": "`region` landmarks on panels. `auto` follows APG: the landmark up to six simultaneously-openable sections, omitted above that, where a landmark list stops being navigation.",
            "required": false
          },
          {
            "name": "printExpanded",
            "type": "boolean",
            "description": "Expand every permitted section for printing. Never a withheld one.",
            "required": false
          },
          {
            "name": "size",
            "type": "AccordionSize",
            "description": "Ant Design v6 naming — `middle` was renamed in v6.",
            "required": false
          },
          {
            "name": "styles",
            "type": "Partial<Record<AccordionSlot, React.CSSProperties>>",
            "description": "Per-slot inline styles, matching Ant Design v6's semantic DOM.",
            "required": false
          },
          {
            "name": "toolbar",
            "type": "boolean",
            "description": "Show \"Expand all\" and \"Collapse all\". On by default.",
            "required": false,
            "default": "true"
          },
          {
            "name": "toolbarLabel",
            "type": "React.ReactNode",
            "description": "Leading content in the toolbar — usually who the record belongs to.",
            "required": false
          },
          {
            "name": "variant",
            "type": "AccordionVariant",
            "description": "Container shape. `separate` gives each section its own card.",
            "required": false
          }
        ],
        "extendsType": "Omit< AccordionProps, \"items\" | \"activeKey\" | \"defaultActiveKey\" | \"accordion\" | \"onChange\" >"
      }
    ],
    "usage": "import { ChartAccordion } from \"@/components/zoblocks/chart-accordion\";\n\n<ChartAccordion\n  toolbarLabel=\"Ada Lovelace · 38 · MRN 4471902\"\n  headingLevel={2}\n  onDisclose={async (event) => audit.record(event)}\n  sections={[\n    {\n      key: \"risk\",\n      label: \"Risk & suicidality\",\n      severity: \"critical\",\n      status: \"C-SSRS positive\",\n      updatedAt: \"2026-08-13T09:12:00+05:30\",\n      children: <RiskPanel {...risk} />,\n    },\n    {\n      key: \"meds\",\n      label: \"Medications\",\n      severity: \"high\",\n      status: \"Clozapine ANC due 18 Aug\",\n      count: \"4 active\",\n      children: <MedicationList {...meds} />,\n    },\n    {\n      key: \"psychotherapy\",\n      label: \"Psychotherapy notes\",\n      access: { kind: \"withheld\", reason: \"Kept separately by the author\" },\n    },\n  ]}\n/>",
    "guidance": {
      "use": [
        "The main record view, where sections are read closed more often than open.",
        "Any list of sections where at least one can carry a severity.",
        "Surfaces that need to be printable in one action."
      ],
      "avoid": [
        "Patient-facing surfaces — this is clinician density and clinician vocabulary. Compose Accordion directly.",
        "Two or three sections. The toolbar and the summary vocabulary are overhead at that size.",
        "As a layout for content with no state to summarise. Use Accordion."
      ]
    },
    "accessibility": [
      {
        "label": "Severity is never alone",
        "detail": "The type requires a status alongside a severity, so the rail always has words beside it. The chip renders text plus colour plus a token-driven border, and the text is what survives forced-colors mode and a monochrome print."
      },
      {
        "label": "Expand all is a real control, not a link",
        "detail": "Both toolbar controls are buttons with a 24px minimum target, focusable in order, and they change the accordion's controlled state rather than reaching into the DOM."
      },
      {
        "label": "Timestamps carry their precision",
        "detail": "updatedAt renders inside a <time datetime> using the exact string the record holds, so a FHIR 2026-08 stays August rather than being widened to the first of the month."
      }
    ],
    "limitations": [
      "The chip is local to this component until StatusBadge ships. It already uses the --zb-badge-* tokens, so adopting StatusBadge is a refactor rather than a re-design.",
      "The timestamp is rendered verbatim, not localised. Formatting and time-zone rendering belong to @zoblocks/intl, and inventing a second formatter here would guarantee they disagree.",
      "Expand all opens gated sections to their gate, not to their content — one press cannot consent on the reader's behalf.",
      "Sections are rendered in the order given. It does not sort by severity, because a record's order is usually clinical rather than alphabetical."
    ],
    "related": [
      "accordion",
      "safety-plan",
      "care-timeline",
      "tabs",
      "timeline",
      "clinical-status"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add chart-accordion",
    "relationships": {
      "builtWith": [
        "accordion"
      ],
      "usedIn": [],
      "patterns": [],
      "alternatives": []
    }
  },
  {
    "name": "chart-command-palette",
    "title": "Chart Command Palette",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A command palette that understands clinical verbs, scopes every search to a treatment relationship, and audits the searches it refuses.",
    "tagline": "Clinical verbs, scoped to a treatment relationship.",
    "description": "Actions rank above records, because a verb is usually what was meant. Patients outside your relationships are counted rather than named. Every patient search emits an audit event, including the ones that matched nobody, and a clinically significant action never runs on the first Enter.",
    "rationale": "Clinical navigation is a menu tree six levels deep, and the fastest people in every organisation have memorised a set of shortcuts nobody documented. A palette is the obvious answer and almost nobody ships one, for a reason that is not obvious: in healthcare, search is a regulated act. Typing a name into a global patient search is a privacy event whether or not you open the chart, and a palette that helpfully autocompletes across the whole patient index has created a compliance problem at the speed of thought. So out-of-scope matches are rendered as a count — 3 further matches, break-glass required — which is the whole design: the reader learns the search was not empty without learning who.",
    "categories": [
      "Clinical",
      "Navigation"
    ],
    "fhir": [
      {
        "name": "Patient",
        "url": "https://hl7.org/fhir/R4/patient.html",
        "note": "Searched, and the only kind of result that is scoped. Matches outside the treatment relationship are counted, never named, and the search is audited whether or not it matched."
      },
      {
        "name": "Task",
        "url": "https://hl7.org/fhir/R4/task.html",
        "note": "Actions map to Task, ServiceRequest and Communication creation in the host. The palette runs the verb; it never writes the resource."
      }
    ],
    "resource": "Patient",
    "resourceUrl": "https://hl7.org/fhir/R4/patient.html",
    "states": [
      "Empty, before anything is typed",
      "Actions ranked above records",
      "A verb waiting for its argument",
      "A significant action, first Enter",
      "An action that cannot run",
      "Out-of-scope patients, counted",
      "Break-glass unavailable to this role",
      "Nothing matches",
      "Grouped results",
      "Keyboard navigation",
      "Frequency weighting",
      "Every match named, with no scope"
    ],
    "props": [
      {
        "name": "items",
        "type": "readonly PaletteItem[]",
        "description": "Everything the palette may match. A flat list rather than registered providers: the provider interface, its abort signals and its per-source failure handling belong to the host, which is the only place that knows which of them is a slow terminology server.",
        "required": true
      },
      {
        "name": "open",
        "type": "boolean",
        "description": "Whether the palette is showing. Controlled, so the host owns the shortcut that summons it.",
        "required": true
      },
      {
        "name": "className",
        "type": "string",
        "description": "Applied to the palette's outer element.",
        "required": false
      },
      {
        "name": "onClose",
        "type": "(() => void)",
        "description": "Fired on Escape, on backdrop click, and after a command runs.",
        "required": false
      },
      {
        "name": "onRun",
        "type": "((item: PaletteItem) => void)",
        "description": "Runs an item. Only ever called for an outcome of `run`.",
        "required": false
      },
      {
        "name": "onSearchAudit",
        "type": "((audit: SearchAudit) => void)",
        "description": "Called once per search that touched the patient index — including the ones that matched nobody. The host writes the audit entry.",
        "required": false
      },
      {
        "name": "placeholder",
        "type": "string",
        "description": "The empty-field prompt. Say what can be typed — \"Search, or start with a verb\" — rather than \"Ask anything\", which promises a scope the palette will refuse.",
        "required": false,
        "default": "\"Search or run a command…\""
      },
      {
        "name": "scope",
        "type": "PatientScope",
        "description": "The treatment relationship this search is bounded by. Every query is scoped to it, and searches it refuses are audited too.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "ChartCommandPalette",
        "props": [
          {
            "name": "items",
            "type": "readonly PaletteItem[]",
            "description": "Everything the palette may match. A flat list rather than registered providers: the provider interface, its abort signals and its per-source failure handling belong to the host, which is the only place that knows which of them is a slow terminology server.",
            "required": true
          },
          {
            "name": "open",
            "type": "boolean",
            "description": "Whether the palette is showing. Controlled, so the host owns the shortcut that summons it.",
            "required": true
          },
          {
            "name": "className",
            "type": "string",
            "description": "Applied to the palette's outer element.",
            "required": false
          },
          {
            "name": "onClose",
            "type": "(() => void)",
            "description": "Fired on Escape, on backdrop click, and after a command runs.",
            "required": false
          },
          {
            "name": "onRun",
            "type": "((item: PaletteItem) => void)",
            "description": "Runs an item. Only ever called for an outcome of `run`.",
            "required": false
          },
          {
            "name": "onSearchAudit",
            "type": "((audit: SearchAudit) => void)",
            "description": "Called once per search that touched the patient index — including the ones that matched nobody. The host writes the audit entry.",
            "required": false
          },
          {
            "name": "placeholder",
            "type": "string",
            "description": "The empty-field prompt. Say what can be typed — \"Search, or start with a verb\" — rather than \"Ask anything\", which promises a scope the palette will refuse.",
            "required": false,
            "default": "\"Search or run a command…\""
          },
          {
            "name": "scope",
            "type": "PatientScope",
            "description": "The treatment relationship this search is bounded by. Every query is scoped to it, and searches it refuses are audited too.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { ChartCommandPalette } from \"@/components/zoblocks/chart-command-palette\";\nimport \"@/styles/zoblocks-palette.css\";\n\n<ChartCommandPalette\n  open={open}\n  items={items}\n  scope={{ inScope: myPatients, breakGlass: true }}\n  onRun={run}\n  onSearchAudit={(audit) => log(\"patient-search\", audit)}\n  onClose={() => setOpen(false)}\n/>",
    "guidance": {
      "use": [
        "Behind ⌘K, everywhere. The palette is the shortcut the fastest clinicians already invented for themselves.",
        "With a scope. Without one, patient results are unfiltered — which is the compliance problem the component exists to avoid.",
        "With `onSearchAudit` wired before the first patient source is added. A palette that searches the index without recording it is worse than no palette.",
        "With `significant` set on anything destructive or clinically consequential, so it takes a second Enter rather than the first."
      ],
      "avoid": [
        "Without an audit sink. The component will still produce the record; nothing will keep it.",
        "As a replacement for the menu. It is the fast path for people who know what they want, not the only path.",
        "With the whole patient index passed as items. Pre-filter server-side; ranking a hundred thousand candidates in the render is not what this is.",
        "With confirmations delegated to a modal. The palette is a keyboard surface and a modal takes the keyboard away from it mid-flow."
      ]
    },
    "accessibility": [
      {
        "label": "A combobox with an active descendant",
        "detail": "role=\"combobox\" on the input with aria-activedescendant pointing at the highlighted option, so focus never leaves the field a person is typing into."
      },
      {
        "label": "The result count is announced once, not per keystroke",
        "detail": "The live region is debounced by 350ms. A palette that announces on every keystroke restarts its own announcement before the previous word finishes, and a screen-reader user hears nothing in full."
      },
      {
        "label": "Focus returns to the invoking element on every close path",
        "detail": "Escape, running an item, and an external close all restore focus to whatever was focused when the palette opened. A palette that drops focus to the body has stranded the user it exists for."
      },
      {
        "label": "Unavailable actions are shown with the reason",
        "detail": "aria-disabled with the reason as text — \"Offline\", \"Requires prescriber role\". An action that vanishes teaches somebody the feature does not exist; one shown disabled teaches them what to change."
      },
      {
        "label": "The withheld count is a row, not a footnote",
        "detail": "It sits in the list where the results would be. A reader who does not see it concludes the search was empty, which is the one wrong conclusion available."
      },
      {
        "label": "Groups are labelled groups",
        "detail": "Each section is role=\"group\" with its own name inside the listbox, so a screen reader announces \"Actions, 3 items\" rather than reading twelve options as one undifferentiated list."
      }
    ],
    "limitations": [
      "Sources are a flat array rather than registered providers. The provider interface, its abort signals and its per-source failure handling belong to the host, which is the only place that knows which of them is a slow terminology server.",
      "Ranking is synchronous and unwindowed. Above roughly a thousand candidates it belongs in a worker, and the host should pre-filter rather than hand the palette its whole index.",
      "The audit record is produced, not written. The palette says what was searched and what was withheld; where that goes is the host's, because it is the host that knows the actor and the session.",
      "Break-glass is signalled, never performed. The palette says an override exists and that the user may request one; the workflow behind it is a separate surface with its own consent and its own record.",
      "The matcher is deliberately about sixty lines. It does not do transposition or phonetic matching, so a genuine typo in a patient's name will miss — which is the safer failure for a component whose other job is to not over-report people."
    ],
    "related": [
      "recent-patient-stack",
      "chart-header",
      "chart-context-menu"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add chart-command-palette",
    "technicalName": "ChartCommandPalette",
    "aliases": [
      "command palette",
      "cmd k",
      "quick search",
      "clinical search",
      "spotlight"
    ],
    "tags": [
      "navigation",
      "keyboard-first",
      "overlay",
      "themeable",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Give behavioral-health verbs first-class entries: start PHQ-9, open safety plan, log a collateral contact, document a no-show, begin group note.",
        "Route a Part 2 disclosure request to the consent workflow, never to the document. The verb is legitimate; the shortcut to the file is not.",
        "Put enough in `detail` to choose between two similar rows. Two identical labels with no detail is a coin toss with a chart.",
        "Show unavailable actions rather than hiding them, and say why."
      ],
      "dont": [
        "Do not name a patient outside the treatment relationship, under any weighting. The count is the answer.",
        "Do not suppress the audit for an empty search. In a privacy review the empty ones are the interesting ones.",
        "Do not let frequency outrank the group. A much-visited document above the verb somebody just typed has stopped being a command palette.",
        "Do not run a significant action on the first Enter, even when the user is fast. Especially then."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "Behavioral-health verbs are distinct and worth first-class ranking — start PHQ-9, open safety plan, log a collateral contact, document a no-show, begin group note — and one of them has consequences: a Part 2 disclosure request routes to a consent workflow rather than to a document.",
      "workflows": [
        "documentation",
        "medication",
        "care-coordination",
        "intake"
      ],
      "phi": {
        "handles": true,
        "notes": "Searches the patient index. The out-of-scope count and the audit record exist because a search is a privacy event before any chart is opened."
      },
      "auditable": true,
      "permissions": [
        "patient.read",
        "audit.write"
      ],
      "terminology": [
        "FHIR"
      ]
    },
    "variants": [
      {
        "id": "scoped",
        "label": "Scoped",
        "description": "With a treatment-relationship scope. Out-of-scope patients are counted rather than named.",
        "args": {
          "open": true
        }
      },
      {
        "id": "unscoped",
        "label": "Unscoped",
        "description": "No treatment-relationship scope, so every match is named. The contrast is the argument.",
        "args": {
          "open": true
        }
      }
    ],
    "controls": [
      {
        "prop": "open",
        "control": "switch",
        "label": "Open",
        "defaultValue": true
      },
      {
        "prop": "onRun",
        "control": "event",
        "label": "onRun"
      },
      {
        "prop": "onSearchAudit",
        "control": "event",
        "label": "onSearchAudit"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "A labelled combobox with aria-expanded, aria-controls and aria-activedescendant; a listbox of options with aria-selected, and labelled groups inside it.",
        "evidence": "chart-command-palette.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Arrows move the active option, Tab accepts an argument, Enter runs, Escape closes. Nothing needs a pointer.",
        "evidence": "chart-command-palette.test.tsx"
      },
      {
        "wcag": "2.4.3",
        "name": "Focus order",
        "status": "pass",
        "how": "Focus stays in the input for the whole session and returns to the invoking element on close — a test asserts it, because this is the failure that strands a keyboard user.",
        "evidence": "chart-command-palette.test.tsx"
      },
      {
        "wcag": "4.1.3",
        "name": "Status messages",
        "status": "pass",
        "how": "aria-live=\"polite\" carrying the result count and the withheld count, debounced by 350ms so typing does not restart the announcement on every keystroke.",
        "evidence": "chart-command-palette.test.tsx"
      },
      {
        "wcag": "3.3.4",
        "name": "Error prevention",
        "status": "pass",
        "how": "A significant action requires a second Enter, and the confirmation is a row in the palette rather than a modal that takes the keyboard away.",
        "evidence": "chart-command-palette.test.tsx"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "The active row carries a bar and a background; a significant action carries a marker before its confirmation; an unavailable one is struck through and states its reason in words.",
        "evidence": "chart-command-palette.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size (minimum)",
        "status": "pass",
        "how": "Options are 32px on a pointer device and 44px below 40rem, both above the 24px floor.",
        "evidence": "chart-command-palette.test.tsx"
      },
      {
        "wcag": "1.4.10",
        "name": "Reflow",
        "status": "pass",
        "how": "Below 40rem the palette becomes a full-screen sheet with taller rows and no keyboard hints, because there is no keyboard to hint at.",
        "evidence": "chart-command-palette.test.tsx"
      }
    ],
    "examples": [
      {
        "id": "counted",
        "title": "Out of scope is a count, never a name",
        "description": "Typing a name into a global patient search is a privacy event whether or not you open the chart. Matches outside your treatment relationships are rendered as a number, so the reader learns the search was not empty without learning who — and the row sits in the list rather than under it, because a reader who misses it concludes the search was empty.",
        "fixture": "patients",
        "code": "applyScope(rank(\"okon\", items), { inScope: new Set([\"p-mine\"]) });\n// → { visible: [ … 1 patient … ], withheld: 3 }\n\ndescribeWithheld(3, { breakGlass: true });\n// → \"3 further matches outside your patients — break-glass required\""
      },
      {
        "id": "audit",
        "title": "Every patient search is recorded, including the empty ones",
        "description": "A search that found nobody is still a search that was made, and in a privacy review the empty ones are the interesting ones. The component produces the record and the host keeps it; a term that never reached the patient index produces nothing, because there is nothing to record.",
        "fixture": "patientRestricted",
        "code": "auditFor(\"okonkwo\", results, /* searchedPatients */ true);\n// → { term: \"okonkwo\", shown: 1, withheld: 3, empty: false }\n\nauditFor(\"zzzz\", empty, true);   // → { …, shown: 0, withheld: 0, empty: true }\nauditFor(\"dark mode\", results, false); // → null — the index was never touched"
      },
      {
        "id": "verbs",
        "title": "Actions rank above records, because a verb is what was meant",
        "description": "The gap between a group and the next is deliberately larger than anything frequency can close. A palette where a much-visited document outranks the verb somebody just typed has stopped being a command palette — and behavioral-health verbs are first-class here, including the one with consequences: a Part 2 disclosure request routes to consent, never to a file.",
        "fixture": "patientRoutine",
        "code": "rank(\"phq\", [\n  { id: \"doc\", kind: \"chart-resource\", label: \"PHQ-9 result, 12 Aug\" },\n  { id: \"run\", kind: \"action\",         label: \"Start PHQ-9\" },\n])[0].item.id;\n// → \"run\""
      },
      {
        "id": "second-enter",
        "title": "A significant action never runs on the first Enter",
        "description": "The confirmation is a row inside the palette rather than a modal, because a modal takes the keyboard away from the surface that was built for it. The marker is on the row before it is chosen, so the second Enter is not a surprise mid-keystroke.",
        "fixture": "patientRoutine",
        "code": "outcomeFor(discontinue);        // { kind: \"confirm\", prompt: \"… press Enter again\" }\noutcomeFor(discontinue, true);  // { kind: \"run\" }\noutcomeFor(offlineOrder);       // { kind: \"blocked\", reason: \"Offline\" }"
      }
    ],
    "fixtures": [
      "patientRoutine",
      "patientRestricted",
      "patients"
    ],
    "seo": {
      "slug": "chart-command-palette",
      "title": "Chart Command Palette — React clinical ⌘K",
      "description": "React ⌘K for clinical apps: verb-first ranking, relationship scoping that counts rather than names, and an audit for every patient search.",
      "primaryKeyword": "react clinical command palette",
      "secondaryKeywords": [
        "cmd k healthcare ui",
        "treatment relationship scoping",
        "patient search audit",
        "break glass component"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "chart-review",
        "care-coordination",
        "documentation"
      ],
      "alternatives": [
        {
          "ref": "recent-patient-stack",
          "when": "the chart you want is already open"
        }
      ]
    }
  },
  {
    "name": "chart-context-menu",
    "title": "Chart Context Menu",
    "tier": "free",
    "status": "beta",
    "since": "0.5.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A context menu that names what it is about before it offers to change it, ranks verbs by consequence, and counts the actions it withholds.",
    "tagline": "Names its subject before it offers to change it.",
    "description": "Every menu opens with a header naming the record, so the first thing under the pointer is never a verb. Four consequence tiers decide the interaction, not the colour. A masked row makes a masked header, and a disclosure is audited on every path.",
    "rationale": "It is the shortest path to an irreversible act, and it opens on top of the row that said whose act it was. The popup is solved elsewhere. What is not modelled anywhere is what the menu is about: which verbs belong on this noun, which this person may run, and what each one costs.",
    "categories": [
      "Clinical",
      "Navigation"
    ],
    "fhir": [
      {
        "name": "Patient",
        "url": "https://hl7.org/fhir/R4/patient.html",
        "note": "The only subject whose header shows initials. Masked, it reads 'Restricted record' and nothing more."
      },
      {
        "name": "MedicationRequest",
        "url": "https://hl7.org/fhir/R4/medicationrequest.html",
        "note": "Discontinue, hold and renew made the clinical tier necessary: each must name what it stops, and when."
      },
      {
        "name": "Observation",
        "url": "https://hl7.org/fhir/R4/observation.html",
        "note": "Acknowledging a critical result stops an escalation, so the confirmation states the time."
      },
      {
        "name": "DocumentReference",
        "url": "https://hl7.org/fhir/R4/documentreference.html",
        "note": "Addendum, amendment and retraction are three legal acts most interfaces render as one Edit."
      },
      {
        "name": "AuditEvent",
        "url": "https://hl7.org/fhir/R4/auditevent.html",
        "note": "onDisclose produces this shape; the component never writes one, having no actor and no session. It never carries the label."
      }
    ],
    "resource": "Patient",
    "resourceUrl": "https://hl7.org/fhir/R4/patient.html",
    "states": [
      "Routine actions only",
      "A recorded action, saying what it writes",
      "A clinical action, first activation",
      "A clinical action, second step",
      "A disclosure, reasons offered",
      "Unavailable, with the reason in place",
      "Withheld by policy, counted",
      "An availability check still pending",
      "A masked subject",
      "A multiple selection",
      "Checkbox and radio view state",
      "A submenu, open beside its row",
      "This record supports no actions",
      "Every action withheld from this role"
    ],
    "props": [
      {
        "name": "actions",
        "type": "readonly ChartMenuAction[]",
        "description": "Every verb the surface offers. One flat array; `applies` does the routing, so nothing at the call site needs to know what a `MedicationRequest` is.",
        "required": true
      },
      {
        "name": "children",
        "type": "(trigger: MenuTriggerProps) => React.ReactNode",
        "description": "A render function, not an element. See the note at the top of this file.",
        "required": true
      },
      {
        "name": "subject",
        "type": "MenuSubject",
        "description": "What was right-clicked. Required, and there is no prop that suppresses the header it produces: a configurable safety feature is one that is off in the codebase that needed it most.",
        "required": true
      },
      {
        "name": "autoFocus",
        "type": "boolean",
        "description": "Whether opening moves focus into the menu. Defaults to `true`. Set `false` only for a menu the reader did not summon — a demo that opens itself, a product tour, a walkthrough. Such a menu renders and reads normally but leaves the caret alone; on a page that opens one every few seconds the alternative is focus jumping under the reader and a screen reader announcing a menu nobody asked for. A prop rather than sniffing `event.isTrusted`, which was the first attempt: that inferred intent from whether a human dispatched the event, so the component behaved one way in tests and another in production — which is the property a test exists to rule out.",
        "required": false
      },
      {
        "name": "className",
        "type": "string",
        "description": "Applied to the popup.",
        "required": false
      },
      {
        "name": "container",
        "type": "HTMLElement | null",
        "description": "Where the popup is portalled. Defaults to `document.body`. Worth setting when the surrounding page scopes theme, density or `dir` on an element the menu should stay inside, or when a test wants the popup in the same tree it is auditing.",
        "required": false
      },
      {
        "name": "density",
        "type": "'compact' | 'comfortable'",
        "description": "Overrides the inherited density scope.",
        "required": false
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "Lets the browser's own context menu through — the right behaviour over selected text.",
        "required": false
      },
      {
        "name": "now",
        "type": "string",
        "description": "An ISO instant for the disclosure record. Required whenever any action is `disclosive`: the record needs a timestamp and a component may not read the clock (ENGINEERING.md §9).",
        "required": false
      },
      {
        "name": "onBlocked",
        "type": "((action: ChartMenuAction, reason: string) => void)",
        "description": "A blocked verb was chosen. Worth wiring: repeated blocks are a permissions problem.",
        "required": false
      },
      {
        "name": "onDisclose",
        "type": "((record: DisclosureRecord) => void)",
        "description": "The disclosure record, on all three outcomes. The component makes it; the host keeps it, because the host is the only thing that knows the actor.",
        "required": false
      },
      {
        "name": "onOpenChange",
        "type": "((open: boolean, subject: MenuSubject) => void)",
        "description": "The menu opened or closed. For hosts that pause a poll, dismiss a hover card, or count how often the right-click path is actually used — which is the measurement that says whether the ⋯ button is the product.",
        "required": false
      },
      {
        "name": "onRun",
        "type": "((action: ChartMenuAction, subject: MenuSubject, outcome: MenuOutcome) => void)",
        "description": "Runs an action. Only ever called for an outcome of `run`. Receives the whole subject, `also` included, so a host writes and reports per subject rather than pretending twelve writes are one boolean.",
        "required": false
      },
      {
        "name": "onToggle",
        "type": "((action: ChartMenuAction, checked: boolean) => void)",
        "description": "A toggle changed. Separate from `onRun`, because view state is not an act.",
        "required": false
      },
      {
        "name": "policy",
        "type": "MenuPolicy",
        "description": "Who is asking. Without one, nothing is withheld — correct for a demo and wrong for a chart.",
        "required": false
      },
      {
        "name": "presentation",
        "type": "MenuPresentation",
        "description": "How the menu is drawn. `auto` — the default — picks the bottom sheet on a coarse pointer or below 40rem and the pointer popup everywhere else, which is the choice a host almost never wants to make itself.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "ChartContextMenu",
        "props": [
          {
            "name": "actions",
            "type": "readonly ChartMenuAction[]",
            "description": "Every verb the surface offers. One flat array; `applies` does the routing, so nothing at the call site needs to know what a `MedicationRequest` is.",
            "required": true
          },
          {
            "name": "children",
            "type": "(trigger: MenuTriggerProps) => React.ReactNode",
            "description": "A render function, not an element. See the note at the top of this file.",
            "required": true
          },
          {
            "name": "subject",
            "type": "MenuSubject",
            "description": "What was right-clicked. Required, and there is no prop that suppresses the header it produces: a configurable safety feature is one that is off in the codebase that needed it most.",
            "required": true
          },
          {
            "name": "autoFocus",
            "type": "boolean",
            "description": "Whether opening moves focus into the menu. Defaults to `true`. Set `false` only for a menu the reader did not summon — a demo that opens itself, a product tour, a walkthrough. Such a menu renders and reads normally but leaves the caret alone; on a page that opens one every few seconds the alternative is focus jumping under the reader and a screen reader announcing a menu nobody asked for. A prop rather than sniffing `event.isTrusted`, which was the first attempt: that inferred intent from whether a human dispatched the event, so the component behaved one way in tests and another in production — which is the property a test exists to rule out.",
            "required": false
          },
          {
            "name": "className",
            "type": "string",
            "description": "Applied to the popup.",
            "required": false
          },
          {
            "name": "container",
            "type": "HTMLElement | null",
            "description": "Where the popup is portalled. Defaults to `document.body`. Worth setting when the surrounding page scopes theme, density or `dir` on an element the menu should stay inside, or when a test wants the popup in the same tree it is auditing.",
            "required": false
          },
          {
            "name": "density",
            "type": "'compact' | 'comfortable'",
            "description": "Overrides the inherited density scope.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "Lets the browser's own context menu through — the right behaviour over selected text.",
            "required": false
          },
          {
            "name": "now",
            "type": "string",
            "description": "An ISO instant for the disclosure record. Required whenever any action is `disclosive`: the record needs a timestamp and a component may not read the clock (ENGINEERING.md §9).",
            "required": false
          },
          {
            "name": "onBlocked",
            "type": "((action: ChartMenuAction, reason: string) => void)",
            "description": "A blocked verb was chosen. Worth wiring: repeated blocks are a permissions problem.",
            "required": false
          },
          {
            "name": "onDisclose",
            "type": "((record: DisclosureRecord) => void)",
            "description": "The disclosure record, on all three outcomes. The component makes it; the host keeps it, because the host is the only thing that knows the actor.",
            "required": false
          },
          {
            "name": "onOpenChange",
            "type": "((open: boolean, subject: MenuSubject) => void)",
            "description": "The menu opened or closed. For hosts that pause a poll, dismiss a hover card, or count how often the right-click path is actually used — which is the measurement that says whether the ⋯ button is the product.",
            "required": false
          },
          {
            "name": "onRun",
            "type": "((action: ChartMenuAction, subject: MenuSubject, outcome: MenuOutcome) => void)",
            "description": "Runs an action. Only ever called for an outcome of `run`. Receives the whole subject, `also` included, so a host writes and reports per subject rather than pretending twelve writes are one boolean.",
            "required": false
          },
          {
            "name": "onToggle",
            "type": "((action: ChartMenuAction, checked: boolean) => void)",
            "description": "A toggle changed. Separate from `onRun`, because view state is not an act.",
            "required": false
          },
          {
            "name": "policy",
            "type": "MenuPolicy",
            "description": "Who is asking. Without one, nothing is withheld — correct for a demo and wrong for a chart.",
            "required": false
          },
          {
            "name": "presentation",
            "type": "MenuPresentation",
            "description": "How the menu is drawn. `auto` — the default — picks the bottom sheet on a coarse pointer or below 40rem and the pointer popup everywhere else, which is the choice a host almost never wants to make itself.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { ChartContextMenu } from \"@/components/zoblocks/chart-context-menu\";\nimport \"@/styles/zoblocks-menu.css\";\n\n<ChartContextMenu\n  subject={{\n    resource: \"MedicationRequest\",\n    id: order.id,\n    label: \"Lisinopril 10 mg\",\n    detail: \"Oral · daily · started 4 Mar 2026\",\n    masked: row.restricted,\n  }}\n  actions={medicationActions}\n  policy={{ role: \"a registered nurse\", permitted, breakGlass: true }}\n  now={serverTime}\n  onRun={(action, subject) => dispatch(action.id, subject)}\n  onDisclose={(record) => audit.write(\"disclosure\", record)}\n>\n  {(trigger) => <tr {...trigger}>{cells}</tr>}\n</ChartContextMenu>",
    "guidance": {
      "use": [
        "On any row that already identifies a record — a medication, a result, a note, a patient in a worklist. The subject header is only honest if the row it came from was.",
        "With a policy. Without one nothing is withheld, which is right for a demo and wrong for a chart.",
        "With `onDisclose` wired before the first disclosive action is added. The component produces the record either way; nothing will keep it.",
        "With `now` set from server time whenever any action is disclosive — the record needs a timestamp and the component may not read a clock.",
        "Alongside a visible ⋯ affordance. A menu reachable only by a secondary click is one most people never find, and `presentation=\"anchored\"` is the same menu from a button."
      ],
      "avoid": [
        "As the only way to reach an action. It is the fast path for people who already know the verb, not the only path.",
        "With `applies` omitted above `tier: \"routine\"`, which offers a discontinue on every resource in the chart.",
        "With a confirmation delegated to a modal. A modal moves focus off the surface and takes the keyboard away from the person who was using it.",
        "With a preview of the record's value in a submenu. A floating layer showing PHI is a disclosure surface during a screen-share, a screenshot and a recording — if the value is worth showing, the row already shows it.",
        "On a selection, with a disclosive action marked `bulk: \"allowed\"`. Twelve records with one justification is not a record a privacy officer accepts, and the validator refuses it."
      ]
    },
    "accessibility": [
      {
        "label": "The menu's accessible name is its subject",
        "detail": "aria-labelledby points at the header, so a screen reader announces \"Aluel Okonkwo, MRN 44-2871, menu, 8 items\" before any item. One element, both audiences."
      },
      {
        "label": "Shift+F10 and the Menu key open it",
        "detail": "Handled explicitly: Chrome and Firefox synthesise a contextmenu event for it, Safari does not."
      },
      {
        "label": "Unavailable rows stay reachable and say why",
        "detail": "aria-disabled, with the reason as text. A tooltip is unavailable to the person who most needs it."
      },
      {
        "label": "Rows still being checked are skipped, not activated",
        "detail": "The arrows skip a pending row, so a fast Enter cannot land on an answer that has not arrived."
      },
      {
        "label": "Focus returns to the trigger on every close path",
        "detail": "Escape, running an item and Tab all restore it. Clicking away deliberately does not."
      },
      {
        "label": "The withheld count is a row, not a footnote",
        "detail": "A reader who misses it concludes the record supports nothing else — the one wrong conclusion available."
      },
      {
        "label": "Activation is on the up-event",
        "detail": "Opening is on contextmenu, running on click. Pressing down on Discontinue and dragging off does nothing."
      },
      {
        "label": "The tier is never carried by colour alone",
        "detail": "Each tier above routine has a glyph the component supplies itself, a band position and a sentence — so a host that passes no icons still sees the difference. Forced colours discards the tints; everything else survives."
      }
    ],
    "limitations": [
      "The trigger announces aria-haspopup but never aria-expanded: axe rejects it on a generic element, and a transient popup is not content belonging to the row.",
      "Submenus have a 100ms hover intent and no safe triangle. An open child closes when the pointer reaches a different row, not when it leaves the trigger, so crossing the gap closes nothing. Routine actions only inside one.",
      "Type-ahead matches the first letter only. A full buffer competes with the shortcuts the menu displays, and the ambiguity is worse than the omission.",
      "The menu follows its trigger on scroll and closes on a viewport resize. It is anchored to a place inside the row, not to a viewport coordinate.",
      "Break-glass is signalled, never performed. The step-up authentication behind it is a separate surface.",
      "The disclosure record is produced, not written. The component knows the action and the subject, never the actor or the session.",
      "Strings are English and not routed through @zoblocks/intl — true of every registry component today."
    ],
    "related": [
      "chart-command-palette",
      "care-timeline",
      "data-grid"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add chart-context-menu",
    "technicalName": "ChartContextMenu",
    "aliases": [
      "context menu",
      "right click menu",
      "action menu",
      "row actions",
      "overflow menu",
      "dropdown menu"
    ],
    "tags": [
      "navigation",
      "overlay",
      "keyboard-first",
      "themeable",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Write `confirm` with the specifics: “the next scheduled dose is 14:00 today” rather than “this cannot be undone”.",
        "Write `records` from the reader's side: “creates a Task for pharmacy; it appears in their queue with your name on it”, not “saved”.",
        "Let the resolver place the separators. Consequence sorts to the bottom, so a discontinue cannot end up adjacent to a copy no matter what order the array is in.",
        "Keep toggles at `tier: \"routine\"`. Pinning a column and discontinuing a drug are not the same kind of act and must not look like one.",
        "Give a bulk-safe clinical action a `bulkConfirm`. Confirming twelve no-shows with a sentence written for one is a confirmation nobody read."
      ],
      "dont": [
        "Do not hide an action this person cannot run. The count teaches them something exists; the silence teaches them it does not.",
        "Do not resolve a name the row was masking. The menu may say less than its trigger; it may never say more.",
        "Do not append actions when an async check resolves. The row's place is reserved from the first paint, because a menu that grows has moved a destructive verb under a pointer aiming at something else.",
        "Do not reorder by frequency. This is the opposite of the command palette, deliberately: there you typed and are reading, here you have muscle memory and a pointer in flight.",
        "Do not suppress the disclosure record when the reader backs out. In a privacy review the abandoned ones are the interesting ones."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "`documented` exists because “this writes something other clinicians will read” is the most common surprise in an EHR, and costs one line of copy to remove. `disclosive` exists because HIPAA requires an emergency access procedure (45 CFR §164.312(a)(2)(ii)) and every implementation takes a reason first.",
      "workflows": [
        "documentation",
        "medication",
        "care-coordination",
        "assessment"
      ],
      "phi": {
        "handles": true,
        "notes": "The header renders what the row rendered and refuses to render more. The disclosure record carries resource and id, never the label."
      },
      "auditable": true,
      "permissions": [
        "chart.read",
        "audit.write"
      ],
      "terminology": [
        "FHIR"
      ]
    },
    "variants": [
      {
        "id": "popup",
        "label": "Pointer popup",
        "description": "Opened at the cursor, with the subject header as the safe landing.",
        "args": {
          "presentation": "popup"
        }
      },
      {
        "id": "anchored",
        "label": "Anchored to a button",
        "description": "The discoverable path, offset so it does not cover the button focus returns to.",
        "args": {
          "presentation": "anchored"
        }
      },
      {
        "id": "sheet",
        "label": "Touch sheet",
        "description": "Long press below 40rem. Pinned to the bottom edge, 44px rows, cancelled by a scroll.",
        "args": {
          "presentation": "sheet"
        }
      }
    ],
    "controls": [
      {
        "prop": "presentation",
        "control": "select",
        "label": "Presentation",
        "options": [
          "auto",
          "popup",
          "anchored",
          "sheet"
        ],
        "defaultValue": "auto"
      },
      {
        "prop": "density",
        "control": "select",
        "label": "Density",
        "options": [
          "comfortable",
          "compact"
        ]
      },
      {
        "prop": "disabled",
        "control": "switch",
        "label": "Disabled",
        "defaultValue": false
      },
      {
        "prop": "onRun",
        "control": "event",
        "label": "onRun"
      },
      {
        "prop": "onDisclose",
        "control": "event",
        "label": "onDisclose"
      },
      {
        "prop": "onBlocked",
        "control": "event",
        "label": "onBlocked"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Shift+F10 and the Menu key open it; arrows, Home, End, type-ahead, Enter and Escape drive it. Nothing needs a pointer.",
        "evidence": "chart-context-menu.test.tsx"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "role=\"menu\" named by the subject header; menuitem, menuitemcheckbox and menuitemradio; aria-disabled rather than disabled, so a blocked row keeps its name and reason.",
        "evidence": "chart-context-menu.test.tsx"
      },
      {
        "wcag": "2.4.3",
        "name": "Focus order",
        "status": "pass",
        "how": "Focus enters on open and returns to the trigger on Escape, on running an item, and on Tab. A test asserts all three.",
        "evidence": "chart-context-menu.test.tsx"
      },
      {
        "wcag": "2.4.11",
        "name": "Focus not obscured (minimum)",
        "status": "pass",
        "how": "The anchored menu flips above its trigger when there is no room below, so it never covers it.",
        "evidence": "chart-context-menu.test.tsx"
      },
      {
        "wcag": "2.5.2",
        "name": "Pointer cancellation",
        "status": "pass",
        "how": "Opening is on contextmenu, activation on click. A long press opens the sheet and never activates a row.",
        "evidence": "chart-context-menu.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size (minimum)",
        "status": "pass",
        "how": "30px comfortable, 26px compact, both max() against the density floor so nothing goes under 24px. The sheet uses 44px.",
        "evidence": "menu.css"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "Every tier above routine carries a glyph the component supplies, a band position and a word. Asserted with the host passing no icons, which is how this was false before.",
        "evidence": "chart-context-menu.test.tsx"
      },
      {
        "wcag": "4.1.3",
        "name": "Status messages",
        "status": "pass",
        "how": "A polite live region gives the action count and the withheld count on open. Nothing withheld, no clause — never \"0 hidden\".",
        "evidence": "chart-context-menu.test.tsx"
      },
      {
        "wcag": "3.3.4",
        "name": "Error prevention",
        "status": "pass",
        "how": "Clinical and disclosive actions take a second step, drawn under their row. The button carries the verb, never OK.",
        "evidence": "chart-context-menu.test.tsx"
      },
      {
        "wcag": "1.4.10",
        "name": "Reflow",
        "status": "pass",
        "how": "Below 40rem, and on a coarse pointer, it becomes a bottom sheet with the header pinned above the list.",
        "evidence": "menu.css"
      }
    ],
    "examples": [
      {
        "id": "subject",
        "title": "The subject header is the safe landing",
        "description": "The header names the record, so the first thing under the pointer is never a verb — the wrong-patient check and the accidental click-through, closed by one decision. No prop removes it.",
        "fixture": "patientRoutine",
        "code": "describeSubject({ resource: \"MedicationRequest\", id: \"m1\",\n                  label: \"Lisinopril 10 mg\", detail: \"Oral · daily\" });\n// → { who: \"Lisinopril 10 mg\", what: \"Oral · daily\", masked: false, bulk: 1 }\n\ndescribeSubject({ ...subject, masked: true });\n// → { who: \"Restricted record\", what: \"Medication\", masked: true, bulk: 1 }"
      },
      {
        "id": "tiers",
        "title": "Consequence is a rank, not a boolean",
        "description": "Routine runs on the click. Recorded runs and says what it wrote. Clinical takes a second step. A disclosure takes a reason. The resolver lays the bands out in that order, so a discontinue is never adjacent to a copy.",
        "fixture": "patientRoutine",
        "code": "actionOutcome(discontinue);\n// → { kind: \"confirm\", prompt: \"The next dose is 14:00 today…\", verb: \"Discontinue\" }\n\nactionOutcome(discontinue, { confirming: \"dc\" });   // → { kind: \"run\" }\nactionOutcome(preliminary);\n// → { kind: \"blocked\", reason: \"Preliminary results are not released\" }"
      },
      {
        "id": "withheld",
        "title": "Withheld is counted, never hidden",
        "description": "Policy removes the verb and leaves a number in its place, as a row inside the menu. The same rule the palette applies to patients it may not name.",
        "fixture": "patientRestricted",
        "code": "resolveMenu(subject, actions, { permitted: [\"open\", \"copy\"] }).withheld;  // → 3\n\ndescribeHiddenActions(3, { role: \"a registered nurse\", breakGlass: true });\n// → \"3 further actions on this record, hidden for a registered nurse — break-glass required\""
      },
      {
        "id": "disclosure",
        "title": "The record is made when the reasons are offered",
        "description": "The record is written when the list is drawn, again when a reason is chosen, and again as \"abandoned\" if the reader closes instead. In a privacy review the abandoned ones are the interesting ones. The label never appears in it.",
        "fixture": "patientRestricted",
        "code": "disclosureRecord(revealPart2, subject, { now, outcome: \"offered\" });\n// → { at: now, action: \"part2\", subject: { resource, id },\n//     subjectNamed: false, masked: false, reason: null,\n//     outcome: \"offered\", breakGlass: true }"
      },
      {
        "id": "pending",
        "title": "A menu that never moves under the cursor",
        "description": "A check still running renders at the row's final height, in its final position — never appended when the answer lands. Appending would move rows under a pointer already in flight. The arrows skip it too.",
        "fixture": "patientRoutine",
        "code": "nextIndex(rows, 0, 1);        // skips the row whose status is \"pending\"\nactionOutcome(stillChecking);\n// → { kind: \"blocked\", reason: \"Still checking whether this can run\" }"
      }
    ],
    "fixtures": [
      "patientRoutine",
      "patientRestricted"
    ],
    "seo": {
      "slug": "chart-context-menu",
      "title": "Chart Context Menu — React healthcare row actions",
      "description": "A React context menu for clinical apps: it names the record before offering to change it, ranks verbs by consequence, and counts the actions it withholds.",
      "primaryKeyword": "react healthcare context menu",
      "secondaryKeywords": [
        "clinical right click menu",
        "ehr row actions component",
        "break glass menu react",
        "destructive action confirmation menu"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "chart-review",
        "care-coordination",
        "documentation"
      ],
      "alternatives": [
        {
          "ref": "chart-command-palette",
          "when": "the reader knows the verb's name but not which row it lives on"
        }
      ]
    }
  },
  {
    "name": "chart-header",
    "title": "Chart Header",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "Persistent patient context that collapses to a safety bar rather than to a name, and never renders administrative gender beside a dose.",
    "tagline": "Patient context that collapses to a safety bar, not a name.",
    "description": "Sticky chrome over PatientBanner. Collapse moves content behind a disclosure rather than out of the accessibility tree. The encounter is an explicit control that will sit in “none selected” rather than pick one for you. The Sex Parameter for Clinical Use appears only where an order or a result is in view, with the context it applies to.",
    "rationale": "The chart header is the most-read eighty pixels in healthcare software and it is almost always built as a heading. Three consequences follow. It scrolls away, so the clinician acts with no identity on screen. It shows Patient.gender, which is the wrong field for every clinical decision — the right one is the Sex Parameter for Clinical Use, which is context-specific and can legitimately differ between a medication order and a reference range. And it treats the encounter as a subtitle, when which encounter am I documenting into is the single most common cause of a misfiled note. A subtitle cannot be wrong on purpose; a control can say nothing is selected and mean it.",
    "categories": [
      "Clinical",
      "Navigation"
    ],
    "fhir": [
      {
        "name": "Patient",
        "url": "https://hl7.org/fhir/R4/patient.html",
        "note": "Identity through PatientBanner. patient-sexParameterForClinicalUse is read with its comment and period; Patient.gender is never read, not even as a fallback."
      },
      {
        "name": "Encounter",
        "url": "https://hl7.org/fhir/R4/encounter.html",
        "note": "Each open encounter becomes one option. Nothing is auto-selected when more than one is open."
      },
      {
        "name": "EpisodeOfCare",
        "url": "https://hl7.org/fhir/R4/episodeofcare.html",
        "note": "status and type give the program; period.start gives the week, and an episode with no start gets no week rather than a guessed one."
      }
    ],
    "resource": "Patient",
    "resourceUrl": "https://hl7.org/fhir/R4/patient.html",
    "states": [
      "Expanded",
      "Collapsed to the safety strip",
      "No encounter is open",
      "Three encounters open — choose one",
      "Sex parameter, with its context",
      "Sex parameter not recorded, on an order screen",
      "Sex parameter withheld on an overview screen",
      "Allergies not asked",
      "Code status not recorded",
      "Isolation and fall risk",
      "Involuntary hold, with its expiry",
      "Hold expired",
      "Program and week",
      "With actions"
    ],
    "props": [
      {
        "name": "identifiers",
        "type": "TwoOrMore<IdentifierSpec>",
        "description": "Two, enforced by the type — this is NPSG.01.01.01 in the signature rather than in a review comment.",
        "required": true
      },
      {
        "name": "patient",
        "type": "Patient",
        "description": "The patient this chart belongs to. `Patient.gender` is deliberately not rendered — it is administrative gender, and a bare “M” beside a dose is a prescriber reading the wrong reference range.",
        "required": true
      },
      {
        "name": "actions",
        "type": "React.ReactNode",
        "description": "Rendered at the end of the expanded row. Actions belong to the application.",
        "required": false
      },
      {
        "name": "children",
        "type": "React.ReactNode",
        "description": "The screen, rendered inside the patient context the banner establishes. This is what lets `PatientGuard` compare a form against the chart on screen — the header is not a decoration above the content, it is the statement the content is made under.",
        "required": false
      },
      {
        "name": "className",
        "type": "string",
        "description": "Applied to the header element.",
        "required": false
      },
      {
        "name": "collapsed",
        "type": "boolean",
        "description": "Start collapsed. Uncontrolled by design: the host owns the scroll sentinel because only the host knows what its scroll container is, and an IntersectionObserver wired to the wrong ancestor is worse than none.",
        "required": false,
        "default": "false"
      },
      {
        "name": "encounters",
        "type": "readonly EncounterOption[]",
        "description": "Every encounter open for this patient. One is selected by the caller.",
        "required": false,
        "default": "[]"
      },
      {
        "name": "now",
        "type": "string",
        "description": "ISO 8601, supplied by the host. Decides whether a dated fact has lapsed.",
        "required": false
      },
      {
        "name": "onCollapsedChange",
        "type": "((collapsed: boolean) => void)",
        "description": "Fired when the header collapses to its safety strip or expands again. Content moves behind a disclosure rather than out of the DOM.",
        "required": false
      },
      {
        "name": "onSelectEncounter",
        "type": "((id: string | undefined) => void)",
        "description": "Switching encounter is a deliberate act, and the host re-guards every open form on the far side of it.",
        "required": false
      },
      {
        "name": "program",
        "type": "Program",
        "description": "The care programme and where the patient is in it, e.g. IOP week 3 of 8.",
        "required": false
      },
      {
        "name": "safety",
        "type": "SafetyInput",
        "description": "The banner facts, in the fixed house order: allergies, code status, isolation, legal status. Same order on every chart in the building, because a reader scans position before words.",
        "required": false,
        "default": "{}"
      },
      {
        "name": "selectedEncounterId",
        "type": "string",
        "description": "Which encounter is in view, controlled.",
        "required": false
      },
      {
        "name": "surface",
        "type": "ChartSurface",
        "description": "What the clinician has in view. Decides whether the Sex Parameter for Clinical Use appears at all.",
        "required": false,
        "default": "\"overview\""
      },
      {
        "name": "ward",
        "type": "string",
        "description": "Where the patient physically is. Shown because the answer changes who can act.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "ChartHeader",
        "props": [
          {
            "name": "identifiers",
            "type": "TwoOrMore<IdentifierSpec>",
            "description": "Two, enforced by the type — this is NPSG.01.01.01 in the signature rather than in a review comment.",
            "required": true
          },
          {
            "name": "patient",
            "type": "Patient",
            "description": "The patient this chart belongs to. `Patient.gender` is deliberately not rendered — it is administrative gender, and a bare “M” beside a dose is a prescriber reading the wrong reference range.",
            "required": true
          },
          {
            "name": "actions",
            "type": "React.ReactNode",
            "description": "Rendered at the end of the expanded row. Actions belong to the application.",
            "required": false
          },
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "The screen, rendered inside the patient context the banner establishes. This is what lets `PatientGuard` compare a form against the chart on screen — the header is not a decoration above the content, it is the statement the content is made under.",
            "required": false
          },
          {
            "name": "className",
            "type": "string",
            "description": "Applied to the header element.",
            "required": false
          },
          {
            "name": "collapsed",
            "type": "boolean",
            "description": "Start collapsed. Uncontrolled by design: the host owns the scroll sentinel because only the host knows what its scroll container is, and an IntersectionObserver wired to the wrong ancestor is worse than none.",
            "required": false,
            "default": "false"
          },
          {
            "name": "encounters",
            "type": "readonly EncounterOption[]",
            "description": "Every encounter open for this patient. One is selected by the caller.",
            "required": false,
            "default": "[]"
          },
          {
            "name": "now",
            "type": "string",
            "description": "ISO 8601, supplied by the host. Decides whether a dated fact has lapsed.",
            "required": false
          },
          {
            "name": "onCollapsedChange",
            "type": "((collapsed: boolean) => void)",
            "description": "Fired when the header collapses to its safety strip or expands again. Content moves behind a disclosure rather than out of the DOM.",
            "required": false
          },
          {
            "name": "onSelectEncounter",
            "type": "((id: string | undefined) => void)",
            "description": "Switching encounter is a deliberate act, and the host re-guards every open form on the far side of it.",
            "required": false
          },
          {
            "name": "program",
            "type": "Program",
            "description": "The care programme and where the patient is in it, e.g. IOP week 3 of 8.",
            "required": false
          },
          {
            "name": "safety",
            "type": "SafetyInput",
            "description": "The banner facts, in the fixed house order: allergies, code status, isolation, legal status. Same order on every chart in the building, because a reader scans position before words.",
            "required": false,
            "default": "{}"
          },
          {
            "name": "selectedEncounterId",
            "type": "string",
            "description": "Which encounter is in view, controlled.",
            "required": false
          },
          {
            "name": "surface",
            "type": "ChartSurface",
            "description": "What the clinician has in view. Decides whether the Sex Parameter for Clinical Use appears at all.",
            "required": false,
            "default": "\"overview\""
          },
          {
            "name": "ward",
            "type": "string",
            "description": "Where the patient physically is. Shown because the answer changes who can act.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { ChartHeader } from \"@/components/zoblocks/chart-header\";\nimport \"@/styles/zoblocks-chart-header.css\";\n\n<ChartHeader\n  patient={patient}\n  identifiers={[{ kind: \"mrn\" }, { kind: \"nhs\" }]}\n  surface=\"orders\"\n  now={serverTime}\n  encounters={open}\n  selectedEncounterId={encounterId}\n  onSelectEncounter={setEncounterId}\n  safety={{\n    allergies: { label: \"Penicillin — anaphylaxis\", tone: \"critical\" },\n    codeStatus: { label: \"DNR\" },\n  }}\n>\n  <OrderForm />\n</ChartHeader>",
    "guidance": {
      "use": [
        "On every chart screen, for the whole session. It is chrome, not a section.",
        "Wrapping the screen rather than sitting above it — the children render inside the patient context the banner establishes, which is what lets PatientGuard compare a form against the chart on screen.",
        "With `surface` set to what is actually in view. That is what decides whether the Sex Parameter for Clinical Use appears at all.",
        "With the safety facts resolved upstream, so the strip states an answer rather than a count."
      ],
      "avoid": [
        "As a page title. A heading scrolls away; this is the thing that must not.",
        "With `Patient.gender` mapped into the SPCU slot. They are different fields and the whole point of the second one is that the first was being misused.",
        "With an encounter auto-selected when several are open. Picking one for the user is picking where the note lands.",
        "Collapsed by default. The first render of a chart is the one where identity matters most."
      ]
    },
    "accessibility": [
      {
        "label": "Collapse hides nothing from the accessibility tree",
        "detail": "The expanded content moves behind a disclosure rather than out of the DOM, so a screen-reader user is never worse off than a sighted one. A test asserts the toggle's aria-expanded and aria-controls agree with the region's hidden state in both heights."
      },
      {
        "label": "Focus never lands behind the sticky bar",
        "detail": "Everything below the header carries a scroll margin the height of the expanded bar (WCAG 2.4.11). A focus ring hidden under sticky chrome is the most common way a keyboard user loses their place in a long chart."
      },
      {
        "label": "The strip is one spoken statement",
        "detail": "The banner landmark's accessible name is the whole safety strip in reading order, so a screen-reader user hears the six facts as a sentence rather than as six unlabelled chips."
      },
      {
        "label": "Absence is drawn as well as spoken",
        "detail": "\"Allergies not asked\" is a dashed border and an italic label, not a missing chip. A blank space where an allergy status should be is the state that gets prescribed against, and it is the only one with no visual weight at all."
      },
      {
        "label": "Tone never carries a fact on its own",
        "detail": "Each fact is a word plus a 3px bar. Remove the colour and the strip is unchanged in content — which matters here more than on most components, because this is the row read at a glance from two metres away."
      },
      {
        "label": "The encounter control keeps its place in the tab order",
        "detail": "A header with no change handler renders the encounter as static text rather than as a disabled select. A disabled control leaves the tab order, so a keyboard user could not reach the one fact that says where their note is going."
      }
    ],
    "limitations": [
      "It does not own the scroll sentinel. Only the host knows what its scroll container is, and an IntersectionObserver wired to the wrong ancestor collapses at the wrong moment — so `collapsed` is a prop and the observer belongs to the application.",
      "The safety facts arrive pre-resolved. The allergy question in particular has five answers and its own component; taking a count here would collapse “none known” and “never asked” into the same zero.",
      "It renders one program. A patient in an IOP and a medication clinic has two, and which one belongs in the header is a decision the deployment makes.",
      "Guardianship and conservatorship are carried as an alert rather than modelled. The shape varies by jurisdiction, and a field that means something different in two states is worse than free text that means what it says.",
      "It does not re-guard forms on an encounter change. It reports the change; PatientGuard is what enforces it, and wiring the two is the application's call because only it knows which forms are open."
    ],
    "related": [
      "identity",
      "allergy-chip",
      "care-team-presence",
      "recent-patient-stack",
      "chart-command-palette"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge",
      "@zoblocks/identity"
    ],
    "install": "npx @zoblocks/cli add chart-header",
    "technicalName": "ChartHeader",
    "aliases": [
      "patient header",
      "chart banner",
      "sticky patient bar",
      "safety strip",
      "encounter context"
    ],
    "tags": [
      "navigation",
      "layout",
      "themeable",
      "print-safe",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Keep the safety strip in the same order on every screen. Reading it at a glance is the only thing it is for, and contents that move are contents nobody can glance at.",
        "Pass `now` from the server. Whether a hold has expired is not a question to answer with a clock the user can change.",
        "Re-guard open forms when the encounter changes. The component reports the change deliberately so the host can.",
        "Show an expired hold as expired rather than removing it. Its disappearance is not the same signal as its lapse."
      ],
      "dont": [
        "Do not shorten a name to initials in the header. Initials are for avatars; the header is where the name is checked.",
        "Do not put a sixth alert on the strip because it fits. Every extra chip makes allergies and code status harder to find.",
        "Do not unmount the detail on collapse. `hidden` keeps it findable, searchable and reachable by a disclosure — unmounting makes the collapsed header worse for a screen-reader user than for a sighted one.",
        "Do not render the SPCU on an overview screen. Out of context it is a demographic wearing a clinical name."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "Carries the fields behavioral health needs in a header and nowhere else: the program and the week (IOP, week 3 of 8), the legal status with its expiry, and the safety facts that must survive a collapse. The week is what decides whether today's session is a mid-course review or a discharge plan.",
      "workflows": [
        "documentation",
        "medication",
        "care-coordination",
        "intake"
      ],
      "phi": {
        "handles": true,
        "notes": "The most PHI-dense element on any chart screen, and the one most likely to be in a screenshot. It is also sticky, so it is on screen during every screen share."
      },
      "auditable": false,
      "permissions": [
        "patient.read",
        "encounter.read"
      ],
      "terminology": [
        "FHIR",
        "SNOMED CT"
      ]
    },
    "variants": [
      {
        "id": "expanded",
        "label": "Expanded",
        "description": "Banner, encounter control, program and the safety strip.",
        "args": {
          "collapsed": false
        }
      },
      {
        "id": "collapsed",
        "label": "Collapsed",
        "description": "The 44px strip a clinician must not act without. Everything else is behind a disclosure, not gone.",
        "args": {
          "collapsed": true
        }
      }
    ],
    "controls": [
      {
        "prop": "surface",
        "control": "segmented",
        "label": "Surface",
        "options": [
          "overview",
          "orders",
          "results",
          "documentation"
        ],
        "defaultValue": "overview"
      },
      {
        "prop": "collapsed",
        "control": "switch",
        "label": "Collapsed",
        "defaultValue": false
      },
      {
        "prop": "onSelectEncounter",
        "control": "event",
        "label": "onSelectEncounter"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "1.3.1",
        "name": "Info and relationships",
        "status": "pass",
        "how": "The strip is a list with an accessible name, each fact is a list item, and the disclosure is a button with aria-expanded and aria-controls pointing at the region it governs.",
        "evidence": "chart-header.test.tsx"
      },
      {
        "wcag": "2.4.11",
        "name": "Focus not obscured (minimum)",
        "status": "pass",
        "how": "Content below the sticky header carries a scroll margin the height of the expanded bar, so a focused element is never rendered behind it.",
        "evidence": "chart-header.test.tsx"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "role=\"banner\" carrying the safety strip as its name; the encounter is a labelled select, or static text when the host supplies no handler rather than a disabled control.",
        "evidence": "chart-header.test.tsx"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "Every safety fact is a word before it is a tone, and the tone is a 3px bar rather than a fill. A test asserts the collapsed and expanded strips carry identical text — they differ in how they fit, never in what they say.",
        "evidence": "chart-header.test.tsx"
      },
      {
        "wcag": "4.1.3",
        "name": "Status messages",
        "status": "pass",
        "how": "The \"no encounter selected\" reason is role=\"status\", because it changes as encounters open and close and the difference decides what the clinician does next.",
        "evidence": "chart-header.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "The disclosure is a native button and the encounter is a native select. Nothing is a div with a click handler and nothing traps focus.",
        "evidence": "chart-header.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size (minimum)",
        "status": "pass",
        "how": "The toggle and the encounter select both carry a 28px minimum block size, above the 24px floor.",
        "evidence": "chart-header.test.tsx"
      },
      {
        "wcag": "1.4.10",
        "name": "Reflow",
        "status": "pass",
        "how": "Expanded, the strip wraps, so a patient with four alerts has none of them clipped. Collapsed, it scrolls behind a visible fade instead, because a second line there would move the content underneath at the moment the alerts are being read.",
        "evidence": "chart-header.test.tsx"
      }
    ],
    "examples": [
      {
        "id": "collapse",
        "title": "It collapses to the strip, not to the name",
        "description": "Forty-four pixels carrying allergies, code status, isolation, fall risk, legal status and alerts. The detail moves behind a disclosure rather than out of the DOM, so a screen-reader user is never worse off than a sighted one.",
        "fixture": "patientRoutine",
        "code": "const [collapsed, setCollapsed] = useState(false);\n\n<ChartHeader\n  patient={patient}\n  identifiers={[{ kind: \"mrn\" }, { kind: \"nhs\" }]}\n  collapsed={collapsed}\n  onCollapsedChange={setCollapsed}\n  safety={safety}\n/>"
      },
      {
        "id": "spcu",
        "title": "The sex parameter, with its context — and never the gender",
        "description": "On an order screen it is shown with what it applies to. On an overview screen it is not shown at all, because out of context it is a demographic wearing a clinical name. Where the surface calls for it and nothing is recorded, the header says so rather than leaving the space that invites somebody to reach for Patient.gender.",
        "fixture": "patientRoutine",
        "code": "resolveSpcu(patient, \"orders\");\n// → { value: \"female\", context: \"for medication dosing\", recorded: true }\n\nresolveSpcu(patient, \"overview\");\n// → null — not a demographic\n\nresolveSpcu({ extension: [] }, \"orders\");\n// → { recorded: false } — \"not recorded. Do not substitute the administrative gender.\""
      },
      {
        "id": "encounter",
        "title": "No encounter selected is a state, not a default",
        "description": "One open encounter is chosen, because there is nothing to choose between. Three open encounters are not, because a note filed into an encounter nobody read is the most common misfiling in the building — and a selection that no longer matches an open encounter reverts to none rather than sliding to the first.",
        "fixture": "encounterRoutine",
        "code": "resolveEncounterContext(three);\n// → { kind: \"none\", reason: \"3 encounters are open — choose one before documenting\" }\n\nresolveEncounterContext(three, \"enc-2\");\n// → { kind: \"selected\", encounter: … }\n\nresolveEncounterContext(three, \"enc-closed\");\n// → { kind: \"none\", reason: \"The selected encounter is no longer open\" }"
      },
      {
        "id": "absence",
        "title": "Two facts are always on the strip, recorded or not",
        "description": "Allergy status and code status appear whether or not the host supplied them, because their absence is the finding. Everything else appears only when it exists — an isolation chip on every chart in the hospital is noise, and noise here is what makes the two rows that matter invisible.",
        "fixture": "allergyHighRisk",
        "code": "safetyStrip({});\n// → [{ kind: \"allergy\",     label: \"Allergies not asked\",     tone: \"absent\" },\n//    { kind: \"code-status\", label: \"Code status not recorded\", tone: \"absent\" }]"
      }
    ],
    "fixtures": [
      "patientRoutine",
      "encounterRoutine",
      "allergyHighRisk"
    ],
    "seo": {
      "slug": "chart-header",
      "title": "Chart Header — React sticky patient header",
      "description": "A React chart header that collapses to a safety strip, makes the encounter an explicit control, and never renders administrative gender beside a dose.",
      "primaryKeyword": "react patient chart header",
      "secondaryKeywords": [
        "sticky patient banner react",
        "sex parameter for clinical use ui",
        "encounter context control",
        "clinical safety strip component"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "chart-review",
        "documentation",
        "patient-safety"
      ],
      "alternatives": [
        {
          "ref": "identity",
          "when": "the surface needs the safety banner without the workspace chrome"
        }
      ]
    }
  },
  {
    "name": "clinical-note",
    "title": "Clinical Note",
    "tier": "free",
    "status": "experimental",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A clinical note editor that records where every character came from, and refuses to let anyone sign what they have not read.",
    "tagline": "A note editor that records provenance and gates the signature.",
    "description": "LOINC-coded sections, per-range provenance across six origins, a composable sign gate with three severities, and deterministic FHIR, XHTML and plain-text output. The engine ships as an npm package with no DOM; this item is the Tailwind skin over it.",
    "rationale": "A rich text editor is a solved problem and competes with a hundred free ones. The parts that are hard are knowing which passages were copied forward from a note about a different admission, proving a clinician actually read the text a model drafted before signing it, and producing bytes that hash the same way twice so a signature over them means something. A 2022 analysis of over 100 million notes found 50.1% of note text duplicated from prior documentation on the same patient; copy-and-paste has been implicated in roughly a third of errors in ambulatory patient-safety analyses; and CMS's July 2025 signature guidance treats an AI scribe exactly as it treats a human one, which makes the review gate the only thing standing between a clinician and words they never read. Note bloat, copy-paste error and AI attribution are one missing data structure seen three times. This component stores it.",
    "categories": [
      "Clinical",
      "Documentation"
    ],
    "fhir": [
      {
        "name": "Composition",
        "url": "https://hl7.org/fhir/R4/composition.html"
      },
      {
        "name": "DocumentReference",
        "url": "https://hl7.org/fhir/R4/documentreference.html"
      },
      {
        "name": "Provenance",
        "url": "https://hl7.org/fhir/R4/provenance.html"
      },
      {
        "name": "Narrative",
        "url": "https://hl7.org/fhir/R4/narrative.html"
      }
    ],
    "resource": "Composition",
    "resourceUrl": "https://hl7.org/fhir/R4/composition.html",
    "states": [
      "Empty draft",
      "In progress",
      "Origins ribbon",
      "Unreviewed AI",
      "Copied forward",
      "Unfilled blanks",
      "Stale pulled value",
      "Gate blocking",
      "Gate clear",
      "Offline draft",
      "Save failed",
      "Signed",
      "Signed with addendum",
      "Awaiting countersignature"
    ],
    "props": [
      {
        "name": "author",
        "type": "NoteAuthor",
        "description": "Who is signing, and in what capacity.",
        "required": true
      },
      {
        "name": "canSign",
        "type": "boolean",
        "description": "Whether policy permits this author to sign at all. Separate from whether the findings currently allow it.",
        "required": true
      },
      {
        "name": "findings",
        "type": "readonly Finding[]",
        "description": "What is standing between this note and a signature, each with a severity. Rendered in full rather than summarised: \"3 issues\" tells an author to hunt, and the point of the gate is that it already knows.",
        "required": true
      },
      {
        "name": "attestation",
        "type": "string",
        "description": "The sentence being signed. Shown before the control, never after the decision.",
        "required": false
      },
      {
        "name": "onCancel",
        "type": "(() => void)",
        "description": "Fired when the author backs out of signing. The draft is untouched.",
        "required": false
      },
      {
        "name": "onNavigate",
        "type": "((finding: Finding) => void)",
        "description": "Fired when the author jumps to the passage a finding is about. Without it a finding names a problem and offers no way to reach it.",
        "required": false
      },
      {
        "name": "onSign",
        "type": "((acknowledged: string[]) => void)",
        "description": "Fired with the ids of every finding the author acknowledged on the way through. Acknowledgement is part of the record, not a dismissal.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "SignGate",
        "props": [
          {
            "name": "author",
            "type": "NoteAuthor",
            "description": "Who is signing, and in what capacity.",
            "required": true
          },
          {
            "name": "canSign",
            "type": "boolean",
            "description": "Whether policy permits this author to sign at all. Separate from whether the findings currently allow it.",
            "required": true
          },
          {
            "name": "findings",
            "type": "readonly Finding[]",
            "description": "What is standing between this note and a signature, each with a severity. Rendered in full rather than summarised: \"3 issues\" tells an author to hunt, and the point of the gate is that it already knows.",
            "required": true
          },
          {
            "name": "attestation",
            "type": "string",
            "description": "The sentence being signed. Shown before the control, never after the decision.",
            "required": false
          },
          {
            "name": "onCancel",
            "type": "(() => void)",
            "description": "Fired when the author backs out of signing. The draft is untouched.",
            "required": false
          },
          {
            "name": "onNavigate",
            "type": "((finding: Finding) => void)",
            "description": "Fired when the author jumps to the passage a finding is about. Without it a finding names a problem and offers no way to reach it.",
            "required": false
          },
          {
            "name": "onSign",
            "type": "((acknowledged: string[]) => void)",
            "description": "Fired with the ids of every finding the author acknowledged on the way through. Acknowledgement is part of the record, not a dismissal.",
            "required": false
          }
        ]
      },
      {
        "name": "ClinicalNoteReader",
        "props": [
          {
            "name": "doc",
            "type": "PMNode",
            "description": "The signed document. Read-only by construction — this component has no editing path at all.",
            "required": true
          },
          {
            "name": "subject",
            "type": "NoteSubject",
            "description": "Who the note is about. Rendered so a reader can check the chart before believing the note.",
            "required": true
          },
          {
            "name": "title",
            "type": "string",
            "description": "The note's heading, and the article's accessible name.",
            "required": true
          },
          {
            "name": "addenda",
            "type": "readonly Addendum[]",
            "description": "Addenda appended after signing. Never merged into the body: an addendum is a separate authored act, and folding it into the original text would rewrite what somebody signed.",
            "required": false,
            "default": "[]"
          },
          {
            "name": "attestations",
            "type": "readonly Attestation[]",
            "description": "Signatures on the note, in order. A countersignature is another attestation rather than a second copy of the first, so each carries its own signer, capacity and time.",
            "required": false,
            "default": "[]"
          }
        ]
      },
      {
        "name": "ClinicalNote",
        "props": [
          {
            "name": "author",
            "type": "NoteAuthor",
            "description": "Who is writing. Distinct from `recordedBy` on the signature: the person composing and the person attesting are not always the same.",
            "required": true
          },
          {
            "name": "noteType",
            "type": "NoteTypeDef | 'progress' | 'historyAndPhysical' | 'consultation' | 'dischargeSummary'",
            "description": "Decides which sections exist and which of them block a signature.",
            "required": true
          },
          {
            "name": "now",
            "type": "Date",
            "description": "The instant the gate is evaluated against, from the host's clock. Required, and there is no default. A browser clock on a ward workstation is not evidence, and 42 CFR 482.24(c)(1) wants entries dated, timed and authenticated. Passing `new Date()` is a decision the host makes, not one this component makes silently on their behalf.",
            "required": true
          },
          {
            "name": "subject",
            "type": "NoteSubject",
            "description": "Who the note is about. Never optional — it is the wrong-patient mitigation.",
            "required": true
          },
          {
            "name": "attestation",
            "type": "string",
            "description": "The attestation sentence. Wording is a legal and organisational decision.",
            "required": false
          },
          {
            "name": "editorLabel",
            "type": "string",
            "description": "Accessible name for the editable region. Defaults to \"Note body\". User-visible text, so it is a prop: a deployment in another language needs to be able to change it.",
            "required": false,
            "default": "\"Note body\""
          },
          {
            "name": "gateOptions",
            "type": "Partial<Omit<GateContext, 'now' | 'noteType' | 'subject'>>",
            "description": "Overrides for the default gate context — thresholds, mostly.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((doc: PMNode) => void)",
            "description": "Fired as the note is edited, with the origin of the edit preserved.",
            "required": false
          },
          {
            "name": "onCommit",
            "type": "((kind: CommitKind, doc: PMNode, acknowledged: string[]) => void)",
            "description": "Fired for each of the three commits. Three verbs with three legal meanings, never one blue Save: `draft` is reversible, `sign` is not, and `addend` is the only legal operation on a note that has already been signed.",
            "required": false
          },
          {
            "name": "phrases",
            "type": "readonly Phrase[]",
            "description": "Dot phrases. None ship in the package; a phrase library is yours.",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean",
            "description": "Renders the signed reader instead of the editor.",
            "required": false,
            "default": "false"
          },
          {
            "name": "rules",
            "type": "readonly GateRule[]",
            "description": "Extra gate rules, appended to the defaults.",
            "required": false
          },
          {
            "name": "saveState",
            "type": "SaveState",
            "description": "Draft state, shown in the status strip. Never a silent spinner.",
            "required": false
          },
          {
            "name": "timestampLine",
            "type": "string",
            "description": "Absolute, with offset — the created/edited line under the document.",
            "required": false
          },
          {
            "name": "value",
            "type": "PMNode",
            "description": "The document. Defaults to an empty note of `noteType`.",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"onChange\">"
      }
    ],
    "usage": "import { ClinicalNote } from \"@/components/zoblocks/clinical-note\";\n\n// The minimum. `now` has no default on purpose — the host owns the clock.\n<ClinicalNote\n  noteType=\"progress\"\n  subject={{\n    reference: \"Patient/4471902\",\n    display: \"RANDOL, Joshua\",\n    identifier: \"4471902\",\n    birthDate: \"12 Mar 1996\",\n    detail: \"30y M · Bed 4E-12\",\n  }}\n  author={{ display: \"R. Menon, MD\", role: \"Resident\", requiresCosign: true }}\n  now={await serverTime()}\n  onCommit={(kind, doc, acknowledgedWarnings) => save(kind, doc, acknowledgedWarnings)}\n/>\n\n// Reading a signed note loads no editor at all.\n<ClinicalNote.Reader\n  subject={subject}\n  title=\"Progress note\"\n  doc={signedDoc}\n  attestations={[{ who: \"R. Menon, MD\", when: \"16 Aug 2026, 14:41 IST (UTC+05:30)\" }]}\n  addenda={[{ author: \"A. Iyer, MD\", when: \"19 Aug 2026, 09:14 IST\", text: \"…\" }]}\n/>",
    "guidance": {
      "use": [
        "Clinician-facing documentation where the note is the legal record — progress notes, H&Ps, consultations, discharge summaries. The gate and the addendum model are what make it a record rather than a document.",
        "Anywhere an ambient scribe or a drafting model writes into the note. Generated text arrives marked unreviewed and cannot be signed in that state, which is the only mechanical protection the signer has.",
        "Teaching settings with a resident-and-attending countersignature, where two signatures with two times and two authors have to survive into the export.",
        "Deployments that need to measure copy-forward rather than estimate it. The ratio is computed from the marks and can be recorded on the signature."
      ],
      "avoid": [
        "Patient-facing note composition. The gate's language, the do-not-use lint and the section model all assume a clinical author; a patient-authored narrative is a different surface with different rules.",
        "Anything that must round-trip provenance through a third-party FHIR server. Per-range authorship is a custom extension and a conforming server may drop it — verify with the actual endpoint before promising the feature.",
        "Free-form documents that are not clinical notes. The schema refuses prose outside a coded section, which is the point here and an obstruction anywhere else.",
        "Signing workflows where the browser clock is the only clock. `now` is required precisely so that a deployment cannot accidentally attest to a time nobody can defend."
      ]
    },
    "accessibility": [
      {
        "label": "The toolbar is one tab stop, not fifteen",
        "detail": "role=toolbar with a roving tabindex: one Tab in, arrow keys within, one Tab out. Without it there are fifteen Tab presses between the document and the sign button, every time, for anyone who does not use a mouse."
      },
      {
        "label": "Provenance is never colour alone",
        "detail": "Each of the six origins carries a hue and a distinct underline style — wavy for dictated, dashed for template, dotted for pulled, solid for copied, double for AI. Under forced-colors the tints are dropped and the underline styles carry the whole distinction, which is also what survives a monochrome print."
      },
      {
        "label": "The blocked sign button says why",
        "detail": "aria-describedby points at a live count of what is blocking. A disabled control with no stated reason is the most common way a gate gets routed around."
      },
      {
        "label": "Save state reaches assistive technology",
        "detail": "The status strip is a live region: polite for ordinary transitions, assertive for a failed save. A silent spinner is a status change nobody hears, and an unheard save failure is lost work."
      },
      {
        "label": "Sections are real landmarks",
        "detail": "The rail is a nav with aria-current on the section holding the caret, and each section is a schema node rather than a bold paragraph — which is what makes both heading navigation and the required-section check possible at all."
      },
      {
        "label": "Formatting is semantic",
        "detail": "Bold and italic render as strong and em, not styled spans, so a screen reader can convey emphasis. Underline and strikethrough are deliberately absent: underline reads as a link, and strikethrough is silently dropped by some renderers, which applied to a retraction is a safety defect."
      }
    ],
    "limitations": [
      "No phrase library, terminology or attestation wording ships here. Those are jurisdictional, organisational and licensing decisions; the component provides the seams.",
      "Per-range provenance is not standardised anywhere in FHIR. It travels as a custom Zoblocks extension that a conforming server may legitimately ignore or strip.",
      "There is no clock. `now` is a required prop, because a browser clock on a ward workstation is not evidence.",
      "No speech recognizer, no collaboration server, no crypto. The component defines the channel, the integration and the seam; the implementations are the deployment's.",
      "The LOINC section codes match published display names but must be confirmed — with their C-CDA cardinality — against the implementation guide a deployment conforms to.",
      "Real-time collaboration, tables, live data islands and ink annotation are designed but not built. See the brief."
    ],
    "related": [
      "copilot",
      "switch",
      "care-timeline",
      "signature",
      "date-picker",
      "recorder"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge",
      "@zoblocks/clinical-note-core",
      "prosemirror-view",
      "prosemirror-state",
      "prosemirror-model",
      "prosemirror-keymap",
      "prosemirror-history",
      "prosemirror-commands"
    ],
    "install": "npx @zoblocks/cli add clinical-note"
  },
  {
    "name": "clinical-status",
    "title": "Clinical Status",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "primitive",
    "distribution": "registry",
    "summary": "One closed status vocabulary: nine scales whose every step carries a hue, a CSS shape and a word, emitted together or not at all.",
    "tagline": "Nine status scales. Hue, shape and word, or nothing.",
    "description": "A chip, a dot, or a grid affix — three presentations of one datum, drawn from nine fixed scales with no free-text status. Each step pairs a tone with a CSS-drawn glyph and a word in both a clinician and a patient register, so the state survives greyscale, Windows high-contrast and monochrome print.",
    "rationale": "Every healthcare product invents its own status colours, six times, in six teams, and the results disagree: amber means pending in the lab module and abnormal in the vitals module, so a clinician who learns one is actively misled by the other. The usual response is a nicer palette, which changes nothing, because the encoding is still colour plus a word in a colour-matched hue — and that collapses in forced-colors, in monochrome print, and for the roughly 8% of male clinicians with a red-green deficiency. The fix is a closed vocabulary. A step exists in it or it cannot be rendered at all, and every step carries three channels chosen together. The shape is not decoration and not an icon: it is a second channel carrying the same bit, drawn in currentColor from CSS geometry so it costs no network request and survives the theme being stripped entirely.",
    "categories": [
      "Clinical",
      "Primitives"
    ],
    "fhir": [
      {
        "name": "Observation",
        "url": "https://hl7.org/fhir/R4/observation.html",
        "note": "status and interpretation map onto the result-status and criticality scales, one adapter each."
      },
      {
        "name": "AllergyIntolerance",
        "url": "https://hl7.org/fhir/R4/allergyintolerance.html",
        "note": "criticality maps onto the criticality scale — high becomes critical, because the FHIR word understates it."
      },
      {
        "name": "Consent",
        "url": "https://hl7.org/fhir/R4/consent.html",
        "note": "provision.type plus security labels map onto the access scale, with 42 CFR Part 2 as its own step."
      }
    ],
    "resource": "Observation",
    "resourceUrl": "https://hl7.org/fhir/R4/observation.html",
    "states": [
      "Critical — the panic value",
      "High — outside the range, not dangerous",
      "Normal",
      "Not assessed — absence as a fact",
      "Preliminary — in flight",
      "Corrected — the value changed",
      "Entered in error",
      "Restricted — present, gated, explained",
      "Part 2 segmented",
      "Break-glass open",
      "Stale — true once",
      "Self-reported",
      "AI draft, awaiting a clinician",
      "Disengaged — behavioral health",
      "Dot, in a status column",
      "Grid affix, at forty rows",
      "Compact density",
      "Explainable — the chip is a button"
    ],
    "props": [
      {
        "name": "scale",
        "type": "'encounter' | 'access' | 'criticality' | 'result-status' | 'data-quality' | 'ai-verification' | 'engagement' | 'urgency' | 'risk'",
        "description": "Which vocabulary. Required — there is no default scale.",
        "required": true
      },
      {
        "name": "step",
        "type": "string",
        "description": "A step id of that scale. Anything else throws rather than degrading.",
        "required": true
      },
      {
        "name": "audience",
        "type": "StatusAudience",
        "description": "Which register the word is written in.",
        "required": false,
        "default": "\"clinician\""
      },
      {
        "name": "density",
        "type": "StatusDensity",
        "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
        "required": false,
        "default": "\"default\""
      },
      {
        "name": "onExplain",
        "type": "((step: StatusStep, scale: ScaleName) => void)",
        "description": "Opens the definition of the step. When given, the chip becomes a real button. The meaning of \"preliminary\" is not obvious and guessing it is a clinical act, so the affordance is worth having — but only when there is something behind it, which is why it is opt-in rather than always focusable.",
        "required": false
      },
      {
        "name": "qualifier",
        "type": "string",
        "description": "Extra clause for the accessible name — \"resulted 41 minutes ago\", \"2 no-shows\". Goes into the name, not beside it, so a screen-reader user gets one sentence rather than two fragments with a pause between them.",
        "required": false
      },
      {
        "name": "shape",
        "type": "StatusShape",
        "description": "How it presents. `chip` carries all three channels and is the default; `dot` drops the visible word and is only safe in a column that is entirely status; `affix` is a 3px row rule for grids past about forty rows.",
        "required": false,
        "default": "\"chip\""
      }
    ],
    "extendsType": "Omit< React.HTMLAttributes<HTMLElement>, \"children\" | \"onClick\" >",
    "exports": [
      {
        "name": "ClinicalStatus",
        "props": [
          {
            "name": "scale",
            "type": "'encounter' | 'access' | 'criticality' | 'result-status' | 'data-quality' | 'ai-verification' | 'engagement' | 'urgency' | 'risk'",
            "description": "Which vocabulary. Required — there is no default scale.",
            "required": true
          },
          {
            "name": "step",
            "type": "string",
            "description": "A step id of that scale. Anything else throws rather than degrading.",
            "required": true
          },
          {
            "name": "audience",
            "type": "StatusAudience",
            "description": "Which register the word is written in.",
            "required": false,
            "default": "\"clinician\""
          },
          {
            "name": "density",
            "type": "StatusDensity",
            "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
            "required": false,
            "default": "\"default\""
          },
          {
            "name": "onExplain",
            "type": "((step: StatusStep, scale: ScaleName) => void)",
            "description": "Opens the definition of the step. When given, the chip becomes a real button. The meaning of \"preliminary\" is not obvious and guessing it is a clinical act, so the affordance is worth having — but only when there is something behind it, which is why it is opt-in rather than always focusable.",
            "required": false
          },
          {
            "name": "qualifier",
            "type": "string",
            "description": "Extra clause for the accessible name — \"resulted 41 minutes ago\", \"2 no-shows\". Goes into the name, not beside it, so a screen-reader user gets one sentence rather than two fragments with a pause between them.",
            "required": false
          },
          {
            "name": "shape",
            "type": "StatusShape",
            "description": "How it presents. `chip` carries all three channels and is the default; `dot` drops the visible word and is only safe in a column that is entirely status; `affix` is a 3px row rule for grids past about forty rows.",
            "required": false,
            "default": "\"chip\""
          }
        ],
        "extendsType": "Omit< React.HTMLAttributes<HTMLElement>, \"children\" | \"onClick\" >"
      },
      {
        "name": "StatusLegend",
        "props": [
          {
            "name": "scale",
            "type": "'encounter' | 'access' | 'criticality' | 'result-status' | 'data-quality' | 'ai-verification' | 'engagement' | 'urgency' | 'risk'",
            "description": "",
            "required": true
          },
          {
            "name": "audience",
            "type": "StatusAudience",
            "description": "",
            "required": false,
            "default": "\"clinician\""
          },
          {
            "name": "density",
            "type": "StatusDensity",
            "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
            "required": false,
            "default": "\"default\""
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDListElement>"
      }
    ],
    "usage": "import { ClinicalStatus } from \"@/components/zoblocks/clinical-status\";\nimport \"@/styles/zoblocks-clinical-status.css\";\n\n<ClinicalStatus scale=\"criticality\" step=\"critical\" />\n<ClinicalStatus scale=\"access\" step=\"part-2\" />\n<ClinicalStatus scale=\"result-status\" step=\"preliminary\" shape=\"affix\" />",
    "guidance": {
      "use": [
        "Anywhere a record carries a state a clinician acts on — result criticality, order lifecycle, access class, engagement, AI verification.",
        "In a grid past about forty rows, with shape=\"affix\", so the column is a set of rules rather than a field of coloured pills.",
        "With onExplain wherever the step's meaning is not obvious to every reader of the screen. Guessing what \"preliminary\" means is a clinical act.",
        "With audience=\"patient\" on any portal surface, so \"Entered in error\" reaches the person it is about as \"Recorded by mistake\"."
      ],
      "avoid": [
        "As a general-purpose badge. It is a clinical vocabulary, and diluting it with product statuses is how the vocabulary stops being trustworthy.",
        "With shape=\"dot\" outside a column that is entirely status and carries a legend.",
        "To convey a state the scales do not contain. Extend the vocabulary instead — a free-text escape hatch would return the library to the problem it was built to solve."
      ]
    },
    "accessibility": [
      {
        "label": "Colour is never the signal",
        "detail": "Every step emits a hue, a CSS-drawn shape and a word together. Remove the hue — greyscale, monochrome print, a red-green deficiency — and the shape and the word both survive. This is the component's entire reason to exist, not a mitigation applied afterwards."
      },
      {
        "label": "The glyph survives forced-colors",
        "detail": "Windows high-contrast strips backgrounds and custom colours. The glyphs are geometry drawn in currentColor rather than an icon font or an SVG sprite, so they inherit the system colour and remain the channel that carries the state when the chip's own palette is gone."
      },
      {
        "label": "The name is qualified by its scale",
        "detail": "The accessible name is \"Criticality: Critical\", not \"Critical\". A chip in a table cell has no column header in its accessible context, and the bare word has been read out beside a medication, a lab value and an appointment on the same screen — meaning something different each time."
      },
      {
        "label": "Interactive only when there is something to open",
        "detail": "Without onExplain the chip is a labelled image with no tab stop. A focusable element with no action is a keyboard trap with extra steps, and a status chip is the most-repeated element on a chart."
      },
      {
        "label": "The word never disappears",
        "detail": "Below 360px the chip abbreviates rather than dropping to the glyph alone, and the full word stays in the accessible name. Glyph-alone requires a legend the reader does not have."
      }
    ],
    "limitations": [
      "The vocabulary is closed by design. A host that needs a step outside the nine scales must extend the vocabulary rather than pass free text, and that is a pull request rather than a prop.",
      "The dot presentation carries one visible channel and is only safe in a column that is entirely status, beside a legend. Nothing in the component can enforce that.",
      "No terminology service. The words here are English clinician and patient phrasings; a deployment needing another language supplies them through @zoblocks/intl."
    ],
    "related": [
      "chart-accordion",
      "switch",
      "result-value",
      "allergy-chip",
      "risk-indicator",
      "provenance-chip",
      "trend-indicator",
      "care-team-presence",
      "data-grid"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add clinical-status",
    "technicalName": "ClinicalStatus",
    "aliases": [
      "status badge",
      "status chip",
      "clinical badge",
      "severity indicator",
      "result status"
    ],
    "tags": [
      "data-display",
      "themeable",
      "print-safe",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Let the scale carry the qualification. \"Criticality: Critical\" reads correctly in a table cell; \"Critical\" does not.",
        "Keep one scale per column. Mixing criticality and result-status in one column makes the shapes ambiguous again.",
        "Pass the qualifier prop for time or count context rather than rendering a second element beside the chip."
      ],
      "dont": [
        "Do not restyle the tones per surface. The point of the vocabulary is that amber means the same thing in every module.",
        "Do not use the affix shape outside a grid — the 3px rule reads as a row marker, and floating in prose it reads as a rendering artefact.",
        "Do not add an icon beside the chip. The glyph is already the second channel, and a third competes with it."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "The status vocabulary the rest of the library reads from. Nine scales cover result criticality, result lifecycle, data quality, access class, AI verification, engagement, encounter state, urgency and screener-derived risk — the last two of which no generic component library models at all.",
      "workflows": [
        "assessment",
        "documentation",
        "care-coordination",
        "medication"
      ],
      "phi": {
        "handles": false,
        "notes": "Renders a state, never an identifier or a value. The access scale describes how protected a record is without disclosing any of it, which is what lets a Part 2 chip appear on a screen the reader is not cleared for."
      },
      "auditable": false,
      "permissions": [],
      "terminology": [
        "FHIR",
        "SNOMED CT",
        "LOINC"
      ]
    },
    "variants": [
      {
        "id": "chip",
        "label": "Chip",
        "description": "All three channels. The default, and the only presentation safe without a legend.",
        "args": {
          "shape": "chip"
        }
      },
      {
        "id": "dot",
        "label": "Dot",
        "description": "The glyph alone, word in the accessible name. For a column that is entirely status.",
        "args": {
          "shape": "dot"
        }
      },
      {
        "id": "affix",
        "label": "Grid affix",
        "description": "A 3px leading rule and a short word, for grids past about forty rows.",
        "args": {
          "shape": "affix"
        }
      },
      {
        "id": "compact",
        "label": "Compact",
        "description": "22px rather than 26px. Density changes the chip; the hit area holds at 24px.",
        "args": {
          "density": "compact"
        }
      },
      {
        "id": "patient",
        "label": "Patient register",
        "description": "The same step, in the words the person it is about would use.",
        "args": {
          "audience": "patient"
        }
      }
    ],
    "controls": [
      {
        "prop": "scale",
        "control": "select",
        "label": "Scale",
        "options": [
          "criticality",
          "result-status",
          "data-quality",
          "access",
          "ai-verification",
          "engagement",
          "encounter",
          "urgency",
          "risk"
        ],
        "defaultValue": "criticality"
      },
      {
        "prop": "step",
        "control": "text",
        "label": "Step",
        "defaultValue": "critical"
      },
      {
        "prop": "shape",
        "control": "segmented",
        "label": "Shape",
        "options": [
          "chip",
          "dot",
          "affix"
        ],
        "defaultValue": "chip"
      },
      {
        "prop": "density",
        "control": "segmented",
        "label": "Density",
        "options": [
          "compact",
          "default"
        ],
        "defaultValue": "default"
      },
      {
        "prop": "audience",
        "control": "segmented",
        "label": "Register",
        "options": [
          "clinician",
          "patient"
        ],
        "defaultValue": "clinician"
      },
      {
        "prop": "qualifier",
        "control": "text",
        "label": "Qualifier"
      },
      {
        "prop": "onExplain",
        "control": "event",
        "label": "onExplain"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "Every step emits a hue, a CSS shape and a word. A test asserts each of the thirty-nine steps renders a glyph and a word, so a step cannot be added with colour alone.",
        "evidence": "clinical-status.test.tsx"
      },
      {
        "wcag": "1.4.11",
        "name": "Non-text contrast",
        "status": "pass",
        "how": "All seven tones are gated at 3:1 for the glyph and 4.5:1 for the text across three themes in the token build.",
        "evidence": "contrast.gate"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "role=\"img\" with a composed label when static, a real button when onExplain is given. Never a focusable span with no action.",
        "evidence": "clinical-status.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "The explain affordance is a native button, reached and activated by keyboard with no handler of the component's own.",
        "evidence": "clinical-status.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size",
        "status": "pass",
        "how": "The interactive chip holds a 24px minimum at both densities; compact changes the chip, not the target.",
        "evidence": "clinical-status.test.tsx"
      },
      {
        "wcag": "1.4.4",
        "name": "Resize text",
        "status": "pass",
        "how": "Every dimension is in rem and the glyph scales with the chip, so the shape survives a 200% zoom rather than clipping.",
        "evidence": "clinical-status.test.tsx"
      },
      {
        "wcag": "1.4.12",
        "name": "Text spacing",
        "status": "pass",
        "how": "The chip is inline-flex with no fixed height on the text, so the increased line-height and letter-spacing of a user stylesheet grow it rather than overflow it.",
        "evidence": "clinical-status.test.tsx"
      },
      {
        "wcag": "2.2.1",
        "name": "Timing adjustable",
        "status": "not-applicable",
        "how": "The component has no timing of any kind."
      }
    ],
    "examples": [
      {
        "id": "criticality-from-fhir",
        "title": "Criticality, mapped rather than guessed",
        "description": "The interpretation code decides the step. HH and LL are the panic values and the only ones that reach critical; H and L are simply outside the range, and conflating the two is how an alert list becomes noise nobody reads.",
        "fixture": "observationPotassiumCritical",
        "code": "import { ClinicalStatus, fromInterpretation } from \"@/components/zoblocks/clinical-status\";\nimport { observationPotassiumCritical } from \"@zoblocks/fixtures\";\n\nconst code = observationPotassiumCritical.interpretation?.[0]?.coding?.[0]?.code;\nconst step = fromInterpretation(code);\n\n// null rather than a guess when the code is unrecognised: a visible gap beats\n// a plausible lie.\n{step && <ClinicalStatus scale=\"criticality\" step={step} qualifier=\"resulted 41 minutes ago\" />}"
      },
      {
        "id": "restricted-is-not-absent",
        "title": "Restricted is a state, not a gap",
        "description": "Part 2 is its own step rather than a flavour of restricted, because 42 CFR Part 2 is a different legal regime from HIPAA minimum-necessary with a different re-disclosure rule. Rendering them the same teaches staff that they are the same.",
        "fixture": "patientRestricted",
        "code": "<ClinicalStatus scale=\"access\" step=\"part-2\" />\n\n// The chip describes how protected a record is without disclosing any of it,\n// which is what lets it appear on a screen the reader is not cleared for."
      },
      {
        "id": "grid-affix",
        "title": "Forty rows, and no field of pills",
        "description": "At forty rows, forty chips is a colour field with a table behind it. The affix keeps the tone as a 3px rule at the row's leading edge and the meaning as a short word, and the row stays readable.",
        "fixture": "observationPreliminary",
        "code": "<td>\n  <ClinicalStatus\n    scale=\"result-status\"\n    step=\"preliminary\"\n    shape=\"affix\"\n    density=\"compact\"\n  />\n</td>"
      },
      {
        "id": "patient-register",
        "title": "The same step, in the other register",
        "description": "\"Entered in error\" is an internal state. A portal that ships it has not translated anything — it has published a system word to the person the record is about.",
        "fixture": "observationCorrected",
        "code": "<ClinicalStatus scale=\"result-status\" step=\"entered-in-error\" audience=\"patient\" />\n// renders \"Recorded by mistake\""
      }
    ],
    "fixtures": [
      "observationPotassiumCritical",
      "observationPreliminary",
      "observationCorrected",
      "patientRestricted",
      "allergyHighRisk"
    ],
    "seo": {
      "slug": "clinical-status",
      "title": "Clinical Status — accessible React status chip",
      "description": "A React status chip with nine fixed clinical scales. Every step carries a colour, a shape and a word, so it survives greyscale and high contrast.",
      "primaryKeyword": "react clinical status component",
      "secondaryKeywords": [
        "healthcare status badge react",
        "accessible status chip",
        "fhir observation status react",
        "colour blind safe status indicator"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [
        "allergy-chip",
        "result-value",
        "risk-indicator"
      ],
      "patterns": [
        "clinical-documentation",
        "results-review"
      ],
      "alternatives": [
        {
          "ref": "switch",
          "when": "the state is something the reader may change rather than something the record reports"
        }
      ]
    }
  },
  {
    "name": "copilot",
    "title": "Copilot",
    "tier": "free",
    "status": "experimental",
    "since": "0.3.0",
    "layer": "pattern",
    "distribution": "registry",
    "frameworks": {
      "antd": {
        "policy": "neutral",
        "bridge": false,
        "divergences": []
      }
    },
    "summary": "A floating clinical copilot: a dock above the chart that takes a question and opens into a sourced, auditable thread.",
    "tagline": "A chart dock that answers with sources and an audit trail.",
    "description": "Model-agnostic clinical assistant with mode-level scope contracts, inline source attribution, a deterministic crisis interrupt, and FHIR audit output. The engine and the accessibility behaviour ship as npm packages; this item is the Tailwind skin over them.",
    "rationale": "The floating dock and the streaming text are two weeks of work and compete with a hundred free widgets. The parts that are hard are deciding what the model may see, proving where an answer came from, keeping chart text from being read as instructions, and knowing whether the thing makes clinicians better or worse. Those are what a digital-health team cannot build in a sprint, and they are what this component is. The design target is not a better answer — it is verification that costs less than acceptance, because automation bias is an effort asymmetry rather than a character flaw, and incorrect decision support has been measured making clinicians worse than no decision support at all.",
    "categories": [
      "Patterns",
      "AI"
    ],
    "fhir": [
      {
        "name": "AuditEvent",
        "url": "https://hl7.org/fhir/R4/auditevent.html"
      },
      {
        "name": "Provenance",
        "url": "https://hl7.org/fhir/R4/provenance.html"
      },
      {
        "name": "QuestionnaireResponse",
        "url": "https://hl7.org/fhir/R4/questionnaireresponse.html"
      }
    ],
    "resource": "AuditEvent",
    "resourceUrl": "https://hl7.org/fhir/R4/auditevent.html",
    "states": [
      "Rest",
      "Mode tray",
      "Shortcuts",
      "Dictating",
      "Streaming",
      "Grounded answer",
      "General-knowledge answer",
      "Sources open",
      "Refused",
      "Crisis",
      "Error",
      "Suppressed"
    ],
    "props": [
      {
        "name": "modes",
        "type": "readonly CopilotMode[]",
        "description": "The scope contracts. Each declares what it may read, what tools it may call, what it may output and what risk it carries — enforced in code rather than described in a prompt.",
        "required": true
      },
      {
        "name": "provider",
        "type": "CopilotProvider",
        "description": "Where answers come from. Targets your endpoint, never a model vendor — there is no `apiKey` prop and no way to add one.",
        "required": true
      },
      {
        "name": "actor",
        "type": "Actor",
        "description": "Who is asking, and in what role. Decides what `context` resolves and is stamped on every audit event.",
        "required": false
      },
      {
        "name": "anchor",
        "type": "'inline' | 'bottom-center' | 'bottom-right'",
        "description": "Where the dock sits. `inline` renders it in flow for a surface that has its own layout.",
        "required": false,
        "default": "\"bottom-center\""
      },
      {
        "name": "announcementMode",
        "type": "AnnouncementMode",
        "description": "How streamed answers reach assistive technology. Token-by-token is unreadable, so the default announces at sentence boundaries.",
        "required": false
      },
      {
        "name": "classifiers",
        "type": "SafetyClassifiers",
        "description": "Safety checks run over the reader's question and the model's answer before either is shown. Crisis detection routes to `crisisLines` rather than to a model.",
        "required": false
      },
      {
        "name": "className",
        "type": "string",
        "description": "Applied to the dock's outer element.",
        "required": false
      },
      {
        "name": "context",
        "type": "CopilotContextResolver",
        "description": "Resolves what the copilot may see for this reader and this patient, returning a redacted view — so a mode cannot widen its own scope.",
        "required": false
      },
      {
        "name": "crisisLines",
        "type": "Readonly<Record<string, readonly CrisisLine[]>>",
        "description": "Crisis resources by region. Rendered directly and never generated, because a hallucinated helpline number is the worst output this component could produce.",
        "required": false
      },
      {
        "name": "initialModeId",
        "type": "string",
        "description": "Which mode opens first. Defaults to the first in `modes`.",
        "required": false
      },
      {
        "name": "locale",
        "type": "string",
        "description": "BCP 47 tag for generated strings and crisis-line selection.",
        "required": false
      },
      {
        "name": "newId",
        "type": "(() => string)",
        "description": "Injected for tests, so ids are deterministic in snapshots. Defaults to a real generator.",
        "required": false
      },
      {
        "name": "now",
        "type": "(() => string)",
        "description": "Injected for tests. Defaults to real implementations.",
        "required": false
      },
      {
        "name": "onAudit",
        "type": "AuditSink",
        "description": "Every question, answer, citation, refusal and escalation as a FHIR AuditEvent. This is the record that makes the feature defensible; without it the host has an unlogged clinical assistant.",
        "required": false
      },
      {
        "name": "onInsert",
        "type": "((text: string) => void)",
        "description": "Called when the reader chooses to put an answer into the note they are writing. Receives text; the host owns where it lands and what provenance it carries.",
        "required": false
      },
      {
        "name": "onRiskProtocol",
        "type": "(() => void)",
        "description": "Called when a safety classifier escalates. The host runs its own protocol — this component never decides what happens next in a crisis.",
        "required": false
      },
      {
        "name": "onTelemetry",
        "type": "TelemetrySink",
        "description": "Latency, token counts and refusal reasons, for operating the thing. Deliberately separate from `onAudit`, which is the clinical record.",
        "required": false
      },
      {
        "name": "role",
        "type": "string",
        "description": "ARIA role for the dock. Defaults to `complementary`, so the copilot is findable and skippable rather than an unnamed div.",
        "required": false
      },
      {
        "name": "shortcuts",
        "type": "readonly CopilotShortcut[]",
        "description": "Prompts offered before the reader types. They are starting points, not commands — each still runs through its mode's contract.",
        "required": false,
        "default": "[]"
      },
      {
        "name": "subject",
        "type": "Reference",
        "description": "The patient this session is about, as a FHIR reference. Stamped on every audit event; a question asked with no subject is not attributable to a chart.",
        "required": false
      },
      {
        "name": "suppressed",
        "type": "boolean",
        "description": "Law 5, and the FDA's time-critical clause in criterion 4. When true the hook refuses to submit and the skin renders nothing at all.",
        "required": false
      },
      {
        "name": "surface",
        "type": "'patient' | 'clinician'",
        "description": "Which surface this is. `patient` throws for every built-in mode.",
        "required": false
      }
    ],
    "extendsType": "UseCopilotOptions",
    "exports": [
      {
        "name": "Copilot",
        "props": [
          {
            "name": "modes",
            "type": "readonly CopilotMode[]",
            "description": "The scope contracts. Each declares what it may read, what tools it may call, what it may output and what risk it carries — enforced in code rather than described in a prompt.",
            "required": true
          },
          {
            "name": "provider",
            "type": "CopilotProvider",
            "description": "Where answers come from. Targets your endpoint, never a model vendor — there is no `apiKey` prop and no way to add one.",
            "required": true
          },
          {
            "name": "actor",
            "type": "Actor",
            "description": "Who is asking, and in what role. Decides what `context` resolves and is stamped on every audit event.",
            "required": false
          },
          {
            "name": "anchor",
            "type": "'inline' | 'bottom-center' | 'bottom-right'",
            "description": "Where the dock sits. `inline` renders it in flow for a surface that has its own layout.",
            "required": false,
            "default": "\"bottom-center\""
          },
          {
            "name": "announcementMode",
            "type": "AnnouncementMode",
            "description": "How streamed answers reach assistive technology. Token-by-token is unreadable, so the default announces at sentence boundaries.",
            "required": false
          },
          {
            "name": "classifiers",
            "type": "SafetyClassifiers",
            "description": "Safety checks run over the reader's question and the model's answer before either is shown. Crisis detection routes to `crisisLines` rather than to a model.",
            "required": false
          },
          {
            "name": "className",
            "type": "string",
            "description": "Applied to the dock's outer element.",
            "required": false
          },
          {
            "name": "context",
            "type": "CopilotContextResolver",
            "description": "Resolves what the copilot may see for this reader and this patient, returning a redacted view — so a mode cannot widen its own scope.",
            "required": false
          },
          {
            "name": "crisisLines",
            "type": "Readonly<Record<string, readonly CrisisLine[]>>",
            "description": "Crisis resources by region. Rendered directly and never generated, because a hallucinated helpline number is the worst output this component could produce.",
            "required": false
          },
          {
            "name": "initialModeId",
            "type": "string",
            "description": "Which mode opens first. Defaults to the first in `modes`.",
            "required": false
          },
          {
            "name": "locale",
            "type": "string",
            "description": "BCP 47 tag for generated strings and crisis-line selection.",
            "required": false
          },
          {
            "name": "newId",
            "type": "(() => string)",
            "description": "Injected for tests, so ids are deterministic in snapshots. Defaults to a real generator.",
            "required": false
          },
          {
            "name": "now",
            "type": "(() => string)",
            "description": "Injected for tests. Defaults to real implementations.",
            "required": false
          },
          {
            "name": "onAudit",
            "type": "AuditSink",
            "description": "Every question, answer, citation, refusal and escalation as a FHIR AuditEvent. This is the record that makes the feature defensible; without it the host has an unlogged clinical assistant.",
            "required": false
          },
          {
            "name": "onInsert",
            "type": "((text: string) => void)",
            "description": "Called when the reader chooses to put an answer into the note they are writing. Receives text; the host owns where it lands and what provenance it carries.",
            "required": false
          },
          {
            "name": "onRiskProtocol",
            "type": "(() => void)",
            "description": "Called when a safety classifier escalates. The host runs its own protocol — this component never decides what happens next in a crisis.",
            "required": false
          },
          {
            "name": "onTelemetry",
            "type": "TelemetrySink",
            "description": "Latency, token counts and refusal reasons, for operating the thing. Deliberately separate from `onAudit`, which is the clinical record.",
            "required": false
          },
          {
            "name": "role",
            "type": "string",
            "description": "ARIA role for the dock. Defaults to `complementary`, so the copilot is findable and skippable rather than an unnamed div.",
            "required": false
          },
          {
            "name": "shortcuts",
            "type": "readonly CopilotShortcut[]",
            "description": "Prompts offered before the reader types. They are starting points, not commands — each still runs through its mode's contract.",
            "required": false,
            "default": "[]"
          },
          {
            "name": "subject",
            "type": "Reference",
            "description": "The patient this session is about, as a FHIR reference. Stamped on every audit event; a question asked with no subject is not attributable to a chart.",
            "required": false
          },
          {
            "name": "suppressed",
            "type": "boolean",
            "description": "Law 5, and the FDA's time-critical clause in criterion 4. When true the hook refuses to submit and the skin renders nothing at all.",
            "required": false
          },
          {
            "name": "surface",
            "type": "'patient' | 'clinician'",
            "description": "Which surface this is. `patient` throws for every built-in mode.",
            "required": false
          }
        ],
        "extendsType": "UseCopilotOptions"
      },
      {
        "name": "HighlightedPassage",
        "props": [
          {
            "name": "text",
            "type": "string",
            "description": "The source passage, verbatim. Never re-flowed or truncated — a citation the reader cannot check against the original is not a citation.",
            "required": true
          },
          {
            "name": "at",
            "type": "readonly [number, number]",
            "description": "Character offsets of the span the answer drew on, as `[start, end]`. Out-of-range offsets highlight nothing rather than throwing: a citation that points past the end of its own source is a bug in the caller, and silently marking the wrong sentence would be worse than marking none.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { Copilot } from \"@/components/zoblocks/copilot\";\nimport { lookUp, prepare } from \"@zoblocks/copilot-core\";\n\n// Safest first deployment: reference lookup, no patient data anywhere.\n<Copilot provider={ourEndpoint} modes={[lookUp]} />\n\n// With the chart, once a resolver is wired.\n<Copilot\n  provider={ourEndpoint}\n  modes={[lookUp, prepare]}\n  subject={{ reference: \"Patient/123\", display: \"Amara Okonkwo\" }}\n  context={resolver}\n  actor={{ display: \"Dr Okafor\", reference: \"Practitioner/7\" }}\n  onAudit={(event) => auditSink.write(event)}\n  // The most valuable prop in the API.\n  suppressed={isAdministeringMedication || isSigningOrders}\n/>",
    "guidance": {
      "use": [
        "Clinician-facing reference lookup, where no patient data reaches the model at all. This is the safest first deployment and needs no BAA covering PHI in the model call.",
        "Record summarisation before an encounter, once a context resolver is wired and the scope strip can show what was read and what was withheld.",
        "Behavioral health measurement-based care — instrument trends restated from what was documented, which generates no clinical recommendation."
      ],
      "avoid": [
        "Patient-facing surfaces. Copilot throws rather than rendering: Illinois, Nevada and Utah each regulate AI in mental health differently and Nevada prohibits it outright. A patient-facing product is a separate product with a separate regulatory footing.",
        "Any moment the clinician is mid-procedure — administering medication, signing orders, in a documented timeout. Pass `suppressed` and the component removes itself entirely.",
        "Autonomous action. Copilot proposes; a human commits, and provenance attributes the act to the human. There is no configuration that changes this.",
        "Differential generation before you have evaluated your own stack. Below roughly 70% reliability, automation makes performance worse than no automation."
      ]
    },
    "accessibility": [
      {
        "label": "Streaming is never announced token by token",
        "detail": "The answer container is aria-live=off with aria-busy while text arrives. A separate visually-hidden status region announces transitions only, and on completion reports word count and source count so a screen-reader user can decide whether to read it."
      },
      {
        "label": "The dock is a landmark, not a floating div",
        "detail": "role=complementary with an accessible name, so it can be found and — more importantly — skipped. The panel does not trap focus, because a clinician has to keep working in the chart with it open, but focus returns to the opener on close."
      },
      {
        "label": "The slash menu is a real combobox",
        "detail": "Focus stays in the input; arrow keys move aria-activedescendant. Escape closes the menu and leaves the typed text alone, so a free-text question that begins with a slash is not destroyed."
      },
      {
        "label": "Citations are named, not numbered",
        "detail": "Each marker is a button whose accessible name is 'Source 1, 2023 ACC/AHA AF Guideline, version 2023.1' rather than '1'."
      },
      {
        "label": "A live microphone is never conveyed by colour alone",
        "detail": "Dictation announces start and stop through the status region and carries a visually-hidden label, so the state is available without seeing the waveform. Reduced motion replaces the animation with a static level meter rather than removing the indicator."
      },
      {
        "label": "Reflows to 320px and 400% zoom",
        "detail": "The dock docks flush to the bottom edge and the panel becomes a full-width sheet. Every interactive target clears 24x24."
      }
    ],
    "limitations": [
      "Not clinical decision support as any regulator defines it, and not a medical device. The obligations belong to the team that ships it.",
      "The crisis classifier is deterministic and rule-based. It is tuned so that clinical documentation ('denies SI', 'C-SSRS negative') does not escalate, which is what makes it usable in psychiatry — but it is a floor, not a substitute for a risk protocol.",
      "Built-in crisis lines are a development default. 988 is US-only; a host must supply its own for production.",
      "Copilot cannot secure a backend. It guarantees the shape of what it sends and the provenance of what it renders; it cannot stop a host wiring an agent with standing EHR write access behind it.",
      "Requires @zoblocks/copilot-react and @zoblocks/copilot-core from npm. The engine is deliberately not inlined — a safety control nobody reads before pasting is not a safety control."
    ],
    "related": [
      "clinical-note"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge",
      "@zoblocks/copilot-core",
      "@zoblocks/copilot-react"
    ],
    "install": "npx @zoblocks/cli add copilot"
  },
  {
    "name": "data-grid",
    "title": "Data Grid",
    "tier": "free",
    "status": "beta",
    "since": "0.6.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A worklist that states what it is showing out of what, holds arriving results behind a line, and names the model when you sort by one.",
    "tagline": "States its coverage before it shows you the rows.",
    "description": "A ruled ledger with role=\"grid\": coverage above the data rather than under it, a total that may honestly be unknown, absence said in words rather than an em dash, numbered footnotes naming the model behind a derived column, and results that arrive without anything moving under your hand.",
    "rationale": "Every grid renders the six rows on screen and says nothing about the other 306. That is a claim the component makes and cannot support: the filter was set at 07:00 by somebody who has stopped seeing it, and the reader at 15:00 believes this is the whole team. So coverage is required, absence is said in words rather than an em dash, a derived column names the model it ranks by, and results that land are held rather than merged.",
    "categories": [
      "Clinical",
      "Data Display"
    ],
    "fhir": [
      {
        "name": "Bundle",
        "url": "https://hl7.org/fhir/R4/bundle.html",
        "note": "Bundle.total is optional and the spec forbids building paging URLs by hand, so \"6 of 312\" is a sentence many conformant servers cannot support. That is why total accepts \"unknown\"."
      },
      {
        "name": "Observation",
        "url": "https://hl7.org/fhir/R4/observation.html",
        "note": "dataAbsentReason, narrowed to the five distinctions a reader acts on differently. A client who declines a PHQ-9 is a clinical event, not a gap."
      },
      {
        "name": "Patient",
        "url": "https://hl7.org/fhir/R4/patient.html",
        "note": "The subject of the identity line. A masked row says \"restricted record\" and names nobody, which is what 42 CFR Part 2 requires."
      },
      {
        "name": "RiskAssessment",
        "url": "https://hl7.org/fhir/R4/riskassessment.html",
        "note": "The shape a derived column carries. prediction.probabilityDecimal is the number; the derivation is what makes it safe to sort by at all."
      }
    ],
    "resource": "Bundle",
    "resourceUrl": "https://hl7.org/fhir/R4/bundle.html",
    "states": [
      "Coverage above the data",
      "A total the source will not give",
      "Absence, said five ways",
      "Sorted by a derived column",
      "Results arrived, nothing moved",
      "The row the reader is on",
      "Compact density",
      "Everything, with nothing hidden",
      "Too many rows to render honestly",
      "Selected, with the verbs that reach them",
      "Pinned identity, scrolled sideways",
      "Loading more, and the end of what is known",
      "Framed by the host, not by itself",
      "The predicate matched nobody"
    ],
    "props": [
      {
        "name": "caption",
        "type": "string",
        "description": "What the table is, for a screen reader. Required — a grid with no name is a wall.",
        "required": true
      },
      {
        "name": "columns",
        "type": "readonly DataGridColumn<Row>[]",
        "description": "The columns, in display order. Typed objects rather than JSX children, so a saved view can carry them.",
        "required": true
      },
      {
        "name": "coverage",
        "type": "GridCoverage",
        "description": "What is on screen, out of what. Required, and there is no escape hatch — `localGridCoverage(rows)` is the one line a caller who genuinely has everything writes instead.",
        "required": true
      },
      {
        "name": "rowKey",
        "type": "(row: Row) => string",
        "description": "Stable identity for a row. Focus follows this, not the row's position.",
        "required": true
      },
      {
        "name": "rows",
        "type": "readonly Row[]",
        "description": "The rows on screen. The grid never fetches, filters or merges — this is exactly what it draws.",
        "required": true
      },
      {
        "name": "arrivals",
        "type": "readonly Row[]",
        "description": "Results that have landed and are being held. The grid never merges these itself. It counts them, says nothing moved, and offers the reader a way to ask — at which point `onAdmitArrivals` fires and the caller decides what the new row set is.",
        "required": false
      },
      {
        "name": "arrivalsAt",
        "type": "string",
        "description": "When the arrivals landed, for the held line.",
        "required": false
      },
      {
        "name": "bulkActions",
        "type": "((selected: readonly Row[]) => React.ReactNode)",
        "description": "What can be done to a selection, rendered in a bar above the table. Receives the selected rows rather than their keys, because the verbs a host offers usually depend on what was picked — and because handing back keys makes every caller re-derive the rows the grid already has.",
        "required": false
      },
      {
        "name": "ceiling",
        "type": "number",
        "description": "Above this many rows the grid refuses rather than degrading.",
        "required": false
      },
      {
        "name": "className",
        "type": "string",
        "description": "Merged onto the outer element.",
        "required": false
      },
      {
        "name": "defaultSort",
        "type": "GridSort | null",
        "description": "Sort, uncontrolled. Defaults to the caller's own row order.",
        "required": false,
        "default": "null"
      },
      {
        "name": "density",
        "type": "'compact' | 'comfortable' | 'regular'",
        "description": "Row height and type scale. Every density keeps targets above the 24px floor.",
        "required": false,
        "default": "\"regular\""
      },
      {
        "name": "empty",
        "type": "React.ReactNode",
        "description": "What to say when the predicate matched nothing. A grid that renders a header over an empty body has said nothing about why, and the reader's next move — widen the filter, or trust that there is genuinely nobody — depends entirely on which it is. The default names the noun from `coverage`; pass a node to say something the host knows and the grid cannot, such as which filter to drop.",
        "required": false
      },
      {
        "name": "exhausted",
        "type": "boolean",
        "description": "There is no more to load. Draws the end of the list rather than waiting forever.",
        "required": false,
        "default": "false"
      },
      {
        "name": "footer",
        "type": "boolean",
        "description": "Draw the foot — the reading line, the sort citation and the footnotes. On by default, for the same reason as the masthead: a grid standing alone has to carry its own provenance, and a derived column with no note beside it is a number with no author. Turning it off does not make an absent cell lie. The absence keeps its word — \"Not recorded\", \"Restricted\" — and only loses the superscript that pointed at the note, because the note is no longer on the page. Turn it off only where the host carries provenance itself.",
        "required": false,
        "default": "true"
      },
      {
        "name": "id",
        "type": "string",
        "description": "The outer element's id. Generated when absent; the masthead title and the grid's label derive from it.",
        "required": false
      },
      {
        "name": "identify",
        "type": "((row: Row) => GridIdentity)",
        "description": "Who the row is about, re-stated in the footer at the point of action.",
        "required": false
      },
      {
        "name": "loadingMore",
        "type": "boolean",
        "description": "A fetch is in flight. Draws the waiting line and suppresses further calls.",
        "required": false,
        "default": "false"
      },
      {
        "name": "masthead",
        "type": "boolean",
        "description": "Draw the masthead — the title, the coverage sentence and the predicate. On by default, because a grid dropped into a page with no framing has to carry its own. Turn it off when the host already frames it: an application screen with a page header naming the list and a filter bar naming the predicate is saying both things twice, and the second copy reads as chrome rather than as the claim it is. `caption` is unaffected — the accessible name never goes away, so the grid is still named for a screen reader when nothing is drawn for the eye. Where the masthead is off, the coverage sentence becomes the host's to place, and `describeGridCoverage(coverage)` is the one line that does it.",
        "required": false,
        "default": "true"
      },
      {
        "name": "maxHeight",
        "type": "string",
        "description": "A scroll height for the body. The header sticks to the top of it.",
        "required": false
      },
      {
        "name": "note",
        "type": "React.ReactNode",
        "description": "The right-hand side of the masthead: a window, a source, a role.",
        "required": false
      },
      {
        "name": "onAdmitArrivals",
        "type": "((rows: readonly Row[]) => void)",
        "description": "The reader asked for the held results. Merge them into `rows`; the grid will not do it for you.",
        "required": false
      },
      {
        "name": "onReachEnd",
        "type": "(() => void)",
        "description": "The reader has reached the end of what is loaded. Fetch the next batch. This replaced a numbered pager, and not for taste: FHIR search returns opaque `link.next` URLs, the spec forbids constructing paging URLs by hand, and `Bundle.total` is optional. \"Page 4 of 7\" is therefore a control that cannot be built against a conformant server — the count is not derivable and the jump target is not addressable. Following `next` until it stops is the shape the protocol has. The grid never fetches. It watches a sentinel below the last row and says when it comes into view; appending to `rows` is the caller's.",
        "required": false
      },
      {
        "name": "onRowActivate",
        "type": "((row: Row) => void)",
        "description": "Enter on a row.",
        "required": false
      },
      {
        "name": "onSelectionChange",
        "type": "((keys: readonly string[]) => void)",
        "description": "Fires with the whole new selection, never a delta — so a caller can store it as-is.",
        "required": false
      },
      {
        "name": "onSortChange",
        "type": "((sort: GridSort | null) => void)",
        "description": "Fires on every sort change, including the third activation that clears it back to your order.",
        "required": false
      },
      {
        "name": "pinnedColumns",
        "type": "number",
        "description": "How many leading columns stay put while the rest scroll sideways. The identity column is the one a reader must never lose: scrolled twelve columns right with no name in view, every row is the same row. Offsets are measured rather than declared, so a pinned column needs no fixed width.",
        "required": false,
        "default": "0"
      },
      {
        "name": "selectedKeys",
        "type": "readonly string[]",
        "description": "Rows the reader has selected, by `rowKey`. Controlled. Omit it and the grid renders no selection column at all — a checkbox that cannot lead anywhere is a control that teaches a reader to expect a bulk action the product does not have.",
        "required": false
      },
      {
        "name": "sort",
        "type": "GridSort | null",
        "description": "Sort, controlled.",
        "required": false
      },
      {
        "name": "title",
        "type": "React.ReactNode",
        "description": "The masthead line. Falls back to `caption`.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "DataGrid",
        "props": [
          {
            "name": "caption",
            "type": "string",
            "description": "What the table is, for a screen reader. Required — a grid with no name is a wall.",
            "required": true
          },
          {
            "name": "columns",
            "type": "readonly DataGridColumn<Row>[]",
            "description": "The columns, in display order. Typed objects rather than JSX children, so a saved view can carry them.",
            "required": true
          },
          {
            "name": "coverage",
            "type": "GridCoverage",
            "description": "What is on screen, out of what. Required, and there is no escape hatch — `localGridCoverage(rows)` is the one line a caller who genuinely has everything writes instead.",
            "required": true
          },
          {
            "name": "rowKey",
            "type": "(row: Row) => string",
            "description": "Stable identity for a row. Focus follows this, not the row's position.",
            "required": true
          },
          {
            "name": "rows",
            "type": "readonly Row[]",
            "description": "The rows on screen. The grid never fetches, filters or merges — this is exactly what it draws.",
            "required": true
          },
          {
            "name": "arrivals",
            "type": "readonly Row[]",
            "description": "Results that have landed and are being held. The grid never merges these itself. It counts them, says nothing moved, and offers the reader a way to ask — at which point `onAdmitArrivals` fires and the caller decides what the new row set is.",
            "required": false
          },
          {
            "name": "arrivalsAt",
            "type": "string",
            "description": "When the arrivals landed, for the held line.",
            "required": false
          },
          {
            "name": "bulkActions",
            "type": "((selected: readonly Row[]) => React.ReactNode)",
            "description": "What can be done to a selection, rendered in a bar above the table. Receives the selected rows rather than their keys, because the verbs a host offers usually depend on what was picked — and because handing back keys makes every caller re-derive the rows the grid already has.",
            "required": false
          },
          {
            "name": "ceiling",
            "type": "number",
            "description": "Above this many rows the grid refuses rather than degrading.",
            "required": false
          },
          {
            "name": "className",
            "type": "string",
            "description": "Merged onto the outer element.",
            "required": false
          },
          {
            "name": "defaultSort",
            "type": "GridSort | null",
            "description": "Sort, uncontrolled. Defaults to the caller's own row order.",
            "required": false,
            "default": "null"
          },
          {
            "name": "density",
            "type": "'compact' | 'comfortable' | 'regular'",
            "description": "Row height and type scale. Every density keeps targets above the 24px floor.",
            "required": false,
            "default": "\"regular\""
          },
          {
            "name": "empty",
            "type": "React.ReactNode",
            "description": "What to say when the predicate matched nothing. A grid that renders a header over an empty body has said nothing about why, and the reader's next move — widen the filter, or trust that there is genuinely nobody — depends entirely on which it is. The default names the noun from `coverage`; pass a node to say something the host knows and the grid cannot, such as which filter to drop.",
            "required": false
          },
          {
            "name": "exhausted",
            "type": "boolean",
            "description": "There is no more to load. Draws the end of the list rather than waiting forever.",
            "required": false,
            "default": "false"
          },
          {
            "name": "footer",
            "type": "boolean",
            "description": "Draw the foot — the reading line, the sort citation and the footnotes. On by default, for the same reason as the masthead: a grid standing alone has to carry its own provenance, and a derived column with no note beside it is a number with no author. Turning it off does not make an absent cell lie. The absence keeps its word — \"Not recorded\", \"Restricted\" — and only loses the superscript that pointed at the note, because the note is no longer on the page. Turn it off only where the host carries provenance itself.",
            "required": false,
            "default": "true"
          },
          {
            "name": "id",
            "type": "string",
            "description": "The outer element's id. Generated when absent; the masthead title and the grid's label derive from it.",
            "required": false
          },
          {
            "name": "identify",
            "type": "((row: Row) => GridIdentity)",
            "description": "Who the row is about, re-stated in the footer at the point of action.",
            "required": false
          },
          {
            "name": "loadingMore",
            "type": "boolean",
            "description": "A fetch is in flight. Draws the waiting line and suppresses further calls.",
            "required": false,
            "default": "false"
          },
          {
            "name": "masthead",
            "type": "boolean",
            "description": "Draw the masthead — the title, the coverage sentence and the predicate. On by default, because a grid dropped into a page with no framing has to carry its own. Turn it off when the host already frames it: an application screen with a page header naming the list and a filter bar naming the predicate is saying both things twice, and the second copy reads as chrome rather than as the claim it is. `caption` is unaffected — the accessible name never goes away, so the grid is still named for a screen reader when nothing is drawn for the eye. Where the masthead is off, the coverage sentence becomes the host's to place, and `describeGridCoverage(coverage)` is the one line that does it.",
            "required": false,
            "default": "true"
          },
          {
            "name": "maxHeight",
            "type": "string",
            "description": "A scroll height for the body. The header sticks to the top of it.",
            "required": false
          },
          {
            "name": "note",
            "type": "React.ReactNode",
            "description": "The right-hand side of the masthead: a window, a source, a role.",
            "required": false
          },
          {
            "name": "onAdmitArrivals",
            "type": "((rows: readonly Row[]) => void)",
            "description": "The reader asked for the held results. Merge them into `rows`; the grid will not do it for you.",
            "required": false
          },
          {
            "name": "onReachEnd",
            "type": "(() => void)",
            "description": "The reader has reached the end of what is loaded. Fetch the next batch. This replaced a numbered pager, and not for taste: FHIR search returns opaque `link.next` URLs, the spec forbids constructing paging URLs by hand, and `Bundle.total` is optional. \"Page 4 of 7\" is therefore a control that cannot be built against a conformant server — the count is not derivable and the jump target is not addressable. Following `next` until it stops is the shape the protocol has. The grid never fetches. It watches a sentinel below the last row and says when it comes into view; appending to `rows` is the caller's.",
            "required": false
          },
          {
            "name": "onRowActivate",
            "type": "((row: Row) => void)",
            "description": "Enter on a row.",
            "required": false
          },
          {
            "name": "onSelectionChange",
            "type": "((keys: readonly string[]) => void)",
            "description": "Fires with the whole new selection, never a delta — so a caller can store it as-is.",
            "required": false
          },
          {
            "name": "onSortChange",
            "type": "((sort: GridSort | null) => void)",
            "description": "Fires on every sort change, including the third activation that clears it back to your order.",
            "required": false
          },
          {
            "name": "pinnedColumns",
            "type": "number",
            "description": "How many leading columns stay put while the rest scroll sideways. The identity column is the one a reader must never lose: scrolled twelve columns right with no name in view, every row is the same row. Offsets are measured rather than declared, so a pinned column needs no fixed width.",
            "required": false,
            "default": "0"
          },
          {
            "name": "selectedKeys",
            "type": "readonly string[]",
            "description": "Rows the reader has selected, by `rowKey`. Controlled. Omit it and the grid renders no selection column at all — a checkbox that cannot lead anywhere is a control that teaches a reader to expect a bulk action the product does not have.",
            "required": false
          },
          {
            "name": "sort",
            "type": "GridSort | null",
            "description": "Sort, controlled.",
            "required": false
          },
          {
            "name": "title",
            "type": "React.ReactNode",
            "description": "The masthead line. Falls back to `caption`.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { DataGrid, type DataGridColumn } from \"@/components/zoblocks/data-grid\";\nimport \"@/styles/zoblocks-grid.css\";\n\nconst columns: DataGridColumn<Row>[] = [\n  { key: \"name\", header: \"Patient\", kind: \"text\", value: (r) => r.name },\n  { key: \"mrn\", header: \"MRN\", kind: \"identifier\", value: (r) => r.mrn },\n  {\n    key: \"phq9\",\n    header: \"PHQ-9\",\n    kind: \"measure\",\n    // An absence is a value, not a hole. There is no null to pass here.\n    value: (r) => r.phq9 ?? { absent: \"awaiting\" },\n  },\n  {\n    key: \"risk\",\n    header: \"Disengagement risk\",\n    kind: \"number\",\n    value: (r) => r.risk,\n    derived: {\n      model: \"disengagement\",\n      version: \"v1.8\",\n      validatedOn: \"9,140 outpatient episodes\",\n      population: \"adults, English-language intake only\",\n    },\n  },\n];\n\n<DataGrid\n  caption=\"Clients on this team's caseload with a raised PHQ-9 or a recent risk screen\"\n  title=\"Caseload · PHQ-9 raised or risk screened\"\n  columns={columns}\n  rows={rows}\n  rowKey={(row) => row.mrn}\n  coverage={{\n    shown: rows.length,\n    total: cohortTotal,\n    noun: \"clients on this team's caseload\",\n    predicate: \"PHQ-9 of 10 or more, or a risk screen in the last 14 days.\",\n  }}\n  identify={(row) => ({ primary: row.name, secondary: `MRN ${row.mrn}` })}\n  arrivals={held}\n  onAdmitArrivals={admit}\n/>",
    "guidance": {
      "use": [
        "For any list somebody will act from — a worklist, a queue, a cohort, a results review. The coverage line is what makes it safe to act from, and it is the reason to reach for this rather than a table.",
        "With `coverage` computed from the query, not from the array. `shown` is the array; `total` is what the predicate matches, and if the source will not say, pass \"unknown\" rather than the array length again.",
        "With `derived` on every column whose values a model produced. The footnote is generated from it, so the alternative to filling it in is a page that presents a prediction as an observation.",
        "With `identify` wherever a row leads to an action. It is the line that re-states who the row is about at the point of action, which is the control the wrong-patient literature actually supports.",
        "With `arrivals` rather than by mutating `rows` when results stream in. The component's whole claim about live data is that it does not act on it until asked."
      ],
      "avoid": [
        "As a layout table. It is a grid with a keyboard model and a coverage claim; for two columns of static text a `<table>` is correct and cheaper.",
        "With `total` set to `rows.length` when it is not. That is the failure this component exists to prevent, written by hand — use `localGridCoverage(rows)` when you genuinely have everything.",
        "With an em dash, a blank or \"N/A\" returned from `value`. Return the absence object; a string \"—\" sorts as text and tells the reader nothing about why.",
        "With client-side data past a few thousand rows. The ceiling refuses at 20,000 and the honest answer well before that is server paging.",
        "As the surface that runs a destructive action. Compose ChartContextMenu on the row: the menu names its subject before it offers a verb, and this grid deliberately owns no actions."
      ]
    },
    "accessibility": [
      {
        "label": "A real grid, with two-dimensional navigation",
        "detail": "role=\"grid\" with a roving tabindex over cells. Arrows move one cell, Home and End move within the row, Ctrl+Home and Ctrl+End reach the first header cell and the last cell, Page Up and Page Down move ten rows. The engine under the table most teams reach for ships zero keyboard handlers."
      },
      {
        "label": "aria-rowcount counts the cohort, not the page",
        "detail": "A reader on row 4 of 6 in a caseload of 312 is told exactly that. Where the source will not give a total the attribute is -1, which is ARIA's \"not known\", rather than the page size dressed up as an answer."
      },
      {
        "label": "Focus follows the row, not the row's position",
        "detail": "The cursor is a row key and a column key, so sorting, admitting arrivals, or the caller replacing the array cannot move focus onto a different patient. Every grid that stores a pair of indices has this defect."
      },
      {
        "label": "The header is reachable, so sorting is reachable",
        "detail": "Sortable headers are buttons inside the columnheader and sit in the same roving sequence as the cells. A grid whose sort controls are only clickable cannot be sorted by keyboard at all."
      },
      {
        "label": "Nothing is carried by colour",
        "detail": "Sort state is a glyph, a weight and aria-sort. The current row is a margin marker rather than a tint. Absence is a word in italic. All of it survives forced-colors, a monochrome print and a photograph of a monitor."
      },
      {
        "label": "Held results are announced without moving anything",
        "detail": "The held line is a polite live region, so a screen-reader user learns results are arriving. Nothing is inserted into the table until they ask, so the announcement never coincides with rows moving under a cursor."
      },
      {
        "label": "The focus ring is drawn inside the cell",
        "detail": "An outline on a cell under border-collapse is clipped by its neighbour's border, which loses half the ring exactly at the edge of a scroll container. It is an inset shadow with a second inset ring behind it, so it reads on any cell background."
      },
      {
        "label": "The table is named, and the name is not printed twice",
        "detail": "`caption` is required and rendered visually hidden; the masthead carries the same claim in larger type. A grid with no accessible name is a wall of unlabelled cells."
      }
    ],
    "limitations": [
      "Client-side only, and it refuses past 20,000 rows rather than degrading. There is no virtualiser and no server row model yet; the ceiling is a measured number, not a placeholder, and the message says what to do instead.",
      "One sort column. Multi-column sort is a real requirement in a worklist and is not here yet.",
      "No column resize, reorder, pinning or grouping. Columns are typed objects precisely so a saved view can carry those later; today the caller sets width and order.",
      "No selection model and no row expansion. A grid that owns selection also owns the bulk-action confirmation, which is ChartContextMenu's job.",
      "Filtering is the caller's. The grid renders the predicate as a sentence and never composes one — a component that owned the filter would also own the query, and no Zoblocks package makes a network call.",
      "The export helper produces delimited text, not XLSX. Typed cells are the stronger answer to formula injection; the quote prefix is what is available without a writer dependency.",
      "`status` columns sort by a declared order that the caller supplies. There is no terminology binding, so a mis-declared order sorts wrongly and nothing catches it.",
      "Strings are English and not routed through @zoblocks/intl — true of every registry component today."
    ],
    "related": [
      "chart-context-menu",
      "result-value",
      "risk-indicator",
      "clinical-status"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add data-grid",
    "technicalName": "DataGrid",
    "aliases": [
      "data grid",
      "worklist",
      "patient list",
      "table",
      "results table",
      "cohort table",
      "census grid"
    ],
    "tags": [
      "data-display",
      "sortable",
      "keyboard-first",
      "print-safe",
      "themeable"
    ],
    "uxGuidelines": {
      "do": [
        "Write `predicate` as a sentence somebody could read aloud in supervision: “PHQ-9 of 10 or more, or a risk screen in the last 14 days.”",
        "Give `noun` the thing being counted — “clients on this team's caseload”, “assessments awaiting review” — so the coverage line reads as a claim rather than as a row count.",
        "Put the identifier in `identity.secondary`. A name is not an identifier, and two clients on one caseload sharing a surname is in every study of this failure.",
        "Set `kind` on every column. It decides alignment, whether digits are compared as a quantity, and whether the first click sorts worst-first.",
        "Use `footnote` for anything the header cannot say in two words — a unit, a reference range, a collection method — instead of widening the header."
      ],
      "dont": [
        "Do not sort by a derived column on first paint. Ranking by model output is a clinical act, and doing it before anyone asked makes it the component's act rather than the reader's.",
        "Do not merge arrivals on a timer. The count waiting is information; the merge is a decision, and it belongs to whoever has their hand on the pointer.",
        "Do not colour a whole row by severity. The row marker means “you are here”; a second full-row tint makes the two indistinguishable, and both vanish in print.",
        "Do not hide the coverage line on small screens. It is the first thing to be dropped and the last thing that should be.",
        "Do not return different absence reasons for the same underlying fact across rows. The footnote is de-duplicated by reason, and three phrasings of “awaiting” produce three footnotes."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "A caseload list is where behavioral health work is dispatched from, and it fails in three ways: it implies a completeness it does not have, it moves a row out from under an action, and it draws a withheld value the same as an unrecorded one. 42 CFR Part 2 makes the third a question of entitlement rather than of tidiness.",
      "workflows": [
        "assessment",
        "care-coordination",
        "documentation",
        "medication"
      ],
      "phi": {
        "handles": true,
        "notes": "Every cell is caller-supplied and the grid stores none of it. The identity line renders what identify returns and no more, and a masked identity names nobody."
      },
      "auditable": false,
      "permissions": [
        "chart.read"
      ],
      "terminology": [
        "FHIR",
        "LOINC"
      ]
    },
    "controls": [
      {
        "prop": "density",
        "control": "select",
        "label": "Density",
        "options": [
          "comfortable",
          "regular",
          "compact"
        ],
        "defaultValue": "regular"
      },
      {
        "prop": "pinnedColumns",
        "control": "slider",
        "label": "Pinned columns",
        "min": 0,
        "max": 2,
        "step": 1,
        "defaultValue": 0
      },
      {
        "prop": "onSortChange",
        "control": "event",
        "label": "onSortChange"
      },
      {
        "prop": "onSelectionChange",
        "control": "event",
        "label": "onSelectionChange"
      },
      {
        "prop": "onReachEnd",
        "control": "event",
        "label": "onReachEnd"
      },
      {
        "prop": "onRowActivate",
        "control": "event",
        "label": "onRowActivate"
      },
      {
        "prop": "onAdmitArrivals",
        "control": "event",
        "label": "onAdmitArrivals"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Arrows, Home, End, Ctrl+Home, Ctrl+End, Page Up and Page Down move the cursor; Enter activates a row; the header is in the same sequence so sorting is reachable. Nothing needs a pointer.",
        "evidence": "data-grid.test.tsx"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "role=\"grid\" named by the masthead title, with rowgroup, row, columnheader and gridcell stated explicitly, aria-sort on every sortable header, and aria-rowindex and aria-colindex on every cell.",
        "evidence": "data-grid.test.tsx"
      },
      {
        "wcag": "1.3.1",
        "name": "Info and relationships",
        "status": "pass",
        "how": "aria-rowcount is the cohort plus the header row, or -1 where the total is unknown. Header cells carry scope=\"col\". The caption names the table for a screen reader without printing it twice.",
        "evidence": "data-grid.test.tsx"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "Sort is a glyph plus a weight plus aria-sort; the current row is a margin marker, not a tint; absence is a word. Asserted by rendering with no colour available.",
        "evidence": "data-grid.test.tsx"
      },
      {
        "wcag": "4.1.3",
        "name": "Status messages",
        "status": "pass",
        "how": "The held-arrivals line is a polite live region carrying the count and the words “nothing moved”. The capacity refusal is role=\"status\".",
        "evidence": "data-grid.test.tsx"
      },
      {
        "wcag": "2.4.7",
        "name": "Focus visible",
        "status": "pass",
        "how": "An inset two-ring shadow rather than an outline, because an outline on a collapsed-border cell is clipped by its neighbour exactly at the edge of a scroll container.",
        "evidence": "grid.css"
      },
      {
        "wcag": "1.4.10",
        "name": "Reflow",
        "status": "pass",
        "how": "The table scrolls horizontally inside its own container; the masthead, held line and footnotes reflow and never scroll sideways, so the coverage claim survives a 320px viewport.",
        "evidence": "grid.css"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size (minimum)",
        "status": "pass",
        "how": "Header sort buttons take a 28px floor and the admit control 26px, rather than the 2.75rem density target — a pointer size for a thumb, and three times the height of the 10px labels inside them. Both clear the 24px minimum SC 2.5.8 asks for.",
        "evidence": "grid.css"
      }
    ],
    "examples": [
      {
        "id": "coverage",
        "title": "Coverage is arithmetic, not a footer note",
        "description": "The claim goes above the rows it is about. Rendering the page size as the total is the one failure this type exists to prevent.",
        "fixture": "caseloadPhq9",
        "code": "describeGridCoverage({ shown: 6, total: 312, noun: \"clients on this caseload\" });\n// → \"6 of 312 clients on this caseload.\"\n\ndescribeGridCoverage({ shown: 6, total: \"unknown\", noun: \"clients\" });\n// → \"6 clients shown. The source did not say how many match.\"\n\ngridUnseenCount({ shown: 6, total: 312 });     // → 306\ngridUnseenCount({ shown: 6, total: \"unknown\" }); // → null"
      },
      {
        "id": "absence",
        "title": "An absence sorts last, in both directions",
        "description": "A PHQ-9 the client has not completed is not a PHQ-9 of zero. Four “Awaiting” rows above a score of 7 tells a reader the caseload is doing better than it is.",
        "fixture": "caseloadPhq9",
        "code": "const phq9 = { key: \"phq9\", header: \"PHQ-9\", kind: \"measure\",\n               value: (r) => r.phq9 };\n\nsortGridRows(rows, phq9, \"ascending\").map((r) => r.phq9);\n// → [7, 11, 18, 22, { absent: \"awaiting\" }, { absent: \"restricted\" }]\n\nsortGridRows(rows, phq9, \"descending\").map((r) => r.phq9);\n// → [22, 18, 11, 7, { absent: \"awaiting\" }, { absent: \"restricted\" }]"
      },
      {
        "id": "derived",
        "title": "Sorting by a model is ranking a prediction",
        "description": "The derivation travels with the column, so the footnote is generated rather than remembered. Sorting by it promotes the footnote to a statement under the table.",
        "fixture": "caseloadPhq9",
        "code": "describeGridDerivation({\n  model: \"disengagement\",\n  version: \"v1.8\",\n  validatedOn: \"9,140 outpatient episodes\",\n  population: \"adults, English-language intake only\",\n});\n// → \"disengagement v1.8, validated on 9,140 outpatient episodes,\n//    adults, English-language intake only.\""
      },
      {
        "id": "arrivals",
        "title": "Results arrive; nothing moves",
        "description": "The grid counts what has landed and holds it. Merging is the reader's decision, taken with a hand on the pointer.",
        "fixture": "caseloadPhq9",
        "code": "describeGridArrivals(3, \"11:47\");\n// → \"3 results arrived at 11:47 — nothing moved.\"\n\n<DataGrid arrivals={held} arrivalsAt=\"11:47\" onAdmitArrivals={admit} … />\n// The rows prop never changes until admit() is called."
      },
      {
        "id": "export",
        "title": "An export is an attack surface",
        "description": "A patient's preferred name is free text from a registration desk. Nothing turns this off, because the person who opens the file rarely chose the column.",
        "fixture": "caseloadPhq9",
        "code": "neutraliseGridCell(\"=cmd|' /C calc'!A0\");   // → \"'=cmd|' /C calc'!A0\"\nneutraliseGridCell(\"＝HYPERLINK(...)\");      // → \"'＝HYPERLINK(...)\"  full-width too\nneutraliseGridCell(\"Ade-Smith\");             // → \"Ade-Smith\"        unchanged\n\ntoGridDelimited(rows, columns, { coverage });\n// Row 1 is the coverage sentence, because an export outlives its screen."
      },
      {
        "id": "refusal",
        "title": "A refusal, not a nine-second paint",
        "description": "Twenty thousand is measured, not chosen. It is where a forty-column model on a shared 4 GB ward workstation stops being usable at handover.",
        "fixture": "unknownTotal",
        "code": "gridCapacityRefusal(18_000);   // → null\ngridCapacityRefusal(120_000);\n// → \"120,000 rows is past what this renders on a ward workstation\n//    (the ceiling is 20,000). Narrow the query or move paging to the\n//    server — the grid will not pretend to hold them.\""
      }
    ],
    "fixtures": [
      "caseloadPhq9",
      "unknownTotal"
    ],
    "seo": {
      "slug": "data-grid",
      "title": "Data Grid — React healthcare worklist with role=\"grid\"",
      "description": "An accessible React data grid for clinical worklists: it states its coverage above the rows and names the model when you sort by a derived column.",
      "primaryKeyword": "react healthcare data grid",
      "secondaryKeywords": [
        "accessible react data grid",
        "clinical worklist component",
        "ehr patient list table react",
        "role grid keyboard navigation react",
        "csv formula injection react table"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "chart-review",
        "care-coordination"
      ],
      "alternatives": [
        {
          "ref": "care-timeline",
          "when": "the rows are one patient's events over time rather than many patients at one moment"
        },
        {
          "ref": "chart-command-palette",
          "when": "the reader knows which record they want and would rather type its name than scan for it"
        }
      ]
    }
  },
  {
    "name": "date-picker",
    "title": "Date Picker",
    "tier": "free",
    "status": "beta",
    "since": "0.5.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "One temporal control with sixteen variants: field, calendar, date and time ranges, birth date, session, slots, recurrence and the read-only record.",
    "tagline": "One temporal control, sixteen variants, one value space.",
    "description": "Sixteen presentations of one value space, one keyboard model and one accessibility contract. `variant` picks the surface; the parts are separately testable components underneath.",
    "rationale": "A clinician does not shop for a \"birth date field\". They reach for the date control, and it has to behave differently in sixteen places: a service date they already know, an appointment they have to be shown, a birth date that wants an age beside it, a session that is three numbers with two degrees of freedom, a course of treatment that is a rule rather than a date, and a signed timestamp that is a legal instrument. Splitting those into sixteen catalogue entries hides the thing that makes them a system — that every one shares a value space, a keyboard model and an accessibility contract — and it makes a reader choose between components before they have understood the choice. The deeper reason is that healthcare temporal input is four distinct jobs, not one: recall (the user knows the value), choose (the system knows the options), construct (the value is a structure with derived members) and witness (the value is an assertion about the past). Every general-purpose picker builds only for choose, which is the rarest of the four in an electronic record, and that inversion is why EHR date fields are the way they are.",
    "categories": [
      "Clinical",
      "Forms"
    ],
    "fhir": [
      {
        "name": "Patient",
        "url": "https://hl7.org/fhir/R4/patient.html",
        "note": "birthDate permits YYYY and YYYY-MM, so the birth-date variant stores a partial date rather than inventing 1 January."
      },
      {
        "name": "Slot",
        "url": "https://hl7.org/fhir/R4/slot.html",
        "note": "The slots variant renders a Slot set. busy-tentative becomes a hold rather than a booking, because it expires."
      },
      {
        "name": "Schedule",
        "url": "https://hl7.org/fhir/R4/schedule.html",
        "note": "The scheduler variant asks the host for a Schedule's slots; it never fetches them itself."
      },
      {
        "name": "PractitionerRole",
        "url": "https://hl7.org/fhir/R4/practitionerrole.html",
        "note": "availableTime and notAvailable are different facts — 'does not work Thursdays' and 'on leave until the 15th' — and are read separately."
      },
      {
        "name": "Timing",
        "url": "https://hl7.org/fhir/R4/datatypes.html#Timing",
        "note": "The recurrence variant emits a real RFC 5545 RRULE with its EXDATE, so a series round-trips."
      }
    ],
    "resource": "Patient",
    "resourceUrl": "https://hl7.org/fhir/R4/patient.html",
    "states": [
      "Picker — field with a calendar behind a button",
      "Field — no popover at all",
      "Calendar — inline month grid",
      "Range — two clicks, never a drag",
      "Date range — both ends typed, two months behind them, named periods down the side",
      "Multiple dates — capped, click again to remove",
      "Birth date — age, partial dates, stated absence",
      "Time — and the ambiguity it refuses to resolve",
      "Session — start, end, duration, visible driver",
      "Time range — two columns, a filtered end, a derived length",
      "Slots — grouped, counted, four states",
      "Scheduler — provider, date and time on one surface",
      "Recurrence — the rule in words",
      "Series — conflicts resolved before anything is written",
      "Group — the room, the roster and the real count",
      "Read-only — the record a reviewer sees"
    ],
    "props": [
      {
        "name": "defaultValue",
        "type": "string | number | readonly string[] | DateRangeValue | BirthDateValue | ZbTime | SessionInterval | ZbTimeRange | RecurrenceRule",
        "description": "Uncontrolled initial value. Pass this **or** `value`, never both. There is deliberately no runtime warning: ADR 0009 forbids component source writing to the console at all, because a component that logs is one error-reporting integration away from putting a date of birth in a third party's index. When both are passed, `value` wins — the ordinary React contract. Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass both. Uncontrolled initial value. Pass this or `value`, never both.",
        "required": false
      },
      {
        "name": "onChange",
        "type": "((value: ZbDate | null) => void) | ((value: ZbDate | null) => void) | ((range: DateRangeValue) => void) | ((value: BirthDateValue) => void) | ((value: ZbTime | null) => void) | ((value: SessionInterval) => void) | ((range: ZbTimeRange) => void) | React.ChangeEventHandler<HTMLDivElement, Element> | ((rule: RecurrenceRule) => void) | React.ChangeEventHandler<HTMLElement, Element>",
        "description": "Fired on every complete, valid date, and with `null` when the field is cleared. Never fired mid-typing. Fired when a single date is chosen. Only meaningful in `mode=\"single\"`. Fired when either end changes — by typing, by the calendar, or by a preset. Fired with the whole birth-date value, which carries its precision and any absence reason alongside the date. Fired on every complete time, and with `null` when cleared. Fired whenever start, end or duration changes. The interval is always internally consistent when it fires. Fired when either end changes. Fired with the recurrence rule whenever any part of it changes.",
        "required": false
      },
      {
        "name": "variant",
        "type": "'picker' | 'field' | 'calendar' | 'range' | 'multiple' | 'date-range' | 'birth-date' | 'time' | 'session' | 'time-range' | 'slots' | 'scheduler' | 'recurrence' | 'series' | 'group' | 'readout'",
        "description": "Which of the sixteen temporal controls to render. Defaults to the date field. A month grid. `range` is two clicks, `multiple` is a capped set. A span of days: two typeable ends, a two-month panel, named periods. A date of birth, with its own precision and absence handling. A time of day, with optional organisation presets. A start, an end and a derived duration that may cross midnight. A start time, an end time, and a derived length. A grid of bookable times. Provider, date and slot, resolved together. A recurrence rule, expressed in words and emitted as RRULE. A recurring series with its conflicts resolved one occurrence at a time. A recurring group with capacity, facilitators and a room. The read-only record rendering. Not an input.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "DatePicker",
        "props": [
          {
            "name": "defaultValue",
            "type": "string | number | readonly string[] | DateRangeValue | BirthDateValue | ZbTime | SessionInterval | ZbTimeRange | RecurrenceRule",
            "description": "Uncontrolled initial value. Pass this **or** `value`, never both. There is deliberately no runtime warning: ADR 0009 forbids component source writing to the console at all, because a component that logs is one error-reporting integration away from putting a date of birth in a third party's index. When both are passed, `value` wins — the ordinary React contract. Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass both. Uncontrolled initial value. Pass this or `value`, never both.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((value: ZbDate | null) => void) | ((value: ZbDate | null) => void) | ((range: DateRangeValue) => void) | ((value: BirthDateValue) => void) | ((value: ZbTime | null) => void) | ((value: SessionInterval) => void) | ((range: ZbTimeRange) => void) | React.ChangeEventHandler<HTMLDivElement, Element> | ((rule: RecurrenceRule) => void) | React.ChangeEventHandler<HTMLElement, Element>",
            "description": "Fired on every complete, valid date, and with `null` when the field is cleared. Never fired mid-typing. Fired when a single date is chosen. Only meaningful in `mode=\"single\"`. Fired when either end changes — by typing, by the calendar, or by a preset. Fired with the whole birth-date value, which carries its precision and any absence reason alongside the date. Fired on every complete time, and with `null` when cleared. Fired whenever start, end or duration changes. The interval is always internally consistent when it fires. Fired when either end changes. Fired with the recurrence rule whenever any part of it changes.",
            "required": false
          },
          {
            "name": "variant",
            "type": "'picker' | 'field' | 'calendar' | 'range' | 'multiple' | 'date-range' | 'birth-date' | 'time' | 'session' | 'time-range' | 'slots' | 'scheduler' | 'recurrence' | 'series' | 'group' | 'readout'",
            "description": "Which of the sixteen temporal controls to render. Defaults to the date field. A month grid. `range` is two clicks, `multiple` is a capped set. A span of days: two typeable ends, a two-month panel, named periods. A date of birth, with its own precision and absence handling. A time of day, with optional organisation presets. A start, an end and a derived duration that may cross midnight. A start time, an end time, and a derived length. A grid of bookable times. Provider, date and slot, resolved together. A recurrence rule, expressed in words and emitted as RRULE. A recurring series with its conflicts resolved one occurrence at a time. A recurring group with capacity, facilitators and a room. The read-only record rendering. Not an input.",
            "required": false
          }
        ]
      },
      {
        "name": "DateField",
        "props": [
          {
            "name": "calendarCommit",
            "type": "'immediate' | 'explicit'",
            "description": "Whether the popover reports a day the moment it is clicked, or holds it behind Cancel and Done. `immediate` by default: one click is the whole answer for a single date, and a second press to confirm it is a press.",
            "required": false
          },
          {
            "name": "calendarFooter",
            "type": "React.ReactNode",
            "description": "Rendered under the popover grid — relative-date chips, a clear action.",
            "required": false
          },
          {
            "name": "calendarHints",
            "type": "boolean",
            "description": "Shows the arrow-key legend under the popover grid.",
            "required": false
          },
          {
            "name": "calendarMonths",
            "type": "number",
            "description": "Months shown side by side in the popover calendar.",
            "required": false
          },
          {
            "name": "calendarShortcuts",
            "type": "readonly DateShortcut[]",
            "description": "Named dates down the side of the popover calendar — \"Today\", \"Next Monday\". A rail rather than a row of chips under the grid, because it is a second way into the same answer and belongs beside the grid rather than after it. `relativeDateOptions(now)` is the general set; drop what your field has no use for. \"Tomorrow\" on a date of service is noise.",
            "required": false
          },
          {
            "name": "calendarShowCustom",
            "type": "boolean",
            "description": "Offers \"Custom\" above the rail, pressed when the value matches nothing in it.",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "ZbDate | null",
            "description": "Uncontrolled initial value. Pass this **or** `value`, never both. There is deliberately no runtime warning: ADR 0009 forbids component source writing to the console at all, because a component that logs is one error-reporting integration away from putting a date of birth in a third party's index. When both are passed, `value` wins — the ordinary React contract.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader may still need to read.",
            "required": false
          },
          {
            "name": "error",
            "type": "React.ReactNode",
            "description": "A host-supplied error. Overrides the field's own policy message.",
            "required": false
          },
          {
            "name": "futurePolicy",
            "type": "TemporalPolicy",
            "description": "What a future date means here — allowed, warned about, or refused. A date of birth and an appointment want opposite answers.",
            "required": false
          },
          {
            "name": "hint",
            "type": "React.ReactNode",
            "description": "Advisory text under the field. Never announced assertively.",
            "required": false
          },
          {
            "name": "invalid",
            "type": "boolean",
            "description": "Renders the invalid styling and sets `aria-invalid`. Pair with `error` so the reason is stated, not merely coloured.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "The field's visible label, and its accessible name.",
            "required": false
          },
          {
            "name": "load",
            "type": "((date: ZbDate) => number | null)",
            "description": "Forwarded to the popover calendar — open-slot count under the numeral.",
            "required": false
          },
          {
            "name": "max",
            "type": "ZbDate",
            "description": "Latest selectable date, inclusive.",
            "required": false
          },
          {
            "name": "min",
            "type": "ZbDate",
            "description": "Earliest selectable date, inclusive. Dates before it are refused with a spoken reason rather than silently ignored.",
            "required": false
          },
          {
            "name": "name",
            "type": "string",
            "description": "Form field name, for an uncontrolled submit.",
            "required": false
          },
          {
            "name": "now",
            "type": "ZbDate",
            "description": "Today, supplied by the host. Required wherever a policy or a relative label is in play, because ENGINEERING.md §9 forbids a component reading the wall clock to decide what to render — output that depends on when it rendered cannot be visually regression-tested, and server and client would disagree on the boundary between one day and the next.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((value: ZbDate | null) => void)",
            "description": "Fired on every complete, valid date, and with `null` when the field is cleared. Never fired mid-typing.",
            "required": false
          },
          {
            "name": "optional",
            "type": "boolean",
            "description": "Renders \"Optional\" beside the label. An unmarked field is ambiguous.",
            "required": false
          },
          {
            "name": "order",
            "type": "DateOrder",
            "description": "Segment order. From the locale, never guessed.",
            "required": false
          },
          {
            "name": "pastPolicy",
            "type": "TemporalPolicy",
            "description": "What a past date means here. The mirror of `futurePolicy`, and just as rarely the same.",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean",
            "description": "Readable and focusable but not editable — the right prop for a value governed by policy or record state.",
            "required": false
          },
          {
            "name": "required",
            "type": "boolean",
            "description": "Marks the field required and announces it. Does not itself validate.",
            "required": false
          },
          {
            "name": "showCalendar",
            "type": "boolean",
            "description": "Puts a calendar behind a trigger button at the end of the field. Off by default, and that default is the component's argument rather than an oversight: the field is the common case and the calendar is the rare one. `variant=\"picker\"` turns it on; `variant=\"field\"` leaves it off.",
            "required": false
          },
          {
            "name": "showRelative",
            "type": "boolean",
            "description": "Show \"Today\", \"5 days ago\" under a complete value. Needs `now`.",
            "required": false
          },
          {
            "name": "twoDigitYearPivot",
            "type": "number",
            "description": "Two-digit years above this resolve to the 1900s, at or below to the 2000s. Only reachable through a paste — the year segment takes four digits — but pastes are how clinical dates actually move between systems, and a sliding window would make the same pasted text mean different things in different years. Defaults to 30.",
            "required": false
          },
          {
            "name": "unavailable",
            "type": "((date: ZbDate) => string | null)",
            "description": "Forwarded to the popover calendar — the reason a day cannot be chosen.",
            "required": false
          },
          {
            "name": "value",
            "type": "ZbDate | null",
            "description": "Controlled value. Pass `null` for empty, never `undefined`.",
            "required": false
          },
          {
            "name": "weekStart",
            "type": "number",
            "description": "0 = Sunday. Forwarded to the popover calendar.",
            "required": false
          }
        ]
      },
      {
        "name": "Calendar",
        "props": [
          {
            "name": "cancelLabel",
            "type": "string",
            "description": "The word on the dismissing action. Translate it; do not leave it English.",
            "required": false
          },
          {
            "name": "commit",
            "type": "'immediate' | 'explicit'",
            "description": "When the selection reaches the host. `immediate` — the default and the existing behaviour — reports every click. `explicit` holds a draft behind Cancel and Done, which is what a range wants: a mis-clicked start is corrected by clicking again, and a parent that has already been told about it has already filtered a report on a range nobody chose.",
            "required": false
          },
          {
            "name": "dates",
            "type": "ZbDate[]",
            "description": "The selected dates, controlled. Only meaningful in `mode=\"multiple\"`.",
            "required": false
          },
          {
            "name": "defaultDates",
            "type": "ZbDate[]",
            "description": "The dates on first render, uncontrolled. Pass this or `dates`, never both.",
            "required": false
          },
          {
            "name": "defaultMonth",
            "type": "MonthRef",
            "description": "The month shown on first render, uncontrolled. Defaults to the month of the value, or of `now`.",
            "required": false
          },
          {
            "name": "defaultRange",
            "type": "DateRangeValue | null",
            "description": "The range on first render, uncontrolled. Pass this or `range`, never both. `value` has had `defaultValue` since the beginning and the other two modes did not, which made an uncontrolled range or multi-date calendar unable to open on anything but empty — a filter that remembers last month's period had to be controlled for no other reason.",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "ZbDate | null",
            "description": "Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass both.",
            "required": false
          },
          {
            "name": "doneLabel",
            "type": "string",
            "description": "The word on the committing action.",
            "required": false
          },
          {
            "name": "fluid",
            "type": "boolean",
            "description": "Fills its container rather than sitting at its natural 252px.",
            "required": false
          },
          {
            "name": "footer",
            "type": "React.ReactNode",
            "description": "Rendered under the grid — relative-date chips, a clear action.",
            "required": false
          },
          {
            "name": "hints",
            "type": "boolean",
            "description": "Shows the arrow-key legend in the footer. `aria-hidden`, deliberately: a screen-reader user is told how to drive a grid by the grid, and repeating it in the footer is one more thing to page past. It is a discoverability aid for people who can see it and would otherwise never learn the calendar has a keyboard.",
            "required": false
          },
          {
            "name": "load",
            "type": "((date: ZbDate) => number | null)",
            "description": "Open-slot count under the numeral, so density is visible before a click.",
            "required": false
          },
          {
            "name": "max",
            "type": "ZbDate",
            "description": "Latest selectable date, inclusive.",
            "required": false
          },
          {
            "name": "maxDates",
            "type": "number",
            "description": "Cap for `mode=\"multiple\"`. Further dates are refused, never dialogued.",
            "required": false
          },
          {
            "name": "min",
            "type": "ZbDate",
            "description": "Earliest selectable date, inclusive.",
            "required": false
          },
          {
            "name": "mode",
            "type": "CalendarMode",
            "description": "`single` is the default. `range` is two clicks; there is no drag path.",
            "required": false
          },
          {
            "name": "month",
            "type": "MonthRef",
            "description": "The month on screen. Uncontrolled when omitted.",
            "required": false
          },
          {
            "name": "monthLabel",
            "type": "((month: MonthRef) => string)",
            "description": "Overrides the rendered month heading, for a host that formats it differently from the default.",
            "required": false
          },
          {
            "name": "monthNames",
            "type": "readonly string[]",
            "description": "Full month names, for the header and for each cell's accessible name.",
            "required": false
          },
          {
            "name": "months",
            "type": "number",
            "description": "How many months to show at once, 1–4. Two is what a range wants: most ranges cross a month boundary, and choosing an end you cannot see is how a range picker ends up needing three attempts.",
            "required": false
          },
          {
            "name": "now",
            "type": "ZbDate | null",
            "description": "The day marked \"today\". Required to mark one — the component reads no clock, so a calendar without `now` simply has no today, which is correct for a historical picker and deliberate everywhere else.",
            "required": false
          },
          {
            "name": "onCancel",
            "type": "(() => void)",
            "description": "Fired when an `explicit` calendar is dismissed without committing.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((value: ZbDate | null) => void)",
            "description": "Fired when a single date is chosen. Only meaningful in `mode=\"single\"`.",
            "required": false
          },
          {
            "name": "onCommit",
            "type": "(() => void)",
            "description": "Fired after Done, with the value that was committed.",
            "required": false
          },
          {
            "name": "onDatesChange",
            "type": "((dates: ZbDate[]) => void)",
            "description": "Fired whenever the multiple-selection set changes.",
            "required": false
          },
          {
            "name": "onMonthChange",
            "type": "((month: MonthRef) => void)",
            "description": "Fired when the reader pages the grid. Use it to fetch availability for the month coming into view.",
            "required": false
          },
          {
            "name": "onRangeChange",
            "type": "((range: DateRangeValue) => void)",
            "description": "Fired when a range completes — on the second click, not the first.",
            "required": false
          },
          {
            "name": "presets",
            "type": "readonly DateRangePreset[]",
            "description": "Named periods down the side — \"This month\", \"Last week\". Data rather than a boolean, because the right seven periods for a billing report and for an authorisation window are not the same seven, and a component that decides is a component every host has to work around. `dateRangePresets(now)` is the general set; drop what does not apply. Only meaningful in `mode=\"range\"`.",
            "required": false
          },
          {
            "name": "range",
            "type": "DateRangeValue | null",
            "description": "The selected range, controlled. Only meaningful in `mode=\"range\"`.",
            "required": false
          },
          {
            "name": "shortcuts",
            "type": "readonly DateShortcut[]",
            "description": "Named single dates down the side — \"Today\", \"Next Monday\". The single-date half of the same rail, for `mode=\"single\"` and `mode=\"multiple\"`; `range` reads `presets` instead. Data for the same reason: \"Next Monday\" is a scheduling convention, and a component that ships one has decided what your clinic's week looks like. `relativeDateOptions(now)` is the general set. In `multiple` a shortcut toggles rather than replaces, because that is what every other press in that mode does.",
            "required": false
          },
          {
            "name": "showCustomPreset",
            "type": "boolean",
            "description": "Offers a \"Custom\" entry above the rail, pressed whenever the selection matches nothing in it. Without it a reader who has built their own selection sees a rail with nothing selected and no way to read their own state. Pressing it clears the selection, so the next click in the grid starts fresh. That is what \"I will pick my own\" means here, and it is the only reading that leaves the rail and the grid agreeing about the state.",
            "required": false
          },
          {
            "name": "unavailable",
            "type": "((date: ZbDate) => string | null)",
            "description": "The reason a date cannot be chosen, or null. A string rather than a boolean because the reason is spoken and shown. One muted treatment covers every reason; five colours would be five things to learn and still illegible to a colour-blind reader.",
            "required": false
          },
          {
            "name": "value",
            "type": "ZbDate | null",
            "description": "Controlled value. Pass `null` for empty, never `undefined`.",
            "required": false
          },
          {
            "name": "weekdayLabels",
            "type": "readonly string[]",
            "description": "The two-letter column headings. Visual only — each cell still carries its full weekday name for a screen reader.",
            "required": false
          },
          {
            "name": "weekdayNames",
            "type": "readonly string[]",
            "description": "Full weekday names, used in each cell's accessible name. Supply both these and `weekdayLabels` for any language that is not English.",
            "required": false
          },
          {
            "name": "weekStart",
            "type": "number",
            "description": "0 = Sunday. From `Intl.Locale.getWeekInfo`, never hardcoded.",
            "required": false
          }
        ]
      },
      {
        "name": "DateRangeField",
        "props": [
          {
            "name": "commit",
            "type": "'immediate' | 'explicit'",
            "description": "When the panel reports its selection. `explicit` by default — see above.",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "DateRangeValue | null",
            "description": "Uncontrolled initial value. Pass this or `value`, never both.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "endLabel",
            "type": "string",
            "description": "Accessible name for the end half.",
            "required": false
          },
          {
            "name": "error",
            "type": "string",
            "description": "A host-supplied error. Outranks everything the field works out for itself.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string",
            "description": "An advisory shown under the field when there is nothing more urgent to say.",
            "required": false
          },
          {
            "name": "hints",
            "type": "boolean",
            "description": "Shows the arrow-key legend under the panel's grid.",
            "required": false
          },
          {
            "name": "invalid",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "load",
            "type": "((date: ZbDate) => number | null)",
            "description": "Open-slot count under each numeral.",
            "required": false
          },
          {
            "name": "max",
            "type": "ZbDate",
            "description": "Latest selectable date, inclusive.",
            "required": false
          },
          {
            "name": "maxSpanDays",
            "type": "number",
            "description": "Refuses — with a spoken reason — any range longer than this many days.",
            "required": false
          },
          {
            "name": "min",
            "type": "ZbDate",
            "description": "Earliest selectable date, inclusive.",
            "required": false
          },
          {
            "name": "minSpanDays",
            "type": "number",
            "description": "Refuses any range shorter than this many days.",
            "required": false
          },
          {
            "name": "months",
            "type": "number",
            "description": "Months shown side by side in the panel. Two by default, which is what a range wants.",
            "required": false
          },
          {
            "name": "name",
            "type": "string",
            "description": "Posts `${name}-start` and `${name}-end` as ISO dates in a plain HTML form.",
            "required": false
          },
          {
            "name": "now",
            "type": "ZbDate",
            "description": "Today, supplied by the host. Nothing here reads a clock.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((range: DateRangeValue) => void)",
            "description": "Fired when either end changes — by typing, by the calendar, or by a preset.",
            "required": false
          },
          {
            "name": "optional",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "order",
            "type": "DateOrder",
            "description": "Segment order. Match the locale, not the developer's.",
            "required": false
          },
          {
            "name": "presets",
            "type": "readonly DateRangePreset[]",
            "description": "Named periods down the side of the panel. `dateRangePresets(now)` is the general set.",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "required",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "showCalendar",
            "type": "boolean",
            "description": "Offers the calendar panel. On by default.",
            "required": false
          },
          {
            "name": "showCustomPreset",
            "type": "boolean",
            "description": "Offers \"Custom\", pressed whenever the selection matches no preset.",
            "required": false
          },
          {
            "name": "showSpan",
            "type": "boolean",
            "description": "Shows the day count beside the value. Inclusive of both ends, because a range of service from the 1st to the 7th is seven days of care. It is the field's own proof-read: a transposed month is invisible in 03/07 – 07/07 and screaming in \"123 days\".",
            "required": false
          },
          {
            "name": "startLabel",
            "type": "string",
            "description": "Accessible name for the start half. Both halves need one; \"Date\" twice is a riddle.",
            "required": false
          },
          {
            "name": "unavailable",
            "type": "((date: ZbDate) => string | null)",
            "description": "The reason a date cannot be chosen, or null. Spoken, not just dimmed.",
            "required": false
          },
          {
            "name": "value",
            "type": "DateRangeValue | null",
            "description": "Controlled value. Either end may be null; an incomplete range is a legal state.",
            "required": false
          },
          {
            "name": "weekStart",
            "type": "number",
            "description": "0 = Sunday. From `Intl.Locale.getWeekInfo`, never hardcoded.",
            "required": false
          }
        ]
      },
      {
        "name": "TimeField",
        "props": [
          {
            "name": "defaultValue",
            "type": "ZbTime | null",
            "description": "Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass both.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader may still need to read.",
            "required": false
          },
          {
            "name": "error",
            "type": "React.ReactNode",
            "description": "The validation message. Announced, and it replaces the hint rather than stacking under it.",
            "required": false
          },
          {
            "name": "hint",
            "type": "React.ReactNode",
            "description": "Guidance under the field, associated with it so assistive technology reads it as part of the field.",
            "required": false
          },
          {
            "name": "hour24",
            "type": "boolean",
            "description": "24-hour display. The stored value is 24-hour either way.",
            "required": false
          },
          {
            "name": "invalid",
            "type": "boolean",
            "description": "Renders the invalid styling and sets `aria-invalid`. Pair with `error` so the reason is stated, not merely coloured.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "The field's visible label, and its accessible name.",
            "required": false
          },
          {
            "name": "max",
            "type": "ZbTime",
            "description": "Latest selectable time, inclusive.",
            "required": false
          },
          {
            "name": "min",
            "type": "ZbTime",
            "description": "Earliest selectable time, inclusive.",
            "required": false
          },
          {
            "name": "name",
            "type": "string",
            "description": "Form field name, for an uncontrolled submit.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((value: ZbTime | null) => void)",
            "description": "Fired on every complete time, and with `null` when cleared.",
            "required": false
          },
          {
            "name": "optional",
            "type": "boolean",
            "description": "Marks the field explicitly optional. Use where most fields on the form are required and the exception needs saying.",
            "required": false
          },
          {
            "name": "presetLabel",
            "type": "string",
            "description": "The heading above the preset chips. Name them for what they are — “Clinic slots”, not “Presets”.",
            "required": false
          },
          {
            "name": "presets",
            "type": "readonly number[]",
            "description": "Times offered as one-press chips — the organisation's own grid. Minutes past midnight, so `[480, 495, 510]` is 8:00, 8:15, 8:30. A psychiatry clinic on twenty-minute follow-ups and a therapy practice on fifty-three-minute sessions are the same component with different data.",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean",
            "description": "Readable and focusable but not editable — the right prop for a value governed by policy or record state.",
            "required": false
          },
          {
            "name": "required",
            "type": "boolean",
            "description": "Marks the field required and announces it. Does not itself validate.",
            "required": false
          },
          {
            "name": "showSecond",
            "type": "boolean",
            "description": "A seconds segment. Off by default; on for a code call or a restraint.",
            "required": false
          },
          {
            "name": "value",
            "type": "ZbTime | null",
            "description": "Controlled value. Pass `null` for empty, never `undefined`.",
            "required": false
          }
        ]
      },
      {
        "name": "TimeRangeField",
        "props": [
          {
            "name": "allowOvernight",
            "type": "boolean",
            "description": "Lets the end precede the start, meaning the next day. A night shift is 22:00 to 06:00 and refusing it corrupts the data the refusal was protecting. Off by default, because an appointment that ends before it starts is almost always a typo.",
            "required": false
          },
          {
            "name": "cancelLabel",
            "type": "string",
            "description": "The word on the dismissing action. Translate it; do not leave it English.",
            "required": false
          },
          {
            "name": "commit",
            "type": "'immediate' | 'explicit'",
            "description": "When the panel reports its selection. `explicit` by default.",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "ZbTimeRange | null",
            "description": "Uncontrolled initial value. Pass this or `value`, never both.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "doneLabel",
            "type": "string",
            "description": "The word on the committing action.",
            "required": false
          },
          {
            "name": "endLabel",
            "type": "string",
            "description": "Accessible name and column heading for the end half.",
            "required": false
          },
          {
            "name": "error",
            "type": "string",
            "description": "A host-supplied error. Outranks anything the field works out for itself.",
            "required": false
          },
          {
            "name": "fromMinutes",
            "type": "number",
            "description": "First time offered in the columns, in minutes from midnight.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string",
            "description": "An advisory shown under the field when there is nothing more urgent to say.",
            "required": false
          },
          {
            "name": "hour24",
            "type": "boolean",
            "description": "24-hour display. The stored value is 24-hour either way.",
            "required": false
          },
          {
            "name": "invalid",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "maxDurationMinutes",
            "type": "number",
            "description": "The longest span that may be chosen.",
            "required": false
          },
          {
            "name": "minDurationMinutes",
            "type": "number",
            "description": "The shortest span that may be chosen.",
            "required": false
          },
          {
            "name": "name",
            "type": "string",
            "description": "Posts `${name}-start` and `${name}-end` as 24-hour HH:MM in a plain HTML form.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((range: ZbTimeRange) => void)",
            "description": "Fired when either end changes.",
            "required": false
          },
          {
            "name": "optional",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "required",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "showDuration",
            "type": "boolean",
            "description": "Shows the derived length beside the value. On by default — it is the proof-read.",
            "required": false
          },
          {
            "name": "showPanel",
            "type": "boolean",
            "description": "Offers the two-column panel. On by default.",
            "required": false
          },
          {
            "name": "startLabel",
            "type": "string",
            "description": "Accessible name and column heading for the start half.",
            "required": false
          },
          {
            "name": "stepMinutes",
            "type": "number",
            "description": "The interval between offered times. 30 by default; 15 for a clinic that books quarters.",
            "required": false
          },
          {
            "name": "toMinutes",
            "type": "number",
            "description": "Last time offered, in minutes from midnight.",
            "required": false
          },
          {
            "name": "value",
            "type": "ZbTimeRange | null",
            "description": "Controlled value. Either end may be null.",
            "required": false
          }
        ]
      },
      {
        "name": "SessionTimeField",
        "props": [
          {
            "name": "allowOvernight",
            "type": "boolean",
            "description": "Whether an end at or before the start is read as the next day.",
            "required": false
          },
          {
            "name": "bands",
            "type": "readonly DurationBand[]",
            "description": "Bands a duration is reported against — the organisation's own thresholds. Rendered, never asserted, and never used to recommend anything.",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "SessionInterval | null",
            "description": "Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass both.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader may still need to read.",
            "required": false
          },
          {
            "name": "durationLabel",
            "type": "string",
            "description": "Label for the derived duration. Derived and editable — typing a duration moves the end, not the start.",
            "required": false
          },
          {
            "name": "durationPresets",
            "type": "readonly DurationPreset[]",
            "description": "Durations offered as one-press chips. Organisation configuration. Behavioural health does not run on a tidy 15/30/45/60 ladder, and a component that ships one has made an assumption about somebody's contract.",
            "required": false
          },
          {
            "name": "endLabel",
            "type": "string",
            "description": "Label for the end segment.",
            "required": false
          },
          {
            "name": "error",
            "type": "React.ReactNode",
            "description": "The validation message. Announced, and it replaces the hint rather than stacking under it.",
            "required": false
          },
          {
            "name": "hour24",
            "type": "boolean",
            "description": "24-hour display. The stored interval is 24-hour either way.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "The field's visible label, and its accessible name.",
            "required": false
          },
          {
            "name": "maxMinutes",
            "type": "number",
            "description": "Upper bound on a derived duration. Eight hours by default. Not a clamp. A start dragged past a held end is the one way to reach an absurd duration, and the component says so and offers the likeliest correction rather than quietly rounding the value into range.",
            "required": false
          },
          {
            "name": "nextDateLabel",
            "type": "string",
            "description": "How a session crossing midnight is labelled — “next day” by default. The crossing is a value, not a warning.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((value: SessionInterval) => void)",
            "description": "Fired whenever start, end or duration changes. The interval is always internally consistent when it fires.",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean",
            "description": "Readable and focusable but not editable — the right prop for a value governed by policy or record state.",
            "required": false
          },
          {
            "name": "startDateLabel",
            "type": "string",
            "description": "The date the session starts on, so the next-day badge can name a day.",
            "required": false
          },
          {
            "name": "startLabel",
            "type": "string",
            "description": "Label for the start segment.",
            "required": false
          },
          {
            "name": "value",
            "type": "SessionInterval | null",
            "description": "Controlled value. Pass `null` for empty, never `undefined`.",
            "required": false
          }
        ]
      },
      {
        "name": "BirthDateField",
        "props": [
          {
            "name": "now",
            "type": "ZbDate",
            "description": "Today, supplied by the host. The age and the future check both need it.",
            "required": true
          },
          {
            "name": "absentReason",
            "type": "TemporalAbsence",
            "description": "Why no date is recorded. A date of birth that is missing and one that was refused are different facts about the record.",
            "required": false
          },
          {
            "name": "allowAbsent",
            "type": "boolean",
            "description": "Offers \"Not recorded\", which emits an absent value carrying a reason.",
            "required": false
          },
          {
            "name": "allowEstimated",
            "type": "boolean",
            "description": "Offers \"Exact date unknown\", which switches the field to year only.",
            "required": false
          },
          {
            "name": "calendarCommit",
            "type": "'immediate' | 'explicit'",
            "description": "Whether the popover reports a day the moment it is clicked, or holds it behind Cancel and Done. `immediate` by default.",
            "required": false
          },
          {
            "name": "calendarHints",
            "type": "boolean",
            "description": "Shows the arrow-key legend under the popover grid. Worth more here than anywhere else in this family: a birth date is the one calendar a reader may genuinely have to travel four hundred months in, and Shift+PageUp is the difference between that and one press.",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "BirthDateValue",
            "description": "Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass both.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader may still need to read.",
            "required": false
          },
          {
            "name": "error",
            "type": "React.ReactNode",
            "description": "The validation message. Announced, and it replaces the hint rather than stacking under it.",
            "required": false
          },
          {
            "name": "hideAge",
            "type": "boolean",
            "description": "Hide the age readout. Rarely right — it is the field's own error check.",
            "required": false
          },
          {
            "name": "hint",
            "type": "React.ReactNode",
            "description": "Guidance under the field, associated with it so assistive technology reads it as part of the field.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "The field's visible label, and its accessible name.",
            "required": false
          },
          {
            "name": "name",
            "type": "string",
            "description": "Form field name, for an uncontrolled submit.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((value: BirthDateValue) => void)",
            "description": "Fired with the whole birth-date value, which carries its precision and any absence reason alongside the date.",
            "required": false
          },
          {
            "name": "onPrecisionChange",
            "type": "((precision: BirthDatePrecision) => void)",
            "description": "Fired when the reader downgrades precision, e.g. choosing “Exact date unknown”.",
            "required": false
          },
          {
            "name": "order",
            "type": "DateOrder",
            "description": "Segment order — from the locale, never guessed. A US and a UK intake form disagree, and getting it wrong silently swaps day and month.",
            "required": false
          },
          {
            "name": "precision",
            "type": "BirthDatePrecision",
            "description": "How exactly the date is known — full, month, or year. Controlled; pair with `onPrecisionChange`.",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean",
            "description": "Readable and focusable but not editable — the right prop for a value governed by policy or record state.",
            "required": false
          },
          {
            "name": "required",
            "type": "boolean",
            "description": "Marks the field required and announces it. Does not itself validate.",
            "required": false
          },
          {
            "name": "suggested",
            "type": "ZbDate",
            "description": "A value already on file, offered as a one-press fill. WCAG 2.2 SC 3.3.7 asks that previously entered information be available rather than re-typed — intake asks for a date of birth two and three times. Offered rather than applied, because silently pre-filling a legal attestation is a different defect from making somebody type it twice.",
            "required": false
          },
          {
            "name": "twoDigitYearPivot",
            "type": "number",
            "description": "The year two-digit input pivots on. Below it reads as 20xx, at or above as 19xx.",
            "required": false
          },
          {
            "name": "value",
            "type": "BirthDateValue",
            "description": "Controlled value. Pass `null` for empty, never `undefined`.",
            "required": false
          }
        ]
      },
      {
        "name": "ClinicalDateTime",
        "props": [
          {
            "name": "value",
            "type": "ZbTemporal | null",
            "description": "Any member of the temporal value space, including absence.",
            "required": true
          },
          {
            "name": "as",
            "type": "'time' | 'span' | 'div'",
            "description": "Wrapping element. `time` where the value is a real instant.",
            "required": false
          },
          {
            "name": "hour24",
            "type": "boolean",
            "description": "24-hour display. The recorded value is 24-hour either way.",
            "required": false
          },
          {
            "name": "now",
            "type": "ZbDate",
            "description": "Today, for the relative aid. Omit it and no relative label is rendered.",
            "required": false
          },
          {
            "name": "restricted",
            "type": "boolean",
            "description": "Marks a value the reader's access level hides rather than removes.",
            "required": false
          },
          {
            "name": "showRelative",
            "type": "boolean",
            "description": "Show \"5 days ago\" beside the value.",
            "required": false
          },
          {
            "name": "showZone",
            "type": "boolean",
            "description": "Print the stored instant and its zone underneath. On for anything a signature depends on. It survives print, which is where a great many of these values are actually read.",
            "required": false
          },
          {
            "name": "viewerZone",
            "type": "string",
            "description": "The reader's own zone. A second line appears only if it differs.",
            "required": false
          }
        ]
      },
      {
        "name": "TimeSlotGrid",
        "props": [
          {
            "name": "set",
            "type": "AvailabilitySet",
            "description": "Availability as the host read it. Never fetched here.",
            "required": true
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "Disables the whole grid. Individual slot availability comes from the slot data, not from here.",
            "required": false
          },
          {
            "name": "emptyState",
            "type": "React.ReactNode",
            "description": "Rendered when there is nothing to choose.",
            "required": false
          },
          {
            "name": "hour24",
            "type": "boolean",
            "description": "24-hour display.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "Group label, read by assistive technology before the times.",
            "required": false
          },
          {
            "name": "now",
            "type": "{ date: ZbDate; time: ZbTime; }",
            "description": "The clock, injected. Staleness is measured against it.",
            "required": false
          },
          {
            "name": "onRefresh",
            "type": "(() => void)",
            "description": "Offered when the set is stale. Absent means refreshing is not possible.",
            "required": false
          },
          {
            "name": "onSelect",
            "type": "((slot: Slot) => void)",
            "description": "Fired with the chosen slot. A slot that is taken is rendered and disabled rather than removed, so the grid does not reflow under the reader's cursor.",
            "required": false
          },
          {
            "name": "value",
            "type": "string | null",
            "description": "Selected slot id. Ids are stable across a refresh on purpose.",
            "required": false
          }
        ]
      },
      {
        "name": "RecurrenceField",
        "props": [
          {
            "name": "startDate",
            "type": "ZbDate",
            "description": "The first occurrence. The rule is meaningless without one.",
            "required": true
          },
          {
            "name": "allowNoEnd",
            "type": "boolean",
            "description": "Whether \"no end date\" may be chosen at all.",
            "required": false
          },
          {
            "name": "countOptions",
            "type": "readonly number[]",
            "description": "Session counts a practice offers. Configuration, not a ladder we chose.",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "RecurrenceRule",
            "description": "Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass both.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader may still need to read.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "The field's visible label, and its accessible name.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((rule: RecurrenceRule) => void)",
            "description": "Fired with the recurrence rule whenever any part of it changes.",
            "required": false
          },
          {
            "name": "onExpand",
            "type": "((dates: ZbDate[]) => void)",
            "description": "Emitted whenever the expansion changes, so a host can check conflicts.",
            "required": false
          },
          {
            "name": "previewCount",
            "type": "number",
            "description": "How far the preview expands. Bounded twice; this is the softer bound.",
            "required": false
          },
          {
            "name": "showRRule",
            "type": "boolean",
            "description": "Shows the generated RFC 5545 RRULE. For an integrator checking what the control produces, not for a clinician.",
            "required": false
          },
          {
            "name": "timeLabel",
            "type": "string",
            "description": "Rendered into the sentence — \"at 3:00 PM\".",
            "required": false
          },
          {
            "name": "unsupported",
            "type": "{ source: string; parts: string[]; } | null",
            "description": "A rule imported from elsewhere that this component cannot express. Rendered read-only with the original string. Refusing is the feature: a general expander that drops what it does not understand is worse.",
            "required": false
          },
          {
            "name": "value",
            "type": "RecurrenceRule",
            "description": "Controlled value. Pass `null` for empty, never `undefined`.",
            "required": false
          }
        ]
      },
      {
        "name": "AppointmentScheduler",
        "props": [
          {
            "name": "availability",
            "type": "AvailabilitySet",
            "description": "Bookable slots for the current provider and date. Absence of a slot is not the same as a slot that is taken, and the grid draws both.",
            "required": true
          },
          {
            "name": "now",
            "type": "{ date: ZbDate; time: ZbTime; }",
            "description": "The clock, injected. Staleness and the strip both need it.",
            "required": true
          },
          {
            "name": "providers",
            "type": "readonly SchedulableActor[]",
            "description": "The people who can be booked. Each carries its own availability; the grid is the intersection of provider, date and duration.",
            "required": true
          },
          {
            "name": "actorId",
            "type": "string",
            "description": "Controlled actor. Uncontrolled falls back to the first.",
            "required": false
          },
          {
            "name": "buffers",
            "type": "Buffers",
            "description": "Time held before and after each appointment. Rendered, so the reader can see why an apparently free slot is not offered.",
            "required": false
          },
          {
            "name": "date",
            "type": "ZbDate",
            "description": "The day whose slots are shown.",
            "required": false
          },
          {
            "name": "dayLoads",
            "type": "readonly DayLoad[]",
            "description": "Open counts for the strip. The host supplies these; nothing is derived.",
            "required": false
          },
          {
            "name": "durationMinutes",
            "type": "number",
            "description": "How long the appointment being booked is. Changes which slots can accommodate it.",
            "required": false
          },
          {
            "name": "horizonDays",
            "type": "number",
            "description": "How many days the strip shows.",
            "required": false
          },
          {
            "name": "hour24",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "The field's visible label, and its accessible name.",
            "required": false
          },
          {
            "name": "onActorChange",
            "type": "((actorId: string) => void)",
            "description": "Fired when the reader switches provider, so the host can fetch that provider's availability.",
            "required": false
          },
          {
            "name": "onDateChange",
            "type": "((date: ZbDate) => void)",
            "description": "Fired when the reader moves to another day.",
            "required": false
          },
          {
            "name": "onHoldExpired",
            "type": "((slot: Slot) => void)",
            "description": "A hold that ran out while the form was open.",
            "required": false
          },
          {
            "name": "onRefresh",
            "type": "(() => void)",
            "description": "",
            "required": false
          },
          {
            "name": "onRequestAvailability",
            "type": "((query: AvailabilityQuery) => void)",
            "description": "Called whenever the question changes. The host does the loading.",
            "required": false
          },
          {
            "name": "onSelect",
            "type": "((choice: { actor: SchedulableActor; date: ZbDate; slot: Slot; }) => void)",
            "description": "Fired with the chosen slot. Booking itself is the host's, because it needs a write the component cannot make.",
            "required": false
          },
          {
            "name": "rejection",
            "type": "SelectionRejection | null",
            "description": "The server said no. Rendered with its alternatives.",
            "required": false
          },
          {
            "name": "value",
            "type": "string | null",
            "description": "",
            "required": false
          },
          {
            "name": "viewerZone",
            "type": "string",
            "description": "The viewer's own zone. A second line appears only when it differs.",
            "required": false
          }
        ]
      },
      {
        "name": "RecurringSeriesScheduler",
        "props": [
          {
            "name": "rule",
            "type": "RecurrenceRule",
            "description": "The recurrence rule the series expands from.",
            "required": true
          },
          {
            "name": "startDate",
            "type": "ZbDate",
            "description": "",
            "required": true
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader may still need to read.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "The field's visible label, and its accessible name.",
            "required": false
          },
          {
            "name": "onBook",
            "type": "((dates: ZbDate[]) => void)",
            "description": "Fired with the whole resolved series. Nothing is booked until every conflict is resolved or explicitly kept.",
            "required": false
          },
          {
            "name": "onExpand",
            "type": "((dates: ZbDate[]) => void)",
            "description": "",
            "required": false
          },
          {
            "name": "onResolve",
            "type": "((isoDate: string, to: ZbDate) => void)",
            "description": "Fired when the reader moves or drops one occurrence that conflicts. The series is edited per occurrence, never regenerated.",
            "required": false
          },
          {
            "name": "onResolveAll",
            "type": "(() => void)",
            "description": "Resolve every conflict that carries an alternative, in one press.",
            "required": false
          },
          {
            "name": "onUnresolve",
            "type": "((isoDate: string) => void)",
            "description": "Fired when the reader undoes a resolution and restores the original occurrence.",
            "required": false
          },
          {
            "name": "resolved",
            "type": "ReadonlySet<string>",
            "description": "ISO dates the user has already resolved.",
            "required": false
          },
          {
            "name": "timeLabel",
            "type": "string",
            "description": "Rendered into the sentence and each row — \"3:00 PM – 3:53 PM\".",
            "required": false
          },
          {
            "name": "verdicts",
            "type": "readonly OccurrenceVerdict[]",
            "description": "The host's answers. Absent means nothing has been checked yet.",
            "required": false
          },
          {
            "name": "visibleRows",
            "type": "number",
            "description": "How many rows to show before collapsing. The rest are counted.",
            "required": false
          }
        ]
      },
      {
        "name": "GroupSeriesScheduler",
        "props": [
          {
            "name": "name",
            "type": "string",
            "description": "",
            "required": true
          },
          {
            "name": "rule",
            "type": "RecurrenceRule",
            "description": "",
            "required": true
          },
          {
            "name": "startDate",
            "type": "ZbDate",
            "description": "",
            "required": true
          },
          {
            "name": "capacity",
            "type": "number",
            "description": "How many places the group has. Shown against enrolment, because a group at capacity is a scheduling fact and not an error.",
            "required": false
          },
          {
            "name": "enrolled",
            "type": "number",
            "description": "Who is already enrolled. Counted against `capacity` and listed, so the reader can see who they are adding to.",
            "required": false
          },
          {
            "name": "exclusions",
            "type": "readonly SeriesExclusion[]",
            "description": "Dates the group does not meet. Folded into the rule as EXDATE.",
            "required": false
          },
          {
            "name": "facilitators",
            "type": "readonly string[]",
            "description": "Who runs the group. Their availability constrains the series in the same way a provider's does.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "modality",
            "type": "string",
            "description": "In-person, telehealth, or both. Rendered; never inferred.",
            "required": false
          },
          {
            "name": "room",
            "type": "{ name: string; capacity?: number; }",
            "description": "Where it meets. A room is a resource with its own availability, and double-booking one is the most common group-scheduling failure.",
            "required": false
          },
          {
            "name": "sessionMinutes",
            "type": "number",
            "description": "How long each session runs.",
            "required": false
          },
          {
            "name": "showRRule",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "timeLabel",
            "type": "string",
            "description": "\"4:00 PM – 5:30 PM\". Rendered into the sentence and every row.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { DatePicker } from \"@/components/zoblocks/date-picker\";\nimport { plainDate } from \"@/lib/zoblocks-datetime\";\nimport \"@/styles/zoblocks-datetime.css\";\n\n// The clock is injected. Nothing in this family reads it.\nconst today = plainDate(2026, 8, 26);\n\n<DatePicker variant=\"picker\" label=\"Appointment date\" now={today} value={date} onChange={setDate} />\n<DatePicker variant=\"birth-date\" now={today} allowEstimated allowAbsent />\n<DatePicker variant=\"session\" durationPresets={org.presets} bands={org.bands} />\n<DatePicker variant=\"slots\" set={availability} now={now} onSelect={hold} />\n\n// Or reach for a part directly when the surface chose at design time.\nimport { SessionTimeField } from \"@/components/zoblocks/date-picker\";",
    "guidance": {
      "use": [
        "variant=\"field\" for a date the user already knows — service date, admission, assessment. Four-fifths of healthcare date fields are this, and a popover there is four clicks where eight keystrokes would do.",
        "variant=\"picker\" where they may need to see a month to answer, and as the drop-in for an existing antd DatePicker.",
        "variant=\"birth-date\" at every registration and intake. The age readout is the field's own error check, not decoration.",
        "variant=\"date-range\" for a span of days somebody has to state — an authorisation window, a leave of absence, a reporting period. Two months, because most ranges cross a month boundary, and presets, because most range answers have a name.",
        "variant=\"time-range\" where a start and an end have to agree and neither is derived from a duration. Reach for \"session\" instead wherever the length is the thing the organisation cares about, because that is the variant that shows which member is held.",
        "variant=\"session\" wherever a session, shift or block has a start, an end and a length that have to agree.",
        "variant=\"slots\" or \"scheduler\" only where the system knows the options and the user cannot — that is the one job in the four that needs availability at all.",
        "With now passed from the server, so the field and the page agree about which day it is."
      ],
      "avoid": [
        "Reaching for the scheduler variants on a documentation form. A clinician entering a session timestamp should not load, see, or tab through the machinery required to schedule a twelve-week series.",
        "futurePolicy=\"block\" as a reflex. A discharge date can legitimately be in the future, and blocking it teaches staff to enter a wrong date to get past the validator.",
        "Using the band readout to recommend a code. The component reports which band a value falls in; choosing a code is a human act and a compliance question.",
        "Hiding the held/derived badge on the session variant. That returns the component to the defect it was built to fix.",
        "commit=\"immediate\" on a range panel whose parent refetches. Every click is reported, so a mis-clicked start filters a report on a range nobody chose.",
        "Shipping the general preset set unedited. `dateRangePresets` is a starting point: \"This year\" on a two-week authorisation window is noise, and seven periods nobody uses is seven rows between the reader and the two they do."
      ]
    },
    "accessibility": [
      {
        "label": "One tab stop per field, not three",
        "detail": "Every segmented variant is a single tab stop whose segments move with arrow keys, which is what the APG specifies for a composite. Three tab stops in a date field is nine in a date range, and a form with six dates becomes fifty-four presses to cross."
      },
      {
        "label": "One roving tabstop in every grid",
        "detail": "Exactly one calendar cell carries tabindex 0, resolved against the month actually displayed. Forty-two focusable cells is the most common accessibility failure in a date picker, and a calendar opened on a month with no focus date has none at all — which is the same bug from the other side."
      },
      {
        "label": "Every cell and slot is named in full",
        "detail": "A cell reads \"Wednesday, August 26, 2026, 8 times available\", not \"26\"; a slot reads its whole interval and why it cannot be taken. An element in a grid has no column header in its accessible context."
      },
      {
        "label": "Three message tiers, three ARIA treatments",
        "detail": "An error is role=\"alert\", assertive, and sets aria-invalid. A conflict is a legal value colliding with other state: role=\"status\", polite, not invalid. An advisory is polite and toneless — a clinician documenting last Friday's session must not be told they have made a mistake."
      },
      {
        "label": "One tabstop across two months, not one per month",
        "detail": "Two adjacent panels overlap by up to a fortnight, so the adjacent-month days are not drawn at all when more than one month is shown. Drawing them gives the same date two cells, both matching the focus date, which is where a second tabstop comes from. For the same reason there is one previous and one next control for the whole window rather than one pair per month."
      },
      {
        "label": "Colour is never the only channel",
        "detail": "Today is a dot as well as a weight, an unavailable day is struck as well as dimmed, and a held session member carries a lock glyph and the word Held beside its tint. All three survive greyscale, forced-colors and a red-green deficiency."
      },
      {
        "label": "The value never mirrors in RTL",
        "detail": "dir=\"ltr\" is set on the field itself. The grid mirrors; the digits do not. Letting the segments inherit dir=\"rtl\" renders 26/08/2026 as 2026/08/26, which is plausible and is the wrong date."
      },
      {
        "label": "Target size holds at every density",
        "detail": "Clinical density tightens type and gaps and never the target: every interactive element measures at least 24px in every profile, which is the WCAG 2.2 SC 2.5.8 floor. A mis-tap on a calendar cell is clinically consequential in a way it is not on a marketing site."
      },
      {
        "label": "Escape keeps what was typed",
        "detail": "Closing a calendar preserves a half-entered value and returns focus to the trigger. An Escape that discards it is the reason people stop using keyboards."
      }
    ],
    "limitations": [
      "The value is an ZbDate, not a Dayjs. This is the deliberate divergence from Ant Design: matching the value type would put a date library in the graph of every form component — exactly what ADR 0010 exists to prevent — and would make a birth date representable as midnight UTC. A Dayjs codebase converts at the boundary.",
      "Ant Design's prop names are not implemented, and ADR 0010 requires the divergences be named: there is no picker, showTime, allowClear, status or DatePicker.RangePicker, and antd's disabledDate and format are spelled unavailable and order. The reasons differ. unavailable returns the reason a day cannot be chosen rather than a boolean, because that reason is spoken and shown, and a boolean cannot carry it. picker=\"week\" and picker=\"quarter\" have no healthcare workflow we have found, and a stub rendering a day grid would be worse than an honest absence. The rest is unbuilt rather than rejected. A migration from antd is not yet one changed import line.",
      "Recurrence implements a named RFC 5545 subset — DAILY, WEEKLY, MONTHLY with INTERVAL, BYDAY, BYSETPOS, BYMONTHDAY, COUNT, UNTIL and EXDATE. Anything else is refused and rendered read-only with its original string, rather than silently mis-expanded.",
      "Nothing here fetches, holds, or books. Availability arrives as data with an age and every transition is reported through a callback — ADR 0009 forbids the network in component source, and the host is the only party that can reconcile a rejection anyway.",
      "The range panel commits explicitly by default and the inline calendar does not. `Calendar` keeps `commit=\"immediate\"` so no existing use changes behaviour; `DateRangeField` opts into `explicit` because a range is two clicks and the first is often wrong. A host that wants one rule everywhere has to say so on both.",
      "Non-Gregorian calendar input is not supported. Intl will format a Hijri or Buddhist date today, but a grid whose months have variable length and a year field with a different epoch is a project rather than a flag.",
      "Duration bands and session presets ship empty. A fifty-three-minute session is a fact about somebody's payer contract rather than about therapy, and asserting a code would be clinical decision support, which ADR 0009 prohibits."
    ],
    "related": [
      "clinical-note",
      "switch",
      "care-timeline"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add date-picker",
    "technicalName": "DatePicker",
    "aliases": [
      "react date picker",
      "healthcare date time picker",
      "appointment scheduler react",
      "session time picker",
      "react date range picker",
      "time range picker react",
      "date of birth input",
      "recurrence rule builder react"
    ],
    "tags": [
      "form-control",
      "data-entry",
      "overlay",
      "keyboard-first",
      "themeable",
      "print-safe"
    ],
    "uxGuidelines": {
      "do": [
        "Pick the variant by the job — recall, choose, construct or witness — not by the shape of the data.",
        "Let the reason be a string. `unavailable` and `disabledDate` return why, and the why reaches the accessible name.",
        "Say Optional in words. An unmarked field is ambiguous: the reader cannot tell optional from an author who forgot.",
        "Let a paste through. A date copied out of a referral letter is how a great deal of clinical data actually moves."
      ],
      "dont": [
        "Do not colour-code the reasons a day or a slot is closed. One muted treatment and a spoken reason beats five hues nobody has a legend for.",
        "Do not clamp a duration silently. The session variant reports an overrun and offers a correction on purpose.",
        "Do not render absence as an em dash or N/A. Which kind of absence it is, is a fact.",
        "Do not refuse a session that crosses midnight. It is a real shift, and refusing it corrupts the data you were protecting."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "Every temporal field in an electronic record, from a date of birth at intake to a twelve-week group series — organised around the four jobs healthcare temporal input actually is, rather than around the calendar that serves the rarest of them.",
      "workflows": [
        "intake",
        "documentation",
        "care-coordination",
        "assessment",
        "medication"
      ],
      "phi": {
        "handles": true,
        "notes": "Dates are identifying under HIPAA's Safe Harbor list. Nothing here logs a value, places one in a URL or query string, or writes one to browser storage — a prefilled date in a query string is a birth date in a web-server access log, a referrer header and a CDN cache. The restricted read-only mode exists so a protected value can be acknowledged on a screen its reader is not cleared for."
      },
      "auditable": false,
      "permissions": [],
      "terminology": [
        "FHIR"
      ]
    },
    "variants": [
      {
        "id": "picker",
        "label": "Picker",
        "description": "Field with a calendar behind a button. antd's DatePicker, with our value type.",
        "args": {
          "variant": "picker"
        }
      },
      {
        "id": "field",
        "label": "Field",
        "description": "No popover at all. A whole date in eight keystrokes.",
        "args": {
          "variant": "field"
        }
      },
      {
        "id": "calendar",
        "label": "Calendar",
        "description": "The month grid inline, with availability density under the numerals.",
        "args": {
          "variant": "calendar"
        }
      },
      {
        "id": "range",
        "label": "Range",
        "description": "Two clicks and a preview between them. Never a drag.",
        "args": {
          "variant": "range"
        }
      },
      {
        "id": "date-range",
        "label": "Date range",
        "description": "Two typeable ends in one shell, two contiguous months behind them, and named periods down the side.",
        "args": {
          "variant": "date-range"
        }
      },
      {
        "id": "multiple",
        "label": "Multiple dates",
        "description": "Capped; clicking a selected date removes it.",
        "args": {
          "variant": "multiple"
        }
      },
      {
        "id": "birth-date",
        "label": "Birth date",
        "description": "Live age, year-only precision, and absence with a reason.",
        "args": {
          "variant": "birth-date"
        }
      },
      {
        "id": "time",
        "label": "Time",
        "description": "Bounded segments, optional seconds, and a bare 9 it will not resolve.",
        "args": {
          "variant": "time"
        }
      },
      {
        "id": "session",
        "label": "Session",
        "description": "Start, end and duration, with the held member always marked.",
        "args": {
          "variant": "session"
        }
      },
      {
        "id": "time-range",
        "label": "Time range",
        "description": "A start, an end and the length between them. The end column is filtered, not merely ordered.",
        "args": {
          "variant": "time-range"
        }
      },
      {
        "id": "slots",
        "label": "Slots",
        "description": "Availability grouped and counted. Four states, three reasons, one treatment.",
        "args": {
          "variant": "slots"
        }
      },
      {
        "id": "scheduler",
        "label": "Scheduler",
        "description": "Provider, day and time on one surface, with a rejection path.",
        "args": {
          "variant": "scheduler"
        }
      },
      {
        "id": "recurrence",
        "label": "Recurrence",
        "description": "The rule in plain language, and a real RRULE beneath it.",
        "args": {
          "variant": "recurrence"
        }
      },
      {
        "id": "series",
        "label": "Series",
        "description": "A course of treatment, conflicts resolved before anything is written.",
        "args": {
          "variant": "series"
        }
      },
      {
        "id": "group",
        "label": "Group",
        "description": "Room, roster, capacity — and the count that survives the closures.",
        "args": {
          "variant": "group"
        }
      },
      {
        "id": "readout",
        "label": "Read-only",
        "description": "The record a reviewer, an auditor or a printer sees.",
        "args": {
          "variant": "readout"
        }
      }
    ],
    "controls": [
      {
        "prop": "variant",
        "control": "select",
        "label": "Variant",
        "options": [
          "picker",
          "field",
          "calendar",
          "range",
          "date-range",
          "multiple",
          "birth-date",
          "time",
          "session",
          "time-range",
          "slots",
          "scheduler",
          "recurrence",
          "series",
          "group",
          "readout"
        ],
        "defaultValue": "picker"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "Segments are role=\"spinbutton\" with aria-valuetext; grids are role=\"grid\" with rows, columnheaders and named gridcells; the calendar is role=\"dialog\".",
        "evidence": "date-picker.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Every value is reachable with digits and arrow keys. PageUp/PageDown change month, Shift with them changes year, Escape closes and keeps the typed value.",
        "evidence": "date-picker.test.tsx"
      },
      {
        "wcag": "2.4.3",
        "name": "Focus order",
        "status": "pass",
        "how": "One tab stop per field and one roving tabstop per grid, resolved against the month displayed.",
        "evidence": "date-picker.test.tsx"
      },
      {
        "wcag": "2.4.11",
        "name": "Focus not obscured",
        "status": "pass",
        "how": "The calendar flips above the field when the space below it is too short, so the focused element is never what the popover covers.",
        "evidence": "date-picker.test.tsx"
      },
      {
        "wcag": "2.5.7",
        "name": "Dragging movements",
        "status": "pass",
        "how": "Range selection is two clicks. There is no drag path anywhere in the component.",
        "evidence": "date-picker.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size",
        "status": "pass",
        "how": "Every interactive element holds 24px at all three density profiles; clinical density tightens type and gaps only.",
        "evidence": "date-picker.test.tsx"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "Today is a dot as well as a weight; unavailable is a strike as well as a tint; held carries a glyph and a word.",
        "evidence": "date-picker.test.tsx"
      },
      {
        "wcag": "3.3.1",
        "name": "Error identification",
        "status": "pass",
        "how": "Errors set aria-invalid and use role=\"alert\"; conflicts and advisories are role=\"status\" and do not, because the value is legal.",
        "evidence": "date-picker.test.tsx"
      },
      {
        "wcag": "3.3.7",
        "name": "Redundant entry",
        "status": "pass",
        "how": "The birth-date variant offers a value already on file as a one-press fill rather than pre-filling it — pre-filling a legal attestation is a different defect.",
        "evidence": "date-picker.test.tsx"
      },
      {
        "wcag": "2.2.1",
        "name": "Timing adjustable",
        "status": "not-applicable",
        "how": "Slot holds are the host's timers; the component renders the remaining time it is given and never enforces one."
      }
    ],
    "examples": [
      {
        "id": "four-jobs",
        "title": "Four jobs, four variants",
        "description": "The organising idea, in four lines. Recall is a value the user already holds; choose is one only the system knows; construct is a structure with derived members; witness is an assertion about the past. Each wants a different primary control, and picking the wrong one is how a date field becomes something staff route around.",
        "fixture": "patientRoutine",
        "code": "<DatePicker variant=\"field\"      label=\"Date of service\" now={today} showRelative />\n<DatePicker variant=\"slots\"      set={availability} now={now} onSelect={hold} />\n<DatePicker variant=\"session\"    durationPresets={org.presets} />\n<DatePicker variant=\"readout\"    value={signedAt} showZone viewerZone={me.zone} />"
      },
      {
        "id": "antd-migration",
        "title": "One changed import",
        "description": "The props match antd's, so the migration is the import line and a conversion at the value boundary. That is ADR 0010's promise, and this is the component that tests it hardest — because antd actually has this one.",
        "fixture": "appointmentBooked",
        "code": "- import { DatePicker } from \"antd\";\n+ import { DatePicker } from \"@zoblocks/react\";\n\n  <DatePicker\n    disabledDate={closed}\n    allowClear\n    status={hasError ? \"error\" : undefined}\n-   value={dayjsValue}\n+   value={zbDate}          // { kind: \"date\", y, m, d }\n  />"
      },
      {
        "id": "series-arithmetic",
        "title": "26 dates, 2 closures, 24 sessions",
        "description": "The arithmetic is the feature. A group scheduler that prints the naive occurrence count has told the billing team a number that will not match reality, and told nine enrolled patients they are attending two sessions that will not happen. The closures are written into the rule as EXDATE, so the count survives export.",
        "fixture": "encounterRoutine",
        "code": "<DatePicker\n  variant=\"group\"\n  name=\"DBT Skills Group\"\n  rule={{ freq: \"WEEKLY\", byWeekday: [2, 4], until: plainDate(2026, 11, 30) }}\n  startDate={plainDate(2026, 9, 1)}\n  exclusions={[\n    { date: plainDate(2026, 11, 24), reason: \"Facility closure — annual training\" },\n    { date: plainDate(2026, 11, 26), reason: \"Thanksgiving\" },\n  ]}\n  room={{ name: \"Group Room B\", capacity: 14 }}\n  capacity={12}\n  enrolled={9}\n/>"
      }
    ],
    "fixtures": [
      "patientRoutine",
      "appointmentBooked",
      "encounterRoutine"
    ],
    "seo": {
      "slug": "date-picker",
      "title": "Date Picker — accessible React healthcare control",
      "description": "A React date picker for healthcare: sixteen variants over one value space — fields, calendars, date and time ranges, birth dates, sessions and recurrence.",
      "primaryKeyword": "react healthcare date picker",
      "secondaryKeywords": [
        "accessible date picker react",
        "antd date picker alternative",
        "appointment scheduler react component",
        "session duration picker react",
        "date of birth input react"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "clinical-documentation",
        "intake"
      ],
      "alternatives": []
    }
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
    "tagline": "Two strands on a slow sine. For the laboratory.",
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
        "type": "LoaderAnnounce",
        "description": "Live-region politeness while indeterminate.",
        "required": false
      },
      {
        "name": "delay",
        "type": "number",
        "description": "Wait this long before appearing, so a fast response never flashes a loader.",
        "required": false
      },
      {
        "name": "hint",
        "type": "string",
        "description": "A second line under the label. Never a substitute for it.",
        "required": false
      },
      {
        "name": "label",
        "type": "string",
        "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
        "required": false
      },
      {
        "name": "minDuration",
        "type": "number",
        "description": "Once visible, stay at least this long, so the loader never blinks out.",
        "required": false
      },
      {
        "name": "mode",
        "type": "LoaderMode",
        "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
        "required": false
      },
      {
        "name": "motion",
        "type": "LoaderMotion",
        "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void)",
        "description": "Fires once, when `slowAfter` elapses.",
        "required": false
      },
      {
        "name": "open",
        "type": "boolean",
        "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
        "required": false
      },
      {
        "name": "progress",
        "type": "number",
        "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
        "required": false
      },
      {
        "name": "scrim",
        "type": "boolean",
        "description": "Translucent backdrop behind `overlay` and `page`.",
        "required": false
      },
      {
        "name": "showLabel",
        "type": "boolean",
        "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
        "required": false
      },
      {
        "name": "size",
        "type": "number | LoaderSize",
        "description": "Named step or an explicit art width in pixels.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number",
        "description": "Announce a stall after this long. 0 disables.",
        "required": false
      },
      {
        "name": "slowHint",
        "type": "string",
        "description": "Replaces the default stall wording.",
        "required": false
      },
      {
        "name": "speed",
        "type": "number",
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
            "type": "LoaderAnnounce",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false
          },
          {
            "name": "motion",
            "type": "LoaderMotion",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void)",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize",
            "description": "Named step or an explicit art width in pixels.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false,
            "default": "1"
          }
        ]
      }
    ],
    "usage": "import { HelixLoader } from \"@/components/zoblocks/helix-loader\";\n\n<HelixLoader mode=\"overlay\" label=\"Running the panel\" delay={200} />",
    "guidance": {
      "use": [
        "Laboratory, genomics, pathology, and research surfaces where analysis is the thing being waited on.",
        "Wide containers — it is a landscape mark and wants at least 48px of width.",
        "Waits long enough to be worth a domain mark. Under about 400ms the strands never complete a rotation, and an animation cut off mid-cycle reads as a stall rather than as progress."
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
      "Requires styles/zoblocks-loader.css, installed with loader-core.",
      "Eighteen animated nodes — the heaviest of the five, though still compositor-only.",
      "Depicts no real sequence data. It is a mark, not a visualisation."
    ],
    "related": [
      "breath-loader",
      "rhythm-loader",
      "infusion-loader",
      "pulse-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add helix-loader"
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
    "tagline": "The only loader here that can honestly show progress.",
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
        "type": "LoaderAnnounce",
        "description": "Live-region politeness while indeterminate.",
        "required": false
      },
      {
        "name": "delay",
        "type": "number",
        "description": "Wait this long before appearing, so a fast response never flashes a loader.",
        "required": false
      },
      {
        "name": "hint",
        "type": "string",
        "description": "A second line under the label. Never a substitute for it.",
        "required": false
      },
      {
        "name": "label",
        "type": "string",
        "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
        "required": false
      },
      {
        "name": "minDuration",
        "type": "number",
        "description": "Once visible, stay at least this long, so the loader never blinks out.",
        "required": false
      },
      {
        "name": "mode",
        "type": "LoaderMode",
        "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
        "required": false
      },
      {
        "name": "motion",
        "type": "LoaderMotion",
        "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void)",
        "description": "Fires once, when `slowAfter` elapses.",
        "required": false
      },
      {
        "name": "open",
        "type": "boolean",
        "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
        "required": false
      },
      {
        "name": "progress",
        "type": "number",
        "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
        "required": false
      },
      {
        "name": "scrim",
        "type": "boolean",
        "description": "Translucent backdrop behind `overlay` and `page`.",
        "required": false
      },
      {
        "name": "showLabel",
        "type": "boolean",
        "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
        "required": false
      },
      {
        "name": "size",
        "type": "number | LoaderSize",
        "description": "Named step or an explicit art width in pixels.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number",
        "description": "Announce a stall after this long. 0 disables.",
        "required": false
      },
      {
        "name": "slowHint",
        "type": "string",
        "description": "Replaces the default stall wording.",
        "required": false
      },
      {
        "name": "speed",
        "type": "number",
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
            "type": "LoaderAnnounce",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false
          },
          {
            "name": "motion",
            "type": "LoaderMotion",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void)",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize",
            "description": "Named step or an explicit art width in pixels.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false,
            "default": "1"
          }
        ]
      }
    ],
    "usage": "import { InfusionLoader } from \"@/components/zoblocks/infusion-loader\";\n\n// Determinate: the application knows how much is left\n<InfusionLoader progress={42} label=\"Importing records\" showLabel />\n\n// Indeterminate: it does not, and says so by drifting\n<InfusionLoader label=\"Preparing the export\" />",
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
      "Requires styles/zoblocks-loader.css, installed with loader-core.",
      "Percentage only. It shows no time estimate and no per-step breakdown."
    ],
    "related": [
      "pulse-loader",
      "rhythm-loader",
      "breath-loader",
      "helix-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add infusion-loader"
  },
  {
    "name": "provenance-chip",
    "title": "Provenance Chip",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "Where a value came from, how it got here, and how much of it a human has actually looked at.",
    "tagline": "Where a value came from, and who has actually read it.",
    "description": "A 20px affix beside a value, never competing with it. Six source classes with CSS glyphs rather than colours, staleness folded in against a per-datum policy, and — for an AI-extracted value — the model, the source span and whether anybody has confirmed it.",
    "rationale": "A blood pressure typed by a medical assistant, streamed from a home cuff, pulled from an HIE document of unknown vintage, and extracted by a language model from a scanned fax all render as 128/76. They are not the same fact and they do not support the same decision. As ambient AI and external exchange both scale, the proportion of chart content that no human ever typed is rising fast, and there is no widely used convention for saying so. Two distinctions carry the component. Observed-at is kept separate from recorded-at, because a C-CDA authored in March may carry a reading measured in January and rendering the document's date as the observation's is how a nine-week-old value is acted on as current. And patient-reported is a source class rather than a caveat: self-report is the primary instrument in behavioral health, so a patient-reported PHQ-9 is the correct provenance and rendering it as second-class is its own error — the same class standing in for a blood-pressure measurement is a different matter, and that judgement belongs to the caller.",
    "categories": [
      "Clinical",
      "AI"
    ],
    "fhir": [
      {
        "name": "Provenance",
        "url": "https://hl7.org/fhir/R4/provenance.html",
        "note": "agent[].type and who, entity[].role, recorded and occurredDateTime as two separate fields, and activity. The adapter will not call an authorship an extraction on the strength of the agent type alone."
      }
    ],
    "resource": "Provenance",
    "resourceUrl": "https://hl7.org/fhir/R4/provenance.html",
    "states": [
      "Clinic — measured in the room",
      "Home device, with its caveats",
      "Patient-reported — the instrument",
      "External, with the exchange named",
      "AI-extracted, unconfirmed",
      "AI-extracted, confirmed by a clinician",
      "Amended — the original retained",
      "Stale against a per-datum policy",
      "Observed long before it was recorded",
      "Glyph only, in a dense grid",
      "Chain reachable",
      "Span reachable",
      "No ledger entry — renders nothing"
    ],
    "props": [
      {
        "name": "glyphOnly",
        "type": "boolean",
        "description": "Hides the source word, leaving the glyph and the age. For dense grids.",
        "required": false,
        "default": "false"
      },
      {
        "name": "ledger",
        "type": "ProvenanceLedger",
        "description": "Read from a ledger instead. Components never fetch their own provenance: a chart with two hundred values would make two hundred requests and every chip would settle at a different moment. The host subscribes once and passes this down.",
        "required": false
      },
      {
        "name": "now",
        "type": "string",
        "description": "ISO 8601, supplied by the host. No relative age is shown without it.",
        "required": false
      },
      {
        "name": "onOpenChain",
        "type": "((record: ProvenanceRecord) => void)",
        "description": "Opens the chain: the agents, the device, the document, the versions.",
        "required": false
      },
      {
        "name": "onOpenSpan",
        "type": "((span: NonNullable<ProvenanceRecord['span']>, record: ProvenanceRecord) => void)",
        "description": "Jumps to the span an extracted value was lifted from. The single most requested behaviour from clinicians reviewing extraction, which is why it is its own handler rather than something folded into the chain.",
        "required": false
      },
      {
        "name": "record",
        "type": "ProvenanceRecord",
        "description": "The record, or a ledger lookup below. One of the two is required.",
        "required": false
      },
      {
        "name": "resourceId",
        "type": "string",
        "description": "The resource this provenance is about. Used to link back to the record rather than to re-fetch it.",
        "required": false
      },
      {
        "name": "stalenessPolicy",
        "type": "StalenessPolicy",
        "description": "How old is too old, per kind of datum. Four days differs by datum.",
        "required": false
      },
      {
        "name": "versionId",
        "type": "string",
        "description": "Which version was seen. Provenance for a value that has since changed is provenance for a different value.",
        "required": false
      }
    ],
    "extendsType": "Base",
    "exports": [
      {
        "name": "ProvenanceChip",
        "props": [
          {
            "name": "glyphOnly",
            "type": "boolean",
            "description": "Hides the source word, leaving the glyph and the age. For dense grids.",
            "required": false,
            "default": "false"
          },
          {
            "name": "ledger",
            "type": "ProvenanceLedger",
            "description": "Read from a ledger instead. Components never fetch their own provenance: a chart with two hundred values would make two hundred requests and every chip would settle at a different moment. The host subscribes once and passes this down.",
            "required": false
          },
          {
            "name": "now",
            "type": "string",
            "description": "ISO 8601, supplied by the host. No relative age is shown without it.",
            "required": false
          },
          {
            "name": "onOpenChain",
            "type": "((record: ProvenanceRecord) => void)",
            "description": "Opens the chain: the agents, the device, the document, the versions.",
            "required": false
          },
          {
            "name": "onOpenSpan",
            "type": "((span: NonNullable<ProvenanceRecord['span']>, record: ProvenanceRecord) => void)",
            "description": "Jumps to the span an extracted value was lifted from. The single most requested behaviour from clinicians reviewing extraction, which is why it is its own handler rather than something folded into the chain.",
            "required": false
          },
          {
            "name": "record",
            "type": "ProvenanceRecord",
            "description": "The record, or a ledger lookup below. One of the two is required.",
            "required": false
          },
          {
            "name": "resourceId",
            "type": "string",
            "description": "The resource this provenance is about. Used to link back to the record rather than to re-fetch it.",
            "required": false
          },
          {
            "name": "stalenessPolicy",
            "type": "StalenessPolicy",
            "description": "How old is too old, per kind of datum. Four days differs by datum.",
            "required": false
          },
          {
            "name": "versionId",
            "type": "string",
            "description": "Which version was seen. Provenance for a value that has since changed is provenance for a different value.",
            "required": false
          }
        ],
        "extendsType": "Base"
      }
    ],
    "usage": "import { ProvenanceChip, ledgerFrom } from \"@/components/zoblocks/provenance-chip\";\nimport \"@/styles/zoblocks-provenance.css\";\n\nconst ledger = ledgerFrom(records);\n\n<ProvenanceChip\n  resourceId=\"obs-bp-1\"\n  ledger={ledger}\n  now={serverTime}\n  stalenessPolicy={(r) => (r.source === \"device\" ? 48 * 3600_000 : null)}\n/>",
    "guidance": {
      "use": [
        "Beside any value whose origin changes what a reader should do with it — vitals, medication lists, problem lists, external documents, anything a model produced.",
        "With a ledger rather than a record per call site, so every chip on a screen describes the same snapshot.",
        "With onOpenSpan wherever extracted values appear. Jumping to the source span is the single most requested behaviour from clinicians reviewing extraction.",
        "With a staleness policy per datum type. A shared threshold either screams about every diagnosis or stays silent about every vital."
      ],
      "avoid": [
        "As a headline. It is an affix; a provenance that competes with the value it qualifies has inverted the reading order.",
        "As a quality score. It says where a value came from, not whether it is right — a clinic measurement can be wrong and a patient-reported PHQ-9 is the instrument.",
        "Without `now` when age matters. Omitting it renders no age at all, which is honest; a client clock is not."
      ]
    },
    "accessibility": [
      {
        "label": "Six shapes, not six colours",
        "detail": "Colour would put the source classes on a scale from better to worse, and they are not one. Each class is a CSS glyph in currentColor, so it survives greyscale and forced colours — where colour would have been the only channel, and where colour was never the right channel anyway."
      },
      {
        "label": "The name is the whole sentence",
        "detail": "\"Source: device, Omron BP7450, unvalidated cuff size, observed 4 d ago, stale.\" One string, in a fixed order: what kind of source, then who or what, then when, then whether anybody has looked. The confirmation clause is last because it decides whether to act, and a listener remembers the end of a sentence."
      },
      {
        "label": "A span when there is nothing to open",
        "detail": "role=\"img\" with a label by default; a real button only when the host supplies a chain. There is one of these beside every value on a chart, so a focusable element with no action is worse here than almost anywhere."
      },
      {
        "label": "Staleness is on the chip, not in the chain",
        "detail": "A device reading from four days ago and one from four minutes ago carry different weight, and a reader who has to hover to learn which is a reader who will not. The threshold is injected per datum type: four days is nothing for a problem list and a lot for a blood pressure."
      },
      {
        "label": "Unreviewed is a word, not a dot",
        "detail": "An unconfirmed extraction says so in text and in the accessible name. It is not a confidence score — a model can be very confident and wrong — and the fact a reader needs is whether a human has been involved at all."
      }
    ],
    "limitations": [
      "It renders nothing when the ledger has no entry. A chip reading \"unknown\" beside every unmapped value teaches readers to ignore the column, which costs more than the gap.",
      "No fetching. Components never request their own provenance: a chart with two hundred values would make two hundred requests and every chip would settle at a different moment. The host subscribes once and passes the ledger down.",
      "The FHIR adapter cannot reliably detect an extraction. R4's participation types do not distinguish one from an authorship, so an extraction is only recognised when the activity says so — guessing would label every transcription as a model output.",
      "Staleness needs a policy. Without one the chip says nothing about age rather than assuming a threshold, because a wrong threshold is worse than no threshold on a problem list."
    ],
    "related": [
      "result-value",
      "clinical-status"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add provenance-chip",
    "technicalName": "ProvenanceChip",
    "aliases": [
      "data source badge",
      "attribution chip",
      "source indicator",
      "ai attribution",
      "data lineage"
    ],
    "tags": [
      "data-display",
      "themeable",
      "print-safe",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Populate observedAt separately from recordedAt whenever the source distinguishes them. The gap between the two is the fact the component exists to render.",
        "Name the exchange as well as the organisation. \"External\" tells a reader nothing they can act on; \"Northgate Family Med via Carequality\" does.",
        "Carry the device's caveats. An unvalidated cuff size is why a home reading is not a clinic reading."
      ],
      "dont": [
        "Do not render patient-reported as a warning. It is the correct provenance for a screening instrument, and styling it as a defect teaches staff to distrust the right answer.",
        "Do not fold the confirmation state into a confidence number. They answer different questions and only one of them involves a human.",
        "Do not put the chip on its own line. It is an affix, and a provenance with its own row reads as a second value."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "Every surface where a value's origin changes the decision. Self-report is the primary instrument in behavioral health, so the component distinguishes self-report as the instrument from self-report standing in for a measurement — the same class, two different weights, and the caller's judgement rather than the component's.",
      "workflows": [
        "documentation",
        "assessment",
        "care-coordination",
        "medication"
      ],
      "phi": {
        "handles": true,
        "notes": "Names the clinician who observed a value, the organisation that sent it and the document it arrived in. The chain is the disclosive part and it opens on request rather than rendering inline."
      },
      "auditable": true,
      "permissions": [
        "provenance.read"
      ],
      "terminology": [
        "FHIR"
      ]
    },
    "variants": [
      {
        "id": "default",
        "label": "Default",
        "description": "Glyph, source word and age. The affix a value carries.",
        "args": {
          "glyphOnly": false
        }
      },
      {
        "id": "glyph",
        "label": "Glyph only",
        "description": "For a dense grid where the column is entirely provenance. The word stays in the accessible name.",
        "args": {
          "glyphOnly": true
        }
      }
    ],
    "controls": [
      {
        "prop": "glyphOnly",
        "control": "switch",
        "label": "Glyph only",
        "defaultValue": false
      },
      {
        "prop": "now",
        "control": "text",
        "label": "Now (ISO 8601)"
      },
      {
        "prop": "resourceId",
        "control": "text",
        "label": "Resource id"
      },
      {
        "prop": "onOpenChain",
        "control": "event",
        "label": "onOpenChain"
      },
      {
        "prop": "onOpenSpan",
        "control": "event",
        "label": "onOpenSpan"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "Six CSS glyphs in currentColor rather than six hues, and a test asserts every source class renders a distinct glyph. Staleness and the unreviewed state carry words as well as backgrounds.",
        "evidence": "provenance-chip.test.tsx"
      },
      {
        "wcag": "1.3.1",
        "name": "Info and relationships",
        "status": "pass",
        "how": "The whole provenance is one composed name in a fixed order, with every inner node aria-hidden — so a screen reader hears a sentence rather than five fragments beside a value.",
        "evidence": "provenance-chip.test.tsx"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "role=\"img\" with a label when static, a real button when a chain is supplied, and the span affordance is its own labelled button.",
        "evidence": "provenance-chip.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Both affordances are native buttons reached and activated by keyboard, with no handler of the component's own.",
        "evidence": "provenance-chip.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size",
        "status": "pass",
        "how": "The chip and the span button hold a 20px box inside a 24px line, and the interactive form is padded to reach the floor without shifting the value beside it.",
        "evidence": "provenance-chip.test.tsx"
      },
      {
        "wcag": "1.4.11",
        "name": "Non-text contrast",
        "status": "pass",
        "how": "The glyph is drawn in the inherited text colour, so it meets whatever the surrounding text meets; the two tinted states route through gated status tokens.",
        "evidence": "contrast.gate"
      },
      {
        "wcag": "1.4.12",
        "name": "Text spacing",
        "status": "pass",
        "how": "An inline-flex row with no fixed height; increased line-height and letter-spacing grow the chip rather than clipping it.",
        "evidence": "provenance-chip.test.tsx"
      },
      {
        "wcag": "2.2.1",
        "name": "Timing adjustable",
        "status": "not-applicable",
        "how": "No timing. Staleness is computed against a `now` the host supplies."
      }
    ],
    "examples": [
      {
        "id": "six-provenances",
        "title": "One value, six provenances",
        "description": "The same 128/76, six times. Each supports a different decision, and only the affix says which — the clinic reading is actionable, the HIE row carries a document date rather than an observation date, and the extracted row states that nobody has looked at it.",
        "fixture": "observationPotassiumCritical",
        "code": "<ProvenanceChip record={{ source: \"clinic\", observedAt: t12min,\n  performer: { display: \"M. Adeyemi\", role: \"MA\" }, device: \"Welch Allyn 6000\" }} now={now} />\n\n<ProvenanceChip record={{ source: \"device\", observedAt: t4days,\n  device: \"Omron BP7450\", deviceNote: \"unvalidated cuff size, median of 3\" }} now={now} />\n\n<ProvenanceChip record={{ source: \"ai-extracted\", model: \"oxy-extract-3\",\n  span: { document: \"Scanned referral\", page: 2, line: 14 }, confirmed: false }} />"
      },
      {
        "id": "document-vintage",
        "title": "Document vintage is not observation vintage",
        "description": "A C-CDA authored on 11 March may carry a reading measured in January. Rendering the document's date as the observation's is how a nine-week-old value is acted on as current, so the two are separate fields and the age is measured from the first.",
        "fixture": "documentLateEntry",
        "code": "<ProvenanceChip\n  now={now}\n  record={{\n    source: \"external\",\n    organisation: \"Northgate Family Med\",\n    exchange: \"Carequality\",\n    document: \"C-CDA, authored 11 Mar\",\n    observedAt: \"2026-01-14T09:00:00Z\", // the reading\n    recordedAt: \"2026-03-11T00:00:00Z\", // the document\n  }}\n/>;"
      },
      {
        "id": "ledger",
        "title": "One subscription, not two hundred requests",
        "description": "Components never fetch their own provenance. A chart with two hundred values would make two hundred requests and every chip would settle at a different moment, so the host subscribes once and the chips are pure.",
        "fixture": "provenanceLateEntry",
        "code": "const ledger = ledgerFrom({\n  \"obs-1\": { source: \"clinic\", observedAt: t },\n  // Versioned first: an amended value and its original are two provenances.\n  \"obs-1@2\": { source: \"amended\", supersedes: { value: \"182/76\", reason: \"typo\" } },\n});\n\n<ProvenanceChip resourceId=\"obs-1\" versionId=\"2\" ledger={ledger} now={now} />;"
      },
      {
        "id": "staleness-policy",
        "title": "Four days differs by datum",
        "description": "Four days is nothing for a problem list and a lot for a blood pressure, so the threshold is injected per datum type. Without a policy the chip says nothing about age rather than assuming one — a wrong threshold is worse than no threshold.",
        "fixture": "practitionerSigner",
        "code": "const policy: StalenessPolicy = (record) => {\n  if (record.source === \"device\") return 48 * 3600_000;   // two days\n  if (record.source === \"patient-reported\") return 30 * 86400_000;\n  return null;  // no opinion, and the chip says nothing rather than guessing\n};"
      }
    ],
    "fixtures": [
      "observationPotassiumCritical",
      "provenanceLateEntry",
      "practitionerSigner",
      "documentLateEntry"
    ],
    "seo": {
      "slug": "provenance-chip",
      "title": "Provenance Chip — React data source component",
      "description": "A React provenance affix for clinical values: six source classes, AI extraction with its source span, and staleness measured against a per-datum policy.",
      "primaryKeyword": "react data provenance component",
      "secondaryKeywords": [
        "fhir provenance react",
        "ai attribution ui",
        "clinical data lineage",
        "data source indicator react"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "results-review",
        "clinical-documentation"
      ],
      "alternatives": [
        {
          "ref": "result-value",
          "when": "the question is what the value is rather than where it came from"
        }
      ]
    }
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
    "tagline": "An open heart at a resting sixty. The signature wait.",
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
        "type": "LoaderAnnounce",
        "description": "Live-region politeness while indeterminate.",
        "required": false
      },
      {
        "name": "bpm",
        "type": "number",
        "description": "Beats per minute, 40–100. Clamped, because this is decoration on a healthcare screen and a loader beating at 180 would be read as a number by the only people qualified to read it.",
        "required": false
      },
      {
        "name": "delay",
        "type": "number",
        "description": "Wait this long before appearing, so a fast response never flashes a loader.",
        "required": false
      },
      {
        "name": "hint",
        "type": "string",
        "description": "A second line under the label. Never a substitute for it.",
        "required": false
      },
      {
        "name": "label",
        "type": "string",
        "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
        "required": false
      },
      {
        "name": "minDuration",
        "type": "number",
        "description": "Once visible, stay at least this long, so the loader never blinks out.",
        "required": false
      },
      {
        "name": "mode",
        "type": "LoaderMode",
        "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
        "required": false
      },
      {
        "name": "motion",
        "type": "LoaderMotion",
        "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void)",
        "description": "Fires once, when `slowAfter` elapses.",
        "required": false
      },
      {
        "name": "open",
        "type": "boolean",
        "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
        "required": false
      },
      {
        "name": "progress",
        "type": "number",
        "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
        "required": false
      },
      {
        "name": "scrim",
        "type": "boolean",
        "description": "Translucent backdrop behind `overlay` and `page`.",
        "required": false
      },
      {
        "name": "showLabel",
        "type": "boolean",
        "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
        "required": false
      },
      {
        "name": "size",
        "type": "number | LoaderSize",
        "description": "Named step or an explicit art width in pixels.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number",
        "description": "Announce a stall after this long. 0 disables.",
        "required": false
      },
      {
        "name": "slowHint",
        "type": "string",
        "description": "Replaces the default stall wording.",
        "required": false
      },
      {
        "name": "speed",
        "type": "number",
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
            "type": "LoaderAnnounce",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "bpm",
            "type": "number",
            "description": "Beats per minute, 40–100. Clamped, because this is decoration on a healthcare screen and a loader beating at 180 would be read as a number by the only people qualified to read it.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false
          },
          {
            "name": "motion",
            "type": "LoaderMotion",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void)",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize",
            "description": "Named step or an explicit art width in pixels.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number",
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
            "type": "LoaderAnnounce",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "bpm",
            "type": "number",
            "description": "Beats per minute, 40–100. Clamped, because this is decoration on a healthcare screen and a loader beating at 180 would be read as a number by the only people qualified to read it.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false,
            "default": "\"page\""
          },
          {
            "name": "motion",
            "type": "LoaderMotion",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void)",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize",
            "description": "Named step or an explicit art width in pixels.",
            "required": false,
            "default": "\"xl\""
          },
          {
            "name": "slowAfter",
            "type": "number",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false
          }
        ],
        "extendsType": "LoaderCommonProps"
      }
    ],
    "usage": "import { PageLoader, PulseLoader } from \"@/components/zoblocks/pulse-loader\";\n\n// Full-page wait, e.g. Next.js app/loading.tsx\n<PageLoader label=\"Loading your records\" />\n\n// Region overlay that never flashes and admits a stall\n<PulseLoader\n  mode=\"overlay\"\n  label=\"Loading results\"\n  delay={200}\n  slowAfter={8000}\n  onSlow={reportSlowWait}\n/>",
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
      "Requires styles/zoblocks-loader.css, installed with loader-core. Without it the loader renders as a static mark rather than an animated one.",
      "One cardiac rhythm. It does not depict arrhythmia, and it must never be read as a patient's actual rate."
    ],
    "related": [
      "rhythm-loader",
      "breath-loader",
      "infusion-loader",
      "helix-loader",
      "recorder"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add pulse-loader",
    "relationships": {
      "builtWith": [
        "rhythm-loader"
      ],
      "usedIn": [],
      "patterns": [],
      "alternatives": []
    }
  },
  {
    "name": "recent-patient-stack",
    "title": "Recent Patient Stack",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A multi-chart workspace that makes the active patient unmistakable, because the alternative is eleven identical browser tabs.",
    "tagline": "A multi-chart workspace where the active patient is unmistakable.",
    "description": "Each open chart gets a hue derived from its id, so it is the same colour in every session. Two charts whose names look alike both grow an identifier. Per-chart badges carry the unfinished work, closing is graded rather than binary, and returning after fifteen minutes away re-asserts who the chart belongs to.",
    "rationale": "Clinicians work several charts at once and the tooling pretends they do not. The state of the art is a dropdown of names, or worse, eleven browser tabs whose titles truncate to \"Chart — Riverside…\". Wrong-patient documentation survives every amount of staff training because it is not a training problem: it is two charts that look identical, one keyboard shortcut, and an interruption. A stack does three things a dropdown cannot — it makes the set visible without being opened, it gives each chart a persistent visual identity, and it carries per-chart state. The identity has to be derived from the chart rather than handed out in arrival order, or a clinician who has learned \"Okonkwo is the green one\" has learned something that will be false tomorrow.",
    "categories": [
      "Clinical",
      "Navigation"
    ],
    "fhir": [
      {
        "name": "Patient",
        "url": "https://hl7.org/fhir/R4/patient.html",
        "note": "Identity per chart. The accent is derived from the chart id rather than from the patient, so a merged record does not silently change colour."
      },
      {
        "name": "Task",
        "url": "https://hl7.org/fhir/R4/task.html",
        "note": "Outstanding work per chart — a draft order, an unsigned note, an unacknowledged result — ranked by consequence rather than by age."
      }
    ],
    "resource": "Patient",
    "resourceUrl": "https://hl7.org/fhir/R4/patient.html",
    "states": [
      "Four charts, one active",
      "A pinned chart",
      "An unsigned note",
      "A draft order",
      "Two charts with similar names",
      "Closing a clean chart",
      "Closing one with an unsigned note",
      "Closing one with a draft order",
      "Returning after fifteen minutes",
      "Expanded panel",
      "Keyboard reordering",
      "Roving focus across the stack",
      "One chart",
      "Notes owed across the caseload"
    ],
    "props": [
      {
        "name": "charts",
        "type": "readonly OpenChart[]",
        "description": "The open charts, most recent first. Each carries enough to tell two patients apart, which eleven identical browser tabs do not.",
        "required": true
      },
      {
        "name": "activeId",
        "type": "string",
        "description": "Which chart is in front. The active patient has to be unmistakable — this is a wrong-patient control, not a tab bar.",
        "required": false
      },
      {
        "name": "expanded",
        "type": "boolean",
        "description": "Start expanded, showing the panel rather than the avatar row.",
        "required": false,
        "default": "false"
      },
      {
        "name": "now",
        "type": "string",
        "description": "ISO 8601 from the host. Decides whether returning re-asserts identity.",
        "required": false
      },
      {
        "name": "onActivate",
        "type": "((chart: OpenChart, options: { reassert: boolean; }) => void)",
        "description": "Switch to a chart. Called with `reassert: true` when the clinician has been away long enough that the host should confirm the patient before showing the chart. Fifteen minutes is roughly the length of an interruption you do not remember.",
        "required": false
      },
      {
        "name": "onClose",
        "type": "((chart: OpenChart) => void)",
        "description": "Close a chart. Called only when `canClose` returns `close` or the host confirmed a `confirm`. A `refuse` never reaches here.",
        "required": false
      },
      {
        "name": "onExpandedChange",
        "type": "((expanded: boolean) => void)",
        "description": "Fired when the stack expands or collapses.",
        "required": false
      },
      {
        "name": "onPin",
        "type": "((chart: OpenChart, pinned: boolean) => void)",
        "description": "Fired when a chart is pinned, so it survives the recency ordering.",
        "required": false
      },
      {
        "name": "onReorder",
        "type": "((charts: OpenChart[]) => void)",
        "description": "Keyboard reordering, the equivalent of a drag (WCAG 2.5.7).",
        "required": false
      }
    ],
    "extendsType": "Omit< React.HTMLAttributes<HTMLDivElement>, \"children\" | \"onSelect\" >",
    "exports": [
      {
        "name": "RecentPatientStack",
        "props": [
          {
            "name": "charts",
            "type": "readonly OpenChart[]",
            "description": "The open charts, most recent first. Each carries enough to tell two patients apart, which eleven identical browser tabs do not.",
            "required": true
          },
          {
            "name": "activeId",
            "type": "string",
            "description": "Which chart is in front. The active patient has to be unmistakable — this is a wrong-patient control, not a tab bar.",
            "required": false
          },
          {
            "name": "expanded",
            "type": "boolean",
            "description": "Start expanded, showing the panel rather than the avatar row.",
            "required": false,
            "default": "false"
          },
          {
            "name": "now",
            "type": "string",
            "description": "ISO 8601 from the host. Decides whether returning re-asserts identity.",
            "required": false
          },
          {
            "name": "onActivate",
            "type": "((chart: OpenChart, options: { reassert: boolean; }) => void)",
            "description": "Switch to a chart. Called with `reassert: true` when the clinician has been away long enough that the host should confirm the patient before showing the chart. Fifteen minutes is roughly the length of an interruption you do not remember.",
            "required": false
          },
          {
            "name": "onClose",
            "type": "((chart: OpenChart) => void)",
            "description": "Close a chart. Called only when `canClose` returns `close` or the host confirmed a `confirm`. A `refuse` never reaches here.",
            "required": false
          },
          {
            "name": "onExpandedChange",
            "type": "((expanded: boolean) => void)",
            "description": "Fired when the stack expands or collapses.",
            "required": false
          },
          {
            "name": "onPin",
            "type": "((chart: OpenChart, pinned: boolean) => void)",
            "description": "Fired when a chart is pinned, so it survives the recency ordering.",
            "required": false
          },
          {
            "name": "onReorder",
            "type": "((charts: OpenChart[]) => void)",
            "description": "Keyboard reordering, the equivalent of a drag (WCAG 2.5.7).",
            "required": false
          }
        ],
        "extendsType": "Omit< React.HTMLAttributes<HTMLDivElement>, \"children\" | \"onSelect\" >"
      }
    ],
    "usage": "import { RecentPatientStack } from \"@/components/zoblocks/recent-patient-stack\";\nimport \"@/styles/zoblocks-workspace.css\";\n\n<RecentPatientStack\n  charts={open}\n  activeId={activeId}\n  now={serverTime}\n  onActivate={(chart, { reassert }) =>\n    reassert ? confirmIdentity(chart) : switchTo(chart)\n  }\n  onClose={closeChart}\n  onReorder={setOrder}\n/>",
    "guidance": {
      "use": [
        "In the top bar of a clinical workspace, above the chart header rather than inside it.",
        "With `now` from the server, so the fifteen-minute re-assertion is not decided by a clock the user can change.",
        "With the outstanding work resolved upstream — a draft order and an unsigned note are different consequences and the component ranks them, but it cannot discover them.",
        "With `onReorder` wired. Without it the keyboard move is silently inert, and a drag with no keyboard path is a 2.5.7 failure."
      ],
      "avoid": [
        "As a substitute for the chart header. The stack says which chart; the header says who the patient is and what must not be forgotten about them.",
        "With more than about eight charts open. Past that the accents repeat, the names truncate and the stack stops being scannable — which is a workflow signal, not a component limit.",
        "On a phone as a full workspace. The component narrows itself deliberately; do not widen it back.",
        "With an accent assigned by arrival order. The whole value is that the hue is the same tomorrow."
      ]
    },
    "accessibility": [
      {
        "label": "A tablist with roving focus",
        "detail": "One tab stop for the whole stack; arrows move within it, Home and End jump to the ends. A workspace with eleven tab stops is a workspace a keyboard user leaves."
      },
      {
        "label": "Every drag has a keyboard equivalent",
        "detail": "Alt with the up and down arrows moves a chart rather than the focus (WCAG 2.5.7). Reordering never crosses the pinned boundary, so a keystroke cannot silently pin or unpin a chart."
      },
      {
        "label": "Colour is never the only chart identity",
        "detail": "The initials and the name are drawn in every mode, and the active chart is marked by weight and a ring as well as a hue. Eight accents rather than twelve, because twelve near-neighbours nobody can tell apart is a decoration pretending to be an identity."
      },
      {
        "label": "The accessible name carries the outstanding work",
        "detail": "\"A. Okonkwo. Ward round. Unsigned note.\" A screen-reader user should not have to open a chart to learn there is something owed on it."
      },
      {
        "label": "Refusal is not dressed as a question",
        "detail": "Closing a chart with a draft order opens an alertdialog with one way out and no confirm button. A dialogue with only one exit that offers two is how people learn to click through the ones that matter."
      },
      {
        "label": "Small screens get one legible chart",
        "detail": "Below 40rem the inactive tabs shrink to their avatar and only the active chart keeps its name. A multi-chart workspace on a phone is a wrong-patient generator, so the set stays visible and only one chart is legible enough to act on."
      }
    ],
    "limitations": [
      "It holds no state. Which charts are open, which is active and what is outstanding all belong to the host's workspace store — a component that owned them would be a second source of truth for the thing a wrong-patient event turns on.",
      "The similarity pass is deliberately blunt: it compares folded names and their first four letters. A false positive costs a visible identifier on a row and a false negative costs a note in the wrong chart, so it is tuned to over-report.",
      "Re-assertion is reported, not performed. The component says the clinician has been away long enough; showing the confirmation is the host's, because only the host knows what the chart is about to reveal.",
      "No LRU eviction, no refetch on restore. Both belong to the workspace store — and a nine-hour-old vitals set that looks live is a hazard the store has to prevent, not the tab strip.",
      "Pointer drag reordering is not implemented; the keyboard path is. A drag with no keyboard equivalent fails WCAG 2.5.7, and shipping the accessible half first is the order that cannot produce an inaccessible release."
    ],
    "related": [
      "identity",
      "chart-header",
      "chart-command-palette"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add recent-patient-stack",
    "technicalName": "RecentPatientStack",
    "aliases": [
      "chart switcher",
      "patient tabs",
      "multi chart workspace",
      "open charts",
      "caseload switcher"
    ],
    "tags": [
      "navigation",
      "keyboard-first",
      "themeable",
      "print-safe",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Keep chart ids stable across sessions. The accent is derived from the id, and an id that changes is a chart that changes colour.",
        "Show the identifier on both charts of a similar pair. One row with an identifier and one without is a harder comparison than two that both have one.",
        "Refuse to close a chart with a draft order. An order that vanishes with its tab is an order somebody believes they placed, and nothing downstream will show its absence.",
        "Surface the caseload total. Six unsigned notes with the oldest at three days is the number that decides whether the week ends on time."
      ],
      "dont": [
        "Do not put a close affordance on the tab. It is one mis-tap from losing a draft, and the tab is already the target for the thing people mean to do.",
        "Do not use the accent as the only difference between two charts. Some readers cannot see it and nobody has learned it on their first day.",
        "Do not reorder charts automatically. A chart that moves while the clinician is reaching for it is the interruption this component exists to survive.",
        "Do not treat pinned as a sort key the user can trip over. Reordering must not cross the pinned boundary."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "A therapist's day is six to eight charts with a note owed on each. The stack shows which notes are unsigned and how long they have been unsigned, which is the number that determines whether the week ends on time — and it is the number no dropdown of names can carry.",
      "workflows": [
        "documentation",
        "care-coordination",
        "intake"
      ],
      "phi": {
        "handles": true,
        "notes": "Every open patient's name is on screen at once, persistently, including during a screen share. The small-screen behaviour narrows that deliberately."
      },
      "auditable": false,
      "permissions": [
        "patient.read"
      ],
      "terminology": [
        "FHIR"
      ]
    },
    "variants": [
      {
        "id": "bar",
        "label": "Bar",
        "description": "The tab strip. The set is visible without being opened.",
        "args": {
          "expanded": false
        }
      },
      {
        "id": "panel",
        "label": "Panel",
        "description": "Expanded, with the per-chart pin and close actions.",
        "args": {
          "expanded": true
        }
      }
    ],
    "controls": [
      {
        "prop": "expanded",
        "control": "switch",
        "label": "Expanded",
        "defaultValue": false
      },
      {
        "prop": "onActivate",
        "control": "event",
        "label": "onActivate"
      },
      {
        "prop": "onClose",
        "control": "event",
        "label": "onClose"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "A tablist of tabs with aria-selected, each named with the patient, the reason the chart is open and the work outstanding on it.",
        "evidence": "recent-patient-stack.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Roving tabindex with arrow, Home and End navigation; every affordance is a native button.",
        "evidence": "recent-patient-stack.test.tsx"
      },
      {
        "wcag": "2.5.7",
        "name": "Dragging movements",
        "status": "pass",
        "how": "Reordering is Alt with the up and down arrows. The pointer drag is not shipped without it, so no release can have one and not the other.",
        "evidence": "recent-patient-stack.test.tsx"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "The accent is one of four channels: initials, name, weight and ring. A test asserts two charts with the same accent index are still told apart by name and identifier.",
        "evidence": "recent-patient-stack.test.tsx"
      },
      {
        "wcag": "3.2.2",
        "name": "On input",
        "status": "pass",
        "how": "Moving focus across the stack never activates a chart; activation is a click or Enter. Arrowing past a chart must not open it.",
        "evidence": "recent-patient-stack.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size (minimum)",
        "status": "pass",
        "how": "Tabs carry a 36px minimum block size and every action a 28px one, both above the 24px floor.",
        "evidence": "recent-patient-stack.test.tsx"
      },
      {
        "wcag": "4.1.3",
        "name": "Status messages",
        "status": "pass",
        "how": "A close that is refused or needs confirming opens role=\"alertdialog\" with the reason as its content rather than as a toast that disappears.",
        "evidence": "recent-patient-stack.test.tsx"
      },
      {
        "wcag": "1.4.10",
        "name": "Reflow",
        "status": "pass",
        "how": "Below 40rem the inactive tabs shrink to their avatar and the active one keeps its name, rather than the strip scrolling eleven full-width tabs off the side.",
        "evidence": "recent-patient-stack.test.tsx"
      }
    ],
    "examples": [
      {
        "id": "identity",
        "title": "The hue is derived, not handed out",
        "description": "A chart that was blue this morning must be blue this afternoon. The accent is an FNV-1a hash of the chart id modulo eight, so it is stable across sessions and machines — and it is never the only identity, because a clinician who has learned \"Okonkwo is the green one\" has learned something no new colleague knows.",
        "fixture": "patientRoutine",
        "code": "chartAccent(\"chart-okonkwo\");   // → 3, today and next month\nchartAccent(\"chart-okonkwo-2\"); // → a different slot, deterministically"
      },
      {
        "id": "similar",
        "title": "Two charts that look alike both grow an identifier",
        "description": "Marking only the newcomer would leave the reader comparing a row that has an identifier against a row that does not, which is a harder comparison than two that both do. The pass is deliberately over-eager: a false positive costs a visible MRN and a false negative costs a note in the wrong chart.",
        "fixture": "patients",
        "code": "needsIdentifier([\n  { id: \"a\", display: \"J. Okonkwo\", identifier: \"093-441-208\" },\n  { id: \"b\", display: \"J. Okonjo\",  identifier: \"093-118-774\" },\n]);\n// → Set { \"a\", \"b\" }"
      },
      {
        "id": "closing",
        "title": "Closing is graded, not binary",
        "description": "A clean chart closes. One with an unsigned note asks, because losing the draft is a real loss that a person may still choose. One with a draft order refuses, because an order that vanishes with its tab is an order somebody believes they placed and nothing downstream will show its absence.",
        "fixture": "patientRestricted",
        "code": "canClose(clean);     // { kind: \"close\" }\ncanClose(withNote);  // { kind: \"confirm\", reason: \"… Close and lose the draft?\" }\ncanClose(withOrder); // { kind: \"refuse\",  reason: \"… Sign it or discard it first.\" }"
      },
      {
        "id": "return",
        "title": "Coming back re-asserts who the chart belongs to",
        "description": "Fifteen minutes, because that is roughly the length of an interruption you do not remember having — and that is the interruption that produces the wrong-chart note. A chart with no recorded activity re-asserts too: not knowing how long you were away is not the same as having just left.",
        "fixture": "patientRoutine",
        "code": "needsReassertion({ id, display, lastActiveAt: \"10:00\" }, \"10:20\"); // true\nneedsReassertion({ id, display, lastActiveAt: \"10:00\" }, \"10:05\"); // false\nneedsReassertion({ id, display }, \"10:05\");                        // true"
      }
    ],
    "fixtures": [
      "patientRoutine",
      "patientRestricted",
      "patients"
    ],
    "seo": {
      "slug": "recent-patient-stack",
      "title": "Recent Patient Stack — React multi-chart workspace",
      "description": "A React chart switcher for clinicians: a stable per-chart accent, automatic disambiguation of similar names, unsigned-note badges and a graded close.",
      "primaryKeyword": "react multi chart workspace",
      "secondaryKeywords": [
        "patient chart switcher react",
        "wrong patient error prevention ui",
        "clinical tab strip component",
        "caseload switcher"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "chart-review",
        "care-coordination"
      ],
      "alternatives": [
        {
          "ref": "chart-header",
          "when": "there is one chart and the question is who the patient is"
        }
      ]
    }
  },
  {
    "name": "recorder",
    "title": "Recorder",
    "tier": "free",
    "status": "beta",
    "since": "0.3.0",
    "layer": "pattern",
    "distribution": "registry",
    "summary": "A capture surface that cannot lie about whether it is listening. Five arts over one signal engine, and thirteen failure modes it can tell apart.",
    "tagline": "It cannot lie about whether it is listening.",
    "description": "Ambient documentation, dictation, voice messaging and transcript review. Five arts — pulse, bars, strip, duet, stream — over one engine, with an analyser-driven meter, a silence budget and thirteen device faults.",
    "rationale": "Every voice recorder on the web animates on a timer. An OS mute, a Bluetooth profile switch and a swapped device all deliver digital silence on schedule, and a timer cannot tell that from a quiet room. This one draws only what the analyser reports, then names which of the thirteen faults it is.",
    "categories": [
      "Media",
      "Clinical"
    ],
    "fhir": [],
    "states": [
      "Recording",
      "Armed, awaiting consent",
      "Microphone muted",
      "Device lost",
      "Held, not yet uploaded",
      "Playback with speakers",
      "Playback without diarisation",
      "Live transcript",
      "Inline dictation",
      "Single control"
    ],
    "props": [
      {
        "name": "autoGainControl",
        "type": "boolean",
        "description": "Whether the browser is applying automatic gain control. With AGC on, the meter reports the browser's opinion of the room rather than the room. Nothing is broken, so this surfaces as information — but it has to surface, or the meter looks perfect under every condition.",
        "required": false
      },
      {
        "name": "consent",
        "type": "RecorderConsent | null",
        "description": "The basis the host asserts for recording. Absent or incomplete blocks the `armed → recording` edge. The component renders it and never authors it: it does not obtain consent and does not know what a lawful basis is where you are.",
        "required": false,
        "default": "null"
      },
      {
        "name": "context",
        "type": "string",
        "description": "Where the capture is happening, in the host's own words — \"Encounter · Room 4\", or the field a dictation is going into. Rendered beside the device name, never instead of it.",
        "required": false
      },
      {
        "name": "device",
        "type": "RecorderDevice | null",
        "description": "The device actually delivering audio. Rendered permanently in the capture arts, never filed behind a hover or a settings panel: recording the wrong microphone produces plausible room tone and is the one fault with no signal-level defence, so the name on screen is the only defence there is.",
        "required": false,
        "default": "null"
      },
      {
        "name": "disposition",
        "type": "RecorderDisposition | null",
        "description": "Where the bytes are: held, uploading, queued, transcribing, ready, failed. The component renders this; the host moves the bytes. `held` is the state every thin MediaRecorder wrapper skips, and it is the one that keeps a tick from being a falsehood about a legal record.",
        "required": false,
        "default": "null"
      },
      {
        "name": "durationMs",
        "type": "number",
        "description": "Length of the take in ms, for the playback readout.",
        "required": false,
        "default": "0"
      },
      {
        "name": "expectedDevice",
        "type": "RecorderDevice | null",
        "description": "The device the user chose. When it differs from `device`, the component raises the fault rather than trusting the waveform to betray it.",
        "required": false,
        "default": "null"
      },
      {
        "name": "label",
        "type": "string",
        "description": "Accessible name for the recorder, and the stem of the timer's own label.",
        "required": false,
        "default": "\"Recorder\""
      },
      {
        "name": "markers",
        "type": "readonly RecorderMarker[]",
        "description": "Moments somebody marked, and spans struck from the record. A struck span stays on the timeline as a hatched gap rather than being removed: a removal a reader cannot see is a removal nobody can audit, and an audio file with an invisible splice is worse evidence than one with a labelled hole.",
        "required": false,
        "default": "[]"
      },
      {
        "name": "motion",
        "type": "RecorderMotion",
        "description": "Motion preference. An explicit mechanism rather than only the media query, because WCAG 2.2.2's \"essential\" exception does not apply once a conforming alternative exists — and the still state is that alternative.",
        "required": false,
        "default": "\"auto\""
      },
      {
        "name": "onFault",
        "type": "((fault: RecorderFault | null) => void)",
        "description": "Fires when the worst active fault changes, including back to null. Deduped by code, so a fault that persists across frames reports once.",
        "required": false
      },
      {
        "name": "onLevel",
        "type": "((frame: SignalFrame) => void)",
        "description": "Fires at most 10 times a second, not once a frame.",
        "required": false
      },
      {
        "name": "onMark",
        "type": "(() => void)",
        "description": "Drop a marker at the current position.",
        "required": false
      },
      {
        "name": "onPause",
        "type": "(() => void)",
        "description": "Suspend capture without ending the take. A control that is missing because the host passed no handler is hidden rather than disabled: a dead button is a promise the surface cannot keep.",
        "required": false
      },
      {
        "name": "onSend",
        "type": "(() => void)",
        "description": "Stop and insert, for Strip — the dictation equivalent of stop-and-attach.",
        "required": false
      },
      {
        "name": "onStop",
        "type": "(() => void)",
        "description": "End the take and hand it to the host. The primary action on the capture arts.",
        "required": false
      },
      {
        "name": "onStrike",
        "type": "(() => void)",
        "description": "Strike the last `strikeWindowMs` from the record. Mid-consultation a patient says something and asks for it not to be recorded. Every ambient scribe on the market answers that with \"stop and start again\", which loses the consultation's continuity at exactly the moment nobody wants to operate a UI. The component only RAISES this — the host zeroes the samples, writes the audit record, and hands back a struck marker so the gap stays visible on the timeline. A removal a reader cannot see is a removal nobody can audit.",
        "required": false
      },
      {
        "name": "peaks",
        "type": "Float32Array<ArrayBufferLike> | null",
        "description": "A rendered take, for the playback arts. Peaks come from the ingest sidecar.",
        "required": false,
        "default": "null"
      },
      {
        "name": "phase",
        "type": "'idle' | 'requesting' | 'armed' | 'recording' | 'paused' | 'stopping' | 'held' | 'uploading' | 'queued' | 'transcribing' | 'ready'",
        "description": "Controlled phase. The engine validates every transition.",
        "required": false,
        "default": "\"recording\""
      },
      {
        "name": "position",
        "type": "number",
        "description": "Playhead, 0–1, for the playback arts.",
        "required": false,
        "default": "0"
      },
      {
        "name": "sensitivity",
        "type": "RecorderSensitivity",
        "description": "How much the recording discloses. Changes behaviour rather than only a badge — `restricted` is not a surface a quiet inline control should start.",
        "required": false,
        "default": "\"routine\""
      },
      {
        "name": "silenceBudgetMs",
        "type": "number",
        "description": "Milliseconds below the voice floor before the component escalates.",
        "required": false
      },
      {
        "name": "source",
        "type": "TimeDomainSource | null",
        "description": "The analyser, for the capture arts. The host owns `getUserMedia`.",
        "required": false,
        "default": "null"
      },
      {
        "name": "speakerLabels",
        "type": "readonly [string, string]",
        "description": "Names for the two Duet rails, above the axis and below it.",
        "required": false,
        "default": "[\"Clinician\", \"Patient\"]"
      },
      {
        "name": "speakers",
        "type": "Uint8Array<ArrayBufferLike> | null",
        "description": "One byte of speaker per bucket. Without it Duet renders a single rail.",
        "required": false,
        "default": "null"
      },
      {
        "name": "strikeWindowMs",
        "type": "number",
        "description": "How much a strike removes. Thirty seconds by default.",
        "required": false,
        "default": "30_000"
      },
      {
        "name": "title",
        "type": "string",
        "description": "What the take IS — \"Consultation — 14 Aug, 09:12\". The playback header carries this rather than the speaker names, because the names are already on the axis; printing them twice spends the one line a reviewer reads first on something the picture already says.",
        "required": false
      },
      {
        "name": "track",
        "type": "TrackObservation | null",
        "description": "The live state of the capture track — `readyState` and `muted`. This is what separates the four faults that are byte-identical at the signal layer. An OS mute, a headset mute, a device that ended and a device that was swapped all deliver near-silence on schedule; only the track and the device tell them apart, which is why the component asks for them rather than trying to read them out of the waveform.",
        "required": false,
        "default": "null"
      },
      {
        "name": "turns",
        "type": "readonly RecorderTurn[]",
        "description": "Turns for the transcript art. `interim` is drawn as a guess.",
        "required": false,
        "default": "[]"
      },
      {
        "name": "variant",
        "type": "RecorderArt",
        "description": "The art. Below 280px `bars` reports itself as `strip`.",
        "required": false,
        "default": "\"bars\""
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"onChange\">",
    "exports": [
      {
        "name": "Recorder",
        "props": [
          {
            "name": "autoGainControl",
            "type": "boolean",
            "description": "Whether the browser is applying automatic gain control. With AGC on, the meter reports the browser's opinion of the room rather than the room. Nothing is broken, so this surfaces as information — but it has to surface, or the meter looks perfect under every condition.",
            "required": false
          },
          {
            "name": "consent",
            "type": "RecorderConsent | null",
            "description": "The basis the host asserts for recording. Absent or incomplete blocks the `armed → recording` edge. The component renders it and never authors it: it does not obtain consent and does not know what a lawful basis is where you are.",
            "required": false,
            "default": "null"
          },
          {
            "name": "context",
            "type": "string",
            "description": "Where the capture is happening, in the host's own words — \"Encounter · Room 4\", or the field a dictation is going into. Rendered beside the device name, never instead of it.",
            "required": false
          },
          {
            "name": "device",
            "type": "RecorderDevice | null",
            "description": "The device actually delivering audio. Rendered permanently in the capture arts, never filed behind a hover or a settings panel: recording the wrong microphone produces plausible room tone and is the one fault with no signal-level defence, so the name on screen is the only defence there is.",
            "required": false,
            "default": "null"
          },
          {
            "name": "disposition",
            "type": "RecorderDisposition | null",
            "description": "Where the bytes are: held, uploading, queued, transcribing, ready, failed. The component renders this; the host moves the bytes. `held` is the state every thin MediaRecorder wrapper skips, and it is the one that keeps a tick from being a falsehood about a legal record.",
            "required": false,
            "default": "null"
          },
          {
            "name": "durationMs",
            "type": "number",
            "description": "Length of the take in ms, for the playback readout.",
            "required": false,
            "default": "0"
          },
          {
            "name": "expectedDevice",
            "type": "RecorderDevice | null",
            "description": "The device the user chose. When it differs from `device`, the component raises the fault rather than trusting the waveform to betray it.",
            "required": false,
            "default": "null"
          },
          {
            "name": "label",
            "type": "string",
            "description": "Accessible name for the recorder, and the stem of the timer's own label.",
            "required": false,
            "default": "\"Recorder\""
          },
          {
            "name": "markers",
            "type": "readonly RecorderMarker[]",
            "description": "Moments somebody marked, and spans struck from the record. A struck span stays on the timeline as a hatched gap rather than being removed: a removal a reader cannot see is a removal nobody can audit, and an audio file with an invisible splice is worse evidence than one with a labelled hole.",
            "required": false,
            "default": "[]"
          },
          {
            "name": "motion",
            "type": "RecorderMotion",
            "description": "Motion preference. An explicit mechanism rather than only the media query, because WCAG 2.2.2's \"essential\" exception does not apply once a conforming alternative exists — and the still state is that alternative.",
            "required": false,
            "default": "\"auto\""
          },
          {
            "name": "onFault",
            "type": "((fault: RecorderFault | null) => void)",
            "description": "Fires when the worst active fault changes, including back to null. Deduped by code, so a fault that persists across frames reports once.",
            "required": false
          },
          {
            "name": "onLevel",
            "type": "((frame: SignalFrame) => void)",
            "description": "Fires at most 10 times a second, not once a frame.",
            "required": false
          },
          {
            "name": "onMark",
            "type": "(() => void)",
            "description": "Drop a marker at the current position.",
            "required": false
          },
          {
            "name": "onPause",
            "type": "(() => void)",
            "description": "Suspend capture without ending the take. A control that is missing because the host passed no handler is hidden rather than disabled: a dead button is a promise the surface cannot keep.",
            "required": false
          },
          {
            "name": "onSend",
            "type": "(() => void)",
            "description": "Stop and insert, for Strip — the dictation equivalent of stop-and-attach.",
            "required": false
          },
          {
            "name": "onStop",
            "type": "(() => void)",
            "description": "End the take and hand it to the host. The primary action on the capture arts.",
            "required": false
          },
          {
            "name": "onStrike",
            "type": "(() => void)",
            "description": "Strike the last `strikeWindowMs` from the record. Mid-consultation a patient says something and asks for it not to be recorded. Every ambient scribe on the market answers that with \"stop and start again\", which loses the consultation's continuity at exactly the moment nobody wants to operate a UI. The component only RAISES this — the host zeroes the samples, writes the audit record, and hands back a struck marker so the gap stays visible on the timeline. A removal a reader cannot see is a removal nobody can audit.",
            "required": false
          },
          {
            "name": "peaks",
            "type": "Float32Array<ArrayBufferLike> | null",
            "description": "A rendered take, for the playback arts. Peaks come from the ingest sidecar.",
            "required": false,
            "default": "null"
          },
          {
            "name": "phase",
            "type": "'idle' | 'requesting' | 'armed' | 'recording' | 'paused' | 'stopping' | 'held' | 'uploading' | 'queued' | 'transcribing' | 'ready'",
            "description": "Controlled phase. The engine validates every transition.",
            "required": false,
            "default": "\"recording\""
          },
          {
            "name": "position",
            "type": "number",
            "description": "Playhead, 0–1, for the playback arts.",
            "required": false,
            "default": "0"
          },
          {
            "name": "sensitivity",
            "type": "RecorderSensitivity",
            "description": "How much the recording discloses. Changes behaviour rather than only a badge — `restricted` is not a surface a quiet inline control should start.",
            "required": false,
            "default": "\"routine\""
          },
          {
            "name": "silenceBudgetMs",
            "type": "number",
            "description": "Milliseconds below the voice floor before the component escalates.",
            "required": false
          },
          {
            "name": "source",
            "type": "TimeDomainSource | null",
            "description": "The analyser, for the capture arts. The host owns `getUserMedia`.",
            "required": false,
            "default": "null"
          },
          {
            "name": "speakerLabels",
            "type": "readonly [string, string]",
            "description": "Names for the two Duet rails, above the axis and below it.",
            "required": false,
            "default": "[\"Clinician\", \"Patient\"]"
          },
          {
            "name": "speakers",
            "type": "Uint8Array<ArrayBufferLike> | null",
            "description": "One byte of speaker per bucket. Without it Duet renders a single rail.",
            "required": false,
            "default": "null"
          },
          {
            "name": "strikeWindowMs",
            "type": "number",
            "description": "How much a strike removes. Thirty seconds by default.",
            "required": false,
            "default": "30_000"
          },
          {
            "name": "title",
            "type": "string",
            "description": "What the take IS — \"Consultation — 14 Aug, 09:12\". The playback header carries this rather than the speaker names, because the names are already on the axis; printing them twice spends the one line a reviewer reads first on something the picture already says.",
            "required": false
          },
          {
            "name": "track",
            "type": "TrackObservation | null",
            "description": "The live state of the capture track — `readyState` and `muted`. This is what separates the four faults that are byte-identical at the signal layer. An OS mute, a headset mute, a device that ended and a device that was swapped all deliver near-silence on schedule; only the track and the device tell them apart, which is why the component asks for them rather than trying to read them out of the waveform.",
            "required": false,
            "default": "null"
          },
          {
            "name": "turns",
            "type": "readonly RecorderTurn[]",
            "description": "Turns for the transcript art. `interim` is drawn as a guess.",
            "required": false,
            "default": "[]"
          },
          {
            "name": "variant",
            "type": "RecorderArt",
            "description": "The art. Below 280px `bars` reports itself as `strip`.",
            "required": false,
            "default": "\"bars\""
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"onChange\">"
      },
      {
        "name": "RecorderDispositionStrip",
        "props": [
          {
            "name": "disposition",
            "type": "RecorderDisposition",
            "description": "Where the bytes are. The component renders this; the host moves them.",
            "required": true
          },
          {
            "name": "attachedTo",
            "type": "string",
            "description": "What the transcript is attached to once it is ready.",
            "required": false,
            "default": "\"encounter\""
          },
          {
            "name": "durationMs",
            "type": "number",
            "description": "Length of the take, for the \"captured\" step's readout.",
            "required": false,
            "default": "0"
          },
          {
            "name": "language",
            "type": "string",
            "description": "Recogniser language, for the \"transcribed\" step.",
            "required": false,
            "default": "\"en-GB\""
          },
          {
            "name": "onRetry",
            "type": "(() => void)",
            "description": "Offered on `failed`, and only then — a retry that cannot retry is a lie.",
            "required": false
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDivElement>"
      }
    ],
    "usage": "import { Recorder } from \"@/components/zoblocks/recorder\";\n\n// Ambient capture. The host owns getUserMedia; the component owns the truth\n// about what is arriving.\n<Recorder\n  variant=\"bars\"\n  phase=\"recording\"\n  source={analyser}\n  device={{ deviceId: \"jabra\", label: \"Jabra Link 380\" }}\n  expectedDevice={{ deviceId: \"jabra\", label: \"Jabra Link 380\" }}\n  onFault={(fault) => fault && report(fault.code)}\n/>\n\n// Reviewing the take. Peaks and speakers come from the ingest sidecar.\n<Recorder\n  variant=\"duet\"\n  phase=\"ready\"\n  peaks={peaks}\n  speakers={speakers}\n  position={0.44}\n  durationMs={754_000}\n  speakerLabels={[\"Dr Okafor\", \"Patient\"]}\n/>",
    "guidance": {
      "use": [
        "Ambient documentation and dictation, where the clinician is looking at the patient rather than the screen and needs to see at a glance that capture is working.",
        "Reviewing a finished take — an appeal, a supervision session, a patient asking what was said. Duet folds the speaker onto the axis so talk-time balance reads without reading.",
        "Anywhere the network is not a given. The disposition states make held-but-not-sent a thing the interface can say."
      ],
      "avoid": [
        "As proof that audio was captured. It reports thirteen faults and there are more; recording the wrong microphone produces plausible room tone and passes every one of them.",
        "Starting a restricted or Part 2 recording from the strip art. A control that quiet is not where a disclosure should begin.",
        "As a consent mechanism. It renders a basis the host asserts and refuses to start without one; it does not obtain consent and does not know what a lawful basis is."
      ]
    },
    "accessibility": [
      {
        "label": "The timer is polled, never pushed",
        "detail": "role=timer, an aria-live=off region. Polite would announce a number every second for twenty minutes."
      },
      {
        "label": "Announced on transitions, not continuously",
        "detail": "One status region carries phase changes, a sentence each. Crossing the silence budget is the only assertive announcement."
      },
      {
        "label": "The waveform is hidden; the transcript is the equivalent",
        "detail": "The art is aria-hidden: it pictures a number already announced. Where a transcript exists, Stream is what a screen reader reads instead."
      },
      {
        "label": "Motion is replaced by a number, not removed",
        "detail": "The scroll stops; the meter does not. A dBFS readout and a tabular timer carry what the scroll carried. `motion` is the WCAG 2.2.2 mechanism."
      },
      {
        "label": "Non-text contrast is solved against the pane",
        "detail": "Played and unplayed cannot both clear 3:1 on one ramp. Unplayed is solved against the pane; the boundary is a wash plus the playhead."
      }
    ],
    "limitations": [
      "It does not move bytes. No upload, no retry, no queue, no recogniser — it renders where a recording is and the host is responsible for getting it there.",
      "Duet needs a peaks sidecar and one speaker byte per bucket, emitted at ingest. Without diarisation it renders a single rail rather than guessing.",
      "Consent copy, disclosure wording and mid-session redaction are deliberately unbuilt, pending clinical and legal review. consent is a typed opaque object the component renders and never authors.",
      "Requires styles/zoblocks-recorder.css, installed with recorder-core. Without it the arts render as unstyled markup."
    ],
    "related": [
      "pulse-loader",
      "rhythm-loader",
      "clinical-note"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge",
      "@zoblocks/recorder-core"
    ],
    "install": "npx @zoblocks/cli add recorder"
  },
  {
    "name": "result-value",
    "title": "Result Value",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A single observation rendered so that the four ways a number can lie to you are all impossible.",
    "tagline": "One observation, rendered so the number cannot mislead.",
    "description": "Value, unit and interpretation on one line, qualifiers on a second only when they exist. Seven distinct absence reasons instead of an em dash, a stated interpretation that always beats a derived one, a reference range that says so when there isn't one, and a correction that shows the superseded value rather than a badge.",
    "rationale": "The most dangerous component in healthcare software is the one that renders a number, because every one of its failures looks perfect on screen. A preliminary result rendered identically to a final one: the clinician acts, and the value changes at 04:00. A result with no reference range rendered as though it were normal, because nothing was highlighted. A corrected result that silently replaced the value somebody read an hour ago and wrote into a note. An absent value rendered as an em dash, indistinguishable from a rendering bug, a cancelled test, a haemolysed specimen and a patient who declined the draw. None of the four is a styling problem and none is fixed by a nicer table. Each needs a shape: status is never implicit, an absent range is stated rather than left blank, a correction carries the old number with a line through it because the hazard is the reader's memory of it, and absence is seven sentences.",
    "categories": [
      "Clinical",
      "Data Display"
    ],
    "fhir": [
      {
        "name": "Observation",
        "url": "https://hl7.org/fhir/R4/observation.html",
        "note": "value[x], dataAbsentReason, status, interpretation, referenceRange including appliesTo, and note. DataAbsentReason renders as seven distinct states rather than one blank."
      }
    ],
    "resource": "Observation",
    "resourceUrl": "https://hl7.org/fhir/R4/observation.html",
    "states": [
      "Final, in range",
      "Critical, with a delta",
      "Preliminary — not verified by the laboratory",
      "Corrected — the superseded value is shown",
      "No reference range for this patient",
      "A range that needs its qualification",
      "Delta suppressed — the method changed",
      "Patient-reported",
      "Extracted by a model",
      "Absent — never ordered",
      "Absent — awaiting a result",
      "Absent — cancelled",
      "Absent — specimen problem",
      "Absent — patient declined",
      "Absent — restricted, and a value exists",
      "Absent — no value and no reason",
      "Compact, in a grid",
      "Interactive — opens the report"
    ],
    "props": [
      {
        "name": "value",
        "type": "ResultValueData",
        "description": "The result itself, already adapted from FHIR. Use `fromObservation()` rather than building it by hand — the adapter leaves undefined everything it cannot determine, which is what keeps a missing range from becoming an assumed one.",
        "required": true
      },
      {
        "name": "density",
        "type": "'compact' | 'default'",
        "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
        "required": false,
        "default": "\"default\""
      },
      {
        "name": "hideAnalyte",
        "type": "boolean",
        "description": "Hides the analyte name, for a grid whose column header already carries it.",
        "required": false,
        "default": "false"
      },
      {
        "name": "now",
        "type": "string",
        "description": "ISO 8601, supplied by the host. Without it no relative time is rendered at all — which is correct. A result with no age is less misleading than one whose age is wrong.",
        "required": false
      },
      {
        "name": "onOpenReport",
        "type": "((value: ResultValueData) => void)",
        "description": "Opens the specimen chain. Makes the value a button; inert without it.",
        "required": false
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"children\">",
    "exports": [
      {
        "name": "ResultValue",
        "props": [
          {
            "name": "value",
            "type": "ResultValueData",
            "description": "The result itself, already adapted from FHIR. Use `fromObservation()` rather than building it by hand — the adapter leaves undefined everything it cannot determine, which is what keeps a missing range from becoming an assumed one.",
            "required": true
          },
          {
            "name": "density",
            "type": "'compact' | 'default'",
            "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
            "required": false,
            "default": "\"default\""
          },
          {
            "name": "hideAnalyte",
            "type": "boolean",
            "description": "Hides the analyte name, for a grid whose column header already carries it.",
            "required": false,
            "default": "false"
          },
          {
            "name": "now",
            "type": "string",
            "description": "ISO 8601, supplied by the host. Without it no relative time is rendered at all — which is correct. A result with no age is less misleading than one whose age is wrong.",
            "required": false
          },
          {
            "name": "onOpenReport",
            "type": "((value: ResultValueData) => void)",
            "description": "Opens the specimen chain. Makes the value a button; inert without it.",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"children\">"
      }
    ],
    "usage": "import { ResultValue, fromObservation } from \"@/components/zoblocks/result-value\";\nimport \"@/styles/zoblocks-result-value.css\";\n\n<ResultValue value={fromObservation(observation)} now={serverTime} />",
    "guidance": {
      "use": [
        "Anywhere a single observation is rendered — lab results, vitals, screening scores, device readings, point-of-care tests, patient-reported measures.",
        "In a results grid with density=\"compact\" and hideAnalyte, so the column header carries the name and the rows carry tabular figures that line up.",
        "With the prior value supplied, so a delta appears where it is meaningful and is suppressed where it is not.",
        "In a patient portal, where the absence reasons matter most: a portal that renders an em dash has told the patient nothing and worried them anyway."
      ],
      "avoid": [
        "For a panel of several observations. Compose one per row rather than passing a component array — the reference range and the interpretation belong to a single analyte.",
        "Without `now` if a relative age matters. Omitting it renders no age at all, which is correct; passing a client clock is not.",
        "As a general-purpose statistic display. The four failures it is shaped around are clinical, and the shapes cost layout that a dashboard metric does not need."
      ]
    },
    "accessibility": [
      {
        "label": "The accessible name is the whole clinical sentence",
        "detail": "\"Potassium 6.8 millimoles per litre, critical, reference 3.5 to 5.1, final, resulted 41 minutes ago.\" One string, with everything inside hidden from the tree — because the clinical meaning is in the combination, and six separately-labelled nodes are read as six fragments with pauses between them. 6.8 is unremarkable until the unit, the range and the word critical arrive in the same breath."
      },
      {
        "label": "Units are spoken, not spelled",
        "detail": "mmol/L reaches a screen reader as \"millimoles per litre\". Left as the symbol it is read character by character or skipped entirely, and a value without its unit is not a result."
      },
      {
        "label": "Direction is a glyph before it is a hue",
        "detail": "A delta carries an up or down triangle and a signed number, and the direction reaches the accessible name as a word. The colour is reinforcement, which is the only thing colour is allowed to be here."
      },
      {
        "label": "Inert unless there is a report to open",
        "detail": "role=\"group\" with a label by default and no tab stop. Given onOpenReport it becomes a real button. A focusable element that does nothing is worse in a grid than anywhere else, because there are five hundred of them."
      },
      {
        "label": "Absence is never an em dash",
        "detail": "Seven reasons, each with a word and a sentence. An em dash is indistinguishable from a rendering bug and asks the reader to guess between \"nobody ordered it\", \"the specimen haemolysed\" and \"you are not allowed to see it\" — three answers with three different next actions."
      }
    ],
    "limitations": [
      "Presentational only. It does not fetch, poll, or subscribe — a corrected result appears when the host re-renders with a new versionId, and nothing here will discover the correction on its own.",
      "The derived interpretation never reaches critical. A panic threshold is a laboratory policy rather than a distance from the reference range, so a red chip only ever appears when the source asserted one.",
      "No unit conversion. A value is rendered in the unit it arrived in; converting mg/dL to mmol/L silently is how the wrong number gets documented.",
      "The spoken-unit table covers the common laboratory units. An unlisted unit is spoken as written, which is correct but reads poorly."
    ],
    "related": [
      "clinical-status",
      "care-timeline",
      "allergy-chip",
      "risk-indicator",
      "provenance-chip",
      "trend-indicator",
      "data-grid"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add result-value",
    "technicalName": "ResultValue",
    "aliases": [
      "lab result",
      "observation value",
      "vital sign display",
      "lab value",
      "test result"
    ],
    "tags": [
      "data-display",
      "themeable",
      "print-safe",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Pass `versionId` from the record. It is what makes a correction re-render and a filter keystroke not.",
        "Supply `noRangeReason` when the laboratory supplied no range, rather than leaving the range undefined and hoping.",
        "Give the prior value its `differentMethod` flag when the assay changed. The delta disappears, which is the correct answer."
      ],
      "dont": [
        "Do not derive an interpretation upstream and pass it as if the lab stated it. The component distinguishes the two, and a derived critical is a claim nobody made.",
        "Do not replace the absence sentence with a shorter one to fit a column. Narrow the column.",
        "Do not colour the value itself by interpretation. The chip carries the interpretation; a red number is colour-alone and disappears in greyscale."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "Every number a clinician reads, and every number a patient reads in a portal. Screening scores are observations too: a PHQ-9 of 14 with status amended because the patient revised item 9 after the session is exactly this component's problem, at a much higher consequence than a sodium.",
      "workflows": [
        "assessment",
        "documentation",
        "treatment-planning",
        "medication"
      ],
      "phi": {
        "handles": true,
        "notes": "Renders a clinical value and its context. The masked absence exists precisely so a restricted result can be acknowledged on a screen without disclosing it — the reader learns a value exists and that they may not see it, which is a different fact from there being no value."
      },
      "auditable": false,
      "permissions": [
        "observation.read"
      ],
      "terminology": [
        "LOINC",
        "SNOMED CT",
        "FHIR"
      ]
    },
    "variants": [
      {
        "id": "default",
        "label": "Default",
        "description": "Value, unit, interpretation and the qualifier line. For a chart or a detail panel.",
        "args": {
          "density": "default"
        }
      },
      {
        "id": "compact",
        "label": "Compact",
        "description": "Tighter type and spacing, for a grid at forty rows and up.",
        "args": {
          "density": "compact"
        }
      },
      {
        "id": "grid",
        "label": "In a grid",
        "description": "The analyte hidden, because the column header already carries it.",
        "args": {
          "density": "compact",
          "hideAnalyte": true
        }
      }
    ],
    "controls": [
      {
        "prop": "density",
        "control": "segmented",
        "label": "Density",
        "options": [
          "compact",
          "default"
        ],
        "defaultValue": "default"
      },
      {
        "prop": "hideAnalyte",
        "control": "switch",
        "label": "Hide analyte",
        "defaultValue": false
      },
      {
        "prop": "value",
        "control": "fixture",
        "label": "Observation",
        "options": [
          "observationPotassiumCritical",
          "observationPreliminary",
          "observationCorrected",
          "observationMasked",
          "observationDeclined"
        ]
      },
      {
        "prop": "now",
        "control": "text",
        "label": "Now (ISO 8601)"
      },
      {
        "prop": "onOpenReport",
        "control": "event",
        "label": "onOpenReport"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "1.3.1",
        "name": "Info and relationships",
        "status": "pass",
        "how": "One labelled group carrying the whole clinical sentence, with every inner node aria-hidden. The relationship between value, unit, range and status is in the sentence rather than in visual adjacency.",
        "evidence": "result-value.test.tsx"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "Interpretation is a ClinicalStatus chip with a shape and a word; delta direction is a glyph and a signed number. No fact is carried by hue alone, and a test asserts the value itself is never coloured by interpretation.",
        "evidence": "result-value.test.tsx"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "role=\"group\" with a composed label when static; a real button when onOpenReport is supplied. Never a focusable div.",
        "evidence": "result-value.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "The report affordance is a native button, reached and activated by keyboard with no handler of the component's own.",
        "evidence": "result-value.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size",
        "status": "pass",
        "how": "The interactive form holds a 24px minimum at both densities, with negative inline margin so the larger hit area does not shift the column.",
        "evidence": "result-value.test.tsx"
      },
      {
        "wcag": "1.4.10",
        "name": "Reflow",
        "status": "pass",
        "how": "The qualifier line wraps below the value at narrow widths and the interpretation word never truncates — a truncated \"criti…\" is worse than no chip.",
        "evidence": "result-value.test.tsx"
      },
      {
        "wcag": "1.4.12",
        "name": "Text spacing",
        "status": "pass",
        "how": "No fixed heights anywhere; both lines are flex rows that grow with user line-height and letter-spacing rather than clipping.",
        "evidence": "result-value.test.tsx"
      },
      {
        "wcag": "2.2.1",
        "name": "Timing adjustable",
        "status": "not-applicable",
        "how": "No timing of any kind. The relative age is computed from a `now` the host supplies, never from a clock the component reads."
      }
    ],
    "examples": [
      {
        "id": "from-fhir",
        "title": "A FHIR Observation, unedited",
        "description": "The adapter leaves undefined everything it cannot determine. A missing referenceRange becomes no range — not an empty one, and not a silent assumption of normality.",
        "fixture": "observationPotassiumCritical",
        "code": "import { ResultValue, fromObservation } from \"@/components/zoblocks/result-value\";\nimport { observationPotassiumCritical } from \"@zoblocks/fixtures\";\n\n// `now` is the host's, never a clock this component reads: a relative time\n// computed at render silently ages on a ward workstation left open all shift.\n<ResultValue value={fromObservation(observationPotassiumCritical)} now={serverTime} />;"
      },
      {
        "id": "absence",
        "title": "Seven absences, seven sentences",
        "description": "An em dash is indistinguishable from a rendering bug, and it asks the reader to guess between three answers with three different next actions. Restricted is the one that is not a gap: a value exists and the reader may not see it.",
        "fixture": "observationMasked",
        "code": "<ResultValue value={{ id: \"hba1c\", analyte: \"HbA1c\", absent: \"not-ordered\" }} />\n<ResultValue value={{ id: \"tsh\", analyte: \"TSH\", absent: \"specimen-problem\",\n                      absentDetail: \"Haemolysed. Recollection requested.\" }} />\n<ResultValue value={{ id: \"bh\", analyte: \"Toxicology\", absent: \"masked\" }} />"
      },
      {
        "id": "correction",
        "title": "A correction shows the number it replaced",
        "description": "A badge saying \"corrected\" does not address the hazard, which is that somebody read the old value an hour ago and wrote it into a note. The old number, struck through, with the time it changed, does.",
        "fixture": "observationCorrected",
        "code": "<ResultValue\n  value={{\n    id: \"trop\", versionId: \"2\",\n    analyte: \"Troponin I\", value: 0.09, unit: \"ng/mL\",\n    range: { high: 0.04 },\n    status: \"corrected\",\n    superseded: { value: \"<0.04\", at: \"14:22 today\" },\n  }}\n/>;"
      },
      {
        "id": "delta-suppressed",
        "title": "A delta the component refuses to draw",
        "description": "Two numbers from two assays subtracted from each other is not a delta. Flagging the method change and annotating the number anyway would not help — an annotated wrong number still gets read as a number — so the delta disappears entirely.",
        "fixture": "observationPreliminary",
        "code": "<ResultValue\n  value={{\n    id: \"tsh\", analyte: \"TSH\", value: 6.4, unit: \"mIU/L\",\n    range: { low: 0.4, high: 4.0 },\n    // Same analyte, different assay. No delta is drawn.\n    prior: { value: 3.1, at: \"2026-02-01T09:00:00Z\", differentMethod: true },\n  }}\n/>;"
      }
    ],
    "fixtures": [
      "observationPotassiumCritical",
      "observationPreliminary",
      "observationCorrected",
      "observationMasked",
      "observationDeclined",
      "observationUninterpreted",
      "observationNotAsked"
    ],
    "seo": {
      "slug": "result-value",
      "title": "Result Value — React lab result component",
      "description": "A React component for a single clinical observation: seven absence reasons, reference ranges, corrected values shown in full, and a FHIR Observation adapter.",
      "primaryKeyword": "react lab result component",
      "secondaryKeywords": [
        "fhir observation react",
        "clinical value display react",
        "reference range component",
        "lab results table react"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [
        "clinical-status"
      ],
      "usedIn": [],
      "patterns": [
        "results-review",
        "clinical-documentation"
      ],
      "alternatives": [
        {
          "ref": "clinical-status",
          "when": "the thing being rendered is a state rather than a measurement"
        },
        {
          "ref": "care-timeline",
          "when": "the question is what happened and when, rather than what one value is"
        }
      ]
    }
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
    "tagline": "One rhythm strip, swept like a monitor. The quiet wait.",
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
        "type": "LoaderAnnounce",
        "description": "Live-region politeness while indeterminate.",
        "required": false
      },
      {
        "name": "bpm",
        "type": "number",
        "description": "Beats per minute, 40–100. Clamped to a resting range.",
        "required": false
      },
      {
        "name": "delay",
        "type": "number",
        "description": "Wait this long before appearing, so a fast response never flashes a loader.",
        "required": false
      },
      {
        "name": "hint",
        "type": "string",
        "description": "A second line under the label. Never a substitute for it.",
        "required": false
      },
      {
        "name": "label",
        "type": "string",
        "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
        "required": false
      },
      {
        "name": "minDuration",
        "type": "number",
        "description": "Once visible, stay at least this long, so the loader never blinks out.",
        "required": false
      },
      {
        "name": "mode",
        "type": "LoaderMode",
        "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
        "required": false
      },
      {
        "name": "motion",
        "type": "LoaderMotion",
        "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void)",
        "description": "Fires once, when `slowAfter` elapses.",
        "required": false
      },
      {
        "name": "open",
        "type": "boolean",
        "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
        "required": false
      },
      {
        "name": "progress",
        "type": "number",
        "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
        "required": false
      },
      {
        "name": "scrim",
        "type": "boolean",
        "description": "Translucent backdrop behind `overlay` and `page`.",
        "required": false
      },
      {
        "name": "showLabel",
        "type": "boolean",
        "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
        "required": false
      },
      {
        "name": "size",
        "type": "number | LoaderSize",
        "description": "Named step or an explicit art width in pixels.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number",
        "description": "Announce a stall after this long. 0 disables.",
        "required": false
      },
      {
        "name": "slowHint",
        "type": "string",
        "description": "Replaces the default stall wording.",
        "required": false
      },
      {
        "name": "speed",
        "type": "number",
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
            "type": "LoaderAnnounce",
            "description": "Live-region politeness while indeterminate.",
            "required": false
          },
          {
            "name": "bpm",
            "type": "number",
            "description": "Beats per minute, 40–100. Clamped to a resting range.",
            "required": false
          },
          {
            "name": "delay",
            "type": "number",
            "description": "Wait this long before appearing, so a fast response never flashes a loader.",
            "required": false
          },
          {
            "name": "hint",
            "type": "string",
            "description": "A second line under the label. Never a substitute for it.",
            "required": false
          },
          {
            "name": "label",
            "type": "string",
            "description": "What is loading. Always rendered — visibly when `showLabel`, and to assistive technology either way, because a loader nobody can hear is a silent wait.",
            "required": false
          },
          {
            "name": "minDuration",
            "type": "number",
            "description": "Once visible, stay at least this long, so the loader never blinks out.",
            "required": false
          },
          {
            "name": "mode",
            "type": "LoaderMode",
            "description": "`inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport.",
            "required": false
          },
          {
            "name": "motion",
            "type": "LoaderMotion",
            "description": "`auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void)",
            "description": "Fires once, when `slowAfter` elapses.",
            "required": false
          },
          {
            "name": "open",
            "type": "boolean",
            "description": "Controlled visibility. Setting false runs the exit and respects `minDuration`.",
            "required": false
          },
          {
            "name": "progress",
            "type": "number",
            "description": "0–100 turns the loader determinate. Omit for an unknown wait.",
            "required": false
          },
          {
            "name": "scrim",
            "type": "boolean",
            "description": "Translucent backdrop behind `overlay` and `page`.",
            "required": false
          },
          {
            "name": "showLabel",
            "type": "boolean",
            "description": "Show the label as text. Defaults to true for `overlay` and `page`.",
            "required": false
          },
          {
            "name": "size",
            "type": "number | LoaderSize",
            "description": "Named step or an explicit art width in pixels.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number",
            "description": "Announce a stall after this long. 0 disables.",
            "required": false
          },
          {
            "name": "slowHint",
            "type": "string",
            "description": "Replaces the default stall wording.",
            "required": false
          },
          {
            "name": "speed",
            "type": "number",
            "description": "Cadence multiplier, 0.5–2. Clamped.",
            "required": false,
            "default": "1"
          }
        ],
        "extendsType": "LoaderCommonProps"
      }
    ],
    "usage": "import { RhythmLoader } from \"@/components/zoblocks/rhythm-loader\";\n\n// Inline, beside a control\n<RhythmLoader size=\"sm\" label=\"Loading results\" />\n\n// Clinical dashboard panel, slower cadence\n<RhythmLoader mode=\"overlay\" bpm={52} label=\"Loading the worklist\" delay={200} />",
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
      "Requires styles/zoblocks-loader.css, installed with loader-core.",
      "A single fixed complex. It does not vary, and it is not clinical data."
    ],
    "related": [
      "pulse-loader",
      "breath-loader",
      "infusion-loader",
      "helix-loader",
      "recorder"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add rhythm-loader",
    "relationships": {
      "builtWith": [],
      "usedIn": [
        "pulse-loader"
      ],
      "patterns": [],
      "alternatives": []
    }
  },
  {
    "name": "risk-indicator",
    "title": "Risk Indicator",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A risk score that cannot be displayed without its date, its drivers, and the fact that it is not a diagnosis.",
    "tagline": "A score with its date, its drivers, and its limits.",
    "description": "The band leads and the numeral is demoted. Staleness is on the face rather than in a tooltip, an expired score offers recompute or acknowledge and no third option, and the not-a-diagnosis framing is a required prop rather than a convention.",
    "rationale": "Risk scores are the most casually rendered artefact in healthcare software: a number, a colour, a tooltip nobody reads. Three things go wrong. The score is stale — computed nightly, shown at noon, after the admission that would have changed it. The score is unattributed, so the clinician cannot see that 70% of it is driven by one ED visit eighteen months ago. And the score is read as a diagnosis, which is how an externally validated sepsis model with an AUC of 0.63 came to be trusted by clinicians who were never shown its performance. Each needs a shape rather than a caveat: the validity window is data because a 24-hour deterioration model and a 12-month readmission model expire differently, drivers are part of the value type rather than an optional extra, and the framing sentence is a required prop because every product that made it optional shipped without it.",
    "categories": [
      "Clinical",
      "AI"
    ],
    "fhir": [
      {
        "name": "RiskAssessment",
        "url": "https://hl7.org/fhir/R4/riskassessment.html",
        "note": "prediction[].probabilityDecimal and qualitativeRisk, whenPeriod.end as the validity window, basis[] as unweighted drivers, occurrenceDateTime and method. Pairs with a DSI source-attribute record for the model itself."
      }
    ],
    "resource": "RiskAssessment",
    "resourceUrl": "https://hl7.org/fhir/R4/riskassessment.html",
    "states": [
      "High, with weighted drivers",
      "Moderate",
      "Low",
      "Imminent",
      "Not scored — the model could not",
      "Expired — past its validity window",
      "Unbounded — no validity window declared",
      "One factor dominates the score",
      "Drivers with no weights, from basis[]",
      "Percentile with its cohort",
      "Model card reachable",
      "Compact, in a panel list"
    ],
    "props": [
      {
        "name": "assessment",
        "type": "RiskAssessment",
        "description": "The RiskAssessment, with its drivers and the date it was computed. A score cannot render without them — it is a statistical estimate, not a diagnosis, and undated it is not even that.",
        "required": true
      },
      {
        "name": "notADiagnosis",
        "type": "string",
        "description": "The framing, and it is required. Not a default string either: what a score is not depends on what it is — a readmission model and a suicide-risk model need different sentences, and a shared one would be wrong for both.",
        "required": true
      },
      {
        "name": "now",
        "type": "string",
        "description": "ISO 8601, supplied by the host. The component never reads a clock.",
        "required": true
      },
      {
        "name": "density",
        "type": "'compact' | 'default'",
        "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
        "required": false,
        "default": "\"default\""
      },
      {
        "name": "driverCount",
        "type": "number",
        "description": "How many drivers to show on the face. The rest live in the explanation.",
        "required": false,
        "default": "4"
      },
      {
        "name": "onAcknowledge",
        "type": "((assessment: RiskAssessment) => void)",
        "description": "Acknowledges an expired score. A stale score cannot be dismissed — only recomputed or acknowledged — and the acknowledgement is the host's to record.",
        "required": false
      },
      {
        "name": "onOpenModel",
        "type": "((assessment: RiskAssessment) => void)",
        "description": "Opens the model card. See the DSI source-attribute record.",
        "required": false
      },
      {
        "name": "onRecompute",
        "type": "((assessment: RiskAssessment) => void)",
        "description": "Fired when the reader asks for a fresh score. Without it a stale score says it is stale and offers nothing to do about it.",
        "required": false
      }
    ],
    "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"children\">",
    "exports": [
      {
        "name": "RiskIndicator",
        "props": [
          {
            "name": "assessment",
            "type": "RiskAssessment",
            "description": "The RiskAssessment, with its drivers and the date it was computed. A score cannot render without them — it is a statistical estimate, not a diagnosis, and undated it is not even that.",
            "required": true
          },
          {
            "name": "notADiagnosis",
            "type": "string",
            "description": "The framing, and it is required. Not a default string either: what a score is not depends on what it is — a readmission model and a suicide-risk model need different sentences, and a shared one would be wrong for both.",
            "required": true
          },
          {
            "name": "now",
            "type": "string",
            "description": "ISO 8601, supplied by the host. The component never reads a clock.",
            "required": true
          },
          {
            "name": "density",
            "type": "'compact' | 'default'",
            "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
            "required": false,
            "default": "\"default\""
          },
          {
            "name": "driverCount",
            "type": "number",
            "description": "How many drivers to show on the face. The rest live in the explanation.",
            "required": false,
            "default": "4"
          },
          {
            "name": "onAcknowledge",
            "type": "((assessment: RiskAssessment) => void)",
            "description": "Acknowledges an expired score. A stale score cannot be dismissed — only recomputed or acknowledged — and the acknowledgement is the host's to record.",
            "required": false
          },
          {
            "name": "onOpenModel",
            "type": "((assessment: RiskAssessment) => void)",
            "description": "Opens the model card. See the DSI source-attribute record.",
            "required": false
          },
          {
            "name": "onRecompute",
            "type": "((assessment: RiskAssessment) => void)",
            "description": "Fired when the reader asks for a fresh score. Without it a stale score says it is stale and offers nothing to do about it.",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"children\">"
      }
    ],
    "usage": "import { RiskIndicator } from \"@/components/zoblocks/risk-indicator\";\nimport \"@/styles/zoblocks-risk.css\";\n\n<RiskIndicator\n  assessment={readmission}\n  now={serverTime}\n  notADiagnosis=\"A statistical estimate from historical patterns. Not a diagnosis, and not a substitute for assessment.\"\n/>",
    "guidance": {
      "use": [
        "Readmission, deterioration, no-show and care-gap models — anywhere a score drives who gets called first.",
        "In a care-manager panel with density=\"compact\", where forty of these are read in a sitting and the staleness signal is the one that has to survive.",
        "Alongside a structured assessment rather than in place of one. A suicide-risk model output is not a C-SSRS, and the two belong on the same screen.",
        "With onRecompute wired wherever recomputation is possible, so an expired score has somewhere to go other than being ignored."
      ],
      "avoid": [
        "Without drivers when the model can produce them. An unattributed score is the second of the three failures, and the component cannot fix it for you.",
        "As the only risk signal on a screen. It is an estimate; the assessment, the history and the clinician are the rest.",
        "With a generic framing sentence copied between models. What a score is not depends on what it is, and a shared sentence is wrong for both."
      ]
    },
    "accessibility": [
      {
        "label": "Never colour alone",
        "detail": "The band is a ClinicalStatus chip, so it carries a shape and a word. Driver direction is a signed number before it is a fill colour, and the sign is what reaches the accessible name. Removing every hue leaves the band word, the sign and the sentence."
      },
      {
        "label": "The name ends with the framing",
        "detail": "The whole score is one spoken statement — outcome, band, percentage, cohort, age, drivers, model — and the not-a-diagnosis clause is last. Put first it is boilerplate a listener skips; put last it is the sentence they are left with."
      },
      {
        "label": "Staleness is content, not a tooltip",
        "detail": "An expired score renders the words on the face, in the reading order, before the drivers. A tooltip is invisible to anyone who did not hover, and the population that most needs this signal is the one scanning a panel of forty."
      },
      {
        "label": "A percentile is never spoken without its cohort",
        "detail": "\"94th percentile\" of an unnamed population is routinely read as \"94th percentile of people like this patient\". The two are supplied together or not at all, and the type enforces it."
      },
      {
        "label": "Unscored is not a low score",
        "detail": "A patient the model could not score gets its own band, its own dashed edge and its own sentence. Rendering it as the bottom band is how somebody the model cannot see becomes somebody the panel does not call."
      }
    ],
    "limitations": [
      "Presentational. It does not compute a score, refresh one, or call a model — the recompute affordance raises an event and the host does the work.",
      "Driver weights are the model's own units and are never normalised across models. A bar is scaled within one assessment only, because rescaling somebody else's attributions to compare two models is a chart that lies.",
      "No model card. It links to one; ModelTransparencyCard is a separate component, and inlining it here would put a page inside a chip.",
      "The FHIR adapter cannot produce weighted drivers. `basis[]` names references without attribution, so they render as unweighted rather than with a bar the data does not support."
    ],
    "related": [
      "clinical-status",
      "result-value",
      "data-grid"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add risk-indicator",
    "technicalName": "RiskIndicator",
    "aliases": [
      "risk score",
      "readmission risk",
      "predictive score",
      "risk stratification",
      "model output"
    ],
    "tags": [
      "data-display",
      "themeable",
      "print-safe",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Set validUntil from the model's own window. Without it the score renders as unbounded, which is honest, but it means nothing can ever expire.",
        "Pass the cohort with the percentile. The type requires it, and the reason is that readers supply their own cohort when you do not.",
        "Let the concentration line appear. A score that is mostly one ED visit is not wrong, and a clinician who knows that reads it correctly."
      ],
      "dont": [
        "Do not offer a dismiss action for an expired score. A score somebody waved away stays on the panel looking current.",
        "Do not render the numeral larger than the band. The band is the honest resolution of the estimate.",
        "Do not colour the whole card by band. It borrows the visual language of an alert, which is a thing somebody asserted rather than a thing a model estimated."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health",
        "payer"
      ],
      "clinicalContext": "Panel triage and in-chart display for readmission, deterioration, no-show and rising-risk models. Suicide-risk models are the highest-stakes and the least well-calibrated, which is why the calibration is on the face and the component pairs the score with a structured assessment rather than standing in for one.",
      "workflows": [
        "assessment",
        "care-coordination",
        "scheduling"
      ],
      "phi": {
        "handles": true,
        "notes": "Renders a model's estimate about a person and the factors driving it. The drivers are the disclosive part — 'lives alone', 'no PCP visit' — and they are on the face by design, because an unattributed score is the failure this component exists to prevent."
      },
      "auditable": true,
      "permissions": [
        "risk.read"
      ],
      "terminology": [
        "FHIR",
        "SNOMED CT"
      ]
    },
    "variants": [
      {
        "id": "default",
        "label": "Default",
        "description": "Band, numeral, percentile, drivers, staleness and framing.",
        "args": {
          "density": "default"
        }
      },
      {
        "id": "compact",
        "label": "Compact",
        "description": "For a panel list. The staleness signal never collapses.",
        "args": {
          "density": "compact"
        }
      }
    ],
    "controls": [
      {
        "prop": "density",
        "control": "segmented",
        "label": "Density",
        "options": [
          "compact",
          "default"
        ],
        "defaultValue": "default"
      },
      {
        "prop": "driverCount",
        "control": "slider",
        "label": "Drivers shown",
        "min": 1,
        "max": 6,
        "step": 1,
        "defaultValue": 4
      },
      {
        "prop": "notADiagnosis",
        "control": "text",
        "label": "Framing"
      },
      {
        "prop": "now",
        "control": "text",
        "label": "Now (ISO 8601)"
      },
      {
        "prop": "onOpenModel",
        "control": "event",
        "label": "onOpenModel"
      },
      {
        "prop": "onRecompute",
        "control": "event",
        "label": "onRecompute"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "1.3.1",
        "name": "Info and relationships",
        "status": "pass",
        "how": "One labelled group carrying the whole statement in reading order, with every inner node aria-hidden. The relationship between score, age and framing is in the sentence rather than in visual adjacency.",
        "evidence": "risk-indicator.test.tsx"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "The band routes through ClinicalStatus for its shape and word; driver direction is a signed number. A test asserts the sign reaches the accessible name and that unknown is not styled as low.",
        "evidence": "risk-indicator.test.tsx"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "role=\"group\" with a composed label. The model link, recompute and acknowledge affordances are all native buttons, present only when the host supplies a handler.",
        "evidence": "risk-indicator.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Every affordance is a native button reached and activated by keyboard, with no handler of the component's own.",
        "evidence": "risk-indicator.test.tsx"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size",
        "status": "pass",
        "how": "Recompute and acknowledge hold a 24px minimum at both densities.",
        "evidence": "risk-indicator.test.tsx"
      },
      {
        "wcag": "1.4.10",
        "name": "Reflow",
        "status": "pass",
        "how": "Below 420px the driver bars drop and the rows become label and weight; the staleness signal never collapses.",
        "evidence": "risk-indicator.test.tsx"
      },
      {
        "wcag": "1.4.12",
        "name": "Text spacing",
        "status": "pass",
        "how": "A grid with no fixed heights; increased line-height and letter-spacing grow the card rather than clipping it.",
        "evidence": "risk-indicator.test.tsx"
      },
      {
        "wcag": "2.2.1",
        "name": "Timing adjustable",
        "status": "not-applicable",
        "how": "No timing. Staleness is computed against a `now` the host supplies, never a clock the component reads."
      }
    ],
    "examples": [
      {
        "id": "the-three-failures",
        "title": "The date, the drivers and the framing",
        "description": "All three are structural. `validUntil` comes from the model's own window rather than a shared constant, drivers are part of the value type, and the framing is a required prop — because every product that made it optional shipped without it.",
        "fixture": "patientRoutine",
        "code": "<RiskIndicator\n  now={serverTime}\n  notADiagnosis=\"A statistical estimate from historical patterns. Not a diagnosis.\"\n  assessment={{\n    id: \"readmit-30\",\n    outcome: \"30-day readmission\",\n    band: \"high\",\n    probability: 0.31,\n    percentile: 94,\n    cohort: \"adult medicine\",\n    computedAt: \"2026-08-12T04:12:00Z\",\n    validUntil: \"2026-08-13T04:12:00Z\",\n    drivers: [\n      { label: \"3 admissions / 6 mo\", weight: 11.2 },\n      { label: \"Lives alone\", weight: 4.8 },\n      { label: \"No PCP visit < 90 d\", weight: 3.9 },\n      { label: \"Adherent to statin\", weight: -2.1 },\n    ],\n    model: { name: \"Readmit-v4\", auc: 0.71 },\n  }}\n/>;"
      },
      {
        "id": "expired",
        "title": "Expired, not old",
        "description": "Past its validity window the score stops being stale and starts being something the model no longer stands behind. There are two ways out and no third: a dismiss action would leave a waved-away score on the panel looking current.",
        "fixture": "encounterRoutine",
        "code": "<RiskIndicator\n  now=\"2026-08-14T09:00:00Z\"\n  notADiagnosis=\"A statistical estimate, not a diagnosis.\"\n  assessment={{ ...deterioration, validUntil: \"2026-08-13T04:12:00Z\" }}\n  onRecompute={requestRecompute}\n  onAcknowledge={recordAcknowledgement}\n/>;"
      },
      {
        "id": "unscored",
        "title": "Not scored is not low",
        "description": "Missing features, outside the training population, a service that timed out — all produce a fact, and it is not \"low\". Rendering it as the bottom band is how a patient the model cannot see becomes a patient the panel does not call.",
        "fixture": "patientRoutine",
        "code": "<RiskIndicator\n  now={serverTime}\n  notADiagnosis=\"A statistical estimate, not a diagnosis.\"\n  assessment={{\n    id: \"readmit-30\",\n    outcome: \"30-day readmission\",\n    band: \"unknown\",\n    computedAt: \"2026-08-12T04:12:00Z\",\n  }}\n/>;"
      },
      {
        "id": "concentration",
        "title": "When one factor is most of the score",
        "description": "A model whose top driver carries most of the total attribution is not modelling a patient; it is reporting one event. The component says so, because a clinician who knows that reads the number correctly and one who does not treats it as a synthesis.",
        "fixture": "observationPotassiumCritical",
        "code": "// 78% of the attribution sits on one driver, and the card says so.\ndrivers: [\n  { label: \"ED visit, 18 months ago\", weight: 14.0 },\n  { label: \"Lives alone\", weight: 2.1 },\n  { label: \"No PCP visit < 90 d\", weight: 1.8 },\n]"
      }
    ],
    "fixtures": [
      "patientRoutine",
      "observationPotassiumCritical",
      "encounterRoutine"
    ],
    "seo": {
      "slug": "risk-indicator",
      "title": "Risk Indicator — React risk score component",
      "description": "A React risk score component that renders its validity window, its top drivers with direction and weight, and a required not-a-diagnosis framing.",
      "primaryKeyword": "react risk score component",
      "secondaryKeywords": [
        "fhir riskassessment react",
        "clinical risk stratification ui",
        "predictive model display",
        "readmission risk component"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [
        "clinical-status"
      ],
      "usedIn": [],
      "patterns": [
        "population-health",
        "results-review"
      ],
      "alternatives": [
        {
          "ref": "clinical-status",
          "when": "the thing being shown is an asserted state rather than a model's estimate"
        },
        {
          "ref": "result-value",
          "when": "the number came from a laboratory rather than a model"
        }
      ]
    }
  },
  {
    "name": "safety-plan",
    "title": "Safety Plan",
    "tier": "free",
    "status": "beta",
    "since": "0.3.0",
    "layer": "block",
    "distribution": "registry",
    "summary": "The six steps of the Stanley-Brown Safety Planning Intervention, in order, with the crisis step rendered open and uncloseable.",
    "tagline": "Stanley-Brown, six steps, with the crisis step always open.",
    "description": "A patient-facing safety plan: warning signs, coping, distraction, people to ask, professionals and agencies, and means restriction. The crisis step cannot be collapsed, empty steps say they are unfinished rather than disappearing, and the wording is a patient catalog throughout.",
    "rationale": "A safety plan is written collaboratively in a room and read alone, often on a phone, often at the worst hour of someone's week. That reading context is the whole design. The crisis step holds the phone numbers, so it renders open and its trigger reports itself disabled — a person in crisis does not scroll, does not scan, and should not have to make a correct decision about a chevron to reach a number. The step order is the intervention rather than a layout: the escalation from what someone can do alone to who they call is the clinical content, so nothing here sorts or filters. And a step nobody has filled in says so instead of vanishing, because a five-step plan numbered one to five claims the sixth was never part of the instrument.",
    "categories": [
      "Disclosure",
      "Clinical"
    ],
    "fhir": [],
    "states": [
      "Complete plan",
      "Crisis step pinned open",
      "Unfinished step",
      "Empty plan",
      "Clinician editing view, nothing pinned"
    ],
    "props": [
      {
        "name": "steps",
        "type": "Partial<Record<SafetyPlanStepKey, SafetyPlanStepContent>>",
        "description": "The six Stanley-Brown steps, in order. The order is the intervention; a plan rendered out of sequence is a different document.",
        "required": true
      },
      {
        "name": "density",
        "type": "AccordionDensity",
        "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
        "required": false,
        "default": "\"patient\""
      },
      {
        "name": "headingLevel",
        "type": "AccordionHeadingLevel",
        "description": "Where the plan's headings sit in the page outline. Set it to match the surrounding document rather than letting a plan start at h1 inside a chart.",
        "required": false,
        "default": "3"
      },
      {
        "name": "labels",
        "type": "Partial<SafetyPlanLabels>",
        "description": "Replaces the built-in patient-facing wording.",
        "required": false
      },
      {
        "name": "pinCrisisStep",
        "type": "boolean",
        "description": "Keep the crisis step open and uncloseable. Defaults to true and should stay true on any surface a person in crisis might open. Turning it off is for a clinician's editing view, where every step is being worked on and none of them is the emergency.",
        "required": false,
        "default": "true"
      },
      {
        "name": "revisedAt",
        "type": "string",
        "description": "ISO 8601. Shown so a reader knows how current the plan is.",
        "required": false
      }
    ],
    "extendsType": "Omit< React.HTMLAttributes<HTMLDivElement>, \"children\" | \"onChange\" >",
    "exports": [
      {
        "name": "SafetyPlan",
        "props": [
          {
            "name": "steps",
            "type": "Partial<Record<SafetyPlanStepKey, SafetyPlanStepContent>>",
            "description": "The six Stanley-Brown steps, in order. The order is the intervention; a plan rendered out of sequence is a different document.",
            "required": true
          },
          {
            "name": "density",
            "type": "AccordionDensity",
            "description": "Row height and type scale. Inherited from the nearest density provider when omitted.",
            "required": false,
            "default": "\"patient\""
          },
          {
            "name": "headingLevel",
            "type": "AccordionHeadingLevel",
            "description": "Where the plan's headings sit in the page outline. Set it to match the surrounding document rather than letting a plan start at h1 inside a chart.",
            "required": false,
            "default": "3"
          },
          {
            "name": "labels",
            "type": "Partial<SafetyPlanLabels>",
            "description": "Replaces the built-in patient-facing wording.",
            "required": false
          },
          {
            "name": "pinCrisisStep",
            "type": "boolean",
            "description": "Keep the crisis step open and uncloseable. Defaults to true and should stay true on any surface a person in crisis might open. Turning it off is for a clinician's editing view, where every step is being worked on and none of them is the emergency.",
            "required": false,
            "default": "true"
          },
          {
            "name": "revisedAt",
            "type": "string",
            "description": "ISO 8601. Shown so a reader knows how current the plan is.",
            "required": false
          }
        ],
        "extendsType": "Omit< React.HTMLAttributes<HTMLDivElement>, \"children\" | \"onChange\" >"
      }
    ],
    "usage": "import { SafetyPlan } from \"@/components/zoblocks/safety-plan\";\n\n<SafetyPlan\n  revisedAt=\"2026-08-11\"\n  headingLevel={2}\n  steps={{\n    warningSigns: { entries: [\"Sleeping less than four hours\", \"Not answering messages for two days\"] },\n    internalCoping: { entries: [\"Walk to the end of the road and back\", \"Four in, six out, ten times\"] },\n    distractions: { entries: [\"The cafe on Bell Street before 11am\"] },\n    supportContacts: { contacts: [{ name: \"Priya\", detail: \"Sister\", availability: \"Any time\" }] },\n    professionals: {\n      contacts: [\n        { name: \"988\", detail: \"Suicide & Crisis Lifeline\", availability: \"24 hours\" },\n        { name: \"County crisis team\", detail: \"555 0148\", availability: \"24 hours\" },\n      ],\n    },\n    environment: { entries: [\"Priya is holding the spare keys to the garage\"] },\n  }}\n/>",
    "guidance": {
      "use": [
        "Patient-facing portals and apps, which is what the default patient density and second-person wording are for.",
        "A clinician's read-only view of a plan someone else wrote.",
        "Printed copies — the crisis step prints expanded whatever else is closed."
      ],
      "avoid": [
        "As the editor. This renders a plan; writing one is a form, with its own validation and consent.",
        "With pinCrisisStep off on any surface a person in crisis might open. That switch is for an editing view.",
        "As a substitute for a risk assessment. A plan is an intervention someone agreed to, not a score."
      ]
    },
    "accessibility": [
      {
        "label": "The crisis step is reachable without an interaction",
        "detail": "It renders expanded and its trigger carries aria-disabled=true, which is the case APG defines: the panel is visible and the accordion prevents collapsing it. The trigger stays focusable, so a keyboard or screen-reader user lands on it and hears the label rather than tabbing past it."
      },
      {
        "label": "Pinning is stated in words",
        "detail": "The header shows an \"Always open\" summary and the panel repeats the reason in a sentence, so the behaviour reads as intentional rather than as a stuck control — including in forced-colors mode, where the tint on the crisis panel is discarded."
      },
      {
        "label": "Steps keep their numbers in text",
        "detail": "The step number is part of the heading string rather than a separate element, so it survives being announced, copied, and printed."
      },
      {
        "label": "Contacts are a description list",
        "detail": "Names and how to reach them are marked up as dt/dd pairs, so a screen reader can navigate them as pairs instead of a run of text."
      }
    ],
    "limitations": [
      "Renders a plan; it does not create or edit one.",
      "The six steps are fixed. Labels are replaceable, order is not — reordering would change the instrument.",
      "Not a crisis-service integration. Numbers are rendered as the plan records them; the component does not dial, verify, or geolocate.",
      "Default wording is English and patient-facing. A clinician-facing surface needs its own catalog, not a tone change.",
      "No expiry logic. Whether a plan is stale is a clinical judgement, so revisedAt is displayed rather than interpreted."
    ],
    "related": [
      "accordion",
      "chart-accordion",
      "signature"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add safety-plan",
    "relationships": {
      "builtWith": [
        "accordion"
      ],
      "usedIn": [],
      "patterns": [],
      "alternatives": []
    }
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
    "tagline": "A binary control with a third value: nobody has said.",
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
    "props": [
      {
        "name": "absentReason",
        "type": "AbsentReason",
        "description": "Why the value is `\"unknown\"`. Structurally the output of `resolveAbsentReason()` in `@zoblocks/fhir`.",
        "required": false
      },
      {
        "name": "appearance",
        "type": "SwitchAppearance",
        "description": "Track treatment. Defaults to the plain track, or to `\"labeled\"` when `checkedChildren` is supplied.",
        "required": false
      },
      {
        "name": "audience",
        "type": "SwitchAudience",
        "description": "Who is reading. Selects the register of every generated sentence: a clinician is told the clinical consequence, a patient is told what it means for them.",
        "required": false,
        "default": "\"clinician\""
      },
      {
        "name": "autoFocus",
        "type": "boolean",
        "description": "Focus on mount. Use only where the switch is the reason the surface opened — a confirmation sheet, not a settings list.",
        "required": false
      },
      {
        "name": "checked",
        "type": "SwitchValue",
        "description": "`\"unknown\"` is Zoblocks's widening. antd's `boolean` shape is unchanged.",
        "required": false
      },
      {
        "name": "checkedChildren",
        "type": "React.ReactNode",
        "description": "Supplying either implies `appearance=\"labeled\"`.",
        "required": false
      },
      {
        "name": "commit",
        "type": "'instant' | 'deferred'",
        "description": "A switch that does not take effect until Save must say so.",
        "required": false,
        "default": "\"instant\""
      },
      {
        "name": "confirm",
        "type": "false | 'dialog' | 'countersign' | 'hold' | 'attest'",
        "description": "How much friction an activation earns. Escalates from a press-and-hold to a second person's signature. `false` for anything reversible.",
        "required": false,
        "default": "false"
      },
      {
        "name": "confirmCopy",
        "type": "{ title?: string; consequence: string; subject?: string; }",
        "description": "The words in the confirmation. `consequence` is required because a confirmation that does not name what will happen is a speed bump, not a check.",
        "required": false
      },
      {
        "name": "countersign",
        "type": "CountersignRequirement",
        "description": "Who else must sign, and in what capacity. Only meaningful with `confirm=\"countersign\"`.",
        "required": false
      },
      {
        "name": "defaultChecked",
        "type": "SwitchValue",
        "description": "Uncontrolled starting value. Ignored once `checked` is supplied.",
        "required": false,
        "default": "false"
      },
      {
        "name": "description",
        "type": "React.ReactNode",
        "description": "A second line under the label, for the qualification a label cannot carry. Associated with the control, so it is announced rather than merely nearby.",
        "required": false
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "The last resort, and almost always the wrong prop. Correct only when the unavailability is transient and caused by something the user just did. Everything else — policy, permission, record state, dependency — is `readOnly` with a `lockedReason`.",
        "required": false,
        "default": "false"
      },
      {
        "name": "error",
        "type": "React.ReactNode",
        "description": "Shown and announced on a controlled `reverted`, `blocked` or `stale`.",
        "required": false
      },
      {
        "name": "holdMs",
        "type": "number",
        "description": "Hold duration in ms. 0 routes every activation to the dialog instead.",
        "required": false,
        "default": "600"
      },
      {
        "name": "impact",
        "type": "React.ReactNode[]",
        "description": "The consequence, rendered before the click rather than after the decision.",
        "required": false
      },
      {
        "name": "label",
        "type": "React.ReactNode",
        "description": "The switch's accessible name and visible label. Supply it or an `aria-label`: a switch whose meaning lives only in a neighbouring table header is unusable by anyone not reading the table.",
        "required": false
      },
      {
        "name": "labelPlacement",
        "type": "'start' | 'end'",
        "description": "Which side the label sits on. `\"start\"` for a settings list where the labels should align; `\"end\"` inline.",
        "required": false,
        "default": "\"end\""
      },
      {
        "name": "loading",
        "type": "boolean",
        "description": "Kept for drop-in compatibility, with the behaviour corrected: it maps to `phase=\"pending\"` and does **not** disable the control. A spinner that removes the control loses focus, cannot be cancelled, and turns a switch into a dead pixel for as long as the request takes.",
        "required": false,
        "default": "false"
      },
      {
        "name": "lockedReason",
        "type": "React.ReactNode",
        "description": "Why this reader cannot change it. A `readOnly` switch with no reason tells somebody they may not act without telling them who can.",
        "required": false
      },
      {
        "name": "minPendingMs",
        "type": "number",
        "description": "Minimum time in `pending`, so a fast write is perceptible rather than a flash.",
        "required": false
      },
      {
        "name": "now",
        "type": "string",
        "description": "ISO 8601 from the server. Required alongside `onAuditEvent` and `until`.",
        "required": false
      },
      {
        "name": "onAuditEvent",
        "type": "((event: SwitchAuditEvent) => void)",
        "description": "Every activation, confirmation, revert and expiry, as a structured event for the host's audit log. Requires `now`, because an audit entry timed by the browser is not evidence.",
        "required": false
      },
      {
        "name": "onChange",
        "type": "((checked: boolean, event: React.SyntheticEvent) => void)",
        "description": "antd's signature exactly. Fires optimistically, before the commit resolves.",
        "required": false
      },
      {
        "name": "onCommit",
        "type": "((next: boolean, ctx: { from: SwitchValue; reason?: string; }) => void | Promise<void>)",
        "description": "Return a promise and the component owns the phase machine: pending while in flight, committed on resolve, reverted on reject — with the rollback animated and announced. Reject with a `SwitchBlockedError` for `blocked`.",
        "required": false
      },
      {
        "name": "onExpire",
        "type": "((at: string) => void)",
        "description": "Fired once when `until` passes. The component never writes on expiry — it reports, and the host decides.",
        "required": false
      },
      {
        "name": "online",
        "type": "boolean",
        "description": "`false` queues the commit rather than sending it.",
        "required": false,
        "default": "true"
      },
      {
        "name": "onResolveConflict",
        "type": "((keep: 'mine' | 'theirs') => void)",
        "description": "Called from the `stale` affordance when the reader chooses whose value wins. Without it a stale switch states the conflict and offers no way out of it.",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void)",
        "description": "Fired once when `slowAfter` elapses, so the host can surface its own \"still saving\" affordance. The switch stays interactive either way.",
        "required": false
      },
      {
        "name": "phase",
        "type": "CommitPhase",
        "description": "The controlled alternative to `onCommit`, for a caller that already owns a state machine — a mutation library, a websocket, an offline queue — and needs this control to render its phases rather than run its own. Supplying it takes the machine out of the loop entirely: nothing here starts a timer, and `requested` decides what is drawn while in flight. Every rendering, announcement and availability rule is unchanged, which is the point — a host should not have to reimplement the revert animation to use its own transport.",
        "required": false
      },
      {
        "name": "provenance",
        "type": "{ by: string; at: string; via?: string; }",
        "description": "Who last changed the record, when, and through what. Rendered beside the control, because on a shared record the last writer is part of the value.",
        "required": false
      },
      {
        "name": "readOnly",
        "type": "boolean",
        "description": "The right prop for almost every unavailability: policy, permission, record state, a missing dependency. Unlike `disabled` it stays focusable and readable, and pairs with `lockedReason`.",
        "required": false,
        "default": "false"
      },
      {
        "name": "requested",
        "type": "boolean",
        "description": "What to render while a controlled `phase` is `pending` or `queued`.",
        "required": false
      },
      {
        "name": "serverValue",
        "type": "SwitchValue",
        "description": "What the record now holds. Differing from `checked` puts the control in `stale`.",
        "required": false
      },
      {
        "name": "showState",
        "type": "boolean",
        "description": "The word beside the control.",
        "required": false
      },
      {
        "name": "size",
        "type": "SwitchSize",
        "description": "`\"default\"` or `\"small\"`, matching antd. Track and thumb scale together; the hit area does not drop below 24px in either.",
        "required": false
      },
      {
        "name": "slots",
        "type": "SwitchSlots",
        "description": "Replace individual internals — the thumb glyph, the state word, the lock affordance — without reimplementing the state machine around them.",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number",
        "description": "Milliseconds in `pending` before the commit is treated as slow. Announces rather than cancels: the write may still land.",
        "required": false
      },
      {
        "name": "stateLabels",
        "type": "'on-off' | 'yes-no' | 'active-inactive' | 'in-effect' | 'allowed-blocked' | 'given-declined' | 'enabled-disabled' | Partial<StateLabels>",
        "description": "The words for on and off. A preset name, or an override of individual labels. Never omit them to save space — the word is what survives greyscale.",
        "required": false
      },
      {
        "name": "tone",
        "type": "SwitchTone",
        "description": "Whether \"on\" is the safe answer (`\"affirmative\"`) or the consequential one (`\"restrictive\"`). Drives the state words and the confirmation defaults, never the hue alone.",
        "required": false,
        "default": "\"affirmative\""
      },
      {
        "name": "unCheckedChildren",
        "type": "React.ReactNode",
        "description": "The off-state word. Sized against `checkedChildren` so the track does not change width as it toggles.",
        "required": false
      },
      {
        "name": "until",
        "type": "string",
        "description": "ISO 8601. Renders \"in effect until …\". The component never writes on expiry.",
        "required": false
      },
      {
        "name": "untilWarnMs",
        "type": "number",
        "description": "Warn this long before `until`.",
        "required": false,
        "default": "0"
      },
      {
        "name": "value",
        "type": "SwitchValue",
        "description": "antd's alias for `checked`, accepted by `Form.Item`.",
        "required": false
      }
    ],
    "extendsType": "Omit< React.HTMLAttributes<HTMLSpanElement>, \"onChange\" | \"defaultChecked\" | \"children\" | \"onClick\" >",
    "exports": [
      {
        "name": "Switch",
        "props": [
          {
            "name": "absentReason",
            "type": "AbsentReason",
            "description": "Why the value is `\"unknown\"`. Structurally the output of `resolveAbsentReason()` in `@zoblocks/fhir`.",
            "required": false
          },
          {
            "name": "appearance",
            "type": "SwitchAppearance",
            "description": "Track treatment. Defaults to the plain track, or to `\"labeled\"` when `checkedChildren` is supplied.",
            "required": false
          },
          {
            "name": "audience",
            "type": "SwitchAudience",
            "description": "Who is reading. Selects the register of every generated sentence: a clinician is told the clinical consequence, a patient is told what it means for them.",
            "required": false,
            "default": "\"clinician\""
          },
          {
            "name": "autoFocus",
            "type": "boolean",
            "description": "Focus on mount. Use only where the switch is the reason the surface opened — a confirmation sheet, not a settings list.",
            "required": false
          },
          {
            "name": "checked",
            "type": "SwitchValue",
            "description": "`\"unknown\"` is Zoblocks's widening. antd's `boolean` shape is unchanged.",
            "required": false
          },
          {
            "name": "checkedChildren",
            "type": "React.ReactNode",
            "description": "Supplying either implies `appearance=\"labeled\"`.",
            "required": false
          },
          {
            "name": "commit",
            "type": "'instant' | 'deferred'",
            "description": "A switch that does not take effect until Save must say so.",
            "required": false,
            "default": "\"instant\""
          },
          {
            "name": "confirm",
            "type": "false | 'dialog' | 'countersign' | 'hold' | 'attest'",
            "description": "How much friction an activation earns. Escalates from a press-and-hold to a second person's signature. `false` for anything reversible.",
            "required": false,
            "default": "false"
          },
          {
            "name": "confirmCopy",
            "type": "{ title?: string; consequence: string; subject?: string; }",
            "description": "The words in the confirmation. `consequence` is required because a confirmation that does not name what will happen is a speed bump, not a check.",
            "required": false
          },
          {
            "name": "countersign",
            "type": "CountersignRequirement",
            "description": "Who else must sign, and in what capacity. Only meaningful with `confirm=\"countersign\"`.",
            "required": false
          },
          {
            "name": "defaultChecked",
            "type": "SwitchValue",
            "description": "Uncontrolled starting value. Ignored once `checked` is supplied.",
            "required": false,
            "default": "false"
          },
          {
            "name": "description",
            "type": "React.ReactNode",
            "description": "A second line under the label, for the qualification a label cannot carry. Associated with the control, so it is announced rather than merely nearby.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "The last resort, and almost always the wrong prop. Correct only when the unavailability is transient and caused by something the user just did. Everything else — policy, permission, record state, dependency — is `readOnly` with a `lockedReason`.",
            "required": false,
            "default": "false"
          },
          {
            "name": "error",
            "type": "React.ReactNode",
            "description": "Shown and announced on a controlled `reverted`, `blocked` or `stale`.",
            "required": false
          },
          {
            "name": "holdMs",
            "type": "number",
            "description": "Hold duration in ms. 0 routes every activation to the dialog instead.",
            "required": false,
            "default": "600"
          },
          {
            "name": "impact",
            "type": "React.ReactNode[]",
            "description": "The consequence, rendered before the click rather than after the decision.",
            "required": false
          },
          {
            "name": "label",
            "type": "React.ReactNode",
            "description": "The switch's accessible name and visible label. Supply it or an `aria-label`: a switch whose meaning lives only in a neighbouring table header is unusable by anyone not reading the table.",
            "required": false
          },
          {
            "name": "labelPlacement",
            "type": "'start' | 'end'",
            "description": "Which side the label sits on. `\"start\"` for a settings list where the labels should align; `\"end\"` inline.",
            "required": false,
            "default": "\"end\""
          },
          {
            "name": "loading",
            "type": "boolean",
            "description": "Kept for drop-in compatibility, with the behaviour corrected: it maps to `phase=\"pending\"` and does **not** disable the control. A spinner that removes the control loses focus, cannot be cancelled, and turns a switch into a dead pixel for as long as the request takes.",
            "required": false,
            "default": "false"
          },
          {
            "name": "lockedReason",
            "type": "React.ReactNode",
            "description": "Why this reader cannot change it. A `readOnly` switch with no reason tells somebody they may not act without telling them who can.",
            "required": false
          },
          {
            "name": "minPendingMs",
            "type": "number",
            "description": "Minimum time in `pending`, so a fast write is perceptible rather than a flash.",
            "required": false
          },
          {
            "name": "now",
            "type": "string",
            "description": "ISO 8601 from the server. Required alongside `onAuditEvent` and `until`.",
            "required": false
          },
          {
            "name": "onAuditEvent",
            "type": "((event: SwitchAuditEvent) => void)",
            "description": "Every activation, confirmation, revert and expiry, as a structured event for the host's audit log. Requires `now`, because an audit entry timed by the browser is not evidence.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((checked: boolean, event: React.SyntheticEvent) => void)",
            "description": "antd's signature exactly. Fires optimistically, before the commit resolves.",
            "required": false
          },
          {
            "name": "onCommit",
            "type": "((next: boolean, ctx: { from: SwitchValue; reason?: string; }) => void | Promise<void>)",
            "description": "Return a promise and the component owns the phase machine: pending while in flight, committed on resolve, reverted on reject — with the rollback animated and announced. Reject with a `SwitchBlockedError` for `blocked`.",
            "required": false
          },
          {
            "name": "onExpire",
            "type": "((at: string) => void)",
            "description": "Fired once when `until` passes. The component never writes on expiry — it reports, and the host decides.",
            "required": false
          },
          {
            "name": "online",
            "type": "boolean",
            "description": "`false` queues the commit rather than sending it.",
            "required": false,
            "default": "true"
          },
          {
            "name": "onResolveConflict",
            "type": "((keep: 'mine' | 'theirs') => void)",
            "description": "Called from the `stale` affordance when the reader chooses whose value wins. Without it a stale switch states the conflict and offers no way out of it.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void)",
            "description": "Fired once when `slowAfter` elapses, so the host can surface its own \"still saving\" affordance. The switch stays interactive either way.",
            "required": false
          },
          {
            "name": "phase",
            "type": "CommitPhase",
            "description": "The controlled alternative to `onCommit`, for a caller that already owns a state machine — a mutation library, a websocket, an offline queue — and needs this control to render its phases rather than run its own. Supplying it takes the machine out of the loop entirely: nothing here starts a timer, and `requested` decides what is drawn while in flight. Every rendering, announcement and availability rule is unchanged, which is the point — a host should not have to reimplement the revert animation to use its own transport.",
            "required": false
          },
          {
            "name": "provenance",
            "type": "{ by: string; at: string; via?: string; }",
            "description": "Who last changed the record, when, and through what. Rendered beside the control, because on a shared record the last writer is part of the value.",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean",
            "description": "The right prop for almost every unavailability: policy, permission, record state, a missing dependency. Unlike `disabled` it stays focusable and readable, and pairs with `lockedReason`.",
            "required": false,
            "default": "false"
          },
          {
            "name": "requested",
            "type": "boolean",
            "description": "What to render while a controlled `phase` is `pending` or `queued`.",
            "required": false
          },
          {
            "name": "serverValue",
            "type": "SwitchValue",
            "description": "What the record now holds. Differing from `checked` puts the control in `stale`.",
            "required": false
          },
          {
            "name": "showState",
            "type": "boolean",
            "description": "The word beside the control.",
            "required": false
          },
          {
            "name": "size",
            "type": "SwitchSize",
            "description": "`\"default\"` or `\"small\"`, matching antd. Track and thumb scale together; the hit area does not drop below 24px in either.",
            "required": false
          },
          {
            "name": "slots",
            "type": "SwitchSlots",
            "description": "Replace individual internals — the thumb glyph, the state word, the lock affordance — without reimplementing the state machine around them.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number",
            "description": "Milliseconds in `pending` before the commit is treated as slow. Announces rather than cancels: the write may still land.",
            "required": false
          },
          {
            "name": "stateLabels",
            "type": "'on-off' | 'yes-no' | 'active-inactive' | 'in-effect' | 'allowed-blocked' | 'given-declined' | 'enabled-disabled' | Partial<StateLabels>",
            "description": "The words for on and off. A preset name, or an override of individual labels. Never omit them to save space — the word is what survives greyscale.",
            "required": false
          },
          {
            "name": "tone",
            "type": "SwitchTone",
            "description": "Whether \"on\" is the safe answer (`\"affirmative\"`) or the consequential one (`\"restrictive\"`). Drives the state words and the confirmation defaults, never the hue alone.",
            "required": false,
            "default": "\"affirmative\""
          },
          {
            "name": "unCheckedChildren",
            "type": "React.ReactNode",
            "description": "The off-state word. Sized against `checkedChildren` so the track does not change width as it toggles.",
            "required": false
          },
          {
            "name": "until",
            "type": "string",
            "description": "ISO 8601. Renders \"in effect until …\". The component never writes on expiry.",
            "required": false
          },
          {
            "name": "untilWarnMs",
            "type": "number",
            "description": "Warn this long before `until`.",
            "required": false,
            "default": "0"
          },
          {
            "name": "value",
            "type": "SwitchValue",
            "description": "antd's alias for `checked`, accepted by `Form.Item`.",
            "required": false
          }
        ],
        "extendsType": "Omit< React.HTMLAttributes<HTMLSpanElement>, \"onChange\" | \"defaultChecked\" | \"children\" | \"onClick\" >"
      },
      {
        "name": "SwitchField",
        "props": [
          {
            "name": "absentReason",
            "type": "AbsentReason",
            "description": "Why the value is `\"unknown\"`. Structurally the output of `resolveAbsentReason()` in `@zoblocks/fhir`.",
            "required": false
          },
          {
            "name": "appearance",
            "type": "SwitchAppearance",
            "description": "Track treatment. Defaults to the plain track, or to `\"labeled\"` when `checkedChildren` is supplied.",
            "required": false
          },
          {
            "name": "audience",
            "type": "SwitchAudience",
            "description": "Who is reading. Selects the register of every generated sentence: a clinician is told the clinical consequence, a patient is told what it means for them.",
            "required": false
          },
          {
            "name": "autoFocus",
            "type": "boolean",
            "description": "Focus on mount. Use only where the switch is the reason the surface opened — a confirmation sheet, not a settings list.",
            "required": false
          },
          {
            "name": "checked",
            "type": "SwitchValue",
            "description": "`\"unknown\"` is Zoblocks's widening. antd's `boolean` shape is unchanged.",
            "required": false
          },
          {
            "name": "checkedChildren",
            "type": "React.ReactNode",
            "description": "Supplying either implies `appearance=\"labeled\"`.",
            "required": false
          },
          {
            "name": "commit",
            "type": "'instant' | 'deferred'",
            "description": "A switch that does not take effect until Save must say so.",
            "required": false
          },
          {
            "name": "confirm",
            "type": "false | 'dialog' | 'countersign' | 'hold' | 'attest'",
            "description": "How much friction an activation earns. Escalates from a press-and-hold to a second person's signature. `false` for anything reversible.",
            "required": false
          },
          {
            "name": "confirmCopy",
            "type": "{ title?: string; consequence: string; subject?: string; }",
            "description": "The words in the confirmation. `consequence` is required because a confirmation that does not name what will happen is a speed bump, not a check.",
            "required": false
          },
          {
            "name": "countersign",
            "type": "CountersignRequirement",
            "description": "Who else must sign, and in what capacity. Only meaningful with `confirm=\"countersign\"`.",
            "required": false
          },
          {
            "name": "defaultChecked",
            "type": "SwitchValue",
            "description": "Uncontrolled starting value. Ignored once `checked` is supplied.",
            "required": false
          },
          {
            "name": "description",
            "type": "React.ReactNode",
            "description": "Rendered under the label, above the state word.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "The last resort, and almost always the wrong prop. Correct only when the unavailability is transient and caused by something the user just did. Everything else — policy, permission, record state, dependency — is `readOnly` with a `lockedReason`.",
            "required": false
          },
          {
            "name": "error",
            "type": "React.ReactNode",
            "description": "Shown and announced on a controlled `reverted`, `blocked` or `stale`.",
            "required": false
          },
          {
            "name": "holdMs",
            "type": "number",
            "description": "Hold duration in ms. 0 routes every activation to the dialog instead.",
            "required": false
          },
          {
            "name": "impact",
            "type": "React.ReactNode[]",
            "description": "The consequence, rendered before the click rather than after the decision.",
            "required": false
          },
          {
            "name": "label",
            "type": "React.ReactNode",
            "description": "The switch's accessible name and visible label. Supply it or an `aria-label`: a switch whose meaning lives only in a neighbouring table header is unusable by anyone not reading the table.",
            "required": false
          },
          {
            "name": "labelPlacement",
            "type": "'start' | 'end'",
            "description": "Which side the label sits on. `\"start\"` for a settings list where the labels should align; `\"end\"` inline.",
            "required": false
          },
          {
            "name": "loading",
            "type": "boolean",
            "description": "Kept for drop-in compatibility, with the behaviour corrected: it maps to `phase=\"pending\"` and does **not** disable the control. A spinner that removes the control loses focus, cannot be cancelled, and turns a switch into a dead pixel for as long as the request takes.",
            "required": false
          },
          {
            "name": "lockedReason",
            "type": "React.ReactNode",
            "description": "Why this reader cannot change it. A `readOnly` switch with no reason tells somebody they may not act without telling them who can.",
            "required": false
          },
          {
            "name": "minPendingMs",
            "type": "number",
            "description": "Minimum time in `pending`, so a fast write is perceptible rather than a flash.",
            "required": false
          },
          {
            "name": "now",
            "type": "string",
            "description": "ISO 8601 from the server. Required alongside `onAuditEvent` and `until`.",
            "required": false
          },
          {
            "name": "onAuditEvent",
            "type": "((event: SwitchAuditEvent) => void)",
            "description": "Every activation, confirmation, revert and expiry, as a structured event for the host's audit log. Requires `now`, because an audit entry timed by the browser is not evidence.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((checked: boolean, event: React.SyntheticEvent) => void)",
            "description": "antd's signature exactly. Fires optimistically, before the commit resolves.",
            "required": false
          },
          {
            "name": "onCommit",
            "type": "((next: boolean, ctx: { from: SwitchValue; reason?: string; }) => void | Promise<void>)",
            "description": "Return a promise and the component owns the phase machine: pending while in flight, committed on resolve, reverted on reject — with the rollback animated and announced. Reject with a `SwitchBlockedError` for `blocked`.",
            "required": false
          },
          {
            "name": "onExpire",
            "type": "((at: string) => void)",
            "description": "Fired once when `until` passes. The component never writes on expiry — it reports, and the host decides.",
            "required": false
          },
          {
            "name": "online",
            "type": "boolean",
            "description": "`false` queues the commit rather than sending it.",
            "required": false
          },
          {
            "name": "onResolveConflict",
            "type": "((keep: 'mine' | 'theirs') => void)",
            "description": "Called from the `stale` affordance when the reader chooses whose value wins. Without it a stale switch states the conflict and offers no way out of it.",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void)",
            "description": "Fired once when `slowAfter` elapses, so the host can surface its own \"still saving\" affordance. The switch stays interactive either way.",
            "required": false
          },
          {
            "name": "phase",
            "type": "CommitPhase",
            "description": "The controlled alternative to `onCommit`, for a caller that already owns a state machine — a mutation library, a websocket, an offline queue — and needs this control to render its phases rather than run its own. Supplying it takes the machine out of the loop entirely: nothing here starts a timer, and `requested` decides what is drawn while in flight. Every rendering, announcement and availability rule is unchanged, which is the point — a host should not have to reimplement the revert animation to use its own transport.",
            "required": false
          },
          {
            "name": "provenance",
            "type": "{ by: string; at: string; via?: string; }",
            "description": "Who last changed the record, when, and through what. Rendered beside the control, because on a shared record the last writer is part of the value.",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean",
            "description": "The right prop for almost every unavailability: policy, permission, record state, a missing dependency. Unlike `disabled` it stays focusable and readable, and pairs with `lockedReason`.",
            "required": false
          },
          {
            "name": "requested",
            "type": "boolean",
            "description": "What to render while a controlled `phase` is `pending` or `queued`.",
            "required": false
          },
          {
            "name": "serverValue",
            "type": "SwitchValue",
            "description": "What the record now holds. Differing from `checked` puts the control in `stale`.",
            "required": false
          },
          {
            "name": "showState",
            "type": "boolean",
            "description": "The word beside the control.",
            "required": false
          },
          {
            "name": "size",
            "type": "SwitchSize",
            "description": "`\"default\"` or `\"small\"`, matching antd. Track and thumb scale together; the hit area does not drop below 24px in either.",
            "required": false
          },
          {
            "name": "slots",
            "type": "SwitchSlots",
            "description": "Replace individual internals — the thumb glyph, the state word, the lock affordance — without reimplementing the state machine around them.",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number",
            "description": "Milliseconds in `pending` before the commit is treated as slow. Announces rather than cancels: the write may still land.",
            "required": false
          },
          {
            "name": "stateLabels",
            "type": "'on-off' | 'yes-no' | 'active-inactive' | 'in-effect' | 'allowed-blocked' | 'given-declined' | 'enabled-disabled' | Partial<StateLabels>",
            "description": "The words for on and off. A preset name, or an override of individual labels. Never omit them to save space — the word is what survives greyscale.",
            "required": false
          },
          {
            "name": "tone",
            "type": "SwitchTone",
            "description": "Whether \"on\" is the safe answer (`\"affirmative\"`) or the consequential one (`\"restrictive\"`). Drives the state words and the confirmation defaults, never the hue alone.",
            "required": false
          },
          {
            "name": "unCheckedChildren",
            "type": "React.ReactNode",
            "description": "The off-state word. Sized against `checkedChildren` so the track does not change width as it toggles.",
            "required": false
          },
          {
            "name": "until",
            "type": "string",
            "description": "ISO 8601. Renders \"in effect until …\". The component never writes on expiry.",
            "required": false
          },
          {
            "name": "untilWarnMs",
            "type": "number",
            "description": "Warn this long before `until`.",
            "required": false
          },
          {
            "name": "value",
            "type": "SwitchValue",
            "description": "antd's alias for `checked`, accepted by `Form.Item`.",
            "required": false
          }
        ],
        "extendsType": "SwitchProps"
      },
      {
        "name": "SwitchList",
        "props": [
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "The switches. Rendered into a group with the heading above, so each one inherits the group's name rather than repeating it.",
            "required": false
          },
          {
            "name": "counts",
            "type": "{ on: number; total: number; unknown?: number; }",
            "description": "Counts for the summary line. `unknown` is reported separately and excluded from both numerator and denominator — a count that silently treats \"not asked\" as \"off\" is the whole failure this component exists to prevent, repeated at group scale.",
            "required": false
          },
          {
            "name": "provenance",
            "type": "{ by: string; at: string; }",
            "description": "Who last changed anything in this group. The first question anyone asks.",
            "required": false
          },
          {
            "name": "title",
            "type": "React.ReactNode",
            "description": "The group's heading, and its accessible name. A list of switches with no name is a list of switches nobody can describe.",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"title\">"
      }
    ],
    "usage": "import { Switch, SwitchField, SwitchList } from \"@/components/zoblocks/switch\";\n\n// The whole three-phase UX, including rollback and announcement.\n<Switch\n  label=\"Contact precautions\"\n  stateLabels=\"in-effect\"\n  tone=\"caution\"\n  checked={precautions}\n  onCommit={async (next) => {\n    await api.setPrecautions({ encounter, contact: next });\n    setPrecautions(next);\n  }}\n  now={serverTime}\n/>\n\n// An absence that says which kind it is.\n<Switch\n  label=\"Advance directive on file\"\n  checked=\"unknown\"\n  absentReason=\"not-collected\"\n  stateLabels=\"yes-no\"\n/>\n\n// A group, counting unknown separately from off.\n<SwitchList title=\"Isolation precautions\" counts={{ on: 2, total: 5, unknown: 1 }}>\n  <SwitchField label=\"Contact\" description=\"Gown and gloves on entry.\" checked />\n  <SwitchField label=\"Airborne\" readOnly lockedReason=\"No negative-pressure room on this unit.\" />\n</SwitchList>",
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
        "detail": "The target is a pseudo-element sized max(track, --zb-switch-target-min), which follows the density profile. A 26x14px micro switch in a clinical table still presents a 24px-or-larger target."
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
      "confirm=\"countersign\" collects a second identity through the caller's verify callback. It does not authenticate anyone, and it is not a signature capture — compose it with @zoblocks/signature when evidence is required.",
      "audience selects the default label preset and size. Wiring it to separate clinician and patient intl catalogs is not done yet.",
      "Requires styles/zoblocks-switch.css, installed with switch-core."
    ],
    "related": [
      "clinical-note",
      "tabs",
      "clinical-status",
      "date-picker"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add switch"
  },
  {
    "name": "timeline",
    "title": "Timeline",
    "tier": "free",
    "status": "experimental",
    "since": "0.4.0",
    "layer": "primitive",
    "distribution": "registry",
    "summary": "Ant Design v6's Timeline, prop for prop, with the accessible name and the ordered-list semantics it does not ship.",
    "tagline": "Ant Design's Timeline, with the semantics it does not ship.",
    "description": "An ordered list with a rail. The API matches Ant Design v6 exactly, including the v5 names it still accepts, and takes no dependency on it. Adds a required accessible name and drops the current-step behaviour a chronology has no use for.",
    "rationale": "antd's Timeline is a thin adapter over Steps, and it inherits two things a chronology should not have. It hardcodes current to the last item, which marks that item process — and antd's own stylesheet gives that state a dotted rail. On a wizard that reads as 'the step you are on, and it continues'. On a history it is a mark of incompleteness applied to whichever event happened to be last, and because reverse reverses the array first, on a newest-first clinical timeline it lands on the oldest event in the chart. It also inherits rc-steps' accessibility, which is none: no role, no aria-current, no way to name the list, so a page with a care timeline and an access-history timeline gives a screen-reader user two unnamed lists. Matching the API rather than wrapping it means an existing antd call site migrates by changing one import, and no consumer of a primitive inherits antd.",
    "categories": [
      "Data Display",
      "Primitives"
    ],
    "fhir": [],
    "states": [
      "Vertical, the default",
      "Alternate, items on both sides",
      "Horizontal",
      "Filled and outlined variants",
      "Custom node icons",
      "Preset and custom node colours",
      "A loading node",
      "Reversed",
      "Ant Design v5 prop names, still accepted"
    ],
    "props": [
      {
        "name": "children",
        "type": "React.ReactNode",
        "description": "`<Timeline.Item>` children, as antd v5 wrote them. Accepted for parity.",
        "required": false
      },
      {
        "name": "className",
        "type": "string",
        "description": "Applied to the list element.",
        "required": false
      },
      {
        "name": "classNames",
        "type": "Partial<Record<TimelineSlot, string>>",
        "description": "Per-slot class names — rail, node, content, label. Ant Design v6's semantic-DOM API.",
        "required": false
      },
      {
        "name": "items",
        "type": "readonly TimelineItemType[]",
        "description": "The events, in order. Ant Design's `items` API exactly — the difference is what this component refuses to infer from them.",
        "required": false
      },
      {
        "name": "mode",
        "type": "TimelineMode",
        "description": "Ant Design v6 resolves an unset value to `start`. So does this.",
        "required": false
      },
      {
        "name": "orientation",
        "type": "TimelineOrientation",
        "description": "Horizontal or vertical. Ant Design's `tabPlacement`-style rename in v6.",
        "required": false
      },
      {
        "name": "pending",
        "type": "React.ReactNode",
        "description": "A trailing \"in progress\" entry, as antd v5 wrote it.",
        "required": false
      },
      {
        "name": "pendingDot",
        "type": "React.ReactNode",
        "description": "The icon for the pending entry, as antd v5 wrote it.",
        "required": false
      },
      {
        "name": "prefixCls",
        "type": "string",
        "description": "Ant Design's class prefix. Accepted for parity with an existing antd theme.",
        "required": false
      },
      {
        "name": "ref",
        "type": "React.Ref<HTMLOListElement>",
        "description": "The `<ol>` the timeline renders. It is a list, not a `<ul>` — antd's own docs say otherwise and its source does this.",
        "required": false
      },
      {
        "name": "reverse",
        "type": "boolean",
        "description": "Newest first. Reverses the rendered order only — it does not change which item is treated as current, which is the bug this component exists not to reproduce.",
        "required": false
      },
      {
        "name": "rootClassName",
        "type": "string",
        "description": "Applied to the root element, alongside the generated classes.",
        "required": false
      },
      {
        "name": "style",
        "type": "React.CSSProperties",
        "description": "Inline styles on the list element.",
        "required": false
      },
      {
        "name": "styles",
        "type": "Partial<Record<TimelineSlot, React.CSSProperties>>",
        "description": "Per-slot inline styles. The counterpart to `classNames`.",
        "required": false
      },
      {
        "name": "titleSpan",
        "type": "string | number",
        "description": "Distance to the centre of the node. A number is a ratio; a string is a length.",
        "required": false
      },
      {
        "name": "variant",
        "type": "TimelineVariant",
        "description": "Rail treatment. Never used to imply a state: antd's Timeline dots a rail for whatever it decides is `current`, and on a clinical chronology a dotted rail reads as a data claim nobody authored.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "Timeline",
        "props": [
          {
            "name": "children",
            "type": "React.ReactNode",
            "description": "`<Timeline.Item>` children, as antd v5 wrote them. Accepted for parity.",
            "required": false
          },
          {
            "name": "className",
            "type": "string",
            "description": "Applied to the list element.",
            "required": false
          },
          {
            "name": "classNames",
            "type": "Partial<Record<TimelineSlot, string>>",
            "description": "Per-slot class names — rail, node, content, label. Ant Design v6's semantic-DOM API.",
            "required": false
          },
          {
            "name": "items",
            "type": "readonly TimelineItemType[]",
            "description": "The events, in order. Ant Design's `items` API exactly — the difference is what this component refuses to infer from them.",
            "required": false
          },
          {
            "name": "mode",
            "type": "TimelineMode",
            "description": "Ant Design v6 resolves an unset value to `start`. So does this.",
            "required": false
          },
          {
            "name": "orientation",
            "type": "TimelineOrientation",
            "description": "Horizontal or vertical. Ant Design's `tabPlacement`-style rename in v6.",
            "required": false
          },
          {
            "name": "pending",
            "type": "React.ReactNode",
            "description": "A trailing \"in progress\" entry, as antd v5 wrote it.",
            "required": false
          },
          {
            "name": "pendingDot",
            "type": "React.ReactNode",
            "description": "The icon for the pending entry, as antd v5 wrote it.",
            "required": false
          },
          {
            "name": "prefixCls",
            "type": "string",
            "description": "Ant Design's class prefix. Accepted for parity with an existing antd theme.",
            "required": false
          },
          {
            "name": "ref",
            "type": "React.Ref<HTMLOListElement>",
            "description": "The `<ol>` the timeline renders. It is a list, not a `<ul>` — antd's own docs say otherwise and its source does this.",
            "required": false
          },
          {
            "name": "reverse",
            "type": "boolean",
            "description": "Newest first. Reverses the rendered order only — it does not change which item is treated as current, which is the bug this component exists not to reproduce.",
            "required": false
          },
          {
            "name": "rootClassName",
            "type": "string",
            "description": "Applied to the root element, alongside the generated classes.",
            "required": false
          },
          {
            "name": "style",
            "type": "React.CSSProperties",
            "description": "Inline styles on the list element.",
            "required": false
          },
          {
            "name": "styles",
            "type": "Partial<Record<TimelineSlot, React.CSSProperties>>",
            "description": "Per-slot inline styles. The counterpart to `classNames`.",
            "required": false
          },
          {
            "name": "titleSpan",
            "type": "string | number",
            "description": "Distance to the centre of the node. A number is a ratio; a string is a length.",
            "required": false
          },
          {
            "name": "variant",
            "type": "TimelineVariant",
            "description": "Rail treatment. Never used to imply a state: antd's Timeline dots a rail for whatever it decides is `current`, and on a clinical chronology a dotted rail reads as a data claim nobody authored.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { Timeline } from \"@/components/zoblocks/timeline\";\n\n<Timeline\n  aria-label=\"Release history\"\n  mode=\"start\"\n  items={[\n    { key: \"1\", title: \"0.3.0\", content: \"Switch, Tabs, ChartAccordion.\" },\n    { key: \"2\", title: \"0.2.0\", content: \"Signature and Identity.\" },\n    { key: \"3\", title: \"0.1.0\", content: \"Five loaders.\" },\n  ]}\n/>",
    "guidance": {
      "use": [
        "Any ordered sequence of moments: a release history, an order's progress, an audit trail.",
        "Migrating an existing Ant Design Timeline without adding antd to a copy-source project.",
        "As the rail underneath a component that owns a clinical concept — CareTimeline is built on this."
      ],
      "avoid": [
        "A patient's chronology. Use CareTimeline, which states what it is a view of.",
        "A list whose order does not carry meaning. That is a list, and <ul> says so honestly.",
        "Carrying meaning in the node colour. The colour prop exists for API parity; a reader in forced-colors mode does not receive it."
      ]
    },
    "accessibility": [
      {
        "label": "An accessible name is required, in the type",
        "detail": "TimelineProps is intersected with a union requiring aria-label or aria-labelledby, so a list with no name does not compile. An unnamed list is invisible in review and in a rendering test, and obvious to exactly one group of readers."
      },
      {
        "label": "An ordered list, with role=\"list\" stated",
        "detail": "A chronology is ordered, so the element is <ol> of <li>. The redundant role=\"list\" is present because Safari drops list semantics from any list with list-style: none, and VoiceOver then announces neither the list nor its item count."
      },
      {
        "label": "A structure, not a widget",
        "detail": "No roving tabindex and no arrow-key handling. Screen-reader users read a list with the arrow keys in browse mode, and claiming them would make the list less navigable rather than more. Only the caller's own controls inside an item are focusable."
      }
    ],
    "limitations": [
      "No current or activeIndex. antd hardcodes current to the last item and its stylesheet dots that item's rail; a history has no current step, so the prop does not exist here and the dotted rail is free to mean something.",
      "color accepts antd's four presets and any CSS colour, and nothing enforces a text equivalent beside it. That enforcement belongs on the clinical layer, where the vocabulary is closed.",
      "titleSpan sets --zb-timeline-title-span rather than reproducing antd's internal head-span calculation. The rendered geometry is close, not identical.",
      "The Ant Design documentation site and the 6.6.0 source disagree on mode's default — the table says end, the source falls back to start. This follows the source, and the parity test asserts against the installed version.",
      "Migrating an existing antd call site is one import plus an accessible name. The three deliberate divergences, and the dotted rail antd draws that this one does not, are written up in content/guides/migrating-from-antd-timeline.md."
    ],
    "related": [
      "care-timeline",
      "accordion",
      "chart-accordion"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add timeline",
    "relationships": {
      "builtWith": [],
      "usedIn": [
        "care-timeline"
      ],
      "patterns": [],
      "alternatives": []
    }
  },
  {
    "name": "trend-indicator",
    "title": "Trend Indicator",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A sparkline that refuses to draw a trend it cannot justify — across an assay change, a unit change, or two points.",
    "tagline": "A sparkline that refuses to draw an unjustifiable trend.",
    "description": "Breaks the line wherever comparability breaks and says why in words. Renders no trend below three comparable points. Takes the valence as a required prop, so a falling PHQ-9 reads as improvement and a falling eGFR does not, and carries the reliable-change threshold so a two-point move renders as noise.",
    "rationale": "A sparkline is a claim that the points are comparable, and three things routinely break that claim while no library checks any of them. The assay changed: a lab switching immunoassay platforms shifts every ferritin by 20% with no clinical change at all. The units changed, silently, in an interface feed. Or there are simply two points, and a line between two points is not a trend, it is a rhetorical device. The second problem is separate and just as common: a downward line is not automatically good news. A falling PHQ-9 is improvement; a falling eGFR is not. Direction has no valence until somebody supplies one, so valence is a required prop rather than an assumption baked into a colour — a library that guesses gets half of all clinical measures wrong, silently, in green.",
    "categories": [
      "Clinical",
      "Data Display"
    ],
    "fhir": [
      {
        "name": "Observation",
        "url": "https://hl7.org/fhir/R4/observation.html",
        "note": "Consumes a series. method, device and valueQuantity.unit decide comparability; referenceRange shades the band behind the line."
      }
    ],
    "resource": "Observation",
    "resourceUrl": "https://hl7.org/fhir/R4/observation.html",
    "states": [
      "Rising, and worsening",
      "Falling, and improving",
      "Within the reliable-change threshold",
      "Broken by an assay change",
      "Broken by a silent unit change",
      "Two points — no trend",
      "One point",
      "No results at all",
      "Neutral valence",
      "With a reference band",
      "Narrow — glyph and delta only",
      "Sixty points",
      "Points reachable from the table"
    ],
    "props": [
      {
        "name": "series",
        "type": "TrendSeries",
        "description": "The points, oldest first. A direction is drawn only when the units and the method match across them.",
        "required": true
      },
      {
        "name": "describedBy",
        "type": "string",
        "description": "An element id holding the series as text. When absent the component emits its own visually-hidden table. A sparkline with no text alternative is unreadable and unsearchable, and \"decorative\" is not true of a line somebody is about to act on.",
        "required": false
      },
      {
        "name": "height",
        "type": "number",
        "description": "Drawing height in pixels. The sparkline scales to it; the labels do not, so very small heights lose the axis rather than the numbers.",
        "required": false,
        "default": "20"
      },
      {
        "name": "onSelectPoint",
        "type": "((index: number, series: TrendSeries) => void)",
        "description": "Fired when a point is chosen. Supplying it makes the points interactive; without it the trend is a picture.",
        "required": false
      },
      {
        "name": "width",
        "type": "number",
        "description": "Caller's choice. Below 40px the line is dropped for the glyph and delta.",
        "required": false,
        "default": "64"
      }
    ],
    "extendsType": "Omit< React.HTMLAttributes<HTMLDivElement>, \"children\" >",
    "exports": [
      {
        "name": "TrendIndicator",
        "props": [
          {
            "name": "series",
            "type": "TrendSeries",
            "description": "The points, oldest first. A direction is drawn only when the units and the method match across them.",
            "required": true
          },
          {
            "name": "describedBy",
            "type": "string",
            "description": "An element id holding the series as text. When absent the component emits its own visually-hidden table. A sparkline with no text alternative is unreadable and unsearchable, and \"decorative\" is not true of a line somebody is about to act on.",
            "required": false
          },
          {
            "name": "height",
            "type": "number",
            "description": "Drawing height in pixels. The sparkline scales to it; the labels do not, so very small heights lose the axis rather than the numbers.",
            "required": false,
            "default": "20"
          },
          {
            "name": "onSelectPoint",
            "type": "((index: number, series: TrendSeries) => void)",
            "description": "Fired when a point is chosen. Supplying it makes the points interactive; without it the trend is a picture.",
            "required": false
          },
          {
            "name": "width",
            "type": "number",
            "description": "Caller's choice. Below 40px the line is dropped for the glyph and delta.",
            "required": false,
            "default": "64"
          }
        ],
        "extendsType": "Omit< React.HTMLAttributes<HTMLDivElement>, \"children\" >"
      }
    ],
    "usage": "import { TrendIndicator } from \"@/components/zoblocks/trend-indicator\";\nimport \"@/styles/zoblocks-trend.css\";\n\n<TrendIndicator\n  series={{\n    id: \"phq9\",\n    label: \"PHQ-9\",\n    valence: \"higher-is-worse\",\n    significantChange: 5,\n    points: [{ at: \"2026-05-02\", value: 18 }, { at: \"2026-06-06\", value: 14 }],\n  }}\n/>",
    "guidance": {
      "use": [
        "In a flowsheet or a results list, beside the latest value rather than instead of it.",
        "For measurement-based care, with significantChange set to the instrument's reliable-change index — so a two-point PHQ-9 move renders as noise and a six-point move renders as change.",
        "With referenceRange when the measure has one. The band behind the line is what turns a shape into a judgement.",
        "At any width. Below 40px it drops the line for the glyph and the delta rather than drawing something unreadable."
      ],
      "avoid": [
        "As the only representation of a series. It is a shape; the values, the dates and the reference range are the rest, and the hidden table exists precisely because the shape is not enough.",
        "With valence guessed upstream. If nobody knows whether up is good, pass \"neutral\" and let the colour stay out of it.",
        "For a series whose points came from different instruments without saying so. The component can only break where the data admits a break."
      ]
    },
    "accessibility": [
      {
        "label": "A text alternative is emitted, not assumed",
        "detail": "Unless the host supplies describedBy, the component renders the whole series as a visually-hidden table. A sparkline with no text behind it is unreadable to a screen reader and invisible to a page search, and \"decorative\" is not true of a line somebody is about to act on."
      },
      {
        "label": "Direction and valence are both spoken",
        "detail": "\"Falling, improving\" for a PHQ-9 and \"falling, worsening\" for an eGFR. They are different facts, and a component that spoke only one would be unreadable for exactly the readers who most need the alternative."
      },
      {
        "label": "The glyph carries direction without the hue",
        "detail": "A triangle for rising, an inverted one for falling, a bar for flat — and the sign on the delta says the same thing again. Remove every colour and the direction survives, which matters here more than almost anywhere: hue is the only channel that ever distinguished a good fall from a bad one."
      },
      {
        "label": "A break is a gap and a sentence",
        "detail": "Segments are separate paths rather than one path with a dashed gap. A dash is a convention a reader has to already know; two lines that do not join are unambiguous, and the reason is in text beside them rather than in a tooltip."
      },
      {
        "label": "Noise is neutral, not softened",
        "detail": "Below the reliable-change threshold the direction is flat and the colour is neutral, whatever the arithmetic says. That is the clinical rule for a two-point PHQ-9 move, not a visual softening of a real change."
      }
    ],
    "limitations": [
      "It does not detect an assay change on its own. A lab that switches platform without saying so produces a series this component will happily draw — the break has to be in the data, and only a silent unit change is caught automatically.",
      "Time is linear on the x axis, so a series with one point last year and five this week compresses the recent ones. That is honest about elapsed time and unhelpful for reading the recent shape; a flowsheet wanting even spacing should pass an evenly-spaced series.",
      "No zoom, pan or tooltip. Hover detail belongs to the surface around it, and building a chart library into a 1.4 kB component would defeat the reason it is 1.4 kB.",
      "The significance threshold is a single number. Instruments whose reliable change varies by baseline need the caller to compute it per series."
    ],
    "related": [
      "result-value",
      "clinical-status"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @zoblocks/cli add trend-indicator",
    "technicalName": "TrendIndicator",
    "aliases": [
      "sparkline",
      "trend line",
      "mini chart",
      "lab trend",
      "measurement based care"
    ],
    "tags": [
      "data-display",
      "themeable",
      "print-safe",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Set significantChange from the instrument rather than from taste. It is the difference between a component that reports arithmetic and one that reports change.",
        "Put the break reason in the data. \"Switched to Roche Elecsys\" is what a reader needs; a gap on its own is a puzzle.",
        "Keep the series identity stable across renders. The memo compares it, and a flowsheet re-renders on every keystroke."
      ],
      "dont": [
        "Do not colour by direction. Half of clinical measures improve by falling, and colouring by direction gets one half wrong in green.",
        "Do not bridge a comparability break to make the line continuous. The continuity is the claim, and it is the one that is false.",
        "Do not suppress the hidden table to tidy the DOM. It is the only representation some readers get."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "The workhorse of measurement-based care. It carries the reliable-change threshold for the instrument, so a two-point PHQ-9 move renders as noise and a six-point move renders as change — which is the actual clinical rule rather than a visual flourish.",
      "workflows": [
        "assessment",
        "documentation",
        "treatment-planning",
        "care-coordination"
      ],
      "phi": {
        "handles": true,
        "notes": "Renders a person's measurements over time, including the dates. The hidden table carries all of them in text, which is the point and is also the part a screenshot will not show."
      },
      "auditable": false,
      "permissions": [
        "observation.read"
      ],
      "terminology": [
        "LOINC",
        "FHIR"
      ]
    },
    "variants": [
      {
        "id": "default",
        "label": "Default",
        "description": "64 × 20, with the glyph and delta beside the line.",
        "args": {
          "width": 64,
          "height": 20
        }
      },
      {
        "id": "wide",
        "label": "Wide",
        "description": "For a detail panel, where the shape is the point rather than the summary.",
        "args": {
          "width": 160,
          "height": 32
        }
      },
      {
        "id": "narrow",
        "label": "Narrow",
        "description": "Below 40px the line is dropped for the glyph and the delta — never an unreadable line.",
        "args": {
          "width": 32,
          "height": 20
        }
      }
    ],
    "controls": [
      {
        "prop": "width",
        "control": "slider",
        "label": "Width",
        "min": 24,
        "max": 200,
        "step": 8,
        "defaultValue": 64
      },
      {
        "prop": "height",
        "control": "slider",
        "label": "Height",
        "min": 12,
        "max": 48,
        "step": 4,
        "defaultValue": 20
      },
      {
        "prop": "onSelectPoint",
        "control": "event",
        "label": "onSelectPoint"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "1.1.1",
        "name": "Non-text content",
        "status": "pass",
        "how": "role=\"figure\" with a composed name, and a visually-hidden data table emitted unless the host supplies describedBy. A test asserts the table carries every point.",
        "evidence": "trend-indicator.test.tsx"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "Direction is a CSS glyph and a signed delta before it is a hue, and both the direction and the valence reach the accessible name as words. A test asserts a rising-worse and a rising-better series differ in text, not only in colour.",
        "evidence": "trend-indicator.test.tsx"
      },
      {
        "wcag": "1.3.1",
        "name": "Info and relationships",
        "status": "pass",
        "how": "The hidden alternative is a real table with a caption, column headers and row headers — not a paragraph of comma-separated numbers.",
        "evidence": "trend-indicator.test.tsx"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "The svg is aria-hidden and the figure carries the name, so a screen reader gets one statement and one table rather than an unlabelled graphic.",
        "evidence": "trend-indicator.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Point selection, when the host wires it, is a native button per row inside the table — reachable by keyboard without the component managing focus.",
        "evidence": "trend-indicator.test.tsx"
      },
      {
        "wcag": "1.4.10",
        "name": "Reflow",
        "status": "pass",
        "how": "The caller sets the width and the component degrades to glyph and delta below 40px rather than compressing a line into illegibility.",
        "evidence": "trend-indicator.test.tsx"
      },
      {
        "wcag": "1.4.11",
        "name": "Non-text contrast",
        "status": "pass",
        "how": "The line and the terminus draw from gated status tokens; the reference band is deliberately below the floor because it is a backdrop rather than a signal, and it carries no information the text does not.",
        "evidence": "contrast.gate"
      },
      {
        "wcag": "2.2.1",
        "name": "Timing adjustable",
        "status": "not-applicable",
        "how": "No timing and no animation."
      }
    ],
    "examples": [
      {
        "id": "valence",
        "title": "A falling line is not automatically good news",
        "description": "The same shape, twice. A falling PHQ-9 is improvement; a falling eGFR is not. Valence is a required prop because a library that guesses gets half of all clinical measures wrong, silently, in green.",
        "fixture": "observationPanel",
        "code": "<TrendIndicator series={{ id: \"phq9\", label: \"PHQ-9\", valence: \"higher-is-worse\",\n  significantChange: 5, points: phq9 }} />\n\n<TrendIndicator series={{ id: \"egfr\", label: \"eGFR\", valence: \"higher-is-better\",\n  unit: \"mL/min\", points: egfr }} />"
      },
      {
        "id": "comparability",
        "title": "Where comparability breaks, the line breaks",
        "description": "A lab switching immunoassay platforms shifts every ferritin by 20% with no clinical change at all. Two separate paths say \"these are not the same series\" without a legend; a dashed gap says it only to somebody who already knows the convention.",
        "fixture": "observationCorrected",
        "code": "points: [\n  { at: \"2026-01-04\", value: 180 },\n  { at: \"2026-03-02\", value: 176 },\n  // Everything after this is on a different scale.\n  { at: \"2026-05-09\", value: 212, breaksComparability: \"switched to Roche Elecsys\" },\n  { at: \"2026-07-11\", value: 218 },\n]"
      },
      {
        "id": "noise",
        "title": "Two points of PHQ-9 is not a change",
        "description": "Below the reliable-change threshold the trend renders flat and neutral, whatever the arithmetic says. That is the clinical rule for the instrument, not a softening of a real move.",
        "fixture": "observationPotassiumCritical",
        "code": "<TrendIndicator\n  series={{\n    id: \"phq9\", label: \"PHQ-9\", valence: \"higher-is-worse\",\n    // The reliable-change index for the PHQ-9. Below it, noise.\n    significantChange: 5,\n    points: [{ at: \"2026-05-02\", value: 14 }, { at: \"2026-06-06\", value: 13 },\n             { at: \"2026-07-04\", value: 12 }],\n  }}\n/>;"
      },
      {
        "id": "too-few",
        "title": "Two points is not a trend",
        "description": "It is a rhetorical device. Below three comparable points the component draws no line and says how many it has — because an absent trend and a trend that did not move are different facts, and drawing the second for the first is the lie it exists to refuse.",
        "fixture": "observationPanel",
        "code": "// Renders \"2 results. A trend needs at least 3.\" — no line.\n<TrendIndicator series={{ id: \"cr\", label: \"Creatinine\", valence: \"higher-is-worse\",\n  points: [{ at: \"2026-06-01\", value: 88 }, { at: \"2026-07-01\", value: 104 }] }} />"
      }
    ],
    "fixtures": [
      "observationPanel",
      "observationCorrected",
      "observationPotassiumCritical"
    ],
    "seo": {
      "slug": "trend-indicator",
      "title": "Trend Indicator — React clinical sparkline",
      "description": "A React sparkline for clinical series: breaks where the assay or unit changed, refuses a trend under three points, and takes the valence as a prop.",
      "primaryKeyword": "react clinical sparkline",
      "secondaryKeywords": [
        "lab trend component react",
        "measurement based care ui",
        "sparkline accessibility",
        "reliable change index display"
      ],
      "searchIntent": "informational",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "results-review",
        "measurement-based-care"
      ],
      "alternatives": [
        {
          "ref": "result-value",
          "when": "there is one measurement rather than a series"
        }
      ]
    }
  },
  {
    "name": "identity",
    "title": "Patient identity",
    "tier": "free",
    "status": "beta",
    "since": "0.1.0",
    "layer": "clinical",
    "distribution": "package",
    "packageName": "@zoblocks/identity",
    "frameworks": {
      "antd": {
        "policy": "neutral",
        "bridge": false,
        "divergences": []
      }
    },
    "summary": "An avatar, a chip and a patient banner — with the pass that keeps two patients who share a name apart on the same worklist.",
    "tagline": "An avatar, a chip and a patient banner that agree on identity.",
    "description": "The banner is the last surface a clinician reads before they act, so it is built as a control rather than a heading: two person-specific identifiers before a care action are a compile error, `Patient.gender` is not a renderable field, and a form can refuse to submit when the chart on screen is not the chart it was opened for.",
    "rationale": "A patient banner is the most PHI-dense component in a healthcare product and the one nobody designs. It is pinned to the top of every screen, read hundreds of times a shift, and it is the last thing standing between a clinician and someone else's chart. Adelman et al. (JAMIA 2013, 901,776 ordering sessions) found a dismissible 'check the patient' alert cut wrong-patient orders with an odds ratio of 0.84, while making the clinician re-enter the patient's initials cut them with an odds ratio of 0.60 — so a banner that is only read is worth a sixth of one that is answered, and both require the header to know what action is about to happen. Everything else follows from treating identity as a resolved value rather than a bag of booleans: absence of a photograph is five different facts, 'Inactive' is four unrelated ones, and two patients sharing a surname on a ward list is a problem a component can see and an application never will.",
    "categories": [
      "Clinical",
      "Patterns"
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
      "Active",
      "Inactive — discharged, transferred, or disengaged",
      "Deceased, with the age frozen at age-at-death",
      "Record merged — care is recorded elsewhere",
      "Test patient (meta.security HTEST)",
      "Sensitive record, categories withheld pending an audited reveal",
      "Photo on file",
      "No photo on file",
      "Photo could not be loaded",
      "Photo withheld by site policy",
      "Loading — a skeleton, never a half-identity",
      "Could not load the record",
      "Escalated: a similar name is on this list",
      "Wrong patient — the form and the chart disagree",
      "Identifier failing its check digit"
    ],
    "props": [
      {
        "name": "context",
        "type": "'navigation' | 'action' | 'verification'",
        "description": "Navigation and read-only surfaces. One identifier is enough. Anything that precedes a care action. Two identifiers, enforced.",
        "required": true
      },
      {
        "name": "actions",
        "type": "ReactNode",
        "description": "Rendered at the end of the banner — actions belong to the application.",
        "required": false
      },
      {
        "name": "children",
        "type": "ReactNode",
        "description": "Screen content rendered beneath the banner, inside its patient context. This is what lets `PatientGuard` compare a form against the chart on screen. React context needs nesting, and a banner that owns the region below it is the honest shape: the banner is not a decoration above the content, it is the statement the content is made under.",
        "required": false
      },
      {
        "name": "className",
        "type": "string",
        "description": "Applied to the banner element.",
        "required": false
      },
      {
        "name": "error",
        "type": "OperationOutcome | Error",
        "description": "The record could not be fetched. Rendered as an explicit failure, never as an empty banner: a blank identity strip above a chart is indistinguishable from a patient with no name, and one of those is safe to act under.",
        "required": false
      },
      {
        "name": "fields",
        "type": "Field[]",
        "description": "Priority order. The container query drops from the tail.",
        "required": false
      },
      {
        "name": "identifiers",
        "type": "TwoOrMore<IdentifierSpec> | readonly IdentifierSpec[]",
        "description": "Which identifiers to show. Optional here; a worklist row is not a care action. Two person-specific identifiers, enforced by the type. NPSG.01.01.01 asks for two before a care action, so supplying one is a compile error rather than a review comment — this is the whole reason `context` is a required prop.",
        "required": false
      },
      {
        "name": "identityKey",
        "type": "string",
        "description": "Overrides the swatch key. Prefer a stable record id, so the same patient keeps the same colour across sessions.",
        "required": false
      },
      {
        "name": "loading",
        "type": "true",
        "description": "The record has not arrived yet. Renders a placeholder that is unmistakably not a patient.",
        "required": false
      },
      {
        "name": "onReveal",
        "type": "(() => void)",
        "description": "Fired when a user reveals a withheld field. The app writes the audit.",
        "required": false
      },
      {
        "name": "patient",
        "type": "Patient",
        "description": "The patient this chart is about.",
        "required": false
      },
      {
        "name": "ward",
        "type": "string",
        "description": "Where the patient physically is. Shown because it changes who is able to act.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "PatientBanner",
        "props": [
          {
            "name": "context",
            "type": "'navigation' | 'action' | 'verification'",
            "description": "Navigation and read-only surfaces. One identifier is enough. Anything that precedes a care action. Two identifiers, enforced.",
            "required": true
          },
          {
            "name": "actions",
            "type": "ReactNode",
            "description": "Rendered at the end of the banner — actions belong to the application.",
            "required": false
          },
          {
            "name": "children",
            "type": "ReactNode",
            "description": "Screen content rendered beneath the banner, inside its patient context. This is what lets `PatientGuard` compare a form against the chart on screen. React context needs nesting, and a banner that owns the region below it is the honest shape: the banner is not a decoration above the content, it is the statement the content is made under.",
            "required": false
          },
          {
            "name": "className",
            "type": "string",
            "description": "Applied to the banner element.",
            "required": false
          },
          {
            "name": "error",
            "type": "OperationOutcome | Error",
            "description": "The record could not be fetched. Rendered as an explicit failure, never as an empty banner: a blank identity strip above a chart is indistinguishable from a patient with no name, and one of those is safe to act under.",
            "required": false
          },
          {
            "name": "fields",
            "type": "Field[]",
            "description": "Priority order. The container query drops from the tail.",
            "required": false
          },
          {
            "name": "identifiers",
            "type": "TwoOrMore<IdentifierSpec> | readonly IdentifierSpec[]",
            "description": "Which identifiers to show. Optional here; a worklist row is not a care action. Two person-specific identifiers, enforced by the type. NPSG.01.01.01 asks for two before a care action, so supplying one is a compile error rather than a review comment — this is the whole reason `context` is a required prop.",
            "required": false
          },
          {
            "name": "identityKey",
            "type": "string",
            "description": "Overrides the swatch key. Prefer a stable record id, so the same patient keeps the same colour across sessions.",
            "required": false
          },
          {
            "name": "loading",
            "type": "true",
            "description": "The record has not arrived yet. Renders a placeholder that is unmistakably not a patient.",
            "required": false
          },
          {
            "name": "onReveal",
            "type": "(() => void)",
            "description": "Fired when a user reveals a withheld field. The app writes the audit.",
            "required": false
          },
          {
            "name": "patient",
            "type": "Patient",
            "description": "The patient this chart is about.",
            "required": false
          },
          {
            "name": "ward",
            "type": "string",
            "description": "Where the patient physically is. Shown because it changes who is able to act.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import {\n  IdentityProvider,\n  PatientBanner,\n  PatientGuard,\n} from \"@zoblocks/identity\";\nimport \"@zoblocks/identity/styles.css\";\n\n<IdentityProvider disclosure=\"clinical\" photos=\"allow\" onSensitiveReveal={audit.write}>\n  {/* context=\"action\" takes a two-or-more tuple: NPSG.01.01.01 as a compile error. */}\n  <PatientBanner\n    patient={patient}\n    context=\"action\"\n    identifiers={[{ kind: \"mrn\" }, { kind: \"nhs\" }]}\n  >\n    {/* Refuses to render if the chart on screen is not the one this was opened for. */}\n    <PatientGuard expect={openedFor.id} expectName={openedFor.name}>\n      <OrderForm />\n    </PatientGuard>\n  </PatientBanner>\n</IdentityProvider>;",
    "guidance": {
      "use": [
        "The pinned header of any chart, order screen or note editor — `context=\"action\"` wherever a care action follows, which requires two person-specific identifiers at the type level.",
        "Worklists and admissions lists, wrapped in an `IdentitySet`: the disambiguation pass only escalates rows that genuinely collide, and leaves the rest untouched.",
        "Anywhere the record's own facts should drive the rendering — deceased, merged, test and restricted are read from the resource, never passed as props.",
        "Reception and waiting-room surfaces, via `disclosure`: the same resource renders four ways, and a public screen shows enough for the named person to recognise themselves and no more.",
        "Screenshots, sales demos and training environments — `demoMode` substitutes synthetic identities everywhere, deterministically keyed off the real record so collisions and name lengths survive."
      ],
      "avoid": [
        "Rendering `Patient.gender`. It is administrative gender — correspondence and registries, not dosing — and it is absent from the `fields` union for that reason. Ask for `spcu` or `recorded-sex-or-gender`, which render labelled as what they are.",
        "Reaching for the legal name without a reason. `nameContext=\"legal\"` requires one, because chosen-name use across contexts is associated with substantially lower depression and suicidality among transgender young people, and `name[0]` is not a neutral default.",
        "Two banners on one screen. Two authoritative answers to “whose chart is this” is the defect; use `PatientChip` to reference a second patient.",
        "Keying the avatar swatch on a name. A marriage, a correction or a transition repaints the person, and a banner showing the chosen name will disagree with a worklist showing the legal one. A lint rule catches it.",
        "Treating the disambiguation pass as record matching. It answers “would a reader in a hurry confuse these two rows”, which is a different and much narrower question than “are these the same person”."
      ]
    },
    "accessibility": [
      {
        "label": "One region, one composed name",
        "detail": "The default rendering of a banner is seven fragments — initials, a name, a status pill, a letter, an age, a date, a number — that a non-sighted user has to reassemble into a person. `identityLabel()` composes one string instead, and it lives in the engine precisely so the accessible name and the pixels are two projections of one value and cannot disagree."
      },
      {
        "label": "The identifier is spelled out",
        "detail": "Every major screen reader pronounces the unspaced form of MRN as “mern”, and digits run together as a quantity. The label emits “M R N 123, 456, 789”, because a clinician verifying an identifier by ear needs the letters and the grouping."
      },
      {
        "label": "The patient changed and nobody said so",
        "detail": "A sighted user gets a full visual repaint when the chart switches; a screen-reader user gets nothing, because focus is wherever it was and the DOM swapped underneath them. A polite live region announces the new patient — debounced, so a rapid list traversal does not queue up announcements, and polite so it never interrupts a value being read."
      },
      {
        "label": "The avatar says nothing",
        "detail": "`aria-hidden`, always, when it sits beside the name. It carries no information a non-sighted user can use, and alt text naming the patient is both noise and a small PHI leak into anything that scrapes alt attributes. The tint is decorative by definition and is never exposed as meaning."
      },
      {
        "label": "Absence is distinguishable, not just visible",
        "detail": "The five photo states produce five different accessible names as well as five different renderings, so “no photo on record” and “photo could not be loaded” are as distinct by ear as they are by eye."
      },
      {
        "label": "A withheld category is withheld from everyone",
        "detail": "Sensitivity codes are named only after an audited reveal, or at full disclosure — in the tag, in the row and in the accessible name alike. Naming them in the label alone would hand a screen-reader user the thing the reveal exists to record."
      },
      {
        "label": "Nothing is ellipsised",
        "detail": "There is no `text-overflow` on any name or identifier at any width. “Mohammed Al-Rash…” and “Mohammed Al-Rashid” are two people on the same ward, and a truncated MRN is not a shorter number — it is a different one. Fields leave whole in a declared priority order, so what disappears at 320px was a designer's decision rather than the layout engine's."
      },
      {
        "label": "Colour is never the signal",
        "detail": "Every state carries an icon and a word as well as a tone, and the six decorative swatches collapse to one value under forced colors — which is the argument for never relying on them: if a design stops working when the tint goes, it was already broken for the roughly 8% of men who cannot separate two of those hues."
      }
    ],
    "limitations": [
      "It does not match records. Deduplication belongs to a master patient index, has a different risk profile, and a component that started guessing at it would be making a claim it cannot support.",
      "It does not write an audit trail. `onSensitiveReveal` and `onIdentifierCopy` fire and the application logs — a component that wrote its own would be emitting PHI from a browser to whatever error reporter the customer installed.",
      "It does not enforce access control. `disclosure` is presentation; a withheld field is not a security boundary, and authorisation belongs on the server.",
      "Photographs are denied by default and must be opted into. A cached portrait is PHI at rest in a browser the site may not control, and an intake photograph taken during an involuntary admission was not meaningfully consented to.",
      "Six decorative swatches means collisions are the normal case, not the edge case — certain from seven patients by the pigeonhole principle. That is handled rather than avoided, and the tint is never permitted to be the fastest discriminator on a row.",
      "The compact Double Metaphone omits the alternate code and several Slavic and Germanic cases. It fails safe: a missed similarity produces an ordinary row rather than a wrong one.",
      "Wristband matching and the ID-reentry verification step are built but unstyled beyond the base sheet; a deployment wanting positive patient identification supplies the scanner integration."
    ],
    "related": [
      "signature",
      "care-team-presence",
      "chart-header",
      "recent-patient-stack"
    ],
    "dependencies": [
      "@zoblocks/identity-core"
    ],
    "install": "pnpm add @zoblocks/identity"
  },
  {
    "name": "signature",
    "title": "Signature",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "distribution": "package",
    "packageName": "@zoblocks/signature",
    "frameworks": {
      "antd": {
        "policy": "wrapping",
        "inherits": [
          "Modal's focus trap and restore — a capture surface that loses focus on open is unusable by keyboard, and rebuilding it badly would undermine the component whose whole argument is accessibility.",
          "Form.Item's control contract, so `signatureRequired()` composes with the host's own validation rather than sitting beside it.",
          "Upload's file handling, including drag targets and the accept filter."
        ],
        "bridge": false,
        "divergences": []
      }
    },
    "summary": "Signature capture that records the times nobody signed — declined, unable, verbal, on paper — not just the times they did.",
    "tagline": "Signature capture that records the times nobody signed.",
    "description": "Draw, type or upload a signature inside an Ant Design form, and record the outcomes a signature pad has no answer for. The value is a discriminated union over seven outcomes rather than a base64 string, so a refusal is a fact the record can hold.",
    "rationale": "Almost every signature component solves one problem: get ink from a pointer onto a canvas and hand back a PNG. That is about fifteen percent of what a healthcare product needs. The rest is everything the PNG does not say — who signed, in what capacity, what they were agreeing to, and, most often of all, what to record when nobody signed at all. A patient who refused and a form nobody opened are different facts with different consequences, and a component whose only states are empty and signed makes the difference unrecordable. That is the same argument AbsentValue makes one tier down, at a much higher stake.",
    "categories": [
      "Clinical",
      "Data Entry"
    ],
    "fhir": [
      {
        "name": "Provenance",
        "url": "https://hl7.org/fhir/R4/provenance.html"
      },
      {
        "name": "Consent",
        "url": "https://hl7.org/fhir/R4/consent.html"
      }
    ],
    "resource": "Provenance",
    "resourceUrl": "https://hl7.org/fhir/R4/provenance.html",
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
    "props": [
      {
        "name": "now",
        "type": "string",
        "description": "ISO 8601 from the server. The component never reads the clock.",
        "required": true
      },
      {
        "name": "attestation",
        "type": "React.ReactNode",
        "description": "The sentence the signer is agreeing to, shown above the control. Required for `meaning=\"attestation\"`; a signature over unstated words is not an attestation.",
        "required": false
      },
      {
        "name": "capacities",
        "type": "Capacity[]",
        "description": "The capacities this signer may sign in — clinician, patient, guardian, interpreter. Offered as a choice when there is more than one, because the capacity changes what the signature means.",
        "required": false
      },
      {
        "name": "captureBiometrics",
        "type": "boolean",
        "description": "Record stroke timing and pressure alongside the image. Off by default: it is additional personal data and most workflows do not need it.",
        "required": false
      },
      {
        "name": "className",
        "type": "string",
        "description": "Applied to the outer element.",
        "required": false
      },
      {
        "name": "defaultValue",
        "type": "SignatureValue",
        "description": "The starting signature, uncontrolled. Use for a form re-opened on an existing record.",
        "required": false
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "Blocks every path including the refusals. Rarely right — if the form is not signable yet, say why rather than removing the ability to decline.",
        "required": false
      },
      {
        "name": "documentHash",
        "type": "string",
        "description": "A hash of exactly what was signed. Without it the signature attests to a document nobody can later identify.",
        "required": false
      },
      {
        "name": "id",
        "type": "string",
        "description": "Supplied by `Form.Item`. Attached to the trigger so the label resolves.",
        "required": false
      },
      {
        "name": "locale",
        "type": "Partial<SignatureLocale>",
        "description": "Overrides for every generated string, including the seven outcome names. Supply it for any language that is not English.",
        "required": false
      },
      {
        "name": "meaning",
        "type": "SignatureMeaning",
        "description": "What signing this asserts: consent, attestation, witness, receipt. It selects the wording and it is recorded, because a signature with no stated meaning is not evidence of anything.",
        "required": false
      },
      {
        "name": "methods",
        "type": "CaptureMethod[]",
        "description": "Which capture methods to offer. Omitting `\"type\"` produces a component that fails WCAG 2.1.1 at Level A: drawing is a path-dependent input technique, and without the typed path this control is not operable without a pointer. It is permitted because a host may have a genuinely equivalent alternative elsewhere on the page, but it is never the default — and `@zoblocks/signature-requires-typed-path` makes it a lint error rather than a runtime app message, because a component has no business writing to a customer's app.",
        "required": false,
        "default": "[\"draw\", \"type\", \"upload\"]"
      },
      {
        "name": "onAuditEvent",
        "type": "((event: { type: string; at: string; detail?: string; }) => void)",
        "description": "Each capture, change and refusal as a structured event. Timed by `now`, never by the browser.",
        "required": false
      },
      {
        "name": "onChange",
        "type": "((value: SignatureValue) => void)",
        "description": "Fired whenever the outcome changes — including when somebody declines, which is a value and not an error.",
        "required": false
      },
      {
        "name": "outcomes",
        "type": "('declined' | 'unable' | 'verbal' | 'on-paper')[]",
        "description": "Which non-signing outcomes are offered. Removing `\"declined\"` makes a refusal unrecordable, which forces staff to either lie or abandon the form.",
        "required": false
      },
      {
        "name": "recordedBy",
        "type": "Signer",
        "description": "The person operating the device when the signer is not. Required for `unable` — an unwitnessed `unable` is a compile error.",
        "required": false
      },
      {
        "name": "signer",
        "type": "Partial<Signer>",
        "description": "Who is signing, as far as the host already knows. Anything omitted is asked for.",
        "required": false
      },
      {
        "name": "status",
        "type": "'error' | 'warning'",
        "description": "Validation state from the surrounding form. Renders the field's error styling without inventing a message.",
        "required": false
      },
      {
        "name": "subject",
        "type": "Subject",
        "description": "Who or what is being signed for. Rendered so the signer can check it before signing, which is the entire point of showing it.",
        "required": false
      },
      {
        "name": "subtitle",
        "type": "React.ReactNode",
        "description": "A line under the title for the qualification the title cannot carry.",
        "required": false
      },
      {
        "name": "title",
        "type": "React.ReactNode",
        "description": "The heading above the control. Also its accessible name.",
        "required": false
      },
      {
        "name": "value",
        "type": "SignatureValue",
        "description": "The signature, controlled. A discriminated union over seven outcomes rather than `string | null`, because a refusal and an untouched field are different facts.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "Signature",
        "props": [
          {
            "name": "now",
            "type": "string",
            "description": "ISO 8601 from the server. The component never reads the clock.",
            "required": true
          },
          {
            "name": "attestation",
            "type": "React.ReactNode",
            "description": "The sentence the signer is agreeing to, shown above the control. Required for `meaning=\"attestation\"`; a signature over unstated words is not an attestation.",
            "required": false
          },
          {
            "name": "capacities",
            "type": "Capacity[]",
            "description": "The capacities this signer may sign in — clinician, patient, guardian, interpreter. Offered as a choice when there is more than one, because the capacity changes what the signature means.",
            "required": false
          },
          {
            "name": "captureBiometrics",
            "type": "boolean",
            "description": "Record stroke timing and pressure alongside the image. Off by default: it is additional personal data and most workflows do not need it.",
            "required": false
          },
          {
            "name": "className",
            "type": "string",
            "description": "Applied to the outer element.",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "SignatureValue",
            "description": "The starting signature, uncontrolled. Use for a form re-opened on an existing record.",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "Blocks every path including the refusals. Rarely right — if the form is not signable yet, say why rather than removing the ability to decline.",
            "required": false
          },
          {
            "name": "documentHash",
            "type": "string",
            "description": "A hash of exactly what was signed. Without it the signature attests to a document nobody can later identify.",
            "required": false
          },
          {
            "name": "id",
            "type": "string",
            "description": "Supplied by `Form.Item`. Attached to the trigger so the label resolves.",
            "required": false
          },
          {
            "name": "locale",
            "type": "Partial<SignatureLocale>",
            "description": "Overrides for every generated string, including the seven outcome names. Supply it for any language that is not English.",
            "required": false
          },
          {
            "name": "meaning",
            "type": "SignatureMeaning",
            "description": "What signing this asserts: consent, attestation, witness, receipt. It selects the wording and it is recorded, because a signature with no stated meaning is not evidence of anything.",
            "required": false
          },
          {
            "name": "methods",
            "type": "CaptureMethod[]",
            "description": "Which capture methods to offer. Omitting `\"type\"` produces a component that fails WCAG 2.1.1 at Level A: drawing is a path-dependent input technique, and without the typed path this control is not operable without a pointer. It is permitted because a host may have a genuinely equivalent alternative elsewhere on the page, but it is never the default — and `@zoblocks/signature-requires-typed-path` makes it a lint error rather than a runtime app message, because a component has no business writing to a customer's app.",
            "required": false,
            "default": "[\"draw\", \"type\", \"upload\"]"
          },
          {
            "name": "onAuditEvent",
            "type": "((event: { type: string; at: string; detail?: string; }) => void)",
            "description": "Each capture, change and refusal as a structured event. Timed by `now`, never by the browser.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((value: SignatureValue) => void)",
            "description": "Fired whenever the outcome changes — including when somebody declines, which is a value and not an error.",
            "required": false
          },
          {
            "name": "outcomes",
            "type": "('declined' | 'unable' | 'verbal' | 'on-paper')[]",
            "description": "Which non-signing outcomes are offered. Removing `\"declined\"` makes a refusal unrecordable, which forces staff to either lie or abandon the form.",
            "required": false
          },
          {
            "name": "recordedBy",
            "type": "Signer",
            "description": "The person operating the device when the signer is not. Required for `unable` — an unwitnessed `unable` is a compile error.",
            "required": false
          },
          {
            "name": "signer",
            "type": "Partial<Signer>",
            "description": "Who is signing, as far as the host already knows. Anything omitted is asked for.",
            "required": false
          },
          {
            "name": "status",
            "type": "'error' | 'warning'",
            "description": "Validation state from the surrounding form. Renders the field's error styling without inventing a message.",
            "required": false
          },
          {
            "name": "subject",
            "type": "Subject",
            "description": "Who or what is being signed for. Rendered so the signer can check it before signing, which is the entire point of showing it.",
            "required": false
          },
          {
            "name": "subtitle",
            "type": "React.ReactNode",
            "description": "A line under the title for the qualification the title cannot carry.",
            "required": false
          },
          {
            "name": "title",
            "type": "React.ReactNode",
            "description": "The heading above the control. Also its accessible name.",
            "required": false
          },
          {
            "name": "value",
            "type": "SignatureValue",
            "description": "The signature, controlled. A discriminated union over seven outcomes rather than `string | null`, because a refusal and an untouched field are different facts.",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { Form } from \"antd\";\nimport { Signature, signatureRequired } from \"@zoblocks/signature\";\nimport \"@zoblocks/signature/styles.css\";\n\n// signatureRequired() accepts a decline as an answer. A rule demanding\n// outcome === \"signed\" would make refusal impossible to submit.\n<Form.Item name=\"consent\" label=\"Patient signature\" rules={[signatureRequired()]}>\n  <Signature\n    now={serverTime}\n    meaning=\"consent\"\n    attestation=\"I have read the information about this procedure, I have had the chance to ask questions, and I agree to go ahead.\"\n    subject={{ display: \"Randall, Josh\", reference: \"Patient/4471902\" }}\n    recordedBy={{ name: \"A. Okafor\", credential: \"RN\" }}\n    outcomes={[\"declined\", \"unable\", \"verbal\", \"on-paper\"]}\n  />\n</Form.Item>;",
    "guidance": {
      "use": [
        "Consent forms, treatment authorisations, and anywhere a refusal must be recordable rather than left blank.",
        "Clinician attestation and countersignature, where the record must say who is accountable and in what capacity.",
        "Signing on behalf of someone — a parent for a minor, a proxy for an incapacitated adult — which the capacity field captures explicitly.",
        "Inside an Ant Design form: it satisfies the custom-control contract, so `Form.Item` wiring and validation status work with no adapter.",
        "SignatureBlock at the foot of a discharge summary, referral letter or policy approval, where the reader needs the signer's role and register — not the full audit record — to decide whether to act on it."
      ],
      "avoid": [
        "Controlled-substance prescribing. DEA EPCS is a separate and far stricter regime — identity proofing, two-factor, a certified application — and this does not satisfy it.",
        "Anywhere you need cryptographic non-repudiation from the component alone. A PNG of a mark carries no integrity guarantee; pair it with a detached JWS.",
        "As an identity check. It records the identity the host asserts and cannot verify it; 21 CFR 11.200's two-component rule lives in your auth layer.",
        "Storing a signature as a theme asset. A signature is credential data attached to a person, not brand data attached to an organisation, and a theme versions, publishes, rolls back and is served from a public URL — none of which a signature should do.",
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
        "label": "An unsigned document does not look signed",
        "detail": "SignatureBlock renders declined, unable, verbal, on-paper, pending and revoked as a bordered notice with the words 'Not signed', never as a rule with a name beneath it. A reader skimming a letter must not come away believing an attestation exists; status is carried in text rather than by colour, so it survives monochrome print and forced colors."
      },
      {
        "label": "Targets meet the 24px floor",
        "detail": "SC 2.5.8 exempts the canvas — a spatially-selected area counts as one target — so it is entirely a toolbar concern. Undo, redo and clear are all at least 24 by 24."
      }
    ],
    "limitations": [
      "Ant Design is a peer dependency. This is the only Zoblocks component that is not distributed as copy-as-source, because copying antd's Modal and Form into a consumer's repository would be a fork rather than a component.",
      "Signature.data is a graphical signature only — an image of a mark. Deployments needing non-repudiation add a second Signature entry carrying a JWS.",
      "The timestamp is a required prop, not read from the clock. A browser clock is not evidence, and 42 CFR 482.24(c)(1) wants entries dated by whoever is accountable.",
      "Stroke biometrics are captured into the model but never emitted unless explicitly opted in, because whether stroke dynamics are a 'writing sample' is unsettled under BIPA and CUBI.",
      "Interpreter attestation, adopt-and-apply, and saved signatures are designed but not built."
    ],
    "related": [
      "clinical-note",
      "safety-plan",
      "identity"
    ],
    "dependencies": [
      "antd",
      "@zoblocks/signature-core"
    ],
    "install": "pnpm add @zoblocks/signature",
    "technicalName": "Signature",
    "aliases": [
      "signature pad",
      "consent signature",
      "e-signature",
      "sign and file",
      "attestation"
    ],
    "tags": [
      "form-control",
      "data-entry",
      "keyboard-first",
      "print-safe",
      "themeable"
    ],
    "uxGuidelines": {
      "do": [
        "Pass a server-supplied `now`. A signature timestamped by the client's clock is not evidence.",
        "State the attestation above the pad, in the words the signer is agreeing to.",
        "Offer decline as a first-class outcome, not a cancel button.",
        "Record a witness when the outcome is `unable` — it is a compile error without one."
      ],
      "dont": [
        "Do not treat an empty pad as \"not signed yet\". It is indistinguishable from a refusal unless the outcome says which.",
        "Do not ship a draw-only pad. A signature reachable only by pointer fails WCAG 2.1.1 and is a lint error here.",
        "Do not write the signature into Consent — R4 and R5 carry no signature element on it. Only Provenance.signature does."
      ]
    },
    "domain": {
      "industries": [
        "healthcare",
        "behavioral-health"
      ],
      "clinicalContext": "Consent, attestation and clinical sign-off. The value is a discriminated union over seven outcomes rather than string | null, because a patient who refused to sign and a form nobody opened are different facts with different consequences — and only one of them is a reason to stop.",
      "workflows": [
        "intake",
        "documentation",
        "treatment-planning"
      ],
      "phi": {
        "handles": true,
        "notes": "Captures a signature image, the signer's name and role, and a server-supplied timestamp — all PHI. The stroke buffer never leaves the browser except in the emitted Bundle, and `now` is a required prop rather than a Date.now() call so the recorded time is the server's and is testable."
      },
      "auditable": true,
      "permissions": [
        "provenance.write",
        "consent.write"
      ],
      "terminology": [
        "FHIR",
        "SNOMED CT"
      ]
    },
    "variants": [
      {
        "id": "draw",
        "label": "Draw",
        "description": "Pointer or stylus. The default on a tablet at the bedside.",
        "args": {
          "methods": [
            "draw"
          ]
        }
      },
      {
        "id": "type",
        "label": "Type",
        "description": "A typed name rendered in a cursive face. The keyboard-reachable path, and never the only one offered.",
        "args": {
          "methods": [
            "type"
          ]
        }
      },
      {
        "id": "upload",
        "label": "Upload",
        "description": "An image of a wet signature, for a form that arrived on paper.",
        "args": {
          "methods": [
            "upload"
          ]
        }
      },
      {
        "id": "all",
        "label": "All three",
        "description": "The house default. Every signer has a path that works for them.",
        "args": {
          "methods": [
            "draw",
            "type",
            "upload"
          ]
        }
      }
    ],
    "controls": [
      {
        "prop": "meaning",
        "control": "select",
        "label": "Meaning",
        "options": [
          "consent",
          "verification",
          "author",
          "coauthor",
          "validation",
          "witness",
          "interpreter",
          "review"
        ],
        "defaultValue": "consent"
      },
      {
        "prop": "methods",
        "control": "segmented",
        "label": "Capture methods",
        "options": [
          "draw",
          "type",
          "upload"
        ],
        "defaultValue": "draw"
      },
      {
        "prop": "outcomes",
        "control": "select",
        "label": "Non-signed outcomes offered",
        "options": [
          "declined",
          "unable",
          "verbal",
          "on-paper"
        ]
      },
      {
        "prop": "disabled",
        "control": "switch",
        "label": "Disabled",
        "defaultValue": false
      },
      {
        "prop": "status",
        "control": "segmented",
        "label": "Validation status",
        "options": [
          "error",
          "warning"
        ]
      },
      {
        "prop": "attestation",
        "control": "text",
        "label": "Attestation text"
      },
      {
        "prop": "captureBiometrics",
        "control": "switch",
        "label": "Capture biometrics",
        "defaultValue": false
      },
      {
        "prop": "onChange",
        "control": "event",
        "label": "onChange"
      }
    ],
    "a11yChecks": [
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "One test signs the whole form using tab() and keyboard() only, never dispatching a pointer event. A draw-only pad is a lint error.",
        "evidence": "Signature.test.tsx"
      },
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "The pad is a labelled control with its current outcome in the accessible name, not a bare canvas.",
        "evidence": "Signature.test.tsx"
      },
      {
        "wcag": "3.3.1",
        "name": "Error identification",
        "status": "pass",
        "how": "signatureRequired() accepts a decline as a valid answer, so refusing is submittable rather than an error state.",
        "evidence": "Signature.test.tsx"
      },
      {
        "wcag": "3.3.2",
        "name": "Labels or instructions",
        "status": "pass",
        "how": "The attestation is rendered above the pad and is part of the control's accessible description.",
        "evidence": "Signature.test.tsx"
      },
      {
        "wcag": "1.4.11",
        "name": "Non-text contrast",
        "status": "pass",
        "how": "Pad border, baseline and focus ring are gated in the token build across three themes.",
        "evidence": "contrast.gate"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size",
        "status": "pass",
        "how": "Every method control and the clear affordance hold a 24px minimum.",
        "evidence": "e2e/docs-site.spec.ts"
      },
      {
        "wcag": "2.4.11",
        "name": "Focus not obscured",
        "status": "pass",
        "how": "The signing dialog returns focus to the invoking control and never leaves it behind the sticky footer.",
        "evidence": "e2e/docs-site.spec.ts"
      },
      {
        "wcag": "2.2.1",
        "name": "Timing adjustable",
        "status": "not-applicable",
        "how": "No session timeout is imposed by the component."
      }
    ],
    "examples": [
      {
        "id": "consent-in-a-form",
        "title": "Consent inside an antd Form",
        "description": "The common case. `signatureRequired()` treats a decline as a valid answer — a rule demanding outcome === \"signed\" would make refusal impossible to submit.",
        "fixture": "patientRoutine",
        "code": "import { Form } from \"antd\";\nimport { Signature, signatureRequired } from \"@zoblocks/signature\";\nimport \"@zoblocks/signature/styles.css\";\n\n<Form.Item name=\"consent\" rules={[signatureRequired()]}>\n  <Signature\n    now={serverTime}\n    meaning=\"consent\"\n    attestation=\"I agree to the treatment described above.\"\n  />\n</Form.Item>;"
      },
      {
        "id": "refusal",
        "title": "The patient who refused to sign",
        "description": "Seven outcomes, not two. A refusal and an unopened form are different clinical facts, and the union makes it impossible to record them the same way.",
        "fixture": "consentDeclined",
        "code": "// The value is a discriminated union, so this compiles only if every\n// outcome is handled — including the three that are not \"signed\".\nswitch (value.outcome) {\n  case \"signed\":   return file(value.image, value.signedAt);\n  case \"declined\": return recordRefusal(value.reason, value.recordedAt);\n  case \"unable\":   return recordUnable(value.reason, value.witness); // witness is required\n  case \"verbal\":   return recordVerbal(value.witness);\n  case \"on-paper\": return awaitScan();\n  case \"pending\":  return null;\n  case \"revoked\":  return revoke(value.revokedAt);\n}"
      },
      {
        "id": "provenance-bundle",
        "title": "What it emits, and why it is not a Consent",
        "description": "Consent carries no signature element in R4 or R5 — only Provenance.signature does. The component emits a transaction Bundle so the two land together or not at all.",
        "fixture": "provenanceConsent",
        "code": "import { toFhirBundle } from \"@zoblocks/signature\";\nimport { patientRoutine } from \"@zoblocks/fixtures\";\n\n// A transaction Bundle: the Consent and the Provenance that signs it, posted\n// together or not at all. Emitting the Consent alone would store an agreement\n// with nothing proving anyone made it.\nconst bundle = toFhirBundle(value, {\n  release: \"R4\",\n  subject: {\n    display: \"Amara Okonkwo\",\n    reference: `Patient/${patientRoutine.id}`,\n  },\n});\n\n// bundle.entry[0] → POST Consent\n// bundle.entry[1] → POST Provenance, carrying Provenance.signature\n\n// The signer travels on the value, not in these options: who signed is part of\n// what was captured, and re-supplying it here would let the two disagree."
      }
    ],
    "fixtures": [
      "patientRoutine",
      "practitionerSigner",
      "practitionerWitness",
      "consentTreatment",
      "consentDeclined",
      "provenanceConsent"
    ],
    "seo": {
      "slug": "signature",
      "title": "Signature — React consent signature component",
      "description": "A React signature component for clinical consent: draw, type or upload, with seven outcomes including refusal, and a FHIR Provenance bundle on submit.",
      "primaryKeyword": "react signature component healthcare",
      "secondaryKeywords": [
        "consent signature react",
        "e-signature react",
        "fhir provenance signature",
        "patient consent form react"
      ],
      "searchIntent": "commercial",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "patient-intake",
        "clinical-documentation"
      ],
      "alternatives": [
        {
          "ref": "clinical-note",
          "when": "you need the whole note signed rather than a single attestation"
        },
        {
          "ref": "switch",
          "when": "the answer is a yes/no acknowledgement with no legal weight"
        }
      ]
    }
  },
  {
    "name": "tabs",
    "title": "Tabs",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "primitive",
    "distribution": "package",
    "packageName": "@zoblocks/tabs",
    "frameworks": {
      "antd": {
        "policy": "compatible",
        "bridge": true,
        "divergences": [
          "`as` is required. antd's Tabs infers nothing, so a strip that navigates and a strip that switches views are the same component with the same accessibility tree; here they are not."
        ]
      }
    },
    "summary": "Tabs that know what they are: a view switch, a link list, a form value or a wizard — four accessibility trees behind one silhouette.",
    "tagline": "Eleven skins over one accessibility tree.",
    "description": "Four semantic modes across eleven visual variants, with the WAI-ARIA keyboard model, five overflow strategies, and the states a clinical surface actually reaches — restricted, stale, unsaved. `as` is required and has no default, because the mode is the accessibility tree and the variant is only CSS.",
    "rationale": "Almost every tab component solves the easy half: show one panel, hide the others, move an underline. The hard half is that “tabs” is four different components sharing a shape. A view switch owns panels and answers to arrow keys. A navigation menu is a list of links, and hijacking arrows on it destroys a keyboard user's focus the moment they press one. A segmented filter is a form value that belongs in a Form.Item. A wizard is ordered and gated. Shipping one of them and using it as all four is the most-reported tab defect in every design system audit, and it is invisible: a role=tablist wrapped around anchors spells every attribute correctly, so axe passes it. Making `as` required is the whole design — everything else follows from having said out loud what the control is.",
    "categories": [
      "Navigation",
      "Layout"
    ],
    "fhir": [],
    "states": [
      "Selected",
      "Unselected",
      "Disabled with a stated reason",
      "Restricted (present, gated, explained)",
      "Stale — showing cached data",
      "Unavailable offline",
      "Unsaved changes pending",
      "Locked step",
      "Completed step",
      "Overflowing into a menu",
      "Collapsed to a native picker",
      "Awaiting an async guard"
    ],
    "props": [
      {
        "name": "aria-label",
        "type": "string",
        "description": "Required: the accessible name of the strip.",
        "required": true
      },
      {
        "name": "as",
        "type": "SemanticMode",
        "description": "What this control *is*. Required, with no default — see `validateTabsConfig`. A view switch, a link list, a form value and a wizard share one silhouette and need four different accessibility trees.",
        "required": true
      },
      {
        "name": "items",
        "type": "readonly TabsItemProps[]",
        "description": "The tabs, in order. Each carries its own trigger, panel and disabled state; the strip derives its keyboard model from the enabled ones.",
        "required": true
      },
      {
        "name": "activation",
        "type": "Activation",
        "description": "Whether arrowing to a tab selects it (`automatic`) or merely focuses it (`manual`). Use `manual` when selecting is expensive or destructive.",
        "required": false
      },
      {
        "name": "defaultValue",
        "type": "string",
        "description": "The initially selected tab, uncontrolled. Defaults to the first enabled item.",
        "required": false
      },
      {
        "name": "editable",
        "type": "TabsEditable",
        "description": "Allows tabs to be added and closed, and supplies the handlers for it. Omit for a fixed strip.",
        "required": false
      },
      {
        "name": "fill",
        "type": "FillMode",
        "description": "How triggers divide the available width — natural, equal, or stretched to fill.",
        "required": false
      },
      {
        "name": "hotkeys",
        "type": "boolean",
        "description": "Ctrl/Cmd + 1…9 to jump to a tab. Off by default: on Windows and Linux those belong to the browser, and claiming them takes a shortcut the user already had for something else.",
        "required": false
      },
      {
        "name": "id",
        "type": "string",
        "description": "Supplied to make ids deterministic in snapshot tests.",
        "required": false
      },
      {
        "name": "indicator",
        "type": "IndicatorKind",
        "description": "The mark showing which tab is selected — an underline, a pill, or none. Never the only cue: selection is also in the accessibility tree.",
        "required": false
      },
      {
        "name": "keepScroll",
        "type": "boolean",
        "description": "Restore each panel's scroll position when it is selected again. Off by default, because on a clinical surface returning to where somebody was is sometimes wrong.",
        "required": false
      },
      {
        "name": "listClassName",
        "type": "string",
        "description": "Applied to the tablist element, for a host that needs to position the strip itself.",
        "required": false
      },
      {
        "name": "locale",
        "type": "Partial<TabsLocale>",
        "description": "Overrides for every generated string — the overflow menu, the close affordance, the count announcements. Supply it for any language that is not English.",
        "required": false
      },
      {
        "name": "mount",
        "type": "MountStrategy",
        "description": "When panels enter the DOM: all at once, on first selection, or only while selected. `eager` costs bytes; `unmount` costs panel state.",
        "required": false
      },
      {
        "name": "now",
        "type": "(() => string)",
        "description": "Supplies the ISO timestamp on audit events. Omit it and events carry no `at` — the component does not read the clock.",
        "required": false
      },
      {
        "name": "onAuditEvent",
        "type": "((event: AuditEvent) => void)",
        "description": "Selection changes as structured events, for hosts that must record which view a clinician was looking at. Pair with `now`.",
        "required": false
      },
      {
        "name": "onBeforeChange",
        "type": "BeforeChange",
        "description": "Return false — or a promise of false — to veto. Strip goes inert while a promise is pending.",
        "required": false
      },
      {
        "name": "onChange",
        "type": "((value: string, meta: { via: ChangeSource; }) => void)",
        "description": "Fired after a change commits. `meta.via` says what caused it — pointer, keyboard, hotkey, URL sync — which is what an audit trail needs and what a naive handler throws away.",
        "required": false
      },
      {
        "name": "orientation",
        "type": "Orientation",
        "description": "Horizontal or vertical. Changes which arrow keys move selection, not merely the layout.",
        "required": false
      },
      {
        "name": "overflow",
        "type": "OverflowStrategy",
        "description": "What happens when the triggers do not fit: scroll, wrap, or collapse into a menu. Never truncate — a tab you cannot reach is a tab that does not exist.",
        "required": false
      },
      {
        "name": "panelsClassName",
        "type": "string",
        "description": "Applied to the panel container, not to each panel.",
        "required": false
      },
      {
        "name": "size",
        "type": "TabSize",
        "description": "Trigger height and type scale. The hit area never drops below the 24px floor at any size.",
        "required": false
      },
      {
        "name": "syncHistory",
        "type": "'replace' | 'push'",
        "description": "Whether a change replaces the history entry or pushes a new one. `push` makes Back step through tabs, which is usually not what a reader means by Back.",
        "required": false
      },
      {
        "name": "syncKey",
        "type": "string",
        "description": "The parameter name used by `syncTo`. Required when two tab strips sync on one page.",
        "required": false
      },
      {
        "name": "syncTo",
        "type": "SyncTarget",
        "description": "Mirror the selection into the URL — a query parameter or the hash — so a tab can be linked to and survives a reload.",
        "required": false
      },
      {
        "name": "toolbar",
        "type": "React.ReactNode",
        "description": "Rendered between the strip and the panels — a toolbar, a filter row.",
        "required": false
      },
      {
        "name": "transition",
        "type": "TransitionKind",
        "description": "How panels change. Respects `prefers-reduced-motion` regardless of what is set here.",
        "required": false
      },
      {
        "name": "value",
        "type": "string",
        "description": "The selected tab, controlled. Pair with `onChange`.",
        "required": false
      },
      {
        "name": "variant",
        "type": "TabVariant",
        "description": "Visual skin. Eleven of them share one keyboard model and one accessibility tree, so this changes appearance and nothing else.",
        "required": false
      },
      {
        "name": "virtualise",
        "type": "boolean",
        "description": "Above ~40 triggers, observe the list rather than every trigger. Never removes a trigger from the DOM — a tablist whose children come and go reports \"n of m\" from whatever happens to be rendered.",
        "required": false
      }
    ],
    "exports": [
      {
        "name": "Tabs",
        "props": [
          {
            "name": "aria-label",
            "type": "string",
            "description": "Required: the accessible name of the strip.",
            "required": true
          },
          {
            "name": "as",
            "type": "SemanticMode",
            "description": "What this control *is*. Required, with no default — see `validateTabsConfig`. A view switch, a link list, a form value and a wizard share one silhouette and need four different accessibility trees.",
            "required": true
          },
          {
            "name": "items",
            "type": "readonly TabsItemProps[]",
            "description": "The tabs, in order. Each carries its own trigger, panel and disabled state; the strip derives its keyboard model from the enabled ones.",
            "required": true
          },
          {
            "name": "activation",
            "type": "Activation",
            "description": "Whether arrowing to a tab selects it (`automatic`) or merely focuses it (`manual`). Use `manual` when selecting is expensive or destructive.",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "string",
            "description": "The initially selected tab, uncontrolled. Defaults to the first enabled item.",
            "required": false
          },
          {
            "name": "editable",
            "type": "TabsEditable",
            "description": "Allows tabs to be added and closed, and supplies the handlers for it. Omit for a fixed strip.",
            "required": false
          },
          {
            "name": "fill",
            "type": "FillMode",
            "description": "How triggers divide the available width — natural, equal, or stretched to fill.",
            "required": false
          },
          {
            "name": "hotkeys",
            "type": "boolean",
            "description": "Ctrl/Cmd + 1…9 to jump to a tab. Off by default: on Windows and Linux those belong to the browser, and claiming them takes a shortcut the user already had for something else.",
            "required": false
          },
          {
            "name": "id",
            "type": "string",
            "description": "Supplied to make ids deterministic in snapshot tests.",
            "required": false
          },
          {
            "name": "indicator",
            "type": "IndicatorKind",
            "description": "The mark showing which tab is selected — an underline, a pill, or none. Never the only cue: selection is also in the accessibility tree.",
            "required": false
          },
          {
            "name": "keepScroll",
            "type": "boolean",
            "description": "Restore each panel's scroll position when it is selected again. Off by default, because on a clinical surface returning to where somebody was is sometimes wrong.",
            "required": false
          },
          {
            "name": "listClassName",
            "type": "string",
            "description": "Applied to the tablist element, for a host that needs to position the strip itself.",
            "required": false
          },
          {
            "name": "locale",
            "type": "Partial<TabsLocale>",
            "description": "Overrides for every generated string — the overflow menu, the close affordance, the count announcements. Supply it for any language that is not English.",
            "required": false
          },
          {
            "name": "mount",
            "type": "MountStrategy",
            "description": "When panels enter the DOM: all at once, on first selection, or only while selected. `eager` costs bytes; `unmount` costs panel state.",
            "required": false
          },
          {
            "name": "now",
            "type": "(() => string)",
            "description": "Supplies the ISO timestamp on audit events. Omit it and events carry no `at` — the component does not read the clock.",
            "required": false
          },
          {
            "name": "onAuditEvent",
            "type": "((event: AuditEvent) => void)",
            "description": "Selection changes as structured events, for hosts that must record which view a clinician was looking at. Pair with `now`.",
            "required": false
          },
          {
            "name": "onBeforeChange",
            "type": "BeforeChange",
            "description": "Return false — or a promise of false — to veto. Strip goes inert while a promise is pending.",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((value: string, meta: { via: ChangeSource; }) => void)",
            "description": "Fired after a change commits. `meta.via` says what caused it — pointer, keyboard, hotkey, URL sync — which is what an audit trail needs and what a naive handler throws away.",
            "required": false
          },
          {
            "name": "orientation",
            "type": "Orientation",
            "description": "Horizontal or vertical. Changes which arrow keys move selection, not merely the layout.",
            "required": false
          },
          {
            "name": "overflow",
            "type": "OverflowStrategy",
            "description": "What happens when the triggers do not fit: scroll, wrap, or collapse into a menu. Never truncate — a tab you cannot reach is a tab that does not exist.",
            "required": false
          },
          {
            "name": "panelsClassName",
            "type": "string",
            "description": "Applied to the panel container, not to each panel.",
            "required": false
          },
          {
            "name": "size",
            "type": "TabSize",
            "description": "Trigger height and type scale. The hit area never drops below the 24px floor at any size.",
            "required": false
          },
          {
            "name": "syncHistory",
            "type": "'replace' | 'push'",
            "description": "Whether a change replaces the history entry or pushes a new one. `push` makes Back step through tabs, which is usually not what a reader means by Back.",
            "required": false
          },
          {
            "name": "syncKey",
            "type": "string",
            "description": "The parameter name used by `syncTo`. Required when two tab strips sync on one page.",
            "required": false
          },
          {
            "name": "syncTo",
            "type": "SyncTarget",
            "description": "Mirror the selection into the URL — a query parameter or the hash — so a tab can be linked to and survives a reload.",
            "required": false
          },
          {
            "name": "toolbar",
            "type": "React.ReactNode",
            "description": "Rendered between the strip and the panels — a toolbar, a filter row.",
            "required": false
          },
          {
            "name": "transition",
            "type": "TransitionKind",
            "description": "How panels change. Respects `prefers-reduced-motion` regardless of what is set here.",
            "required": false
          },
          {
            "name": "value",
            "type": "string",
            "description": "The selected tab, controlled. Pair with `onChange`.",
            "required": false
          },
          {
            "name": "variant",
            "type": "TabVariant",
            "description": "Visual skin. Eleven of them share one keyboard model and one accessibility tree, so this changes appearance and nothing else.",
            "required": false
          },
          {
            "name": "virtualise",
            "type": "boolean",
            "description": "Above ~40 triggers, observe the list rather than every trigger. Never removes a trigger from the DOM — a tablist whose children come and go reports \"n of m\" from whatever happens to be rendered.",
            "required": false
          }
        ]
      },
      {
        "name": "TabsAddButton",
        "props": []
      }
    ],
    "usage": "import { Tabs } from \"@zoblocks/tabs\";\nimport \"@zoblocks/tabs/styles.css\";\n\n// `as` is required and has no default: it selects the accessibility tree.\n// `variant` is orthogonal and changes no ARIA at all.\n<Tabs\n  as=\"tabs\"\n  variant=\"segmented\"\n  aria-label=\"Chart sections\"\n  defaultValue=\"summary\"\n  items={[\n    { value: \"summary\", label: \"Summary\", children: <Summary /> },\n    // The tone reaches the accessible name as a word: \"Labs, 2 critical\".\n    { value: \"labs\", label: \"Labs\", count: 2, tone: \"critical\", children: <Labs /> },\n    {\n      value: \"bh\",\n      label: \"Behavioural health\",\n      disabled: true,\n      disabledReason: \"Restricted — opening records an access event\",\n    },\n  ]}\n/>;",
    "guidance": {
      "use": [
        "Panels of one object — a chart with Summary, Vitals, Labs, Notes. That is as=\"tabs\".",
        "A list of URLs, where each item is a route. That is as=\"nav\", and it keeps cmd-click, middle-click and the back button working.",
        "A segmented control that filters or sets a value. That is as=\"radiogroup\", and it belongs inside a Form.Item.",
        "An ordered flow where later steps may be unreachable. That is as=\"steps\": backwards is free, forwards is earned.",
        "Long strips: pick an overflow strategy deliberately — scroll for touch, menu for dense desktop, collapse for narrow containers."
      ],
      "avoid": [
        "as=\"tabs\" for anything that navigates. It is the defect this component exists to prevent, and it is a lint error.",
        "overflow=\"wrap\" on a tablist. Once a strip wraps onto two rows, \"the next tab\" stops being a direction and arrow navigation has no correct answer.",
        "Hiding a disabled or empty tab. Both change the tab count between sessions and destroy the muscle memory that makes a chart fast to work in.",
        "Reordering tabs by importance or recency. Position is memory; a chart that rearranges itself between visits is how people open the wrong section.",
        "activation=\"automatic\" when a panel fetches. Arrowing across six tabs fires six requests and reads six live regions."
      ]
    },
    "accessibility": [
      {
        "label": "The mode is declared, not guessed",
        "detail": "`as` selects the accessibility tree: tablist of buttons, a real nav of anchors, a radiogroup, or a gated tablist. It has no default, `@zoblocks/tabs-semantic-mode` makes omitting it a lint error, and passing an href under as=\"tabs\" throws. A tablist of links passes every automated checker and then destroys focus on the first arrow key."
      },
      {
        "label": "One tab stop, and it follows selection",
        "detail": "Roving tabindex rather than aria-activedescendant, because real DOM focus is what carries the focus ring under Windows High Contrast. Tab enters at the selected trigger and the next Tab leaves the group entirely."
      },
      {
        "label": "Disabled means present, not absent",
        "detail": "aria-disabled, never the disabled attribute, and a `disabledReason` is mandatory. In a chart, “no behavioural health section” and “behavioural health, restricted” are different clinical facts, and a keyboard user has to be able to tell which one they are looking at."
      },
      {
        "label": "Colour is never the signal",
        "detail": "A count and a tone reach the accessible name as a word: a red 2 on a Labs tab announces “Labs, 2 critical”, not “Labs 2”. The same holds for the unsaved dot and for stale availability."
      },
      {
        "label": "The strip owns only tabs",
        "detail": "The add button, the overflow trigger and the scroll nudges are siblings of the tablist, not children. Anything else inside it fails aria-required-children and corrupts the “n of m” position a screen reader announces."
      },
      {
        "label": "Nothing interactive inside a trigger",
        "detail": "A close button nested in a role=tab is invalid ARIA; assistive technology either flattens the tab or skips the button. The visible affordance is aria-hidden for the pointer, and the keyboard path is Delete on the tab itself, which is what APG prescribes."
      },
      {
        "label": "Correct before hydration",
        "detail": "The server-rendered strip carries the roving tab stop and paints selection from CSS, so a keyboard user who arrives before the JavaScript does still has an entry point. Configuration is validated at render, so an invalid strip fails in renderToString rather than only in a browser."
      },
      {
        "label": "Motion is reduced, not removed",
        "detail": "prefers-reduced-motion collapses the indicator transition to 1ms rather than deleting it, because a removed transition never fires transitionend and leaves a permanently promoted compositor layer."
      }
    ],
    "limitations": [
      "It does not own routing. `syncTo` writes through an adapter you supply, because a component library that picks a router picks its customers.",
      "It does not enforce permissions. `disabled` and `availability` are presentation; a hidden panel is not a security control, and authorisation belongs on the server.",
      "It will not animate panel height. A height transition over arbitrary content moves the thing the user is reading, and janks while doing it.",
      "transition=\"view\" is opt-in and unsupported in Firefox as of this writing. It serialises the update, which is wrong for a strip you arrow through quickly; the standard transition is the default for that reason.",
      "`hotkeys` is off by default. Ctrl+1…9 belongs to the browser first on Windows and Linux, so claiming it takes a shortcut the user already had.",
      "Drag-to-reorder is not implemented. Keyboard reorder is (Ctrl+Shift+Arrow), because a pointer-only affordance for a destructive-feeling action is the wrong half to build first."
    ],
    "related": [
      "accordion",
      "chart-accordion",
      "switch"
    ],
    "dependencies": [
      "@zoblocks/tabs-core"
    ],
    "install": "pnpm add @zoblocks/tabs",
    "technicalName": "Tabs",
    "aliases": [
      "tab strip",
      "segmented control",
      "view switcher",
      "wizard steps",
      "chart sections"
    ],
    "tags": [
      "navigation",
      "keyboard-first",
      "disclosure",
      "themeable",
      "headless"
    ],
    "uxGuidelines": {
      "do": [
        "Declare `as` on every strip. It selects the accessibility tree, and there is no default.",
        "Give a disabled tab a `disabledReason`. \"Restricted\" and \"not applicable here\" are different clinical facts.",
        "Keep the count of tabs under about seven for a view switch; beyond that, use the rail or a menu.",
        "Let the overflow strategy be chosen by the surface, not by the tab count."
      ],
      "dont": [
        "Do not wrap anchors in `as=\"tabs\"` — it passes every automated checker and destroys focus on the first arrow key.",
        "Do not nest an interactive control inside a trigger. The close affordance is aria-hidden and the keyboard path is Delete on the tab.",
        "Do not use colour alone for a count's tone. A red 2 must announce as \"2 critical\"."
      ]
    },
    "domain": {
      "industries": [
        "general",
        "healthcare"
      ],
      "clinicalContext": "Consumes no FHIR resource. It is listed as clinical because a chart's section strip must distinguish a section that is empty from one that is restricted, stale, or unavailable offline — four facts that a generic tab component collapses into one, and that a clinician reads as if they were the same.",
      "workflows": [
        "documentation",
        "care-coordination"
      ],
      "phi": {
        "handles": false,
        "notes": "Renders no PHI of its own. A tab label supplied by the host may carry it — a patient name on a chart tab — so labels are never logged and never sent to telemetry."
      },
      "auditable": false,
      "permissions": [],
      "terminology": []
    },
    "variants": [
      {
        "id": "underline",
        "label": "Underline",
        "description": "The default. An underline indicator on a hairline track, for a page's primary sections.",
        "args": {
          "variant": "underline"
        }
      },
      {
        "id": "enclosed",
        "label": "Enclosed",
        "description": "Tabs as connected cards. For a workspace where each tab owns a document.",
        "args": {
          "variant": "enclosed"
        }
      },
      {
        "id": "segmented",
        "label": "Segmented",
        "description": "A form control. Belongs in a Form.Item and carries a value, not a view.",
        "args": {
          "variant": "segmented",
          "as": "radiogroup"
        }
      },
      {
        "id": "rail",
        "label": "Rail",
        "description": "Vertical. Arrow keys become up and down, because the orientation is the keyboard model.",
        "args": {
          "variant": "rail",
          "orientation": "vertical"
        }
      },
      {
        "id": "ghost",
        "label": "Ghost",
        "description": "No track, no indicator, no measurement pass. For dense toolbars and popovers.",
        "args": {
          "variant": "ghost"
        }
      }
    ],
    "controls": [
      {
        "prop": "as",
        "control": "segmented",
        "label": "Semantic mode",
        "options": [
          "tabs",
          "nav",
          "radiogroup",
          "steps"
        ],
        "defaultValue": "tabs"
      },
      {
        "prop": "variant",
        "control": "select",
        "label": "Variant",
        "options": [
          "underline",
          "segmented",
          "pill",
          "enclosed",
          "rail",
          "ghost",
          "stepper",
          "command",
          "card",
          "stat",
          "unstyled"
        ],
        "defaultValue": "underline"
      },
      {
        "prop": "orientation",
        "control": "segmented",
        "label": "Orientation",
        "options": [
          "horizontal",
          "vertical"
        ],
        "defaultValue": "horizontal"
      },
      {
        "prop": "size",
        "control": "segmented",
        "label": "Size",
        "options": [
          "sm",
          "md",
          "lg"
        ],
        "defaultValue": "md"
      },
      {
        "prop": "overflow",
        "control": "select",
        "label": "Overflow",
        "options": [
          "scroll",
          "menu",
          "wrap",
          "collapse",
          "none"
        ],
        "defaultValue": "scroll"
      },
      {
        "prop": "items",
        "control": "fixture",
        "label": "Chart",
        "options": [
          "patientRoutine",
          "patientRestricted"
        ]
      }
    ],
    "a11yChecks": [
      {
        "wcag": "4.1.2",
        "name": "Name, role, value",
        "status": "pass",
        "how": "`as` selects the tree: a tablist of buttons, a real nav of anchors, or a radiogroup. Passing an href under as=\"tabs\" throws.",
        "evidence": "tabs.test.tsx"
      },
      {
        "wcag": "2.1.1",
        "name": "Keyboard",
        "status": "pass",
        "how": "Roving tabindex. Tab enters at the selected trigger; the next Tab leaves the group entirely.",
        "evidence": "tabs.test.tsx"
      },
      {
        "wcag": "2.4.3",
        "name": "Focus order",
        "status": "pass",
        "how": "After a close, focus moves to the neighbour deterministically rather than to body.",
        "evidence": "tabs.test.tsx"
      },
      {
        "wcag": "1.4.1",
        "name": "Use of colour",
        "status": "pass",
        "how": "A count's tone reaches the accessible name as a word — \"Labs, 2 critical\", never \"Labs 2\".",
        "evidence": "tabs.test.tsx"
      },
      {
        "wcag": "1.4.11",
        "name": "Non-text contrast",
        "status": "pass",
        "how": "Indicator, track and focus ring are gated in the token build across three themes.",
        "evidence": "contrast.gate"
      },
      {
        "wcag": "2.5.8",
        "name": "Target size",
        "status": "pass",
        "how": "Triggers hold a 24px minimum at every density; density changes spacing, never target size.",
        "evidence": "e2e/docs-site.spec.ts"
      },
      {
        "wcag": "2.3.3",
        "name": "Animation from interactions",
        "status": "pass",
        "how": "prefers-reduced-motion collapses the indicator transition to a designed still state.",
        "evidence": "tabs.test.tsx"
      },
      {
        "wcag": "2.2.1",
        "name": "Timing adjustable",
        "status": "not-applicable",
        "how": "No time limit exists anywhere in the component."
      }
    ],
    "examples": [
      {
        "id": "chart-sections",
        "title": "Chart sections",
        "description": "The common case: a view switch over a patient chart, with a critical count on Labs that reaches the accessible name as a word.",
        "fixture": "patientRoutine",
        "code": "import { Tabs } from \"@zoblocks/tabs\";\nimport { allergyList, medicationList, observationPanel } from \"@zoblocks/fixtures\";\nimport \"@zoblocks/tabs/styles.css\";\n\nconst critical = observationPanel.filter(isCritical);\n\n<Tabs\n  as=\"tabs\"\n  aria-label=\"Chart sections\"\n  defaultValue=\"summary\"\n  items={[\n    { value: \"summary\", label: \"Summary\", children: <Summary /> },\n    {\n      value: \"labs\",\n      label: \"Labs\",\n      // Counted from the data, never typed in. A tone is a claim about the\n      // patient, so it has to come from the same place the panel does.\n      count: critical.length,\n      tone: critical.length ? \"critical\" : \"neutral\",\n      children: <Labs observations={observationPanel} />,\n    },\n    { value: \"meds\", label: \"Medications\", count: medicationList.length, children: <Meds /> },\n    { value: \"allergies\", label: \"Allergies\", count: allergyList.length, children: <Allergies /> },\n  ]}\n/>;"
      },
      {
        "id": "restricted-section",
        "title": "A section that is restricted, not absent",
        "description": "A disabled tab requires a reason. Omitting the section entirely would tell the clinician it does not exist; greying it silently tells them nothing.",
        "fixture": "patientRestricted",
        "code": "import { patientRestricted } from \"@zoblocks/fixtures\";\n\n<Tabs\n  as=\"tabs\"\n  aria-label=\"Chart sections\"\n  defaultValue=\"summary\"\n  items={[\n    { value: \"summary\", label: \"Summary\", children: <Summary /> },\n    {\n      value: \"bh\",\n      label: \"Behavioural health\",\n      disabled: true,\n      // Mandatory. aria-disabled, never the disabled attribute — a keyboard\n      // user has to be able to reach it to find out why they cannot open it.\n      disabledReason:\n        \"Restricted. Opening it records an access event and notifies the record owner.\",\n    },\n  ]}\n/>;"
      },
      {
        "id": "segmented-filter",
        "title": "A segmented control is a form value",
        "description": "Not every tab strip is a view switch. A filter is a form control and belongs in a Form.Item, which is what `as=\"radiogroup\"` declares.",
        "code": "import { Form } from \"antd\";\n\n<Form.Item name=\"density\" label=\"Density\">\n  <Tabs\n    as=\"radiogroup\"\n    variant=\"segmented\"\n    items={[\n      { value: \"compact\", label: \"Compact\" },\n      { value: \"default\", label: \"Default\" },\n      { value: \"comfortable\", label: \"Comfortable\" },\n    ]}\n  />\n</Form.Item>;"
      }
    ],
    "fixtures": [
      "patientRoutine",
      "patientRestricted",
      "observationPanel",
      "allergyList",
      "medicationList"
    ],
    "seo": {
      "slug": "tabs",
      "title": "Tabs — accessible React tab component",
      "description": "A React tabs component with four semantic modes — view switch, navigation, form value, steps — each with the correct ARIA tree and keyboard model.",
      "primaryKeyword": "react tabs component",
      "secondaryKeywords": [
        "accessible tabs react",
        "vertical tabs react",
        "segmented control react",
        "aria tablist"
      ],
      "searchIntent": "commercial",
      "ogImage": "generated"
    },
    "relationships": {
      "builtWith": [],
      "usedIn": [],
      "patterns": [
        "clinical-documentation"
      ],
      "alternatives": [
        {
          "ref": "accordion",
          "when": "the sections should be readable at the same time, or the surface is a phone"
        },
        {
          "ref": "switch",
          "when": "there are exactly two states and one of them is the default"
        }
      ]
    }
  }
];

export const BY_NAME: ReadonlyMap<string, ComponentDoc> = new Map(
  CATALOG.map((component) => [component.name, component]),
);

export const ALL_CATEGORIES: readonly string[] = [
  ...new Set(CATALOG.flatMap((component) => component.categories)),
].sort();
