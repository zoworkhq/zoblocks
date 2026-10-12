/**
 * Finding components: by name, by search, and by what they are called
 * elsewhere.
 *
 * An agent rarely has the catalog's exact name. It has "ResultValue" from an
 * import, "toggle" from a user, "lab result" from a ticket. Every lookup
 * therefore accepts the kebab name, the export name, the title and the
 * declared aliases — and a miss comes back with the nearest real names,
 * because an agent told only "not found" tends to invent the component
 * instead.
 */

import type { Manifest, ManifestComponent } from "./manifest.js";

const normalise = (value: string) =>
  value
    .trim()
    .replace(/^@\/components\/zoblocks\//, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

/** Every name a component answers to, normalised. */
function namesOf(component: ManifestComponent): string[] {
  return [
    component.name,
    component.title,
    component.technicalName ?? "",
    ...component.exports.map((e) => e.name),
    ...(component.aliases ?? []),
  ]
    .filter(Boolean)
    .map(normalise);
}

export function findComponent(manifest: Manifest, query: string): ManifestComponent | undefined {
  const wanted = normalise(query);
  return (
    manifest.components.find((c) => c.name === wanted) ??
    manifest.components.find((c) => namesOf(c).includes(wanted))
  );
}

/** Edit distance, one row at a time. `at` reads a cell the loop bounds guarantee exists. */
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  const at = (j: number) => row[j] ?? 0;
  for (let i = 1; i <= a.length; i++) {
    let previous = at(0);
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = at(j);
      row[j] = Math.min(at(j) + 1, at(j - 1) + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return at(b.length);
}

/** The closest real names to a miss: spelling first, then meaning. */
export function suggest(manifest: Manifest, query: string, limit = 3): string[] {
  const wanted = normalise(query);
  const bySpelling = manifest.components
    .map((c) => ({ name: c.name, score: Math.min(...namesOf(c).map((n) => distance(wanted, n))) }))
    .filter((s) => s.score <= Math.max(2, Math.floor(wanted.length / 3)))
    .sort((a, b) => a.score - b.score)
    .map((s) => s.name);
  const byMeaning = search(manifest, query, limit).map((r) => r.name);
  return [...new Set([...bySpelling, ...byMeaning])].slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Search                                                             */
/* ------------------------------------------------------------------ */

/** Where a match counts, and how much. A name match outranks a mention in prose. */
const FIELDS: Array<{ label: string; weight: number; read: (c: ManifestComponent) => string[] }> = [
  { label: "name", weight: 10, read: (c) => [c.name, c.title, c.technicalName ?? ""] },
  { label: "alias", weight: 8, read: (c) => c.aliases ?? [] },
  { label: "export", weight: 6, read: (c) => c.exports.map((e) => e.name) },
  { label: "FHIR", weight: 6, read: (c) => c.fhir.map((f) => f.name) },
  { label: "category", weight: 4, read: (c) => c.categories },
  { label: "tag", weight: 4, read: (c) => c.tags ?? [] },
  { label: "summary", weight: 3, read: (c) => [c.summary, c.tagline ?? ""] },
  { label: "state", weight: 2, read: (c) => c.states },
  { label: "use", weight: 1, read: (c) => [c.description, ...c.guidance.use] },
];

const STOP = new Set([
  "a",
  "an",
  "the",
  "for",
  "of",
  "to",
  "and",
  "or",
  "with",
  "in",
  "on",
  "zoblocks",
  "component",
]);

const tokens = (text: string) =>
  normalise(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t));

export interface SearchResult {
  name: string;
  title: string;
  summary: string;
  availability: ManifestComponent["availability"];
  importFrom: string;
  install: string;
  score: number;
  matched: string[];
}

export function search(manifest: Manifest, query: string, limit = 5): SearchResult[] {
  const wanted = tokens(query);
  if (!wanted.length) return [];

  return manifest.components
    .map((component) => {
      let score = 0;
      const matched: string[] = [];
      for (const field of FIELDS) {
        for (const value of field.read(component)) {
          const have = new Set(tokens(value));
          const hits = wanted.filter((t) => have.has(t) || [...have].some((h) => h.startsWith(t)));
          if (!hits.length) continue;
          score += field.weight * hits.length;
          if (matched.length < 4)
            matched.push(`${field.label}: ${value.length > 60 ? `${value.slice(0, 57)}…` : value}`);
          break;
        }
      }
      return {
        name: component.name,
        title: component.title,
        summary: component.summary,
        availability: component.availability,
        importFrom: component.importFrom,
        install: component.install,
        score,
        matched,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Web components                                                     */
/* ------------------------------------------------------------------ */

/**
 * Catalog name → custom element, for the components that exist outside React.
 * Read from the manifest's element list, so a new element needs no change here.
 */
export function webComponentElements(manifest: Manifest): Map<string, string> {
  return new Map(
    manifest.integration.webComponents.elements.map((element) => [
      element.replace(/^zb-/, ""),
      element,
    ]),
  );
}

/** The module a custom element is registered by: `@zoblocks/loaders/pulse`, `@zoblocks/elements/switch`. */
export function elementModule(element: string): string {
  const name = element.replace(/^zb-/, "");
  return name.endsWith("-loader")
    ? `@zoblocks/loaders/${name.replace(/-loader$/, "")}`
    : `@zoblocks/elements/${name}`;
}
