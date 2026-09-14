import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import {
  noDisabledWithReason,
  switchAuditNeedsNow,
  switchNeedsCommitStrategy,
  switchNotForQuestions,
} from "./switch-usage.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe("switch-not-for-questions", () => {
  it("flags a question-shaped label and leaves the segmented fix alone", () => {
    ruleTester.run("switch-not-for-questions", switchNotForQuestions, {
      valid: [
        // A state, not a question. This is what a switch is for.
        { code: '<Switch label="Contact precautions" />' },
        { code: '<Switch label="Nil by mouth" />' },
        // Already showing both answers.
        {
          code: '<Switch label="Does the patient have a latex allergy?" appearance="segmented" />',
        },
        // Computed labels are not guessed at.
        { code: "<Switch label={fieldLabel} />" },
        // Not our component.
        { code: '<Checkbox label="Does the patient consent?" />' },
      ],
      invalid: [
        {
          code: '<Switch label="Does the patient have a latex allergy?" />',
          errors: [{ messageId: "question" }],
        },
        {
          code: '<SwitchField label="Has an advance directive been recorded?" />',
          errors: [{ messageId: "question" }],
        },
        // An opener without a question mark still reads as a question.
        {
          code: '<Switch label="Is an interpreter required" />',
          errors: [{ messageId: "question" }],
        },
      ],
    });
  });
});

describe("switch-needs-commit-strategy", () => {
  it("requires an explicit strategy inside a form and nowhere else", () => {
    ruleTester.run("switch-needs-commit-strategy", switchNeedsCommitStrategy, {
      valid: [
        { code: '<Switch label="Contact precautions" />' },
        { code: '<Form><Switch label="Notify by SMS" commit="deferred" /></Form>' },
        { code: '<Form><Switch label="Notify by SMS" commit="instant" /></Form>' },
        { code: '<form><Switch label="Notify by SMS" commit="deferred" /></form>' },
        // Namespaced members resolve through the object name.
        { code: '<Form.Item><Switch label="Notify" commit="deferred" /></Form.Item>' },
        { code: '<div><Switch label="Contact precautions" /></div>' },
      ],
      invalid: [
        {
          code: '<Form><Switch label="Notify by SMS" /></Form>',
          errors: [{ messageId: "missing" }],
        },
        {
          code: '<form><SwitchField label="Notify by SMS" /></form>',
          errors: [{ messageId: "missing" }],
        },
        {
          code: '<Form><Form.Item><Switch label="Notify" /></Form.Item></Form>',
          errors: [{ messageId: "missing" }],
        },
      ],
    });
  });
});

describe("no-disabled-with-reason", () => {
  it("rewrites disabled to readOnly when a reason was written", () => {
    ruleTester.run("no-disabled-with-reason", noDisabledWithReason, {
      valid: [
        { code: '<Switch label="Consent" readOnly lockedReason="Encounter signed." />' },
        { code: '<Switch label="Consent" disabled />' },
        { code: '<Switch label="Consent" lockedReason="Encounter signed." />' },
      ],
      invalid: [
        {
          code: '<Switch label="Consent" disabled lockedReason="Encounter signed." />',
          errors: [{ messageId: "both" }],
          output: '<Switch label="Consent" readOnly lockedReason="Encounter signed." />',
        },
        {
          // The condition is kept. A bare `readOnly` would lock the control
          // for everybody, including the people allowed to edit it.
          code: '<Switch label="Consent" disabled={!canEdit} lockedReason="Encounter signed." />',
          errors: [{ messageId: "both" }],
          output: '<Switch label="Consent" readOnly={!canEdit} lockedReason="Encounter signed." />',
        },
      ],
    });
  });
});

describe("switch-audit-needs-now", () => {
  it("requires the server clock wherever audit events are recorded", () => {
    ruleTester.run("switch-audit-needs-now", switchAuditNeedsNow, {
      valid: [
        { code: '<Switch label="Consent" onAuditEvent={record} now={serverTime} />' },
        { code: '<Switch label="Consent" />' },
        { code: '<Switch label="Consent" now={serverTime} />' },
      ],
      invalid: [
        {
          code: '<Switch label="Consent" onAuditEvent={record} />',
          errors: [{ messageId: "missing" }],
        },
        {
          code: '<SwitchField label="Consent" onAuditEvent={record} />',
          errors: [{ messageId: "missing" }],
        },
      ],
    });
  });
});
