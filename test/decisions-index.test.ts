/**
 * The decision index agrees with the decisions.
 *
 * Eight records said `accepted` in their own headers and `proposed` in the
 * table that lists them. Nobody was misled, because nobody had reason to read
 * both — which is the failure mode. An index is consulted precisely when
 * somebody does not want to open fifteen files, so an index that disagrees with
 * them is worse than not having one.
 *
 * The header is the record; the table is a view of it. This asserts the view.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = join(process.cwd(), "content/decisions");
const index = readFileSync(join(dir, "README.md"), "utf8");

const records = readdirSync(dir)
  .filter((f) => /^\d{4}-.*\.md$/.test(f))
  .sort();

describe("the decision index", () => {
  it("has records to check", () => {
    // Guards everything below against passing on an empty list.
    expect(records.length).toBeGreaterThan(10);
  });

  for (const file of records) {
    const body = readFileSync(join(dir, file), "utf8");
    const status = /\*\*Status:\*\*\s*([a-z]+)/.exec(body)?.[1];
    const row = index.split("\n").find((line) => line.includes(`(${file})`));

    it(`lists ${file} with the status the record states`, () => {
      expect(status, `${file} has no **Status:** line`).toBeTruthy();
      expect(row, `${file} is not in the index`).toBeTruthy();

      const listed = row!.split("|").at(-2)?.trim();
      expect(listed).toBe(status);
    });
  }

  it("lists nothing that is not a record", () => {
    // A row left behind by a renamed or deleted ADR points at a file that no
    // longer exists, and a link that 404s reads as the document being wrong
    // rather than the index.
    for (const link of index.matchAll(/\((\d{4}-[a-z0-9-]+\.md)\)/g)) {
      expect(records, `index links ${link[1]}`).toContain(link[1]);
    }
  });
});
