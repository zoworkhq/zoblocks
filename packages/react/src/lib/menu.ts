// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/zoblocks/lib/menu.ts. Edit that file, not this one.
/**
 * A context menu for a place where the shortest path is also the fastest way
 * to do something irreversible.
 *
 * A right-click menu opens at the pointer, on top of the row that said whose
 * record this is, and offers `Copy` one line above `Discontinue`. In a
 * worklist of forty patients that is a wrong-patient error with a click of
 * runway left. The mechanics — portalling, collision, focus return, long
 * press — are solved elsewhere and solved well. What is not modelled anywhere
 * is what the menu is *about*.
 *
 * So three rules, and they are the component rather than decoration on it.
 *
 *   The menu states its subject, and the subject row is the safe landing.
 *   Every menu opens with a non-interactive header naming what was
 *   right-clicked, so the first thing under the pointer is never a verb. One
 *   decision closing two holes: the wrong-patient check and the accidental
 *   click-through.
 *
 *   Consequence is a rank, not a boolean. `variant="destructive"` is one bit
 *   and a chart has at least four states worth distinguishing. The tier
 *   decides the *interaction* — run; run and say what was written; take a
 *   second step; take a recorded reason — and consequence sorts to the bottom
 *   so the pointer has to travel to reach it.
 *
 *   The menu cannot out-disclose its trigger, and it cannot move under the
 *   cursor. A row rendered masked produces a masked header. An action whose
 *   availability is still being checked holds its final position rather than
 *   being appended when the answer arrives.
 *
 * And one rule that is the opposite of the palette's: **the menu never
 * ranks**. There you typed something and are reading the result; here you have
 * muscle memory and a pointer already in flight. Declaration order is
 * preserved exactly, frequency is never consulted, and the only thing that
 * reorders anything is the consequence band.
 *
 * No React, no DOM, no network, no clock. Runs in Node.
 */

/* ------------------------------------------------------------------ */
/* Tiers                                                               */
/* ------------------------------------------------------------------ */

/**
 * What an action costs the person who runs it.
 *
 * `routine` changes nothing anyone else will read. `documented` writes
 * something another clinician will see. `clinical` changes the patient's
 * care. `disclosive` reveals data the reader was not previously entitled to,
 * or moves it outside the organisation.
 */
export type ActionTier = "routine" | "documented" | "clinical" | "disclosive";

/**
 * The bands, in the order they are laid out.
 *
 * `TIER_ORDER` rather than `ORDER` or `KIND_ORDER`, because the npm barrel is
 * flat and `KIND_ORDER` already belongs to the command palette. Two modules
 * exporting one name is an export that silently disappears from the package.
 */
export const TIER_ORDER: readonly ActionTier[] = [
  "routine",
  "documented",
  "clinical",
  "disclosive",
];

/** The word for each tier, where one has to be shown. */
export const ACTION_TIER_LABEL: Record<ActionTier, string> = {
  routine: "Routine",
  documented: "Recorded",
  clinical: "Clinical",
  disclosive: "Disclosure",
};

/**
 * What each tier demands of the author, and what it costs the reader.
 *
 * `requires` is the field an action of that tier may not omit, and it is
 * checked by {@link validateActions}. An author cannot ship a clinical action
 * with no confirmation sentence, because a confirmation that says "Are you
 * sure?" is a confirmation nobody read.
 */
export const TIER_RULE: Record<
  ActionTier,
  {
    /** How many deliberate acts it takes to run. */
    steps: 1 | 2;
    /** The field the tier makes mandatory, if any. */
    requires: "records" | "confirm" | "reasons" | null;
    /** Whether running it produces a record the host must keep. */
    audits: boolean;
  }
> = {
  routine: { steps: 1, requires: null, audits: false },
  documented: { steps: 1, requires: "records", audits: false },
  clinical: { steps: 2, requires: "confirm", audits: false },
  disclosive: { steps: 2, requires: "reasons", audits: true },
};

/** The tier of an action, defaulting to `routine` for anything unrecognised. */
export function tierOf(action: Pick<MenuAction, "tier">): ActionTier {
  return action.tier && action.tier in TIER_RULE ? action.tier : "routine";
}

