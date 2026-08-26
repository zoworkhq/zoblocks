"use client";

/**
 * The switch gallery — every demo from the component brief, live, on the page.
 *
 * The scenario switcher above this shows one state at a time, which is right
 * for a quick look and wrong for the argument this component makes. The claim
 * is that a switch has three independent axes and seven commit phases, and a
 * claim about a *set* cannot be made one card at a time: the reader has to see
 * the absence reasons beside each other to notice the word changes and the
 * colour does not, and the phases beside each other to notice that only three
 * of them need a human.
 *
 * So everything is laid out at once, framed, with the prop that produced it
 * named on the frame.
 *
 * The control bar is the other half. Theme, density, direction and motion are
 * the four axes a design system is most often wrong on and the four nobody
 * checks by hand — and for this component each one is load-bearing rather than
 * decorative: density decides the hit area, direction decides which way the
 * thumb travels, and motion decides whether a failed write is perceptible.
 */

import * as React from "react";
import { Tabs } from "@oxygenui-design/tabs";
import { Switch, SwitchField, SwitchList, type CommitPhase } from "@/registry/oxygen/switch/switch";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Stage furniture                                                      */
/* ------------------------------------------------------------------ */

interface DemoProps {
  id: string;
  name: string;
  api: string;
  tags?: string[];
  note: React.ReactNode;
  children: React.ReactNode;
  /** Stretches the stage for a wide composition — a matrix, a table, a panel. */
  wide?: boolean;
}

/**
 * One framed demo.
 *
 * The frame states the API being demonstrated, because a gallery where you
 * cannot tell which prop produced which pixels teaches nothing.
 */
function Demo({ id, name, api, tags, note, children, wide }: DemoProps) {
  return (
    <figure id={`switch-${id}`} className="ox-demo scroll-mt-28">
      <figcaption className="ox-demo__head">
        <span className="ox-demo__id">{id.toUpperCase()}</span>
        <span className="ox-demo__name">{name}</span>
        <code className="ox-demo__api">{api}</code>
        <span className="grow" />
        {tags?.map((tag) => (
          <span key={tag} className="ox-demo__tag">
            {tag}
          </span>
        ))}
      </figcaption>
      <div className={cn("ox-demo__stage", wide && "ox-demo__stage--wide")}>{children}</div>
      <p className="ox-demo__note">{note}</p>
    </figure>
  );
}

