/**
 * Absence is stated, never punctuated.
 *
 *   {value ?? "—"}          ✗  reads as "the value is a dash"
 *   {value ?? "N/A"}        ✗  says nothing about why
 *   <AbsentValue … />       ✓  says which kind of absence this is
 *
 * The whole argument for this library is that a blank cell and a cell whose
 * value was never asked for are different clinical facts, and that collapsing
 * them into a dash is a defect rather than a formatting choice. AbsentValue
 * distinguishes not-asked, declined, masked, pending and error precisely so a
 * reader can tell which one they are looking at.
 *
 * A dash renders. It never throws, it never fails a typecheck, and it looks
 * completely normal in review — which is exactly why it needs a lint rule and
 * not a code comment. Both instances this rule found on introduction were in
 * components whose own documentation said they did not do this.
 *
 * Scoped to the *substitution* position — the branch taken when a value is
 * missing — rather than to any dash inside JSX. A dash between a name and a
 * role is typography; a dash standing where a value should be is a missing
 * clinical fact rendered as punctuation. Only the second one is a defect, and
 * conflating them would fire on every separator in the catalogue and train
 * everyone to ignore the rule.
 *
 * See CONTENT.md § Absence and uncertainty.
 */

import { isValueSubstitute } from "./jsx-position.js";

/** Strings that stand in for a value rather than stating anything about it. */
const PLACEHOLDER = new Set([
  "—",
  "–",
  "--",
  "-",
  "N/A",
  "n/a",
  "NA",
  "n/A",
  "N/a",
  "?",
  "??",
  "…",
  "...",
  "TBD",
  "TBC",
  "null",
  "undefined",
  "None",
  "none",
  "Empty",
  "Nil",
]);

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow punctuation and placeholder text standing in for an absent clinical value; state the absence instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      placeholder:
        'Rendering "{{text}}" in place of a value states nothing about why the value is missing. A reader cannot tell whether it was never asked for, declined, masked by policy, still pending, or failed to load — and those are five different clinical facts. Use AbsentValue with a reason, or state the absence in words ("Start not recorded").',
    },
  },

  create(context) {
    const allow = new Set(context.options?.[0]?.allow ?? []);

    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        const text = node.value.trim();
        if (!text || allow.has(text)) return;
        if (!PLACEHOLDER.has(text)) return;
        if (!isValueSubstitute(context, node)) return;

        context.report({ node, messageId: "placeholder", data: { text } });
      },
    };
  },
};
