/**
 * Test builders.
 *
 * Documents are built through the schema rather than from JSON literals so
 * that a schema change breaks the tests loudly instead of leaving them
 * asserting against a shape the engine no longer produces.
 */

import type { Node as PMNode } from "prosemirror-model";
import { noteSchema, LOINC } from "../src/schema.js";
import { provenance, type Origin, type ProvenanceAttrs } from "../src/provenance.js";

/** Marked text. `origin` omitted means unmarked, i.e. implicitly typed. */
export function t(text: string, origin?: Origin, extra: Partial<ProvenanceAttrs> = {}): PMNode {
  if (origin === undefined) return noteSchema.text(text);
  const attrs = provenance({ ...extra, origin });
  return noteSchema.text(text, [
    noteSchema.marks["provenance"]!.create(attrs as unknown as Record<string, unknown>),
  ]);
}

/** Bold text. */
export function b(text: string): PMNode {
  return noteSchema.text(text, [noteSchema.marks["strong"]!.create()]);
}

/** Italic text. */
export function i(text: string): PMNode {
  return noteSchema.text(text, [noteSchema.marks["em"]!.create()]);
}

/** An unfilled blank. */
export function blank(hint = ""): PMNode {
  return noteSchema.nodes["wildcard"]!.create({ hint });
}

export function p(...content: PMNode[]): PMNode {
  return noteSchema.nodes["paragraph"]!.create(null, content);
}

export function li(...content: PMNode[]): PMNode {
  return noteSchema.nodes["list_item"]!.create(null, content);
}

export function ul(...items: PMNode[]): PMNode {
  return noteSchema.nodes["bullet_list"]!.create(null, items);
}

export function ol(...items: PMNode[]): PMNode {
  return noteSchema.nodes["ordered_list"]!.create(null, items);
}

export function section(
  attrs: { code: string; title: string; required?: boolean },
  ...content: PMNode[]
): PMNode {
  return noteSchema.nodes["section"]!.create(
    { code: attrs.code, system: LOINC, title: attrs.title, required: attrs.required ?? false },
    content.length > 0 ? content : [p()],
  );
}

export function doc(...content: PMNode[]): PMNode {
  return noteSchema.nodes["doc"]!.create(null, content);
}

/** A small but realistic progress note used across several suites. */
export function sampleNote(): PMNode {
  return doc(
    section(
      { code: "10154-3", title: "Chief complaint" },
      p(t("Admitted for blood transfusion.", "typed")),
    ),
    section(
      { code: "10164-2", title: "History of present illness", required: true },
      p(
        t("Six weeks of progressive fatigue and exertional dyspnea. ", "copied", {
          source: "DocumentReference/prior-1",
        }),
        t("Lightheadedness has resolved since the first unit. ", "typed"),
        t("He denies overt bleeding.", "ai", { source: "scribe/v2", reviewed: false }),
      ),
      p(
        t("Hemoglobin 7.1 g/dL", "pulled", {
          source: "Observation/cbc-1",
          at: "2026-08-16T06:12:00+05:30",
        }),
        t(", down from 11.8 g/dL in March.", "typed"),
      ),
    ),
    section(
      { code: "10187-3", title: "Review of systems" },
      p(
        t("Constitutional — positive for fatigue; denies fever.", "template", {
          source: "phrase/ros",
        }),
      ),
    ),
    section({ code: "51847-2", title: "Assessment and plan", required: true }),
  );
}

/** A deterministic PRNG. `Math.random` would make a failing fuzz run unrepeatable. */
export function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    // xorshift32
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}