/* ------------------------------------------------------------------ */
/* Subject                                                             */
/* ------------------------------------------------------------------ */

/** The FHIR resource types the menu has a word for. Any other string passes through. */
export const RESOURCE_WORD: Record<string, string> = {
  Patient: "Patient",
  Practitioner: "Clinician",
  MedicationRequest: "Medication",
  MedicationStatement: "Medication",
  Observation: "Result",
  DiagnosticReport: "Report",
  DocumentReference: "Document",
  AllergyIntolerance: "Allergy",
  Condition: "Problem",
  Encounter: "Encounter",
  Task: "Task",
  CarePlan: "Care plan",
  ServiceRequest: "Order",
  Immunization: "Immunisation",
};

/**
 * What was right-clicked.
 *
 * `label` and `detail` are exactly what the row already showed. The menu may
 * say less than the row; it may never say more.
 */
export interface MenuSubject {
  /** FHIR resource type where there is one; any string where there is not. */
  resource: string;
  id: string;
  /** Exactly the label the row showed. */
  label: string;
  /** The qualifier that distinguishes two rows that look alike. */
  detail?: string;
  /**
   * True when the trigger row was rendered masked.
   *
   * Forces the header to stay masked. A menu that resolves a name the surface
   * was hiding has leaked the record at the exact moment the reader believed
   * the interface was protecting it — with no reason recorded and no trace.
   */
  masked?: boolean;
  /**
   * The rest of a multiple selection. Identifiers only: the menu counts them,
   * it never names them.
   */
  also?: readonly { resource: string; id: string }[];
  /** "patients", "results". Used for the bulk header; defaults to "items". */
  plural?: string;
  /**
   * The bulk header's second line — about the selection, never about one
   * member of it.
   *
   * Separate from `detail` because the first version of this fell back to it,
   * and the header read "12 patients selected · MRN 44-2871 · 34y": one
   * person's identifiers at the top of a menu whose whole job is to count
   * rather than name.
   */
  bulkDetail?: string;
}

/** The two lines of the subject header, and what they are allowed to say. */
export interface SubjectLine {
  /** The first line. A name, a count, or "Restricted record". */
  who: string;
  /** The second line, or `""`. Never a name the trigger was hiding. */
  what: string;
  /** True when the header is standing in for a record it may not describe. */
  masked: boolean;
  /** How many subjects this menu acts on. 1 for the ordinary case. */
  bulk: number;
}

/**
 * The line the menu shows for what was right-clicked.
 *
 * The invariant: **the menu cannot out-disclose its trigger.** A masked
 * subject yields the resource word and nothing else, whatever else is on the
 * object.
 */
