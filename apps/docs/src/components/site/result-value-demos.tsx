"use client";

import * as React from "react";
import {
  ResultValue,
  fromObservation,
  type ResultValueData,
} from "@/registry/zoblocks/result-value/result-value";
import { observationPotassiumCritical } from "@zoblocks/fixtures";

const NOW = "2026-08-03T08:21:00Z";

export function FromFhirUnedited() {
  return <ResultValue value={fromObservation(observationPotassiumCritical)} now={NOW} />;
}

export function SevenAbsences() {
  const values: ResultValueData[] = [
    { id: "not-ordered", analyte: "HbA1c", absent: "not-ordered" },
    { id: "awaiting", analyte: "Troponin I", absent: "awaiting" },
    { id: "cancelled", analyte: "Blood culture", absent: "cancelled" },
    {
      id: "specimen-problem",
      analyte: "White blood cell count",
      absent: "specimen-problem",
      absentDetail: "Haemolysed. Recollection requested.",
    },
    { id: "declined", analyte: "Smoking status", absent: "declined" },
    { id: "masked", analyte: "Toxicology screen", absent: "masked" },
    { id: "unknown", analyte: "Magnesium", absent: "unknown" },
  ];
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {values.map((value) => (
        <ResultValue key={value.id} value={value} />
      ))}
    </div>
  );
}

export function CorrectionShowsSuperseded() {
  const value: ResultValueData = {
    id: "trop",
    versionId: "2",
    analyte: "Troponin I",
    value: 0.09,
    unit: "ng/mL",
    range: { high: 0.04 },
    status: "corrected",
    superseded: { value: "<0.04", at: "14:22 today" },
  };
  return <ResultValue value={value} now={NOW} />;
}

export function DeltaRefusedOnMethodChange() {
  const sameAssay: ResultValueData = {
    id: "tsh-same-assay",
    analyte: "TSH",
    value: 6.4,
    unit: "mIU/L",
    range: { low: 0.4, high: 4.0 },
    resultedAt: "2026-02-15T09:00:00Z",
    prior: { value: 3.1, at: "2026-02-01T09:00:00Z" },
  };
  const differentAssay: ResultValueData = {
    id: "tsh-different-assay",
    analyte: "TSH",
    value: 6.4,
    unit: "mIU/L",
    range: { low: 0.4, high: 4.0 },
    resultedAt: "2026-02-15T09:00:00Z",
    prior: { value: 3.1, at: "2026-02-01T09:00:00Z", differentMethod: true },
  };
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, opacity: 0.62 }}>Same assay — the delta prints.</span>
        <ResultValue value={sameAssay} />
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, opacity: 0.62 }}>
          Different assay — flagged, and the delta disappears entirely.
        </span>
        <ResultValue value={differentAssay} />
      </div>
    </div>
  );
}
