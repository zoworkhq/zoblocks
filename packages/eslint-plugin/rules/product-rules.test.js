/**
 * Tests for the two rules that govern our own product surfaces.
 *
 * As with `content-rules.test.js`, the valid cases carry the weight. Both
 * rules were first written broadly enough to fire on Tailwind class lists, on
 * prose where the number belonged to something else, and on demo labels that
 * describe a curated panel rather than a total. Every `valid` entry below is a
 * string taken from the repository that an earlier draft flagged and should
 * not have — and each one, left in, would have been the reason somebody turned
 * the rule off.
 *
 * The `invalid` cases are the real defects, verbatim from the audit that
 * produced the rules.
 */

import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";
import noHardcodedCount from "./no-hardcoded-count.js";
import noVagueFailure from "./no-vague-failure.js";

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

ruleTester.run("no-hardcoded-count", noHardcodedCount, {
  valid: [
    // The fix the rule exists to produce.
    { code: "const d = `${CATALOG.length} components typed to FHIR R4`;" },
    { code: "const a = <p>{CATALOG.length} components, at the size you would use them.</p>;" },
    { code: "const d = `${component.states.length} states`;" },

    // A Tailwind class list. `z-10 inline-flex items-center` parsed as
    // "10 … items" until the shape test replaced the punctuation test, and
    // `gap-1.5` is the token that broke the first version.
    { code: 'const a = <span className="relative z-10 inline-flex items-center gap-1.5" />;' },
    { code: 'const c = "mt-20 flex flex-wrap items-baseline gap-3 rounded-xl border";' },
    { code: 'const c = cn("z-10 inline-flex items-center", dense && "gap-1.5 px-2.5");' },

    // A determiner between the number and the noun means the number belongs to
    // something else. "after eight seconds the loader stops" is about seconds.
    { code: "const a = <p>After eight seconds the loader announces a slow wait.</p>;" },
    { code: "const a = <p>Two of the components ship on npm.</p>;" },

    // "one" is an article in disguise, not a census.
    { code: "const a = <p>Install one component. See if it holds up.</p>;" },

    // A rhetorical number, whose noun is not something this repo counts.
    { code: "const a = <p>Twelve hours of a record being wrong, with nothing on screen.</p>;" },
    { code: "const a = <p>Eleven browser tabs whose titles truncate.</p>;" },

    // A version, an address and a command are not sentences.
    { code: 'const u = "https://zoblocks.design/r/index.json";' },
    { code: 'const i = "./components/zoblocks";' },

    // A property key is not copy.
    { code: 'const o = { "24 items": true };' },

    // Single digits are left alone: the failure mode is a count that drifts,
    // and a catalogue does not go from 3 to 4 unnoticed the way it goes from
    // 27 to 30.
    { code: "const a = <p>3 density modes.</p>;" },
  ],

  invalid: [
    // The four real defects.
    {
      code: 'const d = "FHIR R4 types, WCAG 2.2 AA, 27 components installed as source you own.";',
      errors: [{ messageId: "hardcoded" }],
    },
    {
      code: 'const d = "Zoblocks ships 27 components carrying 300-plus documented states.";',
      errors: [{ messageId: "hardcoded" }],
    },
    {
      code: "const a = <p>Twenty-two of the forty-four registry items carry a directive.</p>;",
      errors: [{ messageId: "hardcoded" }],
    },
    {
      code: 'const a = <a href="/components/data-grid">All fourteen states</a>;',
      errors: [{ messageId: "hardcoded" }],
    },

    // The ones the rule found on its first run, which review had not.
    {
      code: 'const f = ["19 props", "Draw, type or certify"];',
      errors: [{ messageId: "hardcoded" }],
    },
    {
      code: "const a = <h2>Six components, at the size you would use them.</h2>;",
      errors: [{ messageId: "hardcoded" }],
    },

    // A template literal with no expression only looks derived.
    {
      code: "const d = `27 components installed as source you own`;",
      errors: [{ messageId: "hardcoded" }],
    },

    // A prose attribute is copy.
    {
      code: 'const a = <Step body="Twenty-two of the forty-four registry items ship a boundary." />;',
      errors: [{ messageId: "hardcoded" }],
    },

    // An extra noun, supplied by a surface that has its own.
    {
      code: "const a = <p>Sixteen skins over one accessibility tree.</p>;",
      options: [{ countable: ["skins?"] }],
      errors: [{ messageId: "hardcoded" }],
    },
  ],
});

ruleTester.run("no-vague-failure", noVagueFailure, {
  valid: [
    // Names what failed.
    { code: 'const r = { ok: false, message: "No organisation is registered at that address." };' },
    { code: 'const r = { ok: false, message: "Your current password was not accepted." };' },
    { code: 'const a = <Failure title="This page did not load" />;' },
    { code: 'const a = <Failure title="This screen did not load" />;' },

    // Short is fine. The bar is "names something", not "is long".
    { code: 'const r = { ok: false, message: "Sign in again." };' },
    { code: 'const r = { ok: false, message: "Check the form." };' },
    { code: 'const r = { ok: false, message: "Choose a font file." };' },

    // Opens vaguely and then says something. Worse than it could be, and
    // beyond what a regex should judge.
    {
      code: 'const r = { message: "Something went wrong while publishing v4. Nothing was saved." };',
    },

    // Not a failure field.
    { code: 'const o = { label: "Something went wrong" };' },
    { code: 'const o = { id: "error" };' },

    // A success message that happens to be terse.
    { code: 'const r = { ok: true, message: "Published v4." };' },
  ],

  invalid: [
    // The defect in the console's own root boundary.
    {
      code: 'const a = <Failure title="Something went wrong" />;',
      errors: [{ messageId: "vague" }],
    },
    {
      code: 'const r = { ok: false, message: "That request could not be completed." };',
      errors: [{ messageId: "vague" }],
    },
    {
      code: 'const r = { ok: false, message: "That did not work." };',
      errors: [{ messageId: "vague" }],
    },
    {
      code: 'const r = { ok: false, message: "An error occurred" };',
      errors: [{ messageId: "vague" }],
    },
    { code: 'const r = { ok: false, message: "Oops!" };', errors: [{ messageId: "vague" }] },

    // A ternary result is still what the reader is handed.
    {
      code: 'const r = { message: ok ? "Done." : "That did not work." };',
      errors: [{ messageId: "vague" }],
    },

    // The list beneath the message gets the same bar.
    {
      code: 'const r = { ok: false, message: "Check the form.", problems: ["Try again later"] };',
      errors: [{ messageId: "vague" }],
    },
  ],
});
