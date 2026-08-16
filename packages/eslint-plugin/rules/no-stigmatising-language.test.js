import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import rule from "./no-stigmatising-language.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe("no-stigmatising-language", () => {
  it("flags stigmatising terms and exempts quoted speech", () => {
    ruleTester.run("no-stigmatising-language", rule, {
      valid: [
        // The person-first alternatives, which is what the rule is steering to.
        'const label = "Person with a substance use disorder";',
        'const label = "Died by suicide";',
        'const label = "Not taking as prescribed";',
        'const label = "Person with schizophrenia";',

        // A patient's own words. Rewriting a quotation falsifies a record.
        'const note = `Patient states "I am just an addict" repeatedly.`;',
        "const note = 'The client said \"I have been clean for a year\".';",

        // Ambiguous words outside a clinical string stay quiet, or the rule
        // becomes the one everybody disables.
        'const msg = "Clean build completed";',
        'const msg = "The dirty flag is set";',
        'const css = "manipulative";',

        // Allowlisted by a product with a reason.
        {
          code: 'const label = "addict";',
          options: [{ allow: ["addict"] }],
        },

        // Not a string at all.
        "const n = 42;",
        'const s = "";',
      ],

      invalid: [
        {
          code: 'const label = "The patient is an addict.";',
          errors: [
            {
              messageId: "stigmatising",
              // Both placeholders, since RuleTester hydrates the whole message:
              // the alternative is always offered, never just the ban.
              data: { term: "addict", prefer: "person with a substance use disorder" },
            },
          ],
        },
        {
          code: 'const label = "Patient committed suicide in 2019.";',
          errors: 1,
        },
        {
          code: 'const label = "Non-compliant with medication.";',
          errors: 1,
        },
        {
          code: 'const label = "Known drug seeking behaviour.";',
          errors: 1,
        },
        {
          code: 'const label = "Frequent flyer in the emergency department.";',
          errors: 1,
        },
        {
          code: 'const label = "The mentally ill are over-represented.";',
          errors: 1,
        },
        // Context-sensitive terms fire once the string is clinical.
        {
          code: 'const label = "Patient has been clean for six months.";',
          errors: 1,
        },
        {
          code: 'const label = "Urine toxicology was dirty.";',
          errors: 1,
        },
        // Template literals and JSX text are covered too.
        {
          code: "const label = `The patient is an addict`;",
          errors: 1,
        },
        {
          code: "const el = <p>The patient is an addict.</p>;",
          errors: 1,
        },
        // One report per term per string, not one per occurrence.
        {
          code: 'const label = "The addict was treated. The addict left.";',
          errors: 1,
        },
        // Two different terms is two reports.
        {
          code: 'const label = "The addict was non-compliant.";',
          errors: 2,
        },
        // Flagged outside the quotation, exempt inside it.
        {
          code: 'const note = `The addict said "I am an addict".`;',
          errors: 1,
        },
        // Host-supplied additions.
        {
          code: 'const label = "The patient is a malingerer.";',
          options: [{ additionalTerms: [["malingerer", "describe the specific findings"]] }],
          errors: 1,
        },
      ],
    });
  });
});
