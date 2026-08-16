/**
 * The sign gate.
 *
 * "Save" is the wrong verb for a clinical note. There are three commits with
 * three different legal meanings — save a draft, sign, add an addendum — and
 * only the middle one is irreversible. This module is what stands in front of
 * it.
 *
 * A rule engine rather than a list of checks, because the interesting rules are
 * the ones we cannot write. Whether a note may be signed with an unfilled
 * blank is our call; whether it may be signed without an attending's
 * countersignature, or outside a documentation window, or against a discharged
 * encounter, is the deploying organisation's. Rules compose, hosts add their
 * own, and nothing signs while a `block` stands.
 *
 * Three severities and only one of them stops you. That distinction is the
 * whole design: a gate that blocks on everything gets routed around within a
 * week, and a gate that blocks on nothing is decoration. Warnings are shown,
 * counted, and recorded in the signed output — a signature over a note with
 * five acknowledged warnings is a different artifact from one with none, and
 * the record should say so.
 *
 * Every rule is a pure function of (document, context). No clock, no fetch, no
 * state. That is what makes them table-testable and what keeps the gate fast
 * enough to run on every keystroke.
 */

import type { Node as PMNode } from "prosemirror-model";
import { blanks } from "./expand.js";
import {
  composition,
  foreignContent,
  stalePulls,
  unreviewedAi,
} from "./compose.js";
import {
  isSectionEmpty,
  noteType,
  sectionAttrs,
  sections,
  type NoteTypeDef,
  type NoteTypeName,
} from "./schema.js";
import { provenanceRanges } from "./provenance.js";

/* ------------------------------------------------------------------ */
/* Findings                                                            */
/* ------------------------------------------------------------------ */

/**
 * How much a finding matters.
 *
 * `block` prevents signing. `warn` is surfaced, acknowledged and recorded.
 * `pass` is reported so the gate can show what it checked — a list that only
 * shows problems reads as "here is what is wrong with you", where one that
 * shows both reads as a checklist, and clinicians treat the two very
 * differently.
 */
export type Severity = "block" | "warn" | "pass";

/** One result from one rule. */
export interface Finding {
  /** Stable identifier, e.g. `required-sections`. Hosts key their copy off it. */
  id: string;
  severity: Severity;
  /** One line, in the clinician's language, stating what is true. */
  title: string;
  /** Optional second line: the specifics, the number, the fix. */
  detail?: string;
  /**
   * Where the problem is, so the UI can put the caret on it.
   *
   * A gate that reports a defect without navigating to it gets dismissed on
   * reflex within a week. This field is why the whole engine tracks positions.
   */
  at?: { from: number; to: number };
}

