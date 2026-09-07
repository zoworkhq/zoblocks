/**
 * Every component, measured against the Component Standard.
 *
 * The standard defines fifty metadata fields, fifteen page regions and a set
 * of promotion gates per stability tier. `pnpm gen --strict` already enforces
 * the machine-checkable half — a stable component cannot ship without three
 * examples or an accessibility claim with no test behind it. This measures the
 * rest, and reports the number rather than an impression.
 *
 * It exists because the first audit of this library found nought of sixteen
 * components Stable by the standard's own definition while every one of them
 * looked finished, and "looks finished" is not a measurement.
 *
 *     pnpm conformance          human-readable table
 *     pnpm conformance --json   machine-readable, for a report
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { CATALOG } from "../apps/docs/src/lib/generated/catalog";
import type { ComponentDoc } from "@zoblocks/component-meta";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (p: string) =>
  existsSync(path.join(ROOT, p)) ? readFileSync(path.join(ROOT, p), "utf8") : "";

const coverage = JSON.parse(read("apps/docs/public/r/coverage.json")) as {
  components: Array<{
    name: string;
    hasStory: boolean;
    hasTest: boolean;
    documentedProps: number;
    gaps: string[];
  }>;
};
const byName = new Map(coverage.components.map((c) => [c.name, c]));

const detailPage = read("apps/docs/src/app/components/[name]/page.tsx");
const previewSource = read("apps/docs/src/components/site/component-preview.tsx");
const cardSource = read("apps/docs/src/components/site/component-card.tsx");

/** Primary keywords, for the uniqueness check. */
const keywordOwners = new Map<string, string[]>();
for (const c of CATALOG) {
  const k = c.seo?.primaryKeyword?.toLowerCase();
  if (k) keywordOwners.set(k, [...(keywordOwners.get(k) ?? []), c.name]);
}

/** How many other components point at this one. */
const inbound = new Map<string, number>();
for (const c of CATALOG) {
  const refs = [
    ...c.related,
    ...(c.relationships?.builtWith ?? []),
    ...(c.relationships?.usedIn ?? []),
    ...(c.relationships?.alternatives ?? []).map((a) => a.ref),
  ];
  for (const r of refs) inbound.set(r, (inbound.get(r) ?? 0) + 1);
}

/** `foo: [` or `"foo-bar": (` at the top level of an object literal. */
function hasKey(source: string, name: string, opens: string): boolean {
  const key = /^[a-z][a-z0-9]*$/.test(name) ? `(?:"${name}"|${name})` : `"${name}"`;
  return new RegExp(`^\\s{2}${key}:\\s*\\${opens}`, "m").test(source);
}

interface Check {
  id: string;
  /** Which half of the standard this belongs to. */
  group: "metadata" | "regions" | "evidence" | "content";
  /** Only required at this tier and above. Everything is checked; only
   *  `stable` failures are counted against the score. */
  requiredAt: "any" | "stable";
  test: (c: ComponentDoc) => boolean;
}

