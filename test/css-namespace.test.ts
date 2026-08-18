/**
 * Two components must not claim the same class name.
 *
 * This is not hypothetical tidiness. `PatientChip` shipped rendering
 * `.ox-chip`, which Accordion already owned as a severity badge. Nothing
 * failed: both packages built, every unit test passed, and each stylesheet was
 * correct read on its own. The defect only existed once a page loaded both,
 * and then the patient chips silently wore the badge's skin — a border and a
 * background they never asked for, and padding tuned for a word of text rather
 * than a 24px avatar, so the avatar hung outside its own tint.
 *
 * A component library is exactly the environment where this is invisible to
 * the author and unavoidable for the user: the author tests one package, the
 * user loads all of them. So the check belongs here, across the whole
 * stylesheet surface, rather than in any one package's suite.
 *
 * The rule is ownership, not uniqueness — a class may repeat within one
 * component's own stylesheets (source, dist and the registry copy are the same
 * file three times). It may not appear under two different owners.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * One entry per owner — authored, per-component stylesheets only.
 *
 * Two kinds of file are deliberately absent, both because they are copies
 * rather than owners: `packages/react/src/styles.css`, which the generator
 * concatenates from the sheets below, and the `registry/oxygen` copies, which
 * are the same sources again for copy-as-source consumers. Including either
 * would report every class as colliding with itself and the suite would be
 * deleted within the week.
 */
const SHEETS: ReadonlyArray<{ owner: string; file: string }> = [
  { owner: "identity", file: "packages/identity/src/styles.css" },
  { owner: "tabs", file: "packages/tabs/src/styles.css" },
  { owner: "react/loader", file: "packages/react/src/styles/loader.css" },
  { owner: "react/switch", file: "packages/react/src/styles/switch.css" },
  { owner: "react/accordion", file: "packages/react/src/styles/accordion.css" },
  { owner: "react/clinical-note", file: "packages/react/src/styles/clinical-note.css" },
  { owner: "react/timeline", file: "packages/react/src/styles/timeline.css" },
];

/**
 * Class names in a stylesheet, ignoring anything inside a comment.
 *
 * Deliberately blunt: it over-collects rather than under-collects, because a
 * false positive here is a two-second read of a diff and a false negative is
 * the bug this file exists to stop.
 */
function classesIn(css: string): Set<string> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, " ");
  const found = new Set<string>();
  for (const match of withoutComments.matchAll(/\.(ox-[a-z0-9-]+(?:__[a-z0-9-]+)?)/g)) {
    found.add(match[1]!);
  }
  return found;
}

/** `.ox-chip--escalated` and `.ox-chip` are the same claim on the same name. */
function base(className: string): string {
  return className.split("--")[0]!.split("__")[0]!;
}

describe("stylesheet namespaces", () => {
  const owned = new Map<string, Set<string>>();
  for (const { owner, file } of SHEETS) {
    const css = readFileSync(path.join(ROOT, file), "utf8");
    owned.set(owner, new Set([...classesIn(css)].map(base)));
  }

  it("gives every class exactly one owner", () => {
    const claims = new Map<string, string[]>();
    for (const [owner, classes] of owned) {
      for (const name of classes) {
        claims.set(name, [...(claims.get(name) ?? []), owner]);
      }
    }

    const shared = [...claims.entries()]
      .filter(([, owners]) => owners.length > 1)
      .map(([name, owners]) => `.${name} claimed by ${owners.join(" and ")}`);

    expect(shared).toEqual([]);
  });

  it("keeps the patient chip out of the accordion's badge", () => {
    // Named explicitly, because this is the pair that actually shipped broken
    // and a future rename should have to delete this line on purpose.
    expect(owned.get("identity")).toContain("ox-patient-chip");
    expect(owned.get("identity")).not.toContain("ox-chip");
    expect(owned.get("react/accordion")).toContain("ox-chip");
  });
});