export function describeSubject(subject: MenuSubject | null | undefined): SubjectLine {
  if (!subject) return { who: "No subject", what: "", masked: false, bulk: 0 };

  const bulk = subject.also ? subject.also.length + 1 : 1;

  if (bulk > 1) {
    return {
      who: `${bulk} ${subject.plural ?? "items"} selected`,
      what: subject.bulkDetail ?? "",
      masked: false,
      bulk,
    };
  }

  if (subject.masked) {
    return {
      who: "Restricted record",
      what: RESOURCE_WORD[subject.resource] ?? "Record",
      masked: true,
      bulk: 1,
    };
  }

  return {
    who: subject.label,
    what: subject.detail ?? RESOURCE_WORD[subject.resource] ?? "",
    masked: false,
    bulk: 1,
  };
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

/**
 * Why an action is, or is not, offered.
 *
 * Four states, because `disabled` is one boolean and it cannot tell *not yet
 * known* from *known and refused* from *withheld by policy*. All three render
 * as a greyed row in every menu I have looked at, and they are three different
 * sentences.
 */
export type Availability =
  | { status: "available" }
  /** A check is outstanding. Holds its final position; not activatable. */
  | { status: "pending" }
  /** Known and refused. Rendered in place, struck through, with the reason. */
  | { status: "unavailable"; reason: string }
  /** Policy removed it. Counted, never listed. */
  | { status: "withheld" };

/** Whether an action survives a multiple selection. Opt in, never by default. */
export type BulkBehaviour = "single" | "allowed";

/** Command, or a toggle. A toggle is view state and may never be a clinical act. */
export type ActionKind = "command" | "checkbox" | "radio";

/**
 * One verb.
 *
 * Deliberately without an `icon` field: this module is L0 and L0 holds no
 * React (ENGINEERING.md §2.2). `ChartMenuAction` in the component adds it.
 */
export interface MenuAction {
  id: string;
  label: string;
  tier: ActionTier;
  /** A heading inside the tier band. Bands are never merged across tiers. */
  group?: string;
  /** Displayed, never bound. The host owns its own shortcuts. */
  shortcut?: string;
  /**
   * Resource types this verb belongs on. Absent means every subject — right
   * for Copy and wrong for almost everything else, so `validateActions` warns
   * above `routine`.
   */
  applies?: readonly string[];
  /** Absent means available. */
  availability?: Availability;

  /** Required for `documented`: what it writes and who will read it. */
  records?: string;
  /** Required for `clinical`: the sentence shown before it runs. */
  confirm?: string;
  /** The confirm control's label. Defaults to `label`; never "OK". */
  confirmVerb?: string;
  /** Required for `disclosive`: the reasons a reader may record. */
  reasons?: readonly string[];

  /** Default `"single"`: not offered on a multiple selection. */
  bulk?: BulkBehaviour;
  /** Required when `clinical` meets `bulk: "allowed"`. `{n}` interpolates. */
  bulkConfirm?: string;

  /** View state only. Refused above `routine`. */
  kind?: ActionKind;
  checked?: boolean;
  radioGroup?: string;

  /** Routine actions only, until there is a safe triangle. */
  submenu?: readonly MenuAction[];
  /** Matched by the palette adapter. Never shown, never ranked here. */
  keywords?: readonly string[];
}

/** Who is asking, and what they are allowed to see. */
export interface MenuPolicy {
  /** Named in the withheld sentence: "hidden for a registered nurse". */
  role?: string;
  /**
   * Ids this actor may run. Anything absent is withheld and counted.
   *
   * An array rather than a `Set` so a policy object is serialisable and can
   * come straight off the wire.
   */
  permitted?: readonly string[];
  /** Whether an override path exists at all. Only affects the sentence. */
  breakGlass?: boolean;
}

/* ------------------------------------------------------------------ */
/* Resolution                                                          */
/* ------------------------------------------------------------------ */

/** One row, with the decision already made about how it renders. */
export interface ResolvedAction<A extends MenuAction = MenuAction> {
  action: A;
  tier: ActionTier;
  /** Resolved, including the demotion a multiple selection may have caused. */
  availability: Availability;
}

/** A run of rows sharing a tier, and optionally a heading. */
export interface MenuSection<A extends MenuAction = MenuAction> {
  tier: ActionTier;
  /** The author's `group`, or `null` for an unnamed run. */
  label: string | null;
  items: ResolvedAction<A>[];
}

/** Exactly what the menu will render. A renderer walks this without deciding anything. */
export interface ResolvedMenu<A extends MenuAction = MenuAction> {
  subject: SubjectLine;
  /** Banded by tier, declaration order preserved inside a band. */
  sections: MenuSection<A>[];
  /** How many the policy removed. Counted in a row, never listed. */
  withheld: number;
  /** Rows a pointer could land on. Zero is a real state with its own copy. */
  count: number;
  /** Subjects this menu acts on. */
  bulk: number;
}

function availabilityOf(action: MenuAction): Availability {
  return action.availability ?? { status: "available" };
}

/** Does this verb belong on this noun? */
export function appliesTo(action: MenuAction, subject: MenuSubject): boolean {
  if (!action.applies || action.applies.length === 0) return true;
  return action.applies.includes(subject.resource);
}

/**
 * Turn a subject, a list of actions and a policy into exactly what renders.
 *
 * Four things happen and nothing else:
 *
 *   1. Verbs that do not apply to this noun are dropped silently. They were
 *      never about this record and naming them is noise.
 *   2. Verbs the policy withholds are **counted, not listed** — the same rule
 *      the command palette applies to patients it may not name. The count is a
 *      row inside the menu, because a reader who scrolls past chrome has
 *      missed exactly the thing they needed.
 *   3. Everything else keeps its declaration order and is banded by tier.
 *      Consequence sorts to the bottom; nothing else sorts at all.
 *   4. On a multiple selection, a verb that has not declared itself bulk-safe
 *      becomes unavailable **with a reason**, not hidden. A verb that vanishes
 *      teaches somebody it does not exist.
 */
export function resolveMenu<A extends MenuAction>(
  subject: MenuSubject,
  actions: readonly A[],
  policy: MenuPolicy = {},
): ResolvedMenu<A> {
  const bulk = subject.also ? subject.also.length + 1 : 1;
  let withheld = 0;
  const kept: ResolvedAction<A>[] = [];

  for (const action of actions) {
    if (!appliesTo(action, subject)) continue;

    let availability = availabilityOf(action);
    if (availability.status === "withheld") {
      withheld += 1;
      continue;
    }
    if (policy.permitted && !policy.permitted.includes(action.id)) {
      withheld += 1;
      continue;
    }

    if (bulk > 1 && action.bulk !== "allowed") {
      availability = {
        status: "unavailable",
        reason: "Not available for a multiple selection",
      };
    }

    kept.push({ action, tier: tierOf(action), availability });
  }

  /* Band by consequence; preserve declaration order inside a band. */
  const sections: MenuSection<A>[] = [];
  for (const tier of TIER_ORDER) {
    const band = kept.filter((row) => row.tier === tier);
    if (band.length === 0) continue;

    /*
     * Inside a band, honour the author's `group` labels in first-seen order.
     * A band whose rows share one unnamed group renders no heading.
     */
    const order: string[] = [];
    const byName = new Map<string, ResolvedAction<A>[]>();
    for (const row of band) {
      const name = row.action.group ?? "";
      let bucket = byName.get(name);
      if (!bucket) {
        bucket = [];
        byName.set(name, bucket);
        order.push(name);
      }
      bucket.push(row);
    }
    for (const name of order) {
      sections.push({ tier, label: name || null, items: byName.get(name) ?? [] });
    }
  }

  return {
    subject: describeSubject(subject),
    sections,
    withheld,
    count: kept.length,
    bulk,
  };
}

/**
 * The sentence for the withheld count.
 *
 * `null` when nothing was withheld — an empty live region announces nothing,
 * so there must be no empty row either.
 *
 * `describeHiddenActions` rather than `describeWithheld`, which the command
 * palette already owns for the patients it may not name. Same idea, same
 * sentence shape, different flat-barrel name.
 */
export function describeHiddenActions(count: number, policy: MenuPolicy = {}): string | null {
  if (!count || count < 1) return null;
  const noun = count === 1 ? "action" : "actions";
  const who = policy.role ? `for ${policy.role}` : "by your role";
  const glass = policy.breakGlass ? " — break-glass required" : "";
  return `${count} further ${noun} on this record, hidden ${who}${glass}`;
}

/* ------------------------------------------------------------------ */
/* Running                                                             */
/* ------------------------------------------------------------------ */

/** What the menu already knows about a ladder in progress. */
export interface MenuLadder {
  /** The id midway through a clinical confirmation. */
  confirming?: string | null;
  /** The id whose reason list is open. */
  reasoning?: string | null;
  /** The reason chosen, if any. */
  reason?: string | null;
}

/**
 * What should happen when a row is chosen.
 *
 * `MenuOutcome`, not `RunOutcome` — the palette owns that one.
 */
export type MenuOutcome =
  | { kind: "run"; records?: string; reason?: string }
  | { kind: "confirm"; prompt: string; verb: string; bulkPrompt?: string }
  | { kind: "reason"; reasons: readonly string[]; waiting: boolean }
  | { kind: "toggle" }
  /**
   * Opens a child menu rather than doing anything.
   *
   * A submenu trigger used to fall through to `run`, so choosing "Trend" fired
   * `onRun("trend")` and closed the menu — a verb the host never wrote,
   * reported as if the reader had asked for it. The decision belongs here for
   * the same reason every other one does: the binding should not be the thing
   * that knows a row with children is not a command.
   */
  | { kind: "submenu"; items: readonly MenuAction[] }
  | { kind: "blocked"; reason: string };

/**
 * The whole ladder, decided without a DOM.
 *
 * A test can walk every path here — first activation, second activation,
 * pending, unavailable, reason chosen, reason not yet chosen — with no
 * component rendered.
 */
export function actionOutcome(action: MenuAction, ladder: MenuLadder = {}, bulk = 1): MenuOutcome {
  const availability = availabilityOf(action);

  if (availability.status === "pending") {
    return { kind: "blocked", reason: "Still checking whether this can run" };
  }
  if (availability.status === "unavailable") {
    return { kind: "blocked", reason: availability.reason };
  }
  if (availability.status === "withheld") {
    // Unreachable through `resolveMenu`, which never emits a withheld row.
    // Reachable if a host calls this directly, and silence would be wrong.
    return { kind: "blocked", reason: "Not available to you" };
  }

  const tier = tierOf(action);

  /*
   * A row with children is never a command, whatever else is on it. Checked
   * before the toggle and before the tier ladders: `validateActions` already
   * refuses anything above `routine` inside a submenu, so nothing consequential
   * can hide behind one.
   */
  if (action.submenu && action.submenu.length > 0) {
    return { kind: "submenu", items: action.submenu };
  }

  /*
   * A toggle short-circuits every ladder. `validateActions` refuses a toggle
   * above `routine`, so this can never swallow a confirmation.
   */
  if (action.kind === "checkbox" || action.kind === "radio") {
    return { kind: "toggle" };
  }

  if (tier === "clinical") {
    if (ladder.confirming !== action.id) {
      return {
        kind: "confirm",
        prompt: action.confirm ?? "This changes the patient's care.",
        /* The verb, spelled out. "OK" on a discontinue is not a sentence anyone read. */
        verb: action.confirmVerb ?? action.label,
        bulkPrompt:
          bulk > 1 && action.bulkConfirm
            ? action.bulkConfirm.replace("{n}", String(bulk))
            : undefined,
      };
    }
    return { kind: "run" };
  }

  if (tier === "disclosive") {
    const reasons = action.reasons ?? [];
    if (ladder.reasoning !== action.id) return { kind: "reason", reasons, waiting: false };
    if (!ladder.reason) return { kind: "reason", reasons, waiting: true };
    return { kind: "run", reason: ladder.reason };
  }

  if (tier === "documented") {
    return { kind: "run", records: action.records };
  }

  return { kind: "run" };
}

/* ------------------------------------------------------------------ */
/* Disclosure                                                          */
/* ------------------------------------------------------------------ */

/** How far a disclosure got. All three are recorded. */
export type DisclosureOutcome = "offered" | "disclosed" | "abandoned";

/**
 * The audit entry for a disclosive action.
 *
 * Produced on **every** path, including the one where the reader read the
 * reason list and backed out — because in a privacy review the abandoned ones
 * are the interesting ones, exactly as the empty searches are for the palette.
 * The component makes the record; the host keeps it, because the host is the
 * only thing that knows the actor and the session.
 */
export interface DisclosureRecord {
  /** An ISO instant, injected. Nothing here reads the clock. */
  at: string;
  action: string;
  subject: { resource: string; id: string };
  /**
   * Always false, and stated rather than implied.
   *
   * An audit line carrying a patient's name into a log with a wider
   * readership than the chart has made the disclosure a second time, to a
   * different audience, permanently.
   */
  subjectNamed: false;
  masked: boolean;
  reason: string | null;
  outcome: DisclosureOutcome;
  breakGlass: boolean;
}

export interface DisclosureOptions {
  /** ISO instant. Required — see {@link DisclosureRecord.at}. */
  now: string;
  outcome: DisclosureOutcome;
  reason?: string | null;
  breakGlass?: boolean;
}

/** The record, or `null` for an action that is not a disclosure. */
export function disclosureRecord(
  action: MenuAction,
  subject: MenuSubject,
  options: DisclosureOptions,
): DisclosureRecord | null {
  if (tierOf(action) !== "disclosive") return null;
  return {
    at: options.now,
    action: action.id,
    subject: { resource: subject.resource, id: subject.id },
    subjectNamed: false,
    masked: Boolean(subject.masked),
    reason: options.reason ?? null,
    outcome: options.outcome,
    breakGlass: Boolean(options.breakGlass),
  };
}

/* ------------------------------------------------------------------ */
/* Bulk                                                                */
/* ------------------------------------------------------------------ */

/**
 * Which verbs survive a multiple selection, and which do not.
 *
 * Separate from {@link resolveMenu} so a host can render the same partition in
 * a toolbar, and so "3 of 12 cannot run" is computed once rather than in two
 * places that will eventually disagree.
 */
export function bulkPartition<A extends MenuAction>(
  actions: readonly A[],
  subject: MenuSubject,
): { allowed: A[]; single: A[] } {
  const allowed: A[] = [];
  const single: A[] = [];
  for (const action of actions) {
    if (!appliesTo(action, subject)) continue;
    (action.bulk === "allowed" ? allowed : single).push(action);
  }
  return { allowed, single };
}

/* ------------------------------------------------------------------ */
/* Author validation                                                   */
/* ------------------------------------------------------------------ */

const REQUIREMENT_WHY: Record<"records" | "confirm" | "reasons", string> = {
  records: "A recorded action must say what it writes and who will read it.",
  confirm: "A clinical action must carry the sentence shown before it runs.",
  reasons: "A disclosure must offer the reasons a reader may record.",
};

/**
 * Problems in an action list, as sentences.
 *
 * This is the half of the design that is not visual: a clinical action with no
 * confirmation sentence, a disclosure with no reason list, a recorded action
 * that never says what it writes. All three render perfectly and say something
 * false, which is the class of defect this library exists to make unwritable.
 *
 * Returned rather than thrown or logged. Component source in this repository
 * does not reach `console` or `process.env`; the callers are the test suite
 * and the lint rule, both of which can fail a build.
 */
export function validateActions(actions: readonly MenuAction[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const action of actions) {
    const tier = tierOf(action);

    if (seen.has(action.id)) {
      problems.push(`Duplicate action id "${action.id}".`);
    }
    seen.add(action.id);

    const required = TIER_RULE[tier].requires;
    if (required && !action[required]) {
      problems.push(
        `\`${action.id}\` is tier="${tier}" and has no \`${required}\`. ${REQUIREMENT_WHY[required]}`,
      );
    }
    if (required === "reasons" && action.reasons && action.reasons.length === 0) {
      problems.push(
        `\`${action.id}\` offers an empty reason list, which is a disclosure with no recorded justification.`,
      );
    }
    if (tier !== "routine" && (!action.applies || action.applies.length === 0)) {
      problems.push(
        `\`${action.id}\` is tier="${tier}" with no \`applies\`, so it will be offered on every resource in the chart.`,
      );
    }
    if (tier === "clinical" && action.bulk === "allowed" && !action.bulkConfirm) {
      problems.push(
        `\`${action.id}\` is bulk-safe and clinical but has no \`bulkConfirm\`, so twelve patients would be confirmed with a sentence written for one.`,
      );
    }
    if (tier === "disclosive" && action.bulk === "allowed") {
      problems.push(
        `\`${action.id}\` is a disclosure offered in bulk. Twelve records with one justification is not a record a privacy officer accepts.`,
      );
    }
    if (action.kind === "checkbox" || action.kind === "radio") {
      if (tier !== "routine") {
        problems.push(
          `\`${action.id}\` is a ${action.kind} above tier="routine". A toggle is view state; it may not be a clinical act.`,
        );
      }
      if (action.kind === "radio" && !action.radioGroup) {
        problems.push(
          `\`${action.id}\` is a radio with no \`radioGroup\`, so nothing turns off when it turns on.`,
        );
      }
    }
    if (action.submenu && action.submenu.length === 0) {
      problems.push(
        `\`${action.id}\` declares an empty submenu, so it renders a chevron promising a menu with nothing in it.`,
      );
    }
    if (action.submenu && action.submenu.length > 0) {
      for (const child of action.submenu) {
        if (tierOf(child) !== "routine") {
          problems.push(
            `\`${child.id}\` is tier="${tierOf(child)}" inside a submenu. Submenus are routine-only until there is a safe triangle, because an accidental close mid-sweep is a mis-click on whatever the pointer crossed.`,
          );
        }
      }
    }
  }

  return problems;
}

/* ------------------------------------------------------------------ */
/* Keyboard                                                            */
/* ------------------------------------------------------------------ */

/**
 * Where the highlight goes.
 *
 * Skips `pending` rows: a row whose availability is unknown must not be
 * activatable by a fast Enter. **Keeps `unavailable` rows** — a keyboard user
 * is entitled to read the reason a verb cannot run, and skipping the row hides
 * it from them while leaving it on screen for everyone else.
 *
 * `from` of `-1` means nothing is highlighted yet, which is the state a
 * pointer-opened menu is in.
 */
export function nextIndex<A extends MenuAction>(
  rows: readonly ResolvedAction<A>[],
  from: number,
  delta: 1 | -1,
  loop = true,
): number {
  if (rows.length === 0) return -1;

  let index = from;
  for (let step = 0; step < rows.length; step += 1) {
    index += delta;
    if (index < 0) {
      if (!loop) return from;
      index = rows.length - 1;
    }
    if (index >= rows.length) {
      if (!loop) return from;
      index = 0;
    }
    const row = rows[index];
    if (!row || row.availability.status === "pending") continue;
    return index;
  }
  return from;
}

/** The rows a keyboard can reach, flattened in visual order. */
export function focusableRows<A extends MenuAction>(
  resolved: ResolvedMenu<A>,
): ResolvedAction<A>[] {
  return resolved.sections.flatMap((section) => section.items);
}

/**
 * The first character of each row's label, for type-ahead.
 *
 * First letter only in v1. A full type-ahead buffer competes with the
 * shortcuts a menu displays, and the ambiguity is worse than the omission.
 */
export function matchFirstLetter<A extends MenuAction>(
  rows: readonly ResolvedAction<A>[],
  letter: string,
  from: number,
): number {
  const wanted = letter.toLowerCase();
  for (let step = 1; step <= rows.length; step += 1) {
    const index = (from + step + rows.length) % rows.length;
    const row = rows[index];
    if (!row || row.availability.status === "pending") continue;
    if (row.action.label.charAt(0).toLowerCase() === wanted) return index;
  }
  return from;
}

/* ------------------------------------------------------------------ */
/* The palette adapter                                                 */
/* ------------------------------------------------------------------ */

/**
 * Structurally `PaletteItem` from `@/lib/zoblocks-palette`, declared here rather
 * than imported.
 *
 * The brief proposed importing the type and declaring `palette-core` as a
 * registry dependency. That would make everyone installing a context menu also
 * install the palette core and its stylesheet, to gain a type that erases at
 * compile time. Structural typing costs nothing and couples nothing;
 * `test/menu-palette-adapter.test.ts` imports both and asserts the two are
 * assignable, so the compatibility is proven rather than asserted in a
 * comment.
 */
export interface PaletteItemLike {
  id: string;
  kind: "action";
  label: string;
  detail?: string;
  keywords?: readonly string[];
  significant?: boolean;
  unavailable?: { reason: string };
}

/**
 * The same verbs, in the command palette, scoped to what is open.
 *
 * Three surfaces that diverge — right-click, the overflow button, ⌘K — is how
 * a person learns one path and loses the other two. Everything above
 * `routine` becomes `significant`, so the palette's own second-Enter rule
 * lines up with this component's second step.
 */
export function toPaletteItems<A extends MenuAction>(
  actions: readonly A[],
  subject: MenuSubject,
  policy: MenuPolicy = {},
): PaletteItemLike[] {
  const resolved = resolveMenu(subject, actions, policy);
  return focusableRows(resolved).map(({ action, tier, availability }) => {
    const item: PaletteItemLike = {
      id: action.id,
      kind: "action",
      label: action.label,
      /* The subject, so two identical verbs on two rows are not a coin toss. */
      detail: describeSubject(subject).who,
      keywords: action.keywords,
      significant: tier !== "routine",
    };
    if (availability.status === "unavailable") item.unavailable = { reason: availability.reason };
    if (availability.status === "pending") item.unavailable = { reason: "Still being checked" };
    return item;
  });
}
