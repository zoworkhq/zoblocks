"use client";

/**
 * The patient record.
 *
 * Successor to patient-01. Okonkwo keeps the authored chart — the withheld
 * Part 2 section, the trajectory that fell two points and still failed — and
 * every other patient gets the same layout built from the cohort, so a name
 * clicked anywhere in the app lands on a chart that agrees with where it came from.
 */

import * as React from "react";
import { CLINICIANS, PATIENTS, TRACK, faceOf, patient } from "../data";
import { stamp, useNav } from "../shell";
import { KV, Select, Sheet, Tabs, TabPanel } from "../ui";
import { Pill } from "../../kit";
import {
  TABS,
  details,
  episode,
  identity,
  isOkonkwo,
  isTab,
  openRisk,
  type NoteRow,
  type TabId,
} from "./record-data";
import {
  BillingPanel,
  ChronologyPanel,
  DocumentsPanel,
  MeasuresPanel,
  MedicationsPanel,
  NoteSheetFooter,
  NotesPanel,
  OverviewPanel,
  SafetyPanel,
  type RecordCtx,
  type SheetState,
} from "./record-tabs";

const ID_BASE = "nw-record";

const PANELS: Record<TabId, (props: { ctx: RecordCtx }) => React.JSX.Element> = {
  overview: OverviewPanel,
  chronology: ChronologyPanel,
  measures: MeasuresPanel,
  notes: NotesPanel,
  medications: MedicationsPanel,
  safety: SafetyPanel,
  documents: DocumentsPanel,
  billing: BillingPanel,
};

type Reason = "treatment" | "coordination" | "emergency";

const REASONS: readonly { value: Reason; label: string }[] = [
  { value: "treatment", label: "Treatment — active care" },
  { value: "coordination", label: "Care coordination" },
  { value: "emergency", label: "Medical emergency" },
];

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="fact">
      <div className="fk">{k}</div>
      <div className="fv">{children}</div>
    </div>
  );
}

