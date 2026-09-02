"use client";

/**
 * The caseload columns, shared by the home page and the component's own page.
 *
 * Both surfaces argue about the same worklist, so both draw it the same way.
 * They used to disagree — the home page had portraits, chips and a risk meter
 * while the documentation page had plain text — and a buyer who saw the second
 * after the first reasonably concluded the first was a mock-up.
 *
 * Everything here is the *caller's* half. The grid renders whatever `cell`
 * returns and has no opinion about photographs, chips or meters; what it owns
 * is coverage, absence, provenance, sorting, selection and the end of the list.
 * That division is the whole argument, and it is easiest to see in this file:
 * this is the part a team would have written themselves.
 *
 * The class names are scoped under `.oxw` in `data-grid-demo.css`, so any
 * surface using these columns has to be inside an `.oxw` element.
 */

import * as React from "react";
import { PatientPortrait } from "@/components/site/patient-portrait";
import type { DataGridColumn } from "@/registry/oxygen/data-grid/data-grid";
import {
  CSSRS_ORDER,
  DISENGAGEMENT,
  phq9Band,
  type CaseloadRow,
} from "@/registry/oxygen/data-grid/data-grid.fixtures";

/** Portrait, name, identifier. A name is not an identifier; the row carries both. */
function Client({ row }: { row: CaseloadRow }) {
  return (
    <span className="oxw__id">
      <PatientPortrait src={row.photo} size={30} />
      <span className="oxw__idtext">
        <b>{row.name}</b>
        <span className="numeric">{row.mrn}</span>
      </span>
    </span>
  );
}

/** The C-SSRS result as a chip. The word carries it; the tint is the second cue. */
function Screen({ row }: { row: CaseloadRow }) {
  const value = row.cssrs;
  if (typeof value !== "string") return null;
  const tone = value === "Ideation with plan" ? "sev" : value === "None reported" ? "ok" : "mod";
  return <span className={`oxw__chip oxw__chip--${tone}`}>{value}</span>;
}

/**
 * The move since the last assessment, beside the score.
 *
 * A stable 18 and a climbing 18 are different clients, and a worklist showing
 * only the latest total has left the reader to remember which.
 */
function Move({ row }: { row: CaseloadRow }) {
  if (typeof row.phq9 !== "number" || row.previousPhq9 === undefined) return null;
  const move = row.phq9 - row.previousPhq9;
  if (move === 0) return null;
  const rising = move > 0;
  return (
    <span className={rising ? "oxw__up" : "oxw__down"}>
      <span aria-hidden="true">{rising ? "▲" : "▼"}</span>
      {Math.abs(move)}
      <span className="sr-only">
        {rising ? "up" : "down"} {Math.abs(move)} since the last assessment
      </span>
    </span>
  );
}

const NAME: DataGridColumn<CaseloadRow> = {
  key: "name",
  header: "Client",
  kind: "text",
  value: (row) => row.name,
  width: "15rem",
  cell: (row) => <Client row={row} />,
};

const PROGRAM: DataGridColumn<CaseloadRow> = {
  key: "program",
  header: "Program",
  kind: "status",
  // Sorted by intensity of care rather than alphabetically.
  order: ["ACT", "PHP", "IOP", "Outpatient"],
  value: (row) => row.program,
  width: "8rem",
  cell: (row) => <span className="oxw__chip oxw__chip--plain">{row.program}</span>,
};

/**
 * The instrument column, and the one place a footnote is not optional.
 *
 * The band word is the caller's: those cut points belong to the PHQ-9, and a
 * component library that shipped them would be asserting a threshold on behalf
 * of every service that installs it.
 */
const PHQ9: DataGridColumn<CaseloadRow> = {
  key: "phq9",
  header: "PHQ-9",
  kind: "measure",
  /*
   * Left-aligned though the sort is numeric.
   *
   * The value carries a band word and a delta beside it, and right-aligning
   * the group lines up the *words* while leaving the numbers ragged — which
   * defeats the one thing a ruled column is for.
   */
  align: "start",
  width: "11.5rem",
  value: (row) => row.phq9,
  footnote:
    "PHQ-9 total, 0–27. Bands are the instrument's: 10 moderate, 15 moderately severe, 20 severe.",
  cell: (row) => (
    <span className="oxw__measure">
      <span
        className={phq9Band(row.phq9) === "severe" ? "oxw__score oxw__score--hot" : "oxw__score"}
      >
        {String(row.phq9)}
      </span>
      <span className="oxw__band">{phq9Band(row.phq9)}</span>
      <Move row={row} />
    </span>
  ),
};

const SCREEN: DataGridColumn<CaseloadRow> = {
  key: "cssrs",
  header: "Risk screen",
  kind: "status",
  order: CSSRS_ORDER,
  value: (row) => row.cssrs,
  width: "12rem",
  cell: (row) => <Screen row={row} />,
};

const RISK: DataGridColumn<CaseloadRow> = {
  key: "risk",
  header: "Disengagement",
  kind: "number",
  width: "10rem",
  value: (row) => row.risk,
  derived: DISENGAGEMENT,
  cell: (row) => (
    <span className="oxw__meter">
      <span className="oxw__track" aria-hidden="true">
        <span
          className={row.risk >= 0.7 ? "oxw__fill oxw__fill--hot" : "oxw__fill"}
          style={{ width: `${Math.round(row.risk * 100)}%` }}
        />
      </span>
      <span className="numeric">{row.risk.toFixed(2)}</span>
    </span>
  ),
};

const DUE: DataGridColumn<CaseloadRow> = {
  key: "due",
  header: "Next contact",
  kind: "instant",
  align: "end",
  width: "9rem",
  value: (row) => row.due,
  cell: (row) => (
    <span className={row.due.startsWith("Today") ? "oxw__due oxw__due--now" : "oxw__due"}>
      {row.due}
    </span>
  ),
};

const CLINICIAN: DataGridColumn<CaseloadRow> = {
  key: "clinician",
  header: "Clinician",
  kind: "text",
  width: "8.5rem",
  value: (row) => row.clinician,
};

/**
 * The worklist as a supervisor uses it.
 *
 * No PHQ-9 column: the score is a filter here rather than a reading, and the
 * band word wrapped to two lines at this width, which made every row a
 * different height for no gain.
 */
export const CASELOAD_COLUMNS_WIDE: DataGridColumn<CaseloadRow>[] = [
  NAME,
  PROGRAM,
  SCREEN,
  RISK,
  DUE,
  CLINICIAN,
];

/**
 * The same worklist with the instrument in it.
 *
 * The documentation page needs the PHQ-9 column, because most of the absences
 * the component exists to draw are on it — four kinds of missing are hard to
 * demonstrate in a column that is not there.
 */
export const CASELOAD_COLUMNS_DOC: DataGridColumn<CaseloadRow>[] = [NAME, PHQ9, SCREEN, RISK, DUE];
