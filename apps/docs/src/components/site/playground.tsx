"use client";

/**
 * The playground, driven by metadata rather than written per component.
 *
 * `controls` in a component's metadata already says which props are knobbable
 * and with what widget, and the generator now checks every option against the
 * prop's actual type — so a knob cannot offer a value the component would
 * reject. This renders that declaration instead of restating it: a hand-built
 * panel per component is the thing that drifts the moment a prop is renamed,
 * and the drift is invisible because a knob that sets an unknown prop simply
 * does nothing.
 *
 * A component appears here once it has a renderer below. The declaration is
 * not enough on its own — something has to know what a sensible set of items
 * or a sensible value looks like, and that is real editorial work rather than
 * something derivable from a type.
 */

import * as React from "react";
import type { Control } from "@zoblocks/component-meta";
import { allergyList, medicationList, observationPanel } from "@zoblocks/fixtures";
import { Tabs, type TabsItemProps, type TabsProps } from "@zoblocks/tabs";
import { ConfigProvider, Form, theme } from "antd";
import { Signature, signatureRequired, type SignatureProps } from "@zoblocks/signature";
import { HostChrome } from "./host-chrome";
import { PLAYGROUND_COMPONENTS, playgroundChrome } from "./playground-registry";
import { useSiteTheme } from "./use-site-theme";
import { useAntdBrandTokens } from "./language-antd-theme";
import { jsxAttr, jsxElement } from "@/lib/highlight";
import { CodeLines, CopyButton, PlatformLinks } from "./docs/code-block";
import type { DemoLink } from "./docs/sandbox";

type Props = Record<string, unknown>;

/* ------------------------------------------------------------------ */
/* Renderers                                                           */
/* ------------------------------------------------------------------ */

function Filler({ children }: { children: React.ReactNode }) {
  return <p className="px-1 py-4 text-sm text-graphite">{children} panel.</p>;
}

/**
 * The chart, in the shape each semantic mode requires.
 *
 * `as` is not a skin — it is which accessibility tree the strip builds, and
 * the four trees need four different item shapes. A view switch owns panels; a
 * nav is a list of real anchors and the router owns the content; a radiogroup
 * produces a value and owns nothing; steps own panels and carry a lifecycle.
 * Tabs refuses to build an incoherent one and says why, which is the whole
 * design — so the playground has to change the items with the mode rather than
 * hand the same four objects to all four.
 */
function chartFor(mode: string, fixture: string): TabsItemProps[] {
  const restricted = fixture === "patientRestricted";

  const sections = restricted
    ? [
        { value: "summary", label: "Summary" },
        {
          value: "bh",
          label: "Behavioural health",
          disabled: true,
          disabledReason:
            "Restricted under 42 CFR Part 2. Opening it records an access event and notifies the record owner.",
        },
        { value: "meds", label: "Medications", count: medicationList.length },
      ]
    : [
        { value: "summary", label: "Summary" },
        {
          value: "labs",
          label: "Labs",
          count: observationPanel.length,
          tone: "critical" as const,
        },
        { value: "meds", label: "Medications", count: medicationList.length },
        {
          value: "allergies",
          label: "Allergies",
          count: allergyList.length,
          tone: "high" as const,
        },
      ];

  if (mode === "nav") {
    // Real anchors. An anchor with no href is not focusable or clickable, so
    // every item gets one and none get a panel.
    return sections.map((section) => ({ ...section, href: `#${section.value}` }));
  }

  if (mode === "radiogroup") {
    // A value, not a view. Panels here would render with no tab to label them.
    return sections.map((section) => ({ ...section, count: undefined, tone: undefined }));
  }

  if (mode === "steps") {
    const states = ["done", "current", "locked"] as const;
    return sections.map((section, index) => ({
      ...section,
      state: states[Math.min(index, states.length - 1)]!,
      children: <Filler>{String(section.label)}</Filler>,
    }));
  }

  return sections.map((section) => ({
    ...section,
    children: <Filler>{String(section.label)}</Filler>,
  }));
}

