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
      "safety-plan"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/accordion.json"
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
      "infusion-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/breath-loader.json"
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
      "safety-plan"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/chart-accordion.json"
  },
  {
    "name": "consult",
    "title": "Consult",
    "tier": "free",
    "status": "experimental",
    "since": "0.3.0",
    "layer": "pattern",
    "distribution": "registry",
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
        "type": "readonly ConsultMode[]",
        "description": "",
        "required": true
      },
      {
        "name": "provider",
        "type": "ConsultProvider",
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
        "type": "ConsultContextResolver",
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
        "type": "readonly ConsultShortcut[]",
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
    "extendsType": "UseConsultOptions",
    "exports": [
      {
        "name": "Consult",
        "props": [
          {
            "name": "modes",
            "type": "readonly ConsultMode[]",
            "description": "",
            "required": true
          },
          {
            "name": "provider",
            "type": "ConsultProvider",
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
            "type": "ConsultContextResolver",
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
            "type": "readonly ConsultShortcut[]",
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
        "extendsType": "UseConsultOptions"
      }
    ],
    "usage": "import { Consult } from \"@/components/oxygen/consult\";\nimport { lookUp, prepare } from \"@oxygenui-design/consult-core\";\n\n// Safest first deployment: reference lookup, no patient data anywhere.\n<Consult provider={ourEndpoint} modes={[lookUp]} />\n\n// With the chart, once a resolver is wired.\n<Consult\n  provider={ourEndpoint}\n  modes={[lookUp, prepare]}\n  subject={{ reference: \"Patient/123\", display: \"Amara Okonkwo\" }}\n  context={resolver}\n  actor={{ display: \"Dr Okafor\", reference: \"Practitioner/7\" }}\n  onAudit={(event) => auditSink.write(event)}\n  // The most valuable prop in the API.\n  suppressed={isAdministeringMedication || isSigningOrders}\n/>",
    "guidance": {
      "use": [
        "Clinician-facing reference lookup, where no patient data reaches the model at all. This is the safest first deployment and needs no BAA covering PHI in the model call.",
        "Record summarisation before an encounter, once a context resolver is wired and the scope strip can show what was read and what was withheld.",
        "Behavioral health measurement-based care — instrument trends restated from what was documented, which generates no clinical recommendation."
      ],
      "avoid": [
        "Patient-facing surfaces. Consult throws rather than rendering: Illinois, Nevada and Utah each regulate AI in mental health differently and Nevada prohibits it outright. A patient-facing product is a separate product with a separate regulatory footing.",
        "Any moment the clinician is mid-procedure — administering medication, signing orders, in a documented timeout. Pass `suppressed` and the component removes itself entirely.",
        "Autonomous action. Consult proposes; a human commits, and provenance attributes the act to the human. There is no configuration that changes this.",
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
      "Consult cannot secure a backend. It guarantees the shape of what it sends and the provenance of what it renders; it cannot stop a host wiring an agent with standing EHR write access behind it.",
      "Requires @oxygenui-design/consult-react and @oxygenui-design/consult-core from npm. The engine is deliberately not inlined — a safety control nobody reads before pasting is not a safety control."
    ],
    "related": [],
    "dependencies": [
      "clsx",
      "tailwind-merge",
      "@oxygenui-design/consult-core",
      "@oxygenui-design/consult-react"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/consult.json"
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
      "infusion-loader"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/rhythm-loader.json"
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
      "chart-accordion"
    ],
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/safety-plan.json"
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
        "description": "Which capture methods to offer. Omitting `\"type\"` produces a component that fails WCAG 2.1.1 at Level A: drawing is a path-dependent input technique, and without the typed path this control is not operable without a pointer. It is permitted because a host may have a genuinely equivalent alternative elsewhere on the page, but it is never the default — and `@oxygenui/signature-requires-typed-path` makes it a lint error rather than a runtime console message, because a component has no business writing to a customer's console.",
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
            "description": "Which capture methods to offer. Omitting `\"type\"` produces a component that fails WCAG 2.1.1 at Level A: drawing is a path-dependent input technique, and without the typed path this control is not operable without a pointer. It is permitted because a host may have a genuinely equivalent alternative elsewhere on the page, but it is never the default — and `@oxygenui/signature-requires-typed-path` makes it a lint error rather than a runtime console message, because a component has no business writing to a customer's console.",
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
  },
  {
    "name": "tabs",
    "title": "Tabs",
    "tier": "free",
    "status": "beta",
    "since": "0.1.0",
    "layer": "primitive",
    "distribution": "package",
    "packageName": "@oxygenui-design/tabs",
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
    "related": [],
    "dependencies": [
      "@oxygenui-design/tabs-core"
    ],
    "install": "pnpm dlx shadcn@latest add https://oxygenui.design/r/tabs.json"
  }
];

export const BY_NAME: ReadonlyMap<string, ComponentDoc> = new Map(
  CATALOG.map((component) => [component.name, component]),
);

export const ALL_CATEGORIES: readonly string[] = [
  ...new Set(CATALOG.flatMap((component) => component.categories)),
].sort();
