"use client";

/**
 * The Clinical Status demos, live — the previews behind the examples on its
 * page. Every step comes from the registry's own scale table, so a demo can
 * never show a step the component would refuse.
 */

import * as React from "react";
import { ClinicalStatus, StatusLegend } from "@/registry/zoblocks/clinical-status/clinical-status";
import {
  SCALES,
  SCALE_NAMES,
  fromInterpretation,
  type ScaleName,
} from "@/lib/zoblocks-clinical-status";
import { observationPotassiumCritical } from "@zoblocks/fixtures";

function Caption({ children }: { children: React.ReactNode }) {
  return <p className="m-0 font-mono text-xs text-graphite">{children}</p>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* From the record                                                      */
/* ------------------------------------------------------------------ */

export function CriticalityFromFhir() {
  const code = observationPotassiumCritical.interpretation?.[0]?.coding?.[0]?.code;
  const step = fromInterpretation(code);
  return step ? (
    <ClinicalStatus scale="criticality" step={step} qualifier="resulted 41 minutes ago" />
  ) : null;
}

export function RestrictedIsNotAbsent() {
  return (
    <Row>
      <ClinicalStatus scale="access" step="part-2" />
      <ClinicalStatus scale="access" step="restricted" />
    </Row>
  );
}

/* ------------------------------------------------------------------ */
/* Vocabulary                                                           */
/* ------------------------------------------------------------------ */

export function NineScales() {
  return (
    <div className="grid w-full gap-4">
      {SCALE_NAMES.map((name: ScaleName) => (
        <div key={name} className="grid gap-1.5">
          <Caption>{SCALES[name].label}</Caption>
          <Row>
            {SCALES[name].steps.map((step) => (
              <ClinicalStatus key={step.id} scale={name} step={step.id} />
            ))}
          </Row>
        </div>
      ))}
    </div>
  );
}

export function HueRemoved() {
  return (
    <div className="grid gap-3.5">
      {[false, true].map((flat) => (
        <div key={String(flat)} className="grid gap-1.5">
          <Caption>{flat ? "Desaturated" : "In colour"}</Caption>
          <div className={flat ? "grayscale" : undefined}>
            <Row>
              <ClinicalStatus scale="criticality" step="critical" />
              <ClinicalStatus scale="criticality" step="high" />
              <ClinicalStatus scale="criticality" step="normal" />
              <ClinicalStatus scale="criticality" step="not-assessed" />
              <ClinicalStatus scale="access" step="restricted" />
              <ClinicalStatus scale="result-status" step="preliminary" />
            </Row>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Presentations                                                        */
/* ------------------------------------------------------------------ */

export function ThreeShapes() {
  return (
    <div className="grid gap-4">
      <Row>
        <ClinicalStatus scale="criticality" step="critical" />
        <ClinicalStatus scale="criticality" step="critical" density="compact" />
        <ClinicalStatus scale="criticality" step="critical" shape="dot" />
        <ClinicalStatus scale="criticality" step="critical" shape="affix" />
      </Row>
      <StatusLegend scale="criticality" />
    </div>
  );
}

const RESULTS = [
  ["Sodium", "139 mmol/L", "final"],
  ["Potassium", "6.8 mmol/L", "final"],
  ["TSH", "3.1 mIU/L", "preliminary"],
  ["HbA1c", "52 mmol/mol", "corrected"],
] as const;

export function GridAffix() {
  return (
    <table className="border-collapse text-[13px]">
      <tbody>
        {RESULTS.map(([analyte, value, step]) => (
          <tr key={analyte} className="border-b border-rule last:border-0">
            <td className="py-1.5 pr-4 text-graphite">{analyte}</td>
            <td className="py-1.5 pr-4 font-mono tabular-nums text-ink">{value}</td>
            <td className="py-1.5">
              <ClinicalStatus scale="result-status" step={step} shape="affix" density="compact" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/* Registers                                                            */
/* ------------------------------------------------------------------ */

export function PatientRegister() {
  return (
    <Row>
      <ClinicalStatus scale="result-status" step="entered-in-error" />
      <ClinicalStatus scale="result-status" step="entered-in-error" audience="patient" />
    </Row>
  );
}

export function BothRegisters() {
  return (
    <div className="grid gap-3.5">
      {(["clinician", "patient"] as const).map((audience) => (
        <div key={audience} className="grid gap-1.5">
          <Caption>{audience}</Caption>
          <Row>
            <ClinicalStatus scale="result-status" step="entered-in-error" audience={audience} />
            <ClinicalStatus scale="result-status" step="preliminary" audience={audience} />
            <ClinicalStatus scale="data-quality" step="self-reported" audience={audience} />
            <ClinicalStatus scale="access" step="part-2" audience={audience} />
            <ClinicalStatus scale="criticality" step="critical" audience={audience} />
          </Row>
        </div>
      ))}
    </div>
  );
}