const RENDERERS: Record<string, (props: Props) => React.ReactNode> = {
  tabs: (props) => {
    const { items, ...rest } = props as { items?: string } & Partial<TabsProps>;
    const mode = rest.as ?? "tabs";
    // Defaults first, knobs over them, and `items` last — a fixture name is
    // not a prop value, so it is resolved rather than passed through, and the
    // shape it resolves to depends on the mode the knobs have selected.
    const resolved: TabsProps = {
      as: "tabs",
      "aria-label": "Chart sections",
      defaultValue: "summary",
      ...rest,
      items: chartFor(mode, items ?? "patientRoutine"),
    };
    return <Tabs {...resolved} />;
  },
  signature: (props) => {
    /*
     * `methods` and `outcomes` are array props behind single-choice knobs, so
     * the knob's string is wrapped rather than passed through. Handing a
     * string to a prop the component maps over is a runtime crash, and the
     * type-level check cannot see it: the union is inside the array, so the
     * prop has no literal members of its own to validate against.
     */
    const { outcomes, methods, ...rest } = props as {
      outcomes?: string;
      methods?: string;
    } & Partial<SignatureProps>;

    const resolved: SignatureProps = {
      // Never the client clock: the component reads its time from the host,
      // and the playground is a host like any other.
      now: "2026-08-12T10:02:00+05:30",
      subject: { display: "Amara Okonkwo", reference: "Patient/syn-patient-routine" },
      attestation: "I agree to the treatment described above.",
      ...rest,
      methods: methods ? ([methods] as SignatureProps["methods"]) : ["draw", "type", "upload"],
      outcomes: outcomes
        ? ([outcomes] as SignatureProps["outcomes"])
        : ["declined", "unable", "verbal", "on-paper"],
    };

    // Inside a Form.Item, because that is how the component is meant to be
    // used and because it calls `Form.Item.useStatus()` — standalone, antd
    // warns and the error/warning statuses have nothing to read.
    return (
      <Form layout="vertical">
        <Form.Item name="consent" label="Consent" rules={[signatureRequired()]}>
          <Signature {...resolved} />
        </Form.Item>
      </Form>
    );
  },
};

/**
 * Array props behind single-choice knobs, per component. The renderer wraps
 * the knob's string (see `signature` above); the generated code has to say the
 * same thing, or a reader copies `methods="draw"` into a prop that maps.
 */
const ARRAY_PROPS: Record<string, readonly string[]> = {
  signature: ["methods", "outcomes"],
};

/* ------------------------------------------------------------------ */
/* Containment                                                         */
/* ------------------------------------------------------------------ */

/**
 * Catches a component that refuses the props the knobs built.
 *
 * Some combinations are genuinely illegal and the component is right to throw:
 * `overflow="wrap"` outside a radiogroup has no correct arrow-key behaviour,
 * and Tabs says so rather than shipping a widget where "the next tab" stops
 * being a direction. What is not acceptable is that refusal taking the whole
 * documentation page down with it — the reader loses the props table, the
 * examples and the accessibility notes because they moved one select.
 *
 * So the message is rendered as the answer. On a component whose argument is
 * that it refuses to build something incoherent, showing the refusal in place
 * is better documentation than hiding the combination that produces it.
 */
class PlaygroundBoundary extends React.Component<
  { children: React.ReactNode; resetKey: string },
  { message: string | null }
