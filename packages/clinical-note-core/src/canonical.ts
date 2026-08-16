/**
 * The same note, the same bytes, forever.
 *
 * A signature over a document is worthless unless the document can be
 * reproduced exactly. Store a note, read it back, re-serialize it, and if a
 * single key has moved the digest changes and the signature no longer verifies
 * — which is indistinguishable, to anyone auditing it later, from the note
 * having been altered.
 *
 * `JSON.stringify` does not give this. Object key order in JavaScript follows
 * insertion order, so a document built by typing and a document built by
 * loading the same note from a server can differ byte-for-byte while being
 * identical documents. This module removes that variance:
 *
 *   - keys sorted, at every depth
 *   - no insignificant whitespace
 *   - default attributes dropped, so an explicit `null` and an absent key
 *     cannot produce two encodings of one document
 *   - Unicode normalised to NFC, because "é" has two encodings and a clinician
 *     pasting from Word supplies the other one
 *
 * The output is a string rather than a hash. Hashing needs a crypto
 * implementation, and which one — Node's `crypto`, WebCrypto, a host's HSM —
 * is a deployment decision. `withDigest` in `fhir.ts` is the seam; this is the
 * input to it.
 */

import type { Node as PMNode } from "prosemirror-model";

/* ------------------------------------------------------------------ */
/* Stable JSON                                                         */
/* ------------------------------------------------------------------ */

/** A JSON value, as far as this module is concerned. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/**
 * Serialize with sorted keys and no incidental whitespace.
 *
 * Arrays keep their order — order is meaning in a document. Objects are sorted
 * by key using a plain code-unit comparison rather than `localeCompare`, which
 * is locale-dependent and would make the digest of a note depend on the machine
 * that produced it.
 */
export function stableStringify(value: Json): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";

  if (typeof value === "number") {
    // Non-finite numbers have no JSON representation; `JSON.stringify` silently
    // writes `null` for them. Silence is the wrong behaviour when the output is
    // about to be signed.
    if (!Number.isFinite(value)) throw new TypeError(`Cannot canonicalise non-finite number: ${value}`);
    // `-0` and `0` are the same number and must not produce two encodings.
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }

  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));

  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const keys = Object.keys(value).sort();
  const parts: string[] = [];
  for (const key of keys) {
    const child = value[key];
    // `undefined` is dropped exactly as `JSON.stringify` drops it, so that a
    // round trip through JSON is a fixed point.
    if (child === undefined) continue;
    parts.push(`${JSON.stringify(key.normalize("NFC"))}:${stableStringify(child)}`);
  }
  return `{${parts.join(",")}}`;
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

/**
 * Strip attributes that equal their schema default.
 *
 * Without this, two identical documents differ whenever one was built by an
 * older version of the schema that had fewer attributes — and every future
 * attribute added to `provenance` or `section` would invalidate every stored
 * signature. Dropping defaults makes the encoding depend only on what was
 * actually said.
 */
/** Attribute defaults, as ProseMirror records them on a node or mark type. */
type AttrSpec = Record<string, { default?: unknown } | undefined>;

/**
 * Drop the attributes of one node or mark that match their default.
 *
 * Shared by nodes and marks because the rule is identical for both, and a
 * second copy of it is a second place for the two to drift apart.
 */
function pruneAttrs(json: { [key: string]: Json }, spec: AttrSpec): { [key: string]: Json } {
  const attrs = json["attrs"];
  // ProseMirror's `toJSON` omits `attrs` entirely for a type that declares
  // none, so the absent case is the common one rather than an edge.
  if (attrs === undefined || typeof attrs !== "object" || attrs === null || Array.isArray(attrs)) {
    return json;
  }

  const kept: { [key: string]: Json } = {};
  for (const [key, value] of Object.entries(attrs)) {
    const fallback = spec[key]?.default;
    if (value === fallback) continue;
    kept[key] = value;
  }

  const out = { ...json };
  if (Object.keys(kept).length === 0) delete out["attrs"];
  else out["attrs"] = kept;
  return out;
}

function pruneDefaults(node: PMNode, json: Json): Json {
  // `toJSON` always produces an object for a node; the guard is here so the
  // function is total over `Json` rather than because it is reachable.
  if (typeof json !== "object" || json === null || Array.isArray(json)) return json;

  let out = pruneAttrs(json, node.type.spec.attrs ?? {});

  const content = out["content"];
  if (Array.isArray(content)) {
    out = { ...out, content: content.map((child, i) => pruneDefaults(node.child(i), child)) };
  }

  const marks = out["marks"];
  if (Array.isArray(marks)) {
    out = {
      ...out,
      marks: marks.map((mark, i) =>
        pruneAttrs(mark as { [key: string]: Json }, node.marks[i]?.type.spec.attrs ?? {}),
      ),
    };
  }

  return out;
}

/**
 * The canonical byte string for a document.
 *
 * This is what gets hashed, and what a detached JWS is computed over. Two
 * documents produce the same string if and only if they say the same thing.
 */
export function toCanonical(doc: PMNode): string {
  return stableStringify(pruneDefaults(doc, doc.toJSON() as Json));
}

/**
 * Whether two documents are canonically identical.
 *
 * `node.eq()` answers a subtly different question — it compares the in-memory
 * structure, including attributes left at their defaults — so a document that
 * round-tripped through storage can be `eq`-unequal while hashing the same.
 * When the question is "would this verify against the stored signature", this
 * is the comparison that matters.
 */
export function canonicallyEqual(a: PMNode, b: PMNode): boolean {
  return toCanonical(a) === toCanonical(b);
}