/** A stack with room to breathe, which most of these demos want. */
function Stack({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex w-full flex-col gap-5", className)}>{children}</div>;
}

/** The code that produced the row beside it. */
function Spec({
  code,
  note,
  children,
}: {
  code: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-start sm:gap-5">
      <div className="min-w-0">
        <code className="ox-demo__api">{code}</code>
        {note ? <p className="ox-demo__note mt-1 !p-0">{note}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live drivers                                                         */
/* ------------------------------------------------------------------ */

/**
 * A switch that is actually written to, because the whole argument is that a
 * switch is a request rather than a change.
 *
 * `flaky` fails every other write — the state nobody builds a demo for, and
 * the one this component exists for.
 */
export function LiveSwitch({
  flaky = false,
  ...props
}: { flaky?: boolean } & React.ComponentProps<typeof Switch>) {
  const [value, setValue] = React.useState<boolean | "unknown">(
    (props.checked as boolean | "unknown" | undefined) ?? false,
  );
  const attempts = React.useRef(0);

  return (
    <Switch
      {...props}
      checked={value}
      onCommit={async (next) => {
        await new Promise((resolve) => setTimeout(resolve, 700));
        attempts.current += 1;
        if (flaky && attempts.current % 2 === 1) throw new Error("Could not reach the record.");
        setValue(next);
      }}
    />
  );
}

/**
 * A switch whose "on" has an end.
 *
 * `now` is a prop, never the wall clock, so the rendered window depends only
 * on props. The demo advances `now` itself, which is what a server pushing a
 * fresher timestamp would do. Watch what happens at the end: the switch does
 * not turn itself off. It reports the lapse and waits.
 */
export function TimeBoxedSwitch() {
  const START = "2026-08-16T13:00:00.000Z";
  const UNTIL = "2026-08-16T13:00:12.000Z";
  const [now, setNow] = React.useState(START);
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    if (!on) return;
    const id = setInterval(
      () => setNow((current) => new Date(Date.parse(current) + 2000).toISOString()),
      1000,
    );
    return () => clearInterval(id);
  }, [on]);

  return (
    <Switch
      label="Nil by mouth"
      description="Set for theatre. Shows on the bed board, the diet list and the handover."
      stateLabels="in-effect"
      tone="caution"
      size="large"
      checked={on}
      now={now}
      until={UNTIL}
      untilWarnMs={6000}
      onCommit={(next) => {
        setOn(next);
        if (next) setNow(START);
      }}
      onExpire={() => {}}
    />
  );
}

/** A change that was never sent, and a change somebody else got in first with. */
export function SharedRecordSwitches() {
  const [online, setOnline] = React.useState(false);
  const [offlineValue, setOfflineValue] = React.useState(false);
  const [mine, setMine] = React.useState(true);
  const [theirs, setTheirs] = React.useState<boolean | undefined>(undefined);

  return (
    <Stack className="gap-7">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setOnline((v) => !v)}
          className="ox-gallery__switch self-start"
        >
          {online ? "connected — tap to go offline" : "offline — tap to reconnect"}
        </button>
        <Switch
          label="Falls risk"
          description="Adds the bed sensor to the round list."
          stateLabels="in-effect"
          size="large"
          checked={offlineValue}
          online={online}
          onCommit={(next) => setOfflineValue(next)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setTheirs(theirs === undefined ? !mine : undefined)}
          className="ox-gallery__switch self-start"
        >
          {theirs === undefined ? "simulate: S. Mehta changes it too" : "clear the conflict"}
        </button>
        <Switch
          label="Contact precautions"
          description="Gown and gloves on entry."
          stateLabels="in-effect"
          tone="caution"
          size="large"
          checked={mine}
          serverValue={theirs}
          onCommit={(next) => setMine(next)}
          onResolveConflict={(keep) => {
            if (keep === "theirs" && theirs !== undefined) setMine(theirs);
            setTheirs(undefined);
          }}
        />
      </div>
    </Stack>
  );
}

/** Every phase, driven by hand through the controlled escape hatch. */
export function PhaseStepper() {
  const PHASES = [
    { phase: "idle", note: "nothing in flight" },
    { phase: "pending", note: "sent, awaiting the record — still focusable" },
    { phase: "committed", note: "landed" },
    { phase: "reverted", note: "we tried and it failed; retry is reasonable" },
    { phase: "blocked", note: "refused before trying; retry fails identically" },
    { phase: "queued", note: "never sent — offline, and cancellable" },
    { phase: "stale", note: "somebody else's write landed" },
  ] as const satisfies ReadonlyArray<{ phase: CommitPhase; note: string }>;

  const [i, setI] = React.useState(0);
  const active = PHASES[i]!;

  return (
    <Stack>
      <div className="flex flex-wrap gap-1.5">
        {PHASES.map((p, index) => (
          <button
            key={p.phase}
            type="button"
            aria-pressed={index === i}
            onClick={() => setI(index)}
            className="ox-gallery__switch"
          >
            {p.phase}
          </button>
        ))}
      </div>

      <Switch
        label="Contact precautions"
        description="Gown and gloves on entry."
        stateLabels="in-effect"
        tone="caution"
        size="large"
        checked
        phase={active.phase}
        requested={active.phase === "queued" || active.phase === "pending" ? false : undefined}
        serverValue={active.phase === "stale" ? false : undefined}
        error={
          active.phase === "reverted"
            ? "Could not reach the record."
            : active.phase === "blocked"
              ? "Your role cannot change precautions on this unit."
              : undefined
        }
      />

      <p className="ox-demo__note !p-0">
        {active.phase} — {active.note}
      </p>
    </Stack>
  );
}

/**
 * The reference grid, rebuilt.
 *
 * Four availability rows against size and value — the specimen sheet this
 * component started from. Kept because it is the one view that *shows* the
 * axes are independent rather than asserting it.
 */
export function AnatomyMatrix() {
  const COLUMNS = [
    { size: "large", checked: false },
    { size: "large", checked: true },
    { size: "default", checked: false },
    { size: "default", checked: true },
  ] as const;

  const ROWS = [
    { key: "plain", label: "plain", props: {} },
    {
      key: "labelled",
      label: "labelled track",
      props: { appearance: "labeled" as const, stateLabels: "active-inactive" as const },
    },
    { key: "readonly", label: "read-only", props: { readOnly: true } },
    { key: "disabled", label: "disabled", props: { disabled: true } },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse">
        <thead>
          <tr>
            <th className="w-24" />
            {COLUMNS.map((c) => (
              <th key={`${c.size}-${String(c.checked)}`} className="ox-demo__api px-3 pb-2">
                {c.size} · {c.checked ? "on" : "off"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key}>
              <th className="ox-demo__api py-4 pr-3 text-left align-middle">{row.label}</th>
              {COLUMNS.map((c) => (
                <td key={`${row.key}-${c.size}-${String(c.checked)}`} className="px-3 py-4">
                  <Switch
                    label="Label"
                    size={c.size}
                    checked={c.checked}
                    showState={false}
                    {...row.props}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chapters                                                             */
/* ------------------------------------------------------------------ */

type Chapter = "anatomy" | "write" | "meaning" | "surfaces";

const CHAPTERS: Array<{ id: Chapter; label: string; blurb: string }> = [
  {
    id: "anatomy",
    label: "Anatomy",
    blurb: "The specimen sheet, rebuilt — then proved without colour.",
  },
  {
    id: "write",
    label: "The write",
    blurb: "Seven phases. A switch is a request, and requests fail.",
  },
  {
    id: "meaning",
    label: "What it means",
    blurb: "Absence, direction, availability, consequence — in words.",
  },
  {
    id: "surfaces",
    label: "Surfaces",
    blurb: "One value, five renderings, four sizes, both directions.",
  },
];

const DENSITIES = ["patient", "standard", "clinical"] as const;

/* ------------------------------------------------------------------ */

export function SwitchGallery() {
  const [chapter, setChapter] = React.useState<Chapter>("anatomy");
  const [theme, setTheme] = React.useState<"light" | "dark" | "hc">("light");
  const [density, setDensity] = React.useState<(typeof DENSITIES)[number]>("standard");
  const [rtl, setRtl] = React.useState(false);
  const [motion, setMotion] = React.useState(true);
  const [themePinned, setThemePinned] = React.useState(false);

  // Follows the site theme until the reader pins one here — a page whose
  // argument is "the tokens carry the theme" must not open on light slabs in
  // a dark page.
  React.useEffect(() => {
    if (themePinned) return;
    const root = document.documentElement;
    const sync = () => setTheme(root.classList.contains("dark") ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [themePinned]);

  const active = CHAPTERS.find((item) => item.id === chapter) ?? CHAPTERS[0]!;

  return (
    <div className="ox-gallery">
      <div className="ox-gallery__bar">
        <div className="ox-gallery__group" role="group" aria-label="Component theme">
          <span className="ox-gallery__legend">Theme</span>
          {(["light", "dark", "hc"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={theme === option}
              onClick={() => {
                setThemePinned(true);
                setTheme(option);
              }}
              className="ox-gallery__switch"
            >
              {option}
            </button>
          ))}
        </div>

        <div className="ox-gallery__group" role="group" aria-label="Density">
          <span className="ox-gallery__legend">Density</span>
          {DENSITIES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={density === option}
              onClick={() => setDensity(option)}
              className="ox-gallery__switch"
            >
              {option}
            </button>
          ))}
        </div>

        <div className="ox-gallery__group" role="group" aria-label="Text direction">
          <span className="ox-gallery__legend">Dir</span>
          {(
            [
              ["ltr", false],
              ["rtl", true],
            ] as const
          ).map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={rtl === value}
              onClick={() => setRtl(value)}
              className="ox-gallery__switch"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ox-gallery__group" role="group" aria-label="Motion">
          <span className="ox-gallery__legend">Motion</span>
          {(
            [
              ["on", true],
              ["off", false],
            ] as const
          ).map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={motion === value}
              onClick={() => setMotion(value)}
              className="ox-gallery__switch"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="ox-gallery__chapters">
        <Tabs
          as="radiogroup"
          variant="segmented"
          aria-label="Gallery chapter"
          value={chapter}
          onChange={(next) => setChapter(next as Chapter)}
          items={CHAPTERS.map((item) => ({ value: item.id, label: item.label }))}
        />
        <p className="ox-gallery__blurb">{active.blurb}</p>
      </div>

      <div
        className="ox-gallery__stage"
        data-ox-theme={theme === "hc" ? "high-contrast" : theme}
        data-ox-density={density}
        data-ox-motion={motion ? "on" : "off"}
        dir={rtl ? "rtl" : "ltr"}
      >
        {chapter === "anatomy" && (
          <div className="ox-gallery__grid">
            <Demo
              id="a01"
              name="The matrix"
              api="size × checked × availability"
              tags={["16 live controls"]}
              note="The specimen sheet this component started from, rebuilt with Oxygen's real token values. Read-only is a dashed border and a filled thumb — a different object, not a weaker one, because dimming reads as “inactive”, which is a value rather than an availability."
              wide
            >
              <AnatomyMatrix />
            </Demo>

            <Demo
              id="a02"
              name="Without colour"
              api="the same four states, desaturated"
              tags={["1.2:1"]}
              note="On-track and off-track sit within about 1.2:1 of each other in relative luminance, so in monochrome output and in forced colours the fill carries nothing. Thumb position, thumb glyph and the state word each have to be sufficient alone — and here each one is."
            >
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 grayscale">
                <Switch label="Off" checked={false} />
                <Switch label="On" checked />
                <Switch label="Advance directive" checked="unknown" absentReason="not-collected" />
                <Switch label="Contact precautions" checked readOnly />
              </div>
            </Demo>

            <Demo
              id="a03"
              name="The labelled track holds its width"
              api='appearance="labeled"'
              tags={["no reflow"]}
              note="“Active” is six characters and “Inactive” is eight. Both words are laid into the same grid cell, so the track is sized by the longer of the two and the thumb travel is constant. A switch that resizes as it toggles reflows everything to its inline-end — in a table row, the whole row jumps."
            >
              <Stack>
                <Switch
                  label="Interpreter required"
                  appearance="labeled"
                  stateLabels="active-inactive"
                  defaultChecked
                  size="large"
                />
                <Switch
                  label="Interpreter required"
                  appearance="labeled"
                  stateLabels="active-inactive"
                  defaultChecked={false}
                  size="large"
                />
              </Stack>
            </Demo>
          </div>
        )}

        {chapter === "write" && (
          <div className="ox-gallery__grid">
            <Demo
              id="w01"
              name="The write, and the write that fails"
              api="onCommit → Promise"
              tags={["pending", "reverted"]}
              note="A switch is a request, not a change. The first control saves; the second fails every other attempt — watch it animate back to the value the record actually holds and say so, rather than snapping back while nobody is looking."
            >
              <Stack className="gap-7">
                <LiveSwitch
                  label="Contact precautions"
                  stateLabels="in-effect"
                  tone="caution"
                  size="large"
                />
                <LiveSwitch
                  label="Falls risk"
                  stateLabels="in-effect"
                  size="large"
                  flaky
                  description="This one fails every other write, on purpose."
                />
              </Stack>
            </Demo>

            <Demo
              id="w02"
              name="Every phase, by hand"
              api="phase / requested / error"
              tags={["controlled"]}
              note="The escape hatch for a caller that already owns a state machine — a mutation library, a websocket, an offline queue. Supplying `phase` takes the internal machine out of the loop and renders exactly what the uncontrolled path would."
            >
              <PhaseStepper />
            </Demo>

            <Demo
              id="w03"
              name="Offline, and overtaken"
              api="online={false} · serverValue"
              tags={["queued", "stale"]}
              note="Queued is not pending: nothing has been sent, and the user may still change their mind. A conflict offers both readings and pre-selects neither, because each clinician had a reason and picking a winner discards one of them silently."
            >
              <SharedRecordSwitches />
            </Demo>

            <Demo
              id="w04"
              name="An on that is not forever"
              api="until · untilWarnMs · onExpire"
              tags={["lapses"]}
              note="Almost no clinical on-state is permanent. Turn it on and watch the window close — then note that the switch is still on. It reports the lapse and waits, because a client clock deciding to lift a clinical flag is a defect, not a feature."
            >
              <TimeBoxedSwitch />
            </Demo>

            <Demo
              id="w05"
              name="A switch inside a form"
              api='commit="deferred"'
              tags={["unsaved"]}
              note="A switch means applied now. When it is not — a form that commits on submit — it has to say so, or it lies about when it took effect. Toggle these and watch an unsaved marker rather than a write."
            >
              <Stack>
                <Switch
                  label="Text me when my results are ready"
                  description="Saved when you submit the form."
                  stateLabels="enabled-disabled"
                  commit="deferred"
                  defaultChecked={false}
                  size="large"
                />
                <Switch
                  label="Share my records with my GP"
                  stateLabels="given-declined"
                  commit="deferred"
                  defaultChecked={false}
                  size="large"
                />
              </Stack>
            </Demo>
          </div>
        )}

        {chapter === "meaning" && (
          <div className="ox-gallery__grid">
            <Demo
              id="m01"
              name="Off, and never asked"
              api='checked="unknown" · absentReason'
              tags={["11 reasons"]}
              note="The clinical difference a two-state control cannot hold. Four switches in the same visual state saying four different things — and the word changes, not the colour. “Declined” is a recorded clinical act, not an absence."
            >
              <Stack className="gap-4">
                <Spec code="not-collected" note="nobody collected it">
                  <Switch
                    label="Advance directive"
                    checked="unknown"
                    absentReason="not-collected"
                    stateLabels="yes-no"
                  />
                </Spec>
                <Spec code="declined" note="the person refused">
                  <Switch
                    label="Interpreter needed"
                    checked="unknown"
                    absentReason="declined"
                    stateLabels="yes-no"
                  />
                </Spec>
                <Spec code="masked" note="policy withheld it from you">
                  <Switch
                    label="Substance use screen"
                    checked="unknown"
                    absentReason="masked"
                    readOnly
                    stateLabels="yes-no"
                  />
                </Spec>
                <Spec code="pending" note="collected, result not back">
                  <Switch
                    label="MRSA screen"
                    checked="unknown"
                    absentReason="pending"
                    stateLabels="yes-no"
                  />
                </Spec>
              </Stack>
            </Demo>

            <Demo
              id="m02"
              name="When on is the dangerous state"
              api="tone"
              tags={["4 tones"]}
              note="Half the switches in a clinical system are suppressions. All four here are on; only the middle two are situations anyone needs to know about — and the colour, the glyph and the state word all say so."
            >
              <Stack className="gap-4">
                <Spec code="affirmative" note="on is the safe direction">
                  <Switch
                    label="Allergy interaction checking"
                    stateLabels="enabled-disabled"
                    checked
                  />
                </Spec>
                <Spec code="caution" note="on removes a safety net">
                  <Switch
                    label="Suppress duplicate-therapy alerts"
                    tone="caution"
                    stateLabels="in-effect"
                    checked
                  />
                </Spec>
                <Spec code="critical" note="on suppresses a clinical check">
                  <Switch
                    label="Bypass allergy check for this order"
                    tone="critical"
                    stateLabels="allowed-blocked"
                    checked
                  />
                </Spec>
                <Spec code="neutral" note="no clinical direction at all">
                  <Switch label="Show archived encounters" tone="neutral" checked />
                </Spec>
              </Stack>
            </Demo>

            <Demo
              id="m03"
              name="Locked, and why"
              api="readOnly + lockedReason"
              tags={["stays focusable"]}
              note="“Disabled” is the most over-used attribute in healthcare UI and almost always the wrong one — it takes the control out of the tab order, so a screen-reader user never learns it exists. Read-only keeps it reachable and says what is holding it. Only the last row here is genuinely disabled: transient, and caused by something the user just did."
            >
              <Stack className="gap-4">
                <Switch
                  label="Contact precautions"
                  stateLabels="in-effect"
                  checked
                  readOnly
                  lockedReason="Encounter signed 14:32 by Dr Okafor."
                />
                <Switch
                  label="Change diet order"
                  stateLabels="allowed-blocked"
                  checked={false}
                  readOnly
                  lockedReason="Your role cannot change this."
                />
                <Switch
                  label="Airborne precautions"
                  stateLabels="in-effect"
                  checked={false}
                  readOnly
                  lockedReason="Requires a negative-pressure room, and none is free on this unit."
                />
                <Switch label="Notify by SMS" stateLabels="enabled-disabled" checked disabled />
              </Stack>
            </Demo>

            <Demo
              id="m04"
              name="Friction matched to consequence"
              api="confirm"
              tags={["hold", "dialog", "attest", "countersign"]}
              note="Three levels, chosen by what the toggle costs if nobody meant it. Hold is a timed input, so SC 2.2.1 applies — activate any of these from the keyboard and the dialog opens instead, because holding must never be the only path."
            >
              <Stack className="gap-4">
                <Spec code='confirm="hold"' note="600ms, gloves, one hand">
                  <LiveSwitch
                    label="Suspend fall-risk alarm"
                    stateLabels="in-effect"
                    tone="critical"
                    confirm="hold"
                  />
                </Spec>
                <Spec code='confirm="dialog"' note="names the patient and the consequence">
                  <LiveSwitch
                    label="Discharge to home"
                    stateLabels="active-inactive"
                    confirm="dialog"
                    confirmCopy={{
                      subject: "Ada Lovelace",
                      consequence:
                        "Closes the encounter and releases the bed. This cannot be undone.",
                    }}
                  />
                </Spec>
                <Spec code='confirm="attest"' note="the typed reason is the deliverable">
                  <LiveSwitch
                    label="Bypass allergy check for this order"
                    stateLabels="allowed-blocked"
                    tone="critical"
                    confirm="attest"
                  />
                </Spec>
                <Spec code='confirm="countersign"' note="a second person, not the requester">
                  <LiveSwitch
                    label="Release restraint order"
                    stateLabels="active-inactive"
                    tone="critical"
                    confirm="countersign"
                    countersign={{
                      role: "registered-nurse",
                      notSameAs: "s.mehta",
                      requestedBy: "S. Mehta, RN",
                      verify: () =>
                        new Promise<string>((resolve) =>
                          setTimeout(() => resolve("j.adeyemi"), 600),
                        ),
                    }}
                  />
                </Spec>
              </Stack>
            </Demo>

            <Demo
              id="m05"
              name="The consequence, before the click"
              api="impact · provenance"
              tags={["reaches other people"]}
              note="Every design system puts this in a confirmation dialog, which is after the decision. A switch whose consequences reach other people should carry them where they inform it — and say who last moved it, because in a shared record that is the first question anyone asks."
            >
              <LiveSwitch
                label="Add to the deteriorating-patient list"
                stateLabels="in-effect"
                tone="caution"
                size="large"
                impact={[
                  "page the outreach team on call now",
                  "add a banner to the bed board, visible to visitors",
                  "set hourly observations for 24 hours",
                ]}
                provenance={{ by: "J. Adeyemi", at: "2026-08-16T06:40:00.000Z", via: "ward round" }}
              />
            </Demo>

            <Demo
              id="m06"
              name="A real panel"
              api="SwitchList · SwitchField"
              tags={["counts unknown apart"]}
              note="Five rows, five different situations, and not one rendered as an ordinary off. The count says two of four — “not asked” is reported apart, because folding it into off is the failure this component exists to prevent, repeated at group scale."
              wide
            >
              <SwitchList
                title="Isolation precautions"
                counts={{ on: 2, total: 4, unknown: 1 }}
                provenance={{ by: "S. Mehta", at: "2026-08-16T14:07:00.000Z" }}
              >
                <SwitchField
                  label="Contact"
                  description="Gown and gloves on entry."
                  stateLabels="in-effect"
                  tone="caution"
                  checked
                />
                <SwitchField
                  label="Droplet"
                  description="Surgical mask within two metres."
                  stateLabels="in-effect"
                  tone="caution"
                  checked
                />
                <SwitchField
                  label="Airborne"
                  description="Negative-pressure room and N95."
                  stateLabels="in-effect"
                  checked={false}
                  readOnly
                  lockedReason="No negative-pressure room available on this unit."
                />
                <SwitchField
                  label="Enteric"
                  description="Dedicated commode; soap and water, not alcohol gel."
                  stateLabels="in-effect"
                  checked="unknown"
                  absentReason="not-collected"
                />
              </SwitchList>
            </Demo>
          </div>
        )}

        {chapter === "surfaces" && (
          <div className="ox-gallery__grid">
            <Demo
              id="s01"
              name="One value, five renderings"
              api="appearance"
              tags={["segmented = radiogroup"]}
              note="The same state model behind every one. Segmented is the only appearance that changes the ARIA role — two labelled cells that both look pressable are a radiogroup, and calling them a switch would be a lie to a screen reader."
              wide
            >
              <Stack className="gap-4">
                <Spec code='"switch"' note="the default">
                  <Switch label="Interpreter required" stateLabels="yes-no" checked />
                </Spec>
                <Spec code='"labeled"' note="the word is inside the track">
                  <Switch
                    label="Interpreter required"
                    appearance="labeled"
                    stateLabels="active-inactive"
                    checked
                  />
                </Spec>
                <Spec code='"segmented"' note="both answers are visible choices">
                  <div className="flex flex-col gap-3">
                    <Switch
                      label="Interpreter required"
                      appearance="segmented"
                      stateLabels="yes-no"
                      checked
                    />
                    <Switch
                      label="Latex allergy"
                      appearance="segmented"
                      stateLabels="yes-no"
                      checked="unknown"
                      absentReason="not-collected"
                    />
                  </div>
                </Spec>
                <Spec code='"chip"' note="a filter bar, eight at a time">
                  <div className="flex flex-wrap gap-2">
                    <Switch label="My patients" appearance="chip" checked />
                    <Switch label="Unacknowledged results" appearance="chip" checked={false} />
                    <Switch label="Discharge today" appearance="chip" checked />
                    <Switch label="Isolation" appearance="chip" checked={false} />
                  </div>
                </Spec>
                <Spec code='"row"' note="the whole row is the target">
                  <Switch
                    label="Text me when my results are ready"
                    description="To the mobile ending 4471. Standard rates apply."
                    appearance="row"
                    audience="patient"
                    checked
                  />
                </Spec>
              </Stack>
            </Demo>

            <Demo
              id="s02"
              name="From a flowsheet row to a phone"
              api='size="micro" → audience="patient"'
              tags={["24px floor"]}
              note="The pill shrinks; the target does not. The micro switches are 26×14px and still present a target at or above the 24px floor, because the hit area is a separate token that follows the density profile rather than the pill."
              wide
            >
              <Stack>
                <div className="overflow-hidden rounded-lg border border-rule">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-rule text-start">
                        <th className="px-3 py-2 font-medium">Bed</th>
                        <th className="px-3 py-2 font-medium">Patient</th>
                        <th className="px-3 py-2 font-medium">NPO</th>
                        <th className="px-3 py-2 font-medium">Falls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { bed: "12", who: "A. Lovelace", npo: true, falls: false },
                        { bed: "13", who: "G. Hopper", npo: false, falls: true },
                      ].map((row) => (
                        <tr key={row.bed} className="border-b border-rule/60 last:border-0">
                          <td className="px-3 py-2">{row.bed}</td>
                          <td className="px-3 py-2">{row.who}</td>
                          <td className="px-3 py-2">
                            <Switch
                              size="micro"
                              tone="caution"
                              checked={row.npo}
                              showState={false}
                              aria-label={`Nil by mouth — ${row.who}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Switch
                              size="micro"
                              checked={row.falls}
                              showState={false}
                              aria-label={`Falls risk — ${row.who}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Switch
                  label="Share my records with my GP"
                  description="Your GP surgery can see your hospital notes. You can change this at any time, and it will not affect your care."
                  appearance="row"
                  audience="patient"
                  checked
                />
              </Stack>
            </Demo>

            <Demo
              id="s03"
              name="The antd surface, unchanged"
              api="checkedChildren · loading · size"
              tags={["drop-in"]}
              note="Prop names, shapes and defaults match Ant Design's Switch, so an existing form migrates by changing an import. The one deliberate divergence is `loading`: it renders as pending and does not disable, because a spinner that removes the control loses focus and cannot be cancelled."
            >
              <Stack className="gap-4">
                <Spec code="checkedChildren" note="antd's in-track words">
                  <Switch
                    label="Interpreter required"
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    defaultChecked
                  />
                </Spec>
                <Spec code="loading" note="pending, focusable, never disabled">
                  <Switch label="Saving your preference" loading checked />
                </Spec>
                <Spec code="size" note="antd's two, plus ours">
                  <div className="flex flex-wrap items-center gap-6">
                    <Switch label="small" size="small" defaultChecked showState={false} />
                    <Switch label="default" defaultChecked showState={false} />
                    <Switch label="large" size="large" defaultChecked showState={false} />
                  </div>
                </Spec>
              </Stack>
            </Demo>

            <Demo
              id="s04"
              name="Restyled without a fork"
              api="--ox-switch-* · slots"
              tags={["tokens first"]}
              note="Three layers, in the order to reach for them: tokens first, props second, slots last. All three here are one component and one state model — only the token values differ, so a brand restyles the control without editing the source it was shipped."
            >
              <Stack>
                <Switch label="Default tokens" stateLabels="in-effect" checked size="large" />
                <div
                  style={
                    {
                      "--ox-switch-radius": "0.25rem",
                      "--ox-switch-track-on-bg": "#4338ca",
                      "--ox-switch-track-w": "64px",
                    } as React.CSSProperties
                  }
                >
                  <Switch
                    label="Squared, wider, another brand"
                    stateLabels="in-effect"
                    checked
                    size="large"
                  />
                </div>
                <Switch
                  label="A custom thumb, through slots"
                  stateLabels="in-effect"
                  checked
                  size="large"
                  slots={{
                    thumb: ({ value }) => (
                      <span aria-hidden="true" style={{ fontSize: 11, lineHeight: 1 }}>
                        {value === true ? "✓" : ""}
                      </span>
                    ),
                  }}
                />
              </Stack>
            </Demo>

            <Demo
              id="s05"
              name="Right to left"
              api="labelPlacement · logical properties"
              tags={["dir=rtl"]}
              note="The thumb travels on inset-inline-start and labelPlacement is start/end rather than left/right, so nothing here is mirrored by hand. Flip the whole gallery with the Dir control above and watch every demo follow."
            >
              <Stack>
                <Switch label="Label at the end (default)" stateLabels="yes-no" checked />
                <Switch
                  label="Label at the start"
                  stateLabels="yes-no"
                  labelPlacement="start"
                  checked
                />
                <div dir="rtl" className="rounded-lg border border-rule p-3">
                  <Switch label="مترجم مطلوب" stateLabels="yes-no" checked />
                </div>
              </Stack>
            </Demo>
          </div>
        )}
      </div>
    </div>
  );
}
