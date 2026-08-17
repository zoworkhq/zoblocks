/**
 * Crisis detection, deterministic and ahead of the model.
 *
 * Three design rules, each of which exists because shipped products have failed
 * at it in ways that made the news.
 *
 * **The classifier runs before the model, not after.** If the model generates
 * an answer and a filter inspects it, the crisis path depends on the model
 * having behaved. It must not.
 *
 * **The answer is replaced, not annotated.** Appending a hotline number to an
 * otherwise helpful answer produces something people scroll past. Evaluations
 * have found safety banners disappearing entirely once unrelated clinical
 * content is added to the same message; the failure mode is dilution, and
 * replacement is the only reliable defence.
 *
 * **The whole thread is evaluated, not the latest message.** Guardrail decay
 * across long conversations is measured and substantial — one longitudinal
 * analysis found medical disclaimers falling from 26% of responses in 2022 to
 * under 1% by 2025. A classifier that only sees the last turn inherits that
 * decay.
 *
 * ---
 *
 * The hard part is not detection. It is **who is speaking about whom.**
 *
 * Consult is clinician-facing, so the overwhelming majority of text mentioning
 * suicide is clinical documentation, not disclosure: "patient denies suicidal
 * ideation", "history of overdose 2019", "C-SSRS negative". A classifier that
 * fires on keywords turns the product into a machine that refuses to discuss
 * psychiatry, which is both useless and, in a behavioral health deployment,
 * actively harmful — it teaches clinicians to route around it.
 *
 * So the classifier resolves three things separately: whether risk language is
 * present, who it refers to (the user, or a third party they are documenting),
 * and whether it is negated or historical. Only the combination decides.
 */

/* ------------------------------------------------------------------ */
/* Verdict                                                             */
/* ------------------------------------------------------------------ */

export type CrisisSeverity =
  /** No risk language, or risk language that is negated or historical. */
  | "none"
  /** Risk language about a third party, present tense. Blocks; routes to protocol. */
  | "clinical-risk"
  /** First-person ideation without stated means or timing. Blocks. */
  | "ideation"
  /** First-person ideation with means, plan, timing, or a farewell. Blocks. */
  | "imminent";

/** Who the risk language is about. Drives which copy and which escalation shows. */
export type CrisisAudience = "user" | "third-party";

export interface CrisisVerdict {
  readonly severity: CrisisSeverity;
  readonly audience: CrisisAudience;
  /**
   * Which rules fired, by name. Names, never the matched text — an audit log
   * is not a place to duplicate a disclosure, and a rule name is enough to
   * debug a false positive.
   */
  readonly rules: readonly string[];
  /** True for anything that must replace the answer rather than annotate it. */
  readonly blocking: boolean;
}

export const NO_CRISIS: CrisisVerdict = {
  severity: "none",
  audience: "user",
  rules: [],
  blocking: false,
};

/* ------------------------------------------------------------------ */
/* Patterns                                                            */
/* ------------------------------------------------------------------ */

interface Rule {
  readonly name: string;
  readonly pattern: RegExp;
}

