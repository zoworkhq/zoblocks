/**
 * ProvenanceChip — six sources, two dates, and one question about humans.
 *
 * The assertions cluster around the three things that make a provenance
 * dangerous to get wrong: conflating the document's date with the
 * observation's, treating patient-report as a defect, and rendering an
 * extracted value as though somebody had read it.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ProvenanceChip,
  SOURCE_GLYPH,
  SOURCE_LABEL,
  describeAgeShort,
  describeProvenance,
  fromProvenance,
  ledgerFrom,
  staleness,
  toSource,
  type ProvenanceRecord,
  type ProvenanceSource,
  type StalenessPolicy,
} from "./provenance-chip";

const NOW = "2026-08-12T10:00:00Z";

const clinic: ProvenanceRecord = {
  source: "clinic",
  observedAt: "2026-08-12T09:48:00Z",
  performer: { display: "M. Adeyemi", role: "MA" },
  device: "Welch Allyn 6000",
};

const SOURCES: ProvenanceSource[] = [
  "clinic",
  "device",
  "patient-reported",
  "external",
  "ai-extracted",
  "amended",
];

/* ------------------------------------------------------------------ */
/* Six shapes, not six colours                                         */
/* ------------------------------------------------------------------ */

describe("source classes", () => {
  it("covers six", () => {
    expect(Object.keys(SOURCE_LABEL)).toHaveLength(6);
    expect(new Set(Object.values(SOURCE_GLYPH)).size).toBe(6);
  });

  it.each(SOURCES)("%s renders its own glyph", (source) => {
    const { container } = render(<ProvenanceChip record={{ source }} />);
    // Colour would put them on a scale from better to worse, and they are not
    // one. The glyph is the channel, and it survives greyscale.
    expect(container.querySelector(`[data-zb-glyph='${SOURCE_GLYPH[source]}']`)).toBeTruthy();
    expect(container.querySelector("[data-zb-provenance]")?.getAttribute("data-zb-source")).toBe(
      source,
    );
  });

  it.each(SOURCES)("%s names itself in the accessible name", (source) => {
    render(<ProvenanceChip record={{ source }} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain(
      SOURCE_LABEL[source].toLowerCase(),
    );
  });

  it("keeps the word in the name when the glyph is alone", () => {
    render(<ProvenanceChip record={clinic} glyphOnly />);
    const chip = screen.getByRole("img");
    expect(chip.textContent).not.toContain("Clinic");
    expect(chip.getAttribute("aria-label")).toContain("clinic");
  });

  it("does not treat patient-report as a defect", () => {
    // Self-report is the primary instrument in behavioral health. Styling it
    // as a warning teaches staff to distrust the right answer.
    const { container } = render(<ProvenanceChip record={{ source: "patient-reported" }} />);
    const chip = container.querySelector("[data-zb-provenance]")!;
    expect(chip.hasAttribute("data-zb-unconfirmed")).toBe(false);
    expect(chip.textContent).not.toMatch(/unreviewed/i);
  });
});

/* ------------------------------------------------------------------ */
/* Two dates                                                           */
/* ------------------------------------------------------------------ */

describe("observed-at against recorded-at", () => {
  it("measures age from the observation, not from the receipt", () => {
    // A C-CDA authored in March carrying a January reading is nine weeks old.
    // Measuring from the receipt is the error the two fields exist to prevent.
    const record: ProvenanceRecord = {
      source: "external",
      observedAt: "2026-01-14T09:00:00Z",
      recordedAt: "2026-03-11T00:00:00Z",
    };
    const age = staleness(record, NOW, () => 7 * 86_400_000);
    expect(age.state).toBe("stale");
    // Roughly seven months from the observation, not five from the document.
    expect(describeAgeShort((age as { ageMs: number }).ageMs)).toBe("7 mo");
  });

  it("falls back to recorded-at when there is no observation date", () => {
    const age = staleness({ source: "clinic", recordedAt: "2026-08-12T09:00:00Z" }, NOW, () => 1);
    expect(age.state).toBe("stale");
  });

  it("says unknown rather than fresh when there is no date at all", () => {
    expect(staleness({ source: "clinic" }, NOW, () => 1)).toEqual({ state: "unknown" });
  });

  it("names the exchange as well as the organisation", () => {
    // "External" tells a reader nothing they can act on.
    render(
      <ProvenanceChip
        record={{
          source: "external",
          organisation: "Northgate Family Med",
          exchange: "Carequality",
        }}
      />,
    );
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain(
      "Northgate Family Med via Carequality",
    );
  });

  it("separates who observed from who recorded, and only when they differ", () => {
    const both = describeProvenance({
      source: "clinic",
      performer: { display: "Dr Warren" },
      recorder: { display: "M. Adeyemi" },
    });
    expect(both).toContain("observed by Dr Warren");
    expect(both).toContain("recorded by M. Adeyemi");

    // The same person twice is one fact, not two.
    const same = describeProvenance({
      source: "clinic",
      performer: { display: "Dr Warren" },
      recorder: { display: "Dr Warren" },
    });
    expect(same).not.toContain("recorded by");
  });
});

/* ------------------------------------------------------------------ */
/* Staleness policy                                                    */
/* ------------------------------------------------------------------ */

describe("staleness", () => {
  const policy: StalenessPolicy = (record) => (record.source === "device" ? 48 * 3_600_000 : null);

  it("is per datum type, not global", () => {
    // Four days is nothing for a problem list and a lot for a blood pressure.
    const old = "2026-08-08T10:00:00Z";
    expect(staleness({ source: "device", observedAt: old }, NOW, policy).state).toBe("stale");
    // Same age, different datum: the policy has no opinion, so neither does
    // the chip.
    expect(staleness({ source: "clinic", observedAt: old }, NOW, policy).state).toBe("unknown");
  });

  it("shows the age without a policy, but makes no judgement", () => {
    // The age is a fact; staleness is an opinion. A wrong threshold is worse
    // than no threshold, but so is withholding the date entirely.
    const { container } = render(<ProvenanceChip record={clinic} now={NOW} />);
    const age = container.querySelector(".zb-prov__age")!;
    expect(age).toHaveTextContent("12 min");
    expect(age.getAttribute("data-zb-staleness")).toBe("unknown");
  });

  it("never speaks a raw timestamp", () => {
    // "dated 2026-08-12T09:48:00Z" reads aloud as a transcription error.
    const label = describeProvenance(clinic, NOW);
    expect(label).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(label).toContain("observed 12 min ago");
  });

  it("puts the age on the chip once there is a policy", () => {
    const { container } = render(
      <ProvenanceChip
        record={{ source: "device", observedAt: "2026-08-08T10:00:00Z" }}
        now={NOW}
        stalenessPolicy={policy}
      />,
    );
    const age = container.querySelector(".zb-prov__age")!;
    expect(age.getAttribute("data-zb-staleness")).toBe("stale");
    expect(age).toHaveTextContent("4 d");
  });

  it("renders no age at all without `now`", () => {
    const { container } = render(<ProvenanceChip record={clinic} stalenessPolicy={() => 1} />);
    expect(container.querySelector(".zb-prov__age")).toBeNull();
  });

  it("coarsens the age", () => {
    expect(describeAgeShort(30_000)).toBe("just now");
    expect(describeAgeShort(12 * 60_000)).toBe("12 min");
    expect(describeAgeShort(4 * 3_600_000)).toBe("4 h");
    expect(describeAgeShort(4 * 86_400_000)).toBe("4 d");
  });
});

/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

describe("AI extraction", () => {
  const extracted: ProvenanceRecord = {
    source: "ai-extracted",
    model: "oxy-extract-3",
    span: { document: "Scanned referral", page: 2, line: 14 },
    confirmed: false,
  };

  it("states that nobody has reviewed it", () => {
    render(<ProvenanceChip record={extracted} />);
    const chip = screen.getByRole("img");
    expect(chip).toHaveTextContent("unreviewed");
    // Last in the sentence, because it is the clause that decides whether to
    // act and a listener remembers the end.
    expect(chip.getAttribute("aria-label")!.endsWith("not reviewed by a human.")).toBe(true);
  });

  it("says who confirmed it once somebody has", () => {
    render(
      <ProvenanceChip
        record={{ ...extracted, confirmed: true, confirmedBy: { display: "Dr Warren" } }}
      />,
    );
    const chip = screen.getByRole("img");
    expect(chip.textContent).not.toMatch(/unreviewed/i);
    expect(chip.getAttribute("aria-label")).toContain("confirmed by Dr Warren");
  });

  it("asks the question only for extracted values", () => {
    // Absent means the question does not apply; false means nobody looked.
    expect(describeProvenance({ source: "clinic" })).not.toContain("reviewed");
  });

  it("names the model and the span", () => {
    render(<ProvenanceChip record={extracted} />);
    const name = screen.getByRole("img").getAttribute("aria-label")!;
    expect(name).toContain("model oxy-extract-3");
    expect(name).toContain("from Scanned referral, page 2, line 14");
  });

  it("offers the span as its own labelled button", async () => {
    // The single most requested behaviour from clinicians reviewing
    // extraction, which is why it is its own handler.
    const onOpenSpan = vi.fn();
    render(<ProvenanceChip record={extracted} onOpenSpan={onOpenSpan} />);
    const button = screen.getByRole("button", { name: /View the source span/ });
    await userEvent.click(button);
    expect(onOpenSpan).toHaveBeenCalledWith(extracted.span, extracted);
  });

  it("offers no span button when there is no span", () => {
    const { span, ...noSpan } = extracted;
    void span;
    render(<ProvenanceChip record={noSpan} onOpenSpan={() => {}} />);
    expect(screen.queryByRole("button", { name: /View the source span/ })).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* The ledger                                                          */
/* ------------------------------------------------------------------ */

describe("the ledger", () => {
  const ledger = ledgerFrom({
    "obs-1": clinic,
    "obs-1@2": { source: "amended", supersedes: { value: "182/76", reason: "typo" } },
  });

  it("reads by resource id", () => {
    render(<ProvenanceChip resourceId="obs-1" ledger={ledger} />);
    expect(screen.getByRole("img").getAttribute("data-zb-source")).toBe("clinic");
  });

  it("prefers the versioned entry", () => {
    // An amended value and its original are two provenances; falling through
    // to the unversioned one would describe the wrong version of the fact.
    render(<ProvenanceChip resourceId="obs-1" versionId="2" ledger={ledger} />);
    expect(screen.getByRole("img").getAttribute("data-zb-source")).toBe("amended");
  });

  it("falls back to the unversioned entry when the version has none", () => {
    render(<ProvenanceChip resourceId="obs-1" versionId="9" ledger={ledger} />);
    expect(screen.getByRole("img").getAttribute("data-zb-source")).toBe("clinic");
  });

  it("renders nothing when the ledger has no entry", () => {
    // A chip reading "unknown" beside every unmapped value teaches readers to
    // ignore the whole column, which costs more than the gap.
    const { container } = render(<ProvenanceChip resourceId="missing" ledger={ledger} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing with neither a record nor a ledger", () => {
    const { container } = render(<ProvenanceChip />);
    expect(container.firstChild).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Amendment                                                           */
/* ------------------------------------------------------------------ */

describe("amendment", () => {
  it("carries the value it replaced and why", () => {
    render(
      <ProvenanceChip
        record={{
          source: "amended",
          supersedes: { value: "182/76", reason: "corrected by the author as a typo" },
        }}
      />,
    );
    const name = screen.getByRole("img").getAttribute("aria-label")!;
    expect(name).toContain("originally 182/76, corrected by the author as a typo");
  });
});

/* ------------------------------------------------------------------ */
/* Interaction                                                         */
/* ------------------------------------------------------------------ */

describe("interaction", () => {
  it("has no tab stop without a chain", () => {
    // There is one of these beside every value on a chart.
    render(<ProvenanceChip record={clinic} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("opens the chain from the keyboard", async () => {
    const onOpenChain = vi.fn();
    render(<ProvenanceChip record={clinic} onOpenChain={onOpenChain} />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onOpenChain).toHaveBeenCalledWith(clinic);
  });
});

/* ------------------------------------------------------------------ */
/* FHIR                                                                */
/* ------------------------------------------------------------------ */

describe("fromProvenance", () => {
  it("keeps the two dates apart", () => {
    const record = fromProvenance({
      occurredDateTime: "2026-01-14T09:00:00Z",
      recorded: "2026-03-11T00:00:00Z",
    });
    expect(record.observedAt).toBe("2026-01-14T09:00:00Z");
    expect(record.recordedAt).toBe("2026-03-11T00:00:00Z");
  });

  it("does not call an authorship an extraction", () => {
    // R4's participation types cannot distinguish the two, so guessing from
    // the agent alone would label every transcription as a model output.
    expect(toSource({ agent: [{ type: { coding: [{ code: "assembler" }] } }] })).toBe("clinic");
    expect(
      toSource({
        activity: { coding: [{ code: "derive" }] },
        agent: [{ type: { coding: [{ code: "assembler" }] } }],
      }),
    ).toBe("ai-extracted");
  });

  it("reads informant as patient-reported and transmitter as external", () => {
    expect(toSource({ agent: [{ type: { coding: [{ code: "informant" }] } }] })).toBe(
      "patient-reported",
    );
    expect(toSource({ agent: [{ type: { coding: [{ code: "transmitter" }] } }] })).toBe("external");
  });

  it("reads an update activity as an amendment", () => {
    expect(toSource({ activity: { coding: [{ code: "UPDATE" }] } })).toBe("amended");
  });

  it("prefers the author agent for the performer", () => {
    const record = fromProvenance({
      agent: [
        { type: { coding: [{ code: "transmitter" }] }, who: { display: "Gateway" } },
        { type: { coding: [{ code: "author" }] }, who: { display: "Dr Warren" } },
      ],
    });
    expect(record.performer?.display).toBe("Dr Warren");
  });
});