export function RecordScreen() {
  const { route, go, back, toast, store } = useNav();
  const p = patient(route.patient ?? "okonkwo");
  const index = PATIENTS.indexOf(p);
  const ok = isOkonkwo(p);
  const id = identity(p);
  const clin = CLINICIANS[p.clinician];
  const track = TRACK[p.track];
  const risk = openRisk(p, store.resolved);

  const [tab, setTab] = React.useState<TabId>(isTab(route.view) ? route.view : "overview");
  const [sheet, setSheet] = React.useState<SheetState | null>(null);
  const [drafts, setDrafts] = React.useState<NoteRow[]>([]);
  const [draftText, setDraftText] = React.useState("");
  const [reconciled, setReconciled] = React.useState<string | null>(null);
  const [accessPending, setAccessPending] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState<Reason>("treatment");
  const [justification, setJustification] = React.useState("");

  const close = () => setSheet(null);

  const ctx: RecordCtx = {
    p,
    index,
    setTab,
    open: setSheet,
    drafts,
    accessPending,
    reconciled,
    reconcile: () => {
      setReconciled(stamp());
      toast(`Medication list reconciled · ${stamp()}`);
    },
  };

  const startNote = () => {
    if (ok) {
      go({ screen: "note", patient: "okonkwo" });
      return;
    }
    setTab("notes");
    setDraftText("");
    setSheet({ kind: "new-note" });
  };

  const saveDraft = () => {
    const n = drafts.length + 1;
    setDrafts((d) => [
      {
        id: `${p.id}-draft-${n}`,
        date: "13 Aug",
        type: "Progress note",
        clinician: CLINICIANS.lake.short,
        status: "draft",
        body: draftText.trim(),
      },
      ...d,
    ]);
    close();
    toast(`Draft saved · ${stamp()}`);
  };

  const submitAccess = () => {
    setAccessPending(stamp());
    close();
    toast(`Access request sent to the privacy officer · ${stamp()}`);
  };

  const Panel = PANELS[tab];
  const detail =
    sheet?.kind === "detail" ? details(p, index).find((d) => d.key === sheet.key) : undefined;

  return (
    <div className="rc-root">
      <nav className="crumbs" aria-label="Breadcrumb">
        <button type="button" className="rc-crumb" onClick={() => back({ screen: "patients" })}>
          Patients
        </button>
        <span aria-hidden="true">›</span>
        <b aria-current="page">{p.full}</b>
      </nav>

      <div className="ptHead">
        {/* The name is beside it, so the face is decoration to a screen reader. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- fixture served from this origin; sized by CSS. */}
        <img className="ptAvatar" src={faceOf(p.name)} alt="" aria-hidden="true" />
        <div className="rc-grow">
          <div className="nameRow">
            <h2>{p.full}</h2>
            <Pill sev={track.sev}>{track.label[0]!.toUpperCase() + track.label.slice(1)}</Pill>
            {risk ? (
              <button
                type="button"
                className="rc-pillBtn"
                onClick={() => go({ screen: "safety", view: risk.id })}
              >
                <Pill sev="crit">
                  {risk.left === "overdue" ? "Risk review overdue" : `Risk review due ${risk.left}`}
                </Pill>
              </button>
            ) : null}
          </div>
          <div className="idline">
            <span>MRN {id.mrn}</span>
            <span>
              DOB {id.dob} · {id.age}y
            </span>
            <span>{id.pronouns}</span>
          </div>
        </div>
        <div className="btnRow rc-btnRow">
          <button
            type="button"
            className="btn ghost"
            onClick={() => go({ screen: "messages", patient: p.id })}
          >
            Message
          </button>
          <button type="button" className="btn primary" onClick={startNote}>
            Start note
          </button>
          {ok ? (
            <button
              type="button"
              className="btn ghost"
              onClick={() => go({ screen: "copilot", patient: "okonkwo" })}
            >
              Ask copilot
            </button>
          ) : null}
        </div>
      </div>

      <div className="ptFacts">
        <Fact k="Episode">{episode(p, index)}</Fact>
        <Fact k="Primary clinician">{clin.name}</Fact>
        <Fact k="Modality">
          {p.modality} · {p.cadence.toLowerCase()}
        </Fact>
        {ok ? (
          <>
            <Fact k="Consent on file">Treatment · 12 Feb 2026</Fact>
            <Fact k="Allergies">
              <span className="rc-allergy">Penicillin — rash</span> · 1 more
            </Fact>
          </>
        ) : (
          <>
            <Fact k="Program">{p.program}</Fact>
            <Fact k="Payer">{p.payer}</Fact>
          </>
        )}
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} idBase={ID_BASE} label="Record sections" />
      <TabPanel idBase={ID_BASE} value={tab}>
        <Panel ctx={ctx} />
      </TabPanel>

      <Sheet
        open={sheet?.kind === "new-note"}
        onClose={close}
        title="New progress note"
        sub={`${p.full} · ${stamp()}`}
        footer={
          <>
            <button type="button" className="btn ghost" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={!draftText.trim()}
              onClick={saveDraft}
            >
              Save draft
            </button>
          </>
        }
      >
        <label className="field">
          Note
          <textarea
            rows={10}
            value={draftText}
            placeholder="Subjective, observations, plan…"
            onChange={(e) => setDraftText(e.target.value)}
          />
        </label>
        <p className="rc-soft">Drafts stay unsigned and visible only to you until signed.</p>
      </Sheet>

      <Sheet
        open={sheet?.kind === "note"}
        onClose={close}
        title={sheet?.kind === "note" ? sheet.note.type : ""}
        sub={sheet?.kind === "note" ? `${p.full} · ${sheet.note.date}` : undefined}
        footer={
          sheet?.kind === "note" ? <NoteSheetFooter note={sheet.note} onClose={close} /> : null
        }
      >
        {sheet?.kind === "note" ? (
          <>
            <div className="sheetSection">
              <KV k="Date">{sheet.note.date}</KV>
              <KV k="Clinician">{sheet.note.clinician}</KV>
              <KV k="Status">
                {sheet.note.status === "draft"
                  ? "Draft"
                  : sheet.note.status === "unsigned" && !store.signed[sheet.note.id]
                    ? `Unsigned · ${sheet.note.age}`
                    : "Signed"}
              </KV>
            </div>
            <div className="sheetSection">
              <h4>Note</h4>
              <p className="rc-body">{sheet.note.body || "Empty draft."}</p>
            </div>
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "doc"}
        onClose={close}
        title={sheet?.kind === "doc" ? sheet.doc.title : ""}
        sub={sheet?.kind === "doc" ? `${p.full} · ${sheet.doc.status}` : undefined}
        footer={
          <button type="button" className="btn ghost" onClick={close}>
            Close
          </button>
        }
      >
        {sheet?.kind === "doc" ? (
          <>
            <div className="rc-page" aria-hidden="true">
              <b>{sheet.doc.title}</b>
              <span>Northwind Health · {p.full}</span>
              {[92, 84, 96, 70, 88, 60].map((w, i) => (
                <i key={i} style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="sheetSection">
              <h4>Details</h4>
              {sheet.doc.meta.map(([k, v]) => (
                <KV key={k} k={k}>
                  {v}
                </KV>
              ))}
            </div>
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={Boolean(detail)}
        onClose={close}
        title={detail?.label ?? ""}
        sub={p.full}
        footer={
          <button type="button" className="btn ghost" onClick={close}>
            Close
          </button>
        }
      >
        {detail ? (
          <div className="sheetSection">
            {detail.rows.map(([k, v]) => (
              <KV key={k} k={k}>
                {v}
              </KV>
            ))}
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "access"}
        onClose={close}
        title="Request access"
        sub="Substance use · 42 CFR Part 2"
        footer={
          <>
            <button type="button" className="btn ghost" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={!justification.trim()}
              onClick={submitAccess}
            >
              Submit request
            </button>
          </>
        }
      >
        <p className="rc-soft">
          The privacy officer reviews each request. Access is logged against your name and this
          reason.
        </p>
        <div className="field">
          <span aria-hidden="true">Reason</span>
          <Select<Reason> label="Reason" value={reason} onChange={setReason} options={REASONS} />
        </div>
        <label className="field">
          Justification
          <textarea
            rows={5}
            value={justification}
            placeholder="Why this section is needed for care now"
            onChange={(e) => setJustification(e.target.value)}
          />
        </label>
      </Sheet>
    </div>
  );
}
