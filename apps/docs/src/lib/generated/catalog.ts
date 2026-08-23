// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md

import type { ComponentDoc } from "@oxygenui-design/component-meta";

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
        "description": "Overrides any inherited `data-ox-density`.",
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
            "description": "Overrides any inherited `data-ox-density`.",
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
            "description": "Overrides any inherited `data-ox-density`.",
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
            "description": "",
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
    "usage": "import { Accordion } from \"@/components/oxygen/accordion\";\n\n<Accordion\n  headingLevel={2}\n  density=\"clinical\"\n  onDisclose={async (event) => {\n    await audit.record({ section: event.key, reason: event.reasonCode, at: event.at });\n    return true;\n  }}\n  items={[\n    {\n      key: \"risk\",\n      label: \"Risk & suicidality\",\n      severity: \"critical\",\n      summary: \"C-SSRS positive · 13 Aug\",\n      children: <RiskPanel {...risk} />,\n    },\n    {\n      key: \"sud\",\n      label: \"Substance use treatment\",\n      access: { kind: \"consent\", policy: \"42 CFR Part 2\", state: \"granted\" },\n      children: <SudPanel {...sud} />,\n    },\n    {\n      key: \"psychotherapy\",\n      label: \"Psychotherapy notes\",\n      access: { kind: \"withheld\", reason: \"Kept separately by the author\" },\n    },\n  ]}\n/>",
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
      "Requires styles/oxygen-accordion.css, installed with accordion-core.",
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
    "install": "npx @oxygenui-design/cli add accordion",
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
      "infusion-loader",
      "helix-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @oxygenui-design/cli add breath-loader"
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
    "description": "A timeline over clinical, administrative, communication and patient-reported events, with coverage as a required prop. Separates planned from happened, keeps an entry recorded in error visible and marked, and refuses to collapse anything a reader would act on.",
    "rationale": "A table is read as rows and a chart as a shape, but a timeline is read as an account — and an account is understood to be continuous, so a gap in it becomes a fact. Meanwhile the timeline on screen is nearly always a slice: paginated to five, filtered to one register, assembled from sources that fail independently. Every one of those renders as the same tidy, confident, continuous list. A clinician reads a timeline with no imaging on it and orders a CT; the study was done eleven weeks ago at another hospital and the exchange query timed out four seconds earlier. Nothing was wrong on screen. So coverage is required in the type, with no default, because every plausible default is a claim the caller did not make — and the sentence it produces is rendered in a fixed place and printed. Two consequences follow: planned is not happened, so a future event sits above a now marker and a planned event whose time has passed with nothing against it is lapsed rather than silent; and clinical events are not administrative ones, so registers are typed rather than mixed at one weight.",
    "categories": [
      "Clinical",
      "Data display"
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
        "description": "",
        "required": false,
        "default": "false"
      },
      {
        "name": "defaultRegisters",
        "type": "readonly TimelineRegister[]",
        "description": "",
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
        "description": "",
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
        "description": "",
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
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "onSelect",
        "type": "((event: TimelineEvent) => void)",
        "description": "",
        "required": false
      },
      {
        "name": "ref",
        "type": "React.Ref<HTMLElement>",
        "description": "",
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
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "defaultRegisters",
            "type": "readonly TimelineRegister[]",
            "description": "",
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
            "description": "",
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
            "description": "",
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
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "onSelect",
            "type": "((event: TimelineEvent) => void)",
            "description": "",
            "required": false
          },
          {
            "name": "ref",
            "type": "React.Ref<HTMLElement>",
            "description": "",
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
    "usage": "import { CareTimeline } from \"@/components/oxygen/care-timeline\";\n\n<CareTimeline\n  aria-label=\"Care timeline for Ada Lovelace\"\n  events={events}\n  now={serverTime}\n  coverage={{\n    window: { from: \"2025-07-01\" },\n    order: \"newest-first\",\n    total: 43,\n    hidden: [{ reason: \"access\", count: 2 }],\n    sources: [\n      { id: \"ehr\", label: \"Northside EHR\", status: \"ok\" },\n      {\n        id: \"hie\",\n        label: \"Northside Regional Exchange\",\n        status: \"unavailable\",\n        detail: \"Timed out after 8s.\",\n      },\n    ],\n  }}\n  group=\"auto\"\n  cluster={{ kinds: [\"observation\"], within: \"P3D\", min: 3 }}\n  seenThrough=\"2026-08-12T14:02:00+05:30\"\n  lateEntryAfter=\"P2D\"\n  onLoadOlder={() => fetchOlder()}\n/>",
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
      "result-value"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @oxygenui-design/cli add care-timeline",
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
        "description": "",
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
        "description": "Overrides any inherited `data-ox-density`.",
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
        "description": "",
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
            "description": "",
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
            "description": "Overrides any inherited `data-ox-density`.",
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
            "description": "",
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
    "usage": "import { ChartAccordion } from \"@/components/oxygen/chart-accordion\";\n\n<ChartAccordion\n  toolbarLabel=\"Ada Lovelace · 38 · MRN 4471902\"\n  headingLevel={2}\n  onDisclose={async (event) => audit.record(event)}\n  sections={[\n    {\n      key: \"risk\",\n      label: \"Risk & suicidality\",\n      severity: \"critical\",\n      status: \"C-SSRS positive\",\n      updatedAt: \"2026-08-13T09:12:00+05:30\",\n      children: <RiskPanel {...risk} />,\n    },\n    {\n      key: \"meds\",\n      label: \"Medications\",\n      severity: \"high\",\n      status: \"Clozapine ANC due 18 Aug\",\n      count: \"4 active\",\n      children: <MedicationList {...meds} />,\n    },\n    {\n      key: \"psychotherapy\",\n      label: \"Psychotherapy notes\",\n      access: { kind: \"withheld\", reason: \"Kept separately by the author\" },\n    },\n  ]}\n/>",
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
      "The chip is local to this component until StatusBadge ships. It already uses the --ox-badge-* tokens, so adopting StatusBadge is a refactor rather than a re-design.",
      "The timestamp is rendered verbatim, not localised. Formatting and time-zone rendering belong to @oxygenui-design/intl, and inventing a second formatter here would guarantee they disagree.",
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
    "install": "npx @oxygenui-design/cli add chart-accordion",
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
    "name": "clinical-note",
    "title": "Clinical Note",
    "tier": "free",
    "status": "experimental",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A clinical note editor that records where every character came from, and refuses to let anyone sign what they have not read.",
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
        "description": "",
        "required": true
      },
      {
        "name": "canSign",
        "type": "boolean",
        "description": "",
        "required": true
      },
      {
        "name": "findings",
        "type": "readonly Finding[]",
        "description": "",
        "required": true
      },
      {
        "name": "attestation",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "onCancel",
        "type": "(() => void)",
        "description": "",
        "required": false
      },
      {
        "name": "onNavigate",
        "type": "((finding: Finding) => void)",
        "description": "",
        "required": false
      },
      {
        "name": "onSign",
        "type": "((acknowledged: string[]) => void)",
        "description": "",
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
            "description": "",
            "required": true
          },
          {
            "name": "canSign",
            "type": "boolean",
            "description": "",
            "required": true
          },
          {
            "name": "findings",
            "type": "readonly Finding[]",
            "description": "",
            "required": true
          },
          {
            "name": "attestation",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "onCancel",
            "type": "(() => void)",
            "description": "",
            "required": false
          },
          {
            "name": "onNavigate",
            "type": "((finding: Finding) => void)",
            "description": "",
            "required": false
          },
          {
            "name": "onSign",
            "type": "((acknowledged: string[]) => void)",
            "description": "",
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
            "description": "",
            "required": true
          },
          {
            "name": "subject",
            "type": "NoteSubject",
            "description": "",
            "required": true
          },
          {
            "name": "title",
            "type": "string",
            "description": "",
            "required": true
          },
          {
            "name": "addenda",
            "type": "readonly Addendum[]",
            "description": "",
            "required": false,
            "default": "[]"
          },
          {
            "name": "attestations",
            "type": "readonly Attestation[]",
            "description": "",
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
            "description": "",
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
            "description": "",
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
    "usage": "import { ClinicalNote } from \"@/components/oxygen/clinical-note\";\n\n// The minimum. `now` has no default on purpose — the host owns the clock.\n<ClinicalNote\n  noteType=\"progress\"\n  subject={{\n    reference: \"Patient/4471902\",\n    display: \"RANDOL, Joshua\",\n    identifier: \"4471902\",\n    birthDate: \"12 Mar 1996\",\n    detail: \"30y M · Bed 4E-12\",\n  }}\n  author={{ display: \"R. Menon, MD\", role: \"Resident\", requiresCosign: true }}\n  now={await serverTime()}\n  onCommit={(kind, doc, acknowledgedWarnings) => save(kind, doc, acknowledgedWarnings)}\n/>\n\n// Reading a signed note loads no editor at all.\n<ClinicalNote.Reader\n  subject={subject}\n  title=\"Progress note\"\n  doc={signedDoc}\n  attestations={[{ who: \"R. Menon, MD\", when: \"16 Aug 2026, 14:41 IST (UTC+05:30)\" }]}\n  addenda={[{ author: \"A. Iyer, MD\", when: \"19 Aug 2026, 09:14 IST\", text: \"…\" }]}\n/>",
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
      "Per-range provenance is not standardised anywhere in FHIR. It travels as a custom Oxygen extension that a conforming server may legitimately ignore or strip.",
      "There is no clock. `now` is a required prop, because a browser clock on a ward workstation is not evidence.",
      "No speech recognizer, no collaboration server, no crypto. The component defines the channel, the integration and the seam; the implementations are the deployment's.",
      "The LOINC section codes match published display names but must be confirmed — with their C-CDA cardinality — against the implementation guide a deployment conforms to.",
      "Real-time collaboration, tables, live data islands and ink annotation are designed but not built. See the brief."
    ],
    "related": [
      "copilot",
      "switch",
      "care-timeline",
      "signature"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge",
      "@oxygenui-design/clinical-note-core",
      "prosemirror-view",
      "prosemirror-state",
      "prosemirror-model",
      "prosemirror-keymap",
      "prosemirror-history",
      "prosemirror-commands"
    ],
    "install": "npx @oxygenui-design/cli add clinical-note"
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
    "description": "A chip, a dot, or a grid affix — three presentations of one datum, drawn from nine fixed scales with no free-text status. Each step pairs a tone with a CSS-drawn glyph and a word in both a clinician and a patient register, so the state survives greyscale, Windows high-contrast and monochrome print.",
    "rationale": "Every healthcare product invents its own status colours, six times, in six teams, and the results disagree: amber means pending in the lab module and abnormal in the vitals module, so a clinician who learns one is actively misled by the other. The usual response is a nicer palette, which changes nothing, because the encoding is still colour plus a word in a colour-matched hue — and that collapses in forced-colors, in monochrome print, and for the roughly 8% of male clinicians with a red-green deficiency. The fix is a closed vocabulary. A step exists in it or it cannot be rendered at all, and every step carries three channels chosen together. The shape is not decoration and not an icon: it is a second channel carrying the same bit, drawn in currentColor from CSS geometry so it costs no network request and survives the theme being stripped entirely.",
    "categories": [
      "Clinical",
      "Primitives"
    ],
    "fhir": [
      {
        "name": "Observation",
        "url": "https://hl7.org/fhir/R4/observation.html"
      },
      {
        "name": "AllergyIntolerance",
        "url": "https://hl7.org/fhir/R4/allergyintolerance.html"
      },
      {
        "name": "Consent",
        "url": "https://hl7.org/fhir/R4/consent.html"
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
        "description": "",
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
            "description": "",
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
            "description": "",
            "required": false,
            "default": "\"default\""
          }
        ],
        "extendsType": "React.HTMLAttributes<HTMLDListElement>"
      }
    ],
    "usage": "import { ClinicalStatus } from \"@/components/oxygen/clinical-status\";\nimport \"@/styles/oxygen-clinical-status.css\";\n\n<ClinicalStatus scale=\"criticality\" step=\"critical\" />\n<ClinicalStatus scale=\"access\" step=\"part-2\" />\n<ClinicalStatus scale=\"result-status\" step=\"preliminary\" shape=\"affix\" />",
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
      "No terminology service. The words here are English clinician and patient phrasings; a deployment needing another language supplies them through @oxygenui-design/intl."
    ],
    "related": [
      "chart-accordion",
      "switch",
      "result-value"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @oxygenui-design/cli add clinical-status",
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
        "code": "import { ClinicalStatus, fromInterpretation } from \"@/components/oxygen/clinical-status\";\nimport { observationPotassiumCritical } from \"@oxygenui-design/fixtures\";\n\nconst code = observationPotassiumCritical.interpretation?.[0]?.coding?.[0]?.code;\nconst step = fromInterpretation(code);\n\n// null rather than a guess when the code is unrecognised: a visible gap beats\n// a plausible lie.\n{step && <ClinicalStatus scale=\"criticality\" step={step} qualifier=\"resulted 41 minutes ago\" />}"
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
        "result-value"
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
        "description": "",
        "required": true
      },
      {
        "name": "provider",
        "type": "CopilotProvider",
        "description": "",
        "required": true
      },
      {
        "name": "actor",
        "type": "Actor",
        "description": "",
        "required": false
      },
      {
        "name": "anchor",
        "type": "'inline' | 'bottom-center' | 'bottom-right'",
        "description": "",
        "required": false,
        "default": "\"bottom-center\""
      },
      {
        "name": "announcementMode",
        "type": "AnnouncementMode",
        "description": "",
        "required": false
      },
      {
        "name": "classifiers",
        "type": "SafetyClassifiers",
        "description": "",
        "required": false
      },
      {
        "name": "className",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "context",
        "type": "CopilotContextResolver",
        "description": "",
        "required": false
      },
      {
        "name": "crisisLines",
        "type": "Readonly<Record<string, readonly CrisisLine[]>>",
        "description": "",
        "required": false
      },
      {
        "name": "initialModeId",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "locale",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "newId",
        "type": "(() => string)",
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "onInsert",
        "type": "((text: string) => void)",
        "description": "",
        "required": false
      },
      {
        "name": "onRiskProtocol",
        "type": "(() => void)",
        "description": "",
        "required": false
      },
      {
        "name": "onTelemetry",
        "type": "TelemetrySink",
        "description": "",
        "required": false
      },
      {
        "name": "role",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "shortcuts",
        "type": "readonly CopilotShortcut[]",
        "description": "",
        "required": false,
        "default": "[]"
      },
      {
        "name": "subject",
        "type": "Reference",
        "description": "",
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
            "description": "",
            "required": true
          },
          {
            "name": "provider",
            "type": "CopilotProvider",
            "description": "",
            "required": true
          },
          {
            "name": "actor",
            "type": "Actor",
            "description": "",
            "required": false
          },
          {
            "name": "anchor",
            "type": "'inline' | 'bottom-center' | 'bottom-right'",
            "description": "",
            "required": false,
            "default": "\"bottom-center\""
          },
          {
            "name": "announcementMode",
            "type": "AnnouncementMode",
            "description": "",
            "required": false
          },
          {
            "name": "classifiers",
            "type": "SafetyClassifiers",
            "description": "",
            "required": false
          },
          {
            "name": "className",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "context",
            "type": "CopilotContextResolver",
            "description": "",
            "required": false
          },
          {
            "name": "crisisLines",
            "type": "Readonly<Record<string, readonly CrisisLine[]>>",
            "description": "",
            "required": false
          },
          {
            "name": "initialModeId",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "locale",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "newId",
            "type": "(() => string)",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "onInsert",
            "type": "((text: string) => void)",
            "description": "",
            "required": false
          },
          {
            "name": "onRiskProtocol",
            "type": "(() => void)",
            "description": "",
            "required": false
          },
          {
            "name": "onTelemetry",
            "type": "TelemetrySink",
            "description": "",
            "required": false
          },
          {
            "name": "role",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "shortcuts",
            "type": "readonly CopilotShortcut[]",
            "description": "",
            "required": false,
            "default": "[]"
          },
          {
            "name": "subject",
            "type": "Reference",
            "description": "",
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
            "description": "",
            "required": true
          },
          {
            "name": "at",
            "type": "readonly [number, number]",
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { Copilot } from \"@/components/oxygen/copilot\";\nimport { lookUp, prepare } from \"@oxygenui-design/copilot-core\";\n\n// Safest first deployment: reference lookup, no patient data anywhere.\n<Copilot provider={ourEndpoint} modes={[lookUp]} />\n\n// With the chart, once a resolver is wired.\n<Copilot\n  provider={ourEndpoint}\n  modes={[lookUp, prepare]}\n  subject={{ reference: \"Patient/123\", display: \"Amara Okonkwo\" }}\n  context={resolver}\n  actor={{ display: \"Dr Okafor\", reference: \"Practitioner/7\" }}\n  onAudit={(event) => auditSink.write(event)}\n  // The most valuable prop in the API.\n  suppressed={isAdministeringMedication || isSigningOrders}\n/>",
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
      "Requires @oxygenui-design/copilot-react and @oxygenui-design/copilot-core from npm. The engine is deliberately not inlined — a safety control nobody reads before pasting is not a safety control."
    ],
    "related": [
      "clinical-note"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge",
      "@oxygenui-design/copilot-core",
      "@oxygenui-design/copilot-react"
    ],
    "install": "npx @oxygenui-design/cli add copilot"
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
      "infusion-loader",
      "pulse-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @oxygenui-design/cli add helix-loader"
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
      "breath-loader",
      "helix-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @oxygenui-design/cli add infusion-loader"
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
      "infusion-loader",
      "helix-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @oxygenui-design/cli add pulse-loader",
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
    "name": "result-value",
    "title": "Result Value",
    "tier": "free",
    "status": "stable",
    "since": "0.4.0",
    "layer": "clinical",
    "distribution": "registry",
    "summary": "A single observation rendered so that the four ways a number can lie to you are all impossible.",
    "description": "Value, unit and interpretation on one line, qualifiers on a second only when they exist. Seven distinct absence reasons instead of an em dash, a stated interpretation that always beats a derived one, a reference range that says so when there isn't one, and a correction that shows the superseded value rather than a badge.",
    "rationale": "The most dangerous component in healthcare software is the one that renders a number, because every one of its failures looks perfect on screen. A preliminary result rendered identically to a final one: the clinician acts, and the value changes at 04:00. A result with no reference range rendered as though it were normal, because nothing was highlighted. A corrected result that silently replaced the value somebody read an hour ago and wrote into a note. An absent value rendered as an em dash, indistinguishable from a rendering bug, a cancelled test, a haemolysed specimen and a patient who declined the draw. None of the four is a styling problem and none is fixed by a nicer table. Each needs a shape: status is never implicit, an absent range is stated rather than left blank, a correction carries the old number with a line through it because the hazard is the reader's memory of it, and absence is seven sentences.",
    "categories": [
      "Clinical",
      "Data Display"
    ],
    "fhir": [
      {
        "name": "Observation",
        "url": "https://hl7.org/fhir/R4/observation.html"
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
        "description": "",
        "required": true
      },
      {
        "name": "density",
        "type": "'default' | 'compact'",
        "description": "",
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
            "description": "",
            "required": true
          },
          {
            "name": "density",
            "type": "'default' | 'compact'",
            "description": "",
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
    "usage": "import { ResultValue, fromFHIR } from \"@/components/oxygen/result-value\";\nimport \"@/styles/oxygen-result-value.css\";\n\n<ResultValue value={fromFHIR(observation)} now={serverTime} />",
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
      "care-timeline"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @oxygenui-design/cli add result-value",
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
        "code": "import { ResultValue, fromFHIR } from \"@/components/oxygen/result-value\";\nimport { observationPotassiumCritical } from \"@oxygenui-design/fixtures\";\n\n// `now` is the host's, never a clock this component reads: a relative time\n// computed at render silently ages on a ward workstation left open all shift.\n<ResultValue value={fromFHIR(observationPotassiumCritical)} now={serverTime} />;"
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
      "infusion-loader",
      "helix-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @oxygenui-design/cli add rhythm-loader",
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
    "name": "safety-plan",
    "title": "Safety Plan",
    "tier": "free",
    "status": "beta",
    "since": "0.3.0",
    "layer": "block",
    "distribution": "registry",
    "summary": "The six steps of the Stanley-Brown Safety Planning Intervention, in order, with the crisis step rendered open and uncloseable.",
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
        "description": "",
        "required": true
      },
      {
        "name": "density",
        "type": "AccordionDensity",
        "description": "",
        "required": false,
        "default": "\"patient\""
      },
      {
        "name": "headingLevel",
        "type": "AccordionHeadingLevel",
        "description": "",
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
            "description": "",
            "required": true
          },
          {
            "name": "density",
            "type": "AccordionDensity",
            "description": "",
            "required": false,
            "default": "\"patient\""
          },
          {
            "name": "headingLevel",
            "type": "AccordionHeadingLevel",
            "description": "",
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
    "usage": "import { SafetyPlan } from \"@/components/oxygen/safety-plan\";\n\n<SafetyPlan\n  revisedAt=\"2026-08-11\"\n  headingLevel={2}\n  steps={{\n    warningSigns: { entries: [\"Sleeping less than four hours\", \"Not answering messages for two days\"] },\n    internalCoping: { entries: [\"Walk to the end of the road and back\", \"Four in, six out, ten times\"] },\n    distractions: { entries: [\"The cafe on Bell Street before 11am\"] },\n    supportContacts: { contacts: [{ name: \"Priya\", detail: \"Sister\", availability: \"Any time\" }] },\n    professionals: {\n      contacts: [\n        { name: \"988\", detail: \"Suicide & Crisis Lifeline\", availability: \"24 hours\" },\n        { name: \"County crisis team\", detail: \"555 0148\", availability: \"24 hours\" },\n      ],\n    },\n    environment: { entries: [\"Priya is holding the spare keys to the garage\"] },\n  }}\n/>",
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
    "install": "npx @oxygenui-design/cli add safety-plan",
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
        "description": "Why the value is `\"unknown\"`. Structurally the output of `resolveAbsentReason()` in `@oxygenui-design/fhir`.",
        "required": false
      },
      {
        "name": "appearance",
        "type": "SwitchAppearance",
        "description": "",
        "required": false
      },
      {
        "name": "audience",
        "type": "SwitchAudience",
        "description": "",
        "required": false,
        "default": "\"clinician\""
      },
      {
        "name": "autoFocus",
        "type": "boolean",
        "description": "",
        "required": false
      },
      {
        "name": "checked",
        "type": "SwitchValue",
        "description": "`\"unknown\"` is Oxygen's widening. antd's `boolean` shape is unchanged.",
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
        "type": "false | 'countersign' | 'hold' | 'dialog' | 'attest'",
        "description": "",
        "required": false,
        "default": "false"
      },
      {
        "name": "confirmCopy",
        "type": "{ title?: string; consequence: string; subject?: string; }",
        "description": "",
        "required": false
      },
      {
        "name": "countersign",
        "type": "CountersignRequirement",
        "description": "",
        "required": false
      },
      {
        "name": "defaultChecked",
        "type": "SwitchValue",
        "description": "",
        "required": false,
        "default": "false"
      },
      {
        "name": "description",
        "type": "React.ReactNode",
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "labelPlacement",
        "type": "'start' | 'end'",
        "description": "",
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
        "description": "",
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
        "description": "",
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
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "onSlow",
        "type": "(() => void)",
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "readOnly",
        "type": "boolean",
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "slots",
        "type": "SwitchSlots",
        "description": "",
        "required": false
      },
      {
        "name": "slowAfter",
        "type": "number",
        "description": "",
        "required": false
      },
      {
        "name": "stateLabels",
        "type": "'on-off' | 'yes-no' | 'active-inactive' | 'in-effect' | 'allowed-blocked' | 'given-declined' | 'enabled-disabled' | Partial<StateLabels>",
        "description": "",
        "required": false
      },
      {
        "name": "tone",
        "type": "SwitchTone",
        "description": "",
        "required": false,
        "default": "\"affirmative\""
      },
      {
        "name": "unCheckedChildren",
        "type": "React.ReactNode",
        "description": "",
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
            "description": "Why the value is `\"unknown\"`. Structurally the output of `resolveAbsentReason()` in `@oxygenui-design/fhir`.",
            "required": false
          },
          {
            "name": "appearance",
            "type": "SwitchAppearance",
            "description": "",
            "required": false
          },
          {
            "name": "audience",
            "type": "SwitchAudience",
            "description": "",
            "required": false,
            "default": "\"clinician\""
          },
          {
            "name": "autoFocus",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "checked",
            "type": "SwitchValue",
            "description": "`\"unknown\"` is Oxygen's widening. antd's `boolean` shape is unchanged.",
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
            "type": "false | 'countersign' | 'hold' | 'dialog' | 'attest'",
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "confirmCopy",
            "type": "{ title?: string; consequence: string; subject?: string; }",
            "description": "",
            "required": false
          },
          {
            "name": "countersign",
            "type": "CountersignRequirement",
            "description": "",
            "required": false
          },
          {
            "name": "defaultChecked",
            "type": "SwitchValue",
            "description": "",
            "required": false,
            "default": "false"
          },
          {
            "name": "description",
            "type": "React.ReactNode",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "labelPlacement",
            "type": "'start' | 'end'",
            "description": "",
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
            "description": "",
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
            "description": "",
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
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void)",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "readOnly",
            "type": "boolean",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "slots",
            "type": "SwitchSlots",
            "description": "",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number",
            "description": "",
            "required": false
          },
          {
            "name": "stateLabels",
            "type": "'on-off' | 'yes-no' | 'active-inactive' | 'in-effect' | 'allowed-blocked' | 'given-declined' | 'enabled-disabled' | Partial<StateLabels>",
            "description": "",
            "required": false
          },
          {
            "name": "tone",
            "type": "SwitchTone",
            "description": "",
            "required": false,
            "default": "\"affirmative\""
          },
          {
            "name": "unCheckedChildren",
            "type": "React.ReactNode",
            "description": "",
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
            "description": "Why the value is `\"unknown\"`. Structurally the output of `resolveAbsentReason()` in `@oxygenui-design/fhir`.",
            "required": false
          },
          {
            "name": "appearance",
            "type": "SwitchAppearance",
            "description": "",
            "required": false
          },
          {
            "name": "audience",
            "type": "SwitchAudience",
            "description": "",
            "required": false
          },
          {
            "name": "autoFocus",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "checked",
            "type": "SwitchValue",
            "description": "`\"unknown\"` is Oxygen's widening. antd's `boolean` shape is unchanged.",
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
            "type": "false | 'countersign' | 'hold' | 'dialog' | 'attest'",
            "description": "",
            "required": false
          },
          {
            "name": "confirmCopy",
            "type": "{ title?: string; consequence: string; subject?: string; }",
            "description": "",
            "required": false
          },
          {
            "name": "countersign",
            "type": "CountersignRequirement",
            "description": "",
            "required": false
          },
          {
            "name": "defaultChecked",
            "type": "SwitchValue",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "labelPlacement",
            "type": "'start' | 'end'",
            "description": "",
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
            "description": "",
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
            "description": "",
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
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "onSlow",
            "type": "(() => void)",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "slots",
            "type": "SwitchSlots",
            "description": "",
            "required": false
          },
          {
            "name": "slowAfter",
            "type": "number",
            "description": "",
            "required": false
          },
          {
            "name": "stateLabels",
            "type": "'on-off' | 'yes-no' | 'active-inactive' | 'in-effect' | 'allowed-blocked' | 'given-declined' | 'enabled-disabled' | Partial<StateLabels>",
            "description": "",
            "required": false
          },
          {
            "name": "tone",
            "type": "SwitchTone",
            "description": "",
            "required": false
          },
          {
            "name": "unCheckedChildren",
            "type": "React.ReactNode",
            "description": "",
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
            "description": "",
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
            "description": "",
            "required": false
          }
        ],
        "extendsType": "Omit<React.HTMLAttributes<HTMLDivElement>, \"title\">"
      }
    ],
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
    "related": [
      "clinical-note",
      "tabs",
      "clinical-status"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "npx @oxygenui-design/cli add switch"
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
    "description": "An ordered list with a rail. The API matches Ant Design v6 exactly, including the v5 names it still accepts, and takes no dependency on it. Adds a required accessible name and drops the current-step behaviour a chronology has no use for.",
    "rationale": "antd's Timeline is a thin adapter over Steps, and it inherits two things a chronology should not have. It hardcodes current to the last item, which marks that item process — and antd's own stylesheet gives that state a dotted rail. On a wizard that reads as 'the step you are on, and it continues'. On a history it is a mark of incompleteness applied to whichever event happened to be last, and because reverse reverses the array first, on a newest-first clinical timeline it lands on the oldest event in the chart. It also inherits rc-steps' accessibility, which is none: no role, no aria-current, no way to name the list, so a page with a care timeline and an access-history timeline gives a screen-reader user two unnamed lists. Matching the API rather than wrapping it means an existing antd call site migrates by changing one import, and no consumer of a primitive inherits antd.",
    "categories": [
      "Data display",
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
        "description": "",
        "required": false
      },
      {
        "name": "classNames",
        "type": "Partial<Record<TimelineSlot, string>>",
        "description": "",
        "required": false
      },
      {
        "name": "items",
        "type": "readonly TimelineItemType[]",
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "pending",
        "type": "React.ReactNode",
        "description": "",
        "required": false
      },
      {
        "name": "pendingDot",
        "type": "React.ReactNode",
        "description": "",
        "required": false
      },
      {
        "name": "prefixCls",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "ref",
        "type": "React.Ref<HTMLOListElement>",
        "description": "",
        "required": false
      },
      {
        "name": "reverse",
        "type": "boolean",
        "description": "",
        "required": false
      },
      {
        "name": "rootClassName",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "style",
        "type": "React.CSSProperties",
        "description": "",
        "required": false
      },
      {
        "name": "styles",
        "type": "Partial<Record<TimelineSlot, React.CSSProperties>>",
        "description": "",
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
        "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "classNames",
            "type": "Partial<Record<TimelineSlot, string>>",
            "description": "",
            "required": false
          },
          {
            "name": "items",
            "type": "readonly TimelineItemType[]",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "pending",
            "type": "React.ReactNode",
            "description": "",
            "required": false
          },
          {
            "name": "pendingDot",
            "type": "React.ReactNode",
            "description": "",
            "required": false
          },
          {
            "name": "prefixCls",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "ref",
            "type": "React.Ref<HTMLOListElement>",
            "description": "",
            "required": false
          },
          {
            "name": "reverse",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "rootClassName",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "style",
            "type": "React.CSSProperties",
            "description": "",
            "required": false
          },
          {
            "name": "styles",
            "type": "Partial<Record<TimelineSlot, React.CSSProperties>>",
            "description": "",
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
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { Timeline } from \"@/components/oxygen/timeline\";\n\n<Timeline\n  aria-label=\"Release history\"\n  mode=\"start\"\n  items={[\n    { key: \"1\", title: \"0.3.0\", content: \"Switch, Tabs, ChartAccordion.\" },\n    { key: \"2\", title: \"0.2.0\", content: \"Signature and Identity.\" },\n    { key: \"3\", title: \"0.1.0\", content: \"Five loaders.\" },\n  ]}\n/>",
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
      "titleSpan sets --ox-timeline-title-span rather than reproducing antd's internal head-span calculation. The rendered geometry is close, not identical.",
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
    "install": "npx @oxygenui-design/cli add timeline",
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
    "name": "identity",
    "title": "Patient identity",
    "tier": "free",
    "status": "beta",
    "since": "0.1.0",
    "layer": "clinical",
    "distribution": "package",
    "packageName": "@oxygenui-design/identity",
    "frameworks": {
      "antd": {
        "policy": "neutral",
        "bridge": false,
        "divergences": []
      }
    },
    "summary": "An avatar, a chip and a patient banner — with the pass that keeps two patients who share a name apart on the same worklist.",
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
        "description": "",
        "required": false
      },
      {
        "name": "error",
        "type": "OperationOutcome | Error",
        "description": "",
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
        "type": "readonly IdentifierSpec[] | TwoOrMore<IdentifierSpec>",
        "description": "",
        "required": false
      },
      {
        "name": "identityKey",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "loading",
        "type": "true",
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "ward",
        "type": "string",
        "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "error",
            "type": "OperationOutcome | Error",
            "description": "",
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
            "type": "readonly IdentifierSpec[] | TwoOrMore<IdentifierSpec>",
            "description": "",
            "required": false
          },
          {
            "name": "identityKey",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "loading",
            "type": "true",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "ward",
            "type": "string",
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import {\n  IdentityProvider,\n  PatientBanner,\n  PatientGuard,\n} from \"@oxygenui-design/identity\";\nimport \"@oxygenui-design/identity/styles.css\";\n\n<IdentityProvider disclosure=\"clinical\" photos=\"allow\" onSensitiveReveal={audit.write}>\n  {/* context=\"action\" takes a two-or-more tuple: NPSG.01.01.01 as a compile error. */}\n  <PatientBanner\n    patient={patient}\n    context=\"action\"\n    identifiers={[{ kind: \"mrn\" }, { kind: \"nhs\" }]}\n  >\n    {/* Refuses to render if the chart on screen is not the one this was opened for. */}\n    <PatientGuard expect={openedFor.id} expectName={openedFor.name}>\n      <OrderForm />\n    </PatientGuard>\n  </PatientBanner>\n</IdentityProvider>;",
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
      "signature"
    ],
    "dependencies": [
      "@oxygenui-design/identity-core"
    ],
    "install": "npx @oxygenui-design/cli add identity"
  },
  {
    "name": "signature",
    "title": "Signature",
    "tier": "free",
    "status": "stable",
    "since": "0.1.0",
    "layer": "clinical",
    "distribution": "package",
    "packageName": "@oxygenui-design/signature",
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
        "description": "",
        "required": false
      },
      {
        "name": "capacities",
        "type": "Capacity[]",
        "description": "",
        "required": false
      },
      {
        "name": "captureBiometrics",
        "type": "boolean",
        "description": "",
        "required": false
      },
      {
        "name": "className",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "defaultValue",
        "type": "SignatureValue",
        "description": "",
        "required": false
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "",
        "required": false
      },
      {
        "name": "documentHash",
        "type": "string",
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "meaning",
        "type": "SignatureMeaning",
        "description": "",
        "required": false
      },
      {
        "name": "methods",
        "type": "CaptureMethod[]",
        "description": "Which capture methods to offer. Omitting `\"type\"` produces a component that fails WCAG 2.1.1 at Level A: drawing is a path-dependent input technique, and without the typed path this control is not operable without a pointer. It is permitted because a host may have a genuinely equivalent alternative elsewhere on the page, but it is never the default — and `@oxygenui/signature-requires-typed-path` makes it a lint error rather than a runtime app message, because a component has no business writing to a customer's app.",
        "required": false,
        "default": "[\"draw\", \"type\", \"upload\"]"
      },
      {
        "name": "onAuditEvent",
        "type": "((event: { type: string; at: string; detail?: string; }) => void)",
        "description": "",
        "required": false
      },
      {
        "name": "onChange",
        "type": "((value: SignatureValue) => void)",
        "description": "",
        "required": false
      },
      {
        "name": "outcomes",
        "type": "('declined' | 'unable' | 'verbal' | 'on-paper')[]",
        "description": "",
        "required": false
      },
      {
        "name": "recordedBy",
        "type": "Signer",
        "description": "",
        "required": false
      },
      {
        "name": "signer",
        "type": "Partial<Signer>",
        "description": "",
        "required": false
      },
      {
        "name": "status",
        "type": "'error' | 'warning'",
        "description": "",
        "required": false
      },
      {
        "name": "subject",
        "type": "Subject",
        "description": "",
        "required": false
      },
      {
        "name": "subtitle",
        "type": "React.ReactNode",
        "description": "",
        "required": false
      },
      {
        "name": "title",
        "type": "React.ReactNode",
        "description": "",
        "required": false
      },
      {
        "name": "value",
        "type": "SignatureValue",
        "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "capacities",
            "type": "Capacity[]",
            "description": "",
            "required": false
          },
          {
            "name": "captureBiometrics",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "className",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "SignatureValue",
            "description": "",
            "required": false
          },
          {
            "name": "disabled",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "documentHash",
            "type": "string",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "meaning",
            "type": "SignatureMeaning",
            "description": "",
            "required": false
          },
          {
            "name": "methods",
            "type": "CaptureMethod[]",
            "description": "Which capture methods to offer. Omitting `\"type\"` produces a component that fails WCAG 2.1.1 at Level A: drawing is a path-dependent input technique, and without the typed path this control is not operable without a pointer. It is permitted because a host may have a genuinely equivalent alternative elsewhere on the page, but it is never the default — and `@oxygenui/signature-requires-typed-path` makes it a lint error rather than a runtime app message, because a component has no business writing to a customer's app.",
            "required": false,
            "default": "[\"draw\", \"type\", \"upload\"]"
          },
          {
            "name": "onAuditEvent",
            "type": "((event: { type: string; at: string; detail?: string; }) => void)",
            "description": "",
            "required": false
          },
          {
            "name": "onChange",
            "type": "((value: SignatureValue) => void)",
            "description": "",
            "required": false
          },
          {
            "name": "outcomes",
            "type": "('declined' | 'unable' | 'verbal' | 'on-paper')[]",
            "description": "",
            "required": false
          },
          {
            "name": "recordedBy",
            "type": "Signer",
            "description": "",
            "required": false
          },
          {
            "name": "signer",
            "type": "Partial<Signer>",
            "description": "",
            "required": false
          },
          {
            "name": "status",
            "type": "'error' | 'warning'",
            "description": "",
            "required": false
          },
          {
            "name": "subject",
            "type": "Subject",
            "description": "",
            "required": false
          },
          {
            "name": "subtitle",
            "type": "React.ReactNode",
            "description": "",
            "required": false
          },
          {
            "name": "title",
            "type": "React.ReactNode",
            "description": "",
            "required": false
          },
          {
            "name": "value",
            "type": "SignatureValue",
            "description": "",
            "required": false
          }
        ]
      }
    ],
    "usage": "import { Form } from \"antd\";\nimport { Signature, signatureRequired } from \"@oxygenui-design/signature\";\nimport \"@oxygenui-design/signature/styles.css\";\n\n// signatureRequired() accepts a decline as an answer. A rule demanding\n// outcome === \"signed\" would make refusal impossible to submit.\n<Form.Item name=\"consent\" label=\"Patient signature\" rules={[signatureRequired()]}>\n  <Signature\n    now={serverTime}\n    meaning=\"consent\"\n    attestation=\"I have read the information about this procedure, I have had the chance to ask questions, and I agree to go ahead.\"\n    subject={{ display: \"Randall, Josh\", reference: \"Patient/4471902\" }}\n    recordedBy={{ name: \"A. Okafor\", credential: \"RN\" }}\n    outcomes={[\"declined\", \"unable\", \"verbal\", \"on-paper\"]}\n  />\n</Form.Item>;",
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
      "Ant Design is a peer dependency. This is the only Oxygen component that is not distributed as copy-as-source, because copying antd's Modal and Form into a consumer's repository would be a fork rather than a component.",
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
      "@oxygenui-design/signature-core"
    ],
    "install": "npx @oxygenui-design/cli add signature",
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
        "code": "import { Form } from \"antd\";\nimport { Signature, signatureRequired } from \"@oxygenui-design/signature\";\nimport \"@oxygenui-design/signature/styles.css\";\n\n<Form.Item name=\"consent\" rules={[signatureRequired()]}>\n  <Signature\n    now={serverTime}\n    meaning=\"consent\"\n    attestation=\"I agree to the treatment described above.\"\n  />\n</Form.Item>;"
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
        "code": "import { toFhirBundle } from \"@oxygenui-design/signature\";\nimport { patientRoutine } from \"@oxygenui-design/fixtures\";\n\n// A transaction Bundle: the Consent and the Provenance that signs it, posted\n// together or not at all. Emitting the Consent alone would store an agreement\n// with nothing proving anyone made it.\nconst bundle = toFhirBundle(value, {\n  release: \"R4\",\n  subject: {\n    display: \"Amara Okonkwo\",\n    reference: `Patient/${patientRoutine.id}`,\n  },\n});\n\n// bundle.entry[0] → POST Consent\n// bundle.entry[1] → POST Provenance, carrying Provenance.signature\n\n// The signer travels on the value, not in these options: who signed is part of\n// what was captured, and re-supplying it here would let the two disagree."
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
    "packageName": "@oxygenui-design/tabs",
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
        "description": "",
        "required": true
      },
      {
        "name": "activation",
        "type": "Activation",
        "description": "",
        "required": false
      },
      {
        "name": "defaultValue",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "editable",
        "type": "TabsEditable",
        "description": "",
        "required": false
      },
      {
        "name": "fill",
        "type": "FillMode",
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "keepScroll",
        "type": "boolean",
        "description": "",
        "required": false
      },
      {
        "name": "listClassName",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "locale",
        "type": "Partial<TabsLocale>",
        "description": "",
        "required": false
      },
      {
        "name": "mount",
        "type": "MountStrategy",
        "description": "",
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
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "orientation",
        "type": "Orientation",
        "description": "",
        "required": false
      },
      {
        "name": "overflow",
        "type": "OverflowStrategy",
        "description": "",
        "required": false
      },
      {
        "name": "panelsClassName",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "size",
        "type": "TabSize",
        "description": "",
        "required": false
      },
      {
        "name": "syncHistory",
        "type": "'replace' | 'push'",
        "description": "",
        "required": false
      },
      {
        "name": "syncKey",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "syncTo",
        "type": "SyncTarget",
        "description": "",
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
        "description": "",
        "required": false
      },
      {
        "name": "value",
        "type": "string",
        "description": "",
        "required": false
      },
      {
        "name": "variant",
        "type": "TabVariant",
        "description": "",
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
            "description": "",
            "required": true
          },
          {
            "name": "activation",
            "type": "Activation",
            "description": "",
            "required": false
          },
          {
            "name": "defaultValue",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "editable",
            "type": "TabsEditable",
            "description": "",
            "required": false
          },
          {
            "name": "fill",
            "type": "FillMode",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "keepScroll",
            "type": "boolean",
            "description": "",
            "required": false
          },
          {
            "name": "listClassName",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "locale",
            "type": "Partial<TabsLocale>",
            "description": "",
            "required": false
          },
          {
            "name": "mount",
            "type": "MountStrategy",
            "description": "",
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
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "orientation",
            "type": "Orientation",
            "description": "",
            "required": false
          },
          {
            "name": "overflow",
            "type": "OverflowStrategy",
            "description": "",
            "required": false
          },
          {
            "name": "panelsClassName",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "size",
            "type": "TabSize",
            "description": "",
            "required": false
          },
          {
            "name": "syncHistory",
            "type": "'replace' | 'push'",
            "description": "",
            "required": false
          },
          {
            "name": "syncKey",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "syncTo",
            "type": "SyncTarget",
            "description": "",
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
            "description": "",
            "required": false
          },
          {
            "name": "value",
            "type": "string",
            "description": "",
            "required": false
          },
          {
            "name": "variant",
            "type": "TabVariant",
            "description": "",
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
    "usage": "import { Tabs } from \"@oxygenui-design/tabs\";\nimport \"@oxygenui-design/tabs/styles.css\";\n\n// `as` is required and has no default: it selects the accessibility tree.\n// `variant` is orthogonal and changes no ARIA at all.\n<Tabs\n  as=\"tabs\"\n  variant=\"segmented\"\n  aria-label=\"Chart sections\"\n  defaultValue=\"summary\"\n  items={[\n    { value: \"summary\", label: \"Summary\", children: <Summary /> },\n    // The tone reaches the accessible name as a word: \"Labs, 2 critical\".\n    { value: \"labs\", label: \"Labs\", count: 2, tone: \"critical\", children: <Labs /> },\n    {\n      value: \"bh\",\n      label: \"Behavioural health\",\n      disabled: true,\n      disabledReason: \"Restricted — opening records an access event\",\n    },\n  ]}\n/>;",
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
        "detail": "`as` selects the accessibility tree: tablist of buttons, a real nav of anchors, a radiogroup, or a gated tablist. It has no default, `@oxygenui/tabs-semantic-mode` makes omitting it a lint error, and passing an href under as=\"tabs\" throws. A tablist of links passes every automated checker and then destroys focus on the first arrow key."
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
      "@oxygenui-design/tabs-core"
    ],
    "install": "npx @oxygenui-design/cli add tabs",
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
        "code": "import { Tabs } from \"@oxygenui-design/tabs\";\nimport { allergyList, medicationList, observationPanel } from \"@oxygenui-design/fixtures\";\nimport \"@oxygenui-design/tabs/styles.css\";\n\nconst critical = observationPanel.filter(isCritical);\n\n<Tabs\n  as=\"tabs\"\n  aria-label=\"Chart sections\"\n  defaultValue=\"summary\"\n  items={[\n    { value: \"summary\", label: \"Summary\", children: <Summary /> },\n    {\n      value: \"labs\",\n      label: \"Labs\",\n      // Counted from the data, never typed in. A tone is a claim about the\n      // patient, so it has to come from the same place the panel does.\n      count: critical.length,\n      tone: critical.length ? \"critical\" : \"neutral\",\n      children: <Labs observations={observationPanel} />,\n    },\n    { value: \"meds\", label: \"Medications\", count: medicationList.length, children: <Meds /> },\n    { value: \"allergies\", label: \"Allergies\", count: allergyList.length, children: <Allergies /> },\n  ]}\n/>;"
      },
      {
        "id": "restricted-section",
        "title": "A section that is restricted, not absent",
        "description": "A disabled tab requires a reason. Omitting the section entirely would tell the clinician it does not exist; greying it silently tells them nothing.",
        "fixture": "patientRestricted",
        "code": "import { patientRestricted } from \"@oxygenui-design/fixtures\";\n\n<Tabs\n  as=\"tabs\"\n  aria-label=\"Chart sections\"\n  defaultValue=\"summary\"\n  items={[\n    { value: \"summary\", label: \"Summary\", children: <Summary /> },\n    {\n      value: \"bh\",\n      label: \"Behavioural health\",\n      disabled: true,\n      // Mandatory. aria-disabled, never the disabled attribute — a keyboard\n      // user has to be able to reach it to find out why they cannot open it.\n      disabledReason:\n        \"Restricted. Opening it records an access event and notifies the record owner.\",\n    },\n  ]}\n/>;"
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
