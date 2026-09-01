/* =====================================================================
   Oxygen ChartContextMenu — working prototype of the proposed core.

   This is not mockup scaffolding. Every interactive figure in this report
   is driven by the functions below, and they are written to the API the
   report proposes. If a signature here is awkward, that is a finding
   about the proposal, not about the prototype.

   Three rules the production code inherits, all visible here:

     1. NOTHING READS THE WALL CLOCK. `NOW` is injected. ENGINEERING.md §9
        forbids a component deciding what to render from `Date.now()`,
        because output that depends on when it rendered cannot be
        visually regression-tested.
     2. NO NETWORK, NO TELEMETRY, NO DOM. ADR 0009. Availability is data
        passed in; every consequence is reported through a callback the
        host owns. This file would run in Node or a Vue app unchanged.
     3. THE MENU NEVER RANKS. The palette ranks, because there you typed
        and are reading. Here you have muscle memory and a pointer already
        in flight, so declaration order is preserved exactly — and the one
        thing the menu does sort by is consequence.
   ===================================================================== */
(function (global) {
  "use strict";

  var Ox = global.Ox || (global.Ox = {});
  var M = {};
  Ox.menu = M;

  /* =================================================================
     Tiers — consequence is a rank, not a boolean.
     ================================================================= */

  /**
   * Four tiers, and the band each one sits in.
   *
   * `variant="destructive"` is one bit of information and healthcare has
   * at least four states worth distinguishing: something that changes
   * nothing, something that other clinicians will read, something that
   * changes the patient's care, and something that reveals data the
   * reader was not previously entitled to.
   */
  var TIER_ORDER = ["routine", "documented", "clinical", "disclosive"];
  M.TIER_ORDER = TIER_ORDER;

  var ACTION_TIER_LABEL = {
    routine: "Routine",
    documented: "Recorded",
    clinical: "Clinical",
    disclosive: "Disclosure",
  };
  M.ACTION_TIER_LABEL = ACTION_TIER_LABEL;

  /**
   * What each tier costs the user, and what the component demands of the
   * author in return. The `requires` column is checked by
   * `validateActions` and, in the real build, by an eslint rule — an
   * author cannot ship a clinical action with no confirmation sentence.
   */
  var TIER_RULE = {
    routine: { steps: 1, requires: null, audits: false },
    documented: { steps: 1, requires: "records", audits: false },
    clinical: { steps: 2, requires: "confirm", audits: false },
    disclosive: { steps: 2, requires: "reasons", audits: true },
  };
  M.TIER_RULE = TIER_RULE;

  function tierOf(a) {
    return a && TIER_RULE[a.tier] ? a.tier : "routine";
  }
  M.tierOf = tierOf;

  /* =================================================================
     Applicability
     ================================================================= */

  /**
   * Does this verb belong on this noun?
   *
   * `applies` absent means "any subject" — which is right for Copy and
   * wrong for almost everything else, so the validator warns when an
   * action above `routine` omits it.
   */
  function appliesTo(action, subject) {
    if (!action.applies || !action.applies.length) return true;
    return action.applies.indexOf(subject.resource) !== -1;
  }
  M.appliesTo = appliesTo;

  /* =================================================================
     Subject
     ================================================================= */

  /**
   * The line the menu shows for what was right-clicked.
   *
   * The invariant: **the menu cannot out-disclose its trigger.** A row
   * rendered masked produces a masked header. A menu that helpfully
   * resolves the name the row was hiding has leaked the record at the
   * exact moment the reader believed the interface was protecting it.
   */
  function describeSubject(subject) {
    if (!subject) return { who: "No subject", what: "", masked: false, bulk: 0 };
    var n = subject.also ? subject.also.length + 1 : 1;
    if (n > 1) {
      return {
        who: n + " " + (subject.plural || "items") + " selected",
        /*
         * NOT `subject.detail`. The prototype shipped that for an hour and
         * the bulk header read "12 patients selected / MRN 44-2871 · 34y" —
         * one person's identifiers printed at the top of a menu whose entire
         * job is to count rather than name. `bulkDetail` is the host's, is
         * about the selection, and is usually absent.
         */
        what: subject.bulkDetail || "",
        masked: false,
        bulk: n,
      };
    }
    if (subject.masked) {
      return {
        who: "Restricted record",
        what: RESOURCE_WORD[subject.resource] || "Record",
        masked: true,
        bulk: 1,
      };
    }
    return {
      who: subject.label,
      what: subject.detail || RESOURCE_WORD[subject.resource] || "",
      masked: false,
      bulk: 1,
    };
  }
  M.describeSubject = describeSubject;

  var RESOURCE_WORD = {
    Patient: "Patient",
    MedicationRequest: "Medication",
    Observation: "Result",
    DocumentReference: "Document",
    AllergyIntolerance: "Allergy",
    Encounter: "Encounter",
    Condition: "Problem",
    Task: "Task",
    CarePlan: "Care plan",
  };
  M.RESOURCE_WORD = RESOURCE_WORD;

  /* =================================================================
     Resolution — the whole component, in one pure function.
     ================================================================= */

  function availabilityOf(a) {
    return (a && a.availability) || { status: "available" };
  }

  /**
   * Turn a subject, a list of actions and a policy into exactly what the
   * menu will render.
   *
   * Four things happen here and nothing else:
   *
   *   1. Actions that do not apply to this noun are dropped silently.
   *      They were never about this record and naming them is noise.
   *   2. Actions the policy withholds are **counted, not listed** — the
   *      same rule the command palette applies to patients it may not
   *      name. The count is a row in the menu, because a reader who does
   *      not see it concludes the record supports nothing else.
   *   3. Everything else keeps its declaration order and is banded by
   *      tier. Consequence sorts to the bottom; nothing else sorts at all.
   *   4. On a multiple selection, an action that has not declared itself
   *      bulk-safe becomes unavailable **with a reason**, not hidden.
   *
   * Returns a structure a renderer can walk without making a decision.
   */
  function resolveMenu(subject, actions, policy) {
    policy = policy || {};
    var bulk = subject && subject.also ? subject.also.length + 1 : 1;
    var withheld = 0;
    var kept = [];

    for (var i = 0; i < actions.length; i++) {
      var a = actions[i];
      if (!appliesTo(a, subject)) continue;

      var av = availabilityOf(a);
      if (av.status === "withheld") {
        withheld++;
        continue;
      }
      if (policy.permitted && policy.permitted.indexOf(a.id) === -1) {
        withheld++;
        continue;
      }

      /* Bulk: shown with the reason, never removed. A verb that vanishes
         on a multiple selection teaches somebody it does not exist. */
      if (bulk > 1 && a.bulk !== "allowed") {
        av = { status: "unavailable", reason: "Not available for a multiple selection" };
      }

      kept.push({
        action: a,
        tier: tierOf(a),
        availability: av,
        band: TIER_ORDER.indexOf(tierOf(a)),
      });
    }

    /* Band by consequence; preserve declaration order inside a band. */
    var bands = [[], [], [], []];
    for (var j = 0; j < kept.length; j++) bands[kept[j].band].push(kept[j]);

    var sections = [];
    for (var b = 0; b < bands.length; b++) {
      if (!bands[b].length) continue;
      /* Inside a band, honour the author's `group` labels in first-seen
         order. A band with a single unnamed group renders no heading. */
      var order = [],
        byName = {};
      for (var k = 0; k < bands[b].length; k++) {
        var name = bands[b][k].action.group || "";
        if (!byName[name]) {
          byName[name] = [];
          order.push(name);
        }
        byName[name].push(bands[b][k]);
      }
      for (var o = 0; o < order.length; o++) {
        sections.push({
          tier: TIER_ORDER[b],
          label: order[o] || null,
          items: byName[order[o]],
        });
      }
    }

    return {
      subject: describeSubject(subject),
      sections: sections,
      withheld: withheld,
      /* The count of rows a pointer could actually land on. Zero is a
         real state and has its own copy. */
      count: kept.length,
      bulk: bulk,
    };
  }
  M.resolveMenu = resolveMenu;

  /**
   * The sentence for the withheld count.
   *
   * `null` when nothing was withheld — an empty live region announces
   * nothing, so there must be no empty row either.
   */
  function describeHiddenActions(n, policy) {
    if (!n) return null;
    var noun = n === 1 ? "action" : "actions";
    var by = policy && policy.role ? " for " + policy.role : " by your role";
    var s = n + " further " + noun + " on this record, hidden" + by;
    if (policy && policy.breakGlass) s += " — break-glass required";
    return s;
  }
  M.describeHiddenActions = describeHiddenActions;

  /* =================================================================
     Running an action
     ================================================================= */

  /**
   * What should happen when this row is chosen.
   *
   * `state` carries what the menu already knows: which action is midway
   * through its second step, and which disclosure reason has been picked.
   * Everything else is derived, so a test can assert the whole ladder
   * without a DOM.
   */
  function actionOutcome(action, state) {
    state = state || {};
    var av = availabilityOf(action);
    if (av.status === "pending") {
      return { kind: "blocked", reason: "Still checking whether this can run" };
    }
    if (av.status === "unavailable") {
      return { kind: "blocked", reason: av.reason || "Not available" };
    }
    var tier = tierOf(action);

    if (tier === "clinical") {
      if (state.confirming !== action.id) {
        return {
          kind: "confirm",
          prompt: action.confirm || "This changes the patient's care.",
          /* The label of the button, spelled out. "OK" on a discontinue
             is not a sentence anyone read. */
          verb: action.confirmVerb || action.label,
        };
      }
      return { kind: "run" };
    }

    if (tier === "disclosive") {
      if (state.reasoning !== action.id) {
        return { kind: "reason", reasons: action.reasons || [], prompt: action.confirm || null };
      }
      if (!state.reason) {
        return {
          kind: "reason",
          reasons: action.reasons || [],
          prompt: action.confirm || null,
          waiting: true,
        };
      }
      return { kind: "run", reason: state.reason };
    }

    if (tier === "documented") {
      return { kind: "run", records: action.records || null };
    }

    return { kind: "run" };
  }
  M.actionOutcome = actionOutcome;

  /* =================================================================
     The disclosure record
     ================================================================= */

  /**
   * The audit entry for a disclosive action.
   *
   * Produced on **every** path, including the one where the reader read
   * the reason list and backed out — because in a privacy review the
   * abandoned ones are the interesting ones, exactly as they are for an
   * empty patient search. The component makes the record; the host keeps
   * it, because the host is the only thing that knows the actor and the
   * session.
   */
  function disclosureRecord(action, subject, opts) {
    opts = opts || {};
    if (tierOf(action) !== "disclosive") return null;
    return {
      at: opts.now,
      action: action.id,
      subject: { resource: subject.resource, id: subject.id },
      /* Never the label. An audit line that carries a patient's name into
         a log with a wider readership than the chart has made the
         disclosure a second time. */
      subjectNamed: false,
      masked: !!subject.masked,
      reason: opts.reason || null,
      outcome: opts.outcome || "offered",
      breakGlass: !!opts.breakGlass,
    };
  }
  M.disclosureRecord = disclosureRecord;

  /* =================================================================
     Bulk
     ================================================================= */

  /**
   * Which verbs survive a multiple selection, and which do not.
   *
   * Kept separate from `resolveMenu` so a host can render the same
   * partition in a toolbar, and so the count in "3 of 12 cannot run" is
   * computed once rather than in two places that will disagree.
   */
  function bulkPartition(actions, subject) {
    var allowed = [],
      single = [];
    for (var i = 0; i < actions.length; i++) {
      if (!appliesTo(actions[i], subject)) continue;
      (actions[i].bulk === "allowed" ? allowed : single).push(actions[i]);
    }
    return { allowed: allowed, single: single };
  }
  M.bulkPartition = bulkPartition;

  /* =================================================================
     Author validation — the rules an eslint plugin enforces at build.
     ================================================================= */

  /**
   * Problems in an action list, as sentences.
   *
   * This is the half of the design that is not visual: a clinical action
   * with no confirmation sentence, a disclosure with no reason list, a
   * recorded action that never says what it writes. All three render
   * perfectly and say something false, which is the failure this library
   * exists to make unwritable.
   */
  function validateActions(actions) {
    var out = [];
    var seen = {};
    for (var i = 0; i < actions.length; i++) {
      var a = actions[i],
        t = tierOf(a);
      if (seen[a.id]) out.push('Duplicate action id "' + a.id + '".');
      seen[a.id] = true;

      var need = TIER_RULE[t].requires;
      if (need && !a[need]) {
        out.push("`" + a.id + '` is tier="' + t + '" and has no `' + need + "`. " + REQ_WHY[need]);
      }
      if (need === "reasons" && a.reasons && !a.reasons.length) {
        out.push(
          "`" +
            a.id +
            "` offers an empty reason list, which is a disclosure with no recorded justification.",
        );
      }
      if (t !== "routine" && (!a.applies || !a.applies.length)) {
        out.push(
          "`" +
            a.id +
            '` is tier="' +
            t +
            '" with no `applies`, so it will be offered on every resource in the chart.',
        );
      }
      if (t === "clinical" && a.bulk === "allowed" && !a.bulkConfirm) {
        out.push(
          "`" +
            a.id +
            "` is bulk-safe and clinical but has no `bulkConfirm`, so twelve patients would be confirmed with a sentence written for one.",
        );
      }
      if (a.kind === "checkbox" || a.kind === "radio") {
        if (t !== "routine")
          out.push(
            "`" +
              a.id +
              "` is a " +
              a.kind +
              ' above tier="routine". A toggle is view state; it may not be a clinical act.',
          );
      }
    }
    return out;
  }
  M.validateActions = validateActions;

  var REQ_WHY = {
    records: "A recorded action must say what it writes and who will read it.",
    confirm: "A clinical action must carry the sentence shown before it runs.",
    reasons: "A disclosure must offer the reasons a reader may record.",
  };

  /* =================================================================
     Keyboard — the model, so the binding is a binding.
     ================================================================= */

  /**
   * Where the highlight goes.
   *
   * `-1` is the subject header: not focusable, not selectable, and the
   * position the pointer lands on when the menu opens. `next` skips
   * pending rows, because a row whose availability is unknown must not be
   * activatable by a fast Enter.
   */
  function nextIndex(rows, from, delta, loop) {
    if (!rows.length) return -1;
    var i = from;
    for (var n = 0; n < rows.length; n++) {
      i += delta;
      if (i < 0) {
        if (!loop) return from;
        i = rows.length - 1;
      }
      if (i >= rows.length) {
        if (!loop) return from;
        i = 0;
      }
      var av = availabilityOf(rows[i].action);
      if (av.status === "pending") continue;
      return i;
    }
    return from;
  }
  M.nextIndex = nextIndex;

  /**
   * A flat list of the rows a keyboard can reach, in visual order.
   * Disabled rows stay in it: a keyboard user is entitled to read the
   * reason a verb cannot run, and skipping the row hides it from them
   * while leaving it on screen for everyone else.
   */
  function focusableRows(resolved) {
    var rows = [];
    for (var s = 0; s < resolved.sections.length; s++) {
      for (var i = 0; i < resolved.sections[s].items.length; i++) {
        rows.push(resolved.sections[s].items[i]);
      }
    }
    return rows;
  }
  M.focusableRows = focusableRows;

  /* A fixed instant, injected once. See rule 1 at the top of this file. */
  M.NOW = "2026-08-31T09:24:00-04:00";
})(typeof window !== "undefined" ? window : globalThis);
