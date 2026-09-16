"use client";

/**
 * Caseload — every active patient, ordered by who needs attention first.
 *
 * The dashboard shows six rows of this and a count; this is the other 62.
 * Filters narrow, they never reorder: the default sort stays attention, so a
 * clinician who filters to one program still reads the worst-off first.
 */

import * as React from "react";
import { ArrowDown, ArrowUp, Check, Download, MoreHorizontal, Send, X } from "lucide-react";
import {
  CLINICIANS,
  INSTRUMENT_MAX,
  ME,
  NOW,
  PATIENTS,
  TRACK,
  byAttention,
  faceOf,
  latest,
  reading,
  trend,
  type ClinicianId,
  type Patient,
  type Program,
  type Track,
} from "../data";
import {
  EmptyState,
  Pager,
  PatientLink,
  Select,
  SearchField,
  ScreenBody,
  ScreenHead,
  Sheet,
  Spark,
  Chips,
} from "../ui";
import { stamp, useNav } from "../shell";
import { Face, SevRail, Status } from "../../kit";

/* ------------------------------------------------------------- helpers */

const NOW_KEY = (() => {
  const [h, m] = NOW.time.split(":").map(Number) as [number, number];
  return 13 * 1440 + h * 60 + m;
})();

/** "Thu 13 Aug 14:00" as minutes into August, for ordering. */
function nextKey(p: Patient): number {
  const [, day, , time] = p.next.split(" ");
  const [h, m] = (time ?? "").split(":").map(Number);
  if (!day || h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m))
    return Infinity;
  return Number(day) * 1440 + h * 60 + m;
}

/**
 * A contact is upcoming only if it is booked and still ahead of the clock.
 * "—" means nothing is booked; a slot earlier today has already passed.
 */
export function hasUpcoming(p: Patient): boolean {
  const k = nextKey(p);
  return Number.isFinite(k) && k >= NOW_KEY;
}

export function nextLabel(p: Patient): string {
  return hasUpcoming(p) ? p.next : "None booked";
}

export function nextOrder(p: Patient): number {
  return hasUpcoming(p) ? nextKey(p) : Infinity;
}

/** Monday 10 Aug to today. */
const THIS_WEEK = new Set(["10 Aug", "11 Aug", "12 Aug", "13 Aug"]);
const seenThisWeek = (p: Patient) => THIS_WEEK.has(p.lastSeen);

const fraction = (p: Patient) => {
  const v = latest(p);
  return v === null ? -1 : v / INSTRUMENT_MAX[p.instrument];
};

type TrackFilter = "all" | Track;
type Quick = "new" | "seen" | "nonext";
type ClinFilter = "all" | "mine" | ClinicianId;
type ProgFilter = "all" | Program;
type SortKey = "attention" | "name" | "measure" | "next";

const QUICK: Record<Quick, { label: string; test: (p: Patient) => boolean }> = {
  new: { label: "New this month", test: (p) => p.isNew },
  seen: { label: "Seen this week", test: seenThisWeek },
  nonext: { label: "No next contact", test: (p) => !hasUpcoming(p) },
};

const TRACK_ORDER: readonly Track[] = [
  "not-on-track",
  "slow",
  "responding",
  "remission",
  "baseline",
];
const TRACK_CHIP: Record<Track, string> = {
  "not-on-track": "Not on track",
  slow: "Slow response",
  responding: "Responding",
  remission: "Remission",
  baseline: "Awaiting baseline",
};

const CLIN_OPTIONS: readonly { value: ClinFilter; label: string }[] = [
  { value: "all", label: "All clinicians" },
  { value: "mine", label: `My patients (${CLINICIANS[ME].short})` },
  ...(Object.keys(CLINICIANS) as ClinicianId[])
    .filter((id) => id !== ME)
    .map((id) => ({ value: id as ClinFilter, label: CLINICIANS[id].short })),
];

const PROG_OPTIONS: readonly { value: ProgFilter; label: string }[] = [
  { value: "all", label: "All programs" },
  ...(["Adult depression", "Anxiety", "Perinatal", "Young adult"] as const).map((v) => ({
    value: v,
    label: v,
  })),
];

const SORTS: Record<Exclude<SortKey, "attention">, (a: Patient, b: Patient) => number> = {
  name: (a, b) => a.full.localeCompare(b.full),
  measure: (a, b) => fraction(a) - fraction(b),
  next: (a, b) => nextOrder(a) - nextOrder(b),
};

const SORT_WORDS: Record<SortKey, string> = {
  attention: "ordered by attention needed",
  name: "sorted by name",
  measure: "sorted by latest measure",
  next: "sorted by next contact",
};