/** Everything the gate found, and the one question the caller actually has. */
export interface GateResult {
  findings: Finding[];
  /** False while any `block` finding stands. */
  canSign: boolean;
  blocking: Finding[];
  warnings: Finding[];
  passed: Finding[];
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

/** What a rule is allowed to know. */
export interface GateContext {
  /** The note's type, which decides which sections are required. */
  noteType: NoteTypeName | NoteTypeDef;
  /**
   * The instant the gate is being run, supplied by the host.
   *
   * No default, deliberately, and this is the one piece of API friction in the
   * package that is there on purpose. A browser clock on a ward workstation is
   * not evidence; the host has a server clock and should be made to pass it.
   */
  now: Date;
  /** The note's subject, e.g. `Patient/4471902`. Enables the wrong-chart check. */
  subject?: string;
  /** How old a pulled value may be before it is flagged. Default 4 hours. */
  maxPullAgeMs?: number;
  /** Copy-forward share above which the gate warns. Default 0.5. */
  copyForwardWarnAt?: number;
}

/** A gate rule. */
export interface GateRule {
  id: string;
  /** Return one finding, several, or none. */
  run(doc: PMNode, ctx: GateContext): Finding | Finding[] | null;
}

const FOUR_HOURS = 4 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* The runner                                                          */
/* ------------------------------------------------------------------ */

/**
 * Run every rule and sort the results.
 *
 * Findings come back most-severe first and, within a severity, in rule order.
 * Stable ordering matters more than it looks: a list that reshuffles between
 * keystrokes cannot be read, and a clinician who was halfway through fixing the
 * second item does not want it to become the fourth.
 *
 * A rule that throws is caught and reported as a blocking finding rather than
 * taking the editor down. A host rule with a bug must not be able to make a
 * note unsignable *silently*, and it must not be able to make a broken note
 * signable either — so the failure is loud and it blocks.
 */
export function runGate(doc: PMNode, rules: readonly GateRule[], ctx: GateContext): GateResult {
  const findings: Finding[] = [];

  for (const rule of rules) {
    try {
      const result = rule.run(doc, ctx);
      if (result === null) continue;
      if (Array.isArray(result)) findings.push(...result);
      else findings.push(result);
    } catch (error) {
      findings.push({
        id: `${rule.id}:error`,
        severity: "block",
        title: "A pre-signature check could not be completed",
        detail: `Rule "${rule.id}" failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  const rank: Record<Severity, number> = { block: 0, warn: 1, pass: 2 };
  const sorted = findings
    .map((f, i) => ({ f, i }))
    .sort((a, b) => rank[a.f.severity] - rank[b.f.severity] || a.i - b.i)
    .map((x) => x.f);

  const blocking = sorted.filter((f) => f.severity === "block");
  return {
    findings: sorted,
    canSign: blocking.length === 0,
    blocking,
    warnings: sorted.filter((f) => f.severity === "warn"),
    passed: sorted.filter((f) => f.severity === "pass"),
  };
}

/* ------------------------------------------------------------------ */
/* Default rules                                                       */
/* ------------------------------------------------------------------ */

/**
 * Required sections must not be empty.
 *
 * Blocks. An H&P without a physical examination is not an H&P, and a progress
 * note with no assessment is a record of having been in the room.
 */
export const requiredSections: GateRule = {
  id: "required-sections",
  run(doc, ctx) {
    const def = noteType(ctx.noteType);
    const byCode = new Map(def.sections.map((s) => [s.code, s]));
    const missing: Finding[] = [];

    for (const { node, pos } of sections(doc)) {
      const { code, title, required: declared } = sectionAttrs(node);
      const required = declared || byCode.get(code)?.required === true;
      if (required && isSectionEmpty(node)) {
        missing.push({
          id: `required-sections:${code}`,
          severity: "block",
          title: `${title || code} is empty`,
          detail: `A ${def.title.toLowerCase()} requires this section.`,
          at: { from: pos, to: pos + node.nodeSize },
        });
      }
    }

    if (missing.length > 0) return missing;
    return { id: "required-sections", severity: "pass", title: "All required sections have content" };
  },
};

/**
 * Generated text must be read before it is signed.
 *
 * Blocks, and this is the rule the component exists for. Reviewing means
 * reading a passage in place and accepting it, which is why the host's
 * accept-all path should cost one extra keystroke rather than none.
 */
export const unreviewedAiRule: GateRule = {
  id: "unreviewed-ai",
  run(doc) {
    const passages = unreviewedAi(doc);
    const first = passages[0];
    if (first === undefined) {
      return { id: "unreviewed-ai", severity: "pass", title: "No unreviewed AI-drafted text" };
    }
    return {
      id: "unreviewed-ai",
      severity: "block",
      title:
        passages.length === 1
          ? "1 AI-drafted passage has not been reviewed"
          : `${passages.length} AI-drafted passages have not been reviewed`,
      detail: "You are accountable for every word you sign. Review each passage in place.",
      at: { from: first.from, to: first.to },
    };
  },
};

/**
 * No unfilled blanks.
 *
 * Blocks. A signed note containing `***` is unambiguous evidence that the
 * template was inserted and never read, and it is the cheapest possible thing
 * to catch.
 */
export const noUnfilledBlanks: GateRule = {
  id: "unfilled-blanks",
  run(doc) {
    const found = blanks(doc);
    const first = found[0];
    if (first === undefined) {
      return { id: "unfilled-blanks", severity: "pass", title: "No unfilled blanks" };
    }
    return {
      id: "unfilled-blanks",
      severity: "block",
      title: found.length === 1 ? "1 blank is unfilled" : `${found.length} blanks are unfilled`,
      detail: "Press F2 to move to the next one.",
      at: { from: first.pos, to: first.pos + 1 },
    };
  },
};

/**
 * Nothing from another patient's chart.
 *
 * Blocks when the host supplies a subject. Wrong-patient documentation is a
 * named, tracked safety event, and this is the one route to it that a text
 * editor can actually see.
 */
export const noForeignContent: GateRule = {
  id: "foreign-content",
  run(doc, ctx) {
    if (ctx.subject === undefined) return null;
    const foreign = foreignContent(doc, ctx.subject);
    const first = foreign[0];
    if (first === undefined) {
      return { id: "foreign-content", severity: "pass", title: "All content belongs to this patient" };
    }
    return {
      id: "foreign-content",
      severity: "block",
      title: "This note contains text copied from another patient's chart",
      detail: `${foreign.length} passage${foreign.length === 1 ? "" : "s"} from ${first.source}.`,
      at: { from: first.from, to: first.to },
    };
  },
};

/**
 * Copy-forward ratio.
 *
 * Warns. The number is the point — a clinician who learns that 62% of today's
 * note describes yesterday will often go and fix it, and one who is simply
 * blocked will paste it in again tomorrow from somewhere the gate cannot see.
 */
export const copyForward: GateRule = {
  id: "copy-forward",
  run(doc, ctx) {
    const threshold = ctx.copyForwardWarnAt ?? 0.5;
    const c = composition(doc);
    if (c.total === 0 || c.ratio.copied <= threshold) {
      return { id: "copy-forward", severity: "pass", title: "Copy-forward is within your organisation's threshold" };
    }
    const pct = Math.round(c.ratio.copied * 100);
    return {
      id: "copy-forward",
      severity: "warn",
      title: `${pct}% of this note is copied from earlier documentation`,
      detail: `${c.chars.copied.toLocaleString("en")} of ${c.total.toLocaleString("en")} characters.`,
    };
  },
};

/**
 * Pulled values must be current.
 *
 * Warns. A number with no timestamp is an assertion; a number with one is
 * evidence, and this rule is the reason every pull carries the instant it was
 * true rather than the instant it was inserted.
 */
export const freshPulls: GateRule = {
  id: "stale-pull",
  run(doc, ctx) {
    const maxAge = ctx.maxPullAgeMs ?? FOUR_HOURS;
    const stale = stalePulls(doc, maxAge, ctx.now);
    if (stale.length === 0) {
      return { id: "stale-pull", severity: "pass", title: "Pulled values are current" };
    }
    const worst = stale.reduce((a, b) => (b.ageMs > a.ageMs ? b : a));
    return {
      id: "stale-pull",
      severity: "warn",
      title: `${stale.length} pulled value${stale.length === 1 ? " was" : "s were"} retrieved more than ${formatDuration(maxAge)} ago`,
      detail: `Oldest: "${truncate(worst.text, 48)}", ${formatDuration(worst.ageMs)} old.`,
      at: { from: worst.from, to: worst.to },
    };
  },
};

/**
 * Template text nobody touched.
 *
 * Warns. A normal-exam macro that fires eleven systems of boilerplate onto a
 * patient with an obviously abnormal abdomen is a lie that nobody typed, and
 * "you inserted 400 words and edited none of them" is worth saying out loud.
 */
export const uneditedTemplate: GateRule = {
  id: "unedited-template",
  run(doc) {
    const c = composition(doc);
    if (c.total === 0 || c.ratio.template < 0.4) {
      return { id: "unedited-template", severity: "pass", title: "Template content is within range" };
    }
    return {
      id: "unedited-template",
      severity: "warn",
      title: `${Math.round(c.ratio.template * 100)}% of this note is unedited template text`,
      detail: "Check that the boilerplate matches what you actually found.",
    };
  },
};

/* ------------------------------------------------------------------ */
/* Do-not-use abbreviations                                            */
/* ------------------------------------------------------------------ */

/**
 * The Joint Commission's "Do Not Use" list.
 *
 * The one piece of clinical content that ships in this package, and it earns
 * the exception by being short, stable, published, and always wrong. Everything
 * else clinical — terminology, phrases, attestation wording — is the host's.
 *
 * Warns rather than blocks: it is an accreditation standard, not a statute. And
 * the trailing-zero entry has a carve-out — trailing zeros are permitted where
 * they demonstrate genuine precision, as in lab results, lesion sizes and
 * catheter sizes — which guarantees false positives in exactly the text
 * clinicians write most. A rule that blocks on a guaranteed false positive is a
 * rule that gets switched off.
 */
export interface Abbreviation {
  /** What not to write. */
  term: string;
  /** What to write instead. */
  write: string;
  /** Why it is dangerous. */
  because: string;
  /** Matcher. Word-bounded, case-sensitive where case is what disambiguates. */
  pattern: RegExp;
}

export const DO_NOT_USE: readonly Abbreviation[] = [
  {
    term: "U",
    write: "unit",
    because: "mistaken for 0, 4, or cc",
    pattern: /(?<=\d\s?)U\b/g,
  },
  {
    term: "IU",
    write: "International Unit",
    because: "mistaken for IV or the number 10",
    pattern: /\bIU\b/g,
  },
  {
    term: "QD",
    write: "daily",
    because: "mistaken for QOD",
    pattern: /\bQ\.?D\b/gi,
  },
  {
    term: "QOD",
    write: "every other day",
    because: "mistaken for QD",
    pattern: /\bQ\.?O\.?D\b/gi,
  },
  {
    term: "MS",
    write: "morphine sulfate or magnesium sulfate",
    because: "means either, and they are not interchangeable",
    pattern: /\bMS\b/g,
  },
  {
    term: "MSO4",
    write: "morphine sulfate",
    because: "confused with MgSO4",
    pattern: /\bMSO4\b/gi,
  },
  {
    term: "MgSO4",
    write: "magnesium sulfate",
    because: "confused with MSO4",
    pattern: /\bMgSO4\b/gi,
  },
  {
    term: "trailing zero",
    write: "X mg",
    because: "a missed decimal point is a tenfold overdose",
    // Only flagged next to a unit, which is where the danger is. A bare "1.0"
    // in prose is usually a lab value, where the trailing zero is permitted
    // precisely because it carries precision.
    pattern: /\b\d+\.0(?=\s?(mg|mcg|g|mL|ml|L)\b)/g,
  },
  {
    term: "missing leading zero",
    write: "0.X mg",
    because: "a missed decimal point is a tenfold overdose",
    pattern: /(?<![\d.])\.\d+(?=\s?(mg|mcg|g|mL|ml|L)\b)/g,
  },
];

/** Flag the do-not-use list. Warns. */
export const noDangerousAbbreviations: GateRule = {
  id: "do-not-use",
  run(doc) {
    const text = doc.textContent;
    const hits: Finding[] = [];

    for (const abbr of DO_NOT_USE) {
      // Each rule owns a stateful global regex; resetting is not optional.
      abbr.pattern.lastIndex = 0;
      if (abbr.pattern.test(text)) {
        hits.push({
          id: `do-not-use:${abbr.term}`,
          severity: "warn",
          title: `"${abbr.term}" appears in this note`,
          detail: `Joint Commission "Do Not Use" list — ${abbr.because}. Write "${abbr.write}".`,
        });
      }
      abbr.pattern.lastIndex = 0;
    }

    if (hits.length > 0) return hits;
    return { id: "do-not-use", severity: "pass", title: "No prohibited abbreviations" };
  },
};

/**
 * Low-confidence dictation.
 *
 * Warns. "Patient denies chest pain" transcribed as "patient denies test pain"
 * is one character from clinically wrong, and the clinician proof-reading it
 * reads what they meant to say. Where the recognizer told us it was unsure, the
 * gate should repeat that back.
 */
export const lowConfidenceDictation: GateRule = {
  id: "low-confidence-dictation",
  run(doc) {
    const shaky = provenanceRanges(
      doc,
      (a) => a.origin === "dictated" && a.confidence !== null && a.confidence < 0.75,
    );
    if (shaky.length === 0) {
      return { id: "low-confidence-dictation", severity: "pass", title: "Dictation confidence is acceptable" };
    }
    const worst = shaky.reduce((a, b) => ((b.attrs.confidence ?? 1) < (a.attrs.confidence ?? 1) ? b : a));
    return {
      id: "low-confidence-dictation",
      severity: "warn",
      title: `${shaky.length} dictated passage${shaky.length === 1 ? "" : "s"} transcribed with low confidence`,
      detail: `Lowest: "${truncate(worst.text, 48)}".`,
      at: { from: worst.from, to: worst.to },
    };
  },
};

/**
 * The default rule set.
 *
 * Ordered blocking-first so that a host rendering them unsorted still gets a
 * sensible list. Hosts are expected to spread this and add their own.
 */
export const DEFAULT_RULES: readonly GateRule[] = [
  requiredSections,
  unreviewedAiRule,
  noUnfilledBlanks,
  noForeignContent,
  copyForward,
  freshPulls,
  uneditedTemplate,
  noDangerousAbbreviations,
  lowConfidenceDictation,
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function truncate(text: string, max: number): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length <= max ? collapsed : `${collapsed.slice(0, max - 1)}…`;
}

/** Coarse, human duration. "8h 26m", not "8 hours 26 minutes 3 seconds". */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(Math.abs(ms) / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
