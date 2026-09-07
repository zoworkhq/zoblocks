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
import { PLAYGROUND_COMPONENTS } from "./playground-registry";
import { useSiteTheme } from "./use-site-theme";
import { useAntdBrandTokens } from "./language-antd-theme";

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

const FIELD =
  "min-h-6 w-full rounded-lg border border-rule bg-paper px-2 py-1 text-sm text-ink " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

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

  if (control.control === "switch") {
    return (
      <label className="flex min-h-6 items-center gap-2 text-sm text-graphite" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          className="size-4 accent-[var(--color-brand)]"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        {label}
      </label>
    );
  }

  if (control.control === "segmented") {
    return (
      <fieldset className="min-w-0">
        <legend className="numeric text-[0.625rem] uppercase tracking-wide text-graphite-soft">
          {label}
        </legend>
        {/* Radios rather than buttons: this is a single choice from a fixed
            set, which is what a radiogroup already announces correctly. */}
        <div className="mt-1 flex flex-wrap gap-1">
          {(control.options ?? []).map((option) => (
            <label
              key={option}
              className="flex min-h-6 cursor-pointer items-center gap-1.5 rounded-lg border border-rule px-2 py-0.5 text-xs text-graphite has-[:checked]:border-brand/50 has-[:checked]:text-ink"
            >
              <input
                type="radio"
                name={id}
                className="size-3 accent-[var(--color-brand)]"
                checked={value === option}
                onChange={() => onChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (control.control === "select" || control.control === "fixture") {
    return (
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="numeric block text-[0.625rem] uppercase tracking-wide text-graphite-soft"
        >
          {label}
        </label>
        <select
          id={id}
          className={`mt-1 ${FIELD}`}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value || undefined)}
        >
          <option value="">— unset —</option>
          {(control.options ?? []).map((option) => (
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
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="numeric block text-[0.625rem] uppercase tracking-wide text-graphite-soft"
        >
          {label} <span className="text-ink">{String(value ?? control.min ?? 0)}</span>
        </label>
        <input
          id={id}
          type="range"
          className="mt-1 w-full accent-[var(--color-brand)]"
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
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="numeric block text-[0.625rem] uppercase tracking-wide text-graphite-soft"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        className={`mt-1 ${FIELD}`}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value || undefined)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Playground({ name, controls }: { name: string; controls: readonly Control[] }) {
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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      {/*
        antd is themed by an algorithm in React, not by inherited CSS, so
        without this the playground renders antd's light palette inside a dark
        page — a white card with near-black text, in the one place on the page
        a reader goes to see what the component actually looks like.
      */}
      <div
        className="surface-2 min-w-0 rounded-2xl p-6"
        style={dark ? { colorScheme: "dark" } : undefined}
      >
        {/*
          The accent follows the design language.

          It was pinned to ZoBlocks's, for a good reason at the time: with only
          the algorithm set this rendered antd's #1677ff with white on it —
          4.10:1, an AA failure. Under "Ant Design" that failure is now shown
          rather than corrected, because a reader comparing frameworks should
          see what antd actually ships.
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

      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="numeric text-[0.625rem] uppercase tracking-wide text-graphite-soft">
            Props
          </p>
          <button
            type="button"
            onClick={() => {
              setProps(initial);
              setLog([]);
            }}
            className="min-h-6 rounded-lg border border-rule px-2 text-xs text-graphite transition-colors hover:border-rule-strong hover:text-ink"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 space-y-4">
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
        </div>

        {events.length > 0 && (
          <div className="mt-5">
            <p className="numeric text-[0.625rem] uppercase tracking-wide text-graphite-soft">
              Events
            </p>
            {/* Polite, because an event log that interrupts is worse than one
                nobody hears — the component under test is the thing being
                driven, and its own announcements come first. */}
            <ul
              aria-live="polite"
              className="mt-1 space-y-0.5 font-mono text-[0.6875rem] text-graphite"
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
  );
}
