/* =====================================================================
   The figures. Every one of them runs `Ox.menu` — none of them is a
   picture of a menu.
   ===================================================================== */
(function (Ox) {
  "use strict";
  var M = Ox.menu,
    U = Ox.ui,
    D = Ox.data,
    h = U.h,
    ico = U.ico;

  /* A card with right-clickable rows, an output line and an audit strip. */
  function surface(root, cfg) {
    var c = U.card(cfg.title, cfg.sub, cfg.wide ? "wide" : "");
    var out = U.out();
    var audit = U.audit();
    var host = U.Surface({
      presentation: cfg.presentation,
      compact: cfg.compact,
      policy: cfg.policy,
      onRun: function (a, o) {
        out.say(
          a.tier === "clinical" || a.tier === "disclosive" ? "warn" : "ok",
          'onRun("' +
            a.id +
            '") — ' +
            a.label +
            (o && o.records ? " · " + o.records : "") +
            (o && o.reason ? " · reason: " + o.reason : ""),
        );
      },
      onOut: function (o, a) {
        if (o.kind === "blocked") out.say("err", "Blocked — " + o.reason);
        else if (o.kind === "step") out.say("warn", o.text);
        else out.say("ok", o.text);
      },
      onAudit: function (rec) {
        audit.write(rec);
      },
    });
    var ul = h("ul", "rows");
    cfg.rows.forEach(function (r) {
      ul.appendChild(U.row(r, host));
    });
    host.insertBefore(ul, host.firstChild);
    c.body.appendChild(host);
    if (cfg.hint) c.body.appendChild(U.hint(cfg.hint));
    c.body.appendChild(out);
    if (cfg.audit !== false) c.body.appendChild(audit);
    root.appendChild(c.node);
    return { host: host, out: out, audit: audit, body: c.body };
  }
  U.surface = surface;

  function medRow(extra) {
    return Object.assign(
      {
        subject: D.medSubject,
        actions: D.medActions(),
        glyph: "med",
        icon: "pill",
        right: "14:00",
      },
      extra || {},
    );
  }

  /* ---------------------------------------------------------------- 1 */
  /* Anatomy — a static menu, annotated. Not interactive on purpose:    */
  /* the pins are the content.                                          */
  U.mount("anatomy", function (root) {
    var actions = D.medActions();
    var policy = { role: "a registered nurse", breakGlass: true };
    var resolved = M.resolveMenu(D.medSubject, actions, policy);
    var m = U.renderMenu({ resolved: resolved, subject: D.medSubject, policy: policy });
    m.el.style.position = "static";
    m.el.style.animation = "none";
    m.el.style.margin = "0 auto";

    var box = h("div", "stage rel");
    box.style.paddingBlock = "2.2rem";
    box.appendChild(m.el);

    function pin(sel, n, where, bad) {
      var t = m.el.querySelectorAll(sel);
      var el = t[t.length - 1];
      if (!el) return;
      el.classList.add("rel");
      var p = h("span", "pin " + (where || "pin-l") + (bad ? " bad" : ""), String(n));
      el.appendChild(p);
    }
    pin(".cm-subject", 1, "pin-tl");
    pin(".cm-item.t-routine", 2, "pin-l");
    pin(".cm-item.t-documented .sub", 3, "pin-l");
    pin(".cm-item.t-clinical", 4, "pin-l");
    pin('.cm-item[aria-disabled="true"]', 5, "pin-l");
    pin(".cm-withheld", 6, "pin-bl");
    pin(".cm-sep", 7, "pin-r");
    root.appendChild(box);
  });

  /* ---------------------------------------------------------------- 2 */
  U.mount("default", function (root) {
    surface(root, {
      title: "Active medications",
      sub: "Right-click any row · role: registered nurse",
      policy: { role: "a registered nurse", breakGlass: true },
      rows: [
        medRow({ policy: { role: "a registered nurse", breakGlass: true } }),
        {
          subject: {
            resource: "MedicationRequest",
            id: "mr-4488",
            label: "Sertraline 50 mg",
            detail: "Oral · daily · started 12 Jan 2026",
          },
          actions: D.medActions(),
          glyph: "med",
          icon: "pill",
          right: "08:00",
          policy: { role: "a registered nurse", breakGlass: true },
        },
        {
          subject: {
            resource: "MedicationRequest",
            id: "mr-4501",
            label: "Clozapine 200 mg",
            detail: "Oral · nightly · ANC monitoring due",
          },
          actions: D.medActions(),
          glyph: "med",
          icon: "pill",
          right: "22:00",
          policy: { role: "a registered nurse", breakGlass: true },
        },
      ],
      hint: [
        "Try ",
        "@Right click",
        " on a row, or focus one and press ",
        "@Shift",
        " + ",
        "@F10",
        ". Then ",
        "@↓",
        " ",
        "@↑",
        " ",
        "@↵",
        " ",
        "@Esc",
        ".",
      ],
    });
  });

  /* ---------------------------------------------------------------- 3 */
  /* The four ladders, one figure, live.                                */
  U.mount("tiers", function (root) {
    surface(root, {
      title: "One record, four kinds of consequence",
      sub: "Potassium 6.8 mmol/L · critical · preliminary",
      policy: { role: "a registered nurse" },
      rows: [
        {
          subject: D.obsSubject,
          actions: D.obsActions(),
          glyph: "obs",
          icon: "flask",
          right: "09:12",
          policy: { role: "a registered nurse" },
        },
        {
          subject: D.docSubject,
          actions: D.docActions(),
          glyph: "doc",
          icon: "doc",
          right: "28 Aug",
          policy: { role: "a registered nurse" },
        },
      ],
      hint: [
        "Acknowledge takes a second step. Reveal takes a reason — and writes the record either way.",
      ],
    });
  });

  /* ---------------------------------------------------------------- 4 */
  /* Six nouns, six menus.                                              */
  U.mount("subjects", function (root) {
    var sets = [
      {
        label: "Medication",
        subject: D.medSubject,
        actions: D.medActions,
        glyph: "med",
        icon: "pill",
      },
      {
        label: "Result",
        subject: D.obsSubject,
        actions: D.obsActions,
        glyph: "obs",
        icon: "flask",
      },
      { label: "Note", subject: D.docSubject, actions: D.docActions, glyph: "doc", icon: "doc" },
      {
        label: "Patient",
        subject: D.patSubject,
        actions: function () {
          return D.patActions();
        },
        glyph: "pat",
        icon: "user",
      },
      {
        label: "Allergy",
        subject: D.algSubject,
        actions: D.algActions,
        glyph: "alg",
        icon: "alert",
      },
      {
        label: "View state",
        subject: D.viewSubject,
        actions: D.viewActions,
        glyph: "doc",
        icon: "filter",
      },
    ];
    var slot = h("div");
    function paint(set) {
      slot.textContent = "";
      surface(slot, {
        title: set.label,
        sub: set.subject.resource + " · " + set.subject.id,
        policy: { role: "a registered nurse" },
        rows: [
          {
            subject: set.subject,
            actions: set.actions(),
            glyph: set.glyph,
            icon: set.icon,
            policy: { role: "a registered nurse" },
          },
        ],
        audit: false,
      });
    }
    root.appendChild(U.tabs(sets, paint));
    root.appendChild(slot);
    paint(sets[0]);
  });

  /* ---------------------------------------------------------------- 5 */
  /* Pending — the menu that does not move.                             */
  U.mount("pending", function (root) {
    var wrapper = h("div", "grid g2");

    /* ---- the wrong way: append when the check resolves -------------- */
    var badBox = h("div");
    var badCard = U.card("Resolved late, appended", "what every menu does today", "");
    var badHost = U.Surface({
      onRun: function (a) {
        badOut.say("err", "Ran: " + a.label + " — and it was not what the pointer was aiming at.");
      },
    });
    var badOut = U.out();
    badOut.say("", "Open the menu, then wait one second without moving.");
    var badActs = D.patActions({});
    var badVisible = badActs.filter(function (a) {
      return a.id !== "noshow" && a.id !== "glass";
    });
    var badUl = h("ul", "rows");
    badUl.appendChild(
      U.row(
        {
          subject: D.patSubject,
          actions: badVisible,
          glyph: "pat",
          icon: "user",
          policy: {},
        },
        badHost,
      ),
    );
    badHost.insertBefore(badUl, badHost.firstChild);
    /* Patch: after 900ms, re-open with the full list — which is exactly
       the defect. The row under the pointer changes identity. */
    badUl.addEventListener("contextmenu", function () {
      setTimeout(function () {
        var open = badHost.querySelector(".cm");
        if (!open) return;
        var extra = D.patActions({});
        var late = [extra[extra.length - 2], extra[extra.length - 1]];
        late.forEach(function (a) {
          var r = h("div", "cm-item t-" + a.tier);
          r.setAttribute("role", "menuitem");
          r.appendChild(ico(a.icon, "i-14 ic"));
          r.appendChild(h("div", "lb", a.label));
          r.appendChild(h("div", "sc", ""));
          var sep = open.querySelector(".cm-withheld");
          sep ? open.insertBefore(r, sep) : open.appendChild(r);
        });
        badOut.say("warn", "Two actions just appeared. Everything below them moved 30px down.");
      }, 900);
    });
    badCard.body.appendChild(badHost);
    badCard.body.appendChild(badOut);
    badBox.appendChild(badCard.node);

    /* ---- the Oxygen way: hold the place ---------------------------- */
    var okBox = h("div");
    var okCard = U.card("Pending, holding its position", 'availability: { status: "pending" }', "");
    var okOut = U.out();
    okOut.say("", "Open the menu, then wait. Nothing moves.");
    var okHost = U.Surface({
      onRun: function (a) {
        okOut.say("ok", "Ran: " + a.label);
      },
      onOut: function (o) {
        if (o.kind === "blocked") okOut.say("err", "Blocked — " + o.reason);
      },
    });
    var okActs = D.patActions({ pending: true });
    var okUl = h("ul", "rows");
    okUl.appendChild(
      U.row(
        { subject: D.patSubject, actions: okActs, glyph: "pat", icon: "user", policy: {} },
        okHost,
      ),
    );
    okHost.insertBefore(okUl, okHost.firstChild);
    okUl.addEventListener("contextmenu", function () {
      setTimeout(function () {
        var open = okHost.querySelector(".cm");
        if (!open) return;
        var pend = open.querySelector(".cm-item.pending");
        if (!pend) return;
        pend.classList.remove("pending");
        pend.querySelector(".bar") && pend.querySelector(".bar").remove();
        var lb = h("div", "lb", "Send a secure message");
        pend.insertBefore(lb, pend.children[1]);
        pend.setAttribute("aria-disabled", "true");
        var sub = pend.querySelector(".sub");
        if (sub) sub.textContent = "No portal account — enrolment was declined at intake";
        okOut.say(
          "ok",
          "The check resolved in place. The row is the same height and the same row.",
        );
      }, 900);
    });
    okCard.body.appendChild(okHost);
    okCard.body.appendChild(okOut);
    okBox.appendChild(okCard.node);

    wrapper.appendChild(badBox);
    wrapper.appendChild(okBox);
    root.appendChild(wrapper);
  });

  /* ---------------------------------------------------------------- 6 */
  /* The generic menu, and the same record in Oxygen.                   */
  U.mount("versus", function (root) {
    var wrapper = h("div", "grid g2");

    var a = h("div");
    var ac = U.card("A themed context menu", "shadcn / Base UI, as shipped", "");
    var ahost = h("div", "cmwrap");
    var aul = h("ul", "rows");
    var arow = h("li");
    var rr = h("div", "rw");
    rr.tabIndex = 0;
    var g = h("div", "glyph pat");
    g.appendChild(ico("user", "i-14"));
    rr.appendChild(g);
    var mid = h("div");
    mid.appendChild(h("div", "nm", "Aluel Okonkwo"));
    mid.appendChild(h("div", "dt", "MRN 44-2871 · 34y · Intake 10:30"));
    rr.appendChild(mid);
    rr.appendChild(h("div", "rt"));
    arow.appendChild(rr);
    aul.appendChild(arow);
    /* two more rows, so the wrong-row problem is available to be made */
    [
      ["Chidi Nwosu", "MRN 44-9013 · 41y · Intake 11:00"],
      ["Ama Boateng", "MRN 44-7755 · 29y · Intake 11:30"],
    ].forEach(function (p) {
      var li = h("li");
      var r2 = h("div", "rw");
      r2.tabIndex = 0;
      var g2 = h("div", "glyph pat");
      g2.appendChild(ico("user", "i-14"));
      r2.appendChild(g2);
      var m2 = h("div");
      m2.appendChild(h("div", "nm", p[0]));
      m2.appendChild(h("div", "dt", p[1]));
      r2.appendChild(m2);
      r2.appendChild(h("div", "rt"));
      li.appendChild(r2);
      aul.appendChild(li);
    });
    ahost.appendChild(aul);
    var aout = U.out();
    aout.say("", "Right-click any row.");
    aul.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      var old = ahost.querySelector(".cm");
      if (old) old.remove();
      var w = ahost.getBoundingClientRect();
      var cm = h("div", "cm");
      cm.setAttribute("role", "menu");
      [
        ["Open", "open", ""],
        ["Copy", "copy", ""],
        ["Add to my patients", "plus", ""],
        ["Document a no-show", "cal", ""],
        ["Break-glass open", "key", "destructive"],
      ].forEach(function (it) {
        var r = h("div", "cm-item" + (it[2] ? " t-disclosive" : " t-routine"));
        r.setAttribute("role", "menuitem");
        r.appendChild(ico(it[1], "i-14 ic"));
        r.appendChild(h("div", "lb", it[0]));
        r.appendChild(h("div", "sc", ""));
        r.addEventListener("click", function (ev) {
          ev.stopPropagation();
          cm.remove();
          aout.say(
            it[2] || it[0].indexOf("no-show") > -1 ? "err" : "",
            it[0] + " — ran immediately. Which patient was that?",
          );
        });
        cm.appendChild(r);
      });
      cm.style.left = e.clientX - w.left + "px";
      cm.style.top = e.clientY - w.top + "px";
      ahost.appendChild(cm);
    });
    document.addEventListener("click", function () {
      var o = ahost.querySelector(".cm");
      if (o) o.remove();
    });
    ac.body.appendChild(ahost);
    ac.body.appendChild(aout);
    a.appendChild(ac.node);

    var b = h("div");
    surface(b, {
      title: "ChartContextMenu",
      sub: "same three rows, same verbs",
      policy: { role: "a registered nurse" },
      rows: [
        {
          subject: D.patSubject,
          actions: D.patActions(),
          glyph: "pat",
          icon: "user",
          policy: { role: "a registered nurse" },
        },
        {
          subject: {
            resource: "Patient",
            id: "pt-3320",
            label: "Chidi Nwosu",
            detail: "MRN 44-9013 · 41y · Intake 11:00",
            plural: "patients",
          },
          actions: D.patActions(),
          glyph: "pat",
          icon: "user",
          policy: { role: "a registered nurse" },
        },
        {
          subject: {
            resource: "Patient",
            id: "pt-3321",
            label: "Ama Boateng",
            detail: "MRN 44-7755 · 29y · Intake 11:30",
            plural: "patients",
          },
          actions: D.patActions(),
          glyph: "pat",
          icon: "user",
          policy: { role: "a registered nurse" },
        },
      ],
      audit: false,
    });

    wrapper.appendChild(a);
    wrapper.appendChild(b);
    root.appendChild(wrapper);
  });

  /* ---------------------------------------------------------------- 7 */
  U.mount("disclose", function (root) {
    surface(root, {
      title: "A Part 2 note, and the record the menu makes",
      sub: "Right-click · choose Reveal Part 2 content · then close it without answering",
      policy: { role: "a registered nurse", breakGlass: true },
      rows: [
        {
          subject: D.docSubject,
          actions: D.docActions(),
          glyph: "doc",
          icon: "doc",
          right: "28 Aug",
          policy: { role: "a registered nurse", breakGlass: true },
        },
      ],
      hint: [
        "The record is written when the reason list is ",
        "@offered",
        " — not when it is answered.",
      ],
    });
  });

  /* ---------------------------------------------------------------- 8 */
  U.mount("masked", function (root) {
    var masked = {
      resource: "DocumentReference",
      id: "doc-9911",
      label: "Group therapy note — Nwosu, C.",
      detail: "Signed by R. Adeyemi, LPC",
      masked: true,
    };
    surface(root, {
      title: "A masked row makes a masked menu",
      sub: "The component may not resolve what the surface was hiding",
      policy: { role: "a registered nurse", breakGlass: true },
      rows: [
        {
          subject: masked,
          actions: D.docActions(),
          glyph: "doc",
          icon: "lock",
          right: "Restricted",
          policy: { role: "a registered nurse", breakGlass: true },
        },
        {
          subject: D.docSubject,
          actions: D.docActions(),
          glyph: "doc",
          icon: "doc",
          right: "28 Aug",
          policy: { role: "a registered nurse", breakGlass: true },
        },
      ],
      hint: [
        "The first row's menu says ",
        "@Restricted record",
        ". The second names its note. Same component, same props shape.",
      ],
    });
  });

  /* ---------------------------------------------------------------- 9 */
  U.mount("bulk", function (root) {
    var others = [];
    for (var i = 0; i < 11; i++) others.push({ resource: "Patient", id: "pt-" + (3400 + i) });
    var bulkSubject = Object.assign({}, D.patSubject, { also: others, plural: "patients" });
    surface(root, {
      title: "12 patients selected",
      sub: "Right-click the selection",
      policy: { role: "a registered nurse" },
      rows: [
        {
          subject: bulkSubject,
          actions: D.patActions({ bulkNoShow: true }),
          glyph: "pat",
          icon: "users",
          right: "12 selected",
          selected: true,
          policy: { role: "a registered nurse" },
        },
      ],
      hint: [
        "Verbs that are not bulk-safe stay in the list, disabled, with the reason. ",
        "@Document a no-show",
        " is bulk-safe here — and its confirmation is written for twelve, not for one.",
      ],
      audit: false,
    });
  });

  /* --------------------------------------------------------------- 10 */
  U.mount("present", function (root) {
    var slot = h("div");
    var modes = [
      {
        label: "Pointer popup",
        mode: "popup",
        note: "Opens at the cursor. The subject header is the first thing under it.",
      },
      {
        label: "Anchored to ⋯",
        mode: "anchored",
        note: "The discoverable path. A right-click-only feature is a feature most people never find.",
      },
      {
        label: "Touch sheet",
        mode: "sheet",
        note: "Long-press below 40rem. Pinned to the bottom edge, because the finger is covering wherever it pressed.",
      },
    ];
    function paint(m) {
      slot.textContent = "";
      if (m.mode === "sheet") {
        var box = h("div", "sheetbox");
        box.style.height = "420px";
        var inner = h("div");
        inner.style.cssText = "padding:14px";
        var ul = h("ul", "rows");
        var host = U.Surface({
          presentation: "sheet",
          onRun: function (a) {
            o.say("ok", "Ran: " + a.label);
          },
        });
        [
          D.patSubject,
          {
            resource: "Patient",
            id: "pt-3320",
            label: "Chidi Nwosu",
            detail: "MRN 44-9013 · 41y",
            plural: "patients",
          },
        ].forEach(function (s) {
          ul.appendChild(
            U.row(
              {
                subject: s,
                actions: D.patActions(),
                glyph: "pat",
                icon: "user",
                policy: { role: "a registered nurse" },
              },
              host,
            ),
          );
        });
        host.insertBefore(ul, host.firstChild);
        host.style.cssText = "position:absolute;inset:0;padding:14px";
        box.appendChild(host);
        var o = U.out();
        slot.appendChild(box);
        slot.appendChild(U.hint([m.note]));
        slot.appendChild(o);
        return;
      }
      surface(slot, {
        title: m.label,
        sub: m.mode === "anchored" ? "click the ⋯ button" : "right-click the row",
        presentation: m.mode,
        policy: { role: "a registered nurse" },
        rows: [
          {
            subject: D.patSubject,
            actions: D.patActions(),
            glyph: "pat",
            icon: "user",
            policy: { role: "a registered nurse" },
          },
        ],
        hint: [m.note],
        audit: false,
      });
    }
    root.appendChild(U.tabs(modes, paint));
    root.appendChild(slot);
    paint(modes[0]);
  });

  /* --------------------------------------------------------------- 11 */
  U.mount("keyboard", function (root) {
    var log = h("div", "cm-audit");
    log.hidden = false;
    log.textContent = "Focus the row below (Tab), then press Shift+F10.";
    var lines = [];
    function say(s) {
      lines.push(s);
      if (lines.length > 7) lines.shift();
      log.textContent = lines.join("\n");
    }
    var s = surface(root, {
      title: "No pointer required",
      sub: "Tab to the row · Shift+F10 or the Menu key · arrows · Enter · Escape",
      policy: { role: "a registered nurse" },
      rows: [
        {
          subject: D.medSubject,
          actions: D.medActions(),
          glyph: "med",
          icon: "pill",
          right: "14:00",
          policy: { role: "a registered nurse", breakGlass: true },
        },
      ],
      audit: false,
    });
    s.body.appendChild(log);
    s.host.addEventListener(
      "keydown",
      function (e) {
        var k = e.shiftKey && e.key === "F10" ? "Shift+F10" : e.key;
        if (
          [
            "ArrowDown",
            "ArrowUp",
            "Enter",
            "Escape",
            "Home",
            "End",
            "Shift+F10",
            "ContextMenu",
            " ",
          ].indexOf(k) > -1
        ) {
          say(
            k +
              "  →  " +
              (k === "Shift+F10" || k === "ContextMenu"
                ? "menu opens, highlight on the first verb (never on the subject)"
                : k === "Escape"
                  ? "closes; focus returns to the row"
                  : k === "Enter" || k === " "
                    ? "activates — or advances a two-step action to step 2"
                    : "moves the highlight, skipping rows still being checked"),
          );
        }
      },
      true,
    );
  });

  /* --------------------------------------------------------------- 12 */
  U.mount("viewstate", function (root) {
    surface(root, {
      title: "View state is not a clinical act",
      sub: 'Checkboxes and radios stay at tier="routine" — the validator refuses anything else',
      policy: {},
      rows: [
        {
          subject: D.viewSubject,
          actions: D.viewActions(),
          glyph: "doc",
          icon: "filter",
          right: "Flowsheet",
          policy: {},
        },
      ],
      hint: [
        "Toggles do not close the menu. ",
        "@Export visible range",
        " does, because it writes a record.",
      ],
      audit: false,
    });
  });

  /* --------------------------------------------------------------- 13 */
  /* The state matrix — every declared state, rendered.                 */
  U.mount("states", function (root) {
    var pol = { role: "a registered nurse", breakGlass: true };
    function mk(subject, actions, policy, tweak) {
      var r = M.resolveMenu(subject, actions, policy || {});
      var m = U.renderMenu({ resolved: r, subject: subject, policy: policy || {} });
      m.el.style.position = "static";
      m.el.style.animation = "none";
      if (tweak) tweak(m);
      return m.el;
    }
    var cases = [
      [
        "Routine only",
        function () {
          return mk(D.medSubject, D.medActions().slice(0, 3), {});
        },
      ],
      [
        "A recorded action",
        function () {
          return mk(D.medSubject, D.medActions().slice(3, 5), {});
        },
      ],
      [
        "Clinical, step 1",
        function () {
          return mk(D.medSubject, [D.medActions()[6]], {});
        },
      ],
      [
        "Clinical, step 2",
        function () {
          return mk(D.medSubject, [D.medActions()[6]], {}, function (m) {
            m.state.confirming = "dc";
            m.redraw();
          });
        },
      ],
      [
        "Disclosure, reasons",
        function () {
          return mk(D.docSubject, [D.docActions()[5]], {}, function (m) {
            m.state.reasoning = "part2";
            m.redraw();
          });
        },
      ],
      [
        "Unavailable, with reason",
        function () {
          return mk(D.obsSubject, [D.obsActions()[3]], {});
        },
      ],
      [
        "Withheld, counted",
        function () {
          return mk(D.medSubject, D.medActions(), pol);
        },
      ],
      [
        "Pending",
        function () {
          return mk(D.patSubject, D.patActions({ pending: true }).slice(5, 6), {});
        },
      ],
      [
        "Masked subject",
        function () {
          return mk(
            {
              resource: "DocumentReference",
              id: "d1",
              label: "Group note — Nwosu, C.",
              masked: true,
            },
            D.docActions().slice(0, 3),
            {},
          );
        },
      ],
      [
        "Bulk selection",
        function () {
          var s = Object.assign({}, D.patSubject, {
            also: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            plural: "patients",
          });
          return mk(s, D.patActions({ bulkNoShow: true }).slice(0, 4), {});
        },
      ],
      [
        "Checkbox and radio",
        function () {
          return mk(D.viewSubject, D.viewActions().slice(0, 5), {});
        },
      ],
      [
        "Submenu",
        function () {
          return mk(D.obsSubject, D.obsActions().slice(0, 3), {});
        },
      ],
      [
        "Nothing available",
        function () {
          return mk(D.medSubject, [], { role: "a scheduling clerk" });
        },
      ],
      [
        "Everything withheld",
        function () {
          return mk(D.medSubject, D.medActions(), {
            permitted: [],
            role: "a scheduling clerk",
            breakGlass: true,
          });
        },
      ],
    ];
    var grid = h("div", "states");
    cases.forEach(function (c, i) {
      var box = h("div", "state");
      var hd = h("div", "h");
      hd.appendChild(h("span", "n", String(i + 1).padStart(2, "0")));
      hd.appendChild(h("span", null, c[0]));
      box.appendChild(hd);
      var b = h("div", "b");
      try {
        b.appendChild(c[1]());
      } catch (e) {
        b.appendChild(h("div", null, e.message));
      }
      box.appendChild(b);
      grid.appendChild(box);
    });
    root.appendChild(grid);
  });

  /* --------------------------------------------------------------- 14 */
  U.mount("validate", function (root) {
    var problems = M.validateActions(D.badActions);
    var pre = h("pre");
    var code = h("code");
    code.textContent =
      "$ pnpm lint\n\n" +
      "registry/oxygen/chart-context-menu/demo-actions.ts\n" +
      problems
        .map(function (p, i) {
          return "  " + (i + 1) + ":  oxygen/context-menu-actions  " + p;
        })
        .join("\n") +
      "\n\n✖ " +
      problems.length +
      " problems (" +
      problems.length +
      " errors, 0 warnings)";
    pre.appendChild(code);
    root.appendChild(pre);
  });

  /* --------------------------------------------------------------- 15 */
  /* Density and theme, live.                                           */
  U.mount("density", function (root) {
    var slot = h("div");
    var opts = [
      {
        label: "Comfortable",
        compact: false,
        note: "30px rows. The default, and what a bedside tablet gets.",
      },
      {
        label: "Compact",
        compact: true,
        note: "26px rows — still above the 24px floor WCAG 2.2 SC 2.5.8 sets for a pointer target.",
      },
    ];
    function paint(o) {
      slot.textContent = "";
      surface(slot, {
        title: o.label,
        sub: "right-click the row",
        compact: o.compact,
        policy: { role: "a registered nurse" },
        rows: [
          {
            subject: D.medSubject,
            actions: D.medActions(),
            glyph: "med",
            icon: "pill",
            policy: { role: "a registered nurse", breakGlass: true },
          },
        ],
        hint: [o.note],
        audit: false,
      });
    }
    root.appendChild(U.tabs(opts, paint));
    root.appendChild(slot);
    paint(opts[0]);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", U.boot);
  else U.boot();
})(window.Ox);
