/**
 * The FHIR adapters, held to the one rule that makes them worth shipping.
 *
 * An adapter that quietly drops what it does not understand has told the same
 * lie the timeline exists to prevent — one layer further down, where nobody
 * will look for it. Everything else here follows from that: the states a
 * conventional mapping erases (`entered-in-error`, `not-done`, an unreturned
 * form, a late entry) each get an assertion, because each renders perfectly as
 * something else.
 */

import { describe, expect, it } from "vitest";
import { TIMELINE_RESOURCE_TYPES, toTimelineEvents } from "../registry/zoblocks/lib/timeline-fhir";
import type { Encounter } from "@zoblocks/fhir";
import {
  appointmentLapsed,
  communicationNotDone,
  documentLateEntry,
  encounterInError,
  encounterRoutine,
  immunizationRefused,
  observationPotassiumCritical,
  provenanceLateEntry,
  questionnaireUnreturned,
  timelineBundle,
} from "@zoblocks/fixtures";

const NOW = "2026-08-18T10:40:00+05:30";

describe("nothing is dropped quietly", () => {
  it("reports what it could not map, by type and count", () => {
    const { events, unmapped } = toTimelineEvents(timelineBundle, { now: NOW });
    expect(events).toHaveLength(8);
    expect(unmapped).toEqual([{ type: "CarePlan", count: 1 }]);
  });

  it("counts a resource of a known type with no readable date as unmapped", () => {
    // Understanding the type is not the same as being able to place it. An
    // encounter with no period is still a record, and silently discarding it
    // would make the coverage sentence wrong.
    const encounter: Encounter = { resourceType: "Encounter", id: "no-date", status: "finished" };
    const { events, unmapped } = toTimelineEvents([encounter]);
    expect(events).toHaveLength(0);
    expect(unmapped).toEqual([{ type: "Encounter", count: 1 }]);
  });

  it("names the resource types it reads, so a caller can check before querying", () => {
    expect(TIMELINE_RESOURCE_TYPES).toContain("Encounter");
    expect(TIMELINE_RESOURCE_TYPES).toContain("QuestionnaireResponse");
    expect(TIMELINE_RESOURCE_TYPES).not.toContain("Provenance");
  });
});

describe("the states a conventional mapping erases", () => {
  it("maps entered-in-error straight through instead of filtering it", () => {
    const { events } = toTimelineEvents([encounterInError]);
    expect(events[0]?.status).toBe("in-error");
    expect(events[0]?.title).toBe("Emergency department attendance");
  });

  it("keeps an attempt that did not connect distinct from a cancellation", () => {
    const { events } = toTimelineEvents([communicationNotDone]);
    expect(events[0]?.status).toBe("not-done");
    expect(events[0]?.kind).toBe("call");
    // Sender and recipient are separate fields, so a reminder cannot end up
    // addressed to the clinician who sent it.
    expect(events[0]?.actor?.name).toBe("Priya Menon");
    expect(events[0]?.recipient?.name).toBe("Amara Okonkwo");
  });

  it("renders a form that was sent and never came back as an open step", () => {
    const { events } = toTimelineEvents([questionnaireUnreturned]);
    expect(events[0]?.status).toBe("in-progress");
    expect(events[0]?.steps?.map((step) => step.state)).toEqual(["done", "open"]);
  });

  it("treats a refused dose as an answer, not a missing record", () => {
    const { events } = toTimelineEvents([immunizationRefused]);
    expect(events[0]?.status).toBe("not-done");
    expect(events[0]?.detail).toBe("Patient declined");
  });

  it("leaves a booked appointment planned, for the component to age", () => {
    // The adapter never decides what time it is. `lapsed` is derived in the
    // component from the caller's `now`, so the two cannot disagree.
    const { events } = toTimelineEvents([appointmentLapsed], { now: NOW });
    expect(events[0]?.status).toBe("planned");
  });

  it("marks an appointment an encounter refers to as having happened", () => {
    const linked: Encounter = {
      ...encounterRoutine,
      appointment: [{ reference: "Appointment/syn-appt-lapsed" }],
    };
    const { events } = toTimelineEvents([appointmentLapsed, linked], { now: NOW });
    const appointment = events.find((event) => event.kind === "appointment");
    expect(appointment?.status).toBe("occurred");
  });

  it("carries a critical interpretation with the words that explain it", () => {
    const { events } = toTimelineEvents([observationPotassiumCritical]);
    expect(events[0]?.severity).toBe("critical");
    expect(events[0]?.severityStatus?.length).toBeGreaterThan(0);
  });

  it("reads Provenance for when the record was written, not as an event", () => {
    const { events } = toTimelineEvents([documentLateEntry], {
      provenance: [provenanceLateEntry],
    });
    expect(events).toHaveLength(1);
    // Occurred 12 August, recorded 18 August. That six-day gap is what every
    // retrospective chart review turns on.
    expect(events[0]?.occurred).toContain("2026-08-12");
    expect(events[0]?.recorded).toContain("2026-08-18");
  });

  it("maps an unrecognised status to unknown, never to occurred", () => {
    // Asserting something happened because the source used a word we do not
    // have is the component making a claim on the record's behalf.
    const odd: Encounter = {
      resourceType: "Encounter",
      id: "x",
      status: "wat" as never,
      period: { start: "2026-01-01" },
    };
    const { events } = toTimelineEvents([odd]);
    expect(events[0]?.status).toBe("unknown");
  });
});

describe("ids are stable", () => {
  it("gives a resource with no id the same id on every pass", () => {
    // The tie-break in compareByTime falls back to the id. An id that changes
    // between renders means two renders of the same chart disagree about the
    // order of same-second records, and neither looks wrong.
    const resource = { resourceType: "Encounter", period: { start: "2026-01-01" } } as never;
    const first = toTimelineEvents([resource]).events[0]?.id;
    const second = toTimelineEvents([resource]).events[0]?.id;
    expect(first).toBe(second);
  });

  it("attaches the source, so the coverage sentence can name it", () => {
    const { events } = toTimelineEvents([encounterRoutine], { source: "hie" });
    expect(events[0]?.source).toBe("hie");
  });
});
