"use client";

/**
 * The Switch demos, live — the previews behind the examples on the Switch page.
 *
 * The claim this component makes is about a set: three independent axes and
 * seven commit phases. Each demo below is the preview of one documented
 * example, beside the code that produces it, so the set is read one claim at a
 * time with its evidence next to it.
 *
 * The right-to-left demo sets `dir` on its own block and the theme follows the
 * site's, so nothing here depends on a page-wide control.
 */

import * as React from "react";
import {
  Switch,
  SwitchField,
  SwitchList,
  type CommitPhase,
} from "@/registry/zoblocks/switch/switch";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Stage furniture                                                      */
/* ------------------------------------------------------------------ */

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
        <code className="zb-demo__api">{code}</code>
        {note ? <p className="zb-demo__note mt-1 !p-0">{note}</p> : null}
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
          className="zb-gallery__switch self-start"
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
          className="zb-gallery__switch self-start"
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
            className="zb-gallery__switch"
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

      <p className="zb-demo__note !p-0">
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
              <th key={`${c.size}-${String(c.checked)}`} className="zb-demo__api px-3 pb-2">
                {c.size} · {c.checked ? "on" : "off"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key}>
              <th className="zb-demo__api py-4 pr-3 text-left align-middle">{row.label}</th>
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
/* One component per documented example                                 */
/* ------------------------------------------------------------------ */

export function WithoutColour() {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 grayscale">
      <Switch label="Off" checked={false} />
      <Switch label="On" checked />
      <Switch label="Advance directive" checked="unknown" absentReason="not-collected" />
      <Switch label="Contact precautions" checked readOnly />
    </div>
  );
}

export function LabeledTrack() {
  return (
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
  );
}

export function WriteAndFail() {
  return (
    <Stack className="gap-7">
      <LiveSwitch label="Contact precautions" stateLabels="in-effect" tone="caution" size="large" />
      <LiveSwitch
        label="Falls risk"
        stateLabels="in-effect"
        size="large"
        flaky
        description="This one fails every other write, on purpose."
      />
    </Stack>
  );
}

export function DeferredInForm() {
  return (
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
  );
}

export function AbsenceReasons() {
  return (
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
        <Switch label="MRSA screen" checked="unknown" absentReason="pending" stateLabels="yes-no" />
      </Spec>
    </Stack>
  );
}

export function Tones() {
  return (
    <Stack className="gap-4">
      <Spec code="affirmative" note="on is the safe direction">
        <Switch label="Allergy interaction checking" stateLabels="enabled-disabled" checked />
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
  );
}

export function LockedWithReason() {
  return (
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
  );
}

export function Confirmations() {
  return (
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
            consequence: "Closes the encounter and releases the bed. This cannot be undone.",
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
              new Promise<string>((resolve) => setTimeout(() => resolve("j.adeyemi"), 600)),
          }}
        />
      </Spec>
    </Stack>
  );
}

export function ImpactAndProvenance() {
  return (
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
  );
}

export function IsolationPanel() {
  return (
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
  );
}

export function Appearances() {
  return (
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
  );
}

export function FlowsheetToPhone() {
  return (
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
  );
}

export function AntdSurface() {
  return (
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
  );
}

export function Restyled() {
  return (
    <Stack>
      <Switch label="Default tokens" stateLabels="in-effect" checked size="large" />
      <div
        style={
          {
            "--zb-switch-radius": "0.25rem",
            "--zb-switch-track-on-bg": "#4338ca",
            "--zb-switch-track-w": "64px",
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
  );
}

export function RightToLeft() {
  return (
    <Stack>
      <Switch label="Label at the end (default)" stateLabels="yes-no" checked />
      <Switch label="Label at the start" stateLabels="yes-no" labelPlacement="start" checked />
      <div dir="rtl" className="rounded-lg border border-rule p-3">
        <Switch label="مترجم مطلوب" stateLabels="yes-no" checked />
      </div>
    </Stack>
  );
}
