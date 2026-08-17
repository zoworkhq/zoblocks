/**
 * Modes, and the two registers they have to speak in.
 *
 * A mode's `reads` is a contract: a closed FHIR union, diffable by a compliance
 * officer, where a typo is a compile error rather than a category that silently
 * resolves to nothing. That is the right shape for enforcement and the wrong
 * one for a human, and the scope strip has to show a human what was read while
 * they are mid-consultation and deciding whether to trust a summary.
 *
 * So the translation lives here, once, beside the modes — not in each skin,
 * where the antd and Tailwind builds could drift into describing the same scope
 * two different ways.
 */

import { describe, expect, it } from "vitest";
import { categoryLabels } from "../src/modes.js";

describe("categoryLabels", () => {
  /*
   * The translation from contract to sentence. `reads` is FHIR because a typo
   * in a mode definition must be a compile error; the scope strip is English
   * because it is read mid-consultation by someone deciding whether to trust a
   * summary. Both are load-bearing, which is why the mapping is tested rather
   * than assumed.
   */
  it("renders clinical English, not resource types", () => {
    expect(categoryLabels(["Condition", "DiagnosticReport"])).toEqual(["problem list", "results"]);
  });

  it("collapses the two medication resources into one word", () => {
    // A clinician thinks "medications". Listing it twice reads as a bug.
    expect(categoryLabels(["MedicationRequest", "MedicationStatement"])).toEqual(["medications"]);
  });

  it("keeps the order the mode author chose", () => {
    // Authors list what a mode is mostly about first, and that carries meaning.
    expect(categoryLabels(["Observation", "Condition"])).toEqual(["results", "problem list"]);
  });

  it("passes through a type it does not know rather than dropping it", () => {
    /*
     * Silently omitting an unmapped type would under-state scope on the one
     * surface whose entire job is to state scope accurately. Showing the raw
     * type is ugly; showing less than was read is a false reassurance.
     */
    expect(categoryLabels(["Condition", "ResearchStudy"])).toEqual([
      "problem list",
      "ResearchStudy",
    ]);
  });

  it("returns nothing for a mode that reads nothing", () => {
    expect(categoryLabels([])).toEqual([]);
  });
});
