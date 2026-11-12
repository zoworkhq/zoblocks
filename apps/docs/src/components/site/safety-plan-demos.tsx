"use client";

import { SafetyPlan, type SafetyPlanSteps } from "@/registry/zoblocks/safety-plan/safety-plan";

const PLAN: SafetyPlanSteps = {
  warningSigns: {
    entries: [
      "Sleeping less than four hours",
      "Not answering messages for two days",
      "The thought that everyone would manage without me",
    ],
  },
  internalCoping: {
    entries: [
      "Walk to the end of the road and back",
      "Cold water on my wrists",
      "Four in, six out, ten times",
    ],
  },
  distractions: {
    entries: ["The cafe on Bell Street before 11am", "The Sunday running group"],
  },
  supportContacts: {
    contacts: [
      { name: "Priya", detail: "Sister", availability: "Any time" },
      { name: "Marcus", detail: "Flatmate", availability: "Home most evenings" },
    ],
  },
  professionals: {
    contacts: [
      { name: "988", detail: "Suicide & Crisis Lifeline", availability: "24 hours" },
      { name: "Rachel Okafor", detail: "Your therapist", availability: "Mon–Thu, 9–5" },
      { name: "County crisis team", detail: "555 0148", availability: "24 hours" },
    ],
  },
  environment: {
    entries: ["Priya is holding the spare keys to the garage"],
  },
};

export function CompletePatientPlan() {
  return <SafetyPlan steps={PLAN} revisedAt="2026-08-11" headingLevel={3} />;
}

export function UnfinishedPlan() {
  return (
    <SafetyPlan
      steps={{
        warningSigns: PLAN.warningSigns,
        professionals: PLAN.professionals,
      }}
      revisedAt="2026-08-11"
      headingLevel={3}
    />
  );
}

export function EmptyPlan() {
  return <SafetyPlan steps={{}} headingLevel={3} />;
}

export function ClinicianEditing() {
  return (
    <SafetyPlan
      steps={PLAN}
      revisedAt="2026-08-11"
      headingLevel={3}
      pinCrisisStep={false}
      density="standard"
    />
  );
}
