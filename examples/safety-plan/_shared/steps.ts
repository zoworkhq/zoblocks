import type { SafetyPlanSteps } from "@/components/zoblocks/safety-plan";

/** A complete, synthetic six-step plan in the person's own words. */
export const steps: SafetyPlanSteps = {
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
