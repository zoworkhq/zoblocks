import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { identitySwatch } from "../src/swatch.js";

/**
 * The golden file, not a snapshot.
 *
 * A snapshot updates itself when someone runs the suite with `-u`, which is
 * exactly the wrong friction for this decision: changing the hash silently
 * recolours every patient in every customer's product. A committed, readable
 * table means that change arrives as 420 modified lines in a pull request,
 * which is the amount of argument it deserves.
 *
 * Regenerate deliberately:  node scripts/gen-golden.mjs > test/__golden__/swatch.tsv
 */
const GOLDEN = fileURLToPath(new URL("./__golden__/swatch.tsv", import.meta.url));

interface Row {
  key: string;
  swatch: number;
  line: number;
}

function readGolden(): Row[] {
  const text = readFileSync(GOLDEN, "utf8");
  const rows: Row[] = [];
  text.split("\n").forEach((raw, i) => {
    if (!raw || raw.startsWith("#")) return;
    const tab = raw.lastIndexOf("\t");
    if (tab < 0) return;
    rows.push({
      key: JSON.parse(raw.slice(0, tab)) as string,
      swatch: Number(raw.slice(tab + 1)),
      line: i + 1,
    });
  });
  return rows;
}

describe("swatch golden file", () => {
  const rows = readGolden();

  it("is populated", () => {
    expect(rows.length).toBeGreaterThan(400);
  });

  it("reproduces every recorded swatch", () => {
    const drift: string[] = [];
    for (const row of rows) {
      const actual = identitySwatch(row.key, 6);
      if (actual !== row.swatch) {
        drift.push(
          `line ${row.line}: ${JSON.stringify(row.key)} expected ${row.swatch}, got ${actual}`,
        );
      }
    }
    expect(drift, `the hash function changed:\n${drift.slice(0, 10).join("\n")}`).toEqual([]);
  });

  it("covers the awkward keys, not just sequential ids", () => {
    const keys = new Set(rows.map((r) => r.key));
    for (const k of ["", "陳美琳", "🙂", "Ánh Nguyên", "rामेश".replace("r", ""), "  "]) {
      // Presence of each awkward class is what makes the file worth committing.
      expect([...keys].some((x) => x === k || x.length === 0 || /[^\x20-\x7e]/.test(x))).toBe(true);
    }
    expect(keys.has("")).toBe(true);
    expect(keys.has("陳美琳")).toBe(true);
    expect(keys.has("🙂")).toBe(true);
  });

  it("uses all six buckets", () => {
    const used = new Set(rows.map((r) => r.swatch));
    expect(used.size).toBe(6);
  });
});
