/* =====================================================================
   In-situ mockups.

   The same component, in the two screens it will actually live in: an
   inpatient chart and a behavioral-health day list. Judging a context
   menu on a white card is judging the wrong thing — the question is
   whether it survives a patient banner, a tab strip, a scrolling pane
   and forty rows of somebody else's data.
   ===================================================================== */
(function (Ox) {
  "use strict";
  var M = Ox.menu,
    U = Ox.ui,
    D = Ox.data,
    h = U.h,
    ico = U.ico;

  var POLICY = { role: "a registered nurse", breakGlass: true };

  function rail(active) {
    var r = h("div", "app-rail");
    ["users", "heart", "flask", "pill", "note", "cal"].forEach(function (n, i) {
      var d = h("div", "ri" + (i === active ? " on" : ""));
      d.appendChild(ico(n, "i-18"));
      r.appendChild(d);
    });
    return r;
  }

  function banner(cfg) {
    var b = h("div", "banner");
    var av = h("div", "pav", cfg.initials);
    b.appendChild(av);
    var mid = h("div");
    mid.appendChild(h("div", "pn", cfg.name));
    var m = h("div", "pm");
    cfg.meta.forEach(function (t, i) {
      if (i) m.appendChild(h("span", null, "·"));
      m.appendChild(h("span", null, t));
    });
    mid.appendChild(m);
    b.appendChild(mid);
    var f = h("div", "flags");
    cfg.flags.forEach(function (t) {
      var g = h("span", "a-tag " + t[1]);
      g.appendChild(document.createTextNode(t[0]));
      f.appendChild(g);
    });
    b.appendChild(f);
    return b;
  }

  function tabs(items, on) {
    var t = h("div", "tabstrip");
    items.forEach(function (x, i) {
      t.appendChild(h("div", "tb" + (i === on ? " on" : ""), x));
    });
    return t;
  }

  function paneHead(title, count) {
    var p = h("div", "pane-h");
    p.appendChild(h("span", null, title));
    if (count) p.appendChild(h("span", "n", count));
    return p;
  }

  /* ---------------------------------------------------------------- */
  /* Mockup 1 — an inpatient chart                                     */
  /* ---------------------------------------------------------------- */
  U.mount("mock-chart", function (root) {
    var out = U.out();
    out.say(
      "",
      "Right-click any row in either pane. Every menu below is a different resource type.",
    );
    var audit = U.audit();

    var host = U.Surface({
      policy: POLICY,
      onRun: function (a, o) {
        out.say(
          a.tier === "clinical" || a.tier === "disclosive" ? "warn" : "ok",
          a.label + ' — onRun("' + a.id + '")' + (o && o.reason ? " · reason: " + o.reason : ""),
        );
      },
      onOut: function (o) {
        if (o.kind === "blocked") out.say("err", "Blocked — " + o.reason);
        else if (o.kind === "step") out.say("warn", o.text);
        else out.say("ok", o.text);
      },
      onAudit: function (r) {
        audit.write(r);
      },
    });

    var app = h("div", "app");
    app.appendChild(rail(3));
    var main = h("div", "app-main");
    main.appendChild(
      banner({
        initials: "AO",
        name: "Aluel Okonkwo",
        meta: ["MRN 44-2871", "34y", "F", "Bed 4W-12", "Admitted 27 Aug"],
        flags: [
          ["Penicillin — anaphylaxis", "red"],
          ["Part 2 record", "purple"],
          ["Falls risk", "gold"],
        ],
      }),
    );
    main.appendChild(
      tabs(["Summary", "Orders", "Results", "Medications", "Notes", "Flowsheet"], 3),
    );

    var panes = h("div", "panes");

    /* left pane — medications */
    var left = h("div");
    left.appendChild(paneHead("Active medications", "6 active · 2 held"));
    var meds = h("ul", "rows");
    [
      ["Lisinopril 10 mg", "Oral · daily · started 4 Mar 2026", "14:00", "mr-4471"],
      ["Sertraline 50 mg", "Oral · daily · started 12 Jan 2026", "08:00", "mr-4488"],
      ["Clozapine 200 mg", "Oral · nightly · ANC monitoring due", "22:00", "mr-4501"],
      ["Enoxaparin 40 mg", "Subcut · daily · VTE prophylaxis", "20:00", "mr-4510"],
    ].forEach(function (m) {
      meds.appendChild(
        U.row(
          {
            subject: { resource: "MedicationRequest", id: m[3], label: m[0], detail: m[1] },
            actions: D.medActions(),
            glyph: "med",
            icon: "pill",
            right: m[2],
            policy: POLICY,
          },
          host,
        ),
      );
    });
    left.appendChild(meds);

    left.appendChild(paneHead("Results", "today"));
    var res = h("ul", "rows");
    res.appendChild(
      U.row(
        {
          subject: D.obsSubject,
          actions: D.obsActions(),
          glyph: "obs",
          icon: "flask",
          right: "09:12",
          policy: POLICY,
        },
        host,
      ),
    );
    res.appendChild(
      U.row(
        {
          subject: {
            resource: "Observation",
            id: "obs-8813",
            label: "Creatinine 1.4 mg/dL",
            detail: "High · final · 09:12 today",
          },
          actions: D.obsActions(),
          glyph: "obs",
          icon: "flask",
          right: "09:12",
          policy: POLICY,
        },
        host,
      ),
    );
    res.appendChild(
      U.row(
        {
          subject: D.algSubject,
          actions: D.algActions(),
          glyph: "alg",
          icon: "alert",
          right: "2019",
          policy: POLICY,
        },
        host,
      ),
    );
    left.appendChild(res);
    panes.appendChild(left);

    /* right pane — notes, one of them restricted */
    var right = h("div");
    right.appendChild(paneHead("Notes", "4 this admission"));
    var notes = h("ul", "rows");
    notes.appendChild(
      U.row(
        {
          subject: D.docSubject,
          actions: D.docActions(),
          glyph: "doc",
          icon: "doc",
          right: "28 Aug",
          policy: POLICY,
        },
        host,
      ),
    );
    notes.appendChild(
      U.row(
        {
          subject: {
            resource: "DocumentReference",
            id: "doc-9911",
            label: "Group therapy note",
            detail: "Signed by R. Adeyemi, LPC",
            masked: true,
          },
          actions: D.docActions(),
          glyph: "doc",
          icon: "lock",
          right: "Restricted",
          policy: POLICY,
        },
        host,
      ),
    );
    notes.appendChild(
      U.row(
        {
          subject: {
            resource: "DocumentReference",
            id: "doc-9915",
            label: "Nursing admission note",
            detail: "Signed by J. Oyelaran, RN",
          },
          actions: D.docActions(),
          glyph: "doc",
          icon: "doc",
          right: "27 Aug",
          policy: POLICY,
        },
        host,
      ),
    );
    right.appendChild(notes);

    right.appendChild(paneHead("Care team", "on shift"));
    var team = h("ul", "rows");
    [
      ["J. Oyelaran, RN", "Primary nurse · until 19:00"],
      ["Dr K. Mbeki", "Attending · paged 09:14"],
    ].forEach(function (p, i) {
      team.appendChild(
        U.row(
          {
            subject: {
              resource: "Patient",
              id: "prac-" + i,
              label: p[0],
              detail: p[1],
              plural: "people",
            },
            actions: D.patActions().slice(0, 5),
            glyph: "pat",
            icon: "user",
            policy: POLICY,
          },
          host,
        ),
      );
    });
    right.appendChild(team);
    panes.appendChild(right);

    main.appendChild(panes);
    app.appendChild(main);

    var scroller = h("div", "appwrap");
    scroller.appendChild(app);
    host.insertBefore(scroller, host.firstChild);
    root.appendChild(host);
    root.appendChild(
      U.hint([
        "Six resource types, one action array, one component. The restricted note is the second row on the right — its menu will not name it.",
      ]),
    );
    root.appendChild(out);
    root.appendChild(audit);
  });

  /* ---------------------------------------------------------------- */
  /* Mockup 2 — a behavioral-health day list, with a selection         */
  /* ---------------------------------------------------------------- */
  U.mount("mock-worklist", function (root) {
    var out = U.out();
    out.say("", "Right-click a single row, then right-click the selected block of three.");

    var host = U.Surface({
      policy: POLICY,
      onRun: function (a, o) {
        out.say(
          a.tier === "clinical" || a.tier === "disclosive" ? "warn" : "ok",
          a.label + ' — onRun("' + a.id + '")',
        );
      },
      onOut: function (o) {
        if (o.kind === "blocked") out.say("err", "Blocked — " + o.reason);
        else if (o.kind === "step") out.say("warn", o.text);
        else out.say("ok", o.text);
      },
    });

    var app = h("div", "app");
    app.appendChild(rail(0));
    var main = h("div", "app-main");

    var b = h("div", "banner");
    var av = h("div", "pav");
    av.appendChild(ico("cal", "i-18"));
    b.appendChild(av);
    var mid = h("div");
    mid.appendChild(h("div", "pn", "Monday 31 August — intensive outpatient"));
    var m = h("div", "pm");
    ["9 scheduled", "3 selected", "R. Adeyemi, LPC"].forEach(function (t, i) {
      if (i) m.appendChild(h("span", null, "·"));
      m.appendChild(h("span", null, t));
    });
    mid.appendChild(m);
    b.appendChild(mid);
    var f = h("div", "flags");
    f.appendChild(h("span", "a-tag blue", "Group 10:30"));
    f.appendChild(h("span", "a-tag plain", "2 no-shows last week"));
    b.appendChild(f);
    main.appendChild(b);
    main.appendChild(tabs(["My day", "Group roster", "Follow-ups", "Unsigned notes"], 0));

    var pane = h("div");
    pane.style.padding = "14px 16px";
    pane.appendChild(paneHead("Scheduled", "9"));
    var ul = h("ul", "rows");

    var selected = [
      {
        resource: "Patient",
        id: "pt-3319",
        label: "Aluel Okonkwo",
        detail: "MRN 44-2871 · 34y · IOP session 3 of 12",
        plural: "patients",
      },
      {
        resource: "Patient",
        id: "pt-3320",
        label: "Chidi Nwosu",
        detail: "MRN 44-9013 · 41y · IOP session 7 of 12",
        plural: "patients",
      },
      {
        resource: "Patient",
        id: "pt-3321",
        label: "Ama Boateng",
        detail: "MRN 44-7755 · 29y · IOP session 1 of 12",
        plural: "patients",
      },
    ];
    var bulkSubject = Object.assign({}, selected[0], {
      also: [
        { resource: "Patient", id: "pt-3320" },
        { resource: "Patient", id: "pt-3321" },
      ],
      plural: "patients",
      bulkDetail: "IOP group · 10:30",
    });

    selected.forEach(function (s, i) {
      ul.appendChild(
        U.row(
          {
            subject: bulkSubject,
            actions: D.patActions({ bulkNoShow: true }),
            glyph: "pat",
            icon: "user",
            right: ["10:30", "10:30", "10:30"][i],
            selected: true,
            policy: POLICY,
          },
          host,
        ),
      );
      /* the row shows its own name; the menu counts the selection */
      var last = ul.lastChild.querySelector(".nm");
      last.textContent = s.label;
      ul.lastChild.querySelector(".dt").textContent = s.detail;
    });

    [
      ["Femi Adeyemi", "MRN 44-2210 · 52y · Individual", "11:15"],
      ["Nadia Haddad", "MRN 44-6690 · 27y · Individual · interpreter booked", "11:45"],
      ["Restricted record", "Minor · confidential encounter", "13:00"],
      ["Tomas Ruiz", "MRN 44-3388 · 38y · Medication review", "13:30"],
    ].forEach(function (p) {
      var masked = p[0] === "Restricted record";
      ul.appendChild(
        U.row(
          {
            subject: {
              resource: "Patient",
              id: "pt-" + p[2].replace(":", ""),
              label: p[0],
              detail: p[1],
              masked: masked,
              plural: "patients",
            },
            actions: D.patActions(),
            glyph: "pat",
            icon: masked ? "lock" : "user",
            right: p[2],
            policy: POLICY,
          },
          host,
        ),
      );
    });

    pane.appendChild(ul);
    main.appendChild(pane);
    app.appendChild(main);

    var scroller = h("div", "appwrap");
    scroller.appendChild(app);
    host.insertBefore(scroller, host.firstChild);
    root.appendChild(host);
    root.appendChild(
      U.hint([
        "The three highlighted rows are one selection. Right-clicking any of them opens the bulk menu — the header counts, it does not list.",
      ]),
    );
    root.appendChild(out);
  });
})(window.Ox);