const CHECKS: Check[] = [
  // ---- metadata --------------------------------------------------------
  {
    id: "summary ≤ 160 chars",
    group: "metadata",
    requiredAt: "any",
    test: (c) => c.summary.length > 0 && c.summary.length <= 160,
  },
  {
    id: "description",
    group: "metadata",
    requiredAt: "any",
    test: (c) => c.description.length > 40,
  },
  { id: "rationale", group: "metadata", requiredAt: "any", test: (c) => c.rationale.length > 80 },
  {
    id: "technicalName",
    group: "metadata",
    requiredAt: "stable",
    test: (c) => Boolean(c.technicalName),
  },
  {
    id: "aliases ≥ 3",
    group: "metadata",
    requiredAt: "stable",
    test: (c) => (c.aliases ?? []).length >= 3,
  },
  { id: "tags", group: "metadata", requiredAt: "stable", test: (c) => (c.tags ?? []).length > 0 },
  { id: "categories", group: "metadata", requiredAt: "any", test: (c) => c.categories.length > 0 },
  {
    id: "domain.industries",
    group: "metadata",
    requiredAt: "stable",
    test: (c) => (c.domain?.industries ?? []).length > 0,
  },
  {
    id: "domain.workflows",
    group: "metadata",
    requiredAt: "stable",
    test: (c) => (c.domain?.workflows ?? []).length > 0,
  },
  {
    id: "domain.phi stated",
    group: "metadata",
    requiredAt: "stable",
    test: (c) => Boolean(c.domain?.phi),
  },

  // ---- page regions ----------------------------------------------------
  { id: "usage", group: "regions", requiredAt: "any", test: (c) => c.usage.length > 0 },
  { id: "install", group: "regions", requiredAt: "any", test: (c) => c.install.length > 0 },
  {
    id: "props documented",
    group: "regions",
    requiredAt: "any",
    test: (c) => (byName.get(c.name)?.documentedProps ?? 0) > 0,
  },
  { id: "states ≥ 3", group: "regions", requiredAt: "any", test: (c) => c.states.length >= 3 },
  {
    id: "variants",
    group: "regions",
    requiredAt: "stable",
    test: (c) => (c.variants ?? []).length > 0,
  },
  {
    id: "controls (playground)",
    group: "regions",
    requiredAt: "stable",
    test: (c) => (c.controls ?? []).length > 0,
  },
  {
    id: "examples ≥ 3",
    group: "regions",
    requiredAt: "stable",
    test: (c) => (c.examples ?? []).length >= 3,
  },
  {
    id: "clinical section",
    group: "regions",
    requiredAt: "stable",
    test: (c) => Boolean(c.domain?.clinicalContext),
  },
  {
    id: "conformance table",
    group: "regions",
    requiredAt: "stable",
    test: (c) => (c.a11yChecks ?? []).length >= 5,
  },
  { id: "related ≥ 1", group: "regions", requiredAt: "any", test: (c) => c.related.length >= 1 },
  {
    id: "alternatives",
    group: "regions",
    requiredAt: "stable",
    test: (c) => (c.relationships?.alternatives ?? []).length > 0,
  },

  // ---- evidence --------------------------------------------------------
  {
    id: "unit tests",
    group: "evidence",
    requiredAt: "any",
    test: (c) => byName.get(c.name)?.hasTest === true,
  },
  {
    id: "stories",
    group: "evidence",
    requiredAt: "any",
    test: (c) => byName.get(c.name)?.hasStory === true,
  },
  {
    id: "a11y notes ≥ 3",
    group: "evidence",
    requiredAt: "any",
    test: (c) => c.accessibility.length >= 3,
  },
  {
    id: "limitations stated",
    group: "evidence",
    requiredAt: "any",
    test: (c) => c.limitations.length >= 1,
  },
  {
    id: "every a11y claim cites a test",
    group: "evidence",
    requiredAt: "stable",
    test: (c) =>
      (c.a11yChecks ?? []).every((k) => Boolean(k.evidence) || k.status === "not-applicable"),
  },
  {
    id: "named fixtures",
    group: "evidence",
    requiredAt: "stable",
    test: (c) => (c.fixtures ?? []).length > 0,
  },
  {
    id: "every example names a declared fixture",
    group: "evidence",
    requiredAt: "stable",
    test: (c) =>
      (c.examples ?? []).every((e) => !e.fixture || (c.fixtures ?? []).includes(e.fixture)),
  },
  {
    id: "no coverage gaps",
    group: "evidence",
    requiredAt: "any",
    test: (c) => (byName.get(c.name)?.gaps ?? []).length === 0,
  },

  // ---- content and search ---------------------------------------------
  {
    id: "guidance.use ≥ 3",
    group: "content",
    requiredAt: "any",
    test: (c) => c.guidance.use.length >= 3,
  },
  {
    id: "guidance.avoid ≥ 1",
    group: "content",
    requiredAt: "any",
    test: (c) => c.guidance.avoid.length >= 1,
  },
  {
    id: "uxGuidelines",
    group: "content",
    requiredAt: "stable",
    test: (c) => (c.uxGuidelines?.do ?? []).length > 0 && (c.uxGuidelines?.dont ?? []).length > 0,
  },
  {
    id: "seo.primaryKeyword",
    group: "content",
    requiredAt: "stable",
    test: (c) => Boolean(c.seo?.primaryKeyword),
  },
  {
    id: "primary keyword is unique",
    group: "content",
    requiredAt: "stable",
    test: (c) => {
      const k = c.seo?.primaryKeyword?.toLowerCase();
      return !k || (keywordOwners.get(k) ?? []).length === 1;
    },
  },
  {
    id: "seo.title ≤ 60",
    group: "content",
    requiredAt: "stable",
    test: (c) => !c.seo?.title || c.seo.title.length <= 60,
  },
  {
    id: "seo.description ≤ 158",
    group: "content",
    requiredAt: "stable",
    test: (c) => !c.seo?.description || c.seo.description.length <= 158,
  },
  {
    id: "≥ 2 inbound links",
    group: "content",
    requiredAt: "stable",
    test: (c) => (inbound.get(c.name) ?? 0) >= 2,
  },
  /*
   * Resolved the same three ways `test/docs-coverage.test.ts` resolves it: a
   * scenario list, a name special-cased inside ComponentPreview, or a gallery
   * the detail page mounts directly. Two checks disagreeing about what counts
   * as a preview would make one of them noise.
   *
   * The keys are sometimes quoted and sometimes not — `identity:` is a valid
   * identifier and `"clinical-note":` is not — so both forms are matched.
   */
  {
    id: "live preview on the docs site",
    group: "content",
    requiredAt: "any",
    test: (c) =>
      hasKey(previewSource, c.name, "[") ||
      previewSource.includes(`name === "${c.name}"`) ||
      detailPage.includes(`component.name === "${c.name}"`),
  },
  {
    id: "card art",
    group: "content",
    requiredAt: "any",
    test: (c) => hasKey(cardSource, c.name, "("),
  },
];

