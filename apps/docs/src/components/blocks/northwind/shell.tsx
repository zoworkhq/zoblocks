"use client";

/**
 * Northwind Health, as one application.
 *
 * Every block used to be a single screen with a rail that did nothing — eight
 * destinations drawn, one built. The rail now navigates, and every screen it
 * names exists. Routing is state rather than URL: a block is embedded in a
 * page that already has an address, and rewriting that address from inside a
 * frame would break the page it sits on.
 */

import * as React from "react";
import { NOW, RISKS } from "./data";
import { Ic, ZbMark } from "../kit";

export type Screen =
  | "dashboard"
  | "caseload"
  | "schedule"
  | "messages"
  | "reports"
  | "patients"
  | "instruments"
  | "safety"
  | "record"
  | "note"
  | "copilot";

export interface Route {
  screen: Screen;
  /** Patient id for record, note and copilot; a preselected patient elsewhere. */
  patient?: string;
  /**
   * Screen-specific sub-state: a record tab, a caseload filter, a message
   * thread, a safety item, an appointment, an instrument, a report view.
   */
  view?: string;
}

/** State more than one screen reads. Everything else stays in its screen. */
export interface Store {
  /** Risk item id → what closed it, e.g. "Contacted · 10:14". */
  resolved: Record<string, string>;
  /** Message thread ids that have been opened. */
  read: Record<string, true>;
  /** Note ids that have been signed. */
  signed: Record<string, true>;
  /** Patient id → instrument sent for completion this session. */
  sent: Record<string, string>;
}

/** Threads unread when the demo opens. Messages owns them; the rail counts them. */
export const UNREAD_THREADS = ["th-almeida", "th-pharmacy", "th-osei"] as const;

interface Nav {
  route: Route;
  go: (route: Route) => void;
  /** Return to the previous route, or to `fallback` when there is none. */
  back: (fallback: Route) => void;
  canGoBack: boolean;
  toast: (message: string) => void;
  store: Store;
  patch: (update: (store: Store) => Store) => void;
}

const NavContext = React.createContext<Nav | null>(null);

export function useNav(): Nav {
  const nav = React.useContext(NavContext);
  if (!nav) throw new Error("useNav outside NorthwindApp");
  return nav;
}

