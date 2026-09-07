/**
 * @fileoverview Flag stigmatising clinical language in user-facing strings.
 *
 * Behavioral health has a specific vocabulary problem, and it is not a matter
 * of politeness. Studies of clinician response to identical vignettes differing
 * only in whether a person is described as "a substance abuser" or "a person
 * with a substance use disorder" find different recommended interventions. The
 * word does work; it changes how the next clinician reads the patient.
 *
 * This rule covers ZoBlocks's own strings — message catalogues, labels, defaults.
 * The matching model output is checked at runtime by `runChecks` in
 * `@zoblocks/copilot-core`, because the model was trained on decades of
 * clinical text that used these terms freely and will reproduce them.
 *
 * Two deliberate limits:
 *
 *   **Quoted speech is exempt.** A patient's own words are clinical data.
 *   "Patient states 'I'm just an addict'" is an accurate record and must not be
 *   rewritten — rewriting a quotation is falsifying a record.
 *
 *   **It reports, it does not fix.** There is no autofix. The preferred term is
 *   usually longer and sometimes restructures the sentence, and a rule that
 *   silently rewrote clinical copy would be doing the thing this whole
 *   component exists to argue against.
 */

/**
 * Kept in sync with STIGMA_TERMS in packages/copilot-core/src/language.ts.
 * Duplicated rather than imported: this plugin is plain ESM with no build step
 * and no TypeScript, and a lint rule that needs a compiled workspace package to
 * load is a lint rule that breaks the moment someone runs eslint before build.
 * The copilot-core test suite asserts the two lists agree.
 */
const TERMS = [
  ["addict", "person with a substance use disorder"],
  ["abuser", "person with a substance use disorder"],
  ["substance abuse", "substance use disorder"],
  ["drug abuse", "drug use disorder"],
  ["clean", "in remission, or abstinent"],
  ["dirty", "positive toxicology"],
  ["junkie", "person who uses drugs"],
  ["alcoholic", "person with alcohol use disorder"],
  ["committed suicide", "died by suicide"],
  ["successful suicide", "died by suicide"],
  ["failed suicide", "suicide attempt"],
  ["non-compliant", "not taking as prescribed"],
  ["noncompliant", "not taking as prescribed"],
  ["manipulative", "describe the specific behaviour"],
  ["drug seeking", "describe the specific request and context"],
  ["frequent flyer", "frequent attender"],
  ["schizophrenic", "person with schizophrenia"],
  ["the mentally ill", "people with mental illness"],
];

/**
 * Terms too ambiguous to flag outside a clinical string.
 *
 * "clean" and "dirty" are ordinary English — clean data, a dirty build, a clean
 * wound. Flagging them everywhere produces exactly the cry-wolf rule that gets
 * switched off, so they are only reported when the surrounding string already
 * looks clinical.
 */
const CONTEXT_SENSITIVE = new Set(["clean", "dirty", "manipulative"]);

const CLINICAL_HINT =
  /\b(patient|client|service user|substance|alcohol|drug|opioid|toxicology|screen|urine|sober|abstinen|relapse|recovery|treatment|withdrawal)\b/i;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Character ranges inside straight or curly quotes, which are exempt. */
function quotedRanges(text) {
  const ranges = [];
  const pattern = /(["“'‘])(.*?)(["”'’])/gs;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Flag stigmatising clinical language in string literals, with the person-first alternative.",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          /** Extra terms, as [term, preferred] pairs. */
          additionalTerms: {
            type: "array",
            items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
          },
          /** Terms to stop reporting, for a product with a good reason. */
          allow: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      stigmatising:
        'Consider "{{prefer}}" rather than "{{term}}". The word changes how the next clinician reads the patient.',
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const allow = new Set((options.allow ?? []).map((t) => t.toLowerCase()));
    const terms = [...TERMS, ...(options.additionalTerms ?? [])].filter(
      ([term]) => !allow.has(term.toLowerCase()),
    );

    function check(node, raw) {
      if (typeof raw !== "string" || raw.length === 0) return;
      const exempt = quotedRanges(raw);
      const clinical = CLINICAL_HINT.test(raw);

      for (const [term, prefer] of terms) {
        if (CONTEXT_SENSITIVE.has(term) && !clinical) continue;

        const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi");
        let match;
        while ((match = pattern.exec(raw)) !== null) {
          const index = match.index;
          if (exempt.some(([start, end]) => index >= start && index < end)) continue;
          context.report({ node, messageId: "stigmatising", data: { term, prefer } });
          // One report per term per string. A sentence using "addict" twice is
          // one problem, and two squiggles on it is noise.
          break;
        }
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw);
      },
      JSXText(node) {
        check(node, node.value);
      },
    };
  },
};
