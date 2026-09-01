/* =====================================================================
   Presentation layer for the prototype.

   Kept separate from the engine on purpose: §17 proposes exactly this
   split — an L0 core with no React and no DOM, and a binding that only
   renders and reports intent. Nothing below decides whether an action may
   run; it asks `Ox.menu` and draws the answer.
   ===================================================================== */
(function (Ox) {
  "use strict";
  var M = Ox.menu;
  var U = {};
  Ox.ui = U;

  /* ---- tiny DOM helpers -------------------------------------------- */
  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  U.h = h;

  var IC = {
    pill: '<path d="m10.5 20.5-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z"/><path d="m7 10 7 7"/>',
    flask:
      '<path d="M9 3v6.5L3.6 18A2 2 0 0 0 5.3 21h13.4a2 2 0 0 0 1.7-3L15 9.5V3"/><path d="M7.5 3h9M6.2 15h11.6"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    alert: '<path d="M12 3.4 1.9 20.6h20.2z"/><path d="M12 9.6v5M12 17.9v.01"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.2a7.5 7.5 0 0 1 15 0"/>',
    users:
      '<circle cx="9" cy="8" r="3.4"/><path d="M2.6 20a6.4 6.4 0 0 1 12.8 0"/><path d="M16.5 5.2a3.4 3.4 0 0 1 0 5.6M18 20a6.4 6.4 0 0 0-2-4.6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    open: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    pen: '<path d="M17 3.5a2.1 2.1 0 0 1 3 3L7.5 19 3 20.5 4.5 16Z"/>',
    print:
      '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="7" rx="2"/><path d="M6 14h12v7H6z"/>',
    share:
      '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3"/>',
    trash: '<path d="M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14"/>',
    eye: '<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    key: '<circle cx="7.5" cy="15.5" r="4"/><path d="m10.4 12.6 8-8M16.5 6.5l2 2M14 9l2 2"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    chev: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    x: '<path d="M6 6 18 18M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bell: '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
    phone:
      '<path d="M6.6 3h3l1.5 4-2.2 1.4a12 12 0 0 0 5.7 5.7L16 11.9l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/>',
    cal: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    shield: '<path d="M12 3 4.5 6v6c0 4.6 3.1 7.9 7.5 9 4.4-1.1 7.5-4.4 7.5-9V6Z"/>',
    dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    undo: '<path d="M3 8h11a5.5 5.5 0 0 1 0 11H8"/><path d="m6.5 4.5-3.5 3.5 3.5 3.5"/>',
    flag: '<path d="M5 21V4M5 4h11l-1.5 3.5L16 11H5"/>',
    heart:
      '<path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z"/>',
    note: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    stop: '<circle cx="12" cy="12" r="9"/><path d="M9 9h6v6H9z"/>',
    sort: '<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
    hourglass: '<path d="M7 3h10M7 21h10M8 3v3.5a4 4 0 0 0 8 0V3M8 21v-3.5a4 4 0 0 1 8 0V21"/>',
  };
  U.IC = IC;

  function ico(name, cls) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("class", "i " + (cls || ""));
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = IC[name] || IC.info;
    return s;
  }
  U.ico = ico;

  var RESOURCE_ICON = {
    Patient: "user",
    MedicationRequest: "pill",
    Observation: "flask",
    DocumentReference: "doc",
    AllergyIntolerance: "alert",
    Encounter: "cal",
    Condition: "heart",
    Task: "flag",
    CarePlan: "note",
  };
  U.RESOURCE_ICON = RESOURCE_ICON;

  function initials(name) {
    var p = String(name)
      .replace(/[^A-Za-z ]/g, " ")
      .trim()
      .split(/\s+/);
    if (!p[0]) return "··";
    return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }

  /* Figure mounting. Each figure is a function of a root element; the
     builder emits an empty <div data-fig="id"> and this fills it. */
  var FIGS = {};
  U.mount = function (id, fn) {
    FIGS[id] = fn;
  };
  U.boot = function () {
    var nodes = document.querySelectorAll("[data-fig]");
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].getAttribute("data-fig");
      if (FIGS[id]) {
        try {
          FIGS[id](nodes[i]);
        } catch (e) {
          nodes[i].appendChild(h("div", "cm-out err", "Figure " + id + " failed: " + e.message));
        }
      }
    }
  };

  /* =================================================================
     The menu renderer.
     ================================================================= */

  /**
   * Draws one resolved menu and owns the two-step ladders inside it.
   * It never decides anything: `M.actionOutcome` does, and this reads
   * the answer.
   */
  var SEQ = 0;

  function renderMenu(opts) {
    var resolved = opts.resolved;
    var state = { confirming: null, reasoning: null, reason: null, hot: -1 };
    var el = h(
      "div",
      "cm" +
        (opts.presentation === "sheet" ? " sheet" : "") +
        (opts.presentation === "anchored" ? " anchored" : "") +
        (opts.compact ? " compact" : ""),
    );
    el.setAttribute("role", "menu");
    el.setAttribute("tabindex", "-1");
    /*
     * The popup's accessible name is the subject header — so a screen
     * reader announces "Aluel Okonkwo, MRN 44-2871, menu, 8 items" before
     * any item. One element does the wrong-patient check for both
     * audiences. See §13.
     */
    var headId = "cm-subj-" + SEQ++;
    el.setAttribute("aria-labelledby", headId);
    var rows = [];

    function draw() {
      el.textContent = "";
      rows = [];

      if (opts.presentation === "sheet") el.appendChild(h("div", "grip"));

      /* -------- Region 1: the subject. Always. ---------------------- */
      var s = resolved.subject;
      var head = h("div", "cm-subject" + (s.masked ? " masked" : "") + (s.bulk > 1 ? " bulk" : ""));
      head.setAttribute("role", "presentation");
      head.id = headId;
      var av = h("div", "av");
      /* Initials are a person's affordance. On a medication they spell
         nonsense ("LM" for "Lisinopril 10 mg"), so every other resource
         gets its own glyph — which is also the one the row was using. */
      if (s.bulk > 1)
        av.appendChild(
          ico(opts.subject && opts.subject.resource === "Patient" ? "users" : "doc", "i-14"),
        );
      else if (s.masked) av.appendChild(ico("lock", "i-14"));
      else if (opts.subject && opts.subject.resource === "Patient")
        av.textContent = initials(s.who);
      else
        av.appendChild(ico(RESOURCE_ICON[opts.subject && opts.subject.resource] || "doc", "i-14"));
      head.appendChild(av);
      var col = h("div");
      col.appendChild(h("div", "who", s.who));
      if (s.what) col.appendChild(h("div", "what", s.what));
      head.appendChild(col);
      el.appendChild(head);

      /* -------- Regions 2..n: the bands ---------------------------- */
      var flat = 0;
      for (var i = 0; i < resolved.sections.length; i++) {
        var sec = resolved.sections[i];
        if (i > 0) el.appendChild(h("div", "cm-sep"));
        if (sec.label) el.appendChild(h("div", "cm-group", sec.label));
        for (var j = 0; j < sec.items.length; j++) {
          drawRow(sec.items[j], flat++);
        }
      }

      if (!resolved.sections.length) {
        var none = h("div", "cm-withheld");
        none.appendChild(ico("info", "i-14"));
        none.appendChild(
          h(
            "div",
            null,
            resolved.withheld
              ? "No action on this record is available to you."
              : "This record supports no actions.",
          ),
        );
        el.appendChild(none);
      }

      /* -------- The withheld count. A row, never a footnote. -------- */
      var w = M.describeHiddenActions(resolved.withheld, opts.policy);
      if (w) {
        var wr = h("div", "cm-withheld");
        wr.appendChild(ico("lock", "i-14"));
        wr.appendChild(h("div", null, w));
        el.appendChild(wr);
      }
    }

    function drawRow(row, idx) {
      var a = row.action,
        avl = row.availability;
      var pending = avl.status === "pending";
      var blocked = avl.status === "unavailable";
      var r = h(
        "div",
        "cm-item t-" +
          row.tier +
          (pending ? " pending" : "") +
          (state.hot === idx ? " hot" : "") +
          (a.checked ? " on" : ""),
      );
      r.setAttribute(
        "role",
        a.kind === "checkbox"
          ? "menuitemcheckbox"
          : a.kind === "radio"
            ? "menuitemradio"
            : "menuitem",
      );
      r.setAttribute("tabindex", state.hot === idx ? "0" : "-1");
      if (blocked || pending) r.setAttribute("aria-disabled", "true");
      if (a.kind === "checkbox" || a.kind === "radio")
        r.setAttribute("aria-checked", a.checked ? "true" : "false");
      if (a.submenu) r.setAttribute("aria-haspopup", "menu");

      if (a.kind === "checkbox") {
        var bx = h("div", "box");
        bx.appendChild(ico("check", "i-14"));
        r.appendChild(bx);
      } else if (a.kind === "radio") r.appendChild(h("div", "rd"));
      else r.appendChild(ico(pending ? "hourglass" : a.icon || "info", "i-14 ic"));

      if (pending) {
        r.appendChild(h("div", "bar"));
      } else {
        r.appendChild(h("div", "lb", a.label));
      }

      if (a.submenu) r.appendChild(ico("chev", "i-14 chev"));
      else if (a.shortcut) r.appendChild(h("div", "sc", a.shortcut));
      else r.appendChild(h("div", "sc", ""));

      /* The second line: what a recorded action writes, or why a blocked
         one cannot run. Both are shown; neither is a tooltip, because a
         tooltip is not available to the person using a keyboard. */
      var sub = null;
      if (pending) sub = "Checking…";
      else if (blocked) sub = avl.reason;
      else if (row.tier === "documented" && a.records) sub = a.records;
      if (sub) r.appendChild(h("div", "sub", sub));

      r.addEventListener("mouseenter", function () {
        state.hot = idx;
        paintHot();
      });
      r.addEventListener("click", function (ev) {
        ev.stopPropagation();
        choose(row, idx);
      });
      el.appendChild(r);
      rows.push({ el: r, row: row, idx: idx });

      /* The confirm / reason strip renders *below the row it belongs to*
         and pushes nothing above it — so the pointer is still over the
         verb it chose when the second step appears. */
      if (state.confirming === a.id) el.appendChild(confirmStrip(a));
      if (state.reasoning === a.id) el.appendChild(reasonStrip(a));
    }

    function confirmStrip(a) {
      var out = M.actionOutcome(a, {});
      var box = h("div", "cm-confirm" + (a.tier === "disclosive" ? " bad" : ""));
      var p = h("div");
      p.appendChild(h("b", null, out.prompt));
      box.appendChild(p);
      if (resolved.bulk > 1 && a.bulkConfirm)
        box.appendChild(h("div", null, a.bulkConfirm.replace("{n}", resolved.bulk)));
      var acts = h("div", "acts");
      var go = h("button", "a-btn sm primary", out.verb);
      go.type = "button";
      go.addEventListener("click", function (ev) {
        ev.stopPropagation();
        run(a, M.actionOutcome(a, { confirming: a.id }));
      });
      var no = h("button", "a-btn sm", "Keep");
      no.type = "button";
      no.addEventListener("click", function (ev) {
        ev.stopPropagation();
        state.confirming = null;
        draw();
      });
      acts.appendChild(go);
      acts.appendChild(no);
      box.appendChild(acts);
      return box;
    }

    function reasonStrip(a) {
      var box = h("div", "cm-reasons");
      var hd = h("div", "hd");
      hd.appendChild(
        document.createTextNode("This reveals data you are not currently entitled to. "),
      );
      hd.appendChild(h("b", null, "Record a reason."));
      box.appendChild(hd);
      (a.reasons || []).forEach(function (reason) {
        var b = h("button", "cm-reason" + (state.reason === reason ? " on" : ""));
        b.type = "button";
        b.appendChild(h("div", "rd"));
        b.appendChild(h("div", null, reason));
        b.addEventListener("click", function (ev) {
          ev.stopPropagation();
          state.reason = reason;
          run(a, M.actionOutcome(a, { reasoning: a.id, reason: reason }));
        });
        box.appendChild(b);
      });
      var f = h("div", "foot", "Recorded either way — including if you close this menu now.");
      box.appendChild(f);
      return box;
    }

    function choose(row, idx) {
      var a = row.action;
      var out = M.actionOutcome(a, state);
      if (out.kind === "blocked") {
        opts.onOut && opts.onOut(out, a);
        return;
      }
      if (out.kind === "confirm") {
        state.confirming = a.id;
        state.reasoning = null;
        state.hot = idx;
        draw();
        opts.onOut && opts.onOut({ kind: "step", text: "Step 2 of 2 — " + out.prompt }, a);
        return;
      }
      if (out.kind === "reason") {
        state.reasoning = a.id;
        state.confirming = null;
        state.reason = null;
        state.hot = idx;
        draw();
        /* The record is made when the list is *offered*, not when it is
           answered. See `disclosureRecord`. */
        opts.onAudit &&
          opts.onAudit(
            M.disclosureRecord(a, opts.subject, {
              now: M.NOW,
              outcome: "offered",
              breakGlass: !!(opts.policy && opts.policy.breakGlass),
            }),
          );
        return;
      }
      run(a, out);
    }

    function run(a, out) {
      if (a.kind === "checkbox") {
        a.checked = !a.checked;
        draw();
        opts.onOut &&
          opts.onOut({ kind: "toggle", text: a.label + (a.checked ? " — on" : " — off") }, a);
        return;
      }
      if (a.kind === "radio") {
        rows.forEach(function (r) {
          if (r.row.action.radioGroup === a.radioGroup) r.row.action.checked = false;
        });
        a.checked = true;
        draw();
        opts.onOut && opts.onOut({ kind: "toggle", text: a.label }, a);
        return;
      }
      if (out.reason) {
        opts.onAudit &&
          opts.onAudit(
            M.disclosureRecord(a, opts.subject, {
              now: M.NOW,
              outcome: "disclosed",
              reason: out.reason,
              breakGlass: !!(opts.policy && opts.policy.breakGlass),
            }),
          );
      }
      opts.onRun && opts.onRun(a, out);
      opts.close && opts.close();
    }

    function paintHot() {
      rows.forEach(function (r) {
        r.el.classList.toggle("hot", r.idx === state.hot);
        r.el.setAttribute("tabindex", r.idx === state.hot ? "0" : "-1");
      });
    }

    /* Keyboard. The model lives in the core; this is the binding. */
    el.addEventListener("keydown", function (e) {
      var flat = rows.map(function (r) {
        return r.row;
      });
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        state.hot = M.nextIndex(flat, state.hot, e.key === "ArrowDown" ? 1 : -1, true);
        paintHot();
        if (rows[state.hot]) rows[state.hot].el.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        state.hot = M.nextIndex(flat, -1, 1, false);
        paintHot();
        rows[state.hot] && rows[state.hot].el.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        state.hot = M.nextIndex(flat, flat.length, -1, false);
        paintHot();
        rows[state.hot] && rows[state.hot].el.focus();
      } else if (e.key === "Enter" || e.key === " ") {
        if (rows[state.hot]) {
          e.preventDefault();
          choose(rows[state.hot].row, state.hot);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        /* Escape out of a disclosure that was offered and abandoned is
           still a disclosure event, and it is recorded. */
        if (state.reasoning) {
          var a = findAction(state.reasoning);
          opts.onAudit &&
            opts.onAudit(M.disclosureRecord(a, opts.subject, { now: M.NOW, outcome: "abandoned" }));
        }
        opts.close && opts.close();
      }
    });

    function findAction(id) {
      for (var i = 0; i < rows.length; i++)
        if (rows[i].row.action.id === id) return rows[i].row.action;
      return null;
    }

    draw();
    return {
      el: el,
      focusFirst: function () {
        var flat = rows.map(function (r) {
          return r.row;
        });
        state.hot = M.nextIndex(flat, -1, 1, false);
        paintHot();
        rows[state.hot] ? rows[state.hot].el.focus() : el.focus();
      },
      redraw: draw,
      state: state,
    };
  }
  U.renderMenu = renderMenu;

  /* =================================================================
     A trigger surface: rows you can right-click, long-press, or reach
     with Shift+F10 / the Menu key.
     ================================================================= */

  U.Surface = function (cfg) {
    var wrap = h("div", "cmwrap");
    var live = h("div", "sr");
    live.setAttribute("aria-live", "polite");
    live.style.cssText =
      "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
    var open = null;

    function close() {
      if (open) {
        open.node.remove();
        open.trigger && open.trigger.classList.remove("armed");
        open = null;
      }
    }
    U.closeAll = close;

    function openAt(subject, actions, policy, x, y, trigger, presentation) {
      close();
      var resolved = M.resolveMenu(subject, actions, policy);
      var m = renderMenu({
        resolved: resolved,
        subject: subject,
        policy: policy,
        presentation: presentation || cfg.presentation || "popup",
        compact: cfg.compact,
        onRun: cfg.onRun,
        onOut: cfg.onOut,
        onAudit: cfg.onAudit,
        close: function () {
          close();
          trigger && trigger.focus && trigger.focus();
        },
      });
      if ((presentation || cfg.presentation) !== "sheet") {
        m.el.style.left = x + "px";
        m.el.style.top = y + "px";
      }
      wrap.appendChild(m.el);
      open = { node: m.el, trigger: trigger };
      trigger && trigger.classList.add("armed");
      /* Keyboard-opened menus take the highlight immediately; pointer
         ones do not, so the first row is not armed under a moving mouse. */
      if (presentation === "keyboard") m.focusFirst();
      else m.el.focus();
      live.textContent =
        resolved.count +
        " actions for " +
        resolved.subject.who +
        (resolved.withheld ? ", " + resolved.withheld + " hidden" : "");
      return m;
    }
    wrap.openAt = openAt;
    wrap.close = close;
    wrap.appendChild(live);

    document.addEventListener("click", function (e) {
      if (open && !open.node.contains(e.target)) close();
    });
    /*
     * Close on resize rather than reposition. A popup anchored to a
     * pointer position that no longer exists is a menu about a click that
     * did not happen — and on a device rotation it can end up over a
     * different row than the one it was opened from, which is the exact
     * failure Rule 1 exists to prevent.
     */
    window.addEventListener("resize", close);
    return wrap;
  };

  /* A chart row that carries its own subject and action set. */
  U.row = function (cfg, host) {
    var li = h("li");
    var r = h("div", "rw" + (cfg.subject.masked ? " masked" : "") + (cfg.selected ? " sel" : ""));
    r.tabIndex = 0;
    r.setAttribute("role", "button");
    r.setAttribute("aria-haspopup", "menu");
    r.setAttribute("aria-label", cfg.subject.masked ? "Restricted record" : cfg.subject.label);
    var g = h("div", "glyph " + (cfg.glyph || "doc"));
    g.appendChild(ico(cfg.icon || "doc", "i-14"));
    r.appendChild(g);
    var mid = h("div");
    mid.appendChild(h("div", "nm", cfg.subject.masked ? "Restricted record" : cfg.subject.label));
    if (cfg.subject.detail && !cfg.subject.masked)
      mid.appendChild(h("div", "dt", cfg.subject.detail));
    if (cfg.subject.masked) mid.appendChild(h("div", "dt", "42 CFR Part 2 · not disclosed"));
    r.appendChild(mid);
    var rt = h("div", "rt");
    if (cfg.right) rt.appendChild(h("span", null, cfg.right));
    var more = h("button", "more");
    more.type = "button";
    more.setAttribute("aria-haspopup", "menu");
    more.setAttribute("aria-label", "Actions");
    more.appendChild(ico("dots", "i-14"));
    more.addEventListener("click", function (e) {
      e.stopPropagation();
      var b = more.getBoundingClientRect(),
        w = host.getBoundingClientRect();
      host.openAt(
        cfg.subject,
        cfg.actions,
        cfg.policy,
        b.left - w.left - 210,
        b.bottom - w.top + 4,
        more,
        "anchored",
      );
    });
    rt.appendChild(more);
    r.appendChild(rt);

    r.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      var w = host.getBoundingClientRect();
      /*
       * CURSOR_INSET = -3, and the sign is the whole point. With the
       * popup's corner exactly on the cursor, an 8px border-radius puts
       * the pointer *outside* the menu shape — elementFromPoint returns
       * the row underneath, which makes Rule 1 false at exactly the pixel
       * that matters. Offsetting the corner three pixels behind the cursor
       * puts it inside the header's fill instead. Visually indeterminate;
       * measurably different.
       */
      host.openAt(
        cfg.subject,
        cfg.actions,
        cfg.policy,
        e.clientX - w.left - 3,
        e.clientY - w.top - 3,
        r,
      );
    });
    /* Shift+F10 and the Menu key. Chrome and Firefox fire `contextmenu`
       for both; Safari fires neither, so they are handled explicitly —
       a right-click-only feature fails WCAG 2.1.1 outright. */
    r.addEventListener("keydown", function (e) {
      if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
        e.preventDefault();
        var b = r.getBoundingClientRect(),
          w = host.getBoundingClientRect();
        host.openAt(
          cfg.subject,
          cfg.actions,
          cfg.policy,
          b.left - w.left + 24,
          b.bottom - w.top - 6,
          r,
          "keyboard",
        );
      }
    });
    li.appendChild(r);
    return li;
  };

  /* Output line + audit strip used under most figures. */
  U.out = function () {
    var n = h("div", "cm-out");
    n.say = function (kind, text) {
      n.className = "cm-out " + (kind || "");
      n.textContent = "";
      n.appendChild(
        ico(
          kind === "err" ? "ban" : kind === "warn" ? "alert" : kind === "ok" ? "check" : "info",
          "i-14",
        ),
      );
      n.appendChild(h("div", null, text));
    };
    n.say("", "Right-click a row. Or focus one and press Shift+F10.");
    return n;
  };

  U.audit = function () {
    var n = h("div", "cm-audit");
    n.hidden = true;
    n.write = function (rec) {
      if (!rec) return;
      n.hidden = false;
      n.textContent =
        "onDisclose({\n" +
        '  at: "' +
        rec.at +
        '",\n' +
        '  action: "' +
        rec.action +
        '",\n' +
        '  subject: { resource: "' +
        rec.subject.resource +
        '", id: "' +
        rec.subject.id +
        '" },\n' +
        "  subjectNamed: false,   // never the label\n" +
        "  masked: " +
        rec.masked +
        ",\n" +
        "  reason: " +
        (rec.reason ? '"' + rec.reason + '"' : "null") +
        ",\n" +
        '  outcome: "' +
        rec.outcome +
        '",\n' +
        "  breakGlass: " +
        rec.breakGlass +
        ",\n})";
    };
    return n;
  };

  U.card = function (title, sub, cls) {
    var c = h("div", "a-card " + (cls || ""));
    if (title) {
      var hd = h("div", "a-card-head");
      var l = h("div");
      l.appendChild(h("div", "a-card-title", title));
      if (sub) l.appendChild(h("div", "a-card-sub", sub));
      hd.appendChild(l);
      c.appendChild(hd);
    }
    var b = h("div", "a-card-body");
    c.appendChild(b);
    return { node: c, body: b };
  };

  U.hint = function (parts) {
    var n = h("div", "hint");
    parts.forEach(function (p) {
      if (p.charAt(0) === "@") n.appendChild(h("span", "kbd", p.slice(1)));
      else n.appendChild(document.createTextNode(p));
    });
    return n;
  };

  U.tabs = function (items, onPick) {
    var n = h("div", "figtabs");
    var btns = [];
    items.forEach(function (it, i) {
      var b = h("button", "figtab", it.label);
      b.type = "button";
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.addEventListener("click", function () {
        btns.forEach(function (x) {
          x.setAttribute("aria-pressed", "false");
        });
        b.setAttribute("aria-pressed", "true");
        onPick(it, i);
      });
      btns.push(b);
      n.appendChild(b);
    });
    return n;
  };
})(window.Ox);