> {
  constructor(props: { children: React.ReactNode; resetKey: string }) {
    super(props);
    this.state = { message: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  override componentDidUpdate(previous: { resetKey: string }) {
    // Cleared when the knobs change, so the next combination gets a fresh
    // attempt rather than a panel stuck on the last failure.
    if (previous.resetKey !== this.props.resetKey && this.state.message) {
      this.setState({ message: null });
    }
  }

  override render() {
    if (this.state.message === null) return this.props.children;
    return (
      <div role="status" className="text-sm leading-relaxed text-graphite">
        <p className="font-display text-base font-semibold tracking-tight text-ink">
          That combination is not one the component will build.
        </p>
        <pre className="scroll-thin mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-[0.7rem] text-graphite">
          {this.state.message}
        </pre>
      </div>
    );
  }
}

/* ------------------------------------------------------------------ */
/* Widgets                                                             */
/* ------------------------------------------------------------------ */

const LABEL = "font-mono text-xs text-ink";

const FIELD =
  "h-8 w-full rounded-lg border border-rule bg-paper px-2 font-mono text-[11.5px] text-ink " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * A segmented row in the 240px panel holds about 26 characters of mono labels.
 * Past that the labels truncate to "radi…", which names nothing, so the knob
 * falls back to a select.
 */
const SEGMENT_CHARS = 26;

function Knob({
  control,
  value,
  onChange,
}: {
  control: Control;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const id = `knob-${control.prop}`;
  const label = control.label ?? control.prop;
  const options = control.options ?? [];

  if (control.control === "switch") {
    const on = Boolean(value);
    return (
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={on}
        onClick={() => onChange(!on)}
        className="flex w-full items-center justify-between gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span className={LABEL}>{label}</span>
        <span
          aria-hidden="true"
          className={`relative h-4 w-7 flex-none rounded-full transition-colors ${on ? "bg-brand" : "bg-rule-strong"}`}
        >
          <span
            className={`absolute top-0.5 size-3 rounded-full bg-white transition-[left] ${on ? "left-3.5" : "left-0.5"}`}
          />
        </span>
      </button>
    );
  }

  const fits = options.join("").length + options.length * 2 <= SEGMENT_CHARS;
  const segmented =
    options.length > 0 && fits && ["segmented", "select", "fixture"].includes(control.control);

  if (segmented) {
    return (
      <fieldset className="m-0 flex min-w-0 flex-col gap-[7px] border-0 p-0">
        <legend className={`${LABEL} mb-[7px] p-0`}>{label}</legend>
        {/* Native radios, visually hidden: a single choice from a fixed set is
            what a radio group already announces and drives by arrow key. */}
        <div className="flex rounded-lg border border-rule bg-paper-sunk p-0.5">
          {options.map((option) => (
            <label
              key={option}
              title={option}
              className="flex h-[26px] min-w-0 flex-1 cursor-pointer items-center justify-center truncate rounded-md px-1.5 font-mono text-[11.5px] text-graphite transition-colors has-[:checked]:bg-paper has-[:checked]:text-ink has-[:checked]:shadow-[0_0_0_1px_var(--color-rule),0_1px_2px_rgb(0_0_0/0.06)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
            >
              <input
                type="radio"
                name={id}
                className="sr-only"
                checked={value === option}
                onChange={() => onChange(option)}
              />
              <span className="truncate">{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (["segmented", "select", "fixture"].includes(control.control)) {
    return (
      <div className="flex min-w-0 flex-col gap-[7px]">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        <select
          id={id}
          className={FIELD}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value || undefined)}
        >
          <option value="">— unset —</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (control.control === "slider") {
    return (
      <div className="flex min-w-0 flex-col gap-[7px]">
        <label htmlFor={id} className={`${LABEL} flex justify-between`}>
          <span>{label}</span>
          <span className="text-graphite">{String(value ?? control.min ?? 0)}</span>
        </label>
        <input
          id={id}
          type="range"
          className="w-full accent-[var(--color-brand)]"
          min={control.min ?? 0}
          max={control.max ?? 100}
          step={control.step ?? 1}
          value={Number(value ?? control.min ?? 0)}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    );
  }

  if (control.control === "event") return null;

  return (
    <div className="flex min-w-0 flex-col gap-[7px]">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className={FIELD}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value || undefined)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Code                                                                */
/* ------------------------------------------------------------------ */

/**
 * The source for what the stage is showing.
 *
 * Built from the same props object the renderer receives, so the code and the
 * component cannot disagree. A fixture knob names a dataset rather than a
 * value, so it is written as an identifier and imported from the fixtures
 * package — which is where a reader would get it.
 */
export function playgroundSource({
  importName,
  importFrom,
  controls,
  props,
  arrayProps = [],
}: {
  importName: string;
  importFrom: string;
  controls: readonly Control[];
  props: Props;
  arrayProps?: readonly string[];
}): string {
  const fixtures: string[] = [];
  const attrs: string[] = [];
  for (const control of controls) {
    if (control.control === "event") continue;
    const value = props[control.prop];
    const isFixture = control.control === "fixture" && typeof value === "string";
    if (isFixture) fixtures.push(value as string);
    const wrapped =
      arrayProps.includes(control.prop) && typeof value === "string" ? [value] : value;
    const attr = jsxAttr(control.prop, wrapped, isFixture);
    if (attr) attrs.push(attr);
  }
  const imports = [
    `import { ${importName} } from "${importFrom}";`,
    ...(fixtures.length ? [`import { ${fixtures.join(", ")} } from "@zoblocks/fixtures";`] : []),
  ].join("\n");
  return `${imports}\n\nexport default function Example() {\n  return (\n    ${jsxElement(importName, attrs, "    ")}\n  );\n}`;
}

/* ------------------------------------------------------------------ */

export function Playground({
  name,
  controls,
  importName,
  importFrom,
  links = [],
  chrome = false,
}: {
  name: string;
  controls: readonly Control[];
  /** The React export the code imports. Defaults to the component name in PascalCase. */
  importName?: string;
  /** Where the code imports it from. Defaults to the registry path. */
  importFrom?: string;
  links?: readonly DemoLink[];
  /**
   * Draw the host-chrome band — the design language's own buttons, inputs and
   * tabs — above the component, for the components `playgroundChrome` admits. The
   * page opts in; a test rendering the playground alone does not, so the band
   * can never stand in for a component that rendered nothing.
   */
  chrome?: boolean;
}) {
  if (process.env.NODE_ENV !== "production") {
    // The server decides whether to render this section from
    // PLAYGROUND_COMPONENTS; the renderers live here. Two lists is one more
    // than is safe, so they are checked against each other in development
    // rather than left to agree by memory.
    const declared = [...PLAYGROUND_COMPONENTS].sort().join(",");
    const built = Object.keys(RENDERERS).sort().join(",");
    if (declared !== built) {
      throw new Error(
        `playground registry disagrees with its renderers: [${declared}] vs [${built}]`,
      );
    }
  }

  const knobs = React.useMemo(() => controls.filter((c) => c.control !== "event"), [controls]);
  const events = React.useMemo(() => controls.filter((c) => c.control === "event"), [controls]);

  const initial = React.useMemo(() => {
    const props: Props = {};
    for (const control of knobs) {
      if (control.defaultValue !== undefined) props[control.prop] = control.defaultValue;
    }
    return props;
  }, [knobs]);

  const [props, setProps] = React.useState<Props>(initial);
  const [log, setLog] = React.useState<string[]>([]);
  const dark = useSiteTheme();
  // The playground mounts antd directly for the renderers that need it, so it
  // needs the same language-aware brand the Signature demo does — otherwise
  // this is the one panel on the page the switcher does not reach.
  const brand = useAntdBrandTokens(dark);

  const render = RENDERERS[name];
  if (!render) return null;

  const withHandlers: Props = { ...props };
  for (const event of events) {
    withHandlers[event.prop] = () => {
      // Newest first, and capped. An unbounded log grows the panel until the
      // component it is reporting on is off the screen.
      setLog((previous) => [`${event.prop} fired`, ...previous].slice(0, 4));
    };
  }

  const exportName =
    importName ?? name.replace(/(^|-)([a-z])/g, (_, __, letter: string) => letter.toUpperCase());
  const source = playgroundSource({
    importName: exportName,
    importFrom: importFrom ?? `@/components/zoblocks/${name}`,
    controls,
    props,
    arrayProps: ARRAY_PROPS[name],
  });

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setProps(initial);
            setLog([]);
          }}
          className="rounded-md text-[13px] text-graphite transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Reset
        </button>
      </div>

      <div className="@container overflow-hidden rounded-xl border border-rule bg-paper">
        <div className="flex flex-col @min-[680px]:flex-row">
          {/*
            antd is themed by an algorithm in React, not by inherited CSS, so
            without this the playground renders antd's light palette inside a
            dark page — a white card with near-black text, in the one place on
            the page a reader goes to see what the component looks like.
          */}
          <div
            className="zb-stage flex min-h-[360px] min-w-0 flex-1 items-center justify-center px-7 py-11"
            style={dark ? { colorScheme: "dark" } : undefined}
          >
            <div className="flex w-full min-w-0 flex-col gap-6">
              {/*
                The real framework, beside the component. Choosing "Ant Design"
                re-themes the component through the bridge, and this band is
                antd's own Button, Input and Tabs — what the page owes a reader
                comparing frameworks, and what a reproduction could not draw.
                It was the Preview stage's job; the playground took that stage
                over, so it takes the band too.
              */}
              {chrome && playgroundChrome(name) ? <HostChrome /> : null}
              {/*
                The accent follows the design language. Under "Ant Design" an
                AA failure in antd's own blue is shown rather than corrected,
                because a reader comparing frameworks should see what antd ships.
              */}
              <ConfigProvider
                theme={{
                  algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
                  token: brand,
                }}
              >
                <PlaygroundBoundary resetKey={JSON.stringify(props)}>
                  {render(withHandlers)}
                </PlaygroundBoundary>
              </ConfigProvider>
            </div>
          </div>

          {/*
            The panel is as tall as the stage's minimum and scrolls past it, so
            a component with a dozen props does not stretch the stage into a
            tall empty column. Focusable and named, because a region that
            scrolls has to be reachable by keyboard.
          */}
          <div
            role="region"
            aria-label="Props"
            tabIndex={0}
            className="scroll-thin flex max-h-[360px] w-full flex-none flex-col gap-4 overflow-y-auto border-t border-rule bg-paper px-[18px] pb-[18px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand @min-[680px]:w-60 @min-[680px]:border-l @min-[680px]:border-t-0"
          >
            <span className="sticky top-0 z-10 -mb-2 bg-paper pb-2 pt-[18px] text-xs font-medium text-graphite-soft">
              Props
            </span>
            {knobs.map((control) => (
              <Knob
                key={control.prop}
                control={control}
                value={props[control.prop]}
                onChange={(next) =>
                  setProps((previous) => {
                    const updated = { ...previous };
                    if (next === undefined) delete updated[control.prop];
                    else updated[control.prop] = next;
                    return updated;
                  })
                }
              />
            ))}

            {events.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-graphite-soft">Events</span>
                {/* Polite, because an event log that interrupts is worse than
                    one nobody hears — the component under test comes first. */}
                <ul
                  aria-live="polite"
                  className="m-0 list-none space-y-0.5 p-0 font-mono text-[11px] text-graphite"
                >
                  {log.length === 0 ? (
                    <li className="text-graphite-soft">
                      {events.map((e) => e.prop).join(", ")} — nothing yet
                    </li>
                  ) : (
                    log.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex h-11 items-center justify-between gap-2 border-t border-rule bg-paper-sunk pl-3.5 pr-1.5">
          <span className="min-w-0 truncate font-mono text-xs text-graphite">Playground.tsx</span>
          <div className="flex flex-none items-center gap-0.5">
            <CopyButton text={source} what="playground code" />
            <PlatformLinks links={links} />
          </div>
        </div>
        <CodeLines code={source} label="Playground code" />
      </div>
    </div>
  );
}
