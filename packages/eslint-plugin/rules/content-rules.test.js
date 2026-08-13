/**
 * Tests for the two content rules.
 *
 * The valid cases matter more than the invalid ones here. Both rules were first
 * written broadly enough to fire on separators, React keys, and discriminated
 * union comparisons — noise that would have trained everyone to ignore them.
 * Every `valid` entry below is a pattern taken from the existing catalogue that
 * the first draft flagged and should not have.
 */

import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";
import noAbsencePlaceholder from "./no-absence-placeholder.js";
import noAmbiguousClinicalCopy from "./no-ambiguous-clinical-copy.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-absence-placeholder", noAbsencePlaceholder, {
  valid: [
    // A separator between two rendered things. This is typography, not a
    // missing value — absent-value.tsx and care-team.tsx both do it correctly.
    { code: 'const a = <span>— {explanation}</span>;' },
    { code: 'const a = <li>{member.name} — {member.role ?? "Role not recorded"}</li>;' },

    // A React key never reaches a reader.
    { code: 'const a = <span key={`${coding.system ?? "?"}-${i}`}>x</span>;' },

    // A comparison, not a render.
    { code: 'const a = <span aria-live={state === "-" ? "assertive" : "polite"}>x</span>;' },

    // className is not copy.
    { code: 'const a = <span className={dense ? "-mx-1" : "mx-0"}>x</span>;' },

    // Stating the absence is the whole point.
    { code: 'const a = <span>{start ?? "Start not recorded"}</span>;' },
    { code: 'const a = <AbsentValue field="Potassium" reason={o.dataAbsentReason} />;' },

    // Outside JSX entirely — a default in plain code is not a rendered value.
    { code: 'const label = raw ?? "N/A";' },

    // Explicitly allowed.
    {
      code: 'const a = <span>{value ?? "—"}</span>;',
      options: [{ allow: ["—"] }],
    },
  ],

  invalid: [
    // The two bugs this rule found in the catalogue on introduction.
    {
      code: 'const a = <span>{start?.slice(0, 10) ?? "—"}</span>;',
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: 'const a = <span>{coding.code ?? "—"}</span>;',
      errors: [{ messageId: "placeholder" }],
    },

    // The same defect spelled other ways.
    {
      code: 'const a = <td>{value ?? "N/A"}</td>;',
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: 'const a = <td>{value ? value : "--"}</td>;',
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: 'const a = <span>{count || "None"}</span>;',
      errors: [{ messageId: "placeholder" }],
    },
    // Prose attributes are read aloud, so they count. ("Unknown" is not a
    // placeholder — it is a word, and it belongs to no-ambiguous-clinical-copy.)
    {
      code: 'const a = <span aria-label={name ?? "N/A"} />;',
      errors: [{ messageId: "placeholder" }],
    },
  ],
});

ruleTester.run("no-ambiguous-clinical-copy", noAmbiguousClinicalCopy, {
  valid: [
    // Enum-ish prop values are not copy — this is the status-badge test that
    // the first draft flagged.
    { code: 'const a = <StatusBadge tone="normal">Label</StatusBadge>;' },
    { code: 'const a = <StatusBadge tone="unknown">Label</StatusBadge>;' },

    // A discriminated-union comparison, not copy. unsaved-guard does this six
    // times and every one was a false positive in the first draft.
    { code: 'const a = <span aria-live={state === "failed" ? "assertive" : "polite"} />;' },
    { code: 'const a = <span className={state === "failed" ? "text-red" : "text-grey"} />;' },

    // The corrected wording.
    { code: 'const a = <span>Not interpreted</span>;' },
    { code: 'const a = <span>Within range</span>;' },
    {
      code: 'const a = <ActionGate consequence="Discharges Ada Lovelace and closes the encounter." />;',
    },

    // Prose about the rule, in a plain string outside JSX.
    { code: 'const doc = "Are you sure? is not a confirmation.";' },
  ],

  invalid: [
    {
      code: 'const a = <span>Normal</span>;',
      errors: [{ messageId: "ambiguous" }],
    },
    {
      code: 'const a = <ConfirmDialog title="Are you sure?" />;',
      errors: [{ messageId: "ambiguous" }],
    },
    {
      code: 'const a = <p>Something went wrong</p>;',
      errors: [{ messageId: "ambiguous" }],
    },
    {
      code: 'const a = <span>{status ?? "Unknown"}</span>;',
      errors: [{ messageId: "ambiguous" }],
    },
  ],
});
