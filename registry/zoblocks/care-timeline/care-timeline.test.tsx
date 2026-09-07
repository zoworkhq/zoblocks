/**
 * CareTimeline — the safety claims, not the render.
 *
 * Every failure this component exists to prevent looks fine on screen. A suite
 * that asserted "it renders a list of events" would pass on a timeline that
 * silently dropped a failed source, deleted an entry recorded in error, and
 * collapsed a critical potassium into a row labelled "14 observations". So the
 * assertions here are the claims, in words, in the output.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectStatedInWords, itMeetsTheContract } from "../../../test/contract";
import { CareTimeline } from "./care-timeline";
import { COVERAGE, EVENTS, HEALTHY_COVERAGE, NOW, SEEN_THROUGH } from "./care-timeline.fixtures";
import type { TimelineCoverage } from "@/lib/timeline-core";

const base = {
  "aria-label": "Care timeline for Ada Lovelace",
  events: EVENTS,
  now: NOW,
  localeTag: "en-GB",
  filters: false,
} as const;

itMeetsTheContract("CareTimeline", () => <CareTimeline {...base} coverage={COVERAGE} />);

describe("the claim the component exists to make", () => {
  it("names a source that could not be reached, and interrupts to do it", () => {
    // The repeat-CT case. A reader about to convert an absence into a clinical
    // fact is worth interrupting, so it is an alert rather than a footnote.
    render(<CareTimeline {...base} coverage={COVERAGE} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Northside Regional Exchange");
    expect(alert.textContent).toContain("Timed out after 8s");
  });

  it("refuses to let a failed source read as an absence", () => {
    const view = render(<CareTimeline {...base} coverage={COVERAGE} />);
    expectStatedInWords(view, /not a statement that no such records exist/i);
  });

  it("states the total, the order and the window in words", () => {
    render(<CareTimeline {...base} coverage={COVERAGE} />);
    expect(screen.getByText(/Showing \d+ of 43 events/)).toBeInTheDocument();
    expect(document.body.textContent).toContain("newest first");
  });

  it("accounts for every event that is not on the page", () => {
    // 43 known, some rendered, and everything else named: beyond this page,
    // hidden by a filter, or not readable by this reader.
    render(<CareTimeline {...base} coverage={COVERAGE} limit={4} />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Showing 4 of 43 events/);
    expect(text).toMatch(/37 beyond this page/);
    expect(text).toMatch(/2 you do not have access to/);
  });

  it("states the filter and the count it hides, not only inside the filter", () => {
    render(<CareTimeline {...base} coverage={COVERAGE} filters defaultRegisters={["clinical"]} />);
    expect(document.body.textContent).toMatch(/hidden by the .+ filter/);
  });

  it("distinguishes three empty states that are three different facts", () => {
    const source = { id: "ehr", label: "Northside EHR", status: "ok" } as const;
    const cases: [TimelineCoverage, RegExp][] = [
      [{ order: "newest-first", sources: [source] }, /no records for this person in any source/i],
      [
        { order: "newest-first", window: { from: "2025-01-01" }, sources: [source] },
        /This window was searched and returned nothing/i,
      ],
      [
        { order: "newest-first", hidden: [{ reason: "access", count: 3 }], sources: [source] },
        /none of them are ones you have access to read/i,
      ],
    ];

    for (const [coverage, expected] of cases) {
      const view = render(
        <CareTimeline {...base} events={[]} coverage={coverage} aria-label="Empty" />,
      );
      expectStatedInWords(view, expected);
      view.unmount();
    }
  });
});

describe("the record's own rules", () => {
  it("renders an entry recorded in error, struck and marked, and never removes it", () => {
    // Retaining and marking is what the standard requires; filtering it out of
    // the query is the implementation everyone reaches for and the one thing
    // forbidden. There is no prop here that hides it.
    const { container } = render(<CareTimeline {...base} coverage={COVERAGE} />);
    expect(screen.getByText("Emergency department attendance")).toBeInTheDocument();
    expect(container.querySelector(".zb-care-timeline__item--in-error")).not.toBeNull();
    expect(document.body.textContent).toContain("Entered in error");
  });

  it("shows what an amendment changed, not only that it changed", () => {
    render(<CareTimeline {...base} coverage={COVERAGE} />);
    const item = screen.getByText("HbA1c — 8.9%").closest("li");
    expect(within(item as HTMLElement).getByText(/previously 9\.4%/)).toBeInTheDocument();
  });

  it("says a record exists that the reader may not open, without saying what it is", () => {
    render(<CareTimeline {...base} coverage={COVERAGE} />);
    expect(screen.getByText(/do not have access to it/)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("Discharge summary");
  });

  it("keeps a year-only date a year", () => {
    // A FHIR `2019` means 2019. Widening it to 1 January invents a precision
    // nobody recorded, and every downstream calculation inherits the invention.
    render(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} group="none" />);
    const item = screen.getByText("Gestational diabetes").closest("li");
    const time = item?.querySelector("time");
    expect(time?.getAttribute("datetime")).toBe("2019");
    expect(time?.textContent).toBe("2019");
  });

  it("renders a stamp in the record's own zone, not the reader's", () => {
    render(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} group="none" />);
    const item = screen.getByText("Metformin 1 g — twice daily").closest("li");
    // 09:30 in New York stays 09:30 in New York for a clinician in Chennai.
    expect(item?.querySelector("time")?.textContent).toContain("09:30");
    expect(item?.querySelector("time")?.textContent).toContain("-04:00");
  });
});

describe("planned is not happened", () => {
  it("puts a future event above the now marker", () => {
    render(<CareTimeline {...base} coverage={COVERAGE} />);
    const text = document.body.textContent ?? "";
    expect(text.indexOf("Endocrinology review")).toBeLessThan(text.indexOf("Now —"));
  });

  it("says what a lapsed appointment does not know, rather than calling it a no-show", () => {
    const view = render(<CareTimeline {...base} coverage={COVERAGE} />);
    expectStatedInWords(view, /no encounter has been recorded against it/i);
    expect(view.container.textContent).not.toMatch(/no.?show|missed/i);
  });

  it("derives lapsed from the caller's now, never the clock", () => {
    // Same events, an earlier `now`, and the appointment is planned again.
    render(<CareTimeline {...base} coverage={COVERAGE} now="2026-08-01T09:00:00+05:30" />);
    const item = screen.getByText("Diabetic retinal screening").closest("li");
    expect(item?.textContent).toContain("Planned");
    expect(item?.textContent).not.toContain("Lapsed");
  });

  it("keeps an attempt that did not connect distinct from one somebody cancelled", () => {
    render(<CareTimeline {...base} coverage={COVERAGE} />);
    expect(screen.getByText("Follow-up call").closest("li")?.textContent).toContain(
      "Did not connect",
    );
    expect(screen.getByText("Podiatry review").closest("li")?.textContent).toContain("Cancelled");
  });
});

describe("markup a screen reader can use", () => {
  it("names every list it renders", () => {
    render(<CareTimeline {...base} coverage={COVERAGE} seenThrough={SEEN_THROUGH} />);
    for (const list of screen.getAllByRole("list")) {
      const name = list.getAttribute("aria-label") ?? list.getAttribute("aria-labelledby") ?? "";
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("hides the relative time from the accessibility tree and keeps the absolute one", () => {
    // Spoken aloud, "four days ago" doubles the length of every item and adds
    // nothing the date has not said. It is never the only time.
    const { container } = render(<CareTimeline {...base} coverage={COVERAGE} />);
    const ago = container.querySelector(".zb-care-timeline__ago");
    expect(ago?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelectorAll("time").length).toBeGreaterThan(5);
  });

  it("labels a thread's steps so an unreturned form is legible", () => {
    render(<CareTimeline {...base} coverage={COVERAGE} />);
    const item = screen.getByText("Pre-visit medical history").closest("li");
    expect(item?.textContent).toContain("Sent to the patient");
    expect(item?.textContent).toContain("Not yet reviewed");
  });

  it("splits a group into two named lists at the since-you-last-looked boundary", () => {
    const { container } = render(
      <CareTimeline {...base} coverage={COVERAGE} seenThrough={SEEN_THROUGH} />,
    );
    expect(container.textContent).toContain("New since you last reviewed this chart");
    const named = [...container.querySelectorAll("ol.zb-timeline")].map((list) =>
      list.getAttribute("aria-label"),
    );
    expect(named.some((name) => name?.includes("earlier"))).toBe(true);
  });
});

describe("the reader's own controls", () => {
  it("toggles a register off and folds the cost into the sentence", async () => {
    const user = userEvent.setup();
    render(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} filters />);

    const admin = screen.getByRole("button", { name: "Administrative" });
    expect(admin.getAttribute("aria-pressed")).toBe("true");
    await user.click(admin);

    expect(admin.getAttribute("aria-pressed")).toBe("false");
    // The filter's cost has to be visible where the reader is looking, not
    // only inside the control that caused it.
    expect(document.body.textContent).toMatch(/hidden by the/);
  });

  it("stays controlled when the caller owns the filter", async () => {
    const user = userEvent.setup();
    const onRegistersChange = vi.fn();
    render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        filters
        registers={["clinical"]}
        onRegistersChange={onRegistersChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clinical" }));
    expect(onRegistersChange).toHaveBeenCalledWith([]);
    // Controlled means controlled: the component does not move on its own.
    expect(screen.getByRole("button", { name: "Clinical" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("makes an event's title the control, not the whole row", async () => {
    // A clickable row steals every text selection, and a chronology is read by
    // selecting things out of it.
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Diabetes review clinic" }));
    expect(onSelect.mock.calls[0]?.[0]?.id).toBe("enc-diabetes");
  });

  it("links into the record when the caller gives an href", () => {
    render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        events={[{ ...EVENTS[4]!, href: "/chart/enc/1" }]}
      />,
    );
    expect(screen.getByRole("link", { name: "Diabetes review clinic" }).getAttribute("href")).toBe(
      "/chart/enc/1",
    );
  });

  it("offers older records as a button, never as infinite scroll", () => {
    // A chronology with no bottom cannot be printed, cannot be finished, and
    // cannot be reasoned about.
    const onLoadOlder = vi.fn();
    render(<CareTimeline {...base} coverage={COVERAGE} onLoadOlder={onLoadOlder} />);
    expect(screen.getByRole("button", { name: /Load older records/ })).toBeInTheDocument();
  });

  it("expands a cluster in place, keeping the reader's position", async () => {
    const user = userEvent.setup();
    render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        cluster={{ kinds: ["observation"], within: "P3D", min: 3 }}
      />,
    );
    const toggle = screen.getByRole("button", { name: /observation records/i });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Weight — 71.4 kg")).toBeInTheDocument();
  });
});

describe("layout and grouping", () => {
  it.each(["default", "card", "compact", "register"] as const)("renders layout %s", (layout) => {
    const { container } = render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        layout={layout}
        limit={layout === "card" ? 5 : undefined}
      />,
    );
    expect(container.querySelector(`[data-zb-layout="${layout}"]`)).not.toBeNull();
    // Whatever the layout, the sentence is there.
    expect(container.textContent).toMatch(/Showing/);
  });

  it("splits register layout into two columns, on the register", () => {
    // This assertion exists because the first version of this test checked the
    // data attribute and the coverage sentence — both of which were true while
    // layout="register" rendered exactly the same tree as the default. A
    // layout test has to assert the layout.
    const { container } = render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} layout="register" group="none" />,
    );
    // Scoped by the column's own heading rather than by index: the planned
    // section has its own pair, so an index here would silently test the wrong
    // two columns.
    const columns = [...container.querySelectorAll<HTMLElement>(".zb-care-timeline__column")];
    const headed = (word: string) =>
      columns.filter((column) =>
        column.querySelector(".zb-care-timeline__column-head")?.textContent?.includes(word),
      );
    expect(headed("Clinical").length).toBeGreaterThan(0);
    expect(headed("Administrative").length).toBeGreaterThan(0);

    const clinical = headed("Clinical")
      .map((c) => c.textContent)
      .join(" ");
    const other = headed("Administrative")
      .map((c) => c.textContent)
      .join(" ");
    // An encounter is clinical; an appointment and a phone call are not.
    expect(clinical).toContain("Diabetes review clinic");
    expect(clinical).not.toContain("Follow-up call");
    expect(other).toContain("Follow-up call");
    expect(other).not.toContain("Diabetes review clinic");
  });

  it("names both columns, so a rotor can tell them apart", () => {
    const { container } = render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} layout="register" group="none" />,
    );
    const names = [...container.querySelectorAll("ol.zb-timeline")].map((list) =>
      list.getAttribute("aria-label"),
    );
    expect(names.some((name) => name?.includes("Clinical"))).toBe(true);
    expect(names.some((name) => name?.includes("Administrative"))).toBe(true);
  });

  it("keeps every event when the columns split", () => {
    // The split is another transformation over the row list, and the invariant
    // that matters is the same one the engine holds: nothing is lost.
    const { container } = render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} layout="register" group="none" />,
    );
    // `ol.zb-timeline > li` rather than every `li`: the coverage footer lists
    // its sources as a list too, and counting those made the first version of
    // this test compare twenty-one rows against twenty-two rows-plus-a-source.
    const rows = (root: HTMLElement) => root.querySelectorAll("ol.zb-timeline > li").length;
    const split = rows(container);
    const flat = rows(
      render(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} layout="default" group="none" />)
        .container,
    );
    expect(split).toBe(flat);
  });

  it.each(["month", "quarter", "year", "none"] as const)("groups by %s", (group) => {
    const { container } = render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} group={group} />,
    );
    expect(container.querySelectorAll("ol.zb-timeline").length).toBeGreaterThan(0);
  });

  it("heads a year-only event with its year, not with an invented January", () => {
    const { container } = render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} group="month" headingLevel={3} />,
    );
    const headings = [...container.querySelectorAll("h3")].map((h) => h.textContent ?? "");
    expect(headings.some((text) => text.includes("2019"))).toBe(true);
    expect(headings.some((text) => text.includes("January 2019"))).toBe(false);
  });

  it("renders no period heading when there is no period", () => {
    const { container } = render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        layout="card"
        limit={5}
        headingLevel={3}
      />,
    );
    const headings = [...container.querySelectorAll("h3")].map((h) => h.textContent ?? "");
    expect(headings.some((text) => /All/i.test(text))).toBe(false);
  });

  it("labels a group as a heading only when the caller says which level", () => {
    const withLevel = render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} headingLevel={3} />,
    );
    expect(withLevel.container.querySelectorAll("h3").length).toBeGreaterThan(0);
    withLevel.unmount();

    // Without one, no heading is claimed: a timeline four levels deep inside a
    // chart page would otherwise produce an outline worse than none.
    const without = render(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} />);
    expect(without.container.querySelectorAll("h1,h2,h3,h4,h5,h6")).toHaveLength(0);
  });

  it("marks a declared gap on the rail and says what it means", () => {
    const { container } = render(<CareTimeline {...base} coverage={COVERAGE} />);
    expect(container.querySelector(".zb-care-timeline__item--gap")).not.toBeNull();
    expect(container.textContent).toMatch(/Records may be missing here/);
  });

  it("takes individual words from the caller without losing the rest", () => {
    render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        locale={{ loadOlder: "Fetch earlier" }}
        onLoadOlder={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Fetch earlier" })).toBeInTheDocument();
    expect(document.body.textContent).toContain("newest first");
  });
});

describe("the parts of an event that are optional", () => {
  it("names a recipient even when there is no actor", () => {
    render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        events={[
          {
            id: "x",
            kind: "message",
            occurred: "2026-08-10T09:00:00+05:30",
            title: "Appointment reminder",
            recipient: { name: "The patient" },
          },
        ]}
      />,
    );
    expect(document.body.textContent).toContain("The patient");
  });

  it("states an amendment's reason and its previous value independently", () => {
    const reasonOnly = render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        events={[
          {
            id: "a",
            kind: "note",
            occurred: "2026-08-10",
            status: "amended",
            title: "Progress note",
            revision: { at: "2026-08-11", reason: "typo corrected" },
          },
        ]}
      />,
    );
    expect(reasonOnly.container.textContent).toContain("typo corrected");
    expect(reasonOnly.container.textContent).not.toContain("previously");
    reasonOnly.unmount();

    const valueOnly = render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        events={[
          {
            id: "b",
            kind: "laboratory",
            occurred: "2026-08-10",
            status: "corrected",
            title: "HbA1c",
            revision: { at: "2026-08-11", was: "9.4%" },
          },
        ]}
      />,
    );
    expect(valueOnly.container.textContent).toContain("previously 9.4%");
  });

  it("renders an event whose date it cannot read, rather than dropping it", () => {
    // An unreadable date is still a record. Dropping it silently is the one
    // thing the coverage sentence cannot compensate for.
    render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        events={[{ id: "x", kind: "note", occurred: "last Tuesday", title: "Undated note" }]}
      />,
    );
    expect(screen.getByText("Undated note")).toBeInTheDocument();
    expect(screen.getByText("last Tuesday")).toBeInTheDocument();
  });

  it("renders a thread step that did not happen", () => {
    render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        events={[
          {
            id: "x",
            kind: "questionnaire",
            occurred: "2026-08-10",
            title: "Screening form",
            steps: [
              { label: "Sent", at: "2026-08-10", state: "done" },
              { label: "Reminder not sent", state: "not-done" },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText("Reminder not sent")).toBeInTheDocument();
  });

  it("labels an unrecognised kind with the words the caller supplied", () => {
    render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        events={[
          {
            id: "x",
            kind: "other",
            typeLabel: "Transport booking",
            occurred: "2026-08-10",
            title: "Ambulance booked",
          },
        ]}
      />,
    );
    expect(document.body.textContent).toContain("Transport booking");
  });

  it("states when a record was written, once the gap is worth stating", () => {
    // A note written six days after the visit it describes is a different
    // document, evidentially, from one written that afternoon.
    render(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} lateEntryAfter="P2D" />);
    expect(document.body.textContent).toMatch(/recorded /);
  });

  it("falls back to the record's own spelling when a date will not parse", () => {
    render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        events={[
          {
            id: "a",
            kind: "note",
            occurred: "2026-08-10",
            status: "amended",
            title: "Progress note",
            revision: { at: "some time in August", reason: "clarified" },
            steps: [{ label: "Drafted", at: "not recorded", state: "done" }],
          },
        ]}
      />,
    );
    // Rendering the string the record holds beats rendering nothing, and beats
    // inventing a date the record does not contain.
    expect(document.body.textContent).toContain("some time in August");
    expect(document.body.textContent).toContain("not recorded");
  });

  it("labels a cluster of an unrecognised kind", () => {
    const events = [0, 1, 2, 3].map((index) => ({
      id: `o${index}`,
      kind: "other" as const,
      typeLabel: "Transport booking",
      occurred: `2026-08-0${index + 1}`,
      title: `Booking ${index}`,
    }));
    render(
      <CareTimeline
        {...base}
        coverage={HEALTHY_COVERAGE}
        events={events}
        cluster={{ kinds: ["other"], within: "P7D", min: 3 }}
      />,
    );
    // The cluster chip has to say something even when the vocabulary does not
    // have a word for the kind.
    expect(screen.getByRole("button", { name: /other records/i })).toBeInTheDocument();
  });

  it("names a partial source and an excluded one differently", () => {
    render(
      <CareTimeline
        {...base}
        coverage={{
          order: "newest-first",
          sources: [
            {
              id: "a",
              label: "Northside EHR",
              status: "partial",
              detail: "Older than 2020 not searched.",
            },
            {
              id: "b",
              label: "Patient-entered",
              status: "excluded",
              detail: "Excluded by filter.",
            },
          ],
        }}
      />,
    );
    expect(document.body.textContent).toContain("Older than 2020 not searched");
    expect(document.body.textContent).toContain("Excluded by filter");
    // Neither is a failure, so neither interrupts.
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("the controls the brief promised", () => {
  it("moves the reader to a period without changing what is shown", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} jump group="month" />,
    );

    const before = container.querySelectorAll("li").length;
    const select = screen.getByLabelText(/Jump to/);
    const options = [...select.querySelectorAll("option")].map((option) => option.value);
    expect(options.length).toBeGreaterThan(2);

    await user.selectOptions(select, options[2] as string);
    // A control that filtered and navigated at once would make the coverage
    // sentence ambiguous, so this one only navigates.
    expect(container.querySelectorAll("li").length).toBe(before);
    expect(container.textContent).toMatch(/Showing/);
  });

  it("lands focus on the heading it jumped to", async () => {
    const user = userEvent.setup();
    render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} jump group="month" headingLevel={3} />,
    );
    const select = screen.getByLabelText(/Jump to/);
    const options = [...select.querySelectorAll("option")].map((option) => option.value);
    await user.selectOptions(select, options[2] as string);
    // Scrolling without moving focus leaves a keyboard user where they were
    // and tells them nothing.
    expect(document.activeElement?.className).toContain("zb-care-timeline__group");
  });

  it("filters by kind, and says what that cost", () => {
    render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} kinds={["encounter", "laboratory"]} />,
    );
    expect(screen.getByText("Diabetes review clinic")).toBeInTheDocument();
    expect(screen.queryByText("Follow-up call")).toBeNull();
    expect(document.body.textContent).toMatch(/hidden by the/);
  });

  it("attributes a patient-reported event to the patient", () => {
    // Not a hedge. "Patient reported" beside a symptom onset is the correct
    // attribution, and it changes how the next reader weighs the fact.
    render(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} group="none" />);
    const item = screen.getByText("Gestational diabetes").closest("li");
    expect(item?.textContent).toContain("Patient reported");
  });
});

describe("arrivals", () => {
  it("says nothing on first render", () => {
    // Everything is new then, and announcing the whole chart is the same as
    // announcing nothing.
    const { container } = render(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} />);
    const region = container.querySelector("[aria-live]");
    expect(region).not.toBeNull();
    expect(region?.textContent).toBe("");
  });

  it("announces what arrived, as content rather than as a count", async () => {
    const { container, rerender } = render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} events={EVENTS.slice(1)} />,
    );
    rerender(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} events={EVENTS} />);

    const region = container.querySelector("[aria-live]");
    // The point of a live region on a chart is that a result announces itself.
    // "1 new item" is a notification and tells the reader nothing they can act on.
    expect(region?.textContent).toContain("Endocrinology review");
    expect(region?.textContent).not.toMatch(/^\d+ new/);
  });

  it("keeps the region rendered while it is empty", () => {
    // A live region that appears only when needed is one the screen reader was
    // never watching when it mattered.
    const { container } = render(
      <CareTimeline {...base} coverage={HEALTHY_COVERAGE} events={[]} />,
    );
    expect(container.querySelector("[aria-live='polite']")).not.toBeNull();
  });
});

describe("audience", () => {
  it("selects a different catalog, not a softer tone", () => {
    render(<CareTimeline {...base} coverage={HEALTHY_COVERAGE} audience="patient" />);
    // "Visit" and "Test result" are what a person recognises. "Encounter" and
    // "Laboratory" are what a chart says.
    expect(document.body.textContent).toContain("Visit");
    expect(document.body.textContent).toContain("Test result");
    expect(document.body.textContent).not.toContain("Encounter");
  });
});

describe("the host stays in control", () => {
  it("reports the coverage it rendered, and writes no audit record itself", () => {
    const onRead = vi.fn();
    render(<CareTimeline {...base} coverage={COVERAGE} onRead={onRead} />);
    expect(onRead).toHaveBeenCalledTimes(1);
    expect(onRead.mock.calls[0]?.[0]?.sources).toHaveLength(2);
  });

  it("surfaces a coverage claim it cannot trust rather than rendering around it", () => {
    // A source that failed with no reason tells the reader only that something
    // did. The component says so instead of quietly accepting it.
    const broken: TimelineCoverage = {
      order: "newest-first",
      sources: [{ id: "hie", label: "Regional exchange", status: "unavailable" }],
    };
    render(<CareTimeline {...base} events={[]} coverage={broken} />);
    expect(screen.getByRole("alert").textContent).toMatch(/say what happened/i);
  });
});
