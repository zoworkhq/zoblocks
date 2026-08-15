/**
 * Clinical copy that is technically true and practically misleading.
 *
 * Each pattern here is a phrase that renders fine, reviews fine, and shifts
 * meaning at the point a reader acts on it. They are grouped because they share
 * one failure: the string asks the reader to supply a fact the interface
 * already knows and declined to state.
 *
 *   "Normal"                 an uninterpreted result is not a normal one
 *   "Are you sure?"          asks the reader to re-derive the consequence
 *   "Something went wrong"   which thing, and is the record still complete?
 *   "Unknown"                for code status, silence is not the same as unknown
 *
 * Warnings rather than errors. Unlike an absence placeholder, each of these has
 * a legitimate use — "Normal" is correct as a reference-range label, and
 * "Unknown" is correct when it is the stated content of a coded field. The rule
 * exists to make the author look at it once.
 *
 * Scoped to prose positions — JSX text, prose attributes, and strings rendered
 * directly as a child. A `tone="normal"` prop and a `state === "failed"`
 * comparison are not copy, and firing on those would make the rule noise.
 *
 * See CONTENT.md.
 */

import { isProse, isValueSubstitute } from "./jsx-position.js";

const PATTERNS = [
  {
    id: "bareInterpretation",
    test: /^(normal|abnormal)$/i,
    hint: 'An uninterpreted result is not a normal one. If this is a resolved Observation.interpretation, use INTERPRETATION_LABEL so "no interpretation supplied" renders as "Not interpreted" rather than as reassurance. If it is a reference-range label, say "Within range".',
  },
  {
    id: "bareUnknown",
    test: /^(unknown|not set|not specified)$/i,
    hint: 'State what is unknown and what follows from it. For a resuscitation status "Unknown" alone reads as a settled value; "No code status recorded — full resuscitation applies unless documented" is the fact the reader needs.',
  },
  {
    id: "emptyConfirmation",
    test: /^\s*are you sure\??\s*$/i,
    hint: "Not a confirmation — it asks the reader to re-derive the consequence they were already unsure about. State what will happen, to whom, and what cannot be undone. See ActionGate's consequence and patientName props.",
  },
  {
    id: "genericError",
    test: /^(something went wrong|an error occurred|error|oops|failed)\.?$/i,
    hint: "Name what failed and say whether what is still on screen is complete. A results panel that failed to load half its rows and says only “Error” has told the reader nothing about whether they are looking at a whole record.",
  },
];

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Flag user-visible clinical copy that omits a fact the interface already has.",
    },
    schema: [],
    messages: {
      ambiguous: 'User-visible copy "{{text}}". {{hint}}',
    },
  },

  create(context) {
    function check(node, raw) {
      if (typeof raw !== "string") return;
      const text = raw.trim();
      if (!text) return;
      if (!isProse(context, node) && !isValueSubstitute(context, node)) return;

      for (const pattern of PATTERNS) {
        if (pattern.test.test(text)) {
          context.report({
            node,
            messageId: "ambiguous",
            data: { text, hint: pattern.hint },
          });
          return;
        }
      }
    }

    return {
      Literal(node) {
        check(node, node.value);
      },
      JSXText(node) {
        check(node, node.value);
      },
    };
  },
};