/** Present-tense first-person ideation. */
const IDEATION: readonly Rule[] = [
  {
    name: "ideation.kill-self",
    pattern:
      /\bi\s+(?:want|need|am going|plan|intend)\s+to\s+(?:kill|end)\s+(?:myself|my\s+life)\b/i,
  },
  { name: "ideation.kill-self-bare", pattern: /\bkill(?:ing)?\s+myself\b/i },
  { name: "ideation.end-life", pattern: /\bend(?:ing)?\s+(?:my\s+life|it\s+all)\b/i },
  {
    name: "ideation.want-to-die",
    pattern: /\bi\s+(?:want|wish)\s+(?:to\s+die|i\s+(?:was|were)\s+dead)\b/i,
  },
  { name: "ideation.suicidal", pattern: /\bi(?:'m|\s+am)\s+(?:feeling\s+)?suicidal\b/i },
  {
    name: "ideation.no-point-living",
    pattern: /\b(?:no\s+point|no\s+reason)\s+(?:in\s+)?(?:living|going\s+on)\b/i,
  },
  {
    name: "ideation.better-off-dead",
    pattern: /\b(?:i(?:'d|\s+would)\s+be\s+better\s+off\s+dead|better\s+off\s+without\s+me)\b/i,
  },
  {
    name: "ideation.self-harm",
    pattern: /\bi\s+(?:want|need)\s+to\s+(?:hurt|harm|cut)\s+myself\b/i,
  },
];

/** Means, plan, timing or farewell — the escalation from ideation to imminent. */
const IMMINENCE: readonly Rule[] = [
  {
    name: "imminent.means-held",
    pattern:
      /\bi\s+(?:have|got|bought|saved\s+up)\s+(?:the\s+)?(?:pills|tablets|a\s+gun|a\s+rope|a\s+knife|enough\s+\w+)\b/i,
  },
  {
    name: "imminent.tonight",
    pattern: /\b(?:tonight|today|right\s+now|in\s+an?\s+hour|this\s+evening)\b/i,
  },
  { name: "imminent.plan", pattern: /\bi\s+(?:have|made)\s+a\s+plan\b/i },
  {
    name: "imminent.farewell",
    pattern:
      /\b(?:goodbye|this\s+is\s+my\s+last|thank\s+you\s+for\s+everything|won'?t\s+be\s+here\s+tomorrow)\b/i,
  },
  { name: "imminent.in-progress", pattern: /\bi\s+(?:have|just)\s+(?:taken|swallowed)\s+/i },
];

/**
 * Third-party references. Clinical documentation, or a clinician asking about a
 * patient who is at risk right now.
 */
const THIRD_PARTY: readonly Rule[] = [
  {
    name: "third.patient",
    pattern:
      /\b(?:the\s+)?(?:patient|client|pt|service\s+user|he|she|they)\s+(?:is|are|has|have|reports?|endorses?|expresses?|disclosed?|admits?)\b/i,
  },
  { name: "third.possessive", pattern: /\bmy\s+(?:patient|client|service\s+user)\b/i },
];

/** Risk language attached to a third party rather than the speaker. */
const THIRD_PARTY_RISK: readonly Rule[] = [
  {
    name: "third.risk-si",
    pattern: /\b(?:suicidal\s+ideation|si\b|self[-\s]?harm|overdose|od\b|took\s+an?\s+overdose)/i,
  },
  {
    name: "third.risk-plan",
    pattern:
      /\b(?:has\s+a\s+plan|means\s+and\s+intent|actively\s+suicidal|at\s+imminent\s+risk)\b/i,
  },
];

/**
 * Negation and history. Documentation, not disclosure.
 *
 * These are why the classifier is usable in psychiatry at all. "Denies SI",
 * "no current ideation", "C-SSRS negative", "history of" — a tool that treated
 * those as crises would be unusable on a psychiatric ward, which is exactly
 * where it needs to work.
 */
const NEGATION: readonly Rule[] = [
  {
    name: "negated.denies",
    pattern:
      /\b(?:denies|denied|no\s+current|nil|negative\s+for|rules?\s+out|ruled\s+out|without)\s+(?:\w+\s+){0,3}?(?:suicidal|ideation|si\b|self[-\s]?harm|intent|plan)/i,
  },
  {
    name: "negated.no-si",
    pattern: /\bno\s+(?:active\s+)?(?:suicidal\s+ideation|si|self[-\s]?harm|intent|plan)\b/i,
  },
  {
    name: "negated.contracts",
    pattern: /\b(?:contracts?\s+for\s+safety|safety\s+plan\s+in\s+place|able\s+to\s+contract)\b/i,
  },
  {
    name: "negated.screening",
    pattern:
      /\b(?:c-?ssrs|phq-?9\s+item\s+9|asq|columbia\s+protocol)\s+(?:negative|screen(?:ed)?\s+negative|low\s+risk)\b/i,
  },
];

const HISTORICAL: readonly Rule[] = [
  {
    name: "historical.past",
    pattern: /\b(?:history\s+of|previous|prior|past|in\s+\d{4}|years?\s+ago|hx\s+of)\b/i,
  },
  {
    name: "historical.remote",
    pattern: /\b(?:no\s+attempts?\s+since|last\s+attempt\s+(?:was\s+)?(?:in\s+)?\d{4})\b/i,
  },
];

/**
 * Educational and definitional framing. A clinician looking up guidance is not
 * in crisis, and blocking them is the failure that teaches people to stop
 * asking.
 */
const EDUCATIONAL: readonly Rule[] = [
  {
    name: "educational.what-is",
    pattern:
      /\b(?:what\s+is|define|definition\s+of|how\s+do\s+i\s+(?:score|administer|use)|guidance\s+(?:on|for)|guideline)\b/i,
  },
  {
    name: "educational.instrument",
    pattern:
      /\b(?:c-?ssrs|columbia|phq-?9|gad-?7|sad\s+persons|safety\s+planning\s+intervention)\b.*\b(?:score|scoring|administer|cut[-\s]?off|threshold|training)\b/i,
  },
];

function matched(rules: readonly Rule[], text: string): string[] {
  return rules.filter((r) => r.pattern.test(text)).map((r) => r.name);
}

/* ------------------------------------------------------------------ */
/* Classifier                                                          */
/* ------------------------------------------------------------------ */

export interface CrisisInput {
  /** What the clinician just typed. */
  readonly question: string;
  /**
   * Prior turns, oldest first. Evaluated because guardrails decay and because
   * risk is frequently disclosed across several messages rather than one.
   */
  readonly history?: readonly string[];
}

/**
 * Classify. Pure, synchronous, no model, no network.
 *
 * The order of the checks is the design. Educational framing and negation are
 * resolved *before* ideation, because in a clinician-facing tool the
 * documentation reading is the common case and the disclosure reading is the
 * rare one — and getting that backwards produces a component nobody can use in
 * the specialty that needs it most.
 */
export function classifyCrisis(input: CrisisInput): CrisisVerdict {
  const recent = (input.history ?? []).slice(-4);
  const question = input.question;
  // Ideation is checked against the current turn plus recent context, because
  // disclosure is often split across messages. Negation is checked against the
  // current turn only — an earlier "denies SI" must not neutralise a later
  // first-person disclosure.
  const windowed = [...recent, question].join("\n");

  const educational = matched(EDUCATIONAL, question);
  const negated = matched(NEGATION, question);
  const historical = matched(HISTORICAL, question);

  const ideation = matched(IDEATION, windowed);
  const imminence = matched(IMMINENCE, windowed);
  const thirdParty = matched(THIRD_PARTY, question);
  const thirdPartyRisk = matched(THIRD_PARTY_RISK, question);

  // 1. Explicit negation or a screening-negative statement. Documentation.
  if (negated.length > 0 && imminence.length === 0) {
    return { severity: "none", audience: "third-party", rules: negated, blocking: false };
  }

  // 2. First-person disclosure. Checked before third-party framing, because
  //    "my patient... and honestly I want to die too" must not be read as
  //    documentation.
  if (ideation.length > 0) {
    const imminent = imminence.length > 0;
    return {
      severity: imminent ? "imminent" : "ideation",
      audience: "user",
      rules: [...ideation, ...imminence],
      blocking: true,
    };
  }

  // 3. Third-party risk, present tense, not historical, not a lookup.
  if (thirdParty.length > 0 && thirdPartyRisk.length > 0) {
    if (historical.length > 0 || educational.length > 0) {
      return {
        severity: "none",
        audience: "third-party",
        rules: [...historical, ...educational],
        blocking: false,
      };
    }
    return {
      severity: "clinical-risk",
      audience: "third-party",
      rules: [...thirdParty, ...thirdPartyRisk],
      blocking: true,
    };
  }

  return NO_CRISIS;
}

/* ------------------------------------------------------------------ */
/* Crisis lines                                                        */
/* ------------------------------------------------------------------ */

export interface CrisisLine {
  readonly label: string;
  /** Tel-dialable. Rendered as a `tel:` link by the skin. */
  readonly number: string;
  readonly note?: string;
}

/**
 * Fallback crisis lines by region.
 *
 * **A host must supply its own for production.** These are a development
 * default and a demonstration that the resolver exists — services change
 * numbers, coverage varies within a country, and an organisation almost always
 * wants its own on-call route listed first.
 *
 * The reason this is a resolver at all rather than a constant: 988 works in the
 * United States and nowhere else. A component that ships 988 as a hardcoded
 * string is shipping a bug to every other market, and it is the kind of bug
 * discovered by the person least able to absorb it. `resolveCrisisLines`
 * returns generic emergency guidance rather than a wrong number when it does
 * not recognise a locale, because no number is safer than a foreign one.
 */
const CRISIS_LINES: Record<string, readonly CrisisLine[]> = {
  US: [{ label: "988 Suicide & Crisis Lifeline", number: "988", note: "Call or text, 24/7" }],
  CA: [{ label: "9-8-8 Suicide Crisis Helpline", number: "988", note: "Call or text, 24/7" }],
  GB: [
    { label: "Samaritans", number: "116123", note: "Free, 24/7" },
    { label: "NHS 111", number: "111", note: "Select the mental health option" },
  ],
  IE: [{ label: "Samaritans Ireland", number: "116123", note: "Free, 24/7" }],
  AU: [{ label: "Lifeline", number: "131114", note: "24/7" }],
  NZ: [{ label: "1737 Need to talk?", number: "1737", note: "Call or text, 24/7" }],
  IN: [{ label: "Tele-MANAS", number: "14416", note: "24/7, multiple languages" }],
};

const GENERIC: readonly CrisisLine[] = [
  { label: "Local emergency services", number: "", note: "Use your local emergency number" },
];

/**
 * Resolve lines for a BCP-47 locale.
 *
 * Region is taken from the locale's region subtag, so "en-GB" and "cy-GB" both
 * resolve to the UK. A bare language tag resolves to generic guidance rather
 * than guessing — "en" does not mean the United States, and treating it as
 * though it does is precisely the bug this function exists to prevent.
 */
export function resolveCrisisLines(
  locale: string,
  overrides?: Readonly<Record<string, readonly CrisisLine[]>>,
): readonly CrisisLine[] {
  const region = regionOf(locale);
  if (!region) return GENERIC;
  return overrides?.[region] ?? CRISIS_LINES[region] ?? GENERIC;
}

export function regionOf(locale: string): string | undefined {
  const parts = locale.split(/[-_]/);
  for (const part of parts.slice(1)) {
    if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
  }
  return undefined;
}