const PAGE = 12;

function isView(v: string | undefined): v is Track | "new" {
  return v === "new" || (v !== undefined && v in TRACK);
}

/* ----------------------------------------------------------- row menu */

function RowMenu({ p }: { p: Patient }) {
  const { go, store, patch, toast } = useNav();
  const [open, setOpen] = React.useState(false);
  const btn = React.useRef<HTMLButtonElement>(null);
  const menu = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();
  const sent = Boolean(store.sent[p.id]);

  const close = React.useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) btn.current?.focus();
  }, []);

  // A popover sits in the top layer, so the table's horizontal scroller
  // cannot clip a menu opened from its last row.
  React.useEffect(() => {
    const m = menu.current;
    if (!m) return;
    const isOpen = () => {
      try {
        return m.matches(":popover-open");
      } catch {
        return false;
      }
    };
    if (!open) {
      if (isOpen()) m.hidePopover();
      return;
    }
    if (!isOpen()) m.showPopover();
    const b = btn.current;
    if (b) {
      const r = b.getBoundingClientRect();
      const w = m.offsetWidth;
      const h = m.offsetHeight;
      let top = r.bottom + 4;
      if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
      const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
      m.style.top = `${top}px`;
      m.style.left = `${left}px`;
    }
    m.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!m.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    const onMove = (e: Event) => {
      if (e.target instanceof Node && m.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const i = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % items.length;
    else if (e.key === "ArrowUp") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
      return;
    } else if (e.key === "Tab") {
      close(false);
      return;
    }
    if (next < 0) return;
    e.preventDefault();
    items[next]?.focus();
  };

  const act = (fn: () => void) => () => {
    close(false);
    fn();
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="iconBtn cl-more"
        aria-label={`Actions for ${p.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal aria-hidden="true" size={15} strokeWidth={1.7} />
      </button>
      <div
        ref={menu}
        id={menuId}
        popover="manual"
        role="menu"
        aria-label={`Actions for ${p.name}`}
        className="cl-menu"
        onKeyDown={onKey}
      >
        {open ? (
          <>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={act(() => go({ screen: "record", patient: p.id }))}
            >
              Open record
            </button>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={sent || undefined}
              onClick={
                sent
                  ? undefined
                  : act(() => {
                      patch((s) => ({ ...s, sent: { ...s.sent, [p.id]: p.instrument } }));
                      toast(`${p.instrument} sent to ${p.name}`);
                    })
              }
            >
              {sent ? (
                <>
                  <Check aria-hidden="true" size={13} strokeWidth={2} />
                  {p.instrument} sent {stamp()}
                </>
              ) : (
                `Send ${p.instrument}`
              )}
            </button>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={act(() => go({ screen: "messages", patient: p.id }))}
            >
              Message patient
            </button>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={act(() => go({ screen: "schedule", patient: p.id }))}
            >
              Book session
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}

/* --------------------------------------------------------- page check */

function PageCheck({
  state,
  onChange,
}: {
  state: "none" | "some" | "all";
  onChange: (on: boolean) => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="cl-check"
      aria-label="Select all on this page"
      checked={state === "all"}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

/* ------------------------------------------------------------- screen */

export function CaseloadScreen() {
  const { route, store, patch, toast } = useNav();
  const titleId = React.useId();
  const panel = React.useRef<HTMLElement>(null);
  const initial = isView(route.view) ? route.view : undefined;

  const [track, setTrackRaw] = React.useState<TrackFilter>(
    initial && initial !== "new" ? initial : "all",
  );
  const [quick, setQuickRaw] = React.useState<Quick | null>(initial === "new" ? "new" : null);
  const [clin, setClinRaw] = React.useState<ClinFilter>("all");
  const [prog, setProgRaw] = React.useState<ProgFilter>("all");
  const [q, setQRaw] = React.useState("");
  const [sort, setSort] = React.useState<{ key: SortKey; desc: boolean }>({
    key: "attention",
    desc: false,
  });
  const [page, setPage] = React.useState(0);
  const [picked, setPicked] = React.useState<ReadonlySet<string>>(new Set());
  const [sheet, setSheet] = React.useState<string[] | null>(null);
  const [sheetPicked, setSheetPicked] = React.useState<ReadonlySet<string>>(new Set());

  // Any filter change starts again at the first page.
  const reset =
    <T,>(set: React.Dispatch<React.SetStateAction<T>>) =>
    (v: T) => {
      set(v);
      setPage(0);
    };
  const setTrack = reset(setTrackRaw);
  const setQuick = reset(setQuickRaw);
  const setClin = reset(setClinRaw);
  const setProg = reset(setProgRaw);
  const setQ = reset(setQRaw);

  // The pager sits below twelve rows; the next page should start at its top.
  const turn = (n: number) => {
    setPage(n);
    const el = panel.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
  };

  const clearFilters = () => {
    setTrackRaw("all");
    setQuickRaw(null);
    setClinRaw("all");
    setProgRaw("all");
    setQRaw("");
    setPage(0);
  };

  /** Everything except the track filter, so the track counts can read it. */
  const base = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PATIENTS.filter((p) => {
      if (clin === "mine" && p.clinician !== ME) return false;
      if (clin !== "all" && clin !== "mine" && p.clinician !== clin) return false;
      if (prog !== "all" && p.program !== prog) return false;
      if (quick && !QUICK[quick].test(p)) return false;
      if (
        needle &&
        !p.full.toLowerCase().includes(needle) &&
        !p.name.toLowerCase().includes(needle) &&
        !p.mrn.includes(needle)
      )
        return false;
      return true;
    });
  }, [q, clin, prog, quick]);

  const trackCounts = React.useMemo(() => {
    const c = new Map<Track, number>();
    for (const p of base) c.set(p.track, (c.get(p.track) ?? 0) + 1);
    return c;
  }, [base]);

  const rows = React.useMemo(() => {
    const list = track === "all" ? [...base] : base.filter((p) => p.track === track);
    if (sort.key === "attention") list.sort(byAttention);
    else {
      const cmp = SORTS[sort.key];
      list.sort((a, b) => (sort.desc ? -cmp(a, b) : cmp(a, b)) || byAttention(a, b));
    }
    if (sort.key === "attention" && sort.desc) list.reverse();
    return list;
  }, [base, track, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const at = Math.min(page, pages - 1);
  const shown = rows.slice(at * PAGE, (at + 1) * PAGE);

  const selected = rows.filter((p) => picked.has(p.id));
  const pageSel = shown.filter((p) => picked.has(p.id)).length;
  const pageState = pageSel === 0 ? "none" : pageSel === shown.length ? "all" : "some";

  const toggle = (id: string, on: boolean) =>
    setPicked((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  const togglePage = (on: boolean) =>
    setPicked((s) => {
      const n = new Set(s);
      for (const p of shown) {
        if (on) n.add(p.id);
        else n.delete(p.id);
      }
      return n;
    });

  const openSend = () => {
    const ids = selected.length
      ? selected.map((p) => p.id)
      : PATIENTS.filter((p) => p.track === "not-on-track").map((p) => p.id);
    setSheet(ids);
    setSheetPicked(new Set(ids.filter((id) => !store.sent[id])));
  };

  const confirmSend = () => {
    const targets = PATIENTS.filter((p) => sheetPicked.has(p.id));
    patch((s) => {
      const sent = { ...s.sent };
      for (const p of targets) sent[p.id] = p.instrument;
      return { ...s, sent };
    });
    toast(`Measures sent to ${targets.length} ${targets.length === 1 ? "patient" : "patients"}`);
    setPicked(new Set());
    setSheet(null);
  };

  const sortBy = (key: SortKey) =>
    setSort((s) => {
      if (s.key === key) return { key, desc: !s.desc };
      return { key, desc: key === "measure" };
    });

  const th = (k: SortKey, children: React.ReactNode, num?: boolean) => {
    const active = sort.key === k;
    const Arrow = sort.desc ? ArrowDown : ArrowUp;
    return (
      <th
        key={k}
        className={num ? "num" : undefined}
        aria-sort={active ? (sort.desc ? "descending" : "ascending") : undefined}
      >
        <button type="button" className="sort" onClick={() => sortBy(k)}>
          {children}
          {active ? <Arrow aria-hidden="true" size={11} strokeWidth={2} /> : null}
        </button>
      </th>
    );
  };

  const stats = React.useMemo(
    () => ({
      off: PATIENTS.filter((p) => p.track === "not-on-track").length,
      baseline: PATIENTS.filter((p) => p.track === "baseline").length,
      seen: PATIENTS.filter(seenThisWeek).length,
      nonext: PATIENTS.filter((p) => !hasUpcoming(p)).length,
    }),
    [],
  );

  const filtered =
    track !== "all" || quick !== null || clin !== "all" || prog !== "all" || q.trim() !== "";
  const sheetRows = sheet ? PATIENTS.filter((p) => sheet.includes(p.id)).sort(byAttention) : [];

  return (
    <>
      <ScreenHead
        title="Caseload"
        sub={`${PATIENTS.length} active · ${SORT_WORDS[sort.key]}`}
        actions={
          <>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => toast(`Caseload exported · ${rows.length} rows`)}
            >
              <Download aria-hidden="true" size={14} strokeWidth={1.7} />
              Export
            </button>
            <button type="button" className="btn primary sm" onClick={openSend}>
              <Send aria-hidden="true" size={14} strokeWidth={1.7} />
              Send measures
            </button>
          </>
        }
      />
      <ScreenBody>
        <div className="cl-stats" role="group" aria-label="Caseload summary">
          <StatBtn
            label="Not on track"
            n={stats.off}
            hint={`of ${PATIENTS.length} active`}
            sev="crit"
            pressed={track === "not-on-track"}
            onClick={() => setTrack(track === "not-on-track" ? "all" : "not-on-track")}
          />
          <StatBtn
            label="Awaiting baseline"
            n={stats.baseline}
            hint="no score on file"
            sev="unk"
            pressed={track === "baseline"}
            onClick={() => setTrack(track === "baseline" ? "all" : "baseline")}
          />
          <StatBtn
            label="Seen this week"
            n={stats.seen}
            hint="since Mon 10 Aug"
            sev="norm"
            pressed={quick === "seen"}
            onClick={() => setQuick(quick === "seen" ? null : "seen")}
          />
          <StatBtn
            label="No next contact"
            n={stats.nonext}
            hint="nothing booked ahead"
            sev="high"
            pressed={quick === "nonext"}
            onClick={() => setQuick(quick === "nonext" ? null : "nonext")}
          />
        </div>

        <section className="panel cl-panel" aria-labelledby={titleId} ref={panel}>
          <div className="panelTop cl-top">
            <div>
              <h3 id={titleId}>Active caseload</h3>
              <p>
                Showing {rows.length} of {PATIENTS.length}
              </p>
            </div>
            <div className="cl-search">
              <SearchField
                value={q}
                onChange={setQ}
                label="Search by name or MRN"
                placeholder="Name or MRN"
              />
            </div>
          </div>

          <div className="toolbar cl-filters">
            <Chips
              label="Treatment response"
              value={track}
              onChange={setTrack}
              options={[
                { value: "all", label: "All", count: base.length },
                ...TRACK_ORDER.map((t) => ({
                  value: t as TrackFilter,
                  label: TRACK_CHIP[t],
                  count: trackCounts.get(t) ?? 0,
                })),
              ]}
            />
            <div className="cl-selects">
              <Select label="Clinician" value={clin} onChange={setClin} options={CLIN_OPTIONS} />
              <Select label="Program" value={prog} onChange={setProg} options={PROG_OPTIONS} />
              {quick ? (
                <button
                  type="button"
                  className="chip cl-quick"
                  onClick={() => setQuick(null)}
                  aria-label={`Remove filter: ${QUICK[quick].label}`}
                >
                  {QUICK[quick].label}
                  <X aria-hidden="true" size={12} strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="cl-selbar" aria-live="polite">
            {selected.length ? (
              <>
                <b>{selected.length} selected</b>
                <span aria-hidden="true">·</span>
                <button type="button" className="linkBtn" onClick={openSend}>
                  Send measures
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  className="linkBtn cl-clear"
                  onClick={() => setPicked(new Set())}
                >
                  Clear
                </button>
              </>
            ) : null}
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="No patients match"
              action={
                <button type="button" className="btn ghost sm" onClick={clearFilters}>
                  Clear filters
                </button>
              }
            >
              {quick === "nonext" && !q && clin === "all" && prog === "all" && track === "all"
                ? "Everyone has a contact booked."
                : "Try a different response group, clinician or search."}
            </EmptyState>
          ) : (
            <>
              <div className="dtScroll">
                <table className="dt cl-table">
                  <thead>
                    <tr>
                      <th className="cl-cbx">
                        <PageCheck state={pageState} onChange={togglePage} />
                      </th>
                      {th("name", "Patient")}
                      <th>Program</th>
                      {th("measure", "Measure")}
                      <th>Trend</th>
                      {th("next", "Next contact")}
                      {th("attention", "Status")}
                      <th className="cl-act">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((p) => {
                      const t = TRACK[p.track];
                      const on = picked.has(p.id);
                      return (
                        <tr key={p.id} className={on ? "cl-on" : undefined}>
                          <td className="cl-cbx">
                            <input
                              type="checkbox"
                              className="cl-check"
                              checked={on}
                              aria-label={`Select ${p.name}`}
                              onChange={(e) => toggle(p.id, e.target.checked)}
                            />
                          </td>
                          <td>
                            <span className="cl-who">
                              <SevRail sev={t.sev} height={26} />
                              <PatientLink
                                p={p}
                                size={24}
                                sub={<span className="mono">{p.mrn}</span>}
                              />
                            </span>
                          </td>
                          <td>
                            <span className="cl-two">
                              <span>{p.program}</span>
                              <span className="cl-sub">{CLINICIANS[p.clinician].short}</span>
                            </span>
                          </td>
                          <td>
                            <span className="cl-two">
                              <span className="mono">{reading(p)}</span>
                              <span className="cl-sub">
                                {p.sessions} {p.sessions === 1 ? "session" : "sessions"}
                              </span>
                            </span>
                          </td>
                          <td>
                            {p.scores.length < 2 ? (
                              <span className="cl-noTrend">—</span>
                            ) : (
                              <span className="cl-trend">
                                <span className="mono">{trend(p)}</span>
                                <Spark
                                  points={p.scores}
                                  max={INSTRUMENT_MAX[p.instrument]}
                                  sev={t.sev}
                                  width={56}
                                  height={18}
                                />
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="cl-two">
                              <span className={hasUpcoming(p) ? "mono" : "cl-none"}>
                                {nextLabel(p)}
                              </span>
                              <span className="cl-sub">
                                {p.lastSeen === "—" ? "not yet seen" : `seen ${p.lastSeen}`}
                              </span>
                            </span>
                          </td>
                          <td>
                            <span className="cl-status">
                              <Status sev={t.sev}>{t.label}</Status>
                              {store.sent[p.id] ? (
                                <span className="cl-sent">{store.sent[p.id]} sent</span>
                              ) : null}
                            </span>
                          </td>
                          <td className="cl-act">
                            <RowMenu p={p} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pages > 1 ? (
                <Pager page={at} pages={pages} onPage={turn} total={rows.length} size={PAGE} />
              ) : null}
            </>
          )}
          {filtered ? null : (
            <p className="miniLegend">
              Attention order: not on track, then slow response, then by distance from remission.
            </p>
          )}
        </section>
      </ScreenBody>

      <Sheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title="Send measures"
        sub={`${sheetRows.length} ${selected.length ? "selected" : "not on track"} · sent by text`}
        footer={
          <>
            <button type="button" className="btn ghost sm" onClick={() => setSheet(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn primary sm"
              disabled={sheetPicked.size === 0}
              onClick={confirmSend}
            >
              {sheetRows.every((p) => store.sent[p.id])
                ? "All sent"
                : `Send ${sheetPicked.size} ${sheetPicked.size === 1 ? "measure" : "measures"}`}
            </button>
          </>
        }
      >
        <section className="sheetSection">
          <h4>Recipients</h4>
          <ul className="cl-sendList">
            {sheetRows.map((p) => {
              const done = Boolean(store.sent[p.id]);
              return (
                <li key={p.id}>
                  <label className="check cl-sendRow">
                    <input
                      type="checkbox"
                      checked={done || sheetPicked.has(p.id)}
                      disabled={done}
                      onChange={(e) =>
                        setSheetPicked((s) => {
                          const n = new Set(s);
                          if (e.target.checked) n.add(p.id);
                          else n.delete(p.id);
                          return n;
                        })
                      }
                    />
                    <Face name={p.name} src={faceOf(p.name)} size={24} />
                    <span className="cl-sendName">
                      <b>{p.name}</b>
                      <span>{hasUpcoming(p) ? `Next ${p.next}` : "No contact booked"}</span>
                    </span>
                    <span className="cl-sendInst mono">
                      {done ? `Sent ${stamp()}` : p.instrument}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="cl-sheetNote">
            Each patient gets their own instrument, to complete before their next session.
          </p>
        </section>
      </Sheet>
    </>
  );
}

function StatBtn({
  label,
  n,
  hint,
  sev,
  pressed,
  onClick,
}: {
  label: string;
  n: number;
  hint: string;
  sev: "crit" | "high" | "norm" | "unk";
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="cl-stat" aria-pressed={pressed} onClick={onClick}>
      <span className="cl-statCap">
        <span className="cl-statDot" style={{ background: `var(--${sev})` }} aria-hidden="true" />
        {label}
      </span>
      <span className="cl-statN mono">{n}</span>
      <span className="cl-statHint">{hint}</span>
    </button>
  );
}
