/**
 * Stigmatising language in behavioral health.
 *
 * Behavioral health has a specific vocabulary problem, and it is not a matter
 * of politeness. "Addict", "clean", "non-compliant", "manipulative" — each
 * carries a clinical judgement that measurably changes how the *next* clinician
 * reads the patient. Studies of clinician response to identical vignettes
 * differing only in whether the person is described as "a substance abuser" or
 * "having a substance use disorder" find different recommended interventions.
 * The word is doing work.
 *
 * This list is used in two places, and the second is the interesting one:
 *
 *   1. As an ESLint rule over Oxygen's own message catalogue, so the component
 *      never ships the language itself.
 *   2. As a **post-stream check on the model's output**, because the model was
 *      trained on decades of clinical text that used these terms freely, and
 *      will reproduce them.
 *
 * The check flags; it does not rewrite. Silently editing a clinical answer to
 * make it pass a lint rule is the worst available option — it changes meaning
 * without telling anyone. A flag in the UI, with the preferred term offered, is
 * a nudge; a rewrite is a fabrication.
 */

/*
 * The rule this file feeds fires on this file, which is correct behaviour and
 * an unhelpful result: a list of terms to avoid has to contain the terms.
 * Disabled here and nowhere else.
 */
/* eslint-disable @oxygenui/no-stigmatising-language -- this IS the term list */

export interface StigmaTerm {
  /** Matched case-insensitively on word boundaries. */
  readonly term: string;
  readonly prefer: string;
  readonly why: string;
}

/**
 * Person-first, non-judgemental alternatives.
 *
 * Kept deliberately short and high-confidence. A long list produces false
 * positives in quoted patient speech — where the patient's own words should
 * absolutely be preserved — and a check that cries wolf gets switched off.
 */
export const STIGMA_TERMS: readonly StigmaTerm[] = [
  {
    term: "addict",
    prefer: "person with a substance use disorder",
    why: "Person-first language separates the condition from the identity.",
  },
  {
    term: "abuser",
    prefer: "person with a substance use disorder",
    why: "'Abuse' attributes intent and moral fault to a medical condition.",
  },
  {
    term: "substance abuse",
    prefer: "substance use disorder",
    why: "Matches DSM-5 and ICD terminology; 'abuse' is not a diagnosis.",
  },
  {
    term: "drug abuse",
    prefer: "drug use disorder",
    why: "Matches diagnostic terminology.",
  },
  {
    term: "clean",
    prefer: "in remission, or abstinent",
    why: "Implies the alternative state is dirty. 'Negative toxicology' if that is what is meant.",
  },
  {
    term: "dirty",
    prefer: "positive toxicology",
    why: "Applied to a test result or a person, it is a moral judgement, not a finding.",
  },
  {
    term: "junkie",
    prefer: "person who uses drugs",
    why: "Pejorative.",
  },
  {
    term: "alcoholic",
    prefer: "person with alcohol use disorder",
    why: "Person-first. Note some people self-describe this way — preserve their words in quotation.",
  },
  {
    term: "committed suicide",
    prefer: "died by suicide",
    why: "'Committed' frames a death as a crime or a sin.",
  },
  {
    term: "successful suicide",
    prefer: "died by suicide",
    why: "'Successful' attaches achievement to a death.",
  },
  {
    term: "failed suicide",
    prefer: "suicide attempt",
    why: "Frames survival as failure.",
  },
  {
    term: "non-compliant",
    prefer: "not taking as prescribed",
    why: "Locates the problem in the patient rather than in access, side effects or understanding.",
  },
  {
    term: "noncompliant",
    prefer: "not taking as prescribed",
    why: "Locates the problem in the patient rather than the circumstances.",
  },
  {
    term: "manipulative",
    prefer: "describe the specific behaviour",
    why: "A judgement that follows a patient through the record and changes their care.",
  },
  {
    term: "drug seeking",
    prefer: "describe the specific request and context",
    why: "Frequently applied to untreated pain, and disproportionately to some groups.",
  },
  {
    term: "frequent flyer",
    prefer: "frequent attender, or state the number of attendances",
    why: "Dismissive of people with high, usually unmet, need.",
  },
  {
    term: "schizophrenic",
    prefer: "person with schizophrenia",
    why: "Person-first; the noun form replaces the person with the diagnosis.",
  },
  {
    term: "the mentally ill",
    prefer: "people with mental illness",
    why: "Collapses people into a category.",
  },
];

export interface StigmaFinding {
  readonly term: string;
  readonly prefer: string;
  readonly why: string;
  /** Character offset into the scanned text. */
  readonly index: number;
}

/**
 * Find stigmatising terms.
 *
 * `skipQuoted` exists because a patient's own words are clinical data.
 * "Patient states 'I'm just an addict'" is an accurate record of what someone
 * said about themselves and must not be flagged; rewriting a quotation is
 * falsifying a record. Quoted spans are excluded from the scan entirely.
 */
export function findStigma(
  text: string,
  options: { skipQuoted?: boolean } = {},
): readonly StigmaFinding[] {
  const skipQuoted = options.skipQuoted ?? true;
  const quoted = skipQuoted ? quotedRanges(text) : [];
  const findings: StigmaFinding[] = [];

  for (const entry of STIGMA_TERMS) {
    const pattern = new RegExp(`\\b${escapeRegExp(entry.term)}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const index = match.index;
      if (quoted.some(([start, end]) => index >= start && index < end)) continue;
      findings.push({ term: entry.term, prefer: entry.prefer, why: entry.why, index });
    }
  }

  return findings.sort((a, b) => a.index - b.index);
}

/** Spans inside straight or curly quotes, so quoted speech is left alone. */
function quotedRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const pattern = /(["“'‘])(.*?)(["”'’])/gs;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