/** Minutes past the demo's "now", for stamps like "Contacted · 10:14". */
export function stamp(offset = 0): string {
  const [h, m] = NOW.time.split(":").map(Number) as [number, number];
  const total = h * 60 + m + offset;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const NAV = [
  { label: "Dashboard", screen: "dashboard" },
  { label: "Caseload", screen: "caseload" },
  { label: "Schedule", screen: "schedule" },
  { label: "Messages", screen: "messages" },
  { label: "Reports", screen: "reports" },
] as const;

const CLINICAL = [
  { label: "Patients", screen: "patients" },
  { label: "Instruments", screen: "instruments" },
  { label: "Safety", screen: "safety" },
] as const;

/** Which rail entry a route belongs to. A record is a patient, wherever it was opened from. */
function section(screen: Screen): Screen {
  if (screen === "record" || screen === "note" || screen === "copilot") return "patients";
  return screen;
}

function useBadges(store: Store) {
  const unread = UNREAD_THREADS.filter((id) => !store.read[id]).length;
  const open = RISKS.filter((r) => !store.resolved[r.id]).length;
  return { messages: unread, safety: open } as Partial<Record<Screen, number>>;
}

function Rail({
  current,
  go,
  badges,
}: {
  current: Screen;
  go: (r: Route) => void;
  badges: Partial<Record<Screen, number>>;
}) {
  const item = (entry: { label: string; screen: Screen }) => {
    const active = section(current) === entry.screen;
    const count = badges[entry.screen];
    return (
      <button
        key={entry.screen}
        type="button"
        className="railItem"
        {...(active ? { "aria-current": "page" as const } : {})}
        onClick={() => go({ screen: entry.screen })}
      >
        <Ic name={entry.label} />
        <span className="railLabel">{entry.label}</span>
        {count ? (
          <span className={`railBadge${entry.screen === "safety" ? " crit" : ""}`}>
            {count}
            <span className="sr-only">{entry.screen === "safety" ? " open" : " unread"}</span>
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <nav className="rail" aria-label="Application">
      <button type="button" className="railBrand" onClick={() => go({ screen: "dashboard" })}>
        <ZbMark />
        Northwind Health
      </button>
      {NAV.map(item)}
      <p className="railGroup">Clinical</p>
      {CLINICAL.map(item)}
      <div className="railMe">
        <span className="tAv" aria-hidden="true">
          EL
        </span>
        <span className="railMeText">
          <b>E. Lake, LCSW</b>
          <span>
            {NOW.day} · {NOW.time}
          </span>
        </span>
      </div>
    </nav>
  );
}

/** The rail, for frames too narrow to give it a column. */
function AppBar({
  current,
  go,
  badges,
}: {
  current: Screen;
  go: (r: Route) => void;
  badges: Partial<Record<Screen, number>>;
}) {
  const strip = React.useRef<HTMLDivElement>(null);

  // Keep the current entry in view when the strip scrolls.
  React.useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>("[aria-current]");
    if (!el || !strip.current) return;
    const box = strip.current;
    const left = el.offsetLeft - 14;
    if (
      left < box.scrollLeft ||
      el.offsetLeft + el.offsetWidth > box.scrollLeft + box.clientWidth
    ) {
      box.scrollTo({ left, behavior: "smooth" });
    }
  }, [current]);

  return (
    <div className="appBar">
      <div className="appBarTop">
        <button type="button" className="railBrand" onClick={() => go({ screen: "dashboard" })}>
          <ZbMark />
          Northwind Health
        </button>
        <span className="appBarMe">
          {NOW.day} · {NOW.time}
        </span>
      </div>
      <nav className="appBarNav" aria-label="Application" ref={strip}>
        {[...NAV, ...CLINICAL].map((entry) => {
          const active = section(current) === entry.screen;
          const count = badges[entry.screen];
          return (
            <button
              key={entry.screen}
              type="button"
              {...(active ? { "aria-current": "page" as const } : {})}
              onClick={() => go({ screen: entry.screen })}
            >
              {entry.label}
              {count ? (
                <span className={`railBadge${entry.screen === "safety" ? " crit" : ""}`}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function NorthwindApp({
  initial,
  screens,
}: {
  initial: Route;
  screens: Record<Screen, () => React.JSX.Element>;
}) {
  const [stack, setStack] = React.useState<Route[]>([initial]);
  const [store, setStore] = React.useState<Store>({ resolved: {}, read: {}, signed: {}, sent: {} });
  const [toasts, setToasts] = React.useState<{ id: number; message: string }[]>([]);
  const root = React.useRef<HTMLDivElement>(null);
  const main = React.useRef<HTMLDivElement>(null);
  const seq = React.useRef(0);

  const route = stack[stack.length - 1] ?? initial;

  /** After a navigation, bring the top of the app into view if it has scrolled away. */
  const reveal = React.useCallback(() => {
    requestAnimationFrame(() => {
      const el = root.current;
      if (!el) return;
      if (el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
      main.current?.focus({ preventScroll: true });
    });
  }, []);

  const go = React.useCallback(
    (next: Route) => {
      setStack((s) => {
        const top = s[s.length - 1];
        if (
          top &&
          top.screen === next.screen &&
          top.patient === next.patient &&
          top.view === next.view
        )
          return s;
        // Rail destinations start a fresh trail; anything deeper stacks.
        const fromRail = !next.patient && !next.view;
        return fromRail ? [next] : [...s.slice(-12), next];
      });
      reveal();
    },
    [reveal],
  );

  const back = React.useCallback(
    (fallback: Route) => {
      setStack((s) => (s.length > 1 ? s.slice(0, -1) : [fallback]));
      reveal();
    },
    [reveal],
  );

  const toast = React.useCallback((message: string) => {
    seq.current += 1;
    const id = seq.current;
    setToasts((t) => [...t.slice(-2), { id, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const patch = React.useCallback((update: (s: Store) => Store) => setStore(update), []);

  const nav = React.useMemo<Nav>(
    () => ({ route, go, back, canGoBack: stack.length > 1, toast, store, patch }),
    [route, go, back, stack.length, toast, store, patch],
  );

  const badges = useBadges(store);
  const Body = screens[route.screen];
  const key = `${route.screen}:${route.patient ?? ""}`;

  return (
    <NavContext.Provider value={nav}>
      <div className="app nw" ref={root} data-screen={route.screen}>
        <Rail current={route.screen} go={go} badges={badges} />
        <AppBar current={route.screen} go={go} badges={badges} />
        {/* Keyed by screen and patient, so a new destination starts at its own
            defaults rather than inheriting the last one's filters. */}
        <div className="appBody" ref={main} tabIndex={-1} key={key}>
          <Body />
        </div>
        <div className="toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div className="toast" key={t.id}>
              <span className="toastDot" aria-hidden="true" />
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </NavContext.Provider>
  );
}
