"use client";

/**
 * Patients — the directory.
 *
 * The caseload answers "who needs me"; this answers "where is that person".
 * So it defaults to surname order, searches date of birth as well as name,
 * and a referral made here shows up at once, before it has a record behind it.
 */

import * as React from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import {
  CLINICIANS,
  ME,
  NOW,
  PATIENTS,
  RISKS,
  TRACK,
  byAttention,
  faceOf,
  patient,
  type ClinicianId,
  type Patient,
  type Program,
} from "../data";
import {
  Chips,
  ClinicianAvatar,
  EmptyState,
  KV,
  Pager,
  PatientLink,
  ScreenBody,
  ScreenHead,
  SearchField,
  Segmented,
  Select,
  Sheet,
} from "../ui";
import { useNav } from "../shell";
import { Face, Pill, Status } from "../../kit";
import { hasUpcoming, nextLabel, nextOrder } from "./caseload";

type Filter = "all" | "mine" | "new" | "risk";
type Sort = "surname" | "next" | "attention";
type View = "cards" | "list";

interface Referral {
  id: string;
  first: string;
  last: string;
  dob: string;
  age: number;
  program: Program;
  clinician: ClinicianId;
  reason: string;
  mrn: string;
}

/** A directory row: a patient with a record, or a referral still waiting for one. */
type Row = { kind: "patient"; p: Patient } | { kind: "referral"; r: Referral };

const PAGE = 24;
const RECENT = ["okonkwo", "almeida", "whitfield"] as const;
const PROGRAMS: readonly Program[] = ["Adult depression", "Anxiety", "Perinatal", "Young adult"];