interface Row {
  name: string;
  status: string;
  passed: number;
  applicable: number;
  failures: string[];
}

const rows: Row[] = CATALOG.map((component) => {
  const stable = component.status === "stable";
  const applicable = CHECKS.filter((k) => k.requiredAt === "any" || stable);
  const failures = applicable.filter((k) => !k.test(component)).map((k) => k.id);
  return {
    name: component.name,
    status: component.status,
    passed: applicable.length - failures.length,
    applicable: applicable.length,
    failures,
  };
});

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify(
      { checks: CHECKS.map((c) => ({ id: c.id, group: c.group, requiredAt: c.requiredAt })), rows },
      null,
      2,
    ),
  );
} else {
  const width = Math.max(...rows.map((r) => r.name.length));
  console.log(`\nComponent conformance — ${CHECKS.length} checks\n`);
  for (const row of rows.sort((a, b) => a.passed / a.applicable - b.passed / b.applicable)) {
    const pct = Math.round((row.passed / row.applicable) * 100);
    const mark = row.failures.length === 0 ? "✓" : "✗";
    console.log(
      `  ${mark} ${row.name.padEnd(width)}  ${String(row.passed).padStart(2)}/${row.applicable}  ${String(pct).padStart(3)}%  ${row.status}`,
    );
    for (const failure of row.failures) console.log(`      · ${failure}`);
  }
  const clean = rows.filter((r) => r.failures.length === 0).length;
  console.log(
    `\n  ${clean} of ${rows.length} components clear every check that applies to them.\n`,
  );
  if (rows.some((r) => r.status === "stable" && r.failures.length)) process.exitCode = 1;
}