const SORT_OPTIONS: readonly { value: Sort; label: string }[] = [
  { value: "surname", label: "Surname A–Z" },
  { value: "next", label: "Next contact" },
  { value: "attention", label: "Attention" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "1976-04-26" → "26 Apr 1976". */
function dobLabel(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1] ?? ""} ${y}`;
}

/** Age on the demo's today, from an ISO date. */
function ageOn(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = NOW.iso.slice(0, 10).split("-").map(Number) as [number, number, number];
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}

const initials = (r: Referral) => `${r.first[0] ?? ""}${r.last[0] ?? ""}`.toUpperCase();

const surnameOf = (row: Row) =>
  row.kind === "patient" ? row.p.full : `${row.r.last}, ${row.r.first}`;

export function PatientsScreen() {
  const { go, store, toast } = useNav();
  const uid = React.useId();
  const [q, setQRaw] = React.useState("");
  const [filter, setFilterRaw] = React.useState<Filter>("all");
  const [sort, setSortRaw] = React.useState<Sort>("surname");
  const [page, setPage] = React.useState(0);
  // Any change to what is shown, or its order, starts again at the first page.
  const setQ = (v: string) => {
    setQRaw(v);
    setPage(0);
  };
  const setFilter = (v: Filter) => {
    setFilterRaw(v);
    setPage(0);
  };
  const setSort = (v: Sort) => {
    setSortRaw(v);
    setPage(0);
  };
  const [view, setView] = React.useState<View>("cards");
  const [referrals, setReferrals] = React.useState<Referral[]>([]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [openRef, setOpenRef] = React.useState<Referral | null>(null);

  const openRisk = React.useMemo(
    () => new Set(RISKS.filter((r) => !store.resolved[r.id]).map((r) => r.patient)),
    [store.resolved],
  );

  const needle = q.trim().toLowerCase();

  const matches = React.useCallback(
    (row: Row) => {
      if (!needle) return true;
      const hay =
        row.kind === "patient"
          ? [row.p.full, row.p.name, row.p.mrn, row.p.dob, dobLabel(row.p.dob)]
          : [
              `${row.r.last}, ${row.r.first}`,
              `${row.r.first} ${row.r.last}`,
              row.r.mrn,
              row.r.dob,
              dobLabel(row.r.dob),
            ];
      return hay.some((h) => h.toLowerCase().includes(needle));
    },
    [needle],
  );

  const all = React.useMemo<Row[]>(
    () => [
      ...referrals.map((r) => ({ kind: "referral" as const, r })),
      ...PATIENTS.map((p) => ({ kind: "patient" as const, p })),
    ],
    [referrals],
  );

  const test: Record<Filter, (row: Row) => boolean> = React.useMemo(
    () => ({
      all: () => true,
      mine: (row) => (row.kind === "patient" ? row.p.clinician : row.r.clinician) === ME,
      new: (row) => row.kind === "referral" || row.p.isNew,
      risk: (row) => row.kind === "patient" && openRisk.has(row.p.id),
    }),
    [openRisk],
  );

  const searched = React.useMemo(() => all.filter(matches), [all, matches]);

  const rows = React.useMemo(() => {
    const list = searched.filter(test[filter]);
    const refs = list.filter((r) => r.kind === "referral");
    const pts = list.flatMap((r) => (r.kind === "patient" ? [r.p] : []));
    if (sort === "surname") pts.sort((a, b) => a.full.localeCompare(b.full));
    else if (sort === "next")
      pts.sort((a, b) => nextOrder(a) - nextOrder(b) || a.full.localeCompare(b.full));
    else pts.sort(byAttention);
    // Referrals lead: they are the rows someone has just made and is looking for.
    return [...refs, ...pts.map((p) => ({ kind: "patient" as const, p }))] as Row[];
  }, [searched, test, filter, sort]);

  const count = (f: Filter) => searched.filter(test[f]).length;

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const at = Math.min(page, pages - 1);
  const shown = React.useMemo(() => rows.slice(at * PAGE, (at + 1) * PAGE), [rows, at]);

  // Built from the current page only, so a letter never heads an empty group.
  const groups = React.useMemo(() => {
    if (sort !== "surname") return [{ key: "all", label: null as string | null, rows: shown }];
    const out: { key: string; label: string | null; rows: Row[] }[] = [];
    for (const row of shown) {
      const key = row.kind === "referral" ? "referrals" : (surnameOf(row)[0] ?? "#").toUpperCase();
      let g = out[out.length - 1];
      if (!g || g.key !== key) {
        g = { key, label: key === "referrals" ? "New referrals" : key, rows: [] };
        out.push(g);
      }
      g.rows.push(row);
    }
    return out;
  }, [shown, sort]);

  const clear = () => {
    setQ("");
    setFilter("all");
  };

  const total = PATIENTS.length + referrals.length;

  const create = (r: Omit<Referral, "id" | "mrn" | "age">) => {
    const n = referrals.length + 1;
    const ref: Referral = {
      ...r,
      id: `ref-${n}`,
      mrn: `40-9${String(n).padStart(2, "0")}-${String(100 + n * 17).padStart(3, "0")}`,
      age: ageOn(r.dob),
    };
    setReferrals((list) => [ref, ...list]);
    setQ("");
    setFilter("all");
    setFormOpen(false);
    toast(`Referral created for ${r.first} ${r.last}`);
  };

  return (
    <>
      <ScreenHead
        title="Patients"
        sub={`${PATIENTS.length} in care · ${Object.keys(CLINICIANS).length} clinicians`}
        actions={
          <button type="button" className="btn primary sm" onClick={() => setFormOpen(true)}>
            <Plus aria-hidden="true" size={14} strokeWidth={1.8} />
            New referral
          </button>
        }
      />
      <ScreenBody>
        <section className="pd-recent" aria-labelledby={`${uid}-recent`}>
          <h3 id={`${uid}-recent`}>Recently viewed</h3>
          <ul>
            {RECENT.map((id) => {
              const p = patient(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    className="pd-recentChip"
                    onClick={() => go({ screen: "record", patient: id })}
                  >
                    <Face name={p.name} src={faceOf(p.name)} size={22} />
                    <span>{p.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="toolbar pd-toolbar">
          <div className="pd-search">
            <SearchField
              value={q}
              onChange={setQ}
              label="Search by name, MRN or date of birth"
              placeholder="Name, MRN or DOB"
            />
          </div>
          <Chips
            label="Show"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: count("all") },
              { value: "mine", label: "My patients", count: count("mine") },
              { value: "new", label: "New this month", count: count("new") },
              { value: "risk", label: "Open risk", count: count("risk") },
            ]}
          />
          <div className="pd-right">
            <Select label="Sort by" value={sort} onChange={setSort} options={SORT_OPTIONS} />
            <div className="pd-view">
              <Segmented
                label="Layout"
                value={view}
                onChange={setView}
                options={[
                  { value: "cards", label: "Cards" },
                  { value: "list", label: "List" },
                ]}
              />
              <span className="pd-viewIc" aria-hidden="true">
                {view === "cards" ? (
                  <LayoutGrid size={14} strokeWidth={1.7} />
                ) : (
                  <List size={14} strokeWidth={1.7} />
                )}
              </span>
            </div>
          </div>
        </div>

        <p className="pd-count" aria-live="polite">
          Showing <b className="mono">{rows.length}</b> of <span className="mono">{total}</span>
        </p>

        {rows.length === 0 ? (
          <div className="panel">
            <EmptyState
              title="No patients match"
              action={
                <button type="button" className="btn ghost sm" onClick={clear}>
                  Clear search and filters
                </button>
              }
            >
              {needle ? `Nothing for “${q.trim()}”.` : "Nobody in this group right now."}
            </EmptyState>
          </div>
        ) : view === "cards" ? (
          <section className="pd-cards" aria-label="Patients">
            <div className="pd-grid">
              {groups.map((g) => (
                <React.Fragment key={g.key}>
                  {g.label ? <h3 className="pd-letter">{g.label}</h3> : null}
                  {g.rows.map((row) =>
                    row.kind === "patient" ? (
                      <PatientCard
                        key={row.p.id}
                        p={row.p}
                        risk={openRisk.has(row.p.id)}
                        onOpen={() => go({ screen: "record", patient: row.p.id })}
                      />
                    ) : (
                      <ReferralCard key={row.r.id} r={row.r} onOpen={() => setOpenRef(row.r)} />
                    ),
                  )}
                </React.Fragment>
              ))}
            </div>
            {pages > 1 ? (
              <div className="pd-pager">
                <Pager page={at} pages={pages} onPage={setPage} total={rows.length} size={PAGE} />
              </div>
            ) : null}
          </section>
        ) : (
          <section className="panel" aria-label="Patients">
            <div className="dtScroll">
              <table className="dt pd-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date of birth</th>
                    <th>Program</th>
                    <th>Clinician</th>
                    <th>Next contact</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row) =>
                    row.kind === "patient" ? (
                      <PatientRow key={row.p.id} p={row.p} risk={openRisk.has(row.p.id)} />
                    ) : (
                      <tr key={row.r.id}>
                        <td>
                          <button
                            type="button"
                            className="ptLink"
                            onClick={() => setOpenRef(row.r)}
                          >
                            <span className="pd-init sm" aria-hidden="true">
                              {initials(row.r)}
                            </span>
                            <span className="ptLinkText">
                              <span className="ptLinkName">
                                {row.r.last}, {row.r.first}
                              </span>
                              <span className="ptLinkSub mono">{row.r.mrn}</span>
                            </span>
                          </button>
                        </td>
                        <td className="mono">
                          {dobLabel(row.r.dob)} <span className="pd-dim">· {row.r.age}</span>
                        </td>
                        <td className="pd-dim">{row.r.program}</td>
                        <td>
                          <Clin id={row.r.clinician} />
                        </td>
                        <td className="pd-none">Intake not booked</td>
                        <td>
                          <Status sev="unk">referral · awaiting intake</Status>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
            {pages > 1 ? (
              <Pager page={at} pages={pages} onPage={setPage} total={rows.length} size={PAGE} />
            ) : null}
          </section>
        )}
      </ScreenBody>

      <ReferralForm open={formOpen} onClose={() => setFormOpen(false)} onCreate={create} />

      <Sheet
        open={openRef !== null}
        onClose={() => setOpenRef(null)}
        title={openRef ? `${openRef.last}, ${openRef.first}` : "Referral"}
        sub="Referral · awaiting intake"
        footer={
          <>
            <button type="button" className="btn ghost sm" onClick={() => setOpenRef(null)}>
              Close
            </button>
            <button
              type="button"
              className="btn primary sm"
              onClick={() => {
                if (openRef)
                  toast(`Intake request sent to scheduling for ${openRef.first} ${openRef.last}`);
                setOpenRef(null);
              }}
            >
              Book intake
            </button>
          </>
        }
      >
        {openRef ? (
          <div>
            <KV k="MRN">
              <span className="mono">{openRef.mrn}</span>
            </KV>
            <KV k="Date of birth">
              <span className="mono">{dobLabel(openRef.dob)}</span> · {openRef.age}
            </KV>
            <KV k="Program">{openRef.program}</KV>
            <KV k="Clinician">{CLINICIANS[openRef.clinician].name}</KV>
            <KV k="Referred">{NOW.day}</KV>
            <KV k="Reason">{openRef.reason || "Not given"}</KV>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}

/* --------------------------------------------------------------- pieces */

function Clin({ id }: { id: ClinicianId }) {
  return (
    <span className="pd-clin">
      <ClinicianAvatar id={id} size={20} />
      {CLINICIANS[id].short}
    </span>
  );
}

function PatientCard({ p, risk, onOpen }: { p: Patient; risk: boolean; onOpen: () => void }) {
  const t = TRACK[p.track];
  return (
    <button type="button" className="pd-card" onClick={onOpen}>
      <span className="pd-cardHead">
        <Face name={p.name} src={faceOf(p.name)} size={40} />
        <span className="pd-cardId">
          <span className="pd-name">{p.full}</span>
          <span className="pd-meta mono">
            {p.mrn} · {p.age} · {p.pronouns.toLowerCase()}
          </span>
        </span>
      </span>
      <span className="pd-prog">{p.program}</span>
      <span className="pd-cardRows">
        <span className="pd-cardRow">
          <span className="pd-k">Clinician</span>
          <Clin id={p.clinician} />
        </span>
        <span className="pd-cardRow">
          <span className="pd-k">Next</span>
          <span className={hasUpcoming(p) ? "mono pd-v" : "pd-none"}>{nextLabel(p)}</span>
        </span>
      </span>
      <span className="pd-cardFoot">
        <Status sev={t.sev}>{t.label}</Status>
        {risk ? <Pill sev="crit">Risk follow-up</Pill> : null}
      </span>
    </button>
  );
}

function ReferralCard({ r, onOpen }: { r: Referral; onOpen: () => void }) {
  return (
    <button type="button" className="pd-card pd-ref" onClick={onOpen}>
      <span className="pd-cardHead">
        <span className="pd-init" aria-hidden="true">
          {initials(r)}
        </span>
        <span className="pd-cardId">
          <span className="pd-name">
            {r.last}, {r.first}
          </span>
          <span className="pd-meta mono">
            {r.mrn} · {r.age}
          </span>
        </span>
      </span>
      <span className="pd-prog">{r.program}</span>
      <span className="pd-cardRows">
        <span className="pd-cardRow">
          <span className="pd-k">Clinician</span>
          <Clin id={r.clinician} />
        </span>
        <span className="pd-cardRow">
          <span className="pd-k">Next</span>
          <span className="pd-none">Intake not booked</span>
        </span>
      </span>
      <span className="pd-cardFoot">
        <Pill sev="low">Referral · awaiting intake</Pill>
      </span>
    </button>
  );
}

function PatientRow({ p, risk }: { p: Patient; risk: boolean }) {
  const t = TRACK[p.track];
  return (
    <tr>
      <td>
        <PatientLink p={p} size={24} sub={<span className="mono">{p.mrn}</span>} />
      </td>
      <td className="mono">
        {dobLabel(p.dob)} <span className="pd-dim">· {p.age}</span>
      </td>
      <td className="pd-dim">{p.program}</td>
      <td>
        <Clin id={p.clinician} />
      </td>
      <td className={hasUpcoming(p) ? "mono" : "pd-none"}>{nextLabel(p)}</td>
      <td>
        <span className="pd-statusCell">
          <Status sev={t.sev}>{t.label}</Status>
          {risk ? <Pill sev="crit">Risk follow-up</Pill> : null}
        </span>
      </td>
    </tr>
  );
}

function ReferralForm({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (r: Omit<Referral, "id" | "mrn" | "age">) => void;
}) {
  const formId = React.useId();
  const [first, setFirst] = React.useState("");
  const [last, setLast] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [program, setProgram] = React.useState<Program>("Adult depression");
  const [clinician, setClinician] = React.useState<ClinicianId>(ME);
  const [reason, setReason] = React.useState("");

  const ready = first.trim() !== "" && last.trim() !== "" && /^\d{4}-\d{2}-\d{2}$/.test(dob);

  const reset = () => {
    setFirst("");
    setLast("");
    setDob("");
    setProgram("Adult depression");
    setClinician(ME);
    setReason("");
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New referral"
      sub="Creates a directory entry. Intake is booked separately."
      footer={
        <>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn primary sm" disabled={!ready}>
            Create referral
          </button>
        </>
      }
    >
      <form
        id={formId}
        className="pd-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ready) return;
          onCreate({
            first: first.trim(),
            last: last.trim(),
            dob,
            program,
            clinician,
            reason: reason.trim(),
          });
          reset();
        }}
      >
        <div className="pd-pair">
          <label className="field">
            First name
            <input
              type="text"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              autoComplete="off"
              required
            />
          </label>
          <label className="field">
            Last name
            <input
              type="text"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              autoComplete="off"
              required
            />
          </label>
        </div>
        <label className="field">
          Date of birth
          <input
            type="date"
            value={dob}
            max={NOW.iso.slice(0, 10)}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </label>
        <div className="field">
          <span aria-hidden="true">Program</span>
          <Select
            label="Program"
            value={program}
            onChange={setProgram}
            options={PROGRAMS.map((v) => ({ value: v, label: v }))}
          />
        </div>
        <div className="field">
          <span aria-hidden="true">Clinician</span>
          <Select
            label="Clinician"
            value={clinician}
            onChange={setClinician}
            options={(Object.keys(CLINICIANS) as ClinicianId[]).map((id) => ({
              value: id,
              label: CLINICIANS[id].name,
            }))}
          />
        </div>
        <label className="field">
          Reason for referral
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Presenting concern, referrer, urgency"
          />
        </label>
        {!ready ? <p className="pd-hint">Names and date of birth are required.</p> : null}
      </form>
    </Sheet>
  );
}
